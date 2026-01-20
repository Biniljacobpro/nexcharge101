import DecisionTree from 'decision-tree';
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';

// Mock training data for the Decision Tree
// Features: [requestedDuration, timeSinceRegistration, paymentFailureRate, totalCancellations, timeSlot]
// Time Slot: 0 = Off-Peak, 1 = Peak
const trainingData = [
  // Legitimate bookings
  { requestedDuration: 30, timeSinceRegistration: 365, paymentFailureRate: 0.05, totalCancellations: 0, timeSlot: 0, classification: 'Legitimate' },
  { requestedDuration: 60, timeSinceRegistration: 180, paymentFailureRate: 0.1, totalCancellations: 1, timeSlot: 1, classification: 'Legitimate' },
  { requestedDuration: 45, timeSinceRegistration: 730, paymentFailureRate: 0.02, totalCancellations: 0, timeSlot: 0, classification: 'Legitimate' },
  { requestedDuration: 90, timeSinceRegistration: 90, paymentFailureRate: 0.15, totalCancellations: 2, timeSlot: 1, classification: 'Legitimate' },
  { requestedDuration: 20, timeSinceRegistration: 500, paymentFailureRate: 0.08, totalCancellations: 1, timeSlot: 0, classification: 'Legitimate' },
  { requestedDuration: 75, timeSinceRegistration: 300, paymentFailureRate: 0.03, totalCancellations: 0, timeSlot: 1, classification: 'Legitimate' },
  { requestedDuration: 40, timeSinceRegistration: 150, paymentFailureRate: 0.12, totalCancellations: 3, timeSlot: 0, classification: 'Legitimate' },
  { requestedDuration: 55, timeSinceRegistration: 400, paymentFailureRate: 0.07, totalCancellations: 1, timeSlot: 1, classification: 'Legitimate' },
  { requestedDuration: 35, timeSinceRegistration: 200, paymentFailureRate: 0.09, totalCancellations: 2, timeSlot: 0, classification: 'Legitimate' },
  { requestedDuration: 80, timeSinceRegistration: 600, paymentFailureRate: 0.04, totalCancellations: 0, timeSlot: 1, classification: 'Legitimate' },
  
  // High-Risk bookings
  { requestedDuration: 5, timeSinceRegistration: 1, paymentFailureRate: 0.8, totalCancellations: 10, timeSlot: 1, classification: 'High-Risk' },
  { requestedDuration: 10, timeSinceRegistration: 2, paymentFailureRate: 0.9, totalCancellations: 15, timeSlot: 0, classification: 'High-Risk' },
  { requestedDuration: 15, timeSinceRegistration: 3, paymentFailureRate: 0.7, totalCancellations: 8, timeSlot: 1, classification: 'High-Risk' },
  { requestedDuration: 8, timeSinceRegistration: 1, paymentFailureRate: 0.85, totalCancellations: 12, timeSlot: 0, classification: 'High-Risk' },
  { requestedDuration: 12, timeSinceRegistration: 5, paymentFailureRate: 0.75, totalCancellations: 9, timeSlot: 1, classification: 'High-Risk' },
  { requestedDuration: 20, timeSinceRegistration: 7, paymentFailureRate: 0.65, totalCancellations: 7, timeSlot: 0, classification: 'High-Risk' },
  { requestedDuration: 25, timeSinceRegistration: 10, paymentFailureRate: 0.6, totalCancellations: 6, timeSlot: 1, classification: 'High-Risk' },
  { requestedDuration: 30, timeSinceRegistration: 15, paymentFailureRate: 0.55, totalCancellations: 5, timeSlot: 0, classification: 'High-Risk' },
  { requestedDuration: 18, timeSinceRegistration: 8, paymentFailureRate: 0.72, totalCancellations: 11, timeSlot: 1, classification: 'High-Risk' },
  { requestedDuration: 22, timeSinceRegistration: 12, paymentFailureRate: 0.68, totalCancellations: 13, timeSlot: 0, classification: 'High-Risk' }
];

// Feature names for the Decision Tree
const featureNames = ['requestedDuration', 'timeSinceRegistration', 'paymentFailureRate', 'totalCancellations', 'timeSlot'];

let decisionTreeClassifier = null;

/**
 * Initialize and train the Decision Tree classifier
 * @returns {Object} - The trained classifier instance
 */
