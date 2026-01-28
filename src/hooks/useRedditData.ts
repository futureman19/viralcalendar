import { useState, useCallback, useEffect } from 'react';
import { redditApi } from '../services/redditApi';
import { redditImporter, RedditHistoricalImporter, type ImportProgress } from '../services/redditHistorical';
import { viralData, getDayData as getMockDayData } from '../data/mockData';
import type { DayData, ViralEvent, ContentType } from '../types';

interface UseRedditDataOptions {
  useMockData?: boolean;
  enableRealTimeUpdates?: boolean;
}

interface ApiStatus {
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  rateLimitRemaining: number;
}

export const useRedditData = (options: UseRedditDataOptions = {}) => {
  const { useMockData = false, enableRealTimeUpdates = false } = options;
  
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isConfigured: true, // Reddit API doesn't require auth for read-only
    isLoading: false,
    error: null,
    rateLimitRemaining: 100
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [liveData, setLiveData] = useState<Record<string, DayData>>({});
  const [historicalData, setHistoricalData] = useState<Record<string, DayData>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ total: 0, current: 0, subreddit: '', postsFound: 0 });

  // Load historical data from localStorage on mount
  useEffect(() => {
    const stored = redditImporter.loadFromStorage();
    if (Object.keys(stored).length > 0) {
      setHistoricalData(stored);
    }
  }, []);

  /**
   * Fetch viral data for a specific date from Reddit API
   */
  const fetchLiveDataForDate = useCallback(async (date: Date): Promise<DayData | null> => {
    if (useMockData) {
      return null;
    }

    setApiStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const events = await redditApi.getViralContentForDate(date, { minScore: 500 });
      
      if (events.length === 0) {
        setApiStatus(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      const sortedEvents = events.sort((a, b) => a.trendingRank - b.trendingRank);
      const dayData: DayData = {
        date: date.toISOString().split('T')[0],
        events: sortedEvents,
        hasViralContent: events.length > 0,
        topHashtag: sortedEvents[0]?.hashtag
      };

      // Cache the live data
      setLiveData(prev => ({
        ...prev,
        [dayData.date]: dayData
      }));

      setApiStatus(prev => ({
        ...prev,
        isLoading: false,
        rateLimitRemaining: redditApi.getRateLimit().remaining
      }));

      return dayData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setApiStatus(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return null;
    }
  }, [useMockData]);

  /**
   * Get day data (combines live data, historical data, and mock data)
   */
  const getDayData = useCallback((date: Date): DayData | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check live data first
    if (liveData[dateStr]) {
      return liveData[dateStr];
    }
    
    // Check historical data
    if (historicalData[dateStr]) {
      return historicalData[dateStr];
    }
    
    // Fall back to mock data
    return getMockDayData(dateStr);
  }, [liveData, historicalData]);

  /**
   * Check if a date has viral content
   */
  const hasViralContent = useCallback((date: Date): boolean => {
    const data = getDayData(date);
    return data?.hasViralContent || false;
  }, [getDayData]);

  /**
   * Get viral intensity for a date
   */
  const getViralIntensity = useCallback((date: Date): 'high' | 'medium' | 'low' | 'none' => {
    const data = getDayData(date);
    if (!data || !data.hasViralContent) return 'none';
    
    const totalPosts = data.events.reduce((sum, e) => sum + e.postCount, 0);
    if (totalPosts > 2000000) return 'high';
    if (totalPosts > 500000) return 'medium';
    return 'low';
  }, [getDayData]);

  /**
   * Get top hashtag for a date
   */
  const getTopHashtag = useCallback((date: Date): string | undefined => {
    const data = getDayData(date);
    return data?.topHashtag;
  }, [getDayData]);

  /**
   * Get month data
   */
  const getMonthData = useCallback((year: number, month: number): DayData[] => {
    const results: DayData[] = [];
    const seen = new Set<string>();
    
    // Include live data
    Object.entries(liveData).forEach(([dateStr, data]) => {
      const date = new Date(dateStr);
      if (date.getFullYear() === year && date.getMonth() === month) {
        results.push(data);
        seen.add(dateStr);
      }
    });
    
    // Include historical data
    Object.entries(historicalData).forEach(([dateStr, data]) => {
      const date = new Date(dateStr);
      if (date.getFullYear() === year && date.getMonth() === month && !seen.has(dateStr)) {
        results.push(data);
        seen.add(dateStr);
      }
    });
    
    // Include mock data
    Object.entries(viralData).forEach(([dateStr, data]) => {
      const date = new Date(dateStr);
      if (date.getFullYear() === year && date.getMonth() === month && !seen.has(dateStr)) {
        results.push(data);
        seen.add(dateStr);
      }
    });
    
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [liveData, historicalData]);

  /**
   * Search events across all data
   */
  const searchEvents = useCallback((query: string, typeFilter?: ContentType | 'all'): DayData[] => {
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
    
    // Search in priority order
    searchInData(liveData);
    searchInData(historicalData);
    searchInData(viralData);
    
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [liveData, historicalData]);

  /**
   * Search Reddit API directly
   */
  const searchRedditApi = useCallback(async (query: string, options: {
    limit?: number;
    sort?: 'relevance' | 'hot' | 'top' | 'new';
    timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year';
  } = {}): Promise<ViralEvent[]> => {
    setApiStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const events = await redditApi.searchPosts(query, options);
      setApiStatus(prev => ({
        ...prev,
        isLoading: false,
        rateLimitRemaining: redditApi.getRateLimit().remaining
      }));
      return events;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setApiStatus(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  /**
   * Refresh data for selected date
   */
  const refreshCurrentDate = useCallback(async () => {
    await fetchLiveDataForDate(selectedDate);
  }, [fetchLiveDataForDate, selectedDate]);

  /**
   * Import historical data from Reddit
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

      // Save to localStorage
      importer.saveToStorage(finalData);

      // Update state
      setHistoricalData(prev => ({ ...prev, ...finalData }));

      return Object.keys(finalData).length;
    } finally {
      setIsImporting(false);
    }
  }, []);

  /**
   * Clear historical data
   */
  const clearHistoricalData = useCallback(() => {
    redditImporter.clearStorage();
    setHistoricalData({});
  }, []);

  // Auto-refresh when date changes (if enabled)
  useEffect(() => {
    if (enableRealTimeUpdates && !useMockData) {
      fetchLiveDataForDate(selectedDate);
    }
  }, [selectedDate, enableRealTimeUpdates, useMockData, fetchLiveDataForDate]);

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
    rateLimitRemaining: apiStatus.rateLimitRemaining,
    
    // Import status
    isImporting,
    importProgress,
    
    // Data getters
    getDayData,
    hasViralContent,
    getViralIntensity,
    getTopHashtag,
    getMonthData,
    searchEvents,
    
    // API methods
    fetchLiveDataForDate,
    searchRedditApi,
    refreshCurrentDate,
    importHistoricalData,
    clearHistoricalData,
    
    // Helpers
    formatPostCount: (count: number): string => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M upvotes`;
      } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K upvotes`;
      }
      return `${count} upvotes`;
    }
  };
};
