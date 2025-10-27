import mongoose from 'mongoose';

const PaymentMethodSchema = new mongoose.Schema({
	type: { type: String, enum: ['credit_card', 'paypal', 'wallet'] },
	details: { type: Object },
	isDefault: { type: Boolean, default: false },
}, { _id: false });

const NotificationPrefsSchema = new mongoose.Schema({
	bookingAlerts: { type: Boolean, default: true },
	promotions: { type: Boolean, default: true },
	emergencyCharging: { type: Boolean, default: true },
}, { _id: false });

const VehicleInfoSchema = new mongoose.Schema({
	make: String,
	model: String,
	year: {
		type: Number,
		validate: {
			validator: function(v) {
				if (v == null) return true; // optional
				const current = new Date().getFullYear();
				return v >= 2015 && v <= current;
			},
			message: 'Year must be between 2015 and the current year'
		}
	},
	batteryCapacity: Number,
	currentBatteryLevel: Number,
	preferredChargingType: { type: String, enum: ['fast', 'slow', 'rapid'] },
	chargingAC: {
		supported: { type: Boolean, default: true },
		maxPower: Number,
		connectorTypes: [{ type: String }]
	},
	chargingDC: {
		supported: { type: Boolean, default: true },
		maxPower: Number,
		connectorTypes: [{ type: String }]
	}
}, { _id: false });

const EVUserInfoSchema = new mongoose.Schema({
	vehicleInfo: VehicleInfoSchema,
	// Allow multiple vehicles; items will not have _id fields (managed by index)
	vehicles: [VehicleInfoSchema],
	paymentMethods: [PaymentMethodSchema],
	loyaltyPoints: { type: Number, default: 0 },
	notificationPreferences: { type: NotificationPrefsSchema, default: () => ({}) },
}, { _id: false });

const RoleSpecificSchema = new mongoose.Schema({
	evUserInfo: { type: EVUserInfoSchema, default: undefined },
	stationManagerInfo: {
		franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
		assignedStations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }],
		contactHours: String,
		commissionRate: Number,
	},
	franchiseManagerInfo: {
		franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
		commissionRate: { type: Number, default: 15 },
		accessLevel: { type: String, enum: ['limited', 'full'], default: 'limited' },
		businessType: { type: String, enum: ['individual', 'partnership', 'company', 'llp'], default: 'individual' },
		registrationNumber: String,
		gstNumber: String,
		panNumber: String,
	},
	franchiseOwnerInfo: {
		franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
		managedStations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }],
		profitShare: Number,
	},
	corporateAdminInfo: {
		corporateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporate' },
		accessLevel: { type: String, enum: ['full', 'regional', 'financial'] },
		managedFranchises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' }],
	},
	adminInfo: {
		permissions: [String],
		lastPolicyUpdate: Date,
	},
}, { _id: false });

const UserSchema = new mongoose.Schema({
	role: { type: String, enum: ['ev_user', 'station_manager', 'franchise_manager', 'franchise_owner', 'corporate_admin', 'admin'], default: 'ev_user' },
	personalInfo: {
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true, unique: true, index: true },
		phone: String,
		address: String,
		profileImage: String,
	},
	credentials: {
		passwordHash: { type: String },
		lastLogin: Date,
		isActive: { type: Boolean, default: true },
		twoFactorEnabled: { type: Boolean, default: false },
		mustChangePassword: { type: Boolean, default: false },
		resetOtpCode: { type: String },
		resetOtpExpires: { type: Date },
		resetOtpAttempts: { type: Number, default: 0 },
	},
	google: {
		googleId: String,
		emailVerified: Boolean,
	},
	roleSpecificData: { type: RoleSpecificSchema, default: () => ({}) },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);

