import axios, { type AxiosInstance } from 'axios';
import type { ViralEvent, ContentType } from '../types';

// Reddit API Configuration
const REDDIT_BASE_URL = 'https://www.reddit.com';

// Subreddits to track for viral content
const VIRAL_SUBREDDITS = [
  'all',
  'popular',
  'trending',
  'worldnews',
  'technology',
  'funny',
  'memes',
  'videos',
  'news',
  'entertainment',
  'sports',
  'gaming',
  'science'
];

// Rate limiting tracking
interface RateLimitInfo {
  remaining: number;
  resetTime: Date;
  used: number;
}

class RedditApiService {
  private client: AxiosInstance;
  private rateLimit: RateLimitInfo = {
    remaining: 100,
    resetTime: new Date(),
    used: 0
  };

  constructor() {
    this.client = axios.create({
      baseURL: REDDIT_BASE_URL,
      headers: {
        'User-Agent': 'ViralCalendar/1.0 (by /u/viralcalendar)'
      },
      timeout: 15000
    });

    // Intercept responses to track rate limits
    this.client.interceptors.response.use(
      (response) => {
        this.updateRateLimit(response.headers);
        return response;
      },
      (error) => {
        if (error.response?.headers) {
          this.updateRateLimit(error.response.headers);
        }
        return Promise.reject(error);
      }
    );
  }

  private updateRateLimit(headers: any) {
    // Reddit uses X-RateLimit headers
    if (headers['x-ratelimit-remaining']) {
      this.rateLimit.remaining = parseInt(headers['x-ratelimit-remaining'], 10);
    }
    if (headers['x-ratelimit-used']) {
      this.rateLimit.used = parseInt(headers['x-ratelimit-used'], 10);
    }
    if (headers['x-ratelimit-reset']) {
      // Reset timestamp in seconds
      const resetTimestamp = parseInt(headers['x-ratelimit-reset'], 10) * 1000;
      this.rateLimit.resetTime = new Date(resetTimestamp);
    }
  }

  getRateLimit(): RateLimitInfo {
    return this.rateLimit;
  }

