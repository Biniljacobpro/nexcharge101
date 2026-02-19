import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Commission from './src/models/commission.model.js';

dotenv.config();

async function testCommissionStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const franchiseId = '68c3a3224479e686c2db5275';
    
    console.log('=== Testing Commission Stats Calculation ===\n');
    
    // Get all commissions for franchise
    const allCommissions = await Commission.find({ 
      entityType: 'franchise', 
      entityId: franchiseId 
    }).lean();
    
    console.log(`Total Commissions Found: ${allCommissions.length}\n`);
    
    // Manual calculation
    let manualTotal = 0;
    let manualPending = 0;
    let manualPaid = 0;
    let manualApproved = 0;
    
    allCommissions.forEach((c, i) => {
      console.log(`${i + 1}. Commission ${c._id}`);
      console.log(`   Base: ₹${c.baseAmount}`);
      console.log(`   Net: ₹${c.netCommission}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Period: ${c.period.month}/${c.period.year}\n`);
      
      manualTotal += c.netCommission || 0;
      if (c.status === 'pending') manualPending += c.netCommission || 0;
      if (c.status === 'paid') manualPaid += c.netCommission || 0;
      if (c.status === 'approved') manualApproved += c.netCommission || 0;
    });
    
    console.log('--- Manual Calculation ---');
    console.log(`Total Net: ₹${manualTotal.toFixed(2)}`);
    console.log(`Pending: ₹${manualPending.toFixed(2)}`);
    console.log(`Approved: ₹${manualApproved.toFixed(2)}`);
    console.log(`Paid: ₹${manualPaid.toFixed(2)}\n`);
    
    // Test getSummary method
    console.log('--- Testing getSummary Method ---');
    const summary = await Commission.getSummary({ 
      entityType: 'franchise', 
      entityId: franchiseId 
    });
    
    if (summary.length > 0) {
      console.log('Summary Result:', JSON.stringify(summary[0], null, 2));
    } else {
      console.log('Summary returned empty array');
    }
    
    // Test current month
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    console.log(`\n--- Testing Current Month (${currentMonth}/${currentYear}) ---`);
    const monthSummary = await Commission.getSummary({ 
      entityType: 'franchise', 
      entityId: franchiseId,
      'period.year': currentYear,
      'period.month': currentMonth
    });
    
    if (monthSummary.length > 0) {
      console.log('Month Summary Result:', JSON.stringify(monthSummary[0], null, 2));
    } else {
      console.log('No commissions for current month');
    }
    
    // Manual calculation for current month
    const currentMonthCommissions = allCommissions.filter(
      c => c.period.year === currentYear && c.period.month === currentMonth
    );
    
    const manualMonthTotal = currentMonthCommissions.reduce((sum, c) => sum + (c.netCommission || 0), 0);
    console.log(`Manual Month Total: ₹${manualMonthTotal.toFixed(2)}`);
    console.log(`Commissions in current month: ${currentMonthCommissions.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

testCommissionStats();
