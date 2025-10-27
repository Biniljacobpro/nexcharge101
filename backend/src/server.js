import 'dotenv/config';
import mongoose from 'mongoose';
import app from './index.js';
import { startBookingReminderJob } from './jobs/bookingReminder.job.js';

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set. Please add it to backend/.env or project root .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    
    // Start the booking reminder job (only in local development)
    if (process.env.NODE_ENV !== 'production') {
      const { startMaintenanceJob } = await import('./jobs/maintenanceScheduler.js');
      startBookingReminderJob();
      startMaintenanceJob();
    }
    
    app.listen(PORT, () => console.log(`API listening on :${PORT}`));
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
})();