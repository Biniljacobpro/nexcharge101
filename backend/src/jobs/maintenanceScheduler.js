import cron from 'node-cron';
import Station from '../models/station.model.js';
import { runPredictionForStation } from '../services/maintenancePredictor.js';

// Schedule the job to run once every 24 hours at 2 AM
// Format: second minute hour dayOfMonth month dayOfWeek
const schedule = '0 0 2 * * *'; // Every day at 2:00 AM

let isRunning = false;

const maintenanceJob = cron.schedule(schedule, async () => {
  if (isRunning) {
    console.log('Maintenance prediction job is still running, skipping this execution');
    return;
  }
  
  isRunning = true;
  console.log('Starting maintenance prediction job...');
  
  try {
    // Get all active stations
    const stations = await Station.find({ 
      'operational.status': 'active' 
    }).select('_id');
    
    console.log(`Found ${stations.length} active stations for maintenance prediction`);
    
    // Process each station
    for (const station of stations) {
      try {
        await runPredictionForStation(station._id);
        console.log(`Successfully processed station ${station._id}`);
      } catch (error) {
        console.error(`Error processing station ${station._id}:`, error.message);
      }
    }
    
    console.log('Maintenance prediction job completed');
  } catch (error) {
    console.error('Error in maintenance prediction job:', error);
  } finally {
    isRunning = false;
  }
}, {
  scheduled: false // Don't start automatically, we'll control when it starts
});

// Function to start the job manually (useful for testing)
const startMaintenanceJob = () => {
  console.log('Starting maintenance scheduler job');
  maintenanceJob.start();
};

// Function to run the job immediately (useful for testing)
const runMaintenanceJobNow = async () => {
  console.log('Running maintenance job immediately');
  await maintenanceJob.run();
};

export {
  maintenanceJob,
  startMaintenanceJob,
  runMaintenanceJobNow
};