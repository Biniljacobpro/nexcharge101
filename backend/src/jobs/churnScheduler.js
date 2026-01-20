import cron from 'node-cron';
import User from '../models/user.model.js';
import { runPredictionForUser } from '../services/churnPredictor.js';

/**
 * Run the churn prediction job for all active EV users
 */
export async function runChurnPredictionJob() {
  try {
    console.log('Starting churn prediction job...');
    
    // Find all active EV users
    const evUsers = await User.find({
      role: 'ev_user',
      'credentials.isActive': true,
      'roleSpecificData.evUserInfo': { $exists: true }
    });
    
    console.log(`Found ${evUsers.length} active EV users for churn prediction`);
    
    // Process each user
    for (const user of evUsers) {
      try {
        await runPredictionForUser(user._id);
        console.log(`Successfully processed user ${user._id}`);
      } catch (error) {
        console.error(`Error processing user ${user._id}:`, error);
      }
    }
    
    console.log('Churn prediction job completed');
  } catch (error) {
    console.error('Error in churn prediction job:', error);
  }
}

/**
 * Schedule the churn prediction job to run weekly on Mondays at 2:00 AM
 */
export function scheduleChurnPredictionJob() {
  // Schedule: 0 2 * * 1 (At 02:00 on Monday)
  cron.schedule('0 2 * * 1', async () => {
    await runChurnPredictionJob();
  });
  
  console.log('Churn prediction job scheduled to run weekly on Mondays at 2:00 AM');
}

// Export the job for manual execution if needed
export default {
  runChurnPredictionJob,
  scheduleChurnPredictionJob
};