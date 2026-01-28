import { useState, useCallback } from 'react';
import type { DayData, FilterOptions, ContentType } from '../types';
import { viralData, formatPostCount } from '../data/mockData';

export const useViralData = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'day' | 'month' | 'search'>('calendar');
  const [filters, setFilters] = useState<FilterOptions>({});

  const getDayData = useCallback((date: Date): DayData | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return viralData[dateStr];
  }, []);

  const hasViralContent = useCallback((date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return !!viralData[dateStr]?.hasViralContent;
  }, []);

  const getMonthData = useCallback((year: number, month: number): DayData[] => {
    const results: DayData[] = [];
    Object.entries(viralData).forEach(([dateStr, data]) => {
      const date = new Date(dateStr);
      if (date.getFullYear() === year && date.getMonth() === month) {
        results.push(data);
      }
    });
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const searchEvents = useCallback((query: string, typeFilter?: ContentType | 'all'): DayData[] => {
    const results: DayData[] = [];
    const lowerQuery = query.toLowerCase();
    
    Object.values(viralData).forEach((dayData) => {
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
  }, []);

  const getViralIntensity = useCallback((date: Date): 'high' | 'medium' | 'low' | 'none' => {
    const data = getDayData(date);
    if (!data || !data.hasViralContent) return 'none';
    
    const totalPosts = data.events.reduce((sum, e) => sum + e.postCount, 0);
    if (totalPosts > 2000000) return 'high';
    if (totalPosts > 500000) return 'medium';
    return 'low';
  }, [getDayData]);

  return {
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    getDayData,
    hasViralContent,
    getMonthData,
    searchEvents,
    getViralIntensity,
    formatPostCount
  };
};
