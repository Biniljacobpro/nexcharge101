import { Router } from 'express';
import { requireAuth, enforcePasswordChange } from '../middlewares/auth.js';
import {
  getDashboardData,
  getAnalytics,
  getRecentBookings,
  getFranchiseOwners,
  addFranchiseOwner,
  updateFranchiseOwner,
  deleteFranchiseOwner,
  getCorporateStations,
  updateCorporateStationStatus,
  getCorporateInfo,
  updateCorporateName,
  getCorporateUsers,
  updateCorporateUserStatus
} from '../controllers/corporate.controller.js';

const router = Router();

// All routes require authentication and no pending password reset
router.use(requireAuth, enforcePasswordChange);

// Dashboard routes
router.get('/dashboard', getDashboardData);
router.get('/analytics', getAnalytics);
router.get('/bookings/recent', getRecentBookings);

// Corporate profile/info routes
router.get('/info', getCorporateInfo);
router.patch('/info/name', updateCorporateName);

// Franchise management routes
router.get('/franchises', getFranchiseOwners);
router.post('/franchises', addFranchiseOwner);
router.put('/franchises/:franchiseId', updateFranchiseOwner);
router.delete('/franchises/:franchiseId', deleteFranchiseOwner);

// Stations under this corporate
router.get('/stations', getCorporateStations);
router.patch('/stations/:id/status', updateCorporateStationStatus);

// User management routes
router.get('/users', getCorporateUsers);
router.put('/users/:id/status', updateCorporateUserStatus);

export default router;
