import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './src/models/booking.model.js';
import Station from './src/models/station.model.js';
import Commission from './src/models/commission.model.js';
import Franchise from './src/models/franchise.model.js';
import Corporate from './src/models/corporate.model.js';

dotenv.config();

async function setupCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Step 1: Get all stations
    const stations = await Station.find().lean();
    console.log(`Found ${stations.length} stations`);

    // Step 2: Update all bookings to have franchise/corporate IDs
    console.log('\n=== UPDATING BOOKINGS ===');
    for (const station of stations) {
      if (station.franchiseId && station.corporateId) {
        const result = await Booking.updateMany(
          { stationId: station._id },
          { 
            $set: { 
              franchiseId: station.franchiseId,
              corporateId: station.corporateId
            } 
          }
        );
        console.log(`Station ${station.name}: Updated ${result.modifiedCount} bookings`);
      }
    }

    // Step 3: Get completed bookings
    const completedBookings = await Booking.find({
      status: 'completed',
      $or: [
        { franchiseId: { $exists: true, $ne: null } },
        { corporateId: { $exists: true, $ne: null } }
      ]
    }).limit(5).lean();

    console.log(`\nFound ${completedBookings.length} completed bookings for commission generation\n`);

    if (completedBookings.length === 0) {
      console.log('No bookings available for commission generation');
      await mongoose.disconnect();
      return;
    }

    // Step 4: Generate commissions
    console.log('=== GENERATING COMMISSIONS ===');
    let created = 0;

    for (const booking of completedBookings) {
      // Use test amount since bookings have 0 cost
      const baseAmount = 200 + Math.random() * 300; // Random ₹200-500
      
      // Process franchise commission
      if (booking.franchiseId) {
        const franchise = await Franchise.findById(booking.franchiseId);
        if (franchise) {
          const existing = await Commission.findOne({ 
            bookingId: booking._id, 
            entityType: 'franchise' 
          });

          if (!existing) {
            const rate = franchise.financialInfo?.commissionRate || 10;
            const commission = (baseAmount * rate) / 100;
            const tax = (commission * 18) / 100;
            const net = commission + tax;

            const endTime = booking.endTime || booking.createdAt || new Date();
            
            await Commission.create({
              entityType: 'franchise',
              entityId: booking.franchiseId,
              bookingId: booking._id,
              stationId: booking.stationId,
              ownerId: franchise.ownerId,
              baseAmount: Math.round(baseAmount * 100) / 100,
              commissionRate: rate,
              commissionAmount: Math.round(commission * 100) / 100,
              taxRate: 18,
              taxAmount: Math.round(tax * 100) / 100,
              netCommission: Math.round(net * 100) / 100,
              period: {
                month: new Date(endTime).getMonth() + 1,
                year: new Date(endTime).getFullYear()
              },
              status: ['pending', 'approved', 'paid'][Math.floor(Math.random() * 3)],
              notes: 'Commission generated for completed booking'
            });
            console.log(`✓ Franchise commission: ₹${net.toFixed(2)} (from ₹${baseAmount.toFixed(2)})`);
            created++;
          }
        }
      }

      // Process corporate commission
      if (booking.corporateId) {
        const corporate = await Corporate.findById(booking.corporateId);
        if (corporate && corporate.admins && corporate.admins.length > 0) {
          const existing = await Commission.findOne({ 
            bookingId: booking._id, 
            entityType: 'corporate' 
          });

          if (!existing) {
            const rate = 5; // Corporate gets 5%
            const commission = (baseAmount * rate) / 100;
            const tax = (commission * 18) / 100;
            const net = commission + tax;

            const endTime = booking.endTime || booking.createdAt || new Date();
            
            await Commission.create({
              entityType: 'corporate',
              entityId: booking.corporateId,
              bookingId: booking._id,
              stationId: booking.stationId,
              ownerId: corporate.admins[0],
              baseAmount: Math.round(baseAmount * 100) / 100,
              commissionRate: rate,
              commissionAmount: Math.round(commission * 100) / 100,
              taxRate: 18,
              taxAmount: Math.round(tax * 100) / 100,
              netCommission: Math.round(net * 100) / 100,
              period: {
                month: new Date(endTime).getMonth() + 1,
                year: new Date(endTime).getFullYear()
              },
              status: ['pending', 'approved', 'paid'][Math.floor(Math.random() * 3)],
              notes: 'Corporate commission for completed booking'
            });
            console.log(`✓ Corporate commission: ₹${net.toFixed(2)} (from ₹${baseAmount.toFixed(2)})`);
            created++;
          }
        }
      }
    }

    console.log(`\n✓ Created ${created} commission records\n`);

    // Show final stats
    const franchiseCount = await Commission.countDocuments({ entityType: 'franchise' });
    const corporateCount = await Commission.countDocuments({ entityType: 'corporate' });
    
    console.log('=== COMMISSION SUMMARY ===');
    console.log(`Franchise Commissions: ${franchiseCount}`);
    console.log(`Corporate Commissions: ${corporateCount}`);
    console.log(`Total: ${franchiseCount + corporateCount}`);

    await mongoose.disconnect();
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupCommissions();
