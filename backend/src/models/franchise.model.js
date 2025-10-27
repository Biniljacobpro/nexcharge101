import mongoose from 'mongoose';

const FranchiseSchema = new mongoose.Schema({
	name: { type: String, required: true },
	ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	corporateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate', required: true },
	contactInfo: {
		email: { type: String, required: true },
		phone: { type: String, required: true },
		address: { type: String },
		city: { type: String },
		state: { type: String },
		pincode: { type: String },
		country: { type: String, default: 'India' }
	},
	businessInfo: {
		businessType: { 
			type: String, 
			enum: ['individual', 'partnership', 'company', 'llp'], 
			default: 'individual' 
		},
		registrationNumber: { type: String },
		gstNumber: { type: String },
		panNumber: { type: String },
		licenseNumber: { type: String }
	},
	financialInfo: {
		profitShare: { type: Number, default: 15, min: 0, max: 50 },
		commissionRate: { type: Number, default: 10, min: 0, max: 30 },
		bankDetails: {
			accountNumber: { type: String },
			ifscCode: { type: String },
			bankName: { type: String },
			accountHolderName: { type: String }
		}
	},
	operationalInfo: {
		agreementStartDate: { type: Date, default: Date.now },
		agreementEndDate: { type: Date },
		territory: { type: String },
		minimumStations: { type: Number, default: 1 },
		maximumStations: { type: Number, default: 10 }
	},
	status: { 
		type: String, 
		enum: ['active', 'pending', 'inactive', 'suspended'], 
		default: 'pending' 
	},
	metadata: { type: Object }
}, { timestamps: true });

// Indexes
FranchiseSchema.index({ ownerId: 1 });
FranchiseSchema.index({ corporateId: 1 });
FranchiseSchema.index({ 'contactInfo.email': 1 });
FranchiseSchema.index({ 'contactInfo.phone': 1 });
FranchiseSchema.index({ status: 1 });
FranchiseSchema.index({ 'businessInfo.gstNumber': 1 });
FranchiseSchema.index({ 'businessInfo.panNumber': 1 });

export default mongoose.model('Franchise', FranchiseSchema);

