import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  signup, 
  login, 
  googleSignIn, 
  me, 
  refresh,
  logout,
  updateProfile,
  updatePassword,
  updateProfileImage,
  uploadProfileImage,
  checkEmailAvailability,
  updateUserVehicle,
  getMyVehicles,
  addUserVehicle,
  removeUserVehicle,
  updateUserVehicleAtIndex
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = Router();

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 100 });
router.use(limiter);

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleSignIn);
router.get('/me', requireAuth, me);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/check-email', checkEmailAvailability);

// Profile management routes
router.put('/profile', requireAuth, updateProfile);
router.put('/user-vehicle', requireAuth, updateUserVehicle);
router.get('/my-vehicles', requireAuth, getMyVehicles);
router.post('/my-vehicles', requireAuth, addUserVehicle);
router.delete('/my-vehicles/:index', requireAuth, removeUserVehicle);
router.put('/my-vehicles/:index', requireAuth, updateUserVehicleAtIndex);
router.put('/password', requireAuth, updatePassword);
router.put('/profile-image', requireAuth, updateProfileImage);
router.post('/upload-profile-image', requireAuth, upload.single('profileImage'), uploadProfileImage);

// Forgot password (OTP) routes
import { requestPasswordResetOtp, verifyPasswordResetOtp, resetPasswordWithOtp } from '../controllers/auth.controller.js';
router.post('/forgot-password/request-otp', requestPasswordResetOtp);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);

export default router;

