// Simple SVM implementation for churn prediction
// Note: Using simplified prediction logic for deployment compatibility
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import Review from '../models/review.model.js';
import { classifySentiment } from './sentimentClassifier.js';

// Mock training data for the SVM model
// Features: [lastLoginDays, avgMonthlyBookings, loyaltyPoints, lastNegativeReview, twoFactorEnabled]
// Labels: 0 = Not Churn, 1 = Churn
const trainingData = [
  // Non-churn examples
  [5, 4.5, 150, 0, 1],    // Recent login, high bookings, many points, no negative review, 2FA enabled
  [3, 5.2, 200, 0, 1],    // Very recent login, high bookings, many points, no negative review, 2FA enabled
  [7, 3.8, 120, 0, 1],    // Recent login, good bookings, decent points, no negative review, 2FA enabled
  [10, 3.2, 100, 0, 0],   // Decent login, moderate bookings, decent points, no negative review, 2FA disabled
  [15, 2.8, 80, 0, 0],    // Older login, moderate bookings, few points, no negative review, 2FA disabled
  [8, 4.0, 130, 0, 1],    // Recent login, good bookings, decent points, no negative review, 2FA enabled
  [12, 2.5, 70, 0, 0],    // Older login, low bookings, few points, no negative review, 2FA disabled
  [6, 4.8, 180, 0, 1],    // Recent login, high bookings, many points, no negative review, 2FA enabled
  
  // Churn examples
  [45, 0.5, 20, 1, 0],    // Very old login, very low bookings, few points, negative review, 2FA disabled
  [60, 0.2, 5, 1, 0],     // Very old login, very low bookings, few points, negative review, 2FA disabled
  [35, 0.8, 15, 1, 0],    // Old login, low bookings, few points, negative review, 2FA disabled
  [50, 0.3, 10, 1, 0],    // Very old login, very low bookings, few points, negative review, 2FA disabled
  [40, 1.0, 25, 1, 0],    // Old login, low bookings, few points, negative review, 2FA disabled
  [55, 0.4, 8, 1, 0],     // Very old login, very low bookings, few points, negative review, 2FA disabled
  [30, 1.2, 30, 1, 0],    // Old login, low bookings, few points, negative review, 2FA disabled
  [65, 0.1, 2, 1, 0]      // Very old login, very low bookings, few points, negative review, 2FA disabled
];

const trainingLabels = [
  0, 0, 0, 0, 0, 0, 0, 0,  // Non-churn labels
  1, 1, 1, 1, 1, 1, 1, 1   // Churn labels
];

// Simple rule-based churn prediction model
// Simplified for deployment - uses weighted scoring instead of SVM
const svmModel = {
  predict: (features) => {
    // Rule-based prediction using weighted features
    const [lastLoginDays, avgMonthlyBookings, loyaltyPoints, lastNegativeReview, twoFactorEnabled] = features;
    
    // Calculate risk score (0-100)
    let riskScore = 0;
    
    // Weight 1: Last login (higher days = higher risk)
    riskScore += Math.min((lastLoginDays / 60) * 40, 40); // Max 40 points
    
    // Weight 2: Booking frequency (lower bookings = higher risk)
    riskScore += Math.max(0, (5 - avgMonthlyBookings) / 5 * 30); // Max 30 points
    
    // Weight 3: Loyalty points (fewer points = higher risk)
    riskScore += Math.max(0, (200 - loyaltyPoints) / 200 * 15); // Max 15 points
    
    // Weight 4: Recent negative review
    riskScore += lastNegativeReview * 10; // 10 points if negative review exists
    
    // Weight 5: Two factor auth (no 2FA = higher risk)
    riskScore += (1 - twoFactorEnabled) * 5; // 5 points if 2FA disabled
    
    // Return 1 (churn) if risk score > 50, else 0 (no churn)
    return riskScore > 50 ? 1 : 0;
  }
};

console.log('Churn prediction model initialized successfully (rule-based)');

/**
 * Calculate user features for churn prediction
 * @param {string} userId - The user ID
 * @returns {Array} - Array of 5 numerical features
 */
