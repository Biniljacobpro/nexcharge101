import express from 'express';
import {
  submitApplication,
  getAllApplications,
  getApplicationById,
  reviewApplication,
  getApplicationStats
} from '../controllers/corporateApplication.controller.js';
import { testEmailService } from '../utils/emailService.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

// Public route - anyone can submit an application
router.post('/apply', submitApplication);

// Protected routes - admin only
router.get('/applications', requireAuth, requireRole('admin'), getAllApplications);
router.get('/applications/:id', requireAuth, requireRole('admin'), getApplicationById);
router.put('/applications/:id/review', requireAuth, requireRole('admin'), reviewApplication);
router.get('/stats', requireAuth, requireRole('admin'), getApplicationStats);

// Test email service route (admin only)
router.post('/test-email', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await testEmailService();
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully! Check your inbox.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email. Check server logs.'
      });
    }
  } catch (error) {
    console.error('Error testing email service:', error);
    res.status(500).json({
      success: false,
      message: `Error testing email service: ${error.message}`
    });
  }
});

export default router;

