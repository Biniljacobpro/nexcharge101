import Corporate from '../models/corporate.model.js';
import User from '../models/user.model.js';
import Station from '../models/station.model.js';
import Booking from '../models/booking.model.js';
import Franchise from '../models/franchise.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendFranchiseOwnerWelcomeEmail } from '../utils/emailService.js';

// Resolve corporateId from JWT payload or DB (for corporate admins)
const resolveCorporateIdFromRequest = async (req) => {
  if (req?.user?.corporateId) return req.user.corporateId;
  if (!req?.user?.sub) return null;
  try {
    const requester = await User.findById(req.user.sub).select('roleSpecificData.corporateAdminInfo.corporateId');
    return requester?.roleSpecificData?.corporateAdminInfo?.corporateId || null;
  } catch (_e) {
    return null;
  }
};

// Allow corporate admin to update station operational status for stations under their corporate
export const updateCorporateStationStatus = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });

    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['active', 'maintenance', 'inactive'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Allowed: active, maintenance, inactive' });
    }

    // Verify station belongs to corporate (directly or via franchises)
    const franchises = await Franchise.find({ corporateId }).select('_id').lean();
    const franchiseIds = franchises.map(f => f._id);

    const station = await Station.findOne({
      _id: id,
      $or: [
        { corporateId },
        ...(franchiseIds.length ? [{ franchiseId: { $in: franchiseIds } }] : [])
      ]
    });

    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found for this corporate' });
    }

    station.operational = station.operational || {};
    station.operational.status = status;
    await station.save();

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

    return res.json({ success: true, message: 'Status updated', data: { id: station._id, status } });
  } catch (error) {
    console.error('Error updating corporate station status:', error);
    return res.status(500).json({ success: false, message: 'Error updating station status' });
  }
};

// Get corporate info for the current corporate admin
export const getCorporateInfo = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });
    const corp = await Corporate.findById(corporateId).select('name businessRegistrationNumber contactEmail contactPhone status createdAt updatedAt');
    if (!corp) return res.status(404).json({ success: false, message: 'Corporate not found' });
    return res.json({ success: true, data: corp });
  } catch (error) {
    console.error('Error fetching corporate info:', error);
    return res.status(500).json({ success: false, message: 'Error fetching corporate info' });
  }
};

// Update corporate name (corporate admin only for own corporate)
export const updateCorporateName = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Valid name is required' });
    }
    if (name.trim().length > 50) {
      return res.status(400).json({ success: false, message: 'Company name must be 50 characters or fewer' });
    }
    const existing = await Corporate.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (existing && String(existing._id) !== String(corporateId)) {
      return res.status(400).json({ success: false, message: 'A corporate with this name already exists' });
    }
    const updated = await Corporate.findByIdAndUpdate(
      corporateId,
      { $set: { name: name.trim() } },
      { new: true }
    ).select('name businessRegistrationNumber contactEmail contactPhone status');
    return res.json({ success: true, message: 'Company name updated', data: updated });
  } catch (error) {
    console.error('Error updating corporate name:', error);
    return res.status(500).json({ success: false, message: 'Error updating company name' });
  }
};

