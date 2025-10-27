import mongoose from 'mongoose';

const CorporateSchema = new mongoose.Schema({
	name: { type: String, required: true },
	businessRegistrationNumber: { type: String, index: true, unique: true },
	contactEmail: { type: String, required: true },
	contactPhone: { type: String },
	admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	status: { type: String, enum: ['active', 'inactive'], default: 'active' },
	metadata: { type: Object }
}, { timestamps: true });

CorporateSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('Corporate', CorporateSchema);


