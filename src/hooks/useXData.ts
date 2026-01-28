import { useState, useCallback, useEffect } from 'react';
import { xApi } from '../services/xApi';
import { viralData, getDayData as getMockDayData } from '../data/mockData';
import type { DayData, ViralEvent, ContentType } from '../types';

interface UseXDataOptions {
  useMockData?: boolean;
  enableRealTimeUpdates?: boolean;
}

interface ApiStatus {
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  rateLimitRemaining: number;
}

export const useXData = (options: UseXDataOptions = {}) => {
  const { useMockData = false, enableRealTimeUpdates = false } = options;
  
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isConfigured: xApi.isConfigured(),
    isLoading: false,
    error: null,
    rateLimitRemaining: 100
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [liveData, setLiveData] = useState<Record<string, DayData>>({});

  // Check API configuration on mount
  useEffect(() => {
    setApiStatus(prev => ({
      ...prev,
      isConfigured: xApi.isConfigured()
    }));
  }, []);

  /**
   * Fetch viral data for a specific date from X API
   */
  const fetchLiveDataForDate = useCallback(async (date: Date): Promise<DayData | null> => {
    if (!xApi.isConfigured() || useMockData) {
      return null;
    }

    setApiStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const events = await xApi.getViralContentForDate(date);
      
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
        rateLimitRemaining: xApi.getRateLimit().remaining
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
   * Get day data (combines live data and mock data)
   */
  const getDayData = useCallback((date: Date): DayData | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check live data first
    if (liveData[dateStr]) {
      return liveData[dateStr];
    }
    
    // Fall back to mock data
    return getMockDayData(dateStr);
  }, [liveData]);

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
    
    // Include live data
    Object.entries(liveData).forEach(([dateStr, data]) => {
      const date = new Date(dateStr);
      if (date.getFullYear() === year && date.getMonth() === month) {
        results.push(data);
      }
    });
    
    // Include mock data
    Object.entries(viralData).forEach(([dateStr, data]) => {
      const date = new Date(dateStr);
      if (date.getFullYear() === year && date.getMonth() === month) {
        // Avoid duplicates
        if (!results.find(r => r.date === dateStr)) {
          results.push(data);
        }
      }
    });
    
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [liveData]);

  /**
   * Search events across all data
   */
  const searchEvents = useCallback((query: string, typeFilter?: ContentType | 'all'): DayData[] => {
    const results: DayData[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Search live data
    Object.values(liveData).forEach((dayData) => {
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
      }
    });
    
    // Search mock data
    Object.values(viralData).forEach((dayData) => {
      // Skip if already found in live data
      if (results.find(r => r.date === dayData.date)) return;
      
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
      }
    });
    
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [liveData]);

  /**
   * Search X API directly
   */
  const searchXApi = useCallback(async (query: string, options: {
    maxResults?: number;
    startTime?: Date;
    endTime?: Date;
  } = {}): Promise<ViralEvent[]> => {
    if (!xApi.isConfigured()) {
      throw new Error('X API not configured');
    }

    setApiStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const events = await xApi.searchTweets(query, options);
      setApiStatus(prev => ({
        ...prev,
        isLoading: false,
        rateLimitRemaining: xApi.getRateLimit().remaining
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

  // Auto-refresh when date changes (if enabled)
  useEffect(() => {
    if (enableRealTimeUpdates && xApi.isConfigured() && !useMockData) {
      fetchLiveDataForDate(selectedDate);
    }
  }, [selectedDate, enableRealTimeUpdates, useMockData, fetchLiveDataForDate]);

  return {
    // Data
    selectedDate,
    setSelectedDate,
    
    // API Status
    apiStatus,
    isConfigured: apiStatus.isConfigured,
    isLoading: apiStatus.isLoading,
    error: apiStatus.error,
    rateLimitRemaining: apiStatus.rateLimitRemaining,
    
    // Data getters
    getDayData,
    hasViralContent,
    getViralIntensity,
    getTopHashtag,
    getMonthData,
    searchEvents,
    
    // API methods
    fetchLiveDataForDate,
    searchXApi,
    refreshCurrentDate,
    
    // Helpers
    formatPostCount: (count: number): string => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M posts`;
      } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K posts`;
      }
      return `${count} posts`;
    }
  };
};
