import express from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import upload, { debugUpload } from '../middlewares/upload.js';
import {
  getDashboardData,
  getBookings,
  updateBookingStatus,
  getReports,
  getMaintenanceSchedule,
  createMaintenanceTask,
  updateMaintenanceTask,
  getFeedback,
  respondToFeedback,
  getStationDetails,
  updateStationDetails,
  uploadStationImages,
  deleteStationImage
} from '../controllers/stationManager.controller.js';

const router = express.Router();

// All routes require authentication and station_manager role
router.use(requireAuth);
router.use(requireRole('station_manager'));

// Dashboard routes
router.get('/dashboard', getDashboardData);
router.get('/bookings', getBookings);
router.patch('/bookings/:id/status', updateBookingStatus);
router.get('/reports', getReports);

// Station details management
router.get('/stations/:id', getStationDetails);
router.patch('/stations/:id', updateStationDetails);
router.post('/stations/:id/images', debugUpload, upload.fields([{ name: 'images', maxCount: 10 }]), uploadStationImages);
router.delete('/stations/:id/images', deleteStationImage);

// Maintenance routes
router.get('/maintenance', getMaintenanceSchedule);
router.post('/maintenance', createMaintenanceTask);
router.patch('/maintenance/:id', updateMaintenanceTask);

// Feedback routes
router.get('/feedback', getFeedback);
router.post('/feedback/:id/respond', respondToFeedback);

export default router;