export interface TwitterAccountAnalytics {
  // Main account info
  id: string;
  twitterId: string;
  twitter: string;
  name: string;
  avatar: string;
  number: number;
  description_account: string;
  followersCount: number;
  score: {
    value: string;
    delta: {
      type: string;
      value: string;
    };
  };
  in_watchlist: boolean;
  tags: Array<{
    id: string;
    name: string;
  }>;
  
  // Social metrics and follower categories
  followers: {
    value: string;
    delta: {
      type: string;
      value: string;
    };
    fakes: string;
    list: Array<{
      id: string;
      type: string; // "infl", "proj", "fund"
      count: string;
      delta: {
        type: string;
        value: string;
      };
      followers: FollowerEntity[];
    }>;
  };
  
  // Influential followers data
  top_followers: {
    delta: string;
    mov: string;
    title: string;
    type: string;
    value: number;
    accounts: InfluencerAccount[];
  };
  
  // Recent followers by date
  recent_followers: Array<{
    date: string;
    followers: FollowerInfo[];
  }>;
  
  // Activity metrics
  activity: {
    value: string;
    delta: {
      type: string;
      value: string;
    };
    analytics: ActivityMetric[];
  };
  
  // Screen name change tracking
  screen_name_changed: boolean;
}

// Simplified response for getScore function
export interface SimplifiedTwitterScore {
  score: {
    value: string;
    delta: {
      type: string;
      value: string;
    };
  };
  top_followers: {
    delta: string;
    mov: string;
    title: string;
    type: string;
    value: number;
    accounts: InfluencerAccount[];
  };
  followers: {
    value: string;
    delta: {
      type: string;
      value: string;
    };
    fakes: string;
    list: Array<{
      id: string;
      type: string;
      count: string;
      delta: {
        type: string;
        value: string;
      };
      followers: FollowerEntity[];
    }>;
  };
  screen_name_changed: boolean;
}

// Custom response format with specific fields
export interface CustomTwitterScore {
  // Basic account metrics
  number: number;
  fake_percent: string;
  followersCount: number;
  
  // Score value
  score: string;
  
  // Only the influencers with twitter and name
  top_followers: Array<{
    twitter: string;
    name: string;
  }>;
  
  // Follower metrics
  followers: {
    value: string;
    fakes: string;
  };
  
  // Username history
  usernames: Array<{
    screen_name: string;
    date: string;
  }>;
  
  // Activity count
  feed_items_count: number;
}

// Follower entity in the main follower list
export interface FollowerEntity {
  id: string;
  name: string;
  avatar: string;
  twitter: string;
  score: number;
  category: {
    id: string;
    name: string;
  };
  listType: string | null;
  follow: boolean | null;
  funds: Array<{
    screen_name: string;
    name: string;
    avatar: string;
    score: string;
  }>;
}

// Top influencer account structure
export interface InfluencerAccount {
  id: string;
  name: string;
  avatar: string;
  twitter: string;
  score: number;
  category: {
    id: string;
    name: string;
  };
  listType: string | null;
  follow: boolean | null;
  funds: Array<any>;
}

// Individual follower information
export interface FollowerInfo {
  avatar: string;
  name: string;
  twitter: string;
  score: string;
  followers: number;
  base_followers: number;
  tags: string;
  description: string;
}

// Activity metric structure
export interface ActivityMetric {
  id: number;
  type: string; // "like", "retweet", "comment", "mention"
  move: string;
  count: string;
  items: Array<{
    name: string;
    name_x: string;
    value: number;
  }>;
}

// Project data structure
export interface ProjectData {
  id: string;
  name: string;
  avatar: string;
  twitter: string;
  score: number;
  category: {
    id: string;
    name: string;
  };
  listType: string | null;
  follow: boolean | null;
  funds: any[];
}

// Score history data
export interface ScoreHistory {
  date: string;
  baseFollowersCount: {
    delta: number;
    value: number;
  };
  followersCount: {
    delta: number;
    value: number;
  };
  friendsCount: {
    delta: number;
    value: number;
  };
  score: {
    delta: number;
    value: number;
  };
} 