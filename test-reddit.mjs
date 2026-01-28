// Quick test script for Reddit API
import axios from 'axios';

console.log('🔍 Testing Reddit API Connection...\n');

async function testConnection() {
  try {
    const response = await axios.get('https://www.reddit.com/r/all/top.json', {
      headers: {
        'User-Agent': 'ViralCalendar/1.0 (Test Script)'
      },
      params: {
        limit: 5,
        t: 'day'
      },
      timeout: 15000
    });

    const posts = response.data?.data?.children || [];
    
    console.log('✅ REDDIT API CONNECTION SUCCESSFUL!\n');
    console.log(`Found ${posts.length} posts`);
    console.log(`Rate Limit Remaining: ${response.headers['x-ratelimit-remaining']}`);
    console.log(`Rate Limit Used: ${response.headers['x-ratelimit-used']}`);
    console.log(`Rate Limit Reset: ${response.headers['x-ratelimit-reset']}\n`);
    
    if (posts.length > 0) {
      console.log('Sample posts:');
      posts.slice(0, 3).forEach((post, i) => {
        const data = post.data;
        console.log(`\n${i + 1}. ${data.title.substring(0, 80)}...`);
        console.log(`   Score: ${data.score} upvotes | Subreddit: r/${data.subreddit}`);
      });
    }
    
    console.log('\n✅ Reddit API is working! The app can now fetch live viral content.');
    process.exit(0);
  } catch (error) {
    console.log('❌ REDDIT API CONNECTION FAILED\n');
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log('Error:', error.message);
    }
    
    console.log('\n💡 This might be a temporary issue. Reddit API is usually very reliable.');
    process.exit(1);
  }
}

testConnection();
