import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import WebSocket from 'ws';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { TweetScoutService } from './tweet-scout.service';
import { TokenProcessorService } from '../processors/token-processor.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TokenRepository } from '../repositories/token.repository';
import { AxiomPairInfo } from '../interfaces/axiom-pair-info.interface';
import { AxiomTokenPrice } from '../interfaces/axiom-token-price.interface';
import { AxiomTwitterUser } from '../interfaces/axiom-twitter-user.interface';
import { Token } from '../entities/token.entity';
import { AxiomApiService } from './axiom-api.service';

// Interfaces for Axiom WebSocket messages
interface PoolFees {
  base_fee: {
    cliff_fee_numerator: string;
    period_frequency: string;
    reduction_factor: string;
    number_of_period: number;
    fee_scheduler_mode: number;
  };
  dynamic_fee: {
    initialized: number;
    max_volatility_accumulator: number;
    variable_fee_control: number;
    bin_step: number;
    filter_period: number;
    decay_period: number;
    reduction_factor: number;
    bin_step_u128: string;
  };
  protocol_fee_percent: number;
  referral_fee_percent: number;
}

interface CurvePoint {
  sqrt_price: string;
  liquidity: string;
}

interface LockedVestingConfig {
  amount_per_period: string;
  cliff_duration_from_migration_time: string;
  frequency: string;
  number_of_period: string;
  cliff_unlock_amount: string;
}

interface ProtocolDetails {
  quote_mint: string;
  fee_claimer: string;
  owner: string;
  pool_fees: PoolFees;
  collect_fee_mode: number;
  migration_option: number;
  activation_type: number;
  token_decimal: number;
  version: number;
  token_type: number;
  quote_token_flag: number;
  partner_locked_lp_percentage: number;
  partner_lp_percentage: number;
  creator_locked_lp_percentage: number;
  creator_lp_percentage: number;
  swap_base_amount: string;
  migration_quote_threshold: string;
  migration_base_threshold: string;
  migration_sqrt_price: string;
  locked_vesting_config: LockedVestingConfig;
  sqrt_start_price: string;
  curve: CurvePoint[];
  config_address: string;
  base_vault: string;
  quote_vault: string;
  token_program: string;
  created_at: number;
  deployer_address: string;
  pre_migration_token_supply: string;
  post_migration_token_supply: string;
  migration_fee_option: number;
  fixed_token_supply_flag: number;
}

interface NewPairContent {
  pair_address: string;
  signature: string;
  token_address: string;
  token_name: string;
  token_ticker: string;
  token_image: string | null;
  token_uri: string;
  token_decimals: number;
  pair_sol_account: string;
  pair_token_account: string;
  protocol: string;
  protocol_details: ProtocolDetails;
  created_at: string;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  discord: string | null;
  mint_authority: string | null;
  open_trading: string;
  deployer_address: string;
  supply: number;
  initial_liquidity_sol: number;
  initial_liquidity_token: number;
  top_10_holders: number;
  lp_burned: number;
  updated_at: string;
  freeze_authority: string | null;
  extra: any | null;
  slot: number;
}

interface AxiomMessage {
  room: string;
  content: NewPairContent;
}

// Interface for token data scraped from believe.app
interface BelieveTokenData {
  tokenAddress: string;
  launchedBy: string;
  createdAt: string;
  marketCap: string;
  price: string;
}

@Injectable()
export class AxiomWebSocketService
  implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap
{
  private client: WebSocket;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds
  private pingInterval: NodeJS.Timeout;
  private tokenRefreshInterval: NodeJS.Timeout;
  private currentAccessToken: string = '';
  private refreshToken: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6IjJlMDU2NzBkLTBlZWYtNDJkNi05NGNjLTFmMzk2NTQwZDhhNyIsImlhdCI6MTc0NzE5NjM1M30.l5qzWDGXf16fk3RfYxZmSx1ovOrU6Z5uiR25GgHwCts';

