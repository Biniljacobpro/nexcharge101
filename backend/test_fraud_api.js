// Simple test to check if the fraud logs API endpoint is working
import fetch from 'node-fetch';

async function testFraudLogsAPI() {
  try {
    console.log('Testing Fraud Logs API endpoint...');
    
    // Test the endpoint (this will fail without auth, but we can see if it's reachable)
    const response = await fetch('http://localhost:4000/api/admin/fraud-logs');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('API endpoint is accessible but requires authentication (expected)');
    } else {
      console.log('API endpoint responded with status:', response.status);
    }
  } catch (error) {
    console.error('Error testing Fraud Logs API:', error.message);
  }
}

testFraudLogsAPI();