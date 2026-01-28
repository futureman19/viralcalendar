import axios from 'axios';
import type { ViralEvent, ContentType } from '../types';

// Hacker News API - Completely free, no API key required
const HN_BASE_URL = 'https://hacker-news.firebaseio.com/v0';
const HN_ITEM_URL = (id: number) => `${HN_BASE_URL}/item/${id}.json`;
const HN_TOP_STORIES_URL = `${HN_BASE_URL}/topstories.json`;
const HN_BEST_STORIES_URL = `${HN_BASE_URL}/beststories.json`;


interface HNItem {
  id: number;
  title: string;
  url?: string;
  text?: string;
  by: string;
  time: number;
  score: number;
  descendants?: number; // comment count
  type: 'story' | 'comment' | 'job' | 'poll';
  kids?: number[]; // comment IDs
}

class HackerNewsService {
  /**
   * Get top stories
   */
  async getTopStories(limit: number = 30): Promise<ViralEvent[]> {
    try {
      // Get top story IDs
      const response = await axios.get(HN_TOP_STORIES_URL, { timeout: 10000 });
      const storyIds: number[] = response.data?.slice(0, limit) || [];

      // Fetch details for each story
      const stories = await Promise.all(
        storyIds.map(id => this.getItem(id))
      );

      // Filter out nulls and non-story items
      const validStories = stories.filter((s): s is HNItem => 
        s !== null && s.type === 'story'
      );

      return this.transformStoriesToEvents(validStories);
    } catch (error) {
      console.error('Error fetching HN top stories:', error);
      throw new Error('Failed to fetch Hacker News');
    }
  }

  /**
   * Get best stories (most viral/upvoted recently)
   */
  async getBestStories(limit: number = 30): Promise<ViralEvent[]> {
    try {
      const response = await axios.get(HN_BEST_STORIES_URL, { timeout: 10000 });
      const storyIds: number[] = response.data?.slice(0, limit) || [];

      const stories = await Promise.all(
        storyIds.map(id => this.getItem(id))
      );

      const validStories = stories.filter((s): s is HNItem => 
        s !== null && s.type === 'story'
      );

      return this.transformStoriesToEvents(validStories);
    } catch (error) {
      console.error('Error fetching HN best stories:', error);
      return [];
    }
  }

  /**
   * Get stories by date (approximate - we can only get by ID range)
   * HN IDs are sequential, so higher IDs = newer stories
   */
  async getStoriesByDate(
    date: Date,
    options: { minScore?: number } = {}
  ): Promise<ViralEvent[]> {
    const { minScore = 50 } = options;

    try {
      // Get current max item ID to estimate date range
      const maxItemRes = await axios.get(`${HN_BASE_URL}/maxitem.json`, {
        timeout: 10000
      });
      const maxItemId = maxItemRes.data;

      // Approximate items from that date
      // HN creates roughly 20-30 items per hour
      const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60);
      const itemsPerHour = 25;
      const estimatedStartId = Math.floor(maxItemId - (hoursAgo * itemsPerHour));
      const estimatedEndId = estimatedStartId + 500; // Look at next 500 items

      // Fetch a range of items
      const itemIds: number[] = [];
      for (let id = Math.max(1, estimatedStartId); id <= Math.min(maxItemId, estimatedEndId); id++) {
        itemIds.push(id);
      }

      // Fetch in batches to avoid overwhelming the API
      const batchSize = 50;
      const stories: HNItem[] = [];

      for (let i = 0; i < itemIds.length; i += batchSize) {
        const batch = itemIds.slice(i, i + batchSize);
        const batchStories = await Promise.all(
          batch.map(id => this.getItem(id))
        );

        const valid = batchStories.filter((s): s is HNItem => 
          s !== null && 
          s.type === 'story' && 
          s.score >= minScore
        );
        
        stories.push(...valid);
        
        // Small delay between batches
        if (i + batchSize < itemIds.length) {
          await this.delay(100);
        }
      }

      return this.transformStoriesToEvents(stories.slice(0, 30));
    } catch (error) {
      console.error('Error fetching HN stories by date:', error);
      return [];
    }
  }

  /**
   * Search HN stories (via Algolia HN Search API)
   */
  async searchStories(
    query: string,
    options: {
      page?: number;
      hitsPerPage?: number;
    } = {}
  ): Promise<ViralEvent[]> {
    const { page = 0, hitsPerPage = 20 } = options;

    try {
      const response = await axios.get('https://hn.algolia.com/api/v1/search', {
        params: {
          query,
          tags: 'story',
          numericFilters: 'points>50',
          page,
          hitsPerPage
        },
        timeout: 10000
      });

      const hits = response.data?.hits || [];
      
      return hits.map((hit: any, index: number): ViralEvent => {
        return {
          id: `hn-${hit.objectID}`,
          title: hit.title?.substring(0, 80) || 'Hacker News Post',
          summary: hit.story_text?.substring(0, 200) || hit.url || '',
          postCount: hit.points || 0,
          hashtag: '#HackerNews',
          type: 'news',
          trendingRank: index + 1
        };
      });
    } catch (error) {
      console.error('Error searching HN:', error);
      return [];
    }
  }

  /**
   * Get a specific item by ID
   */
  private async getItem(id: number): Promise<HNItem | null> {
    try {
      const response = await axios.get(HN_ITEM_URL(id), {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Transform HN story to ViralEvent
   */
  private transformStoriesToEvents(stories: HNItem[]): ViralEvent[] {
    return stories
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((story, index): ViralEvent => {
        // Determine if it's a technical/code-related post
        const title = story.title?.toLowerCase() || '';
        const url = story.url?.toLowerCase() || '';
        
        let type: ContentType = 'news';
        if (url.includes('github.com') || title.includes('github') || 
            title.includes('open source') || title.includes('release')) {
          type = 'news'; // Tech news
        } else if (title.includes('show hn') || title.includes('ask hn')) {
          type = 'trend';
        }

        // Calculate engagement score (upvotes + comments)
        const engagement = (story.score || 0) + (story.descendants || 0) * 2;

        return {
          id: `hn-${story.id}`,
          title: story.title?.substring(0, 80) || 'Hacker News Story',
          summary: story.text?.substring(0, 200) || story.url || '',
          postCount: engagement,
          hashtag: '#HackerNews',
          type,
          trendingRank: index + 1
        };
      });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
export const hackerNewsApi = new HackerNewsService();