  constructor(
    @InjectPinoLogger(AxiomWebSocketService.name)
    private readonly logger: PinoLogger,
    private readonly httpService: HttpService,
    private readonly tweetScoutService: TweetScoutService,
    private readonly tokenProcessorService: TokenProcessorService,
    private readonly tokenRepository: TokenRepository,
    private readonly axiomApiService: AxiomApiService,
    @InjectQueue('token-queue') private readonly tokenQueue: Queue,
  ) {
    // Set up the token refresh callback to update WebSocket service
    this.axiomApiService.setTokenRefreshCallback((newToken: string) => {
      this.logger.info(
        '🔄 [AxiomWebSocketService] Token refreshed by AxiomApiService, updating local token',
      );
      this.currentAccessToken = newToken;

      // If there's an active connection, reconnect to apply the new token
      if (this.isConnected) {
        this.logger.info(
          '🔄 [AxiomWebSocketService] Reconnecting to apply new token',
        );
        this.reconnect();
      }
    });
  }

  onModuleInit() {
    this.refreshAccessToken();
    this.setupTokenRefreshInterval();
    this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
    this.clearTokenRefreshInterval();
  }

  async onApplicationBootstrap() {
    // const tokenData = await this.scrapeTokenData(
    //   'A82xG78RJugg1kvXLn9Jfq3mS2J9MxxiiAhKZpxJKbtT',
    // );
    // const a = await this.axiomApiService.getPairInfo(
    //   '3AFzxwxsu8cbMaqWrQ9mq4YfvvBwLvMWF5BVQiLpLd6t',
    // );
    // console.log(a, 'a');
  }

  private async refreshAccessToken() {
    try {
      this.logger.info(
        '🔄 [AxiomWebSocketService] refreshAccessToken: Initiating token refresh via AxiomApiService',
      );

      // Use the AxiomApiService to refresh the token
      const newToken = await this.axiomApiService.refreshAccessToken();
      this.currentAccessToken = newToken;

      return true;
    } catch (error) {
      this.logger.error(
        { error },
        '🔴 [AxiomWebSocketService] refreshAccessToken: Error refreshing access token',
      );
      return false;
    }
  }

  private setupTokenRefreshInterval() {
    this.clearTokenRefreshInterval();
    this.tokenRefreshInterval = setInterval(
      () => {
        this.refreshAccessToken();
      },
      10 * 60 * 1000,
    ); // 10 minutes
    this.logger.info(
      '🔄 [AxiomWebSocketService] setupTokenRefreshInterval: Token refresh interval set to 10 minutes',
    );
  }

