// Script to update all stations to include the totalReviews field
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Station from '../models/station.model.js';
import Review from '../models/review.model.js';

dotenv.config();

const updateStationReviews = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexcharge', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Get all stations
    const stations = await Station.find({});
    console.log(`Found ${stations.length} stations`);
    
    // Update each station
    for (const station of stations) {
      // Count reviews for this station
      const reviewCount = await Review.countDocuments({ stationId: station._id });
      const reviews = await Review.find({ stationId: station._id });
      
      let averageRating = 0;
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = totalRating / reviews.length;
      }
      
      // Update station
      await Station.findByIdAndUpdate(station._id, {
        'analytics.rating': averageRating,
        'analytics.totalReviews': reviewCount
      });
      
      console.log(`Updated station ${station.name}: ${reviewCount} reviews, average rating: ${averageRating}`);
    }
    
    console.log('All stations updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating stations:', error);
    process.exit(1);
  }
};

updateStationReviews();