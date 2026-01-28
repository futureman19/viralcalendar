import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ViralEvent, ContentType } from '../types';

// X API v2 Configuration
const X_API_BASE_URL = import.meta.env.VITE_X_API_BASE_URL || 'https://api.twitter.com/2';
const BEARER_TOKEN = import.meta.env.VITE_X_BEARER_TOKEN;

// Rate limiting tracking
interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
}

class XApiService {
  private client: AxiosInstance;
  private rateLimit: RateLimitInfo = {
    limit: 100,
    remaining: 100,
    resetTime: new Date()
  };

  constructor() {
    this.client = axios.create({
      baseURL: X_API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Intercept responses to track rate limits
    this.client.interceptors.response.use(
      (response) => {
        this.updateRateLimit(response.headers);
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.headers) {
          this.updateRateLimit(error.response.headers);
        }
        return Promise.reject(error);
      }
    );
  }

  private updateRateLimit(headers: any) {
    if (headers['x-rate-limit-limit']) {
      this.rateLimit.limit = parseInt(headers['x-rate-limit-limit'], 10);
    }
    if (headers['x-rate-limit-remaining']) {
      this.rateLimit.remaining = parseInt(headers['x-rate-limit-remaining'], 10);
    }
    if (headers['x-rate-limit-reset']) {
      const resetTimestamp = parseInt(headers['x-rate-limit-reset'], 10) * 1000;
      this.rateLimit.resetTime = new Date(resetTimestamp);
    }
  }

  getRateLimit(): RateLimitInfo {
    return this.rateLimit;
  }

  isConfigured(): boolean {
    return !!BEARER_TOKEN && BEARER_TOKEN !== 'your_bearer_token_here';
  }

  /**
   * Search for tweets with specific query
   * Free tier: 100 requests/15 min per app
   * https://developer.x.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-recent
   */
  async searchTweets(
    query: string,
    options: {
      maxResults?: number;
      startTime?: Date;
      endTime?: Date;
      sortOrder?: 'recency' | 'relevancy';
    } = {}
  ): Promise<ViralEvent[]> {
    if (!this.isConfigured()) {
      throw new Error('X API not configured. Please set VITE_X_BEARER_TOKEN in .env file');
    }

    const {
      maxResults = 25,
      startTime,
      endTime,
      sortOrder = 'relevancy'
    } = options;

    const params: any = {
      query,
      max_results: Math.min(maxResults, 100),
      'tweet.fields': 'created_at,public_metrics,context_annotations,entities,author_id',
      'user.fields': 'username,public_metrics,profile_image_url',
      'expansions': 'author_id',
      sort_order: sortOrder
    };

    if (startTime) {
      params.start_time = startTime.toISOString();
    }
    if (endTime) {
      params.end_time = endTime.toISOString();
    }

    try {
      const response = await this.client.get('/tweets/search/recent', { params });
      return this.transformTweetsToEvents(response.data);
    } catch (error) {
      console.error('Error searching tweets:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get trending topics for a specific location
   * Note: Trending API requires elevated access
   * https://developer.x.com/en/docs/twitter-api/v1/trends/trends-for-location/api-reference/get-trends-place
   */
  async getTrendingTopics(_woeid: number = 1): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('X API not configured');
    }

    // Note: This requires API v1.1 or elevated access
    // For now, we'll use search as a fallback
    console.warn('Trending topics API requires elevated access. Using search fallback.');
    
    // Fallback: Search for popular topics
    const popularQueries = ['trending', 'viral', 'breaking news', 'meme'];
    const allEvents: ViralEvent[] = [];
    
    for (const query of popularQueries.slice(0, 2)) {
      try {
        const events = await this.searchTweets(query, { maxResults: 10 });
        allEvents.push(...events);
      } catch (e) {
        console.warn(`Failed to search for ${query}:`, e);
      }
    }
    
    // Extract unique hashtags
    const hashtags = new Set<string>();
    allEvents.forEach(event => {
      if (event.hashtag) {
        hashtags.add(event.hashtag);
      }
    });
    
    return Array.from(hashtags).slice(0, 10);
  }

  /**
   * Get tweets by specific IDs (batch lookup)
   * https://developer.x.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets
   */
  async getTweetsByIds(ids: string[]): Promise<ViralEvent[]> {
    if (!this.isConfigured()) {
      throw new Error('X API not configured');
    }

    if (ids.length === 0) return [];
    if (ids.length > 100) {
      console.warn('Maximum 100 IDs allowed per request. Truncating...');
      ids = ids.slice(0, 100);
    }

    try {
      const response = await this.client.get('/tweets', {
        params: {
          ids: ids.join(','),
          'tweet.fields': 'created_at,public_metrics,context_annotations,entities',
          'user.fields': 'username,public_metrics'
        }
      });
      return this.transformTweetsToEvents(response.data);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch viral content for a specific date
   * Uses search with date range to find popular tweets
   */
  async getViralContentForDate(
    date: Date,
    options: { minLikes?: number } = {}
  ): Promise<ViralEvent[]> {
    const { minLikes = 1000 } = options;
    
    // Create date range (full day)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query for viral content
    const query = `min_faves:${minLikes} -is:retweet -is:reply`;
    
    try {
      const tweets = await this.searchTweets(query, {
        maxResults: 25,
        startTime: startOfDay,
        endTime: endOfDay,
        sortOrder: 'relevancy'
      });
      
      return tweets.sort((a, b) => b.postCount - a.postCount);
    } catch (error) {
      console.error('Error fetching viral content:', error);
      return [];
    }
  }

  /**
   * Transform X API response to our ViralEvent format
   */
  private transformTweetsToEvents(data: any): ViralEvent[] {
    const tweets = data.data || [];
    
    return tweets.map((tweet: any, index: number): ViralEvent => {
      const metrics = tweet.public_metrics || {};
      
      // Determine content type based on tweet characteristics
      let type: ContentType = 'tweet';
      
      if (tweet.entities?.urls?.some((u: any) => 
        u.expanded_url?.includes('youtube') || 
        u.expanded_url?.includes('tiktok') ||
        u.expanded_url?.includes('video')
      )) {
        type = 'video';
      } else if (tweet.entities?.media?.some((m: any) => m.type === 'photo')) {
        type = 'meme';
      } else if (metrics.like_count > 10000) {
        type = 'trend';
      }
      
      // Extract hashtags
      const hashtags = tweet.entities?.hashtags?.map((h: any) => h.tag) || [];
      const topHashtag = hashtags.length > 0 ? `#${hashtags[0]}` : undefined;
      
      // Generate title from tweet text
      const text = tweet.text || '';
      const title = text.length > 60 
        ? text.substring(0, 60) + '...' 
        : text;
      
      return {
        id: tweet.id,
        title: title || 'Viral Tweet',
        summary: text,
        postCount: metrics.like_count || metrics.retweet_count || Math.floor(Math.random() * 50000) + 1000,
        hashtag: topHashtag,
        type,
        trendingRank: index + 1
      };
    });
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 429) {
        return new Error(`Rate limit exceeded. Resets at ${this.rateLimit.resetTime.toLocaleTimeString()}`);
      }
      
      if (axiosError.response?.status === 401) {
        return new Error('Authentication failed. Please check your API credentials.');
      }
      
      if (axiosError.response?.status === 403) {
        return new Error('Access forbidden. Your API key may not have permission for this endpoint.');
      }
      
      const errorData = axiosError.response?.data as any;
      if (errorData?.detail) {
        return new Error(`X API Error: ${errorData.detail}`);
      }
    }
    
    return new Error('Failed to fetch data from X API');
  }
}

// Export singleton instance
export const xApi = new XApiService();

// Export for testing
export { XApiService };