  private clearTokenRefreshInterval() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.logger.debug(
        '🔄 [AxiomWebSocketService] clearTokenRefreshInterval: Token refresh interval cleared',
      );
    }
  }

  private connect() {
    try {
      // Ensure any existing connection is properly closed
      if (this.client) {
        this.disconnect();
      }

      this.logger.info(
        '🔄 [AxiomWebSocketService] connect: Connecting to Axiom Trade WebSocket',
      );

      // Configure WebSocket with the required origin and host headers
      this.client = new WebSocket('wss://cluster3.axiom.trade/', {
        headers: {
          Origin: 'https://axiom.trade',
          Host: 'cluster3.axiom.trade',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          Cookie: `auth-access-token=${this.currentAccessToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Domain=.axiom.trade; Max-Age=900`,
        },
      });

      this.logger.debug(
        { tokenLength: this.currentAccessToken.length },
        '🔍 [AxiomWebSocketService] connect: Using access token',
      );

      this.client.on('open', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.logger.info(
          '✅ [AxiomWebSocketService] connect: Connected to Axiom Trade WebSocket',
        );

        // Setup ping interval to keep connection alive
        // this.setupPingInterval();

        // Subscribe to necessary channels or send auth messages here
        this.subscribe();
      });

      this.client.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          this.logger.error(
            { error, data: data.toString() },
            '🔴 [AxiomWebSocketService] message: Error parsing WebSocket message',
          );
        }
      });

      this.client.on('error', (error) => {
        this.logger.error(
          { error },
          '🔴 [AxiomWebSocketService] error: WebSocket error',
        );
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.clearPingInterval();
        this.logger.warn(
          '⚠️ [AxiomWebSocketService] close: WebSocket connection closed',
        );

        // Attempt to reconnect
        this.handleReconnect();
      });
    } catch (error) {
      this.logger.error(
        { error },
        '🔴 [AxiomWebSocketService] connect: Error connecting to WebSocket',
      );
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.info(
        {
          attempt: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts,
        },
        '🔄 [AxiomWebSocketService] handleReconnect: Attempting to reconnect',
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      this.logger.error(
        '🔴 [AxiomWebSocketService] handleReconnect: Max reconnect attempts reached',
      );
    }
  }

  private disconnect() {
    if (this.client) {
      this.clearPingInterval();
      this.client.close();
      this.isConnected = false;
      this.logger.info(
        '🔄 [AxiomWebSocketService] disconnect: Disconnected from WebSocket',
      );
    }
  }

  private setupPingInterval() {
    this.clearPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.client.readyState === WebSocket.OPEN) {
        this.client.ping();
        this.logger.debug(
          '🔍 [AxiomWebSocketService] setupPingInterval: Ping sent',
        );
      }
    }, 30000); // 30 seconds
  }

  private clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  private subscribe() {
    if (!this.isConnected || this.client.readyState !== WebSocket.OPEN) {
      this.logger.warn(
        '⚠️ [AxiomWebSocketService] subscribe: Cannot subscribe, not connected',
      );
      return;
    }

    // Join the new_pairs room
    const joinMessage = JSON.stringify({
      action: 'join',
      room: 'new_pairs',
    });

    this.client.send(joinMessage);
  }

  private async handleMessage(message: any) {
    try {
      // this.logger.debug(
      //   { message },
      //   '🔍 [AxiomWebSocketService] handleMessage: Received message',
      // );

      // Check if the message is a valid AxiomMessage
      const axiomMessage = message as AxiomMessage;

      // If the protocol is not "Virtual Curve", skip processing
      if (
        axiomMessage.room === 'new_pairs' &&
        axiomMessage.content &&
        axiomMessage.content.protocol !== 'Virtual Curve'
      ) {
        // this.logger.debug(
        //   { protocol: axiomMessage.content.protocol },
        //   '🔍 [AxiomWebSocketService] handleMessage: Skipping non-Virtual Curve protocol',
        // );
        return;
      }

      // Continue processing for Virtual Curve protocols
      if (
        axiomMessage.room === 'new_pairs' &&
        axiomMessage.content &&
        axiomMessage.content.deployer_address ==
          '5qWya6UjwWnGVhdSBL3hyZ7B45jbk6Byt1hwd7ohEGXE'
      ) {
        // Extract token address from the message
        const tokenAddress = axiomMessage.content.token_address;

        //sleep 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 15000));

        const [pairInfo, tokenPrice] = await Promise.all([
          this.axiomApiService.getPairInfo(axiomMessage.content.pair_address),
          this.axiomApiService.getTokenPrice(axiomMessage.content.pair_address),
        ]);

        let twitterUsername = '';
        let tweetId;

        if (pairInfo?.twitter) {
          if (pairInfo.twitter && pairInfo.twitter.includes('status/')) {
            const tweetIdMatch = pairInfo.twitter.match(/status\/(\d+)/);
            if (tweetIdMatch && tweetIdMatch[1]) {
              tweetId = tweetIdMatch[1];
            }
          }
        }

        const twitterUserInfo =
          await this.axiomApiService.getTwitterUserInfo(tweetId);
        twitterUsername = twitterUserInfo?.userName;
        const isBlueVerified = twitterUserInfo?.isBlueVerified;
        //sleep 5 seconds
        if (twitterUsername) {
          const twitter =
            await this.tweetScoutService.getScore(twitterUsername);

          this.logger.info(
            { twitter },
            '✅ [AxiomWebSocketService] handleMessage: Successfully retrieved twitter info',
          );

          // Prepare data for TokenProcessorService
          const processedData = {
            coin_name: axiomMessage.content.token_name || 'Unknown',
            coin_ticker: axiomMessage.content.token_ticker || 'Unknown',
            ca_address: tokenAddress,
            created_at:
              axiomMessage.content.created_at || new Date().toISOString(),
            twitter_handler: twitterUsername,
            price: tokenPrice?.priceUsd || '0',
            market_cap: Number(
              (tokenPrice?.priceUsd * pairInfo.supply || 24000).toFixed(2),
            ),
            website: pairInfo?.website,
            twitter_info: {
              name: twitter?.top_followers?.[0]?.name || 'Unknown',
              followers_count: twitter?.followersCount || 0,
              is_blue_verified: isBlueVerified || false,
              score: twitter?.score || '0',
              fake_percent: twitter?.fake_percent || '0',
              top_followers: twitter?.top_followers,
            },
          };

          //save to database
          try {
            const tokenEntity = new Token();
            tokenEntity.coin_name = processedData.coin_name;
            tokenEntity.coin_ticker = processedData.coin_ticker;
            tokenEntity.ca_address = processedData.ca_address;
            tokenEntity.twitter_handler = processedData.twitter_handler;
            tokenEntity.website = processedData.website;
            tokenEntity.price = Number(processedData.price);
            tokenEntity.initial_price = Number(processedData.price); // Set initial price same as current price on creation
            tokenEntity.market_cap = Number(processedData.market_cap);
            tokenEntity.initial_market_cap = Number(processedData.market_cap); // Set initial market cap same as current on creation
            // The twitter_info object should already have the correct structure from processedData
            tokenEntity.twitter_info = processedData.twitter_info;
            tokenEntity.pair_address = axiomMessage.content.pair_address;

            await this.tokenRepository.save(tokenEntity);

            this.logger.info(
              { tokenAddress },
              '✅ [AxiomWebSocketService] handleMessage: Successfully saved token data to database',
            );
          } catch (dbError) {
            this.logger.error(
              { error: dbError, tokenAddress },
              '🔴 [AxiomWebSocketService] handleMessage: Error saving token data to database',
            );
          }

          // Send to token queue for processing and telegram notification
          await this.tokenQueue.add('process-token-v2', processedData, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          });

          this.logger.info(
            { tokenAddress },
            '✅ [AxiomWebSocketService] handleMessage: Added token to processing queue for Telegram notification',
          );
        }
      }
    } catch (error) {
      this.logger.error(
        { error, message },
        '🔴 [AxiomWebSocketService] handleMessage: Error handling message',
      );
    }
  }

  /**
   * Scrape token data from believe.app
   * @param tokenAddress The token address to scrape data for
   * @returns Parsed token data or null if scraping failed
   */
  private async scrapeTokenData(
    tokenAddress: string,
  ): Promise<BelieveTokenData | null> {
    try {
      const url = `https://believe.app/coin/${tokenAddress}`;
      this.logger.info(
        { tokenAddress, url },
        '🔍 [AxiomWebSocketService] scrapeTokenData: Scraping data from believe.app',
      );

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
          },
        }),
      );

      // Load the HTML into cheerio
      const $ = cheerio.load(response.data);

      // Get the page HTML as text
      const htmlText = $.text();

      // Try to extract each piece of information with multiple patterns

      // Extract "Launched by" - Try different patterns
      let launchedBy = 'Unknown';

      // First try to find usernames with the "Launched by @..." pattern
      const launchedByMatch1 = htmlText.match(/Launched by\s*@([\w_]+)/i);
      if (launchedByMatch1) {
        launchedBy = `@${launchedByMatch1[1]}`;
      } else {
        // If not found, look for any @username in the text
        const launchedByMatch2 = htmlText.match(/@([\w_]+)/);
        if (launchedByMatch2) {
          launchedBy = `@${launchedByMatch2[1]}`;
        }
      }

      // Post-processing to remove "View" suffix
      if (launchedBy !== 'Unknown') {
        // Check if the username ends with "View" (case insensitive)
        const viewRegex = /View$/i;
        if (viewRegex.test(launchedBy)) {
          // Remove the "View" suffix regardless of its casing
          launchedBy = launchedBy.replace(viewRegex, '');
        }
      }

      // Extract "Created at" - Try different patterns
      let createdAt = 'Unknown';
      // Pattern 1: "Xd Xh Xm ago" format
      const createdAtMatch1 = htmlText.match(/(\d+d\s+\d+h\s+\d+m\s+ago)/i);
      if (createdAtMatch1) {
        createdAt = createdAtMatch1[1];
      } else {
        // Pattern 2: Just numbers and time units near "Created"
        const createdAtMatch2 = htmlText.match(
          /Created[^0-9]*([0-9]+[dhm]\s*[0-9]+[dhm]\s*[0-9]+[dhm])/i,
        );
        if (createdAtMatch2) {
          createdAt = createdAtMatch2[1];
        }
      }

      // Extract "Market Cap" - Try different patterns
      let marketCap = 'Unknown';
      // Pattern 1: Standard format like "$19.8K" after "Market Cap"
      const marketCapMatch1 = htmlText.match(
        /Market\s+Cap\s*\$([0-9.]+[KMB]?)/i,
      );
      if (marketCapMatch1) {
        marketCap = `$${marketCapMatch1[1]}`;
      } else {
        // Pattern 2: Look for dollar value nearby
        const marketCapMatch2 = htmlText.match(
          /Market\s+Cap[^$]*\$([0-9.]+[KMB]?)/i,
        );
        if (marketCapMatch2) {
          marketCap = `$${marketCapMatch2[1]}`;
        }
      }

      // Extract "Price" - Try different patterns
      let price = 'Unknown';
      // Pattern 1: Standard price format like "$0.00002" after "Price"
      const priceMatch1 = htmlText.match(/Price\s*\$([0-9.]+)/i);
      if (priceMatch1) {
        price = `$${priceMatch1[1]}`;
      } else {
        // Pattern 2: Look for any dollar value with many zeros (likely a token price)
        const priceMatch2 = htmlText.match(/\$([0-9.]+0{3,}[0-9]*)/);
        if (priceMatch2) {
          price = `$${priceMatch2[1]}`;
        }
      }

      // Create and return the structured token data object
      const tokenData: BelieveTokenData = {
        tokenAddress,
        launchedBy,
        createdAt,
        marketCap,
        price,
      };

      // this.logger.info(
      //   { tokenData },
      //   '✅ [AxiomWebSocketService] scrapeTokenData: Successfully scraped token data',
      // );

      return tokenData;
    } catch (error) {
      this.logger.error(
        { error, tokenAddress },
        '🔴 [AxiomWebSocketService] scrapeTokenData: Error scraping token data',
      );
      return null;
    }
  }

  /**
   * Notify believe.app about a new token
   * @param tokenAddress The token address to notify about
   */
  private async notifyBelieveApp(tokenAddress: string): Promise<void> {
    try {
      const url = `https://believe.app/coin/${tokenAddress}`;
      this.logger.info(
        { tokenAddress, url },
        '🔍 [AxiomWebSocketService] notifyBelieveApp: Notifying believe.app about new token',
      );

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(url),
      );

      this.logger.info(
        { tokenAddress, status: response.status },
        '✅ [AxiomWebSocketService] notifyBelieveApp: Successfully notified believe.app',
      );
    } catch (error) {
      this.logger.error(
        { error, tokenAddress },
        '🔴 [AxiomWebSocketService] notifyBelieveApp: Error notifying believe.app',
      );
    }
  }

  // Public methods to interact with the WebSocket service

  /**
   * Send a message to the Axiom Trade WebSocket server
   * @param message The message to send
   * @returns A boolean indicating whether the message was sent successfully
   */
  public sendMessage(message: any): boolean {
    if (!this.isConnected || this.client.readyState !== WebSocket.OPEN) {
      this.logger.warn(
        { message },
        '⚠️ [AxiomWebSocketService] sendMessage: Cannot send message, not connected',
      );
      return false;
    }

    try {
      this.client.send(JSON.stringify(message));
      this.logger.debug(
        { message },
        '🔍 [AxiomWebSocketService] sendMessage: Message sent',
      );
      return true;
    } catch (error) {
      this.logger.error(
        { error, message },
        '🔴 [AxiomWebSocketService] sendMessage: Error sending message',
      );
      return false;
    }
  }

  /**
   * Check if the WebSocket connection is active
   * @returns A boolean indicating whether the connection is active
   */
  public isActive(): boolean {
    return this.isConnected && this.client?.readyState === WebSocket.OPEN;
  }

  /**
   * Force a reconnection to the WebSocket server
   */
  public reconnect(): void {
    this.logger.info(
      '🔄 [AxiomWebSocketService] reconnect: Forcing reconnection',
    );

    // Ensure we fully disconnect first
    if (this.client) {
      this.disconnect();
    }

    // Reset reconnect attempts to ensure we can try multiple times
    this.reconnectAttempts = 0;

    // Small delay to ensure proper cleanup before reconnection
    setTimeout(() => {
      this.connect();
    }, 1000);
  }
}
