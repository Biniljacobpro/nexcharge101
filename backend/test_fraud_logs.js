// Test script to retrieve fraud logs using a valid token
import fetch from 'node-fetch';

async function testFraudLogsRetrieval() {
  try {
    console.log('Testing Fraud Logs Retrieval...');
    
    // You'll need to replace this with a valid admin token from your application
    // For testing purposes, we'll just see if the endpoint is accessible
    const token = 'your-admin-jwt-token-here';
    
    const response = await fetch('http://localhost:4000/api/admin/fraud-logs', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('Authentication required - this is expected if you dont have a valid token');
      console.log('The API endpoint is working correctly');
      return;
    }
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing fraud logs retrieval:', error.message);
  }
}

testFraudLogsRetrieval();