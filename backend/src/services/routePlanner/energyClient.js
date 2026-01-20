import axios from 'axios';

/**
 * Energy consumption prediction client
 * 
 * This client communicates with the Python ML service to get energy consumption predictions.
 * The ML service improves accuracy by:
 * 1. Using real historical data instead of theoretical calculations
 * 2. Accounting for complex factors like weather, traffic, and driving style
 * 3. Learning from actual energy consumption patterns
 * 4. Adapting to different vehicle types and conditions
 * 
 * Communication happens via HTTP requests to ensure loose coupling between services.
 */

// Get ML service URL from environment variables
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Predict energy consumption for a route segment
 * 
 * @param {Object} params - Prediction parameters
 * @param {number} params.distance - Distance in kilometers
 * @param {number} params.elevation_gain - Elevation gain in meters
 * @param {number} params.vehicle_efficiency - Vehicle efficiency rating
 * @param {number} params.battery_capacity - Battery capacity in kWh
 * @returns {Object} Energy prediction result
 */
export const predictEnergyConsumption = async ({
  distance,
  elevation_gain,
  vehicle_efficiency,
  battery_capacity
}) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict-energy`, {
      distance,
      elevation_gain,
      vehicle_efficiency,
      battery_capacity
    }, {
      timeout: 5000 // 5 second timeout
    });

    return response.data;
  } catch (error) {
    console.error('Error calling ML service:', error.message);
    
    // Fallback to a simple estimation if ML service is unavailable
    // In a production system, you might want to implement a more sophisticated fallback
    const estimatedEnergy = distance * 0.15 + (elevation_gain / 1000) * 2; // Simple heuristic
    
    return {
      predicted_energy_kwh: estimatedEnergy,
      fallback_used: true
    };
  }
};

/**
 * Log prediction request for analytics and model improvement
 * 
 * @param {Object} requestData - Request data sent to ML service
 * @param {Object} responseData - Response data from ML service
 */
export const logPrediction = async (requestData, responseData) => {
  try {
    // In a real implementation, this would log to a database or analytics service
    console.log('ML Prediction Log:', { requestData, responseData });
  } catch (error) {
    console.error('Error logging prediction:', error);
  }
};

export default {
  predictEnergyConsumption,
  logPrediction
};