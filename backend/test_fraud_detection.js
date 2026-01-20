import { extractFeatures, predictFraud } from './src/services/fraudDetector.js';

// Test the fraud detection functionality
async function testFraudDetection() {
  console.log('Testing Fraud Detection Service...');
  
  // Mock user ID and booking data for testing
  const userId = 'test-user-id';
  const bookingData = {
    duration: 10, // 10 minutes
    timeSlot: 'peak',
    stationId: 'test-station-id'
  };
  
  try {
    // Extract features
    console.log('Extracting features...');
    const features = await extractFeatures(userId, bookingData);
    console.log('Extracted features:', features);
    
    // Predict fraud
    console.log('Predicting fraud...');
    const prediction = predictFraud(features);
    console.log('Fraud prediction:', prediction);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during fraud detection test:', error);
  }
}

// Run the test
testFraudDetection();