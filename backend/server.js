import app from './src/index.js';
import mongoose from 'mongoose';
import { startBookingReminderJob } from './src/jobs/bookingReminder.job.js';
import { startMaintenanceJob } from './src/jobs/maintenanceScheduler.js';

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set. Please add it to backend/.env or project root .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    
    // Start the booking reminder job
    startBookingReminderJob();
    startMaintenanceJob();
    
    app.listen(PORT, () => console.log(`API listening on :${PORT}`));
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
})();