import { createClient } from '@supabase/supabase-js';
import type { ViralEvent, DayData } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseKey && 
    supabaseUrl !== 'your_supabase_url' && 
    supabaseKey !== 'your_supabase_anon_key';
};

// Viral Events API
export const viralEventsApi = {
  // Get events for a specific date
  async getByDate(date: string): Promise<ViralEvent[]> {
    const { data, error } = await supabase
      .from('viral_events')
      .select('*')
      .eq('published_date', date)
      .order('viral_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get events for a date range
  async getByDateRange(startDate: string, endDate: string): Promise<Record<string, DayData>> {
    const { data, error } = await supabase
      .from('viral_events')
      .select('*')
      .gte('published_date', startDate)
      .lte('published_date', endDate)
      .order('viral_score', { ascending: false });

    if (error) throw error;

    // Group by date
    const grouped: Record<string, DayData> = {};
    data?.forEach((event, index) => {
      const date = event.published_date;
      if (!grouped[date]) {
        grouped[date] = {
          date,
          events: [],
          hasViralContent: false,
          topHashtag: undefined
        };
      }
      grouped[date].events.push({
        ...event,
        trendingRank: index + 1
      });
      grouped[date].hasViralContent = true;
    });

    return grouped;
  },

  // Get events by month
  async getByMonth(year: number, month: number): Promise<DayData[]> {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_viral_summaries')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('has_viral_content', true)
      .order('date', { ascending: false });

    if (error) throw error;

    // Fetch full events for each day
    const results: DayData[] = [];
    for (const summary of data || []) {
      const events = await this.getByDate(summary.date);
      results.push({
        date: summary.date,
        events,
        hasViralContent: true,
        topHashtag: summary.top_hashtag
      });
    }

    return results;
  },

  // Search events
  async search(query: string, typeFilter?: string): Promise<DayData[]> {
    let query_builder = supabase
      .from('viral_events')
      .select('*')
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%,hashtag.ilike.%${query}%`);

    if (typeFilter && typeFilter !== 'all') {
      query_builder = query_builder.eq('content_type', typeFilter);
    }

    const { data, error } = await query_builder
      .order('viral_score', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Group by date
    const grouped: Record<string, DayData> = {};
    data?.forEach(event => {
      const date = event.published_date;
      if (!grouped[date]) {
        grouped[date] = {
          date,
          events: [],
          hasViralContent: false,
          topHashtag: undefined
        };
      }
      grouped[date].events.push(event);
      grouped[date].hasViralContent = true;
    });

    return Object.values(grouped).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  // Insert a new event
  async insert(event: Partial<ViralEvent> & { published_date: string; source_id: string; source_type: string }) {
    const { data, error } = await supabase
      .from('viral_events')
      .upsert(event, { onConflict: 'source_id,source_type' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Bulk insert events
  async bulkInsert(events: (Partial<ViralEvent> & { published_date: string; source_id: string; source_type: string })[]) {
    const { data, error } = await supabase
      .from('viral_events')
      .upsert(events, { onConflict: 'source_id,source_type' })
      .select();

    if (error) throw error;
    return data;
  },

  // Get trending hashtags
  async getTrendingHashtags(limit: number = 10): Promise<string[]> {
    const { data, error } = await supabase
      .rpc('get_trending_hashtags', { limit_count: limit });

    if (error) {
      // Fallback query if RPC doesn't exist
      const { data: fallbackData } = await supabase
        .from('viral_events')
        .select('hashtag')
        .not('hashtag', 'is', null)
        .gte('published_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .limit(100);
      
      const hashtags = fallbackData?.map(e => e.hashtag).filter(Boolean) || [];
      const counts: Record<string, number> = {};
      hashtags.forEach(h => { counts[h] = (counts[h] || 0) + 1; });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([h]) => h);
    }

    return data || [];
  }
};

// Daily Summaries API
export const dailySummariesApi = {
  async getByDate(date: string): Promise<DayData | null> {
    const { data, error } = await supabase
      .from('daily_viral_summaries')
      .select('*')
      .eq('date', date)
      .single();

    if (error || !data) return null;

    const events = await viralEventsApi.getByDate(date);
    return {
      date: data.date,
      events,
      hasViralContent: data.has_viral_content,
      topHashtag: data.top_hashtag
    };
  },

  async getAll(): Promise<Record<string, DayData>> {
    const { data, error } = await supabase
      .from('daily_viral_summaries')
      .select('*')
      .eq('has_viral_content', true)
      .order('date', { ascending: false });

    if (error) throw error;

    const result: Record<string, DayData> = {};
    for (const summary of data || []) {
      result[summary.date] = {
        date: summary.date,
        events: [], // Will be lazy loaded
        hasViralContent: true,
        topHashtag: summary.top_hashtag
      };
    }

    return result;
  }
};

// Admin API (requires authentication)
export const adminApi = {
  // Get API configs
  async getApiConfigs() {
    const { data, error } = await supabase
      .from('api_configs')
      .select('*')
      .order('source_type');

    if (error) throw error;
    return data || [];
  },

  // Update API config
  async updateApiConfig(sourceType: string, updates: { is_enabled?: boolean; config?: object }) {
    const { data, error } = await supabase
      .from('api_configs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('source_type', sourceType)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get import jobs
  async getImportJobs(limit: number = 50) {
    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Create import job
  async createImportJob(sourceType: string, metadata: object = {}) {
    const { data, error } = await supabase
      .from('import_jobs')
      .insert({
        source_type: sourceType,
        status: 'pending',
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update import job
  async updateImportJob(jobId: string, updates: { status?: string; events_imported?: number; error_message?: string }) {
    const { data, error } = await supabase
      .from('import_jobs')
      .update({
        ...updates,
        completed_at: updates.status === 'completed' || updates.status === 'failed' 
          ? new Date().toISOString() 
          : undefined
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete old events (cleanup)
  async deleteOldEvents(daysToKeep: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('viral_events')
      .delete()
      .lt('published_date', cutoffDate.toISOString().split('T')[0]);

    if (error) throw error;
  }
};
