import { useState, useCallback, useEffect } from 'react';
import { 
  isSupabaseConfigured, 
  viralEventsApi, 
  dailySummariesApi
} from '../lib/supabase';
import { redditApi } from '../services/redditApi';
import { newsApi } from '../services/newsApi';
import { hackerNewsApi } from '../services/hackerNewsApi';
import { redditImporter, RedditHistoricalImporter, type ImportProgress } from '../services/redditHistorical';
import { viralData, getDayData as getMockDayData } from '../data/mockData';
import type { DayData, ViralEvent, ContentType } from '../types';

interface UseSupabaseDataOptions {
  enableRealtime?: boolean;
}

interface ApiStatus {
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  source: 'supabase' | 'local' | 'mock';
}

export const useSupabaseData = (_options: UseSupabaseDataOptions = {}) => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isConfigured: isSupabaseConfigured(),
    isLoading: false,
    error: null,
    source: isSupabaseConfigured() ? 'supabase' : 'local'
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [localData, setLocalData] = useState<Record<string, DayData>>({});
  const [historicalData, setHistoricalData] = useState<Record<string, DayData>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({ 
    total: 0, 
    current: 0, 
    subreddit: '', 
    postsFound: 0 
  });

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (isSupabaseConfigured()) {
      try {
        setApiStatus(prev => ({ ...prev, isLoading: true }));
        
        // Try to load from Supabase
        const summaries = await dailySummariesApi.getAll();
        setHistoricalData(summaries);
        
        setApiStatus({
          isConfigured: true,
          isLoading: false,
          error: null,
          source: 'supabase'
        });
      } catch (error) {
        console.error('Failed to load from Supabase:', error);
        // Fall back to localStorage
        const stored = redditImporter.loadFromStorage();
        setHistoricalData(stored);
        
        setApiStatus({
          isConfigured: false,
          isLoading: false,
          error: 'Using local storage - Supabase connection failed',
          source: 'local'
        });
      }
    } else {
      // Use localStorage
      const stored = redditImporter.loadFromStorage();
      setHistoricalData(stored);
      
      setApiStatus({
        isConfigured: false,
        isLoading: false,
        error: null,
        source: 'local'
      });
    }
  };

  /**
   * Get day data - tries Supabase first, then local, then mock
   */
  const getDayData = useCallback(async (date: Date): Promise<DayData | undefined> => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Try Supabase first
    if (apiStatus.source === 'supabase') {
      try {
        const data = await dailySummariesApi.getByDate(dateStr);
        if (data) return data;
      } catch (e) {
        console.warn('Supabase fetch failed, falling back');
      }
    }
    
    // Check local/historical data
    if (historicalData[dateStr]) {
      return historicalData[dateStr];
    }
    
    if (localData[dateStr]) {
      return localData[dateStr];
    }
    
    // Fall back to mock data
    return getMockDayData(dateStr);
  }, [apiStatus.source, historicalData, localData]);

  /**
   * Quick sync check for UI
   */
  const getDayDataSync = useCallback((date: Date): DayData | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return historicalData[dateStr] || localData[dateStr] || getMockDayData(dateStr);
  }, [historicalData, localData]);

  const hasViralContent = useCallback((date: Date): boolean => {
    const data = getDayDataSync(date);
    return data?.hasViralContent || false;
  }, [getDayDataSync]);

  const getViralIntensity = useCallback((date: Date): 'high' | 'medium' | 'low' | 'none' => {
    const data = getDayDataSync(date);
    if (!data || !data.hasViralContent) return 'none';
    
    const totalPosts = data.events.reduce((sum, e) => sum + e.postCount, 0);
    if (totalPosts > 2000000) return 'high';
    if (totalPosts > 500000) return 'medium';
    return 'low';
  }, [getDayDataSync]);

  const getTopHashtag = useCallback((date: Date): string | undefined => {
    const data = getDayDataSync(date);
    return data?.topHashtag;
  }, [getDayDataSync]);

  const getMonthData = useCallback(async (year: number, month: number): Promise<DayData[]> => {
    // Try Supabase first
    if (apiStatus.source === 'supabase') {
      try {
        return await viralEventsApi.getByMonth(year, month);
      } catch (e) {
        console.warn('Supabase month fetch failed');
      }
    }
    
    // Fall back to local data
    const results: DayData[] = [];
    const seen = new Set<string>();
    
    Object.entries({ ...historicalData, ...localData }).forEach(([dateStr, data]) => {
      if (seen.has(dateStr)) return;
      const date = new Date(dateStr);
      if (date.getFullYear() === year && date.getMonth() === month) {
        results.push(data);
        seen.add(dateStr);
      }
    });
    
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [apiStatus.source, historicalData, localData]);

  const searchEvents = useCallback(async (query: string, typeFilter?: ContentType | 'all'): Promise<DayData[]> => {
    // Try Supabase first
    if (apiStatus.source === 'supabase') {
      try {
        return await viralEventsApi.search(query, typeFilter);
      } catch (e) {
        console.warn('Supabase search failed');
      }
    }
    
    // Local search fallback
    const results: DayData[] = [];
    const seen = new Set<string>();
    const lowerQuery = query.toLowerCase();
    
    const searchInData = (data: Record<string, DayData>) => {
      Object.values(data).forEach((dayData) => {
        if (seen.has(dayData.date)) return;
        
        const matchingEvents = dayData.events.filter(event => {
          const matchesQuery = 
            event.title.toLowerCase().includes(lowerQuery) ||
            event.summary.toLowerCase().includes(lowerQuery) ||
            (event.hashtag && event.hashtag.toLowerCase().includes(lowerQuery));
          
          const matchesType = typeFilter === 'all' || !typeFilter || event.type === typeFilter;
          
          return matchesQuery && matchesType;
        });
        
        if (matchingEvents.length > 0) {
          results.push({
            ...dayData,
            events: matchingEvents
          });
          seen.add(dayData.date);
        }
      });
    };
    
    searchInData(historicalData);
    searchInData(localData);
    searchInData(viralData);
    
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [apiStatus.source, historicalData, localData]);

  /**
   * Import historical data with backend sync
   */
  const importHistoricalData = useCallback(async (options: {
    newsOnly?: boolean;
    maxPosts?: number;
    subreddits?: string[];
    timeframes?: ('day' | 'week' | 'month' | 'year' | 'all')[];
  } = {}) => {
    setIsImporting(true);
    const totalSources = (options.subreddits?.length || 10) * (options.timeframes?.length || 3);
    setImportProgress({ total: totalSources, current: 0, subreddit: 'Starting...', postsFound: 0 });

    try {
      const importer = new RedditHistoricalImporter((progress: ImportProgress) => {
        setImportProgress(progress);
      });

      const data = await importer.importHistoricalData({
        timeframes: options.timeframes || ['month', 'year', 'all'],
        minScore: 1000,
        maxPosts: options.maxPosts || 300,
        subreddits: options.subreddits
      });

      // Filter for news only if requested
      const finalData = options.newsOnly ? importer.filterNewsOnly(data) : data;

      // Save to localStorage first (always)
      importer.saveToStorage(finalData);
      setHistoricalData(prev => ({ ...prev, ...finalData }));

      // Sync to Supabase if configured
      if (apiStatus.source === 'supabase') {
        try {
          for (const [dateStr, dayData] of Object.entries<DayData>(finalData)) {
            const eventsToInsert = dayData.events.map((event: ViralEvent) => ({
              source_id: event.id,
              source_type: 'reddit',
              title: event.title,
              summary: event.summary,
              post_count: event.postCount,
              hashtag: event.hashtag,
              content_type: event.type,
              trending_rank: event.trendingRank,
              viral_score: event.postCount,
              published_date: dateStr
            }));

            await viralEventsApi.bulkInsert(eventsToInsert);
          }
        } catch (e) {
          console.warn('Failed to sync to Supabase:', e);
        }
      }

      return Object.keys(finalData).length;
    } finally {
      setIsImporting(false);
    }
  }, [apiStatus.source]);

  /**
   * Fetch live data from APIs
   */
  const fetchLiveData = useCallback(async (date: Date): Promise<DayData | null> => {
    setApiStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const events: ViralEvent[] = [];

      // Fetch from Reddit
      try {
        const redditPosts = await redditApi.getPopularPosts({ limit: 25, timeframe: 'day' });
        events.push(...redditPosts);
      } catch (e) {
        console.warn('Reddit fetch failed:', e);
      }

      // Fetch from NewsAPI if configured
      if (newsApi.isConfigured()) {
        try {
          const newsArticles = await newsApi.getTopHeadlines({ pageSize: 15 });
          events.push(...newsArticles);
        } catch (e) {
          console.warn('NewsAPI fetch failed:', e);
        }
      }

      // Fetch from Hacker News
      try {
        const hnStories = await hackerNewsApi.getTopStories(20);
        events.push(...hnStories);
      } catch (e) {
        console.warn('HN fetch failed:', e);
        }

      if (events.length === 0) {
        setApiStatus(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      const sortedEvents = events.sort((a, b) => b.postCount - a.postCount);
      const dateStr = date.toISOString().split('T')[0];
      const dayData: DayData = {
        date: dateStr,
        events: sortedEvents.map((e, i) => ({ ...e, trendingRank: i + 1 })),
        hasViralContent: events.length > 0,
        topHashtag: sortedEvents[0]?.hashtag
      };

      // Save locally
      setLocalData(prev => ({ ...prev, [dateStr]: dayData }));

      // Sync to Supabase if configured
      if (apiStatus.source === 'supabase') {
        try {
          const eventsToInsert = dayData.events.map(event => ({
            source_id: event.id,
            source_type: event.id.startsWith('hn-') ? 'hackernews' : 
                        event.id.startsWith('newsapi-') ? 'newsapi' : 'reddit',
            title: event.title,
            summary: event.summary,
            post_count: event.postCount,
            hashtag: event.hashtag,
            content_type: event.type,
            trending_rank: event.trendingRank,
            viral_score: event.postCount,
            published_date: dateStr
          }));

          await viralEventsApi.bulkInsert(eventsToInsert);
        } catch (e) {
          console.warn('Failed to sync to Supabase:', e);
        }
      }

      setApiStatus(prev => ({ ...prev, isLoading: false }));
      return dayData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setApiStatus(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return null;
    }
  }, [apiStatus.source]);

  const clearHistoricalData = useCallback(() => {
    redditImporter.clearStorage();
    setHistoricalData({});
    
    // Also clear from Supabase if connected (admin only)
    if (apiStatus.source === 'supabase') {
      // This would require admin privileges
      console.log('Note: Supabase data persists. Use admin panel to clear.');
    }
  }, [apiStatus.source]);

  const refreshCurrentDate = useCallback(async () => {
    return await fetchLiveData(selectedDate);
  }, [fetchLiveData, selectedDate]);

  return {
    // Data
    selectedDate,
    setSelectedDate,
    historicalData,
    
    // API Status
    apiStatus,
    isConfigured: apiStatus.isConfigured,
    isLoading: apiStatus.isLoading,
    error: apiStatus.error,
    dataSource: apiStatus.source,
    
    // Import status
    isImporting,
    importProgress,
    
    // Data getters
    getDayData,
    getDayDataSync,
    hasViralContent,
    getViralIntensity,
    getTopHashtag,
    getMonthData,
    searchEvents,
    
    // API methods
    fetchLiveData,
    importHistoricalData,
    clearHistoricalData,
    refreshCurrentDate,
    
    // Helpers
    formatPostCount: (count: number): string => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
      } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
      }
      return `${count}`;
    }
  };
};
