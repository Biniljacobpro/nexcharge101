import mongoose from 'mongoose';
import Review from '../models/review.model.js';
import Station from '../models/station.model.js';
import Booking from '../models/booking.model.js';

// GET /api/reviews/station/:stationId - Get all reviews for a station
export const getStationReviews = async (req, res) => {
  try {
    const { stationId } = req.params;
    
    // Check if station exists
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }
    
    // Get all reviews for this station
    const reviews = await Review.find({ stationId })
      .populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.profileImage')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Error fetching station reviews:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/reviews - Create a new review
export const createReview = async (req, res) => {
  try {
    const { stationId, rating, comment, bookingId } = req.body;
    const userId = req.user.sub;
    
    // Validate input
    if (!stationId || !rating || !bookingId) {
      return res.status(400).json({ success: false, message: 'Station ID, rating, and booking ID are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    
    // Check if station exists
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }
    
    // Check if booking exists and belongs to the user
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      userId: userId,
      stationId: stationId,
      status: 'completed' 
    });
    
    if (!booking) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only review stations where you have completed a booking' 
      });
    }
    
    // Check if user has already reviewed this station
    const existingReview = await Review.findOne({ stationId, userId });
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this station' 
      });
    }
    
    // Create the review
    const review = new Review({
      stationId,
      userId,
      rating,
      comment: comment || '',
      bookingId,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: []
    });
    
    await review.save();
    
    // Update station's average rating
    await updateStationRating(stationId);
    
    // Populate user info before sending response
    await review.populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.profileImage');
    
    res.status(201).json({ success: true, message: 'Review created successfully', data: review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /api/reviews/:id - Update a review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.sub;
    
    // Validate ID
    if (!id) {
      return res.status(400).json({ success: false, message: 'Review ID is required' });
    }
    
    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    
    // Find the review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Check if user owns this review
    if (review.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Update the review
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    
    await review.save();
    
    // Update station's average rating
    // Get the stationId - handle both populated and non-populated cases
    let stationId;
    if (typeof review.stationId === 'object' && review.stationId._id) {
      // If populated, get the _id
      stationId = review.stationId._id.toString();
    } else {
      // If not populated, use the stationId directly
      stationId = review.stationId.toString();
    }
    
    if (stationId) {
      await updateStationRating(stationId);
    }
    
    // Populate user info before sending response
    await review.populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.profileImage');
    
    res.json({ success: true, message: 'Review updated successfully', data: review });
  } catch (error) {
    console.error('Error updating review:', error);
    // Check if it's a MongoDB ObjectId error
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /api/reviews/:id - Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    
    // Validate ID
    if (!id) {
      return res.status(400).json({ success: false, message: 'Review ID is required' });
    }
    
    // Find the review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Check if user owns this review or is admin
    if (review.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Get the stationId - handle both populated and non-populated cases
    let stationId;
    if (typeof review.stationId === 'object' && review.stationId._id) {
      // If populated, get the _id
      stationId = review.stationId._id.toString();
    } else {
      // If not populated, use the stationId directly
      stationId = review.stationId.toString();
    }
    
    // Validate stationId
    if (!stationId) {
      console.error('Review has invalid stationId:', review);
      return res.status(500).json({ success: false, message: 'Invalid station reference in review' });
    }
    
    // Delete the review
    await Review.findByIdAndDelete(id);
    
    // Update station's average rating
    await updateStationRating(stationId);
    
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    // Check if it's a MongoDB ObjectId error
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/reviews/:id/like - Like a review
export const likeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    
    // Find the review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Check if user has already liked this review
    const alreadyLiked = review.likedBy.includes(userId);
    const alreadyDisliked = review.dislikedBy.includes(userId);
    
    if (alreadyLiked) {
      // Remove like
      review.likes -= 1;
      review.likedBy = review.likedBy.filter(id => id.toString() !== userId);
    } else {
      // Add like
      review.likes += 1;
      review.likedBy.push(userId);
      
      // Remove dislike if user had disliked before
      if (alreadyDisliked) {
        review.dislikes -= 1;
        review.dislikedBy = review.dislikedBy.filter(id => id.toString() !== userId);
      }
    }
    
    await review.save();
    
    res.json({ success: true, message: 'Review liked successfully', data: { likes: review.likes, dislikes: review.dislikes } });
  } catch (error) {
    console.error('Error liking review:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/reviews/:id/dislike - Dislike a review
export const dislikeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    
    // Find the review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Check if user has already disliked this review
    const alreadyDisliked = review.dislikedBy.includes(userId);
    const alreadyLiked = review.likedBy.includes(userId);
    
    if (alreadyDisliked) {
      // Remove dislike
      review.dislikes -= 1;
      review.dislikedBy = review.dislikedBy.filter(id => id.toString() !== userId);
    } else {
      // Add dislike
      review.dislikes += 1;
      review.dislikedBy.push(userId);
      
      // Remove like if user had liked before
      if (alreadyLiked) {
        review.likes -= 1;
        review.likedBy = review.likedBy.filter(id => id.toString() !== userId);
      }
    }
    
    await review.save();
    
    res.json({ success: true, message: 'Review disliked successfully', data: { likes: review.likes, dislikes: review.dislikes } });
  } catch (error) {
    console.error('Error disliking review:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Helper function to update station's average rating
const updateStationRating = async (stationId) => {
  try {
    // Validate stationId
    if (!stationId) {
      console.error('Invalid stationId provided to updateStationRating:', stationId);
      return;
    }
    
    // Get all reviews for this station
    const reviews = await Review.find({ stationId: stationId });
    
    console.log(`Found ${reviews.length} reviews for station ${stationId}`);
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
    }
    
    // Update station's rating and totalReviews
    // Use mongoose.Types.ObjectId to ensure proper ObjectId format
    const result = await Station.findByIdAndUpdate(
      new mongoose.Types.ObjectId(stationId), 
      { 
        'analytics.rating': averageRating,
        'analytics.totalReviews': reviews.length
      }, 
      { new: true }
    );
    
    if (!result) {
      console.error(`Station with ID ${stationId} not found`);
      return;
    }
    
    console.log(`Updated station ${stationId} with rating: ${averageRating}, totalReviews: ${reviews.length}`);
    console.log('Station analytics after update:', result?.analytics);
  } catch (error) {
    console.error('Error updating station rating:', error);
  }
};