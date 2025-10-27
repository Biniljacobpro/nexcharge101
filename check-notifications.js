import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

// Import the Notification model
import Notification from './backend/src/models/notification.model.js';

async function checkNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexcharge');
    console.log('Connected to MongoDB');

    // Get all notifications
    const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(10);
    console.log('Recent notifications:');
    console.log(JSON.stringify(notifications, null, 2));

    // Get unread count for a sample user (you'll need to replace with actual user ID)
    // const userId = 'USER_ID_HERE';
    // const unreadCount = await Notification.getUnreadCount(userId);
    // console.log(`Unread count for user ${userId}: ${unreadCount}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkNotifications();