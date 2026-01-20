import mongoose from 'mongoose';

const CommissionSchema = new mongoose.Schema({
  // Reference to the entity earning the commission
  entityType: {
    type: String,
    enum: ['franchise', 'corporate'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Source of commission (booking or payment)
  sourceType: {
    type: String,
    enum: ['booking', 'payment'],
    default: 'booking'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  
  // Commission calculation details
  baseAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Tax details
  taxAmount: {
    type: Number,
    default: 0
  },
  netCommissionAmount: {
    type: Number,
    required: true
  },
  
  // Period tracking
  period: {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    quarter: { type: Number, min: 1, max: 4 }
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled', 'disputed'],
    default: 'pending'
  },
  
  // Payment details
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cheque', 'wallet']
  },
  paymentReference: {
    type: String
  },
  
  // Additional info
  notes: {
    type: String
  },
  metadata: {
    type: Object
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
CommissionSchema.index({ entityType: 1, entityId: 1, status: 1 });
CommissionSchema.index({ ownerId: 1, status: 1 });
CommissionSchema.index({ 'period.year': 1, 'period.month': 1 });
CommissionSchema.index({ stationId: 1, status: 1 });
CommissionSchema.index({ bookingId: 1 });
CommissionSchema.index({ paymentId: 1 });

// Virtual for entity reference
CommissionSchema.virtual('entity', {
  refPath: 'entityType',
  localField: 'entityId',
  foreignField: '_id',
  justOne: true
});

// Static method to calculate commission
CommissionSchema.statics.calculateCommission = function(baseAmount, commissionRate, taxRate = 0) {
  const commissionAmount = (baseAmount * commissionRate) / 100;
  const taxAmount = (commissionAmount * taxRate) / 100;
  const netCommissionAmount = commissionAmount - taxAmount;
  
  return {
    commissionAmount: Math.round(commissionAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    netCommissionAmount: Math.round(netCommissionAmount * 100) / 100
  };
};

// Static method to get commission summary
CommissionSchema.statics.getSummary = async function(query = {}) {
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: '$commissionAmount' },
        totalTax: { $sum: '$taxAmount' },
        totalNet: { $sum: '$netCommissionAmount' },
        pendingCommission: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$netCommissionAmount', 0]
          }
        },
        approvedCommission: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, '$netCommissionAmount', 0]
          }
        },
        paidCommission: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paid'] }, '$netCommissionAmount', 0]
          }
        },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get monthly summary
CommissionSchema.statics.getMonthlySummary = async function(entityType, entityId, year) {
  return this.aggregate([
    {
      $match: {
        entityType,
        entityId: mongoose.Types.ObjectId(entityId),
        'period.year': year
      }
    },
    {
      $group: {
        _id: '$period.month',
        month: { $first: '$period.month' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNet: { $sum: '$netCommissionAmount' },
        totalTax: { $sum: '$taxAmount' },
        count: { $sum: 1 },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$netCommissionAmount', 0]
          }
        },
        paid: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paid'] }, '$netCommissionAmount', 0]
          }
        }
      }
    },
    { $sort: { month: 1 } }
  ]);
};

const Commission = mongoose.model('Commission', CommissionSchema);

export default Commission;
