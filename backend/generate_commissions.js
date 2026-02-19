import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './src/models/booking.model.js';
import Commission from './src/models/commission.model.js';
import Station from './src/models/station.model.js';
import Franchise from './src/models/franchise.model.js';
import Corporate from './src/models/corporate.model.js';

dotenv.config();

// Commission calculation helper
function calculateCommission(baseAmount, commissionRate, taxRate = 18) {
  const commissionAmount = (baseAmount * commissionRate) / 100;
  const taxAmount = (commissionAmount * taxRate) / 100;
  const netCommission = commissionAmount + taxAmount;
  
  return {
    commissionAmount,
    taxAmount,
    netCommission
  };
}

async function generateMissingCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Step 1: Update all pending franchises to active
    console.log('=== STEP 1: Updating Franchise Status ===');
    const franchiseUpdateResult = await Franchise.updateMany(
      { status: 'pending' },
      { $set: { status: 'active' } }
    );
    console.log(`Updated ${franchiseUpdateResult.modifiedCount} franchises to 'active' status\n`);

    // Step 2: Get all completed bookings
    console.log('=== STEP 2: Finding Completed Bookings ===');
    const completedBookings = await Booking.find({ status: 'completed' })
      .populate('stationId')
      .lean();
    
    console.log(`Found ${completedBookings.length} completed bookings\n`);

    // Step 3: Generate commissions for each booking
    console.log('=== STEP 3: Generating Commissions ===');
    let generatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const booking of completedBookings) {
      try {
        // Check if commission already exists
        const existing = await Commission.findOne({ bookingId: booking._id });
        if (existing) {
          skippedCount++;
          continue;
        }

        const station = booking.stationId;
        if (!station) {
          console.log(`⚠️  Booking ${booking._id} has no station`);
          errorCount++;
          continue;
        }

        let commissionData = null;

        // For franchise stations
        if (station.franchiseId) {
          const franchise = await Franchise.findById(station.franchiseId);
          if (franchise) {
            const baseAmount = booking.totalCost || booking.amount || 0;
            const rate = franchise.financialInfo?.commissionRate || 10;
            const calculated = calculateCommission(baseAmount, rate, 18);
            
            const endTime = booking.endTime || booking.createdAt;
            
            commissionData = {
              entityType: 'franchise',
              entityId: franchise._id,
              ownerId: franchise.ownerId,
              sourceType: 'booking',
              bookingId: booking._id,
              stationId: station._id,
              baseAmount,
              commissionRate: rate,
              ...calculated,
              period: {
                month: new Date(endTime).getMonth() + 1,
                year: new Date(endTime).getFullYear(),
                quarter: Math.ceil((new Date(endTime).getMonth() + 1) / 3)
              },
              status: 'pending',
              createdAt: booking.createdAt,
              updatedAt: new Date()
            };
          }
        }

        // For corporate stations
        if (!commissionData && station.corporateId) {
          const corporate = await Corporate.findById(station.corporateId);
          if (corporate) {
            const baseAmount = booking.totalCost || booking.amount || 0;
            const rate = corporate.commissionRate || 15;
            const calculated = calculateCommission(baseAmount, rate, 18);
            
            const endTime = booking.endTime || booking.createdAt;
            
            commissionData = {
              entityType: 'corporate',
              entityId: corporate._id,
              ownerId: corporate.adminId,
              sourceType: 'booking',
              bookingId: booking._id,
              stationId: station._id,
              baseAmount,
              commissionRate: rate,
              ...calculated,
              period: {
                month: new Date(endTime).getMonth() + 1,
                year: new Date(endTime).getFullYear(),
                quarter: Math.ceil((new Date(endTime).getMonth() + 1) / 3)
              },
              status: 'pending',
              createdAt: booking.createdAt,
              updatedAt: new Date()
            };
          }
        }

        if (commissionData) {
          await Commission.create(commissionData);
          generatedCount++;
          console.log(`✓ Generated ${commissionData.entityType} commission for booking ${booking._id}: ₹${commissionData.netCommission.toFixed(2)}`);
        } else {
          console.log(`⚠️  Booking ${booking._id}: No franchise or corporate found`);
          errorCount++;
        }

      } catch (error) {
        console.error(`✗ Error processing booking ${booking._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total Completed Bookings: ${completedBookings.length}`);
    console.log(`✓ Commissions Generated: ${generatedCount}`);
    console.log(`⊘ Skipped (already exists): ${skippedCount}`);
    console.log(`✗ Errors: ${errorCount}`);

    // Step 4: Show statistics
    console.log('\n=== COMMISSION STATISTICS ===');
    const totalCommissions = await Commission.countDocuments();
    const franchiseCommissions = await Commission.countDocuments({ entityType: 'franchise' });
    const corporateCommissions = await Commission.countDocuments({ entityType: 'corporate' });
    
    const totalAmount = await Commission.aggregate([
      {
        $group: {
          _id: null,
          totalNet: { $sum: '$netCommission' },
          totalBase: { $sum: '$baseAmount' },
          totalCommission: { $sum: '$commissionAmount' }
        }
      }
    ]);

    console.log(`Total Commissions: ${totalCommissions}`);
    console.log(`Franchise Commissions: ${franchiseCommissions}`);
    console.log(`Corporate Commissions: ${corporateCommissions}`);
    
    if (totalAmount.length > 0) {
      console.log(`\nTotal Base Amount: ₹${totalAmount[0].totalBase.toFixed(2)}`);
      console.log(`Total Commission Amount: ₹${totalAmount[0].totalCommission.toFixed(2)}`);
      console.log(`Total Net (with tax): ₹${totalAmount[0].totalNet.toFixed(2)}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

generateMissingCommissions();
