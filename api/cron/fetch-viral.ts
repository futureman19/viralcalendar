import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { redditApi } from '../../src/services/redditApi';
import { hackerNewsApi } from '../../src/services/hackerNewsApi';
import { newsApi } from '../../src/services/newsApi';

// This runs every 6 hours via Vercel Cron
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  const cronSecret = req.headers['x-vercel-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const results = {
    reddit: 0,
    hackernews: 0,
    newsapi: 0,
    errors: [] as string[]
  };

  try {
    // Fetch from Reddit
    try {
      const redditPosts = await redditApi.getPopularPosts({ limit: 25, timeframe: 'day' });
      
      const today = new Date().toISOString().split('T')[0];
      const redditEvents = redditPosts.map(event => ({
        source_id: event.id,
        source_type: 'reddit',
        title: event.title,
        summary: event.summary,
        post_count: event.postCount,
        hashtag: event.hashtag,
        content_type: event.type,
        trending_rank: event.trendingRank,
        viral_score: event.postCount,
        published_date: today
      }));

      const { error } = await supabase
        .from('viral_events')
        .upsert(redditEvents, { onConflict: 'source_id,source_type' });

      if (!error) results.reddit = redditEvents.length;
    } catch (e: any) {
      results.errors.push(`Reddit: ${e.message}`);
    }

    // Fetch from Hacker News
    try {
      const hnStories = await hackerNewsApi.getTopStories(25);
      
      const today = new Date().toISOString().split('T')[0];
      const hnEvents = hnStories.map(event => ({
        source_id: event.id,
        source_type: 'hackernews',
        title: event.title,
        summary: event.summary,
        post_count: event.postCount,
        hashtag: event.hashtag,
        content_type: event.type,
        trending_rank: event.trendingRank,
        viral_score: event.postCount,
        published_date: today
      }));

      const { error } = await supabase
        .from('viral_events')
        .upsert(hnEvents, { onConflict: 'source_id,source_type' });

      if (!error) results.hackernews = hnEvents.length;
    } catch (e: any) {
      results.errors.push(`HN: ${e.message}`);
    }

    // Fetch from NewsAPI if configured
    if (newsApi.isConfigured()) {
      try {
        const newsArticles = await newsApi.getTopHeadlines({ pageSize: 20 });
        
        const today = new Date().toISOString().split('T')[0];
        const newsEvents = newsArticles.map(event => ({
          source_id: event.id,
          source_type: 'newsapi',
          title: event.title,
          summary: event.summary,
          post_count: event.postCount,
          hashtag: event.hashtag,
          content_type: event.type,
          trending_rank: event.trendingRank,
          viral_score: event.postCount,
          published_date: today
        }));

        const { error } = await supabase
          .from('viral_events')
          .upsert(newsEvents, { onConflict: 'source_id,source_type' });

        if (!error) results.newsapi = newsEvents.length;
      } catch (e: any) {
        results.errors.push(`NewsAPI: ${e.message}`);
      }
    }

    // Log import job
    await supabase.from('import_jobs').insert({
      source_type: 'cron',
      status: results.errors.length > 0 ? 'completed' : 'completed',
      events_imported: results.reddit + results.hackernews + results.newsapi,
      error_message: results.errors.join(', ') || null,
      metadata: { cron: true, results }
    });

    return res.status(200).json({
      success: true,
      message: `Imported ${results.reddit + results.hackernews + results.newsapi} events`,
      results
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
