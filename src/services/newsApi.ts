import axios, { type AxiosInstance } from 'axios';
import type { ViralEvent, ContentType } from '../types';

// NewsAPI.org Configuration
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

// Popular news sources by category
const NEWS_SOURCES = {
  general: [
    'bbc-news', 'cnn', 'reuters', 'associated-press', 'the-wall-street-journal',
    'the-washington-post', 'usa-today', 'abc-news', 'cbs-news', 'nbc-news'
  ],
  tech: [
    'techcrunch', 'the-verge', 'wired', 'ars-technica', 'engadget',
    'gizmodo', 'hacker-news', 'polygon', 'recode'
  ],
  science: [
    'national-geographic', 'new-scientist', 'next-big-future', 'scientific-american'
  ],
  business: [
    'bloomberg', 'business-insider', 'fortune', 'financial-post'
  ],
  entertainment: [
    'buzzfeed', 'entertainment-weekly', 'mtv-news', 'the-lad-bible'
  ]
};

interface NewsApiArticle {
  source: { id: string; name: string };
  author: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
}

class NewsApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: NEWS_API_BASE_URL,
      timeout: 15000
    });
  }

  isConfigured(): boolean {
    return !!NEWS_API_KEY && NEWS_API_KEY !== 'your_news_api_key_here';
  }

  /**
   * Get top headlines
   * Free tier: 100 requests/day
   */
  async getTopHeadlines(
    options: {
      category?: 'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology';
      sources?: string[];
      pageSize?: number;
    } = {}
  ): Promise<ViralEvent[]> {
    if (!this.isConfigured()) {
      throw new Error('NewsAPI not configured. Please set VITE_NEWS_API_KEY');
    }

    const { category, sources, pageSize = 20 } = options;

    try {
      const response = await this.client.get('/top-headlines', {
        params: {
          apiKey: NEWS_API_KEY,
          category,
          sources: sources?.join(','),
          pageSize: Math.min(pageSize, 100),
          language: 'en'
        }
      });

      return this.transformArticlesToEvents(response.data?.articles || []);
    } catch (error) {
      console.error('Error fetching top headlines:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Search all articles
   * Free tier: 100 requests/day, last 30 days only
   */
  async searchNews(
    query: string,
    options: {
      from?: Date;
      to?: Date;
      sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
      pageSize?: number;
    } = {}
  ): Promise<ViralEvent[]> {
    if (!this.isConfigured()) {
      throw new Error('NewsAPI not configured');
    }

    const { from, to, sortBy = 'popularity', pageSize = 20 } = options;

    try {
      const params: any = {
        apiKey: NEWS_API_KEY,
        q: query,
        sortBy,
        pageSize: Math.min(pageSize, 100),
        language: 'en'
      };

      if (from) params.from = from.toISOString().split('T')[0];
      if (to) params.to = to.toISOString().split('T')[0];

      const response = await this.client.get('/everything', {
        params
      });

      return this.transformArticlesToEvents(response.data?.articles || []);
    } catch (error) {
      console.error('Error searching news:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get everything from specific sources
   */
  async getFromSources(
    sources: string[],
    options: {
      pageSize?: number;
      from?: Date;
    } = {}
  ): Promise<ViralEvent[]> {
    if (!this.isConfigured()) {
      throw new Error('NewsAPI not configured');
    }

    const { pageSize = 20, from } = options;

    try {
      const params: any = {
        apiKey: NEWS_API_KEY,
        sources: sources.slice(0, 20).join(','), // Max 20 sources per request
        pageSize: Math.min(pageSize, 100),
        language: 'en',
        sortBy: 'popularity'
      };

      if (from) params.from = from.toISOString().split('T')[0];

      const response = await this.client.get('/everything', {
        params
      });

      return this.transformArticlesToEvents(response.data?.articles || []);
    } catch (error) {
      console.error('Error fetching from sources:', error);
      return [];
    }
  }

  /**
   * Get viral news for a specific date
   * Uses popularity sort to find trending articles
   */
  async getViralNewsForDate(
    date: Date,
    options: { category?: string } = {}
  ): Promise<ViralEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const articles: ViralEvent[] = [];

      // Get general news
      const generalNews = await this.getTopHeadlines({ 
        category: options.category as any || 'general',
        pageSize: 20 
      });
      articles.push(...generalNews);

      // Also search for trending topics
      const trendingTerms = ['breaking', 'viral', 'trending', 'popular'];
      for (const term of trendingTerms.slice(0, 2)) {
        try {
          const searchResults = await this.searchNews(term, {
            from: startOfDay,
            to: endOfDay,
            sortBy: 'popularity',
            pageSize: 10
          });
          articles.push(...searchResults);
        } catch (e) {
          // Continue if search fails
        }
      }

      // Remove duplicates by URL
      const unique = new Map<string, ViralEvent>();
      articles.forEach(article => unique.set(article.id, article));

      return Array.from(unique.values())
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 25);
    } catch (error) {
      console.error('Error fetching viral news:', error);
      return [];
    }
  }

  /**
   * Transform NewsAPI article to ViralEvent
   */
  private transformArticlesToEvents(articles: NewsApiArticle[]): ViralEvent[] {
    return articles.map((article, index): ViralEvent => {
      // Determine content type based on source
      let type: ContentType = 'news';
      const sourceName = article.source?.name?.toLowerCase() || '';

      if (sourceName.includes('tech') || sourceName.includes('verge') || sourceName.includes('wired')) {
        type = 'news'; // Tech news
      } else if (sourceName.includes('buzzfeed') || sourceName.includes('reddit') || sourceName.includes('imgur')) {
        type = 'meme';
      } else if (article.title?.toLowerCase().includes('video') || article.description?.toLowerCase().includes('video')) {
        type = 'video';
      }

      // Generate viral score based on recency (newer = higher)
      const publishedDate = new Date(article.publishedAt);
      const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
      const viralScore = Math.max(1000, Math.floor(50000 / (hoursAgo + 1)));

      return {
        id: `newsapi-${article.url || index}`,
        title: article.title?.substring(0, 80) || 'News Article',
        summary: article.description || article.content?.substring(0, 200) || article.title || '',
        postCount: viralScore,
        hashtag: `#${article.source?.name?.replace(/\s+/g, '') || 'News'}`,
        type,
        trendingRank: index + 1
      };
    });
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        return new Error('Invalid API key. Please check your NewsAPI key.');
      }
      
      if (status === 429) {
        return new Error('Rate limit exceeded. Free tier allows 100 requests/day.');
      }

      if (status === 426) {
        return new Error('This endpoint requires a paid plan.');
      }

      if (data?.message) {
        return new Error(`NewsAPI: ${data.message}`);
      }
    }

    return new Error('Failed to fetch news from NewsAPI');
  }
}

// Export singleton
export const newsApi = new NewsApiService();

// Export sources list
export { NEWS_SOURCES };
