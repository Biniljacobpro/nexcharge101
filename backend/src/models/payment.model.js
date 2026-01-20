import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  // Reference to booking
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  
  // User who made the payment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Station where charging happened
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
    index: true
  },
  
  // Razorpay Integration
  razorpay: {
    orderId: { 
      type: String, 
      required: true,
      unique: true,
      index: true
    },
    paymentId: { 
      type: String,
      index: true
    },
    signature: { type: String },
    refundId: { type: String }
  },
  
  // Payment amounts (in INR)
  amount: {
    orderAmount: { 
      type: Number, 
      required: true,
      min: 0
    },
    paidAmount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    refundedAmount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    tax: {
      gst: { type: Number, default: 0 },
      platformFee: { type: Number, default: 0 }
    }
  },
  
  // Payment status tracking
  status: {
    type: String,
    enum: ['created', 'pending', 'authorized', 'captured', 'completed', 'failed', 'refund_pending', 'refunded', 'partially_refunded', 'cancelled'],
    default: 'created',
    required: true,
    index: true
  },
  
  // Payment method details
  paymentMethod: {
    type: { type: String }, // card, netbanking, upi, wallet
    provider: { type: String }, // visa, mastercard, paytm, phonepe, etc.
    last4: { type: String }, // Last 4 digits of card
    email: { type: String },
    contact: { type: String },
    vpa: { type: String } // For UPI
  },
  
  // Timestamps
  timestamps: {
    created: { type: Date, default: Date.now },
    authorized: { type: Date },
    captured: { type: Date },
    completed: { type: Date },
    failed: { type: Date },
    refunded: { type: Date }
  },
  
  // Refund details
  refund: {
    reason: { type: String },
    requestedAt: { type: Date },
    processedAt: { type: Date },
    status: {
      type: String,
      enum: ['none', 'requested', 'processing', 'completed', 'failed'],
      default: 'none'
    },
    amount: { type: Number, default: 0 },
    failureReason: { type: String }
  },
  
  // Failure tracking
  failure: {
    code: { type: String },
    description: { type: String },
    reason: { type: String },
    step: { type: String }, // authentication, authorization, capture
    source: { type: String }, // customer, bank, internal
    timestamp: { type: Date }
  },
  
  // Metadata for analytics
  metadata: {
    ipAddress: { type: String },
    userAgent: { type: String },
    device: { type: String },
    browser: { type: String },
    platform: { type: String }
  },
  
  // Webhook events received
  webhookEvents: [{
    event: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed },
    receivedAt: { type: Date, default: Date.now }
  }],
  
  // Notes for internal tracking
  notes: { type: String },
  internalNotes: { type: String }, // Only visible to admins
  
}, {
  timestamps: true
});

// Indexes for efficient queries
PaymentSchema.index({ 'timestamps.created': -1 });
PaymentSchema.index({ status: 1, 'timestamps.created': -1 });
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ stationId: 1, 'timestamps.created': -1 });

// Virtual for net amount (after refunds)
PaymentSchema.virtual('netAmount').get(function() {
  return this.amount.paidAmount - this.amount.refundedAmount;
});

// Method to check if payment can be refunded
PaymentSchema.methods.canRefund = function() {
  return ['completed', 'captured'].includes(this.status) && 
         this.amount.paidAmount > this.amount.refundedAmount &&
         this.refund.status !== 'processing';
};

// Method to mark payment as failed
PaymentSchema.methods.markFailed = function(failureDetails) {
  this.status = 'failed';
  this.failure = {
    code: failureDetails.code,
    description: failureDetails.description,
    reason: failureDetails.reason,
    step: failureDetails.step,
    source: failureDetails.source,
    timestamp: new Date()
  };
  this.timestamps.failed = new Date();
};

// Method to process refund
PaymentSchema.methods.processRefund = function(amount, reason) {
  const refundAmount = amount || this.netAmount;
  
  if (refundAmount > this.netAmount) {
    throw new Error('Refund amount cannot exceed net amount');
  }
  
  this.refund = {
    reason: reason || 'Customer request',
    requestedAt: new Date(),
    status: 'requested',
    amount: refundAmount
  };
  
  this.status = 'refund_pending';
};

// Static method to get payment statistics
PaymentSchema.statics.getStatistics = async function(filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount.paidAmount' },
        totalRefunded: { $sum: '$amount.refundedAmount' },
        successfulPayments: {
          $sum: { $cond: [{ $in: ['$status', ['completed', 'captured']] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        avgAmount: { $avg: '$amount.paidAmount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalTransactions: 0,
    totalAmount: 0,
    totalRefunded: 0,
    successfulPayments: 0,
    failedPayments: 0,
    avgAmount: 0
  };
};

// Static method to get revenue breakdown
PaymentSchema.statics.getRevenueBreakdown = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        status: { $in: ['completed', 'captured'] },
        'timestamps.completed': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamps.completed' },
          month: { $month: '$timestamps.completed' },
          day: { $dayOfMonth: '$timestamps.completed' }
        },
        revenue: { $sum: '$amount.paidAmount' },
        transactions: { $sum: 1 },
        refunds: { $sum: '$amount.refundedAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

const Payment = mongoose.model('Payment', PaymentSchema);

export default Payment;
