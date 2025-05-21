import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AxiomPairInfo } from '../interfaces/axiom-pair-info.interface';
import { AxiomTokenPrice } from '../interfaces/axiom-token-price.interface';
import { AxiomTwitterUser } from '../interfaces/axiom-twitter-user.interface';

@Injectable()
export class AxiomApiService {
  private refreshToken: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6IjJlMDU2NzBkLTBlZWYtNDJkNi05NGNjLTFmMzk2NTQwZDhhNyIsImlhdCI6MTc0NzE5NjM1M30.l5qzWDGXf16fk3RfYxZmSx1ovOrU6Z5uiR25GgHwCts';
  private currentAccessToken: string = '';
  private isRefreshing: boolean = false;
  private refreshCallbacks: Array<(token: string) => void> = [];
  private onTokenRefreshEvent: ((newToken: string) => void) | null = null;

  constructor(
    @InjectPinoLogger(AxiomApiService.name)
    private readonly logger: PinoLogger,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Set the current access token
   * @param token The access token to set
   */
  public setAccessToken(token: string): void {
    this.currentAccessToken = token;
  }

  /**
   * Set the callback function to be called when token needs to be refreshed
   * @param callback The callback function that refreshes the token
   */
  public setTokenRefreshCallback(callback: (newToken: string) => void): void {
    this.onTokenRefreshEvent = callback;
  }

  /**
   * Refresh the access token
   * @returns A promise that resolves with the new token or rejects if refresh fails
   */
  public async refreshAccessToken(): Promise<string> {
    // If already refreshing, wait for that process to complete
    if (this.isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        this.refreshCallbacks.push((token: string) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      this.logger.info(
        '🔄 [AxiomApiService] refreshAccessToken: Refreshing access token',
      );

      const response = await firstValueFrom(
        this.httpService.post(
          'https://api10.axiom.trade/refresh-access-token',
          {},
          {
            headers: {
              accept: 'application/json, text/plain, */*',
              'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
              'content-length': '0',
              origin: 'https://axiom.trade',
              priority: 'u=1, i',
              referer: 'https://axiom.trade/',
              'sec-ch-ua':
                '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-platform': '"macOS"',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-site',
              'user-agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
              Cookie: `auth-refresh-token=${this.refreshToken}`,
            },
            withCredentials: true,
          },
        ),
      );

      // Extract the new access token from Set-Cookie header
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader && setCookieHeader.length > 0) {
        const authTokenCookie = setCookieHeader.find((cookie) =>
          cookie.startsWith('auth-access-token='),
        );
        if (authTokenCookie) {
          // Extract just the token part
          const tokenMatch = authTokenCookie.match(/auth-access-token=([^;]+)/);
          if (tokenMatch && tokenMatch[1]) {
            this.currentAccessToken = tokenMatch[1];
            
            // Call the token refresh event if set
            if (this.onTokenRefreshEvent) {
              this.onTokenRefreshEvent(this.currentAccessToken);
            }
            
            // Resolve any pending callbacks
            this.refreshCallbacks.forEach((callback) => callback(this.currentAccessToken));
            this.refreshCallbacks = [];
            
            this.logger.info(
              { tokenLength: this.currentAccessToken.length },
              '✅ [AxiomApiService] refreshAccessToken: Successfully refreshed access token',
            );
            
            this.isRefreshing = false;
            return this.currentAccessToken;
          }
        }
      }

      this.logger.warn(
        { response: response.data },
        '⚠️ [AxiomApiService] refreshAccessToken: Could not extract new access token from response',
      );
      
      this.isRefreshing = false;
      throw new Error('Failed to extract access token from response');
    } catch (error) {
      this.logger.error(
        { error },
        '🔴 [AxiomApiService] refreshAccessToken: Error refreshing access token',
      );
      
      // Reject any pending callbacks
      this.refreshCallbacks.forEach((callback) => 
        callback(this.currentAccessToken)
      );
      this.refreshCallbacks = [];
      
      this.isRefreshing = false;
      throw error;
    }
  }

  /**
   * Execute an API request with token refresh on authentication failure
   * @param requestFn The function that makes the API request
   * @param retryAttempt Current retry attempt number
   * @returns The result of the API request
   */
  private async executeWithTokenRefresh<T>(
    requestFn: () => Promise<T>,
    retryAttempt = 0,
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      // Check if it's an authentication error (401) and we haven't exceeded retry attempts
      if (
        error instanceof AxiosError &&
        error.response?.status === 401 &&
        retryAttempt < 1
      ) {
        this.logger.warn(
          '⚠️ [AxiomApiService] executeWithTokenRefresh: Authentication failed, refreshing token and retrying',
        );
        
        // Refresh the token
        await this.refreshAccessToken();
        
        // Retry the request
        return this.executeWithTokenRefresh(requestFn, retryAttempt + 1);
      }
      
      // For other errors or if we've exceeded retry attempts, rethrow
      throw error;
    }
  }

