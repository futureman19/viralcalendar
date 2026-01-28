// Quick test script for X API
import axios from 'axios';

const BEARER_TOKEN = process.env.VITE_X_BEARER_TOKEN;

console.log('🔍 Testing X API Connection...\n');

if (!BEARER_TOKEN) {
  console.log('❌ ERROR: VITE_X_BEARER_TOKEN not found in environment');
  console.log('Make sure you created a .env file with your token.\n');
  process.exit(1);
}

console.log('✅ Token found');
console.log(`Token preview: ${BEARER_TOKEN.substring(0, 10)}...${BEARER_TOKEN.substring(BEARER_TOKEN.length - 5)}\n`);

async function testConnection() {
  try {
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      params: {
        query: 'min_faves:1000 -is:retweet',
        max_results: 5,
        'tweet.fields': 'created_at,public_metrics'
      },
      timeout: 10000
    });

    console.log('✅ API CONNECTION SUCCESSFUL!\n');
    console.log(`Found ${response.data.data?.length || 0} tweets`);
    console.log(`Rate Limit: ${response.headers['x-rate-limit-remaining']}/${response.headers['x-rate-limit-limit']} remaining`);
    console.log(`Reset Time: ${new Date(parseInt(response.headers['x-rate-limit-reset']) * 1000).toLocaleTimeString()}\n`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('Sample tweet:', response.data.data[0].text.substring(0, 100) + '...');
    }
    
    process.exit(0);
  } catch (error) {
    console.log('❌ API CONNECTION FAILED\n');
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 401) {
        console.log('\n💡 Tip: Your bearer token may be invalid or expired.');
        console.log('   Generate a new one at https://developer.x.com');
      } else if (error.response.status === 403) {
        console.log('\n💡 Tip: Your app may not have access to the Search API.');
        console.log('   Check your project settings in the X Developer Portal.');
      }
    } else {
      console.log('Error:', error.message);
    }
    
    process.exit(1);
  }
}

testConnection();
