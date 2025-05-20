import { Injectable, Inject, OnApplicationBootstrap } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import Redis from 'ioredis';
import { CustomTwitterScore } from '../../../interfaces/twitter-analytics.interface';

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
    'yiaXLCQALDKPWzzA.wGIKlKWeab362Udo7aAAy6KPsY-1747379529-1.2.1.1-ufRmZZ7CPXnqDbDDJbxUrbJrdvsrxqXHfGzv_o5MbIsTGp8C6h25WU6wckwPfav8ieNY7QIvNWJcREnQGEFodTeQ0ck6_nKMefS_ucrVoSX1Oio3QoCFvMTC5k55d55A3rXp9dXD6PgVJIv2_OWsUwcC8Pz3rd7tmFEGRtlq2TzAVr0Dbnk6PLOQuO5HLFjxm1Tmwu3g2NLet_VBIVEfUwUUTVab6o3eeVJzQbo28WBFDGCcc_bUnLhqNb5eWd3X5DbPeu58.C3C5E3sadorTTtDJ3NJ1ybzrV2hTN46ut4nFJQVxFTMJuNu37gAeqtc1cWgWXwsCxFKBVEY7M.UxmXS4a05Qiq3qhzGDjfwx2ISV97hlNQv2WfdQ4HLkeIY';

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

      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
            cookie: `cf_clearance=${this.cfClearance}; _ga=GA1.1.349222678.1747379538; _ym_uid=17307197866784975; _ym_d=1747379540; _ga_68HC5D2CLK=GS2.1.s1747502702$o2$g0$t1747502702$j0$l0$h0`,
            priority: 'u=1, i',
            referer: `https://app.tweetscout.io/search?q=${username}`,
            'sec-ch-ua':
              '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          },
        }),
      );

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
