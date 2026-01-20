import { planRouteService } from '../services/routePlanner/routePlanner.service.js';

/**
 * Plan a multi-stop EV route with optimal charging stops
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const planRoute = async (req, res) => {
  try {
    const { start, destination, vehicle, currentSOC, departureTime } = req.body;
    const userId = req.user.sub || req.user.id;

    // Validate required fields
    if (!start || !destination || !vehicle || currentSOC === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: start, destination, vehicle, currentSOC'
      });
    }

    // Validate coordinates
    if (!start.lat || !start.lng || !destination.lat || !destination.lng) {
      return res.status(400).json({
        success: false,
        message: 'Start and destination must include lat and lng coordinates'
      });
    }

    // Validate SOC range
    if (currentSOC < 0 || currentSOC > 100) {
      return res.status(400).json({
        success: false,
        message: 'Current SOC must be between 0 and 100'
      });
    }

    // Call the service to plan the route
    const routePlan = await planRouteService({
      start,
      destination,
      vehicle,
      currentSOC,
      departureTime: departureTime || new Date().toISOString(),
      userId
    });

    res.status(200).json({
      success: true,
      data: routePlan
    });
  } catch (error) {
    console.error('Error planning route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};