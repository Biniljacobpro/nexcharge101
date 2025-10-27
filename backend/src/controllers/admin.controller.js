import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import bcryptjs from 'bcryptjs';
import { sendCorporateAdminWelcomeEmail } from '../utils/emailService.js';
import Corporate from '../models/corporate.model.js';
import Station from '../models/station.model.js';
import Franchise from '../models/franchise.model.js';

export const overview = async (_req, res) => {
	try {
		const totalUsers = await User.countDocuments();
		const rolesAgg = await User.aggregate([
			{ $group: { _id: '$role', count: { $sum: 1 } } }
		]);
		return res.json({ totalUsers, byRole: rolesAgg });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to load overview' });
	}
};

// Admin: Live stats for dashboard
export const liveStats = async (_req, res) => {
  try {
    const now = new Date();

    // Active stations
    const activeStations = await Station.countDocuments({ 'operational.status': 'active' });

    // Total revenue and total payments (completed payments only)
    const revenueAgg = await Booking.aggregate([
      { $match: { 'payment.paymentStatus': 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: { $ifNull: ['$payment.paidAmount', 0] } }, totalPayments: { $sum: 1 } } }
    ]);
    const totalRevenue = revenueAgg?.[0]?.totalRevenue || 0;
    const totalPayments = revenueAgg?.[0]?.totalPayments || 0;

    // Live charging sessions: bookings currently in progress
    const liveChargingSessions = await Booking.countDocuments({
      status: { $in: ['confirmed', 'active'] },
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    // Monthly revenue (current month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenueAgg = await Booking.aggregate([
      { 
        $match: { 
          'payment.paymentStatus': 'completed',
          'payment.paymentDate': { $gte: startOfMonth, $lte: now }
        } 
      },
      { $group: { _id: null, monthlyRevenue: { $sum: { $ifNull: ['$payment.paidAmount', 0] } } } }
    ]);
    const monthlyRevenue = monthlyRevenueAgg?.[0]?.monthlyRevenue || 0;

    // Weekly revenue (current week - Monday to Sunday)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
    startOfWeek.setDate(now.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyRevenueAgg = await Booking.aggregate([
      { 
        $match: { 
          'payment.paymentStatus': 'completed',
          'payment.paymentDate': { $gte: startOfWeek, $lte: now }
        } 
      },
      { $group: { _id: null, weeklyRevenue: { $sum: { $ifNull: ['$payment.paidAmount', 0] } } } }
    ]);
    const weeklyRevenue = weeklyRevenueAgg?.[0]?.weeklyRevenue || 0;

    // Daily revenue for the last 7 days (for chart)
    const dailyRevenueAgg = await Booking.aggregate([
      { 
        $match: { 
          'payment.paymentStatus': 'completed',
          'payment.paymentDate': { 
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            $lte: now 
          }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$payment.paymentDate' },
            month: { $month: '$payment.paymentDate' },
            day: { $dayOfMonth: '$payment.paymentDate' }
          },
          dailyRevenue: { $sum: { $ifNull: ['$payment.paidAmount', 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return res.json({
      success: true,
      data: {
        activeStations,
        totalRevenue,
        totalPayments,
        liveChargingSessions,
        monthlyRevenue,
        weeklyRevenue,
        dailyRevenueChart: dailyRevenueAgg,
        lastUpdated: now
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to load live stats', error: e.message });
  }
};

// Admin: List stations with corporate/franchise filters
export const listStations = async (req, res) => {
  try {
    const { corporateId, franchiseId, status, city, state, q } = req.query;
    const query = {};
    if (corporateId) query.corporateId = corporateId;
    if (franchiseId) query.franchiseId = franchiseId;
    if (status) query['operational.status'] = status;
    if (city) query['location.city'] = new RegExp(`^${city}$`, 'i');
    if (state) query['location.state'] = new RegExp(`^${state}$`, 'i');
    if (q) query.name = { $regex: q, $options: 'i' };

    const stations = await Station.find(query)
      .populate('corporateId', 'name')
      .populate('franchiseId', 'name')
      .populate('managerId', 'personalInfo.firstName personalInfo.lastName personalInfo.email')
      .sort({ createdAt: -1 })
      .lean();

    const data = stations.map(s => ({
      id: s._id,
      name: s.name,
      code: s.code,
      corporate: s.corporateId ? { id: s.corporateId._id, name: s.corporateId.name } : null,
      franchise: s.franchiseId ? { id: s.franchiseId._id, name: s.franchiseId.name } : null,
      manager: s.managerId ? {
        id: s.managerId._id,
        name: `${s.managerId?.personalInfo?.firstName || ''} ${s.managerId?.personalInfo?.lastName || ''}`.trim(),
        email: s.managerId?.personalInfo?.email || ''
      } : null,
      location: {
        address: s.location?.address,
        city: s.location?.city,
        state: s.location?.state,
        pincode: s.location?.pincode
      },
      capacity: {
        totalChargers: (s.capacity?.totalChargers != null)
          ? s.capacity.totalChargers
          : (Array.isArray(s.chargers) ? s.chargers.length : (typeof s.totalChargers === 'number' ? s.totalChargers : 0)),
        chargerTypes: (Array.isArray(s.capacity?.chargerTypes) && s.capacity.chargerTypes.length > 0)
          ? s.capacity.chargerTypes.map(t => (typeof t === 'string' ? t : (t?.type || null))).filter(Boolean)
          : (Array.isArray(s.chargers) ? [...new Set(s.chargers.map(c => c.type).filter(Boolean))] : []),
        availableSlots: s.capacity?.availableSlots
      },
      pricing: { basePrice: s.pricing?.basePrice },
      status: s.operational?.status || 'active',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));

    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to list stations', error: e.message });
  }
};

// Admin: Update station operational status
export const updateStationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const station = await Station.findByIdAndUpdate(
      id,
      { $set: { 'operational.status': status } },
      { new: true }
    );
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    // Create admin action notification
    try {
      const { createAdminActionNotification } = await import('./notification.controller.js');
      await createAdminActionNotification(req.user.sub || req.user.id, 'station_status_changed', {
        stationName: station.name || 'Unknown Station',
        status
      });
    } catch (notificationError) {
      console.error('Failed to create station status change notification:', notificationError);
    }

    return res.json({ success: true, data: { id: station._id, status: station.operational?.status } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to update status', error: e.message });
  }
};

// Admin: Assign or change station manager
export const updateStationManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;
    if (!managerId) return res.status(400).json({ success: false, message: 'managerId is required' });
    const manager = await User.findById(managerId);
    if (!manager) return res.status(404).json({ success: false, message: 'Manager user not found' });
    const station = await Station.findByIdAndUpdate(
      id,
      { $set: { managerId } },
      { new: true }
    );
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
    return res.json({ success: true, data: { id: station._id, managerId: station.managerId } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to update manager', error: e.message });
  }
};
export const listUsers = async (_req, res) => {
  try {
    const users = await User.find(
      {},
      {
        'personalInfo.firstName': 1,
        'personalInfo.lastName': 1,
        'personalInfo.email': 1,
        role: 1,
        createdAt: 1,
        'credentials.isActive': 1
      }
    )
      .limit(200)
      .sort({ createdAt: -1 });
    return res.json({ users });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load users' });
  }
};

// Admin: Activate/Deactivate any user
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive boolean is required' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.credentials = user.credentials || {};
    const oldStatus = user.credentials.isActive;
    user.credentials.isActive = isActive;
    await user.save();

    // Create admin action notification
    try {
      const { createAdminActionNotification } = await import('./notification.controller.js');
      await createAdminActionNotification(req.user.sub || req.user.id, 'user_status_changed', {
        userName: `${user.personalInfo?.firstName || ''} ${user.personalInfo?.lastName || ''}`.trim() || 'Unknown User',
        isActive
      });
    } catch (notificationError) {
      console.error('Failed to create user status change notification:', notificationError);
    }

    return res.json({ success: true, user: {
      _id: user._id,
      role: user.role,
      personalInfo: user.personalInfo,
      credentials: { isActive: user.credentials?.isActive },
      createdAt: user.createdAt
    }});
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update user status' });
  }
};

// List corporate admins with active status
export const listCorporateAdmins = async (_req, res) => {
	try {
		const admins = await User.find(
			{ role: 'corporate_admin' },
			{
				'personalInfo.firstName': 1,
				'personalInfo.lastName': 1,
				'personalInfo.email': 1,
				'personalInfo.phone': 1,
				'personalInfo.address': 1,
				'credentials.isActive': 1,
				'roleSpecificData.corporateAdminInfo': 1,
				createdAt: 1
			}
		)
		.populate('roleSpecificData.corporateAdminInfo.corporateId', 'name businessRegistrationNumber contactEmail contactPhone status')
		.sort({ createdAt: -1 });
		return res.json({ admins });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to load corporate admins' });
	}
};

export const addCorporateAdmin = async (req, res) => {
	try {
		console.log('Adding corporate admin with data:', req.body);
		
		let {
			companyName,
			companyEmail,
			firstName,
			lastName,
			contactNumber,
			businessRegistrationNumber
		} = req.body;

		// Normalize inputs
		companyName = (companyName || '').trim();
		companyEmail = (companyEmail || '').trim();
		firstName = (firstName || '').trim();
		lastName = (lastName || '').trim();
		contactNumber = (contactNumber || '').trim();
		businessRegistrationNumber = (businessRegistrationNumber || '').trim();

		// Validate required fields
		if (!companyName || !companyEmail || !firstName || !lastName || !contactNumber) {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields: companyName, companyEmail, firstName, lastName, contactNumber'
			});
		}

		// Server-side validation rules
		if (companyName.length > 20) {
			return res.status(400).json({ success: false, message: 'Company name must be 20 characters or fewer' });
		}

		// Email: allow subdomains, require TLD >= 2 letters
		const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
		if (!emailRegex.test(companyEmail)) {
			return res.status(400).json({ success: false, message: 'Invalid company email format' });
		}

		const phoneDigitsOnly = String(contactNumber).replace(/\D/g, '');
		if (phoneDigitsOnly.length !== 10) {
			return res.status(400).json({ success: false, message: 'Contact number must be exactly 10 digits' });
		}

		// Contact person first/last name: letters and spaces only
		const nameRegex = /^[A-Za-z ]+$/;
		if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
			return res.status(400).json({ success: false, message: 'First and Last name must contain only letters and spaces' });
		}

		// BRN: exactly 21 alphanumeric characters, unique
		const brn = businessRegistrationNumber;
		if (!/^[A-Za-z0-9]{21}$/.test(brn)) {
			return res.status(400).json({ success: false, message: 'Business Registration Number must be a 21-character alphanumeric code' });
		}

		// Uniqueness checks
		// Email must be unique
		const existingUserByEmail = await User.findOne({ 'personalInfo.email': companyEmail });
		if (existingUserByEmail) {
			return res.status(400).json({ success: false, message: 'A user with this email already exists' });
		}

		// Phone must be unique
		const existingUserByPhone = await User.findOne({ 'personalInfo.phone': phoneDigitsOnly });
		if (existingUserByPhone) {
			return res.status(400).json({ success: false, message: 'A user with this contact number already exists' });
		}

		// Company name must be unique among corporates
		const existingCorpByName = await Corporate.findOne({ name: new RegExp(`^${companyName}$`, 'i') });
		if (existingCorpByName) {
			return res.status(400).json({ success: false, message: 'A corporate with this name already exists' });
		}

		// Generate a secure temporary password
		const tempPassword = generateSecurePassword();
		console.log('Generated temp password for:', companyEmail);
		
		const hashedPassword = await bcryptjs.hash(tempPassword, 12);

		// Create the corporate entity first
		const corporate = await Corporate.create({
			name: companyName,
			businessRegistrationNumber: brn,
			contactEmail: companyEmail,
			contactPhone: phoneDigitsOnly,
			admins: []
		});

		// Create the corporate admin user
		const user = new User({
			personalInfo: {
				firstName: firstName || 'Corporate',
				lastName: lastName || 'Admin',
				email: companyEmail,
				phone: phoneDigitsOnly,
				address: ''
			},
			credentials: {
				passwordHash: hashedPassword,
				lastLogin: new Date(),
				isActive: true,
				twoFactorEnabled: false,
				mustChangePassword: true
			},
			role: 'corporate_admin',
			roleSpecificData: {
				corporateAdminInfo: {
					corporateId: corporate._id,
					accessLevel: 'full',
					managedFranchises: []
				}
			}
		});

		console.log('Saving user to database...');
		await user.save();
		corporate.admins.push(user._id);
		await corporate.save();
		console.log('User saved successfully:', user._id);

		// Send welcome email with temporary password
		console.log('Sending welcome email...');
		const emailSent = await sendCorporateAdminWelcomeEmail({
			companyName,
			companyEmail,
			contactPersonName: `${firstName} ${lastName}`.trim(),
			tempPassword
		});

		if (!emailSent) {
			console.warn('Failed to send welcome email to corporate admin');
		} else {
			console.log('Welcome email sent successfully');
		}

		// Create admin action notification
		try {
			const { createAdminActionNotification } = await import('./notification.controller.js');
			await createAdminActionNotification(req.user.sub || req.user.id, 'corporate_admin_added', {
				adminName: `${firstName} ${lastName}`.trim(),
				companyName
			});
		} catch (notificationError) {
			console.error('Failed to create corporate admin added notification:', notificationError);
		}

		res.status(201).json({
			success: true,
			message: 'Corporate admin added successfully',
			data: {
				userId: user._id,
				email: companyEmail,
				companyName,
				corporateId: corporate._id
			}
		});

	} catch (error) {
		console.error('Error adding corporate admin:', error);
		res.status(500).json({
			success: false,
			message: `Internal server error: ${error.message}`
		});
	}
};

// Activate/Deactivate a corporate admin
export const updateCorporateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive boolean is required' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'corporate_admin') {
      return res.status(400).json({ error: 'Only corporate admins can be updated with this endpoint' });
    }

    const oldStatus = user.credentials.isActive;
    user.credentials.isActive = isActive;
    await user.save();

    // Create admin action notification
    try {
      const { createAdminActionNotification } = await import('./notification.controller.js');
      await createAdminActionNotification(req.user.sub || req.user.id, 'corporate_admin_status_changed', {
        adminName: `${user.personalInfo?.firstName || ''} ${user.personalInfo?.lastName || ''}`.trim() || 'Unknown Admin',
        isActive,
        companyName: user.roleSpecificData?.corporateAdminInfo?.corporateId?.name || 'Unknown Company'
      });
    } catch (notificationError) {
      console.error('Failed to create corporate admin status change notification:', notificationError);
    }

    return res.json({ success: true, user: {
      _id: user._id,
      role: user.role,
      personalInfo: user.personalInfo,
      credentials: { isActive: user.credentials?.isActive },
      roleSpecificData: user.roleSpecificData,
      createdAt: user.createdAt
    }});
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update status' });
  }
};

// Helper function to generate secure password
const generateSecurePassword = () => {
	const length = 12;
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
	let password = '';
	
	for (let i = 0; i < length; i++) {
		password += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	
	return password;
};


