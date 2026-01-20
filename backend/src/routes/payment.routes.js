import express from 'express';
import { 
  createPaymentOrder, 
  verifyPayment, 
  getPaymentStatus,
  listMyPayments,
  downloadReceipt,
  getPaymentDetails,
  requestRefund,
  handleWebhook,
  getPaymentStatistics,
  getRevenueBreakdown,
  retryPayment
} from '../controllers/payment.controller.js';
import { requireAuth, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

// Webhook endpoint (no auth required, verified by signature)
router.post('/webhook', handleWebhook);

// All other payment routes require authentication
router.use(requireAuth);

// Create Razorpay order for booking payment
router.post('/create-order', createPaymentOrder);

// Verify payment after successful payment
router.post('/verify', verifyPayment);

// Get payment status for a booking
router.get('/status/:bookingId', getPaymentStatus);

// List current user's payments
router.get('/my', listMyPayments);

// Get detailed payment information
router.get('/details/:paymentId', getPaymentDetails);

// Request refund for a payment
router.post('/refund/:paymentId', requestRefund);

// Retry failed payment
router.post('/retry/:paymentId', retryPayment);

// Download PDF receipt for a booking
router.get('/receipt/:bookingId', downloadReceipt);

// Admin routes
router.get('/statistics', adminOnly, getPaymentStatistics);
router.get('/revenue-breakdown', adminOnly, getRevenueBreakdown);

export default router;