export function initDetector() {
  try {
    // Convert training data to the format expected by the decision-tree library
    const trainingDataSet = trainingData.map(item => {
      return {
        requestedDuration: item.requestedDuration,
        timeSinceRegistration: item.timeSinceRegistration,
        paymentFailureRate: item.paymentFailureRate,
        totalCancellations: item.totalCancellations,
        timeSlot: item.timeSlot,
        classification: item.classification
      };
    });
    
    // Create and train the Decision Tree classifier
    decisionTreeClassifier = new DecisionTree(trainingDataSet, 'classification', featureNames);
    
    console.log('Fraud detection Decision Tree classifier initialized and trained successfully');
    return decisionTreeClassifier;
  } catch (error) {
    console.error('Error initializing fraud detection classifier:', error);
    return null;
  }
}

/**
 * Convert categorical features to numerical features
 * @param {string} timeSlot - Time slot ('peak' or 'off-peak')
 * @returns {number} - Numerical representation (1 for peak, 0 for off-peak)
 */
function preprocessTimeSlot(timeSlot) {
  return timeSlot === 'peak' ? 1 : 0;
}

/**
 * Extract features from user data and booking payload
 * @param {string} userId - The user ID
 * @param {Object} bookingData - The booking payload
 * @returns {Object} - Object containing the 5 numerical features
 */
export async function extractFeatures(userId, bookingData) {
  try {
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Calculate time since registration (in days)
    const timeSinceRegistration = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    // Get user's booking history for cancellation count and payment failure rate
    const userBookings = await Booking.find({ userId: userId });
    
    // Calculate total cancellations
    const totalCancellations = userBookings.filter(booking => 
      booking.status === 'cancelled'
    ).length;
    
    // Calculate payment failure rate
    const totalBookingsWithPayment = userBookings.filter(booking => 
      booking.payment && booking.payment.paymentStatus
    ).length;
    
    const failedPayments = userBookings.filter(booking => 
      booking.payment && booking.payment.paymentStatus === 'failed'
    ).length;
    
    const paymentFailureRate = totalBookingsWithPayment > 0 
      ? failedPayments / totalBookingsWithPayment 
      : 0;
    
    // Process booking data
    const requestedDuration = bookingData.duration || 0;
    
    // Determine time slot (simplified - in a real implementation, this would check actual time)
    const timeSlot = preprocessTimeSlot(bookingData.timeSlot || 'off-peak');
    
    return {
      requestedDuration,
      timeSinceRegistration,
      paymentFailureRate,
      totalCancellations,
      timeSlot
    };
  } catch (error) {
    console.error('Error extracting features:', error);
    // Return default values in case of error
    return {
      requestedDuration: 0,
      timeSinceRegistration: 0,
      paymentFailureRate: 0,
      totalCancellations: 0,
      timeSlot: 0
    };
  }
}

/**
 * Predict fraud using the trained Decision Tree model
 * @param {Object} features - The 5 numerical features
 * @returns {Object} - Object with classification and decision path
 */
export function predictFraud(features) {
  try {
    if (!decisionTreeClassifier) {
      throw new Error('Decision Tree classifier not initialized');
    }
    
    // Make prediction
    const classification = decisionTreeClassifier.predict(features);
    
    // Get decision path/rule (simplified representation)
    const decisionPath = generateDecisionPath(features);
    
    return {
      classification,
      decisionPath
    };
  } catch (error) {
    console.error('Error predicting fraud:', error);
    return {
      classification: 'Legitimate',
      decisionPath: 'Error in prediction'
    };
  }
}

/**
 * Generate a simplified decision path string
 * @param {Object} features - The features used for prediction
 * @returns {string} - Simplified decision path
 */
function generateDecisionPath(features) {
  // This is a simplified representation - in a real implementation,
  // you would extract the actual decision path from the Decision Tree
  const conditions = [];
  
  if (features.requestedDuration < 15) {
    conditions.push('Duration < 15 mins');
  }
  
  if (features.timeSinceRegistration < 30) {
    conditions.push('RegTime < 30 days');
  }
  
  if (features.paymentFailureRate > 0.5) {
    conditions.push('FailureRate > 50%');
  }
  
  if (features.totalCancellations > 5) {
    conditions.push('Cancellations > 5');
  }
  
  if (features.timeSlot === 1) {
    conditions.push('Peak Time');
  }
  
  return conditions.length > 0 
    ? conditions.join(' AND ') 
    : 'Standard booking pattern';
}

// Initialize classifier on load
initDetector();

export default {
  initDetector,
  extractFeatures,
  predictFraud
};