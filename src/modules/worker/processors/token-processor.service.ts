import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { TelegramBot } from '../telegram-bot/telegram-bot';

@Injectable()
@Processor('token-queue')
export class TokenProcessorService {
  private readonly logger = new Logger(TokenProcessorService.name);
  private readonly telegramChatId: string;

  constructor(
    private readonly telegramBot: TelegramBot,
    private readonly configService: ConfigService,
  ) {
    this.telegramChatId = this.configService.get<string>('telegram.chatId');
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

      // Send message to Telegram
      await this.sendTelegramMessage(tokenData);

      this.logger.log(
        `✅ [TokenProcessorService] [processToken] Successfully processed token: ${tokenData.coin_name}`,
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

  private async sendTelegramMessage(tokenData: any) {
    try {
      if (!this.telegramChatId) {
        this.logger.warn(
          `⚠️ [TokenProcessorService] [sendTelegramMessage] Missing Telegram configuration: Chat ID not provided`,
        );
        return;
      }

      this.logger.log(
        `🔄 [TokenProcessorService] [sendTelegramMessage] Preparing to send message for token: ${tokenData.coin_name}`,
      );

      const message = this.formatTelegramMessage(tokenData);

      // Send message using the TelegramBot service
      const result = await this.telegramBot.sendMessage(
        this.telegramChatId,
        message,
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        },
      );

      if (result) {
        this.logger.log(
          `✅ [TokenProcessorService] [sendTelegramMessage] Message sent successfully to Telegram for token: ${tokenData.coin_name}`,
        );
      } else {
        this.logger.warn(
          `⚠️ [TokenProcessorService] [sendTelegramMessage] Failed to send message to Telegram`,
        );
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
    const marketCapValue = tokenData.marketCap || 'Unknown';

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
