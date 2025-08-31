const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const testServerEndpoint = async () => {
  try {
    console.log('🚀 Testing the actual API endpoint...');
    console.log('Make sure your server is running on port 5000');
    
    // Test the health endpoint first
    try {
      const healthResponse = await axios.get('http://localhost:5000/health');
      console.log('✅ Server is running, health check passed');
      console.log('Health response:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server not running or health check failed');
      console.log('Please start your server with: npm run dev');
      return;
    }
    
    // Test the targets endpoint (this will fail without auth, but we can see the error)
    try {
      const targetsResponse = await axios.get('http://localhost:5000/api/dashboard/manager-targets-page');
      console.log('✅ Targets endpoint response:', targetsResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('🔒 Targets endpoint requires authentication (expected)');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run the test
testServerEndpoint();