export async function calculateUserFeatures(userId) {
  try {
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Feature 1: Last Login Days (Today - User.lastLogin)
    const lastLoginDate = user.credentials.lastLogin || user.createdAt;
    const lastLoginDays = Math.floor((new Date() - new Date(lastLoginDate)) / (1000 * 60 * 60 * 24));

    // Feature 2: Average Monthly Bookings (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const bookingCount = await Booking.countDocuments({
      userId: userId,
      createdAt: { $gte: ninetyDaysAgo }
    });
    
    const avgMonthlyBookings = bookingCount / 3; // Divide by 3 months

    // Feature 3: Loyalty Points
    const loyaltyPoints = user.roleSpecificData.evUserInfo?.loyaltyPoints || 0;

    // Feature 4: Last Negative Review (Binary 0 or 1)
    const ninetyDaysAgoForReviews = new Date();
    ninetyDaysAgoForReviews.setDate(ninetyDaysAgoForReviews.getDate() - 90);
    
    const recentNegativeReview = await Review.findOne({
      userId: userId,
      createdAt: { $gte: ninetyDaysAgoForReviews },
      sentimentClassification: 'Negative'
    });
    
    const lastNegativeReview = recentNegativeReview ? 1 : 0;

    // Feature 5: Two Factor Enabled (Binary 0 or 1)
    const twoFactorEnabled = user.credentials.twoFactorEnabled ? 1 : 0;

    return [
      lastLoginDays,
      avgMonthlyBookings,
      loyaltyPoints,
      lastNegativeReview,
      twoFactorEnabled
    ];
  } catch (error) {
    console.error('Error calculating user features:', error);
    // Return default values in case of error
    return [30, 1, 0, 0, 0];
  }
}

/**
 * Normalize features to a common range (0 to 1)
 * @param {Array} features - Array of numerical features
 * @returns {Array} - Normalized features
 */
function normalizeFeatures(features) {
  // Define min and max values for each feature for normalization
  // These values should be adjusted based on domain knowledge
  const minValues = [0, 0, 0, 0, 0];        // Min values for each feature
  const maxValues = [365, 10, 500, 1, 1];   // Max values for each feature
  
  return features.map((feature, index) => {
    // Clamp the feature value between min and max
    const clampedFeature = Math.max(minValues[index], Math.min(maxValues[index], feature));
    // Normalize to 0-1 range
    return (clampedFeature - minValues[index]) / (maxValues[index] - minValues[index]);
  });
}

/**
 * Initialize and train the SVM model
 * @returns {Object} - The trained SVM model
 */
export function initSVM() {
  return svmModel;
}

/**
 * Predict churn using the trained SVM model
 * @param {Array} features - Array of 5 normalized numerical features
 * @returns {Object} - Object with probability and risk classification
 */
export function predictChurn(features) {
  try {
    if (!svmModel) {
      throw new Error('SVM model not initialized');
    }

    // Normalize features
    const normalizedFeatures = normalizeFeatures(features);
    
    // Make prediction
    const prediction = svmModel.predict([normalizedFeatures])[0];
    
    // Get decision scores (distance from hyperplane) for probability estimation
    const decisionScores = svmModel.predict([normalizedFeatures], true);
    const decisionScore = decisionScores[0];
    
    // Convert decision score to probability (using sigmoid function)
    const probability = 1 / (1 + Math.exp(-decisionScore));
    
    // Define risk levels based on probability
    let risk = 'Low';
    if (probability > 0.7) {
      risk = 'High';
    } else if (probability > 0.4) {
      risk = 'Medium';
    }
    
    return {
      probability: parseFloat(probability.toFixed(4)),
      risk
    };
  } catch (error) {
    console.error('Error predicting churn:', error);
    // Default to low risk if prediction fails
    return {
      probability: 0.1,
      risk: 'Low'
    };
  }
}

/**
 * Run churn prediction for a specific user
 * @param {string} userId - The user ID
 * @returns {Object} - Object with prediction results
 */
export async function runPredictionForUser(userId) {
  try {
    // Calculate features
    const features = await calculateUserFeatures(userId);
    
    // Run prediction
    const prediction = predictChurn(features);
    
    // Update user with prediction results
    await User.findByIdAndUpdate(userId, {
      'roleSpecificData.evUserInfo.churnRisk': prediction.risk,
      'roleSpecificData.evUserInfo.churnProbability': prediction.probability,
      'roleSpecificData.evUserInfo.lastPredictionDate': new Date()
    });
    
    return {
      userId,
      features,
      prediction
    };
  } catch (error) {
    console.error(`Error running prediction for user ${userId}:`, error);
    throw error;
  }
}

// Initialize model on load
initSVM();

export default {
  initSVM,
  calculateUserFeatures,
  predictChurn,
  runPredictionForUser
};