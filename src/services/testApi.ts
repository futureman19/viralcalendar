import { xApi } from './xApi';

// Simple test function to verify API connection
export async function testXApiConnection(): Promise<{ success: boolean; message: string }> {
  console.log('Testing X API connection...');
  console.log('API Configured:', xApi.isConfigured());

  if (!xApi.isConfigured()) {
    return {
      success: false,
      message: 'API not configured. Please check your .env file has VITE_X_BEARER_TOKEN set.'
    };
  }

  try {
    // Try a simple search for recent viral content
    const results = await xApi.searchTweets('min_faves:1000 -is:retweet', {
      maxResults: 5,
      sortOrder: 'relevancy'
    });

    console.log('API Test Results:', results.length, 'tweets found');
    
    if (results.length > 0) {
      return {
        success: true,
        message: `✅ API Connected! Found ${results.length} viral tweets. Rate limit: ${xApi.getRateLimit().remaining}/${xApi.getRateLimit().limit} remaining.`
      };
    } else {
      return {
        success: true,
        message: '⚠️ API Connected but no results found. This might be normal for recent searches.'
      };
    }
  } catch (error) {
    console.error('API Test Error:', error);
    return {
      success: false,
      message: `❌ API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
