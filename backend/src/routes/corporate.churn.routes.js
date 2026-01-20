import express from 'express';
import { getChurnRiskUsers } from '../controllers/corporate.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route   GET /api/corporate/users/churn-risk
 * @desc    Get users with churn risk data for corporate dashboard
 * @access  Private (Corporate Admins and System Admins only)
 */
router.get('/users/churn-risk', 
  requireAuth,
  requireRole('corporate_admin', 'admin'),
  getChurnRiskUsers
);

export default router;