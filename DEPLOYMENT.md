# Vercel + Supabase Deployment Guide

## Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Vercel CDN    │────▶│  React App   │────▶│  Supabase DB    │
│  (Frontend)     │     │  (Browser)   │     │  (PostgreSQL)   │
└─────────────────┘     └──────────────┘     └─────────────────┘
                               │                       ▲
                               │                       │
                               ▼                       │
                        ┌──────────────┐              │
                        │  Vercel API  │──────────────┘
                        │  (Cron Jobs) │  (Serverless)
                        └──────────────┘
```

## Step 1: Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Enter project name: `viral-calendar`
5. Choose region closest to you
6. Click "Create new project"

### 2. Get API Keys
Once project is created:
1. Go to Project Settings (gear icon) → API
2. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key (for serverless) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Initialize Database
1. Go to SQL Editor (left sidebar)
2. Click "New query"
3. Copy contents of `supabase/schema.sql`
4. Click "Run"

## Step 2: Vercel Setup

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Link Project
```bash
vercel link
```

### 4. Set Environment Variables
```bash
# Supabase
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# APIs (optional)
vercel env add VITE_NEWS_API_KEY

# Cron Secret (generate random string)
vercel env add CRON_SECRET
```

Or set via Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Settings → Environment Variables
4. Add all variables

### 5. Deploy
```bash
vercel --prod
```

## Step 3: Configure Cron Jobs

1. In Vercel Dashboard, go to your project
2. Settings → Cron Jobs
3. Add:
   - Path: `/api/cron/fetch-viral`
   - Schedule: `0 */6 * * *` (every 6 hours)

Or use `vercel.json` (already included):
```json
{
  "crons": [{
    "path": "/api/cron/fetch-viral",
    "schedule": "0 */6 * * *"
  }]
}
```

## Step 4: Verify Setup

### Test API Endpoints
```bash
# Fetch current viral content
curl https://your-app.vercel.app/api/cron/fetch-viral \
  -H "x-vercel-cron-secret: YOUR_CRON_SECRET"
```

### Check Database
In Supabase SQL Editor:
```sql
SELECT * FROM viral_events ORDER BY created_at DESC LIMIT 10;
SELECT * FROM daily_viral_summaries ORDER BY date DESC LIMIT 10;
```

## Local Development with Supabase

### 1. Update `.env` file:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Run dev server:
```bash
npm run dev
```

## Data Flow

1. **Cron Job** (every 6 hours):
   - Fetches from Reddit, HN, NewsAPI
   - Stores in Supabase
   - Updates daily summaries

2. **User visits app**:
   - Loads from Supabase (fast)
   - Falls back to localStorage if offline
   - Can manually trigger refresh

3. **Admin imports**:
   - Fetches historical data
   - Syncs to Supabase
   - Updates local cache

## Pricing

### Supabase (Free Tier)
- 500MB database
- 2GB bandwidth
- 50,000 monthly active users
- Perfect for personal use

### Vercel (Free Tier)
- 100GB bandwidth
- 6,000 execution minutes/month
- 1TB data transfer
- Cron jobs included

## Troubleshooting

### "Supabase connection failed"
- Check URL and key in env vars
- Ensure RLS policies allow reads

### "Cron job unauthorized"
- Verify CRON_SECRET is set
- Check header name: `x-vercel-cron-secret`

### "No data appearing"
- Check SQL schema was run
- Verify cron job is executing
- Check import_jobs table for errors

## Security Notes

1. **Never commit `.env` files**
2. **Use service_role key only server-side** (cron jobs)
3. **anon key is safe for client-side** (RLS protects data)
4. **Set up RLS policies** for production
5. **Rotate keys** if compromised

## Next Steps

1. Set up authentication (Supabase Auth)
2. Add real-time subscriptions
3. Implement data retention policies
4. Add analytics/monitoring
5. Scale to paid plans if needed
