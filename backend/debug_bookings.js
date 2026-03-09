import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './src/models/booking.model.js';

dotenv.config();

async function debugBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get a few completed bookings
    const completedBookings = await Booking.find({ status: 'completed' })
      .limit(5)
      .lean();
    
    console.log('Sample Completed Bookings:');
    completedBookings.forEach((booking, idx) => {
      console.log(`\nBooking ${idx + 1}:`);
      console.log(`  ID: ${booking._id}`);
      console.log(`  Booking Number: ${booking.bookingNumber || 'N/A'}`);
      console.log(`  Station ID: ${booking.stationId || 'N/A'}`);
      console.log(`  Franchise ID: ${booking.franchiseId || 'N/A'}`);
      console.log(`  Corporate ID: ${booking.corporateId || 'N/A'}`);
      console.log(`  Total Cost: ${booking.totalCost || booking.amount || 0}`);
      console.log(`  Status: ${booking.status}`);
      console.log(`  Payment Status: ${booking.payment?.paymentStatus || 'N/A'}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugBookings();