  /**
   * Get pair information from Axiom Trade API
   * @param pairAddress The pair address to get information for
   * @returns Pair information or null if request failed
   */
  public async getPairInfo(
    pairAddress: string,
  ): Promise<AxiomPairInfo | null> {
    try {
      this.logger.info(
        { pairAddress },
        '🔍 [AxiomApiService] getPairInfo: Fetching pair info from Axiom Trade API',
      );

      const response = await this.executeWithTokenRefresh<AxiosResponse<AxiomPairInfo>>(() => 
        firstValueFrom(
          this.httpService.get(
            `https://api10.axiom.trade/pair-info?pairAddress=${pairAddress}`,
            {
              headers: {
                accept: 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                origin: 'https://axiom.trade',
                priority: 'u=1, i',
                referer: 'https://axiom.trade/',
                'sec-ch-ua':
                  '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
                Cookie: `auth-refresh-token=${this.refreshToken}; auth-access-token=${this.currentAccessToken}`,
              },
            },
          ),
        )
      );

      this.logger.info(
        { pairAddress },
        '✅ [AxiomApiService] getPairInfo: Successfully retrieved pair info',
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        { error, pairAddress },
        '🔴 [AxiomApiService] getPairInfo: Error fetching pair info',
      );
      return null;
    }
  }

  /**
   * Get the latest token price information from Axiom Trade API
   * @param pairAddress The pair address to get price information for
   * @returns Token price information or null if request failed
   */
  public async getTokenPrice(
    pairAddress: string,
  ): Promise<AxiomTokenPrice | null> {
    try {
      this.logger.info(
        { pairAddress },
        '🔍 [AxiomApiService] getTokenPrice: Fetching token price from Axiom Trade API',
      );

      const response = await this.executeWithTokenRefresh<AxiosResponse<AxiomTokenPrice>>(() => 
        firstValueFrom(
          this.httpService.get(
            `https://api6.axiom.trade/last-transaction?pairAddress=${pairAddress}`,
            {
              headers: {
                accept: 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                origin: 'https://axiom.trade',
                priority: 'u=1, i',
                referer: 'https://axiom.trade/',
                'sec-ch-ua':
                  '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
                Cookie: `auth-refresh-token=${this.refreshToken}; auth-access-token=${this.currentAccessToken}`,
              },
            },
          ),
        )
      );

      this.logger.info(
        {
          pairAddress,
          priceUsd: response.data.priceUsd,
          priceSol: response.data.priceSol,
          type: response.data.type,
        },
        '✅ [AxiomApiService] getTokenPrice: Successfully retrieved token price',
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        { error, pairAddress },
        '🔴 [AxiomApiService] getTokenPrice: Error fetching token price',
      );
      return null;
    }
  }

  /**
   * Get Twitter user information from Axiom Trade API using tweet ID
   * @param tweetId The tweet ID to get user information for
   * @returns Twitter user information or null if request failed
   */
  public async getTwitterUserInfo(
    tweetId: string,
  ): Promise<AxiomTwitterUser | null> {
    try {
      this.logger.info(
        { tweetId },
        '🔍 [AxiomApiService] getTwitterUserInfo: Fetching Twitter user info from Axiom Trade API',
      );

      const response = await this.executeWithTokenRefresh<AxiosResponse<AxiomTwitterUser>>(() => 
        firstValueFrom(
          this.httpService.get(
            `https://api.axiom.trade/twitter-user-info-by-tweet-id?tweetId=${tweetId}`,
            {
              headers: {
                accept: 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                origin: 'https://axiom.trade',
                priority: 'u=1, i',
                referer: 'https://axiom.trade/',
                'sec-ch-ua':
                  '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
                Cookie: `auth-refresh-token=${this.refreshToken}; auth-access-token=${this.currentAccessToken}`,
              },
            },
          ),
        )
      );

      this.logger.info(
        {
          tweetId,
          userName: response.data.userName,
          followers: response.data.followers,
          isBlueVerified: response.data.isBlueVerified,
        },
        '✅ [AxiomApiService] getTwitterUserInfo: Successfully retrieved Twitter user info',
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        { error, tweetId },
        '🔴 [AxiomApiService] getTwitterUserInfo: Error fetching Twitter user info',
      );
      return null;
    }
  }
} 