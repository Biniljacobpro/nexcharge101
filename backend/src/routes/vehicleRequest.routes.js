import express from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
  createVehicleRequest,
  getAllVehicleRequests,
  updateVehicleRequestStatus,
  deleteVehicleRequest
} from '../controllers/vehicleRequest.controller.js';

const router = express.Router();

// User routes
router.post('/', requireAuth, requireRole('ev_user'), createVehicleRequest);

// Admin routes
router.get('/', requireAuth, requireRole('admin'), getAllVehicleRequests);
router.put('/:id', requireAuth, requireRole('admin'), updateVehicleRequestStatus);
router.delete('/:id', requireAuth, requireRole('admin'), deleteVehicleRequest);

export default router;