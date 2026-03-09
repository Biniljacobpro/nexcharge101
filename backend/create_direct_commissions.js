import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Commission from './src/models/commission.model.js';
import Franchise from './src/models/franchise.model.js';
import Corporate from './src/models/corporate.model.js';
import Station from './src/models/station.model.js';

dotenv.config();

async function createCommissionsDirectly() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Delete all existing commissions to start fresh
    await Commission.deleteMany({});
    console.log('Cleared existing commissions\n');

    // Get franchise and corporate
    const franchise = await Franchise.findOne();
    const corporate = await Corporate.findOne();
    const station = await Station.findOne();

    if (!franchise || !corporate || !station) {
      console.log('Missing franchise, corporate, or station data');
      await mongoose.disconnect();
      return;
    }

    console.log(`Franchise: ${franchise.name} (ID: ${franchise._id})`);
    console.log(`Corporate: ${corporate.name} (ID: ${corporate._id})`);
    console.log(`Station: ${station.name} (ID: ${station._id})\n`);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    console.log('=== CREATING FRANCHISE COMMISSIONS ===');
    const franchiseCommissions = [];
    for (let i = 0; i < 8; i++) {
      const baseAmount = 180 + Math.random() * 320; // ₹180-500
      const rate = franchise.financialInfo?.commissionRate || 10;
      const commission = (baseAmount * rate) / 100;
      const tax = (commission * 18) / 100;
      const net = commission + tax;

      // Ensure month is between 1-12
      let month = currentMonth - Math.floor(i / 3);
      if (month < 1) month = 12 + month;

      const comm = await Commission.create({
        entityType: 'franchise',
        entityId: franchise._id,
        stationId: station._id,
        ownerId: franchise.ownerId,
        baseAmount: Math.round(baseAmount * 100) / 100,
        commissionRate: rate,
        commissionAmount: Math.round(commission * 100) / 100,
        taxRate: 18,
        taxAmount: Math.round(tax * 100) / 100,
        netCommission: Math.round(net * 100) / 100,
        period: { month, year: currentYear },
        status: ['pending', 'approved', 'paid'][i % 3],
        notes: `Commission for booking #${1000 + i}`
      });
      franchiseCommissions.push(comm);
      console.log(`  ${i + 1}. ₹${net.toFixed(2)} (base: ₹${baseAmount.toFixed(2)}) - ${comm.status}`);
    }

    console.log(`\n=== CREATING CORPORATE COMMISSIONS ===`);
    const corporateCommissions = [];
    for (let i = 0; i < 8; i++) {
      const baseAmount = 200 + Math.random() * 300; // ₹200-500
      const rate = 5; // Corporate gets 5%
      const commission = (baseAmount * rate) / 100;
      const tax = (commission * 18) / 100;
      const net = commission + tax;

      // Ensure month is between 1-12
      let month = currentMonth - Math.floor(i / 3);
      if (month < 1) month = 12 + month;

      const comm = await Commission.create({
        entityType: 'corporate',
        entityId: corporate._id,
        stationId: station._id,
        ownerId: corporate.admins[0],
        baseAmount: Math.round(baseAmount * 100) / 100,
        commissionRate: rate,
        commissionAmount: Math.round(commission * 100) / 100,
        taxRate: 18,
        taxAmount: Math.round(tax * 100) / 100,
        netCommission: Math.round(net * 100) / 100,
        period: { month, year: currentYear },
        status: ['pending', 'approved', 'paid'][i % 3],
        notes: `Corporate commission for booking #${2000 + i}`
      });
      corporateCommissions.push(comm);
      console.log(`  ${i + 1}. ₹${net.toFixed(2)} (base: ₹${baseAmount.toFixed(2)}) - ${comm.status}`);
    }

    // Calculate totals
    const franchiseTotal = franchiseCommissions.reduce((sum, c) => sum + c.netCommission, 0);
    const corporateTotal = corporateCommissions.reduce((sum, c) => sum + c.netCommission, 0);

    console.log(`\n=== SUMMARY ===`);
    console.log(`Franchise Commissions: ${franchiseCommissions.length} (Total: ₹${franchiseTotal.toFixed(2)})`);
    console.log(`Corporate Commissions: ${corporateCommissions.length} (Total: ₹${corporateTotal.toFixed(2)})`);
    console.log(`Grand Total: ${franchiseCommissions.length + corporateCommissions.length} commissions`);

    await mongoose.disconnect();
    console.log('\n✓ Done! Refresh your dashboard to see the commissions.');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createCommissionsDirectly();
