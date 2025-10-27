import KNN from 'ml-knn';
import Station from '../models/station.model.js';
import Booking from '../models/booking.model.js';
import MaintenanceRecord from '../models/maintenanceRecord.model.js';
import mongoose from 'mongoose';

// Mock training data - 20 representative data points covering all three classes
const trainingData = [
  // Low risk examples (good performance)
  [95, 0.3, 45, 0, 5],    // High uptime, low utilization, average session, no errors, recently serviced
  [98, 0.2, 40, 0, 2],    // Very high uptime, low utilization, short sessions, no errors, recently serviced
  [92, 0.4, 50, 1, 7],    // Good uptime, moderate utilization, average sessions, few errors, week old service
  [96, 0.25, 42, 0, 3],   // High uptime, low utilization, short sessions, no errors, recently serviced
  [94, 0.35, 48, 0, 6],   // Good uptime, moderate utilization, average sessions, no errors, week old service
  [97, 0.15, 38, 0, 1],   // Very high uptime, low utilization, short sessions, no errors, very recently serviced
  [93, 0.45, 52, 1, 8],   // Good uptime, higher utilization, longer sessions, few errors, week old service
  
  // Medium risk examples (some concerns)
  [85, 0.6, 65, 3, 15],   // Lower uptime, high utilization, long sessions, some errors, 2 weeks old service
  [80, 0.7, 70, 4, 20],   // Poor uptime, high utilization, long sessions, several errors, 3 weeks old service
  [88, 0.55, 58, 2, 12],  // Decent uptime, moderate-high utilization, medium sessions, few errors, ~2 weeks old
  [82, 0.65, 68, 3, 18],  // Lower uptime, high utilization, long sessions, some errors, ~2.5 weeks old
  [86, 0.5, 60, 2, 14],   // Moderate uptime, moderate utilization, medium-long sessions, few errors, 2 weeks old
  
  // High risk examples (serious concerns)
  [70, 0.85, 85, 8, 35],  // Poor uptime, very high utilization, very long sessions, many errors, month old service
  [65, 0.9, 90, 10, 40],  // Very poor uptime, extremely high utilization, very long sessions, many errors, over a month old
  [75, 0.8, 80, 6, 30],   // Poor uptime, high utilization, long sessions, several errors, month old service
  [68, 0.88, 88, 9, 38],  // Very poor uptime, very high utilization, very long sessions, many errors, over a month old
  [72, 0.75, 75, 7, 32],  // Poor uptime, high utilization, long sessions, several errors, month old service
  [60, 0.95, 95, 12, 45], // Very poor uptime, extremely high utilization, very long sessions, many errors, very old service
  [78, 0.7, 72, 5, 25],   // Moderate-poor uptime, high utilization, long sessions, several errors, ~3 weeks old
  [66, 0.82, 82, 8, 36]   // Poor uptime, high utilization, long sessions, many errors, over a month old
];

const trainingLabels = [
  'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low',
  'Medium', 'Medium', 'Medium', 'Medium', 'Medium',
  'High', 'High', 'High', 'High', 'High', 'High', 'High', 'High'
];

// Initialize the KNN model with mock training data
let knnModel;
try {
  knnModel = new KNN(trainingData, trainingLabels, { k: 3 });
} catch (error) {
  console.error('Error initializing KNN model:', error);
}

/**
 * Calculate features for a station based on booking data and station metrics
 * @param {string} stationId - The ID of the station
 * @returns {Promise<Object>} - Object containing the 5 features
 */
