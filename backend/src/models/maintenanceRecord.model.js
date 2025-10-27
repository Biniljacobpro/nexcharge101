import mongoose from 'mongoose';

const MaintenanceRecordSchema = new mongoose.Schema({
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  dataCollectedAt: {
    type: Date,
    default: Date.now
  },
  // Feature 1: Uptime percentage change over the last N days
  uptimeDelta: {
    type: Number,
    required: true
  },
  // Feature 2: Booking count normalized (0.0 to 1.0)
  utilizationRate: {
    type: Number,
    required: true
  },
  // Feature 3: Average charging session duration in minutes
  avgSessionDuration: {
    type: Number,
    required: true
  },
  // Feature 4: Count of critical error/failure logs in the last N days
  errorCount: {
    type: Number,
    required: true
  },
  // Feature 5: Days since the last official maintenance
  lastServiceDays: {
    type: Number,
    required: true
  },
  // The raw probability/distance score from the KNN model
  riskScore: {
    type: Number,
    required: true
  },
  // The final prediction label
  riskClassification: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
MaintenanceRecordSchema.index({ stationId: 1 });
MaintenanceRecordSchema.index({ dataCollectedAt: -1 });
MaintenanceRecordSchema.index({ riskClassification: 1 });

export default mongoose.model('MaintenanceRecord', MaintenanceRecordSchema);