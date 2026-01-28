import { redditApi } from './redditApi';
import { newsApi } from './newsApi';
import { hackerNewsApi } from './hackerNewsApi';
import type { ViralEvent, DayData } from '../types';

export type NewsSource = 'reddit' | 'newsapi' | 'hackernews' | 'all';

interface AggregatorOptions {
  sources?: NewsSource[];
  newsOnly?: boolean;
  minScore?: number;
  maxResults?: number;
}

interface SourceStatus {
  name: string;
  isAvailable: boolean;
  rateLimitRemaining: number;
}

class NewsAggregator {
  /**
   * Fetch viral content from all configured sources
   */
  async fetchViralContent(
    options: AggregatorOptions = {}
  ): Promise<Record<string, DayData>> {
    const {
      sources = ['reddit', 'hackernews'],
      newsOnly = true,
      minScore = 500,
      maxResults = 100
    } = options;

    const allEvents: ViralEvent[] = [];
    const results: Record<string, DayData> = {};

    // Fetch from Reddit (always available, no API key)
    if (sources.includes('reddit') || sources.includes('all')) {
      try {
        const redditPosts = await redditApi.getPopularPosts({
          limit: 25,
          timeframe: 'day'
        });
        allEvents.push(...redditPosts);

        // Also get from news subreddits
        for (const sub of ['worldnews', 'news', 'technology']) {
          try {
            const posts = await redditApi.getSubredditPosts(sub, {
              sort: 'top',
              limit: 10,
              timeframe: 'day'
            });
            allEvents.push(...posts);
          } catch (e) {
            // Continue on error
          }
        }
      } catch (error) {
        console.warn('Reddit API error:', error);
      }
    }

    // Fetch from NewsAPI (requires API key)
    if ((sources.includes('newsapi') || sources.includes('all')) && newsApi.isConfigured()) {
      try {
        const newsArticles = await newsApi.getTopHeadlines({
          pageSize: 20
        });
        allEvents.push(...newsArticles);
      } catch (error) {
        console.warn('NewsAPI error:', error);
      }
    }

    // Fetch from Hacker News (always available)
    if (sources.includes('hackernews') || sources.includes('all')) {
      try {
        const hnStories = await hackerNewsApi.getTopStories(30);
        allEvents.push(...hnStories);
      } catch (error) {
        console.warn('Hacker News API error:', error);
      }
    }

    // Filter by minimum score
    let filteredEvents = allEvents.filter(e => e.postCount >= minScore);

    // Filter for news only if requested
    if (newsOnly) {
      filteredEvents = filteredEvents.filter(e => 
        e.type === 'news' || 
        e.hashtag?.includes('news') ||
        e.hashtag?.includes('worldnews') ||
        e.hashtag?.includes('technology')
      );
    }

    // Remove duplicates (by title similarity)
    const uniqueEvents = this.removeDuplicates(filteredEvents);

    // Sort by score and limit
    const sortedEvents = uniqueEvents
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, maxResults);

    // Organize by date (current date since we don't have historical dates from all sources)
    const today = new Date().toISOString().split('T')[0];
    results[today] = {
      date: today,
      events: sortedEvents.map((e, i) => ({ ...e, trendingRank: i + 1 })),
      hasViralContent: sortedEvents.length > 0,
      topHashtag: sortedEvents[0]?.hashtag
    };

    return results;
  }

  /**
   * Search across all sources
   */
  async searchAllSources(
    query: string,
    options: { maxResults?: number } = {}
  ): Promise<ViralEvent[]> {
    const { maxResults = 30 } = options;
    const allResults: ViralEvent[] = [];

    // Search Reddit
    try {
      const redditResults = await redditApi.searchPosts(query, {
        sort: 'relevance',
        limit: 15
      });
      allResults.push(...redditResults);
    } catch (e) {
      console.warn('Reddit search failed:', e);
    }

    // Search NewsAPI
    if (newsApi.isConfigured()) {
      try {
        const newsResults = await newsApi.searchNews(query, {
          sortBy: 'popularity',
          pageSize: 15
        });
        allResults.push(...newsResults);
      } catch (e) {
        console.warn('NewsAPI search failed:', e);
      }
    }

    // Search Hacker News
    try {
      const hnResults = await hackerNewsApi.searchStories(query, {
        hitsPerPage: 15
      });
      allResults.push(...hnResults);
    } catch (e) {
      console.warn('HN search failed:', e);
    }

    // Remove duplicates and sort
    const unique = this.removeDuplicates(allResults);
    return unique
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, maxResults);
  }

  /**
   * Get status of all sources
   */
  getSourcesStatus(): SourceStatus[] {
    return [
      {
        name: 'Reddit',
        isAvailable: true,
        rateLimitRemaining: 100 // Reddit has no strict rate limit for read-only
      },
      {
        name: 'NewsAPI',
        isAvailable: newsApi.isConfigured(),
        rateLimitRemaining: newsApi.isConfigured() ? 100 : 0
      },
      {
        name: 'Hacker News',
        isAvailable: true,
        rateLimitRemaining: 1000 // Very generous limits
      }
    ];
  }

  /**
   * Remove duplicate events based on title similarity
   */
  private removeDuplicates(events: ViralEvent[]): ViralEvent[] {
    const seen = new Set<string>();
    const unique: ViralEvent[] = [];

    for (const event of events) {
      // Create a simplified key from the title
      const key = event.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 30);

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(event);
      }
    }

    return unique;
  }
}

// Export singleton
export const newsAggregator = new NewsAggregator();
