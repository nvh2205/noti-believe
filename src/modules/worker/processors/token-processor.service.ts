import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { TelegramBot } from '../telegram-bot/telegram-bot';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TokenRepository } from '../repositories/token.repository';
import { AxiomApiService } from '../services/axiom-api.service';
import { TweetScoutService } from '../services';
@Injectable()
@Processor('token-queue')
export class TokenProcessorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TokenProcessorService.name);
  private readonly telegramChatId: string;

  constructor(
    private readonly telegramBot: TelegramBot,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectQueue('token-queue') private readonly tokenQueue: Queue,
    private readonly tokenRepository: TokenRepository,
    private readonly axiomApiService: AxiomApiService,
    private readonly tweetScoutService: TweetScoutService,
  ) {
    this.telegramChatId = this.configService.get<string>('telegram.chatId');
  }

  async onApplicationBootstrap() {
    // Set up handlers for the token action buttons
    this.telegramBot.setupTokenActionCallbacks(
      async (action: string, tokenAddress: string, query: any) => {
        // First, acknowledge the button press
        await this.telegramBot.answerCallbackQuery(
          query.id,
          `Processing ${action === 'refresh_token' ? 'token refresh' : 'insight analysis'}...`,
        );

        // Handle the specific action
        if (action === 'refresh_token') {
          await this.handleRefreshToken(tokenAddress, query);
        } else if (action === 'insight_analysis') {
          await this.handleInsightAnalysis(tokenAddress, query);
        }
      },
    );
  }

  /**
   * Handle the Refresh Token button action
   */
  private async handleRefreshToken(tokenAddress: string, query: any) {
    try {
      this.logger.log(
        `🔄 [TokenProcessorService] [handleRefreshToken] Refreshing token data for: ${tokenAddress}`,
      );

      // Get original message ID from the query
      const originalMessageId = query.message.message_id;

      // Send a temporary message
      // const message = await this.telegramBot.sendMessage(
      //   query.message.chat.id,
      //   `⏳ Refreshing token data for <code>${tokenAddress}</code>...`,
      //   { parse_mode: 'HTML' },
      // );

      // Queue a job to refresh the token data
      const jobResult = await this.tokenQueue.add(
        'refresh-token',
        {
          tokenAddress,
          // messageId: message.message_id, // ID of the temporary message to be deleted
          chatId: query.message.chat.id,
          originalMessageId: originalMessageId, // ID of the original message to be updated
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );

      this.logger.log(
        `✅ [TokenProcessorService] [handleRefreshToken] Token refresh job queued: ${jobResult.id}`,
      );
    } catch (error) {
      this.logger.error(
        `🔴 [TokenProcessorService] [handleRefreshToken] Failed to refresh token: ${error.message}`,
        error.stack,
      );

      // Notify the user of the error
      await this.telegramBot.sendMessage(
        query.message.chat.id,
        `❌ Error refreshing token data: ${error.message}`,
        { parse_mode: 'HTML' },
      );
    }
  }

  /**
   * Handle the Insight Analysis button action
   */
  private async handleInsightAnalysis(tokenAddress: string, query: any) {
    try {
      this.logger.log(
        `🔍 [TokenProcessorService] [handleInsightAnalysis] Generating insight analysis for: ${tokenAddress}`,
      );

      // Send a temporary message
      const message = await this.telegramBot.sendMessage(
        query.message.chat.id,
        `⏳ Generating insight analysis for <code>${tokenAddress}</code>...`,
        { parse_mode: 'HTML' },
      );

      // Queue a job to generate the insight analysis
      const jobResult = await this.tokenQueue.add(
        'insight-analysis',
        {
          tokenAddress,
          messageId: message.message_id,
          chatId: query.message.chat.id,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );

      this.logger.log(
        `✅ [TokenProcessorService] [handleInsightAnalysis] Insight analysis job queued: ${jobResult.id}`,
      );
    } catch (error) {
      this.logger.error(
        `🔴 [TokenProcessorService] [handleInsightAnalysis] Failed to generate insight analysis: ${error.message}`,
        error.stack,
      );

      // Notify the user of the error
      await this.telegramBot.sendMessage(
        query.message.chat.id,
        `❌ Error generating insight analysis: ${error.message}`,
        { parse_mode: 'HTML' },
      );
    }
  }

  @Process('refresh-token')
  async refreshToken(job: Job<any>) {
    try {
      const { tokenAddress, chatId, originalMessageId } = job.data;
      this.logger.log(
        `🔍 [TokenProcessorService] [refreshToken] Processing token refresh: ${tokenAddress}`,
      );

      // Fetch the token from the database
      const token = await this.tokenRepository.findOne({
        where: { ca_address: tokenAddress },
      });

      //send message processing
      await this.telegramBot.editMessage(
        chatId,
        originalMessageId,
        `⏳ Refreshing token data for <code>${tokenAddress}</code>...`,
        { parse_mode: 'HTML' },
      );

      if (!token) {
        throw new Error(
          `Token with address ${tokenAddress} not found in database`,
        );
      }

      // Fetch real price data from Axiom API
      this.logger.log(
        `🔍 [TokenProcessorService] [refreshToken] Fetching current price data for: ${tokenAddress}`,
      );

      try {
        // Use the token address as the pair address since pair_address is not stored in Token entity
        const pairAddress = token.pair_address;

        // Fetch the latest token price from the Axiom API
        const [tokenPrice, pairInfo, score] = await Promise.all([
          this.axiomApiService.getTokenPrice(pairAddress),
          this.axiomApiService.getPairInfo(pairAddress),
          this.tweetScoutService.getScore(token.twitter_handler),
        ]);

        if (tokenPrice && tokenPrice.priceUsd) {
          // Calculate market cap
          // Calculate market cap
          const updatedPrice = tokenPrice.priceUsd; // Already a number, no need to parse
          const updatedMarketCap =
            pairInfo && pairInfo.supply
              ? Math.floor(updatedPrice * pairInfo.supply)
              : parseFloat(token.market_cap.toString()); // Fallback to existing value

          this.logger.log(
            `✅ [TokenProcessorService] [refreshToken] Retrieved new price: ${updatedPrice}, market cap: ${updatedMarketCap}`,
          );
          const new_score = {
            name: score?.top_followers?.[0]?.name || 'Unknown',
            followers_count: score?.followersCount || 0,
            is_blue_verified: false,
            score: score?.score || '0',
            fake_percent: score?.fake_percent || '0',
            top_followers: score?.top_followers || [],
          };
          token.price = updatedPrice;
          token.market_cap = updatedMarketCap;
          token.twitter_info = new_score;
          token.updated_at = new Date();

          await this.tokenRepository.save(token);
        } else {
          // Fallback: If API request fails, increase by 5%
          this.logger.warn(
            `⚠️ [TokenProcessorService] [refreshToken] Failed to get price from API, using fallback calculation`,
          );
        }
      } catch (apiError) {
        this.logger.error(
          `🔴 [TokenProcessorService] [refreshToken] API error: ${apiError.message}`,
          apiError.stack,
        );
      }

      // Format the updated message
      const updatedMessage = this.formatTelegramMessage(token);

      // Create inline keyboard with the same buttons
      const inlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: '🔄 Refresh Token',
              callback_data: `refresh_token:${tokenAddress}`,
            },
            {
              text: '📊 Insight Analysis',
              callback_data: `insight_analysis:${tokenAddress}`,
            },
          ],
        ],
      };

      // Convert message_id to a number - if it's not valid, we'll catch the error
      try {
        const msgId = Number(token.message_id);
        if (isNaN(msgId)) {
          throw new Error('Invalid message ID format');
        }

        // Edit the original message instead of sending a new one
        await this.telegramBot.editMessage(chatId, msgId, updatedMessage, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: inlineKeyboard,
        });

        this.logger.log(
          `✅ [TokenProcessorService] [refreshToken] Successfully edited message for token: ${tokenAddress}`,
        );
      } catch (editError) {
        this.logger.error(
          `🔴 [TokenProcessorService] [refreshToken] Failed to edit message: ${editError.message}`,
          editError.stack,
        );
      }

      this.logger.log(
        `✅ [TokenProcessorService] [refreshToken] Successfully refreshed token: ${tokenAddress}`,
      );
      return { success: true, tokenAddress };
    } catch (error) {
      this.logger.error(
        `🔴 [TokenProcessorService] [refreshToken] Failed to refresh token: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('insight-analysis')
  async generateInsightAnalysis(job: Job<any>) {
    try {
      const { tokenAddress, messageId, chatId } = job.data;
      this.logger.log(
        `🔍 [TokenProcessorService] [generateInsightAnalysis] Processing insight analysis: ${tokenAddress}`,
      );

      // Simulate delay for analysis generation
      await this.delay(3000);

      // Here you would generate some real analysis
      // For now we'll create a sample analysis message
      const analysisMessage = `<b>📊 Insight Analysis for <code>${tokenAddress}</code></b>

<b>Token Health:</b> Strong 🟢
<b>Market Sentiment:</b> Bullish 📈
<b>Liquidity:</b> High 💰
<b>Trading Volume:</b> Increasing 🚀
<b>Holder Diversity:</b> Medium 👥
<b>Twitter Activity:</b> High 🐦
<b>Risk Rating:</b> Low ✅

<b>Technical Indicators:</b>
• Price movement: Upward trend
• Volatility: Moderate
• Recent volume: 250% increase

<b>Recommendation:</b> This token shows positive momentum and healthy growth indicators. As always, do your own research and invest responsibly.`;

      // Delete the temporary message
      await this.telegramBot.deleteMessage(chatId, messageId);

      // Send the analysis
      await this.telegramBot.sendMessage(chatId, analysisMessage, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      this.logger.log(
        `✅ [TokenProcessorService] [generateInsightAnalysis] Successfully generated analysis for: ${tokenAddress}`,
      );
      return { success: true, tokenAddress };
    } catch (error) {
      this.logger.error(
        `🔴 [TokenProcessorService] [generateInsightAnalysis] Failed to generate analysis: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('process-token-v2')
  async processToken(job: Job<any>) {
    try {
      const tokenData = job.data;
      this.logger.log(
        `🔍 [TokenProcessorService] [processToken] Processing token: ${tokenData.coin_name}`,
      );

      // Add delay before sending message to prevent overwhelming Telegram API
      await this.delay(2000);

      // Send message to Telegram and get message ID
      const messageId = await this.sendTelegramMessage(tokenData);

      console.log(messageId, 'messageId');

      // Check if we have a valid message ID
      if (messageId) {
        const messageIdStr = messageId.toString();

        // Get the token entity first
        const tokenToUpdate = await this.tokenRepository.findOne({
          where: { ca_address: tokenData.ca_address },
        });

        if (tokenToUpdate) {
          // Set the property and save
          tokenToUpdate.message_id = messageIdStr;
          await this.tokenRepository.save(tokenToUpdate);

          this.logger.log(
            `✅ [TokenProcessorService] [processToken] Successfully processed token: ${tokenData.coin_name} with message ID: ${messageIdStr}`,
          );
          return {
            success: true,
            tokenId: tokenData._id,
            messageId: messageIdStr,
          };
        }
      }

      this.logger.log(
        `✅ [TokenProcessorService] [processToken] Successfully processed token: ${tokenData.coin_name}, but no message ID updated in db`,
      );
      return { success: true, tokenId: tokenData._id };
    } catch (error) {
      this.logger.error(
        `🔴 [TokenProcessorService] [processToken] Failed to process token: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Helper method to introduce a delay
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Helper method to safely get a message ID as a string
   * @param obj Object that might contain a message_id
   * @returns A string representation of the message ID or null
   */
  private getMessageIdString(obj: any): string | null {
    if (!obj) return null;
    if (typeof obj.message_id === 'number') return obj.message_id.toString();
    return null;
  }

  private async sendTelegramMessage(tokenData: any, customChatId?: string) {
    try {
      const chatId = customChatId || this.telegramChatId;

      if (!chatId) {
        this.logger.warn(
          `⚠️ [TokenProcessorService] [sendTelegramMessage] Missing Telegram configuration: Chat ID not provided`,
        );
        return;
      }

      this.logger.log(
        `🔄 [TokenProcessorService] [sendTelegramMessage] Preparing to send message for token: ${tokenData.coin_name}`,
      );

      const message = this.formatTelegramMessage(tokenData);

      // Create inline keyboard with two buttons
      const inlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: '🔄 Refresh Token',
              callback_data: `refresh_token:${tokenData.ca_address}`,
            },
            {
              text: '📊 Insight Analysis',
              callback_data: `insight_analysis:${tokenData.ca_address}`,
            },
          ],
        ],
      };

      // Send message using the TelegramBot service
      const result = await this.telegramBot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: inlineKeyboard,
      });

      if (result) {
        this.logger.log(
          `✅ [TokenProcessorService] [sendTelegramMessage] Message sent successfully to Telegram for token: ${tokenData.coin_name}`,
        );

        // Return the message ID for database update
        return result.message_id;
      } else {
        this.logger.warn(
          `⚠️ [TokenProcessorService] [sendTelegramMessage] Failed to send message to Telegram`,
        );
        return null;
      }
    } catch (error) {
      this.logger.error(
        `🔴 [TokenProcessorService] [sendTelegramMessage] Error sending Telegram message: ${error.message}`,
        error.stack,
      );
    }
  }

  private formatTokenAge(createdAt: string): string {
    try {
      const createdDate = new Date(createdAt);
      const now = new Date();

      // If invalid date, return the original string
      if (isNaN(createdDate.getTime())) {
        return createdAt;
      }

      const diffMs = now.getTime() - createdDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago 🔥`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      // If any error occurs, return the original date
      return createdAt;
    }
  }

  private getRiskIndicator(followers: number, isVerified: boolean): string {
    if (isVerified) return '🔵'; // Verified account
    if (isNaN(followers)) return '⚠️';
    if (followers > 10000) return '🟢'; // Low risk - established account
    if (followers > 1000) return '🟡'; // Medium risk
    if (followers > 100) return '🟠'; // High risk
    return '🔴'; // Very high risk - new account with few followers
  }

  private formatTelegramMessage(tokenData: any): string {
    // Extract Twitter info with fallbacks
    const twitterInfo = tokenData.twitter_info || {};
    const followers = parseInt(twitterInfo.followers_count) || 0;
    const isVerified = twitterInfo.is_blue_verified || false;
    const twitterName = twitterInfo.name || 'Unknown';
    const twitterScore = twitterInfo.score || '0';
    const topFollowers = twitterInfo.top_followers || [];

    // Extract token info with fallbacks
    const caAddress = tokenData.ca_address || '';
    const tokenName = tokenData.coin_name || 'Unknown';
    const tokenTicker = tokenData.coin_ticker || 'Unknown';
    const twitterHandler = tokenData.twitter_handler || 'Unknown';

    // Calculate token age
    const tokenAge = this.formatTokenAge(tokenData.created_at);
    const isNew =
      tokenAge.includes('min') ||
      (tokenAge.includes('hour') && parseInt(tokenAge) < 3);

    // Get risk indicator based on Twitter followers
    const riskIndicator = this.getRiskIndicator(followers, isVerified);

    // Format fake percentage if available
    const fakePercent = twitterInfo.fake_percent
      ? `(${twitterInfo.fake_percent}% fake)`
      : '';

    // Top followers formatted concisely with links instead of @ symbols
    let topFollowersText = '';
    if (topFollowers && topFollowers.length > 0) {
      topFollowersText = topFollowers
        .slice(0, 3)
        .map((follower) => {
          const twitter = follower.twitter || 'unknown';
          const name = follower.name || 'Unknown';
          const score = follower.score || '0';
          const twitterHandle = twitter.replace('@', '');
          return `<a href="https://twitter.com/${twitterHandle}">${twitterHandle}</a> (${score})`;
        })
        .join(' • ');
    }

    // Price and market cap
    const priceValue = tokenData.price || 'Unknown';
    const marketCapValue = tokenData.market_cap || 'Unknown';

    // Format compact message in DCA summary style with Twitter link instead of @ symbol
    return `<b>🔍 ${isNew ? '🔥 NEW ' : ''}TOKEN ALERT</b>
🪙 CA: <code>${caAddress}</code> (${tokenName})
💎 Ticker: ${tokenTicker} • Age: ${tokenAge} ${isNew ? '🆕' : ''}
💰 Price: ${priceValue} • Market Cap: ${marketCapValue}

🐦 Twitter: <a href="https://twitter.com/${twitterHandler.replace('@', '')}">${twitterHandler.replace('@', '')}</a> ${isVerified ? '✓' : ''} • Score: ${twitterScore} ${riskIndicator}
👤 Followers: ${followers.toLocaleString()} ${fakePercent} ${followers > 1000 ? '🔥' : ''}
${topFollowersText ? `👥 Notable Followers: ${topFollowersText}` : ''}

🔗 <a href="https://gmgn.ai/sol/token/${caAddress}">Explorer</a> • <a href="https://t.me/solana_trojanbot?start=d-oxandrein-${caAddress}">Trojan</a> • <a href="https://believe.app/coin/${caAddress}">Believe</a>

${isNew ? '⚠️ This token is very new! Exercise caution. ' : ''}Always DYOR before investing!`;
  }
}
