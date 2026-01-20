// Script to seed the database with sample fraud logs for testing
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: `${__dirname}/.env` });

// Import models
import User from './src/models/user.model.js';
import Station from './src/models/station.model.js';
import FraudAttemptLog from './src/models/fraudAttemptLog.model.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexcharge');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Seed data
const seedFraudLogs = async () => {
  try {
    await connectDB();
    
    // Clear existing fraud logs
    await FraudAttemptLog.deleteMany();
    console.log('Cleared existing fraud logs');
    
    // Get some sample users and stations
    const users = await User.find().limit(5);
    const stations = await Station.find().limit(5);
    
    if (users.length === 0 || stations.length === 0) {
      console.log('No users or stations found. Please seed the database with sample data first.');
      process.exit(1);
    }
    
    // Create sample fraud logs
    const fraudLogs = [
      {
        userId: users[0]._id,
        stationId: stations[0]._id,
        classification: 'High-Risk',
        decisionPath: 'Duration < 15 mins AND RegTime < 30 days AND FailureRate > 50%',
        featuresUsed: {
          requestedDuration: 10,
          timeSinceRegistration: 15,
          paymentFailureRate: 0.75,
          totalCancellations: 8,
          timeSlot: 1
        },
        status: 'Logged'
      },
      {
        userId: users[1]._id,
        stationId: stations[1]._id,
        classification: 'Legitimate',
        decisionPath: 'Standard booking pattern',
        featuresUsed: {
          requestedDuration: 60,
          timeSinceRegistration: 365,
          paymentFailureRate: 0.05,
          totalCancellations: 1,
          timeSlot: 0
        },
        status: 'Reviewed'
      },
      {
        userId: users[2]._id,
        stationId: stations[2]._id,
        classification: 'High-Risk',
        decisionPath: 'Cancellations > 5 AND Peak Time',
        featuresUsed: {
          requestedDuration: 20,
          timeSinceRegistration: 5,
          paymentFailureRate: 0.6,
          totalCancellations: 12,
          timeSlot: 1
        },
        status: 'Action Taken'
      }
    ];
    
    // Insert sample fraud logs
    await FraudAttemptLog.insertMany(fraudLogs);
    console.log('Sample fraud logs inserted successfully');
    
    // Close connection
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding fraud logs:', error);
    process.exit(1);
  }
};

// Run the seed function
seedFraudLogs();