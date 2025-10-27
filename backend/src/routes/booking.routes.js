import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { 
  createBooking, 
  getUserBookings, 
  cancelBooking, 
  updateBooking,
  getStationBookings,
  completeBooking,
  extendBooking,
  generateOTP,
  verifyOTPAndStartCharging,
  stopCharging
} from '../controllers/booking.controller.js';

const router = Router();


// All booking routes require authentication
router.use(requireAuth);

// User booking routes
router.post('/', createBooking);
router.get('/my-bookings', getUserBookings);
router.patch('/:bookingId/cancel', cancelBooking);
router.patch('/:bookingId', updateBooking);
router.patch('/:bookingId/complete', completeBooking);
router.patch('/:bookingId/extend', extendBooking);

// OTP and charging routes
router.post('/:bookingId/generate-otp', generateOTP);
router.post('/:bookingId/verify-otp', verifyOTPAndStartCharging);
router.post('/:bookingId/stop-charging', stopCharging);

// Station booking routes (for managers/owners)
router.get('/station/:stationId', getStationBookings);

export default router;
