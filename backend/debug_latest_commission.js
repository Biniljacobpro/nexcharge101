import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './src/models/booking.model.js';
import Commission from './src/models/commission.model.js';
import Station from './src/models/station.model.js';
import Franchise from './src/models/franchise.model.js';

dotenv.config();

async function debugLatestCommission() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get the latest completed booking
    console.log('=== LATEST COMPLETED BOOKINGS ===');
    const latestBookings = await Booking.find({ status: 'completed' })
      .sort({ completedAt: -1, updatedAt: -1 })
      .limit(5)
      .populate('stationId', 'name franchiseId corporateId')
      .lean();

    latestBookings.forEach((b, i) => {
      console.log(`\n${i + 1}. Booking ID: ${b._id}`);
      console.log(`   Station: ${b.stationId?.name || 'N/A'}`);
      console.log(`   FranchiseId: ${b.stationId?.franchiseId || 'N/A'}`);
      console.log(`   Total Cost: ₹${b.totalCost || b.amount || 0}`);
      console.log(`   Actual Cost: ₹${b.pricing?.actualCost || 0}`);
      console.log(`   Estimated Cost: ₹${b.pricing?.estimatedCost || 0}`);
      console.log(`   Payment Status: ${b.payment?.paymentStatus || 'N/A'}`);
      console.log(`   Paid Amount: ₹${b.payment?.paidAmount || 0}`);
      console.log(`   Completed At: ${b.completedAt || b.updatedAt}`);
    });

    // Get the latest commissions
    console.log('\n\n=== LATEST COMMISSIONS ===');
    const latestCommissions = await Commission.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('stationId', 'name')
      .populate('bookingId', 'bookingNumber totalCost')
      .lean();

    if (latestCommissions.length === 0) {
      console.log('❌ NO COMMISSIONS FOUND!\n');
    } else {
      latestCommissions.forEach((c, i) => {
        console.log(`\n${i + 1}. Commission ID: ${c._id}`);
        console.log(`   Entity Type: ${c.entityType}`);
        console.log(`   Entity ID: ${c.entityId}`);
        console.log(`   Booking ID: ${c.bookingId?._id || 'N/A'}`);
        console.log(`   Station: ${c.stationId?.name || 'N/A'}`);
        console.log(`   Base Amount: ₹${c.baseAmount}`);
        console.log(`   Commission Rate: ${c.commissionRate}%`);
        console.log(`   Commission Amount: ₹${c.commissionAmount}`);
        console.log(`   Tax Amount: ₹${c.taxAmount}`);
        console.log(`   Net Commission: ₹${c.netCommission}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Created At: ${c.createdAt}`);
      });
    }

    // Check for completed bookings WITHOUT commissions
    console.log('\n\n=== COMPLETED BOOKINGS WITHOUT COMMISSIONS ===');
    const completedBookingIds = await Booking.find({ status: 'completed' })
      .sort({ completedAt: -1, updatedAt: -1 })
      .limit(10)
      .select('_id')
      .lean();

    const existingCommissionBookingIds = await Commission.find({
      bookingId: { $in: completedBookingIds.map(b => b._id) }
    }).select('bookingId').lean();

    const existingSet = new Set(existingCommissionBookingIds.map(c => c.bookingId.toString()));
    const missing = completedBookingIds.filter(b => !existingSet.has(b._id.toString()));

    if (missing.length > 0) {
      console.log(`Found ${missing.length} completed bookings without commissions:`);
      const missingBookings = await Booking.find({
        _id: { $in: missing.map(m => m._id) }
      })
        .populate('stationId', 'name franchiseId corporateId')
        .lean();

      missingBookings.forEach((b, i) => {
        console.log(`\n${i + 1}. Booking ID: ${b._id}`);
        console.log(`   Station: ${b.stationId?.name || 'NO STATION!'}`);
        console.log(`   FranchiseId: ${b.stationId?.franchiseId || 'N/A'}`);
        console.log(`   CorporateId: ${b.stationId?.corporateId || 'N/A'}`);
        console.log(`   Total Cost: ₹${b.totalCost || 0}`);
        console.log(`   Completed At: ${b.completedAt || b.updatedAt}`);
      });
    } else {
      console.log('✓ All recent completed bookings have commissions');
    }

    // Show total commission stats per franchise
    console.log('\n\n=== COMMISSION STATS BY FRANCHISE ===');
    const franchiseStats = await Commission.aggregate([
      {
        $match: { entityType: 'franchise' }
      },
      {
        $group: {
          _id: '$entityId',
          totalCommissions: { $sum: 1 },
          totalBase: { $sum: '$baseAmount' },
          totalCommissionAmount: { $sum: '$commissionAmount' },
          totalNet: { $sum: '$netCommission' },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          paid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          }
        }
      }
    ]);

    if (franchiseStats.length === 0) {
      console.log('No franchise commissions found');
    } else {
      for (const stat of franchiseStats) {
        const franchise = await Franchise.findById(stat._id).select('name').lean();
        console.log(`\nFranchise: ${franchise?.name || stat._id}`);
        console.log(`  Total Commissions: ${stat.totalCommissions}`);
        console.log(`  Total Base Amount: ₹${stat.totalBase.toFixed(2)}`);
        console.log(`  Total Commission: ₹${stat.totalCommissionAmount.toFixed(2)}`);
        console.log(`  Total Net: ₹${stat.totalNet.toFixed(2)}`);
        console.log(`  Status: Pending=${stat.pending}, Approved=${stat.approved}, Paid=${stat.paid}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n\n✓ Disconnected from MongoDB');
  }
}

debugLatestCommission();
