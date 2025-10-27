import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { runPredictionForStation } from '../services/maintenancePredictor.js';
import Station from '../models/station.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set. Please add it to backend/.env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Test the maintenance prediction for a specific station
const testMaintenancePrediction = async () => {
  try {
    // Get the first station from the database
    const station = await Station.findOne();
    if (!station) {
      console.log('No stations found in the database');
      return;
    }
    
    console.log(`Testing maintenance prediction for station: ${station.name} (${station._id})`);
    
    // Run prediction for this station
    const result = await runPredictionForStation(station._id);
    
    console.log('Prediction result:', {
      stationId: result.stationId,
      riskClassification: result.riskClassification,
      riskScore: result.riskScore,
      features: {
        uptimeDelta: result.uptimeDelta,
        utilizationRate: result.utilizationRate,
        avgSessionDuration: result.avgSessionDuration,
        errorCount: result.errorCount,
        lastServiceDays: result.lastServiceDays
      }
    });
    
    // Check that the station was updated with the latest prediction
    const updatedStation = await Station.findById(station._id);
    console.log('Station updated with prediction:', {
      latestRiskClassification: updatedStation.latestRiskClassification,
      lastPredictionDate: updatedStation.lastPredictionDate
    });
  } catch (error) {
    console.error('Error testing maintenance prediction:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testMaintenancePrediction();
  await mongoose.connection.close();
  console.log('Test completed');
};

main();