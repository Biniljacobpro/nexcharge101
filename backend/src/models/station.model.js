import mongoose from 'mongoose';

const StationSchema = new mongoose.Schema({
  // Basic Station Information
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  code: { 
    type: String, 
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500
  },

  // Location Information
  location: {
    address: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 200
    },
    city: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 50
    },
    state: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 50
    },
    country: { 
      type: String, 
      default: 'India',
      trim: true,
      maxlength: 50
    },
    pincode: { 
      type: String, 
      required: true,
      trim: true,
      match: /^[1-9][0-9]{5}$/ // Indian pincode validation
    },
    // Optional raw DMS string for reference
    dms: {
      type: String,
      trim: true,
      maxlength: 100
    },
    coordinates: {
      latitude: { 
        type: Number, 
        min: -90, 
        max: 90,
        default: 0
      },
      longitude: { 
        type: Number, 
        min: -180, 
        max: 180,
        default: 0
      }
    },
    nearbyLandmarks: { 
      type: String, 
      trim: true,
      maxlength: 200
    }
  },

  // Station Capacity & Chargers
  capacity: {
    totalChargers: { 
      type: Number, 
      required: true,
      min: 1,
      max: 50
    },
    chargerTypes: [{
      type: String,
      enum: ['type1', 'type2', 'bharat_ac_001', 'bharat_dc_001', 'ccs2', 'chademo', 'gbt_type6', 'type7_leccs', 'mcs', 'chaoji'],
      required: true
    }],
    maxPowerPerCharger: { 
      type: Number, 
      required: true,
      min: 1,
      max: 500 // kW
    },
    totalPowerCapacity: { 
      type: Number, 
      required: true,
      min: 0,
      max: 10000 // kW
    },
    availableSlots: { 
      type: Number, 
      default: function() { return this.capacity?.totalChargers || 1; }
    },
    // Track individual charger availability
    chargers: [{
      chargerId: { type: String, required: true },
      type: { 
        type: String,
        enum: ['type1', 'type2', 'bharat_ac_001', 'bharat_dc_001', 'ccs2', 'chademo', 'gbt_type6', 'type7_leccs', 'mcs', 'chaoji'],
        required: true
      },
      power: { type: Number, required: true },
      isAvailable: { type: Boolean, default: true },
      currentBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null }
    }]
  },

  // Pricing & Policies (only per-minute pricing supported)
  pricing: {
    pricePerMinute: {
      type: Number,
      required: false, // Made optional to support existing stations
      default: 10, // Default ₹10 per minute
      min: 1,
      max: 5000 // ₹5000 per minute
    },
    cancellationPolicy: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },

  // Operational Details
  operational: {
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active'
    },
    parkingSlots: { 
      type: Number, 
      required: true,
      min: 0,
      max: 30
    },
    parkingFee: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 1000 // ₹1000 per hour
    },
    operatingHours: {
      is24Hours: { 
        type: Boolean, 
        default: true
      },
      customHours: {
        start: { 
          type: String, 
          default: '00:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        end: { 
          type: String, 
          default: '23:59',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        }
      }
    }
  },

  // Contact & Support
  contact: {
    managerEmail: { 
      type: String, 
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    supportPhone: { 
      type: String, 
      trim: true,
      match: /^[6-9]\d{9}$/ // Indian mobile number validation
    },
    supportEmail: { 
      type: String, 
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },

  // Business Relations
  corporateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Corporate', 
    required: true 
  },
  franchiseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Franchise', 
    required: true 
  },
  managerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },

  // Analytics & Performance
  analytics: {
    rating: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 5
    },
    totalBookings: { 
      type: Number, 
      default: 0,
      min: 0
    },
    totalReviews: { 
      type: Number, 
      default: 0,
      min: 0
    },
    totalRevenue: { 
      type: Number, 
      default: 0,
      min: 0
    },
    energyDelivered: { 
      type: Number, 
      default: 0,
      min: 0 // kWh
    },
    uptime: { 
      type: Number, 
      default: 100,
      min: 0,
      max: 100 // percentage
    },
    lastMaintenance: { 
      type: Date 
    },
    nextMaintenance: { 
      type: Date 
    }
  },

  // Additional Data
  amenities: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  images: [{
    type: String,
    trim: true
  }],
  documents: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Predictive Maintenance Fields
  latestRiskClassification: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  lastPredictionDate: {
    type: Date
  },

  // Metadata
  metadata: { 
    type: Object,
    default: {}
  },

  // Audit fields
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full address
StationSchema.virtual('fullAddress').get(function() {
  return `${this.location.address}, ${this.location.city}, ${this.location.state} ${this.location.pincode}, ${this.location.country}`;
});

// Virtual for operating hours display
StationSchema.virtual('operatingHoursDisplay').get(function() {
  if (this.operational.operatingHours.is24Hours) {
    return '24/7';
  }
  return `${this.operational.operatingHours.customHours.start} - ${this.operational.operatingHours.customHours.end}`;
});

// Convenience virtual to get/set the raw DMS string as a top-level field
StationSchema.virtual('locationDms')
  .get(function() { return this.location?.dms; })
  .set(function(v) {
    this.location = this.location || {};
    this.location.dms = v;
  });

// Pre-save middleware to generate station code if not provided
StationSchema.pre('save', async function(next) {
  if (!this.code) {
    // Generate code: STN + 6 random alphanumeric characters
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.code = `STN${randomCode}`;
  }
  next();
});

// Pre-save middleware to calculate total power capacity and populate chargers array
StationSchema.pre('save', function(next) {
  if (this.capacity.totalChargers && this.capacity.maxPowerPerCharger) {
    this.capacity.totalPowerCapacity = this.capacity.totalChargers * this.capacity.maxPowerPerCharger;
  }
  
  // Populate chargers array if it's empty but we have charger types and total chargers
  if (this.capacity.chargers.length === 0 && this.capacity.chargerTypes.length > 0 && this.capacity.totalChargers > 0) {
    this.capacity.chargers = [];
    const chargersPerType = Math.ceil(this.capacity.totalChargers / this.capacity.chargerTypes.length);
    
    this.capacity.chargerTypes.forEach((type, typeIndex) => {
      for (let i = 0; i < chargersPerType && this.capacity.chargers.length < this.capacity.totalChargers; i++) {
        this.capacity.chargers.push({
          chargerId: `${type}_${typeIndex}_${i}`,
          type: type,
          power: this.capacity.maxPowerPerCharger,
          isAvailable: true,
          currentBooking: null
        });
      }
    });
  }
  
  next();
});

// Indexes for better query performance
StationSchema.index({ corporateId: 1 });
StationSchema.index({ franchiseId: 1 });
StationSchema.index({ managerId: 1 });
StationSchema.index({ code: 1 });
StationSchema.index({ 'location.city': 1 });
StationSchema.index({ 'location.state': 1 });
StationSchema.index({ 'operational.status': 1 });
StationSchema.index({ 'capacity.chargerTypes': 1 });
// Index on price for faster range queries
StationSchema.index({ 'pricing.pricePerMinute': 1 });
StationSchema.index({ 'analytics.rating': -1 });
StationSchema.index({ 'analytics.totalRevenue': -1 });
StationSchema.index({ createdAt: -1 });

// Compound indexes for common queries
StationSchema.index({ franchiseId: 1, 'operational.status': 1 });
StationSchema.index({ corporateId: 1, 'operational.status': 1 });
StationSchema.index({ 'location.city': 1, 'operational.status': 1 });

export default mongoose.model('Station', StationSchema);
