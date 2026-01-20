import { Router } from 'express';
import { 
  getPublicStations, 
  getPublicStationById, 
  getPublicVehicles, 
  getPublicVehicleById,
  getStationBookingsTimeline
} from '../controllers/public.controller.js';

const router = Router();

// Public stations endpoint (no auth)
router.get('/stations', getPublicStations);
router.get('/stations/:id', getPublicStationById);

// Public vehicles endpoint (no auth)
router.get('/vehicles', getPublicVehicles);
router.get('/vehicles/:id', getPublicVehicleById);

// Public booking timeline endpoint (no auth)
router.get('/bookings/station/:stationId/timeline', getStationBookingsTimeline);

export default router;