// Get corporate dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });
    
    // Get franchises under this corporate
    const corpFranchises = await Franchise.find({ corporateId }).select('_id').lean();
    const corpFranchiseIds = corpFranchises.map(f => f._id);

    // Get franchise owners under this corporate (owners whose franchiseId belongs to this corporate)
    const franchiseOwners = await User.find({ 
      role: 'franchise_owner', 
      'roleSpecificData.franchiseOwnerInfo.franchiseId': { $in: corpFranchiseIds }
    }).select('personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone status credentials.isActive createdAt roleSpecificData');

    // Get total stations under this corporate
    const stations = await Station.find({ $or: [ { corporateId }, { franchiseId: { $in: corpFranchiseIds } } ] });
    
    // Get total bookings and revenue
    const bookings = await Booking.find({ 
      $or: [
        { corporateId },
        { franchiseId: { $in: corpFranchiseIds } },
      ],
      status: { $in: ['completed', 'in-progress'] }
    });

    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
    
    // Calculate monthly growth (mock calculation)
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentMonthRevenue = bookings
      .filter(b => new Date(b.createdAt).getMonth() === currentMonth)
      .reduce((sum, booking) => sum + (booking.amount || 0), 0);
    const lastMonthRevenue = bookings
      .filter(b => new Date(b.createdAt).getMonth() === lastMonth)
      .reduce((sum, booking) => sum + (booking.amount || 0), 0);
    
    const monthlyGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;

    // Calculate network utilization (mock calculation)
    const totalCapacity = stations.length * 8; // Assuming 8 slots per station
    const activeBookings = bookings.filter(b => b.status === 'in-progress').length;
    const networkUtilization = totalCapacity > 0 ? (activeBookings / totalCapacity * 100).toFixed(1) : 0;

    // Get average rating (mock calculation)
    const averageRating = 4.6; // This would be calculated from actual ratings

    const dashboardData = {
      corporateId: corporateId, // Include corporateId for commission module
      totalFranchises: franchiseOwners.length,
      totalStations: stations.length,
      totalRevenue: totalRevenue,
      monthlyGrowth: parseFloat(monthlyGrowth),
      activeBookings: activeBookings,
      totalUsers: bookings.length, // Total unique users who booked
      networkUtilization: parseFloat(networkUtilization),
      averageRating: averageRating,
      franchises: franchiseOwners.map(franchise => ({
        id: franchise._id,
        name: `${franchise.personalInfo?.firstName || ''} ${franchise.personalInfo?.lastName || ''}`.trim(),
        email: franchise.personalInfo?.email,
        phone: franchise.personalInfo?.phone,
        status: franchise.status,
        joinDate: franchise.createdAt
      }))
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// Add new franchise owner
export const addFranchiseOwner = async (req, res) => {
  try {
    const {
      // Personal Information
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      country = 'India',
      
      // Business Information
      franchiseName,
      businessType = 'individual',
      registrationNumber,
      gstNumber,
      panNumber,
      licenseNumber,
      
      // Financial Information
      profitShare = 15,
      commissionRate = 10,
      
      // Bank Details
      bankAccountNumber,
      bankIfscCode,
      bankName,
      bankAccountHolderName,
      
      // Operational Information
      territory,
      minimumStations = 1,
      maximumStations = 10,
      
      status = 'pending'
    } = req.body;

    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) {
      return res.status(403).json({ success: false, message: 'Corporate context not found' });
    }

    // Validation
    if (!firstName || !lastName || !email || !phone || !franchiseName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, phone, franchiseName'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Phone must be exactly 10 digits'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ 'personalInfo.email': email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if franchise name already exists for this corporate
    const existingFranchise = await Franchise.findOne({ 
      name: franchiseName.trim(),
      corporateId: corporateId
    });
    if (existingFranchise) {
      return res.status(400).json({
        success: false,
        message: 'Franchise name already exists for this corporate'
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create franchise owner user
    const franchiseOwner = await User.create({
      role: 'franchise_owner',
      personalInfo: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ''),
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || ''
      },
      credentials: {
        passwordHash: hashedPassword,
        mustChangePassword: true,
        isActive: true
      },
      roleSpecificData: {
        franchiseOwnerInfo: {
          profitShare: Number(profitShare),
          managedStations: [],
          franchiseId: null
        }
      }
    });

    // Create franchise record
    const businessInfoPayload = {
      businessType: businessType,
    };
    if (registrationNumber && registrationNumber.toString().trim()) {
      businessInfoPayload.registrationNumber = registrationNumber.toString().trim();
    }
    if (gstNumber && gstNumber.toString().trim()) {
      businessInfoPayload.gstNumber = gstNumber.toString().trim();
    }
    if (panNumber && panNumber.toString().trim()) {
      businessInfoPayload.panNumber = panNumber.toString().trim();
    }
    if (licenseNumber && licenseNumber.toString().trim()) {
      businessInfoPayload.licenseNumber = licenseNumber.toString().trim();
    }

    const franchise = await Franchise.create({
      name: franchiseName.trim(),
      ownerId: franchiseOwner._id,
      corporateId: corporateId,
      contactInfo: {
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ''),
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        country: country
      },
      businessInfo: businessInfoPayload,
      financialInfo: {
        profitShare: Number(profitShare),
        commissionRate: Number(commissionRate),
        bankDetails: {
          accountNumber: bankAccountNumber || '',
          ifscCode: bankIfscCode || '',
          bankName: bankName || '',
          accountHolderName: bankAccountHolderName || ''
        }
      },
      operationalInfo: {
        territory: territory || '',
        minimumStations: Number(minimumStations),
        maximumStations: Number(maximumStations)
      },
      status: status
    });

    // Update user with franchise reference
    await User.findByIdAndUpdate(franchiseOwner._id, {
      'roleSpecificData.franchiseOwnerInfo.franchiseId': franchise._id
    });

    // Send welcome email with temporary password (non-blocking for API success)
    try {
      await sendFranchiseOwnerWelcomeEmail({
        ownerName: `${firstName} ${lastName}`.trim(),
        ownerEmail: email.trim().toLowerCase(),
        tempPassword,
        franchiseName: franchiseName.trim()
      });
    } catch (mailError) {
      console.warn('sendFranchiseOwnerWelcomeEmail failed:', mailError?.message || mailError);
      // Do not fail the request if email fails
    }

    // Create admin action notification
    try {
      const { createAdminActionNotification } = await import('./notification.controller.js');
      await createAdminActionNotification(req.user.sub || req.user.id, 'franchise_owner_added', {
        ownerName: `${firstName} ${lastName}`.trim(),
        franchiseName: franchiseName.trim()
      });
    } catch (notificationError) {
      console.error('Failed to create franchise owner added notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Franchise owner added successfully',
      data: {
        id: franchiseOwner._id,
        franchiseId: franchise._id,
        name: `${firstName} ${lastName}`.trim(),
        email: email.trim().toLowerCase(),
        franchiseName: franchiseName.trim()
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'duplicate';
      return res.status(400).json({
        success: false,
        message: `Duplicate value for ${field}`
      });
    }
    console.error('Error adding franchise owner:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding franchise owner',
      error: error.message
    });
  }
};

// Update franchise owner
export const updateFranchiseOwner = async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      franchiseName,
      status
    } = req.body;

    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });

    // Find franchise owner under this corporate
    const franchiseOwner = await User.findOne({
      _id: franchiseId,
      role: 'franchise_owner',
      'roleSpecificData.franchiseOwnerInfo.franchiseId': { $exists: true }
    });

    if (!franchiseOwner) {
      return res.status(404).json({
        success: false,
        message: 'Franchise owner not found'
      });
    }

    // Email cannot be changed via this endpoint
    if (email && email !== franchiseOwner.personalInfo?.email) {
      return res.status(400).json({ success: false, message: 'Email cannot be changed' });
    }

    // Update franchise owner
    const updateData = {};
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    // do not allow email change
    if (phone) updateData.phone = phone.replace(/\D/g, '');
    if (status) updateData.status = status;
    
    if (address || city || state || pincode) {
      updateData.personalInfo = {
        ...franchiseOwner.personalInfo,
        firstName: firstName ? firstName.trim() : franchiseOwner.personalInfo.firstName,
        lastName: lastName ? lastName.trim() : franchiseOwner.personalInfo.lastName,
        email: franchiseOwner.personalInfo.email,
        phone: phone ? phone.replace(/\D/g, '') : franchiseOwner.personalInfo.phone,
        address: address || franchiseOwner.personalInfo.address,
        city: city || franchiseOwner.personalInfo.city,
        state: state || franchiseOwner.personalInfo.state,
        pincode: pincode || franchiseOwner.personalInfo.pincode
      };
    }

    // Update franchise name in Franchise document if provided
    if (franchiseName && franchiseOwner.roleSpecificData?.franchiseOwnerInfo?.franchiseId) {
      await Franchise.findByIdAndUpdate(
        franchiseOwner.roleSpecificData.franchiseOwnerInfo.franchiseId,
        { name: franchiseName.toString().trim() }
      );
    }

    const updatedFranchiseOwner = await User.findByIdAndUpdate(
      franchiseId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Franchise owner updated successfully',
      data: {
        id: updatedFranchiseOwner._id,
        name: `${updatedFranchiseOwner.firstName} ${updatedFranchiseOwner.lastName}`,
        email: updatedFranchiseOwner.email,
        status: updatedFranchiseOwner.status
      }
    });
  } catch (error) {
    console.error('Error updating franchise owner:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating franchise owner',
      error: error.message
    });
  }
};

