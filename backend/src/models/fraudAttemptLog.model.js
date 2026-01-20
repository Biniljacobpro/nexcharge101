import mongoose from 'mongoose';

const FraudAttemptLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station'
  },
  attemptTime: {
    type: Date,
    default: Date.now
  },
  classification: {
    type: String,
    enum: ['Legitimate', 'High-Risk'],
    required: true
  },
  decisionPath: {
    type: String,
    required: true
  },
  featuresUsed: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    enum: ['Logged', 'Reviewed', 'Action Taken'],
    default: 'Logged'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
FraudAttemptLogSchema.index({ userId: 1 });
FraudAttemptLogSchema.index({ stationId: 1 });
FraudAttemptLogSchema.index({ classification: 1 });
FraudAttemptLogSchema.index({ attemptTime: -1 });
FraudAttemptLogSchema.index({ status: 1 });

export default mongoose.model('FraudAttemptLog', FraudAttemptLogSchema);