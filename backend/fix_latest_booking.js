import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './src/models/booking.model.js';
import Commission from './src/models/commission.model.js';
import Station from './src/models/station.model.js';
import Franchise from './src/models/franchise.model.js';
import Corporate from './src/models/corporate.model.js';
import User from './src/models/user.model.js';

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

async function fixLatestBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const bookingId = '697aeff2a587eeaf1604bf5e';
    
    console.log('=== Fixing Latest Booking ===');
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      console.log('Booking not found!');
      return;
    }

    console.log(`Booking ${bookingId}`);
    console.log(`Current totalCost: ₹${booking.totalCost || 0}`);
    console.log(`Payment paidAmount: ₹${booking.payment?.paidAmount || 0}`);
    console.log(`Pricing actualCost: ₹${booking.pricing?.actualCost || 0}`);
    
    // Update totalCost
    const newTotalCost = booking.payment?.paidAmount || booking.pricing?.actualCost || 0;
    booking.totalCost = newTotalCost;
    await booking.save();
    
    console.log(`\n✓ Updated totalCost to: ₹${newTotalCost}`);

    // Delete old commission if exists
    const oldCommission = await Commission.findOne({ bookingId });
    if (oldCommission) {
      console.log(`\nDeleting old commission with ₹${oldCommission.netCommission}...`);
      await Commission.deleteOne({ _id: oldCommission._id });
      console.log('✓ Old commission deleted');
    }

    // Generate new commission manually
    console.log('\nGenerating new commission...');
    const bookingFull = await Booking.findById(bookingId).populate('stationId');
    const station = bookingFull.stationId;
    
    if (!station) {
      console.log('✗ No station found for booking');
      return;
    }

    if (station.franchiseId) {
      const franchise = await Franchise.findById(station.franchiseId);
      if (franchise && franchise.status === 'active') {
        const baseAmount = bookingFull.totalCost || bookingFull.payment?.paidAmount || 0;
        const rate = franchise.financialInfo?.commissionRate || 10;
        const calculated = calculateCommission(baseAmount, rate, 18);
        
        const commissionData = {
          entityType: 'franchise',
          entityId: franchise._id,
          ownerId: franchise.ownerId,
          sourceType: 'booking',
          bookingId: bookingFull._id,
          stationId: station._id,
          baseAmount,
          commissionRate: rate,
          ...calculated,
          period: {
            month: new Date(bookingFull.endTime || bookingFull.createdAt).getMonth() + 1,
            year: new Date(bookingFull.endTime || bookingFull.createdAt).getFullYear(),
            quarter: Math.ceil((new Date(bookingFull.endTime || bookingFull.createdAt).getMonth() + 1) / 3)
          },
          status: 'pending',
          createdAt: bookingFull.createdAt,
          updatedAt: new Date()
        };

        const newCommission = await Commission.create(commissionData);
        
        console.log('\n✓ NEW COMMISSION CREATED:');
        console.log(`  Base Amount: ₹${newCommission.baseAmount}`);
        console.log(`  Commission Rate: ${newCommission.commissionRate}%`);
        console.log(`  Commission Amount: ₹${newCommission.commissionAmount}`);
        console.log(`  Tax Amount: ₹${newCommission.taxAmount}`);
        console.log(`  Net Commission: ₹${newCommission.netCommission}`);
        console.log(`  Status: ${newCommission.status}`);
      }
    }

    // Show total franchise commission now
    console.log('\n=== FRANCHISE TOTAL COMMISSIONS ===');
    const stats = await Commission.aggregate([
      {
        $match: { entityType: 'franchise' }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalBase: { $sum: '$baseAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalNet: { $sum: '$netCommission' }
        }
      }
    ]);

    if (stats.length > 0) {
      console.log(`Total Commissions: ${stats[0].count}`);
      console.log(`Total Base: ₹${stats[0].totalBase.toFixed(2)}`);
      console.log(`Total Commission: ₹${stats[0].totalCommission.toFixed(2)}`);
      console.log(`Total Net: ₹${stats[0].totalNet.toFixed(2)}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

fixLatestBooking();
