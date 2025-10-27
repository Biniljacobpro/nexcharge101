import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Make is required'],
    trim: true,
    maxlength: [50, 'Make cannot exceed 50 characters']
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    maxlength: [50, 'Model cannot exceed 50 characters']
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: {
      values: ['car', 'two_wheeler', 'three_wheeler', 'bus', 'other'],
      message: 'Vehicle type must be one of: car, two_wheeler, three_wheeler, bus, other'
    },
    default: 'car'
  },
  batteryCapacity: {
    type: Number,
    required: [true, 'Battery capacity is required'],
    min: [1, 'Battery capacity must be at least 1 kWh'],
    max: [500, 'Battery capacity cannot exceed 500 kWh'],
    description: 'Battery capacity in kWh'
  },
  chargingAC: {
    type: {
      supported: {
        type: Boolean,
        default: true
      },
      maxPower: {
        type: Number,
        min: [2, 'AC max power must be at least 2 kW'],
        max: [50, 'AC max power cannot exceed 50 kW'],
        description: 'Maximum AC charging power in kW'
      },
      connectorTypes: [{
        type: String,
        enum: ['type1', 'type2', 'bharat_ac_001', 'bharat_dc_001', 'ccs2', 'chademo', 'gbt_type6', 'type7_leccs', 'mcs', 'chaoji', 'other']
      }]
    },
    required: [true, 'AC charging specification is required'],
    validate: {
      validator: function(v) {
        // If AC is supported, maxPower is required
        if (v.supported && v.maxPower === undefined) {
          return false;
        }
        return true;
      },
      message: 'AC max power is required when AC charging is supported'
    }
  },
  chargingDC: {
    type: {
      supported: {
        type: Boolean,
        default: true
      },
      maxPower: {
        type: Number,
        min: [2, 'DC max power must be at least 2 kW'],
        max: [100, 'DC max power cannot exceed 100 kW'],
        description: 'Maximum DC charging power in kW'
      },
      connectorTypes: [{
        type: String,
        enum: ['type1', 'type2', 'bharat_ac_001', 'bharat_dc_001', 'ccs2', 'chademo', 'gbt_type6', 'type7_leccs', 'mcs', 'chaoji', 'other']
      }]
    },
    required: [true, 'DC charging specification is required'],
    validate: {
      validator: function(v) {
        // If DC is supported, maxPower is required
        if (v.supported && v.maxPower === undefined) {
          return false;
        }
        return true;
      },
      message: 'DC max power is required when DC charging is supported'
    }
  },
  compatibleChargingStations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station'
  }],
  specifications: {
    year: {
      type: Number,
      min: [2015, 'Year must be at least 2015'],
      max: [2025, 'Year cannot exceed 2025']
    },
    range: {
      type: Number,
      min: [20, 'Range must be at least 20 km'],
      max: [2000, 'Range cannot exceed 2000 km'],
      description: 'Vehicle range in kilometers'
    },
    chargingTime: {
      ac: {
        type: Number,
        min: [0, 'AC charging time must be at least 0 hours'],
        description: 'AC charging time in hours (0-100%)'
      },
      dc: {
        type: Number,
        min: [0, 'DC charging time must be at least 0 hours'],
        description: 'DC charging time in hours (0-80%)'
      }
    },
    weight: {
      type: Number,
      min: [0, 'Weight must be at least 0 kg'],
      description: 'Vehicle weight in kg'
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full vehicle name
VehicleSchema.virtual('fullName').get(function() {
  return `${this.make} ${this.model}`;
});

// Virtual for display name with year
VehicleSchema.virtual('displayName').get(function() {
  const year = this.specifications?.year;
  return year ? `${this.make} ${this.model} (${year})` : `${this.make} ${this.model}`;
});

// Index for efficient searching
VehicleSchema.index({ make: 1, model: 1 });
VehicleSchema.index({ vehicleType: 1 });
VehicleSchema.index({ isActive: 1 });
VehicleSchema.index({ 'chargingAC.supported': 1, 'chargingDC.supported': 1 });

// Pre-save middleware to update version
VehicleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Static method to get vehicles by charging compatibility
VehicleSchema.statics.getCompatibleVehicles = function(chargerTypes) {
  return this.find({
    isActive: true,
    $or: [
      { 'chargingAC.supported': true, 'chargingAC.connectorTypes': { $in: chargerTypes } },
      { 'chargingDC.supported': true, 'chargingDC.connectorTypes': { $in: chargerTypes } }
    ]
  });
};

export default mongoose.model('Vehicle', VehicleSchema);

