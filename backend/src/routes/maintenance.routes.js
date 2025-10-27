import express from 'express';
import { getMaintenancePredictions } from '../controllers/maintenance.controller.js';
import { runMaintenanceJobNow } from '../jobs/maintenanceScheduler.js';
import { requireAuth, stationManagerOnly, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

// All routes in this file require authentication
router.use(requireAuth);

// Station manager only routes
router.use(stationManagerOnly);

/**
 * @route   GET /api/station-manager/maintenance-predictions
 * @desc    Get stations with medium or high maintenance risk
 * @access  Private (Station Manager only)
 */
router.route('/maintenance-predictions')
  .get(getMaintenancePredictions);

// Admin only route to manually trigger maintenance job
router.use('/run-job', adminOnly);
router.route('/run-job')
  .post(async (_req, res) => {
    try {
      await runMaintenanceJobNow();
      res.status(200).json({
        success: true,
        message: 'Maintenance job triggered successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error triggering maintenance job',
        error: error.message
      });
    }
  });

export default router;