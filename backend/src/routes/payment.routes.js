import express from 'express';
import { 
  createPaymentOrder, 
  verifyPayment, 
  getPaymentStatus,
  listMyPayments,
  downloadReceipt
} from '../controllers/payment.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// All payment routes require authentication
router.use(requireAuth);

// Create Razorpay order for booking payment
router.post('/create-order', createPaymentOrder);

// Verify payment after successful payment
router.post('/verify', verifyPayment);

// Get payment status for a booking
router.get('/status/:bookingId', getPaymentStatus);

// List current user's payments
router.get('/my', listMyPayments);

// Download PDF receipt for a booking
router.get('/receipt/:bookingId', downloadReceipt);

export default router;
