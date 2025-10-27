import cron from 'node-cron';
import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import Station from '../models/station.model.js';
import { createBookingNotification } from '../controllers/notification.controller.js';

/**
 * Job to send 5-minute reminders before booking start time
 * Runs every minute to check for bookings starting in 5 minutes
 */
export const startBookingReminderJob = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Running booking reminder job...');
      
      // Calculate the time window for reminders (5 minutes from now)
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      // Find bookings that start in exactly 5 minutes (with a small buffer)
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      const upcomingBookings = await Booking.find({
        status: 'confirmed',
        startTime: {
          $gte: fiveMinutesAgo,
          $lte: fiveMinutesFromNow
        },
        reminderSent: { $ne: true } // Only send reminder once
      }).populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.email')
        .populate('stationId', 'name location');
      
      console.log(`Found ${upcomingBookings.length} upcoming bookings for reminders`);
      
      // Send reminders for each booking
      for (const booking of upcomingBookings) {
        try {
          // Get user and station details
          const user = booking.userId;
          const station = booking.stationId;
          
          if (!user || !station) {
            console.warn('Skipping booking reminder due to missing user or station data:', booking._id);
            continue;
          }
          
          // Create 5-minute reminder notification
          await createBookingNotification(user._id, 'booking_reminder', booking, station);
          
          // Mark reminder as sent
          booking.reminderSent = true;
          await booking.save();
          
          console.log(`Sent reminder for booking ${booking._id} to user ${user._id}`);
        } catch (error) {
          console.error(`Error sending reminder for booking ${booking._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in booking reminder job:', error);
    }
  });
  
  console.log('Booking reminder job scheduled to run every minute');
};