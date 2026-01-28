-- Viral Calendar Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Viral Events Table
CREATE TABLE viral_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_id TEXT NOT NULL, -- e.g., "reddit-123", "hn-456"
  source_type TEXT NOT NULL CHECK (source_type IN ('reddit', 'hackernews', 'newsapi', 'twitter', 'manual')),
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  post_count INTEGER DEFAULT 0,
  hashtag TEXT,
  content_type TEXT CHECK (content_type IN ('tweet', 'news', 'meme', 'video', 'trend')),
  trending_rank INTEGER DEFAULT 0,
  viral_score INTEGER DEFAULT 0, -- calculated score for ranking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_date DATE, -- the actual date the content was published
  
  -- Ensure unique events per source
  UNIQUE(source_id, source_type)
);

-- Daily Aggregations Table
CREATE TABLE daily_viral_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  event_count INTEGER DEFAULT 0,
  top_hashtag TEXT,
  total_engagement BIGINT DEFAULT 0,
  sources JSONB DEFAULT '[]', -- which sources contributed
  has_viral_content BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Configuration Table (for admin settings)
CREATE TABLE api_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_type TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  last_fetch_at TIMESTAMPTZ,
  rate_limit_remaining INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import Jobs Log
CREATE TABLE import_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  source_type TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  events_imported INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_viral_events_published_date ON viral_events(published_date);
CREATE INDEX idx_viral_events_source_type ON viral_events(source_type);
CREATE INDEX idx_viral_events_viral_score ON viral_events(viral_score DESC);
CREATE INDEX idx_viral_events_content_type ON viral_events(content_type);

-- Function to update daily summary
CREATE OR REPLACE FUNCTION update_daily_summary(target_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_viral_summaries (
    date,
    event_count,
    top_hashtag,
    total_engagement,
    sources,
    has_viral_content,
    updated_at
  )
  SELECT 
    target_date,
    COUNT(*),
    (
      SELECT hashtag 
      FROM viral_events 
      WHERE published_date = target_date 
      GROUP BY hashtag 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ),
    SUM(post_count),
    ARRAY_AGG(DISTINCT source_type),
    COUNT(*) > 0,
    NOW()
  FROM viral_events
  WHERE published_date = target_date
  ON CONFLICT (date) DO UPDATE SET
    event_count = EXCLUDED.event_count,
    top_hashtag = EXCLUDED.top_hashtag,
    total_engagement = EXCLUDED.total_engagement,
    sources = EXCLUDED.sources,
    has_viral_content = EXCLUDED.has_viral_content,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update daily summary when events are added
CREATE OR REPLACE FUNCTION trigger_update_daily_summary()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_daily_summary(NEW.published_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_viral_event_insert
  AFTER INSERT ON viral_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_daily_summary();

-- Row Level Security (RLS) policies
ALTER TABLE viral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_viral_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- Allow read access to all (public data)
CREATE POLICY "Allow public read access" ON viral_events
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON daily_viral_summaries
  FOR SELECT USING (true);

-- Only allow admin writes (you'll need to configure this with your auth setup)
CREATE POLICY "Allow admin insert" ON viral_events
  FOR INSERT WITH CHECK (true); -- Update this with your auth logic

-- Insert default API configs
INSERT INTO api_configs (source_type, is_enabled, config) VALUES
  ('reddit', true, '{"min_score": 500, "subreddits": ["worldnews", "news", "technology"]}'),
  ('hackernews', true, '{"min_score": 50}'),
  ('newsapi', false, '{"page_size": 20}');
