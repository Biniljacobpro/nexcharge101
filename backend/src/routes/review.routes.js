import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  getStationReviews,
  createReview,
  updateReview,
  deleteReview,
  likeReview,
  dislikeReview
} from '../controllers/review.controller.js';

const router = express.Router();

// Public routes
router.get('/station/:stationId', getStationReviews);

// Protected routes
router.use(requireAuth);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/like', likeReview);
router.post('/:id/dislike', dislikeReview);

export default router;