// Delete franchise owner
export const deleteFranchiseOwner = async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });

    // Find franchise owner under this corporate
    const franchiseOwner = await User.findOne({
      _id: franchiseId,
      role: 'franchise_owner',
      'roleSpecificData.franchiseOwnerInfo.franchiseId': { $exists: true }
    }).select('roleSpecificData.franchiseOwnerInfo.franchiseId');

    if (!franchiseOwner) {
      return res.status(404).json({
        success: false,
        message: 'Franchise owner not found'
      });
    }

    // Determine the Franchise document id linked to this owner
    const linkedFranchiseId = franchiseOwner.roleSpecificData?.franchiseOwnerInfo?.franchiseId;

    // Block deletion if any stations exist under this franchise
    const totalStations = await Station.countDocuments({ franchiseId: linkedFranchiseId });
    if (totalStations > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete franchise owner with existing stations. Please transfer or remove stations first.'
      });
    }

    // Block deletion if any stations under this franchise have a manager assigned
    const managedStations = await Station.countDocuments({
      franchiseId: linkedFranchiseId,
      managerId: { $exists: true, $ne: null }
    });
    if (managedStations > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete franchise owner while station managers are assigned to their stations. Please unassign managers first.'
      });
    }

    // Hard delete: remove Franchise document and the User document
    if (linkedFranchiseId) {
      await Franchise.findByIdAndDelete(linkedFranchiseId);
    }
    await User.findByIdAndDelete(franchiseId);

    res.json({
      success: true,
      message: 'Franchise owner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting franchise owner:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting franchise owner',
      error: error.message
    });
  }
};

