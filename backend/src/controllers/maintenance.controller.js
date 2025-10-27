import Station from '../models/station.model.js';

/**
 * Get stations with medium or high maintenance risk
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getMaintenancePredictions = async (req, res) => {
  try {
    // Query stations where latestRiskClassification is 'Medium' or 'High'
    // Sort by latestRiskClassification (High first) and then by lastPredictionDate (oldest first)
    const stations = await Station.find({
      latestRiskClassification: { $in: ['Medium', 'High'] }
    })
    .sort({
      latestRiskClassification: -1, // High first, then Medium
      lastPredictionDate: 1         // Oldest predictions first
    })
    .select('_id name code latestRiskClassification lastPredictionDate location');
    
    res.status(200).json({
      success: true,
      count: stations.length,
      data: stations
    });
  } catch (error) {
    console.error('Error fetching maintenance predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance predictions',
      error: error.message
    });
  }
};

export {
  getMaintenancePredictions
};