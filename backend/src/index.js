import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import corporateRoutes from './routes/corporate.routes.js';
import franchiseOwnerRoutes from './routes/franchiseOwner.routes.js';
import stationManagerRoutes from './routes/stationManager.routes.js';
import publicRoutes from './routes/public.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import vehicleRequestRoutes from './routes/vehicleRequest.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import availabilityRoutes from './routes/availability.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reviewRoutes from './routes/review.routes.js';
import uploadRoutes from '../routes/uploadExample.js';
import maintenanceRoutes from './routes/maintenance.routes.js';

// Ensure env is loaded from backend/.env or projectRoot/.env
const backendEnv = path.resolve(process.cwd(), '.env');
const projectRootEnv = path.resolve(process.cwd(), '..', '.env');
for (const p of [backendEnv, projectRootEnv]) {
	if (fs.existsSync(p)) {
		const content = fs.readFileSync(p, 'utf8');
		content.split('\n').forEach((line) => {
			const m = line.match(/^([A-Z0-9_]+)=(.*)$/i);
			if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
		});
	}
}

const app = express();

// CORS - Updated for Vercel deployment with support for both local and production
let corsOrigin = process.env.CORS_ORIGIN || ['http://localhost:3000'];
// If CORS_ORIGIN is a comma-separated string, convert to array
if (typeof corsOrigin === 'string' && corsOrigin.includes(',')) {
  corsOrigin = corsOrigin.split(',').map(origin => origin.trim());
} else if (typeof corsOrigin === 'string') {
  corsOrigin = [corsOrigin];
}

// Always ensure localhost is allowed for local development
if (!corsOrigin.includes('http://localhost:3000')) {
  corsOrigin.push('http://localhost:3000');
}

// Always allow the frontend Vercel domains
if (!corsOrigin.includes('https://nexcharge.vercel.app')) {
  corsOrigin.push('https://nexcharge.vercel.app');
}

// Log CORS configuration for debugging
console.log('CORS Origins:', corsOrigin);

app.use(cors({ 
  origin: corsOrigin, 
  credentials: true,
  optionsSuccessStatus: 200
}));

// Security & utils
app.use(helmet({
 // Allow cross-origin loading of static assets like images from the backend
 // This prevents ERR_BLOCKED_BY_RESPONSE.NotSameOrigin caused by CORP
 crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.json({ message: 'NexCharge API is running!' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/corporate', corporateRoutes);
app.use('/api/franchise-owner', franchiseOwnerRoutes);
app.use('/api/station-manager', stationManagerRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicle-requests', vehicleRequestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/station-manager', maintenanceRoutes);

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
	console.error(err);
	const status = err.status || 500;
	res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// Export for Vercel serverless functions
export default app;