import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './src/models/booking.model.js';
import Commission from './src/models/commission.model.js';
import Station from './src/models/station.model.js';
import Franchise from './src/models/franchise.model.js';

dotenv.config();

async function checkCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check bookings
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const bookingsWithPayment = await Booking.countDocuments({ 
      status: 'completed',
      'payment.paymentStatus': 'completed'
    });

    console.log('=== BOOKINGS ===');
    console.log(`Total Bookings: ${totalBookings}`);
    console.log(`Completed Bookings: ${completedBookings}`);
    console.log(`Completed Bookings with Payment: ${bookingsWithPayment}\n`);

    // Check commissions
    const totalCommissions = await Commission.countDocuments();
    const franchiseCommissions = await Commission.countDocuments({ entityType: 'franchise' });
    const corporateCommissions = await Commission.countDocuments({ entityType: 'corporate' });

    console.log('=== COMMISSIONS ===');
    console.log(`Total Commissions: ${totalCommissions}`);
    console.log(`Franchise Commissions: ${franchiseCommissions}`);
    console.log(`Corporate Commissions: ${corporateCommissions}\n`);

    // Check completed bookings without commissions
    const completedBookingIds = await Booking.find({ status: 'completed' })
      .select('_id')
      .lean();
    
    const bookingsWithCommissions = await Commission.find({
      bookingId: { $in: completedBookingIds.map(b => b._id) }
    }).select('bookingId').lean();

    const bookingIdsWithCommissions = new Set(bookingsWithCommissions.map(c => c.bookingId.toString()));
    const bookingsWithoutCommissions = completedBookingIds.filter(
      b => !bookingIdsWithCommissions.has(b._id.toString())
    );

    console.log('=== MISSING COMMISSIONS ===');
    console.log(`Completed bookings without commissions: ${bookingsWithoutCommissions.length}\n`);

    if (bookingsWithoutCommissions.length > 0) {
      console.log('First 5 bookings missing commissions:');
      const sampleBookings = await Booking.find({
        _id: { $in: bookingsWithoutCommissions.slice(0, 5).map(b => b._id) }
      })
        .populate('stationId', 'name franchiseId corporateId')
        .select('_id bookingNumber status totalCost stationId')
        .lean();

      sampleBookings.forEach(booking => {
        console.log(`- Booking ${booking.bookingNumber}: Station ${booking.stationId?.name}, FranchiseID: ${booking.stationId?.franchiseId || 'N/A'}, CorporateID: ${booking.stationId?.corporateId || 'N/A'}`);
      });
    }

    // Check franchises and their commission rates
    console.log('\n=== FRANCHISES ===');
    const franchises = await Franchise.find().select('name status financialInfo.commissionRate').lean();
    console.log(`Total Franchises: ${franchises.length}`);
    franchises.forEach(f => {
      console.log(`- ${f.name}: Status=${f.status}, Rate=${f.financialInfo?.commissionRate || 'N/A'}%`);
    });

    // Show sample commissions if any exist
    if (totalCommissions > 0) {
      console.log('\n=== SAMPLE COMMISSIONS ===');
      const sampleCommissions = await Commission.find()
        .limit(5)
        .populate('stationId', 'name')
        .select('entityType baseAmount commissionAmount netCommission status period')
        .lean();

      sampleCommissions.forEach(c => {
        console.log(`- ${c.entityType}: Base=₹${c.baseAmount}, Commission=₹${c.commissionAmount}, Net=₹${c.netCommission}, Status=${c.status}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkCommissions();
