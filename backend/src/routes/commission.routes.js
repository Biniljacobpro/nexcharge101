import express from 'express';
import {
  getFranchiseCommissions,
  getCorporateCommissions,
  getMonthlyCommissionSummary,
  approveCommission,
  markCommissionPaid,
  getAllCommissions,
  getCommissionStats
} from '../controllers/commission.controller.js';
import { requireAuth, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

// Franchise commission routes
router.get('/franchise/:franchiseId', requireAuth, getFranchiseCommissions);
router.get('/franchise/:franchiseId/stats', requireAuth, getCommissionStats);
router.get('/franchise/:franchiseId/monthly/:year?', requireAuth, getMonthlyCommissionSummary);

// Corporate commission routes
router.get('/corporate/:corporateId', requireAuth, getCorporateCommissions);
router.get('/corporate/:corporateId/stats', requireAuth, getCommissionStats);
router.get('/corporate/:corporateId/monthly/:year?', requireAuth, getMonthlyCommissionSummary);

// Admin routes
router.get('/all', requireAuth, adminOnly, getAllCommissions);
router.patch('/:commissionId/approve', requireAuth, adminOnly, approveCommission);
router.patch('/:commissionId/pay', requireAuth, adminOnly, markCommissionPaid);

// Generic stats route
router.get('/:entityType/:entityId/stats', requireAuth, getCommissionStats);
router.get('/:entityType/:entityId/monthly', requireAuth, getMonthlyCommissionSummary);

export default router;
