import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Station from './src/models/station.model.js';
import Booking from './src/models/booking.model.js';
import Commission from './src/models/commission.model.js';

dotenv.config();

async function fixCommissionData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check existing stations
    console.log('=== EXISTING STATIONS ===');
    const stations = await Station.find().select('_id name franchiseId corporateId').lean();
    console.log(`Total Stations: ${stations.length}\n`);
    
    if (stations.length > 0) {
      console.log('Sample Stations:');
      stations.slice(0, 5).forEach(s => {
        console.log(`  - ${s.name || 'N/A'}: FranchiseID=${s.franchiseId || 'N/A'}, CorporateID=${s.corporateId || 'N/A'}`);
      });
      console.log('');
    }

    // Update bookings with valid stationIds to have proper franchise/corporate IDs
    console.log('=== UPDATING BOOKINGS ===');
    const validStationIds = stations.map(s => s._id);
    
    for (const station of stations) {
      const updateData = {};
      if (station.franchiseId) updateData.franchiseId = station.franchiseId;
      if (station.corporateId) updateData.corporateId = station.corporateId;
      
      if (Object.keys(updateData).length > 0) {
        const result = await Booking.updateMany(
          { stationId: station._id },
          { $set: updateData }
        );
        if (result.modifiedCount > 0) {
          console.log(`  Updated ${result.modifiedCount} bookings for station ${station.name}`);
        }
      }
    }

    // Delete commissions with zero amounts
    console.log('\n=== CLEANING UP ZERO-VALUE COMMISSIONS ===');
    const deleteResult = await Commission.deleteMany({
      baseAmount: 0,
      commissionAmount: 0,
      netCommission: 0
    });
    console.log(`Deleted ${deleteResult.deletedCount} zero-value commission records\n`);

    // Show current commission status
    const totalCommissions = await Commission.countDocuments();
    const franchiseCommissions = await Commission.countDocuments({ entityType: 'franchise' });
    const corporateCommissions = await Commission.countDocuments({ entityType: 'corporate' });
    
    console.log('=== FINAL COMMISSION STATUS ===');
    console.log(`Total Commissions: ${totalCommissions}`);
    console.log(`Franchise Commissions: ${franchiseCommissions}`);
    console.log(`Corporate Commissions: ${corporateCommissions}`);

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixCommissionData();
