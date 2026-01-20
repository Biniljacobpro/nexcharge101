import mongoose from 'mongoose';
import { runPredictionForUser } from '../services/churnPredictor.js';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const testChurnPrediction = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an EV user to test with
    const evUser = await User.findOne({ role: 'ev_user' });
    
    if (!evUser) {
      console.log('No EV user found in the database');
      return;
    }

    console.log(`Testing churn prediction for user: ${evUser.personalInfo.firstName} ${evUser.personalInfo.lastName}`);
    
    // Run prediction for the user
    const result = await runPredictionForUser(evUser._id);
    
    console.log('Prediction result:', result);
    console.log(`Churn Risk: ${result.prediction.risk}`);
    console.log(`Churn Probability: ${(result.prediction.probability * 100).toFixed(2)}%`);
    
    // Verify the user was updated in the database
    const updatedUser = await User.findById(evUser._id);
    console.log(`Updated User Churn Risk: ${updatedUser.roleSpecificData.evUserInfo.churnRisk}`);
    console.log(`Updated User Churn Probability: ${(updatedUser.roleSpecificData.evUserInfo.churnProbability * 100).toFixed(2)}%`);
    console.log(`Last Prediction Date: ${updatedUser.roleSpecificData.evUserInfo.lastPredictionDate}`);
    
  } catch (error) {
    console.error('Error testing churn prediction:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
};

testChurnPrediction();