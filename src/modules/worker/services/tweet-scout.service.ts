import { Injectable, Inject, OnApplicationBootstrap } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import Redis from 'ioredis';
import { CustomTwitterScore } from '../../../interfaces/twitter-analytics.interface';
import axios from 'axios';

export interface TweetUserData {
  id: string;
  name: string;
  screeName: string;
  score: number;
  description: string;
  followersCount: number;
  friendsCount: number;
  registerDate: string;
  statuses_count: number;
  banner: string;
  avatar: string;
  verified: boolean;
  protected: boolean;
}

export interface TopFollowX {
  name: string;
  screeName: string;
  score: number;
  followersCount: number;
}

export interface TwitterInfo {
  score: number;
  top_5_followers?: TopFollowX[];
}

export interface ScoreResponse {
  pageProps: {
    search: {
      results: Array<{
        id: string;
        name: string;
        description: string;
        screen_name: string;
        score: number;
        followers_count: number;
        following_count: number;
        created_at: string;
        statuses_count: number;
        profile_banner_url: string;
        profile_image_url: string;
        verified: boolean;
        protected: boolean;
        [key: string]: any;
      }>;
      q: string;
      total: number;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

@Injectable()
export class TweetScoutService implements OnApplicationBootstrap {
  private readonly apiKey = '9g7xQ6TxmGDBkyhrVuxCL5wznVjGFNn9dzysayR9d7oV';
  private readonly baseUrl = 'https://api.tweetscout.io/api';
  private readonly baseUrlFree =
    'https://app.tweetscout.io/_next/data/jx_Wtu7Z0FsWPreE3bu1b';
  private readonly cfClearance =
    'TEV2Z22oLT6jCRxGB3SDK9SHP8o4aqslkRFYv0OggMo-1747831627-1.2.1.1-OTklxWZdckc_25HAnZjt6jQKtHoHph9pp0h8.j5hP_mpgi1VJG5SjqXekGh4kMLxoUIDIKuACNCab8HsObPCWTohM2oWa5WNWViRMe7sr35KF9yYl0DEfjQEX23kVd3FSTCCKLOdFJjBq5blTkfKrCqYRuElrWTBno25cOmjnYPFCNL5gLIe9SeHPLg9uyBi7WjoaayL3A6UW0LSu8vgrE994H6.tdhK3BtvNEz9VLzYTwp_4ZlNxP0yG0PMq3xEmJUSYQNHIIxw8ewOjcZLK3NWppqweXh7NEhlw6HBKDo.8Hrav1F4gFq2TUEE4MuNyTE98TAY1FlllezioBiysw.P2KPMCq2_s5Ziq04pfvoVxkJxRiouyEfOcj5YMS4f';

  constructor(
    @InjectPinoLogger(TweetScoutService.name)
    private readonly logger: PinoLogger,
    private readonly httpService: HttpService,
    @Inject('REDIS_STATE')
    private readonly redis: Redis,
  ) {}

  async onApplicationBootstrap() {
    const score = await this.getScore('0xnobi');
    console.log(score, '---');
  }

  /**
   * Get top followers for a Twitter username
   * @param username The Twitter username to get top followers for
   * @returns Array of TweetUserData for top followers
   */
  public async getTopFollowers(username: string): Promise<TweetUserData[]> {
    try {
      this.logger.info(
        { username },
        '🔍 [TweetScoutService] getTopFollowers: Fetching top followers',
      );

      const response: AxiosResponse<TweetUserData[]> = await firstValueFrom(
        this.httpService.get<TweetUserData[]>(
          `${this.baseUrl}/top-followers/${username}`,
          {
            headers: {
              accept: 'application/json',
              ApiKey: this.apiKey,
            },
          },
        ),
      );

      this.logger.info(
        { username, followerCount: response.data.length },
        '✅ [TweetScoutService] getTopFollowers: Successfully retrieved top followers',
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        { error, username },
        '🔴 [TweetScoutService] getTopFollowers: Error fetching top followers',
      );
      throw error;
    }
  }

  /**
   * Get user data for a specific Twitter username
   * @param username The Twitter username to get data for
   * @returns TweetUserData for the requested user
   */
  public async getUserData(username: string): Promise<TweetUserData> {
    try {
      this.logger.info(
        { username },
        '🔍 [TweetScoutService] getUserData: Fetching user data',
      );

      const response: AxiosResponse<TweetUserData> = await firstValueFrom(
        this.httpService.get<TweetUserData>(
          `${this.baseUrl}/user/${username}`,
          {
            headers: {
              accept: 'application/json',
              ApiKey: this.apiKey,
            },
          },
        ),
      );

      this.logger.info(
        { username },
        '✅ [TweetScoutService] getUserData: Successfully retrieved user data',
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        { error, username },
        '🔴 [TweetScoutService] getUserData: Error fetching user data',
      );
      throw error;
    }
  }

  /**
   * Get Twitter score and top followers for a username
   * @param twitterUserName The Twitter username to get score for
   * @param count Number of top followers to include (default: 5)
   * @param timeout Request timeout in milliseconds (default: 20000)
   * @returns TwitterInfo with score and top followers
   */
  public async getTxScore(
    twitterUserName: string,
    count: number = 5,
    timeout: number = 20000,
  ): Promise<TwitterInfo> {
    try {
      this.logger.info(
        { twitterUserName, count, timeout },
        '🔍 [TweetScoutService] getTxScore: Fetching Twitter score',
      );

      // Prepare headers for API requests
      const headers = {
        Apikey: this.apiKey,
      };

      // Get score data
      const scoreUrl = `${this.baseUrl}/score/${twitterUserName}`;
      const scoreResponse = await firstValueFrom(
        this.httpService.get(scoreUrl, { headers }),
      );
      const scoreData = scoreResponse.data;

      let topFollowersData;

      // Get top followers data
      try {
        const topFollowersUrl = `${this.baseUrl}/top-followers/${twitterUserName}`;
        const topFollowersResponse = await firstValueFrom(
          this.httpService.get(topFollowersUrl, {
            headers,
            timeout,
          }),
        );
        topFollowersData = topFollowersResponse.data;
      } catch (error) {
        this.logger.error(
          { error, twitterUserName },
          '🔴 [TweetScoutService] getTxScore: Error fetching top followers',
        );
      }

      // Prepare result
      const result: TwitterInfo = {
        score: scoreData.score,
        top_5_followers: topFollowersData
          ?.slice(0, count)
          ?.map((item: TweetUserData) => ({
            name: item.name,
            screeName: item.screeName,
            score: item.score,
            followersCount: item.followersCount,
          })),
      };

      this.logger.info(
        { twitterUserName },
        '✅ [TweetScoutService] getTxScore: Successfully retrieved Twitter score',
      );

      return result;
    } catch (error) {
      this.logger.error(
        { error, twitterUserName },
        '🔴 [TweetScoutService] getTxScore: Error fetching Twitter score',
      );
      return {} as TwitterInfo;
    }
  }

  /**
   * Get Twitter score using the free API endpoint with specific fields
   * @param username The Twitter username to get score for
   * @returns Custom score data with number, fake_percent, followersCount, score, top_followers, followers, usernames, feed_items_count
   */
  public async getScore(username: string): Promise<CustomTwitterScore> {
    try {
      this.logger.info(
        { username },
        '🔍 [TweetScoutService] getScore: Fetching Twitter score from free API',
      );

      const url = `${this.baseUrlFree}/search.json?q=${username}`;

      const response = await axios.get(url, {
        headers: {
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
          priority: 'u=1, i',
          referer: `https://app.tweetscout.io/search?q=${username}`,
          'sec-ch-ua':
            '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
          'sec-ch-ua-arch': 'arm',
          'sec-ch-ua-bitness': '64',
          'sec-ch-ua-full-version': '135.0.7049.96',
          'sec-ch-ua-full-version-list':
            '"Google Chrome";v="135.0.7049.96", "Not-A.Brand";v="8.0.0.0", "Chromium";v="135.0.7049.96"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-model': '',
          'sec-ch-ua-platform': '"macOS"',
          'sec-ch-ua-platform-version': '15.4.1',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          Cookie: `_ga=GA1.1.349222678.1747379538; _ym_uid=17307197866784975; _ym_d=1747379540; cf_clearance=${this.cfClearance}`,
        },
        // Force IPv4
        family: 4,
        // Add timeout
        // Add additional axios configs
        // maxRedirects: 5,
        // validateStatus: function (status) {
        //   return status >= 200 && status < 303; // Accept all 2xx status codes and redirects
        // },
        withCredentials: true,
      });

      // Extract data from the full response
      const fullData = response.data;
      const accountData = fullData.pageProps?.account || {};

      // Extract influencers from top_followers.accounts (max 5)
      const influencers = (accountData.top_followers || []).find(
        (item) => item.title == 'Influencers',
      );

      const listAccount = influencers?.accounts?.slice(0, 5);
      const topFollowers = listAccount?.map((item) => ({
        twitter: item.twitter,
        name: item.name,
        score: item.score,
      }));

      // Create custom response with only the requested fields
      const customResponse: CustomTwitterScore = {
        // Basic account metrics
        number: accountData.number || 0,
        fake_percent: accountData.fake_percent || '0.00',
        followersCount: accountData.followersCount || 0,

        // Score value
        score: accountData.score?.value || '0',

        // Only include influencers with twitter and name
        top_followers: topFollowers,

        // Follower metrics
        followers: {
          value: accountData.followers?.value || '0',
          fakes: accountData.followers?.fakes || '0',
        },

        // Username history
        usernames: accountData.usernames || [],

        // Activity count
        feed_items_count: accountData.feed_items_count || 0,
      };

      this.logger.info(
        { username },
        '✅ [TweetScoutService] getScore: Successfully retrieved customized score data',
      );

      return customResponse;
    } catch (error) {
      this.logger.error(
        { error, username },
        '🔴 [TweetScoutService] getScore: Error fetching Twitter score from free API',
      );

      // Return empty response with default values in case of error
      return {
        number: 0,
        fake_percent: '0.00',
        followersCount: 0,
        score: '0',
        top_followers: [] as Array<{ twitter: string; name: string }>,
        followers: {
          value: '0',
          fakes: '0',
        },
        usernames: [],
        feed_items_count: 0,
      };
    }
  }
}