  /**
   * Get popular posts from r/all or r/popular
   * This is the main endpoint for viral content
   */
  async getPopularPosts(
    options: {
      limit?: number;
      timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
      after?: string;
    } = {}
  ): Promise<ViralEvent[]> {
    const { limit = 25, timeframe = 'day', after } = options;

    try {
      const response = await this.client.get('/r/all/top.json', {
        params: {
          limit: Math.min(limit, 100),
          t: timeframe,
          after
        }
      });

      return this.transformPostsToEvents(response.data?.data?.children || []);
    } catch (error) {
      console.error('Error fetching popular posts:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get posts from a specific subreddit
   */
  async getSubredditPosts(
    subreddit: string,
    options: {
      sort?: 'hot' | 'new' | 'top' | 'rising';
      limit?: number;
      timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    } = {}
  ): Promise<ViralEvent[]> {
    const { sort = 'hot', limit = 25, timeframe = 'day' } = options;

    try {
      const params: any = {
        limit: Math.min(limit, 100)
      };

      if (sort === 'top') {
        params.t = timeframe;
      }

      const response = await this.client.get(`/r/${subreddit}/${sort}.json`, {
        params
      });

      return this.transformPostsToEvents(response.data?.data?.children || []);
    } catch (error) {
      console.error(`Error fetching r/${subreddit}:`, error);
      return []; // Return empty for private/banned subreddits
    }
  }

  /**
   * Search Reddit for posts
   */
  async searchPosts(
    query: string,
    options: {
      limit?: number;
      sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
      timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    } = {}
  ): Promise<ViralEvent[]> {
    const { limit = 25, sort = 'relevance', timeframe = 'all' } = options;

    try {
      const response = await this.client.get('/search.json', {
        params: {
          q: query,
          limit: Math.min(limit, 100),
          sort,
          t: timeframe,
          type: 'link'
        }
      });

      return this.transformPostsToEvents(response.data?.data?.children || []);
    } catch (error) {
      console.error('Error searching Reddit:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get trending subreddits
   */
  async getTrendingSubreddits(): Promise<string[]> {
    try {
      const response = await this.client.get('/subreddits/default.json', {
        params: { limit: 20 }
      });

      const subreddits = response.data?.data?.children || [];
      return subreddits.map((sub: any) => sub.data?.display_name).filter(Boolean);
    } catch (error) {
      console.error('Error fetching trending subreddits:', error);
      return VIRAL_SUBREDDITS.slice(0, 10);
    }
  }

  /**
   * Fetch viral content for a specific date
   * Reddit doesn't have exact date search, so we use timeframe
   */
  async getViralContentForDate(
    date: Date,
    options: { minScore?: number } = {}
  ): Promise<ViralEvent[]> {
    const { minScore = 1000 } = options;

    // Determine timeframe based on date
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'all';
    if (diffDays <= 1) timeframe = 'day';
    else if (diffDays <= 7) timeframe = 'week';
    else if (diffDays <= 30) timeframe = 'month';
    else if (diffDays <= 365) timeframe = 'year';

    try {
      // Get posts from multiple sources
      const allPosts: ViralEvent[] = [];

      // From r/all/top
      const popularPosts = await this.getPopularPosts({
        limit: 25,
        timeframe
      });
      allPosts.push(...popularPosts);

      // From a few key subreddits
      for (const sub of ['worldnews', 'technology', 'funny'].slice(0, 2)) {
        try {
          const subPosts = await this.getSubredditPosts(sub, {
            sort: 'top',
            limit: 10,
            timeframe
          });
          allPosts.push(...subPosts);
        } catch (e) {
          // Skip if subreddit fails
        }
      }

      // Filter by minimum score and remove duplicates
      const uniquePosts = new Map<string, ViralEvent>();
      allPosts
        .filter(post => post.postCount >= minScore)
        .forEach(post => uniquePosts.set(post.id, post));

      return Array.from(uniquePosts.values())
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 25);
    } catch (error) {
      console.error('Error fetching viral content:', error);
      return [];
    }
  }

  /**
   * Transform Reddit post to ViralEvent format
   */
  private transformPostsToEvents(posts: any[]): ViralEvent[] {
    return posts.map((post: any, index: number): ViralEvent => {
      const data = post.data || {};
      
      // Determine content type based on post characteristics
      let type: ContentType = 'news';
      
      if (data.is_video || data.domain?.includes('youtu') || data.domain?.includes('v.redd.it')) {
        type = 'video';
      } else if (data.domain?.includes('i.redd.it') || data.domain?.includes('imgur')) {
        type = 'meme';
      } else if (data.domain?.includes('twitter.com') || data.domain?.includes('x.com')) {
        type = 'tweet';
      } else if (data.score > 50000) {
        type = 'trend';
      }

      // Extract subreddit as hashtag
      const subreddit = data.subreddit ? `#r/${data.subreddit}` : undefined;

      // Create title from post title
      const title = data.title || 'Reddit Post';
      const truncatedTitle = title.length > 80 ? title.substring(0, 80) + '...' : title;

      return {
        id: data.id || `reddit-${index}`,
        title: truncatedTitle,
        summary: title,
        postCount: data.score || 0,
        hashtag: subreddit,
        type,
        trendingRank: index + 1
      };
    });
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      
      if (status === 429) {
        return new Error(`Rate limit exceeded. Resets in ${Math.ceil((this.rateLimit.resetTime.getTime() - Date.now()) / 1000)}s`);
      }
      
      if (status === 403) {
        return new Error('Access forbidden. User-Agent may be required.');
      }
      
      if (status === 404) {
        return new Error('Subreddit not found or private.');
      }

      const errorData = error.response?.data;
      if (errorData?.message) {
        return new Error(`Reddit API: ${errorData.message}`);
      }
    }
    
    return new Error('Failed to fetch data from Reddit');
  }
}

// Export singleton instance
export const redditApi = new RedditApiService();

// Export for testing
export { RedditApiService };