// Get franchise owners list
export const getFranchiseOwners = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {
      role: 'franchise_owner',
      'roleSpecificData.franchiseOwnerInfo.franchiseId': { $exists: true },
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const franchiseOwners = await User.find(query)
      .select('personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone status createdAt roleSpecificData')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get additional data for each franchise owner
    const franchiseData = await Promise.all(
      franchiseOwners.map(async (frOwner) => {
        const frId = frOwner?.roleSpecificData?.franchiseOwnerInfo?.franchiseId;
        const franchiseDoc = frId ? await Franchise.findById(frId).select('name') : null;
        const stations = await Station.find({ franchiseId: frId || frOwner._id });
        const bookings = await Booking.find({ franchiseId: frId || frOwner._id });
        const revenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);

        const firstName = frOwner.personalInfo?.firstName || '';
        const lastName = frOwner.personalInfo?.lastName || '';

        return {
          id: frOwner._id,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          email: frOwner.personalInfo?.email,
          phone: frOwner.personalInfo?.phone,
          franchiseName: franchiseDoc?.name || '',
          location: `${frOwner.personalInfo?.city || ''}, ${frOwner.personalInfo?.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
          stations: stations.length,
          revenue: revenue,
          status: frOwner?.credentials?.isActive ? 'active' : 'inactive',
          rating: 4.5,
          joinDate: frOwner.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        franchises: franchiseData,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching franchise owners:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching franchise owners',
      error: error.message
    });
  }
};

// Get corporate users (franchise owners and station managers)
export const getCorporateUsers = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });

    // Get franchises under this corporate
    const corpFranchises = await Franchise.find({ corporateId }).select('_id').lean();
    const corpFranchiseIds = corpFranchises.map(f => f._id);

    // Get franchise owners
    const franchiseOwners = await User.find({ 
      role: 'franchise_owner', 
      'roleSpecificData.franchiseOwnerInfo.franchiseId': { $in: corpFranchiseIds }
    }).select('personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone credentials.isActive createdAt role');

    // Get station managers from stations under this corporate
    const stationManagers = await User.find({
      role: 'station_manager',
      'roleSpecificData.stationManagerInfo.assignedStations': { $exists: true }
    }).populate({
      path: 'roleSpecificData.stationManagerInfo.assignedStations',
      match: {
        $or: [
          { corporateId },
          ...(corpFranchiseIds.length ? [{ franchiseId: { $in: corpFranchiseIds } }] : [])
        ]
      },
      select: 'name'
    }).select('personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone credentials.isActive createdAt role roleSpecificData');

    // Filter station managers who actually have stations under this corporate
    const filteredStationManagers = stationManagers.filter(manager => 
      manager.roleSpecificData?.stationManagerInfo?.assignedStations?.length > 0
    );

    const allUsers = [
      ...franchiseOwners.map(user => ({
        _id: user._id,
        personalInfo: user.personalInfo,
        role: user.role,
        credentials: user.credentials,
        createdAt: user.createdAt
      })),
      ...filteredStationManagers.map(user => ({
        _id: user._id,
        personalInfo: user.personalInfo,
        role: user.role,
        credentials: user.credentials,
        createdAt: user.createdAt
      }))
    ];

    return res.json({ success: true, users: allUsers });
  } catch (error) {
    console.error('Error fetching corporate users:', error);
    return res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

// Update user status (activate/deactivate)
export const updateCorporateUserStatus = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });

    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean is required' });
    }

    // Find user and verify they belong to this corporate
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check if user belongs to this corporate
    let belongsToCorporate = false;

    if (user.role === 'franchise_owner') {
      const franchiseId = user.roleSpecificData?.franchiseOwnerInfo?.franchiseId;
      if (franchiseId) {
        const franchise = await Franchise.findOne({ _id: franchiseId, corporateId });
        belongsToCorporate = !!franchise;
      }
    } else if (user.role === 'station_manager') {
      // Check if any assigned stations belong to this corporate
      const assignedStations = user.roleSpecificData?.stationManagerInfo?.assignedStations || [];
      if (assignedStations.length > 0) {
        const corpFranchises = await Franchise.find({ corporateId }).select('_id').lean();
        const corpFranchiseIds = corpFranchises.map(f => f._id);
        
        const stationCount = await Station.countDocuments({
          _id: { $in: assignedStations },
          $or: [
            { corporateId },
            ...(corpFranchiseIds.length ? [{ franchiseId: { $in: corpFranchiseIds } }] : [])
          ]
        });
        belongsToCorporate = stationCount > 0;
      }
    }

    if (!belongsToCorporate) {
      return res.status(403).json({ success: false, message: 'User does not belong to your corporate' });
    }

    user.credentials = user.credentials || {};
    user.credentials.isActive = isActive;
    await user.save();

    return res.json({ 
      success: true, 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        role: user.role,
        personalInfo: user.personalInfo,
        credentials: { isActive: user.credentials?.isActive },
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ success: false, message: 'Error updating user status' });
  }
};

// Get corporate analytics
export const getAnalytics = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });
    const { period = 'month' } = req.query;

    // Get franchises under this corporate
    const corpFranchises = await Franchise.find({ corporateId }).select('_id').lean();
    const corpFranchiseIds = corpFranchises.map(f => f._id);

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 6); // Last 6 months plus current
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 6);
    }

    // Get bookings for revenue data
    const bookings = await Booking.find({
      $or: [
        { corporateId },
        { franchiseId: { $in: corpFranchiseIds } }
      ],
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'in-progress'] }
    });

    // Group bookings by month for revenue chart
    const monthlyData = {};
    
    // Initialize months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      monthlyData[monthKey] = { revenue: 0, bookings: 0 };
    }
    
    // Process bookings
    bookings.forEach(booking => {
      const monthKey = booking.createdAt.toLocaleString('default', { month: 'short' });
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += booking.amount || 0;
        monthlyData[monthKey].bookings += 1;
      }
    });
    
    // Convert to array format for chart
    const revenueData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      bookings: data.bookings
    }));

    // Get stations for station type distribution
    const stations = await Station.find({
      $or: [
        { corporateId },
        { franchiseId: { $in: corpFranchiseIds } }
      ]
    });

    // Calculate station type distribution based on charger types
    const chargerTypeCounts = {};
    stations.forEach(station => {
      if (station.capacity?.chargerTypes && Array.isArray(station.capacity.chargerTypes)) {
        // Use the chargerTypes array from capacity
        station.capacity.chargerTypes.forEach(type => {
          if (type) {
            chargerTypeCounts[type] = (chargerTypeCounts[type] || 0) + 1;
          }
        });
      } else if (station.chargers && Array.isArray(station.chargers)) {
        // Fallback to individual chargers array
        station.chargers.forEach(charger => {
          if (charger.type) {
            chargerTypeCounts[charger.type] = (chargerTypeCounts[charger.type] || 0) + 1;
          }
        });
      }
    });

    // Convert to chart format with colors
    const chargerTypeColors = {
      'Fast Charging': '#0088FE',
      'Standard Charging': '#00C49F',
      'Slow Charging': '#FFBB28',
      'Ultra Fast': '#FF8042',
      'Rapid Charging': '#8884d8'
    };

    const stationData = Object.entries(chargerTypeCounts).map(([type, count], index) => ({
      name: type,
      value: count,
      color: chargerTypeColors[type] || `hsl(${index * 60}, 70%, 50%)`
    }));

    // Calculate performance metrics
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
    
    // Average rating calculation (would come from reviews in real implementation)
    const avgRating = 4.6; // This would be calculated from actual reviews
    
    // Network efficiency calculation (simplified)
    const totalStations = stations.length;
    const activeStations = stations.filter(s => s.operational?.status === 'active').length;
    const networkEfficiency = totalStations > 0 ? Math.round((activeStations / totalStations) * 100) : 0;
    
    // Station uptime calculation (simplified)
    const stationUptime = 96.2; // This would come from actual uptime tracking
    
    // Revenue per station calculation
    const revenuePerStation = totalStations > 0 ? Math.round(totalRevenue / totalStations) : 0;

    const performanceMetrics = {
      networkEfficiency,
      customerSatisfaction: avgRating,
      stationUptime,
      revenuePerStation
    };

    res.json({
      success: true,
      data: {
        revenueData,
        stationData,
        performanceMetrics
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// Get recent bookings
export const getRecentBookings = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });
    const { limit = 10 } = req.query;

    const bookings = await Booking.find({ corporateId: corporateId })
      .populate('userId', 'firstName lastName')
      .populate('stationId', 'name location')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const bookingData = bookings.map(booking => ({
      id: booking._id,
      user: `${booking.userId?.firstName || ''} ${booking.userId?.lastName || ''}`.trim(),
      station: booking.stationId?.name || 'Unknown Station',
      amount: booking.amount || 0,
      time: getTimeAgo(booking.createdAt),
      status: booking.status
    }));

    res.json({
      success: true,
      data: bookingData
    });
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent bookings',
      error: error.message
    });
  }
};

// Helper function to get time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} weeks ago`;
};

// named exports above
// List stations under this corporate
export const getCorporateStations = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });

    // Find franchises under this corporate
    const franchises = await Franchise.find({ corporateId }).select('_id').lean();
    const franchiseIds = franchises.map(f => f._id);

    // Fetch stations by either corporateId or franchise linkage
    const stations = await Station.find({
      $or: [
        { corporateId },
        ...(franchiseIds.length ? [{ franchiseId: { $in: franchiseIds } }] : [])
      ]
    })
      .select('name code description address city state pincode location chargers capacity pricing amenities operational managerId createdAt updatedAt status totalChargers')
      .lean();

    const data = stations.map((s) => ({
      id: s._id,
      name: s.name,
      code: s.code,
      description: s.description || '',
      address: s.address || '',
      city: s.city || s.location?.city || s.location?.address?.city || '',
      state: s.state || s.location?.state || s.location?.address?.state || '',
      pincode: s.pincode || s.location?.pincode || s.location?.address?.pincode || '',
      totalChargers: (s.capacity?.totalChargers != null) 
        ? Number(s.capacity.totalChargers) 
        : (Array.isArray(s.chargers) ? s.chargers.length : (Number(s.totalChargers) || 0)),
      chargerTypes: (Array.isArray(s.capacity?.chargerTypes) && s.capacity.chargerTypes.length > 0)
        ? s.capacity.chargerTypes.map((t) => (typeof t === 'string' ? t : (t?.type || null))).filter(Boolean)
        : (Array.isArray(s.chargers) ? [...new Set(s.chargers.map(c => c.type).filter(Boolean))] : []),
      basePrice: s.pricing?.basePrice || 0,
      amenities: s.amenities || [],
      status: s.operational?.status || 'active',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching corporate stations:', error);
    res.status(500).json({ success: false, message: 'Error fetching stations', error: error.message });
  }
};

// Get all bookings for corporate with franchise information
export const getAllBookings = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });
    
    const { page = 1, limit = 10, franchiseId, status } = req.query;
    
    // Get franchises under this corporate
    const corpFranchises = await Franchise.find({ corporateId }).select('_id name').lean();
    const corpFranchiseIds = corpFranchises.map(f => f._id);
    
    // Get all stations under this corporate (both direct and through franchises)
    const stationQuery = {
      $or: [
        { corporateId },
        ...(corpFranchiseIds.length > 0 ? [{ franchiseId: { $in: corpFranchiseIds } }] : [])
      ]
    };
    
    const stations = await Station.find(stationQuery).select('_id franchiseId').lean();
    const stationIds = stations.map(s => s._id);
    
    // Build booking query based on stations
    let bookingQuery = {
      stationId: { $in: stationIds }
    };
    
    // Apply franchise filter if specified
    if (franchiseId && franchiseId !== 'all') {
      if (franchiseId === 'null') {
        // Show only corporate direct bookings (stations with corporateId but no franchiseId)
        // Fix: Query for stations that have corporateId and either don't have franchiseId or have it as null
        const corpStations = await Station.find({ 
          corporateId,
          $or: [
            { franchiseId: { $exists: false } },
            { franchiseId: null }
          ]
        }).select('_id').lean();
        const corpStationIds = corpStations.map(s => s._id);
        bookingQuery.stationId = { $in: corpStationIds };
      } else {
        // Show bookings for specific franchise
        const franchiseStations = await Station.find({ franchiseId }).select('_id').lean();
        const franchiseStationIds = franchiseStations.map(s => s._id);
        bookingQuery.stationId = { $in: franchiseStationIds };
      }
    }
    
    // Apply status filter if specified
    if (status && status !== 'all') {
      bookingQuery.status = status;
    }
    
    // Fetch bookings with populated references
    const bookings = await Booking.find(bookingQuery)
      .populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.email')
      .populate('stationId', 'name code corporateId franchiseId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get total count for pagination
    const total = await Booking.countDocuments(bookingQuery);
    
    // Create a map of stationId to station info for quick lookup
    const stationMap = stations.reduce((map, station) => {
      map[station._id.toString()] = station;
      return map;
    }, {});
    
    // Create a map of franchiseId to franchise name for quick lookup
    const franchiseMap = corpFranchises.reduce((map, franchise) => {
      map[franchise._id.toString()] = franchise.name;
      return map;
    }, {});
    
    const bookingData = bookings.map(booking => {
      // Get the station info
      const stationInfo = stationMap[booking.stationId?._id.toString()];
      const franchiseId = stationInfo?.franchiseId;
      // Ensure we're using the franchise name from the franchise document, not user data
      const franchiseName = franchiseId ? (franchiseMap[franchiseId.toString()] || 'Unknown Franchise') : 'Corporate Direct';
      
      // Get the correct amount from payment or pricing information
      const amount = booking.payment?.paidAmount || 
                    booking.pricing?.actualCost || 
                    booking.pricing?.estimatedCost || 
                    0;
      
      return {
        id: booking._id,
        user: {
          id: booking.userId?._id,
          name: `${booking.userId?.personalInfo?.firstName || ''} ${booking.userId?.personalInfo?.lastName || ''}`.trim(),
          email: booking.userId?.personalInfo?.email || ''
        },
        station: {
          id: booking.stationId?._id,
          name: booking.stationId?.name || 'Unknown Station',
          code: booking.stationId?.code || ''
        },
        franchise: {
          id: franchiseId || null,
          name: franchiseName
        },
        amount: amount,
        createdAt: booking.createdAt,
        time: getTimeAgo(booking.createdAt),
        status: booking.status,
        bookingTime: booking.createdAt.toLocaleString()
      };
    });
    
    res.json({
      success: true,
      data: {
        bookings: bookingData,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total: total
        },
        franchises: corpFranchises.map(f => ({ id: f._id, name: f.name }))
      }
    });
  } catch (error) {
    console.error('Error fetching corporate bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching corporate bookings',
      error: error.message
    });
  }
};

