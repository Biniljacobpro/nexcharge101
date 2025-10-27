import express from 'express';
import { 
  getStationAvailability, 
  getMultipleStationsAvailability,
  getAvailabilityForTimeRange
} from '../controllers/availability.controller.js';

const router = express.Router();

// Get real-time availability for a single station
router.get('/station/:stationId', getStationAvailability);

// Get real-time availability for multiple stations
router.post('/stations', getMultipleStationsAvailability);

// Get availability for a specific time range (for booking validation)
router.get('/station/:stationId/timerange', getAvailabilityForTimeRange);

export default router;
