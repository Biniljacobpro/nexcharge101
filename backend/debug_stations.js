import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Station from './src/models/station.model.js';

dotenv.config();

async function debugStations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const stationIds = [
      '68d631af95da8d6ba5729f01',
      '68e0c31ca7b18b34afc53b76'
    ];

    for (const stationId of stationIds) {
      const station = await Station.findById(stationId).lean();
      if (station) {
        console.log(`Station: ${station.name || 'N/A'}`);
        console.log(`  ID: ${station._id}`);
        console.log(`  Franchise ID: ${station.franchiseId || 'N/A'}`);
        console.log(`  Corporate ID: ${station.corporateId || 'N/A'}`);
        console.log(`  Status: ${station.status || station.operational?.status || 'N/A'}`);
        console.log('');
      } else {
        console.log(`Station ${stationId}: NOT FOUND\n`);
      }
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugStations();
