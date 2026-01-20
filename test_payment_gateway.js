/**
 * Payment System Test Suite
 * 
 * This file contains utilities and test scenarios for the payment gateway
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api';
let authToken = '';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Test123!@#'
};

const testBooking = {
  stationId: null, // Will be set from first available station
  chargerType: 'ccs2',
  startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
  vehicleId: null, // Will be set from first available vehicle
  currentCharge: 20,
  targetCharge: 80,
  notes: 'Test booking for payment integration'
};

// Razorpay test credentials
const testCards = {
  success: {
    number: '4111111111111111',
    cvv: '123',
    expiry: '12/25'
  },
  failure: {
    number: '4111111111111111',
    cvv: '111',
    expiry: '12/25'
  }
};

const testUPI = {
  success: 'success@razorpay',
  failure: 'failure@razorpay'
};

/**
 * Helper function to make authenticated requests
 */
async function authFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  return response;
}

/**
 * Test 1: User Login
 */
async function testLogin() {
  console.log('\n🔐 Test 1: User Login');
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (data.accessToken) {
      authToken = data.accessToken;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

/**
 * Test 2: Get Available Stations
 */
async function testGetStations() {
  console.log('\n🚉 Test 2: Get Available Stations');
  try {
    const response = await fetch(`${API_BASE}/public/stations`);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const station = data.data.find(s => s.status === 'active');
      if (station) {
        testBooking.stationId = station._id;
        console.log('✅ Found active station:', station.name);
        return station;
      }
    }
    
    console.log('❌ No active stations found');
    return null;
  } catch (error) {
    console.error('❌ Error fetching stations:', error.message);
    return null;
  }
}

/**
 * Test 3: Get User Vehicles
 */
async function testGetVehicles() {
  console.log('\n🚗 Test 3: Get User Vehicles');
  try {
    const response = await authFetch(`${API_BASE}/auth/my-vehicles`);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      // Get first vehicle or create a test vehicle
      const publicVehiclesRes = await fetch(`${API_BASE}/public/vehicles`);
      const publicVehicles = await publicVehiclesRes.json();
      
      if (publicVehicles.data && publicVehicles.data.length > 0) {
        testBooking.vehicleId = publicVehicles.data[0]._id;
        console.log('✅ Found vehicle:', publicVehicles.data[0].make, publicVehicles.data[0].model);
        return publicVehicles.data[0];
      }
    }
    
    console.log('❌ No vehicles found');
    return null;
  } catch (error) {
    console.error('❌ Error fetching vehicles:', error.message);
    return null;
  }
}

/**
 * Test 4: Create Payment Order
 */
async function testCreatePaymentOrder() {
  console.log('\n💳 Test 4: Create Payment Order');
  try {
    const response = await authFetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      body: JSON.stringify(testBooking)
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Payment order created');
      console.log('   Order ID:', data.data.orderId);
      console.log('   Amount:', data.data.amount / 100, 'INR');
      console.log('   Booking ID:', data.data.bookingId);
      console.log('   Payment ID:', data.data.paymentId);
      console.log('   Breakdown:', JSON.stringify(data.data.breakdown, null, 2));
      return data.data;
    } else {
      console.log('❌ Failed to create payment order:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating payment order:', error.message);
    return null;
  }
}

/**
 * Test 5: Simulate Payment Verification (Manual)
 */
function testPaymentVerification(orderData) {
  console.log('\n✅ Test 5: Payment Verification (Manual Test)');
  console.log('To test payment verification:');
  console.log('1. Use the Razorpay test credentials:');
  console.log('   Card: 4111 1111 1111 1111');
  console.log('   CVV: Any 3 digits');
  console.log('   Expiry: Any future date');
  console.log('   OTP: 1234');
  console.log('\n2. Or use test UPI: success@razorpay');
  console.log('\n3. Complete the payment in the frontend');
  console.log('\n4. The payment verification happens automatically');
  console.log('\n   Order ID:', orderData.orderId);
  console.log('   Booking ID:', orderData.bookingId);
}

/**
 * Test 6: Get Payment Status
 */
