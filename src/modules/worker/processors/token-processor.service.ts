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

  @Process('process-token')
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
          disable_web_page_preview: false,
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

  private getRiskIndicator(followers: number): string {
    if (isNaN(followers)) return '⚠️';
    if (followers > 10000) return '🟢'; // Low risk - established account
    if (followers > 1000) return '🟡'; // Medium risk
    if (followers > 100) return '🟠'; // High risk
    return '🔴'; // Very high risk - new account with few followers
  }

  private formatTelegramMessage(tokenData: any): string {
    const twitterInfo = tokenData.twitter_info || {};
    const followers = parseInt(twitterInfo.followers_count) || 0;
    const caAddress = tokenData.ca_address || '';
    const tokenAge = this.formatTokenAge(tokenData.created_at);
    const isNew =
      tokenAge.includes('min') ||
      (tokenAge.includes('hour') && parseInt(tokenAge) < 3);
    const riskIndicator = this.getRiskIndicator(followers);

    return `
<b>🚀 ${isNew ? '🔥 FRESH ' : ''}TOKEN ALERT${isNew ? ' 🔥' : ''} 🚀</b>

<b>💎 Token Info:</b>
  • <b>Name:</b> <b><i>${tokenData.coin_name}</i></b>
  • <b>Ticker:</b> <code>${tokenData.coin_ticker}</code>
  • <b>Created:</b> ${tokenAge}

<b>🐦 Twitter: ${riskIndicator}</b>
  • <b>Handle:</b> <a href="https://twitter.com/${tokenData.twitter_handler}">@${tokenData.twitter_handler}</a>
  • <b>Name:</b> ${twitterInfo.name || 'N/A'}
  • <b>Followers:</b> ${followers.toLocaleString()} ${followers > 1000 ? '🔥' : ''}

<b>🔗 Links:</b>
  • <b>Believe:</b> <a href="${tokenData.link}">View on Believe Signal</a>
  • <b>GMGN:</b> <a href="https://gmgn.ai/sol/token/${caAddress}">View on GMGN Explorer</a>
  • <b>Trojan:</b> <a href="https://t.me/solana_trojanbot?start=d-oxandrein-${caAddress}">Security Analysis</a>

<b>🔑 Contract Address:</b>
<code>${caAddress}</code>

<i>💡 ${isNew ? 'This token is very new! ' : ''}Always DYOR before investing!</i>
`;
  }
}