async function calculateFeatures(stationId) {
  const N_DAYS = 30; // Look at the last 30 days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - N_DAYS);
  
  // Get station data
  const station = await Station.findById(stationId);
  if (!station) {
    throw new Error(`Station with ID ${stationId} not found`);
  }
  
  // Feature 1: Uptime delta (change in uptime percentage)
  // For simplicity, we'll use the current uptime as the "new" value
  // and assume a baseline of 95% for the "old" value
  const uptimeDelta = station.analytics.uptime - 95; // Change from baseline
  
  // Feature 2: Utilization rate (normalized booking count)
  // Get bookings in the last N days
  const bookings = await Booking.find({
    stationId: stationId,
    startTime: { $gte: cutoffDate }
  });
  
  // Normalize utilization (assuming max 100 bookings in N days for normalization)
  const maxBookings = 100;
  const utilizationRate = Math.min(bookings.length / maxBookings, 1.0);
  
  // Feature 3: Average session duration
  let avgSessionDuration = 45; // Default if no bookings
  if (bookings.length > 0) {
    const totalDuration = bookings.reduce((sum, booking) => sum + booking.duration, 0);
    avgSessionDuration = totalDuration / bookings.length;
  }
  
  // Feature 4: Error count (in a real system, this would come from logs)
  // For now, we'll simulate this based on station performance
  let errorCount = 0;
  if (station.analytics.uptime < 80) {
    errorCount = Math.floor(Math.random() * 10) + 5; // 5-15 errors for poor performing stations
  } else if (station.analytics.uptime < 90) {
    errorCount = Math.floor(Math.random() * 5) + 1; // 1-5 errors for moderately performing stations
  }
  
  // Feature 5: Days since last service
  let lastServiceDays = 30; // Default if no service date
  if (station.analytics.lastMaintenance) {
    const lastService = new Date(station.analytics.lastMaintenance);
    const today = new Date();
    lastServiceDays = Math.floor((today - lastService) / (1000 * 60 * 60 * 24));
  }
  
  return {
    uptimeDelta,
    utilizationRate,
    avgSessionDuration,
    errorCount,
    lastServiceDays
  };
}

/**
 * Predict maintenance risk based on features
 * @param {Array} features - Array of 5 features
 * @returns {Object} - Object with riskScore and riskClassification
 */
function predictRisk(features) {
  if (!knnModel) {
    throw new Error('KNN model not initialized');
  }
  
  try {
    // Get prediction
    const prediction = knnModel.predict([features])[0];
    
    // Since ml-knn doesn't provide probabilities, we'll use a simple scoring system
    // Higher score means higher risk
    let riskScore = 0;
    if (prediction === 'Low') {
      riskScore = 0.1; // Low risk
    } else if (prediction === 'Medium') {
      riskScore = 0.5; // Medium risk
    } else if (prediction === 'High') {
      riskScore = 0.9; // High risk
    }
    
    return {
      riskScore,
      riskClassification: prediction
    };
  } catch (error) {
    console.error('Error predicting risk:', error);
    // Default to low risk if prediction fails
    return {
      riskScore: 0.1,
      riskClassification: 'Low'
    };
  }
}

/**
 * Run prediction for a specific station
 * @param {string} stationId - The ID of the station
 * @returns {Promise<Object>} - The maintenance record that was created
 */
async function runPredictionForStation(stationId) {
  try {
    // Calculate features
    const features = await calculateFeatures(stationId);
    
    // Convert features to array for KNN
    const featuresArray = [
      features.uptimeDelta,
      features.utilizationRate,
      features.avgSessionDuration,
      features.errorCount,
      features.lastServiceDays
    ];
    
    // Run prediction
    const prediction = predictRisk(featuresArray);
    
    // Save to MaintenanceRecord collection
    const maintenanceRecord = new MaintenanceRecord({
      stationId,
      uptimeDelta: features.uptimeDelta,
      utilizationRate: features.utilizationRate,
      avgSessionDuration: features.avgSessionDuration,
      errorCount: features.errorCount,
      lastServiceDays: features.lastServiceDays,
      riskScore: prediction.riskScore,
      riskClassification: prediction.riskClassification
    });
    
    await maintenanceRecord.save();
    
    // Update the station with the latest prediction
    await Station.findByIdAndUpdate(stationId, {
      latestRiskClassification: prediction.riskClassification,
      lastPredictionDate: new Date()
    });
    
    return maintenanceRecord;
  } catch (error) {
    console.error(`Error running prediction for station ${stationId}:`, error);
    throw error;
  }
}

/**
 * Train the model with new data (placeholder for future implementation)
 */
function trainModel() {
  // In a real implementation, this would retrain the model with new data
  console.log('Model training would happen here with new data');
}

export {
  trainModel,
  calculateFeatures,
  predictRisk,
  runPredictionForStation
};