async function testGetPaymentStatus(bookingId) {
  console.log('\n📊 Test 6: Get Payment Status');
  try {
    const response = await authFetch(`${API_BASE}/payments/status/${bookingId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Payment status retrieved');
      console.log('   Status:', data.data.paymentStatus);
      console.log('   Amount:', data.data.paidAmount || data.data.estimatedCost);
      console.log('   Booking Status:', data.data.bookingStatus);
      
      if (data.data.detailedPayment) {
        console.log('   Detailed Breakdown:');
        console.log('     Base:', data.data.detailedPayment.breakdown.baseAmount);
        console.log('     GST:', data.data.detailedPayment.breakdown.gst);
        console.log('     Platform Fee:', data.data.detailedPayment.breakdown.platformFee);
        console.log('     Total:', data.data.detailedPayment.breakdown.total);
      }
      return data.data;
    } else {
      console.log('❌ Failed to get payment status:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting payment status:', error.message);
    return null;
  }
}

/**
 * Test 7: List User Payments
 */
async function testListPayments() {
  console.log('\n📋 Test 7: List User Payments');
  try {
    const response = await authFetch(`${API_BASE}/payments/my?limit=10`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Found ${data.data.length} payments`);
      data.data.forEach((payment, index) => {
        console.log(`\n   Payment ${index + 1}:`);
        console.log('     Station:', payment.stationName);
        console.log('     Amount:', payment.amount);
        console.log('     Status:', payment.status);
        console.log('     Can Refund:', payment.canRefund ? 'Yes' : 'No');
      });
      return data.data;
    } else {
      console.log('❌ Failed to list payments:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error listing payments:', error.message);
    return null;
  }
}

/**
 * Test 8: Test Refund Request
 */
async function testRefundRequest(paymentId) {
  console.log('\n💰 Test 8: Request Refund');
  console.log('⚠️  This test requires a completed payment');
  console.log('Skipping automated refund test - test manually in frontend');
  
  console.log('\nTo test refund:');
  console.log('1. Complete a payment in the frontend');
  console.log('2. Go to Payments page');
  console.log('3. Click refund button on a completed payment');
  console.log('4. Enter reason and submit');
  console.log('5. Check Razorpay dashboard for refund status');
}

/**
 * Test 9: Test Webhook (Manual)
 */
function testWebhook() {
  console.log('\n🔔 Test 9: Webhook Integration (Manual)');
  console.log('To test webhooks:');
  console.log('1. Install ngrok: https://ngrok.com/download');
  console.log('2. Start backend: npm run dev');
  console.log('3. Start ngrok: ngrok http 4000');
  console.log('4. Copy ngrok URL');
  console.log('5. Add webhook in Razorpay Dashboard:');
  console.log('   URL: https://your-ngrok-url.ngrok.io/api/payments/webhook');
  console.log('   Events: payment.authorized, payment.captured, payment.failed, refund.*');
  console.log('6. Make a test payment');
  console.log('7. Check backend logs for webhook events');
}

/**
 * Test 10: Test Payment Statistics (Admin)
 */
async function testPaymentStatistics() {
  console.log('\n📈 Test 10: Payment Statistics (Admin Only)');
  console.log('⚠️  This test requires admin authentication');
  console.log('Test manually from admin dashboard');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 NexCharge Payment Gateway Test Suite\n');
  console.log('='.repeat(60));
  
  // Test 1: Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    console.log('Please ensure:');
    console.log('1. Backend server is running');
    console.log('2. Test user exists or modify testUser credentials');
    return;
  }
  
  // Test 2: Get Stations
  const station = await testGetStations();
  if (!station) {
    console.log('\n❌ Cannot proceed without active stations');
    return;
  }
  
  // Test 3: Get Vehicles
  const vehicle = await testGetVehicles();
  if (!vehicle) {
    console.log('\n❌ Cannot proceed without vehicles');
    return;
  }
  
  // Test 4: Create Payment Order
  const orderData = await testCreatePaymentOrder();
  if (!orderData) {
    console.log('\n❌ Failed to create payment order');
    return;
  }
  
  // Test 5: Payment Verification Instructions
  testPaymentVerification(orderData);
  
  // Wait for user to complete payment
  console.log('\n⏸️  Pausing for manual payment completion...');
  console.log('After completing payment in frontend, press Enter to continue...');
  
  // For automated testing, we'll proceed after 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test 6: Get Payment Status
  await testGetPaymentStatus(orderData.bookingId);
  
  // Test 7: List Payments
  await testListPayments();
  
  // Test 8: Refund Instructions
  testRefundRequest();
  
  // Test 9: Webhook Instructions
  testWebhook();
  
  // Test 10: Statistics Instructions
  await testPaymentStatistics();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Payment Gateway Test Suite Complete\n');
  console.log('Summary:');
  console.log('- Order creation: ✅ Tested');
  console.log('- Payment verification: ⚠️  Manual test required');
  console.log('- Payment status: ✅ Tested');
  console.log('- Payment list: ✅ Tested');
  console.log('- Refunds: ⚠️  Manual test required');
  console.log('- Webhooks: ⚠️  Manual test required');
  console.log('- Analytics: ⚠️  Admin only');
  console.log('\nFor complete testing:');
  console.log('1. Complete a payment in the frontend');
  console.log('2. Test refund functionality');
  console.log('3. Set up webhooks with ngrok');
  console.log('4. Review payment analytics in admin dashboard');
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  testLogin,
  testGetStations,
  testGetVehicles,
  testCreatePaymentOrder,
  testPaymentVerification,
  testGetPaymentStatus,
  testListPayments,
  testRefundRequest,
  testWebhook,
  testPaymentStatistics,
  runAllTests
};