// Get users with churn risk data for corporate dashboard
export const getChurnRiskUsers = async (req, res) => {
  try {
    const corporateId = await resolveCorporateIdFromRequest(req);
    if (!corporateId) return res.status(403).json({ success: false, message: 'Corporate context not found' });
    
    // Get query parameters
    const { risk, page = 1, limit = 10 } = req.query;
    
    // Build query for EV users under this corporate
    const query = {
      role: 'ev_user',
      'credentials.isActive': true,
      'roleSpecificData.evUserInfo': { $exists: true }
    };
    
    // Filter by churn risk if specified
    if (risk) {
      query['roleSpecificData.evUserInfo.churnRisk'] = risk;
    }
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone roleSpecificData.evUserInfo.churnRisk roleSpecificData.evUserInfo.churnProbability roleSpecificData.evUserInfo.lastPredictionDate')
      .sort({ 'roleSpecificData.evUserInfo.churnProbability': -1 }) // Sort by highest probability first
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    // Format response data
    const userData = users.map(user => ({
      id: user._id,
      firstName: user.personalInfo?.firstName || '',
      lastName: user.personalInfo?.lastName || '',
      email: user.personalInfo?.email || '',
      phone: user.personalInfo?.phone || '',
      churnRisk: user.roleSpecificData?.evUserInfo?.churnRisk || 'Low',
      churnProbability: user.roleSpecificData?.evUserInfo?.churnProbability || 0,
      lastPredictionDate: user.roleSpecificData?.evUserInfo?.lastPredictionDate || null
    }));
    
    res.json({
      success: true,
      data: {
        users: userData,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching churn risk users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching churn risk users',
      error: error.message
    });
  }
};
