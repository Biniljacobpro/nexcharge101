import { extractFeatures, predictFraud } from '../services/fraudDetector.js';
import FraudAttemptLog from '../models/fraudAttemptLog.model.js';

/**
 * Middleware to detect fraudulent booking attempts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const fraudDetectionMiddleware = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const bookingData = req.body;

    // Extract features for fraud detection
    const features = await extractFeatures(userId, bookingData);
    
    // Make fraud prediction
    const { classification, decisionPath } = predictFraud(features);
    
    // Log the attempt regardless of classification
    await FraudAttemptLog.create({
      userId,
      stationId: bookingData.stationId,
      classification,
      decisionPath,
      featuresUsed: features
    });
    
    // Add fraud flag to request body
    req.body.isFraudulentFlag = classification === 'High-Risk';
    
    // If classified as high-risk, return a custom response
    if (classification === 'High-Risk') {
      return res.status(403).json({
        success: false,
        message: 'Booking flagged for additional verification',
        code: 'FRAUD_DETECTED',
        requiresVerification: true
      });
    }
    
    // If legitimate, continue to next middleware
    next();
  } catch (error) {
    console.error('Error in fraud detection middleware:', error);
    // In case of error, log it and continue with the booking process
    // This ensures the booking system remains functional even if fraud detection fails
    next();
  }
};