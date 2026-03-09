import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './src/models/booking.model.js';
import Commission from './src/models/commission.model.js';
import Franchise from './src/models/franchise.model.js';
import Corporate from './src/models/corporate.model.js';

dotenv.config();

async function createTestCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get bookings with valid franchise/corporate links
    const bookings = await Booking.find({
      status: 'completed',
      franchiseId: { $exists: true },
      corporateId: { $exists: true }
    }).limit(10).lean();

    console.log(`Found ${bookings.length} completed bookings with franchise/corporate links\n`);

    // Get franchise and corporate info
    const franchiseId = bookings[0]?.franchiseId;
    const corporateId = bookings[0]?.corporateId;

    if (!franchiseId || !corporateId) {
      console.log('No valid bookings found');
      await mongoose.disconnect();
      return;
    }

    const franchise = await Franchise.findById(franchiseId);
    const corporate = await Corporate.findById(corporateId);

    console.log(`Franchise: ${franchise.name} (Commission Rate: ${franchise.financialInfo?.commissionRate || 10}%)`);
    console.log(`Corporate: ${corporate.name}\n`);

    // Create sample commissions with realistic values
    console.log('=== CREATING TEST COMMISSIONS ===');
    let created = 0;

    for (const booking of bookings.slice(0, 5)) {
      // Use a test amount if booking has 0 cost
      const baseAmount = booking.totalCost || booking.amount || 150; // Default to ₹150 if 0
      const franchiseRate = franchise.financialInfo?.commissionRate || 10;
      const corporateRate = 5; // Corporate gets 5% of revenue

      // Calculate commissions
      const franchiseCommission = (baseAmount * franchiseRate) / 100;
      const franchiseTax = (franchiseCommission * 18) / 100;
      const franchiseNet = franchiseCommission + franchiseTax;

      const corporateCommission = (baseAmount * corporateRate) / 100;
      const corporateTax = (corporateCommission * 18) / 100;
      const corporateNet = corporateCommission + corporateTax;

      const endTime = booking.endTime || booking.createdAt || new Date();
      const month = new Date(endTime).getMonth() + 1;
      const year = new Date(endTime).getFullYear();

      // Create franchise commission
      const existing = await Commission.findOne({ bookingId: booking._id, entityType: 'franchise' });
      if (!existing) {
        await Commission.create({
          entityType: 'franchise',
          entityId: franchiseId,
          bookingId: booking._id,
          stationId: booking.stationId,
          ownerId: franchise.ownerId,
          baseAmount,
          commissionRate: franchiseRate,
          commissionAmount: franchiseCommission,
          taxRate: 18,
          taxAmount: franchiseTax,
          netCommission: franchiseNet,
          period: { month, year },
          status: Math.random() > 0.5 ? 'approved' : 'pending',
          notes: 'Test commission for demonstration'
        });
        console.log(`  ✓ Created franchise commission: ₹${franchiseNet.toFixed(2)} from ₹${baseAmount}`);
        created++;
      }

      // Create corporate commission      
      const existingCorp = await Commission.findOne({ bookingId: booking._id, entityType: 'corporate' });
      if (!existingCorp) {
        await Commission.create({
          entityType: 'corporate',
          entityId: corporateId,
          bookingId: booking._id,
          stationId: booking.stationId,
          ownerId: corporate.admins[0], // Use first admin
          baseAmount,
          commissionRate: corporateRate,
          commissionAmount: corporateCommission,
          taxRate: 18,
          taxAmount: corporateTax,
          netCommission: corporateNet,
          period: { month, year },
          status: Math.random() > 0.3 ? 'paid' : 'pending',
          notes: 'Test corporate commission for demonstration'
        });
        console.log(`  ✓ Created corporate commission: ₹${corporateNet.toFixed(2)} from ₹${baseAmount}`);
        created++;
      }
    }

    console.log(`\n✓ Created ${created} test commission records\n`);

    // Show final stats
    const stats = {
      total: await Commission.countDocuments(),
      franchise: await Commission.countDocuments({ entityType: 'franchise' }),
      corporate: await Commission.countDocuments({ entityType: 'corporate' })
    };

    console.log('=== FINAL COMMISSION STATUS ===');
    console.log(`Total Commissions: ${stats.total}`);
    console.log(`Franchise Commissions: ${stats.franchise}`);
    console.log(`Corporate Commissions: ${stats.corporate}`);

    await mongoose.disconnect();
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createTestCommissions();
