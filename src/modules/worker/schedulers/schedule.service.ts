import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import axios from 'axios';
import Redis from 'ioredis';

@Injectable()
export class ScheduleService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduleService.name);
  private processedTokenIds: Set<string> = new Set();

  constructor(
    @InjectQueue('token-queue') private readonly tokenQueue: Queue,
    @Inject('REDIS_STATE') private readonly redisClient: Redis,
  ) {}

  onApplicationBootstrap() {
    // this.fetchBelieveSignalTokens();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetFreeAmountTurns() {
    try {
      this.logger.log(
        `🔄 [SCHEDULED RESET] Starting daily reset of free turns for all users`,
      );
      this.logger.log(
        `✅ [SCHEDULED RESET] Successfully reset free turns for all users.`,
      );
    } catch (error) {
      this.logger.error(
        `🔴 [SCHEDULED RESET] Failed to reset free turns: ${error.message}`,
        error.stack,
      );
    }
  }

  // @Cron('*/5 * * * * *') // Runs every 2 seconds
  async fetchBelieveSignalTokens() {
    try {
      this.logger.log(
        `🔍 [ScheduleService] [fetchBelieveSignalTokens] Starting token fetch`,
      );

      const response = await axios.get('https://api.believesignal.com/tokens', {
        params: {
          count: 50,
          min_followers: 0,
        },
        headers: {
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
          origin: 'https://www.believesignal.com',
          referer: 'https://www.believesignal.com/',
          'sec-ch-ua':
            '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          cookie:
            '__cf_bm=2HrIZZfIBSpakV2UOWGhRrCdzvwEcastgi6z1K1uTgU-1747245519-1.0.1.1-pnX4vkzBULXhijuaz_6SSlbdcPzKCcQaiRX4GxiwPe4BXzSQHHXbB17TQl.FDCuTuJ8xsmS6PYgPukaQO.aUwN90bLBwc7jSkFGyYkVZnLeS3KcGMZYiPg5_7VP3S8nD',
        },
      });

      this.logger.debug(
        `🔍 [ScheduleService] [fetchBelieveSignalTokens] Got response from API`,
      );

      // Process the token data
      const tokens = response.data;
      this.logger.debug(
        `🔍 [ScheduleService] [fetchBelieveSignalTokens] Found ${tokens?.length || 0} tokens`,
      );

      await this.processTokenData(tokens);

      this.logger.log(
        `✅ [ScheduleService] [fetchBelieveSignalTokens] Successfully fetched ${tokens.length} tokens`,
      );
    } catch (error) {
      this.logger.error(
        `🔴 [ScheduleService] [fetchBelieveSignalTokens] Failed to fetch tokens: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Helper method to introduce a delay
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async processTokenData(tokens: any[]) {
    try {
      // Log some basic stats from the fetched tokens
      if (!tokens || tokens.length === 0) {
        this.logger.log(
          `⚠️ [ScheduleService] [processTokenData] No tokens found in response`,
        );
        return;
      }

      let newTokensCount = 0;

      // Identify new tokens and add them to the queue
      for (const token of tokens) {
        this.logger.debug(
          `🔍 [ScheduleService] [processTokenData] Processing token: ${token.coin_name} (${token._id})`,
        );

        const key = await this.redisClient.get(`${token.ca_address}`);
        if (key) {
          this.logger.debug(
            `🔍 [ScheduleService] [processTokenData] Token already processed: ${token.coin_name} (${token._id})`,
          );
          continue;
        }

        // New token found, add to queue for processing
        await this.tokenQueue.add('process-token', token, {
          attempts: 1,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        });

        // Mark as processed
        await this.redisClient.set(
          `${token.ca_address}`,
          JSON.stringify(token),
          'EX',
          60,
        );
        newTokensCount++;

        this.logger.log(
          `🔄 [ScheduleService] [processTokenData] Added token to queue: ${token.coin_name} (${token._id})`,
        );

        // Add a 0.5 second delay between token processing to prevent overloading
        await this.delay(1000);
      }

      this.logger.log(
        `✅ [ScheduleService] [processTokenData] Added ${newTokensCount} new tokens to the queue out of ${tokens.length} total tokens`,
      );
    } catch (error) {
      this.logger.error(
        `🔴 [ScheduleService] [processTokenData] Error processing token data: ${error.message}`,
        error.stack,
      );
    }
  }
}
