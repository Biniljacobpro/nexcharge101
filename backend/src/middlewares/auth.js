import { verifyAccessToken } from '../utils/jwt.js';

export const requireAuth = (req, res, next) => {
	try {
		const header = req.headers.authorization || '';
		const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;
		if (!token) return res.status(401).json({ error: 'Unauthorized' });
		const payload = verifyAccessToken(token);
		req.user = payload;
		next();
	} catch (e) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
};

export const requireRole = (...roles) => (req, res, next) => {
	if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
	const allowed = Array.isArray(roles[0]) ? roles[0] : roles;
	if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
	next();
};

// Enforce first-login password change
export const enforcePasswordChange = async (req, res, next) => {
	try {
		if (!req.user?.sub) return res.status(401).json({ error: 'Unauthorized' });
		const User = (await import('../models/user.model.js')).default;
		const user = await User.findById(req.user.sub, { 'credentials.mustChangePassword': 1 });
		if (!user) return res.status(401).json({ error: 'Unauthorized' });
		if (user.credentials?.mustChangePassword) {
			return res.status(428).json({ error: 'Password change required', code: 'PASSWORD_CHANGE_REQUIRED' });
		}
		return next();
	} catch (_e) {
		return res.status(500).json({ error: 'Auth check failed' });
	}
};

// Admin only middleware
export const adminOnly = requireRole('admin');

// Station manager only middleware
export const stationManagerOnly = requireRole('station_manager');

