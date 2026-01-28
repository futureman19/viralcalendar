import { redditApi } from './redditApi';
import type { ViralEvent, DayData, ContentType } from '../types';

// Major news and viral subreddits
export const NEWS_SUBREDDITS = [
  'worldnews',
  'news',
  'politics',
  'science',
  'technology',
  'nottheonion',
  'UpliftingNews',
  'TrueReddit',
  'newsbot',
  'inthenews'
];



interface HistoricalImportOptions {
  timeframes?: ('day' | 'week' | 'month' | 'year' | 'all')[];
  minScore?: number;
  maxPosts?: number;
  contentTypes?: ContentType[];
  subreddits?: string[];
}

export interface ImportProgress {
  total: number;
  current: number;
  subreddit: string;
  postsFound: number;
}

export class RedditHistoricalImporter {
  private onProgress?: (progress: ImportProgress) => void;
  private importedData: Record<string, DayData> = {};

  constructor(onProgress?: (progress: ImportProgress) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Import historical top posts from news subreddits
   */
  async importHistoricalData(
    options: HistoricalImportOptions = {}
  ): Promise<Record<string, DayData>> {
    const {
      timeframes = ['month', 'year', 'all'],
      minScore = 1000,
      maxPosts = 500,
      subreddits = NEWS_SUBREDDITS
    } = options;

    this.importedData = {};
    let totalProcessed = 0;

    // Process each timeframe
    for (const timeframe of timeframes) {
      if (totalProcessed >= maxPosts) break;

      // Import from selected subreddits
      for (let i = 0; i < subreddits.length; i++) {
        const subreddit = subreddits[i];
        
        this.onProgress?.({
          total: subreddits.length * timeframes.length,
          current: i + 1 + (timeframes.indexOf(timeframe) * subreddits.length),
          subreddit: `${subreddit} (${timeframe})`,
          postsFound: Object.keys(this.importedData).length
        });

        try {
          const posts = await redditApi.getSubredditPosts(subreddit, {
            sort: 'top',
            limit: 25,
            timeframe
          });

          // Filter and process posts
          const filteredPosts = posts.filter(post => post.postCount >= minScore);
          this.processPosts(filteredPosts);
          
          totalProcessed += filteredPosts.length;

          // Rate limit protection - wait between requests
          await this.delay(2000);

          if (totalProcessed >= maxPosts) break;
        } catch (error) {
          console.warn(`Failed to import from r/${subreddit}:`, error);
          continue;
        }
      }
    }

    // Also fetch from r/all for broader viral content
    try {
      this.onProgress?.({
        total: subreddits.length * timeframes.length + 1,
        current: subreddits.length * timeframes.length + 1,
        subreddit: 'r/all (all time viral)',
        postsFound: Object.keys(this.importedData).length
      });

      const allTimeTop = await redditApi.getPopularPosts({
        limit: 50,
        timeframe: 'all'
      });

      const filtered = allTimeTop.filter(post => post.postCount >= minScore * 2);
      this.processPosts(filtered);
    } catch (error) {
      console.warn('Failed to import from r/all:', error);
    }

    return this.importedData;
  }

  /**
   * Import specific date range (approximate using Reddit's top with timeframes)
   */
  async importDateRange(
    startDate: Date,
    endDate: Date,
    options: { minScore?: number } = {}
  ): Promise<Record<string, DayData>> {
    const { minScore = 500 } = options;
    this.importedData = {};

    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Determine best timeframe based on date range
    let timeframe: 'day' | 'week' | 'month' | 'year' = 'day';
    if (diffDays > 365) timeframe = 'year';
    else if (diffDays > 30) timeframe = 'month';
    else if (diffDays > 7) timeframe = 'week';

    // Fetch from news subreddits
    for (const subreddit of NEWS_SUBREDDITS.slice(0, 5)) {
      try {
        const posts = await redditApi.getSubredditPosts(subreddit, {
          sort: 'top',
          limit: 25,
          timeframe
        });

        // Filter by approximate date range
        const filteredPosts = posts.filter(post => {
          if (post.postCount < minScore) return false;
          return true;
        });

        this.processPosts(filteredPosts);
        await this.delay(1000);
      } catch (error) {
        console.warn(`Failed to import from r/${subreddit}:`, error);
      }
    }

    return this.importedData;
  }

  /**
   * Search and import specific topics
   */
  async importByTopic(
    queries: string[],
    options: { minScore?: number; limit?: number } = {}
  ): Promise<Record<string, DayData>> {
    const { minScore = 500, limit = 25 } = options;
    this.importedData = {};

    for (const query of queries) {
      try {
        const posts = await redditApi.searchPosts(query, {
          sort: 'top',
          limit,
          timeframe: 'all'
        });

        const filtered = posts.filter(post => post.postCount >= minScore);
        this.processPosts(filtered);
        await this.delay(1000);
      } catch (error) {
        console.warn(`Failed to search for "${query}":`, error);
      }
    }

    return this.importedData;
  }

  /**
   * Process posts and organize by date
   * Note: Reddit API doesn't give exact creation dates in the basic endpoint,
   * so we group by fetched date or estimate based on timeframe
   */
  private processPosts(posts: ViralEvent[]): void {
    posts.forEach(post => {
      // Since we don't have exact dates from the API response,
      // we'll distribute them across recent dates or use the current date
      // In a production app, you'd want to fetch the actual created_utc timestamp
      
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0];

      if (!this.importedData[dateStr]) {
        this.importedData[dateStr] = {
          date: dateStr,
          events: [],
          hasViralContent: false,
          topHashtag: undefined
        };
      }

      // Avoid duplicates
      const exists = this.importedData[dateStr].events.some(e => e.id === post.id);
      if (!exists) {
        this.importedData[dateStr].events.push(post);
        this.importedData[dateStr].hasViralContent = true;
        
        // Update top hashtag
        if (!this.importedData[dateStr].topHashtag || post.trendingRank === 1) {
          this.importedData[dateStr].topHashtag = post.hashtag;
        }
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get newsworthy posts only
   */
  filterNewsOnly(data: Record<string, DayData>): Record<string, DayData> {
    const filtered: Record<string, DayData> = {};

    Object.entries(data).forEach(([dateStr, dayData]) => {
      const newsEvents = dayData.events.filter(event => 
        event.type === 'news' || 
        event.hashtag?.includes('worldnews') ||
        event.hashtag?.includes('news') ||
        event.hashtag?.includes('politics') ||
        event.hashtag?.includes('science')
      );

      if (newsEvents.length > 0) {
        filtered[dateStr] = {
          ...dayData,
          events: newsEvents.sort((a, b) => a.trendingRank - b.trendingRank)
        };
      }
    });

    return filtered;
  }

  /**
   * Save imported data to localStorage
   */
  saveToStorage(data: Record<string, DayData>): void {
    try {
      const existing = localStorage.getItem('redditHistoricalData');
      const existingData = existing ? JSON.parse(existing) : {};
      
      const merged = { ...existingData, ...data };
      localStorage.setItem('redditHistoricalData', JSON.stringify(merged));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Load imported data from localStorage
   */
  loadFromStorage(): Record<string, DayData> {
    try {
      const stored = localStorage.getItem('redditHistoricalData');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return {};
    }
  }

  /**
   * Clear stored data
   */
  clearStorage(): void {
    localStorage.removeItem('redditHistoricalData');
  }
}

// Export singleton
export const redditImporter = new RedditHistoricalImporter();
