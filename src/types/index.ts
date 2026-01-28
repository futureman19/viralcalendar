export type ContentType = 'tweet' | 'news' | 'meme' | 'video' | 'trend';

export interface ViralEvent {
  id: string;
  title: string;
  summary: string;
  postCount: number;
  hashtag?: string;
  type: ContentType;
  trendingRank: number; // 1-10, where 1 is most viral
}

export interface DayData {
  date: string; // YYYY-MM-DD format
  events: ViralEvent[];
  hasViralContent: boolean;
  topHashtag?: string;
}

export type ViewMode = 'calendar' | 'day' | 'month' | 'search';

export type CalendarViewMode = 'monthly' | 'yearly';

export interface FilterOptions {
  contentType?: ContentType | 'all';
  hashtag?: string;
  searchQuery?: string;
}
