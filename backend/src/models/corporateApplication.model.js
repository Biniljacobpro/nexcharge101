import mongoose from 'mongoose';

const corporateApplicationSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  companyEmail: {
    type: String,
    required: [true, 'Company email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  contactPersonName: {
    type: String,
    required: [true, 'Contact person name is required'],
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    maxlength: [20, 'Contact number cannot exceed 20 characters']
  },
  businessRegistrationNumber: {
    type: String,
    required: [true, 'Business registration number is required'],
    trim: true,
    maxlength: [50, 'Business registration number cannot exceed 50 characters']
  },
  additionalInfo: {
    type: String,
    trim: true,
    maxlength: [1000, 'Additional information cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Review notes cannot exceed 500 characters']
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  applicationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
corporateApplicationSchema.index({ status: 1, applicationDate: -1 });
corporateApplicationSchema.index({ companyEmail: 1 });
corporateApplicationSchema.index({ businessRegistrationNumber: 1 });

// Virtual for application age
corporateApplicationSchema.virtual('applicationAge').get(function() {
  return Math.floor((Date.now() - this.applicationDate) / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
corporateApplicationSchema.set('toJSON', { virtuals: true });
corporateApplicationSchema.set('toObject', { virtuals: true });

const CorporateApplication = mongoose.model('CorporateApplication', corporateApplicationSchema);

export default CorporateApplication;

