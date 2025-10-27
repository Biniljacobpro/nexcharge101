import express from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getCompatibleVehicles,
  getVehicleStats,
  updateCompatibleStations,
  getModelsByMake,
  getCapacitiesByMakeModel,
  getMakes
} from '../controllers/vehicle.controller.js';

const router = express.Router();

// Public routes (for EV users)
router.get('/compatible', getCompatibleVehicles);
router.get('/models', getModelsByMake);
router.get('/capacities', getCapacitiesByMakeModel);
router.get('/makes', getMakes);

// Admin routes
router.use(requireAuth, requireRole('admin'));

router.get('/', getAllVehicles);
router.get('/stats', getVehicleStats);
router.get('/:id', getVehicleById);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
router.post('/:id/compatible-stations', updateCompatibleStations);

export default router;


