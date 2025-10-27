import User from '../models/user.model.js';
import Franchise from '../models/franchise.model.js';
import Station from '../models/station.model.js';
import Booking from '../models/booking.model.js';
import bcrypt from 'bcryptjs';

// Helper function to get franchise ID from user
const getFranchiseIdFromUser = async (req) => {
  try {
    console.log('Getting franchise ID for user:', req.user.sub || req.user.sub);
    const user = await User.findById(req.user.sub || req.user.sub);
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('User role:', user?.role);
    console.log('Franchise owner info:', user?.roleSpecificData?.franchiseOwnerInfo);
    
    const franchiseId = user?.roleSpecificData?.franchiseOwnerInfo?.franchiseId;
    console.log('Franchise ID from user:', franchiseId);
    
    return franchiseId;
  } catch (error) {
    console.error('Error getting franchise ID from user:', error);
    return null;
  }
};

// Test endpoint
export const testEndpoint = async (req, res) => {
  res.json({ success: true, message: 'Franchise owner API is working', user: req.user });
};

// Get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    console.log('Franchise owner dashboard request:', req.user);
    const user = await User.findById(req.user.sub || req.user.sub);
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('User role:', user?.role);
    console.log('Franchise owner info:', user?.roleSpecificData?.franchiseOwnerInfo);
    
    const franchiseId = await getFranchiseIdFromUser(req);
    console.log('Franchise ID:', franchiseId);
    if (!franchiseId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Franchise not found. Please contact your corporate admin to assign you to a franchise.',
        debug: {
          userId: req.user.sub || req.user.sub,
          userRole: user?.role,
          franchiseOwnerInfo: user?.roleSpecificData?.franchiseOwnerInfo
        }
      });
    }

    // Get franchise details
    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json({ success: false, message: 'Franchise not found' });
    }

    // Get stations for this franchise
    const stations = await Station.find({ franchiseId: franchiseId });
    
    // Compute station IDs once
    const stationIds = stations.map(s => s._id);

    // Get recent bookings (latest 10)
    const recentBookings = await Booking.find({ 
      stationId: { $in: stationIds } 
    })
    .populate('stationId', 'name location')
    .populate('userId', 'personalInfo.firstName personalInfo.lastName')
    .sort({ createdAt: -1 })
    .limit(10);

    // Calculate metrics
    const totalStations = stations.length;
    const activeStations = stations.filter(s => s.status === 'active').length;
    const uptime = totalStations > 0 ? (activeStations / totalStations) * 100 : 0;

    // Compute monthly revenue (current calendar month, completed payments only)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = now; // up to now
    const monthBookings = await Booking.find({
      stationId: { $in: stationIds },
      'payment.paymentStatus': 'completed',
      $or: [
        { 'payment.paymentDate': { $gte: monthStart, $lte: monthEnd } },
        { 'payment.paymentDate': { $exists: false } } // fallback to createdAt window below via code
      ]
    }).select('payment pricing createdAt');
    const monthlyRevenue = monthBookings.reduce((sum, b) => {
      const inMonthByCreated = b.createdAt >= monthStart && b.createdAt <= monthEnd;
      const paidDate = b.payment?.paymentDate;
      const inMonth = paidDate ? (paidDate >= monthStart && paidDate <= monthEnd) : inMonthByCreated;
      if (!inMonth) return sum;
      const paid = b.payment?.paidAmount ?? 0;
      const fallback = b.pricing?.actualCost ?? 0;
      return sum + (paid || fallback || 0);
    }, 0);

    // Generate real usage trends data for last 7 days
    const last7Days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayBookings = await Booking.find({
        stationId: { $in: stationIds },
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });
      
      const sessions = dayBookings.length;
      const revenue = dayBookings.reduce((sum, booking) => sum + (booking.payment?.paidAmount || booking.totalAmount || 0), 0);
      
      last7Days.push({
        day: dayNames[date.getDay()],
        sessions,
        revenue: Math.round(revenue)
      });
    }

    // Real station performance data
    const stationPerformance = [
      { name: 'Active', value: stations.filter(s => (s.operational?.status || s.status) === 'active').length },
      { name: 'Maintenance', value: stations.filter(s => (s.operational?.status || s.status) === 'maintenance').length },
      { name: 'Inactive', value: stations.filter(s => (s.operational?.status || s.status) === 'inactive').length }
    ];

    // Generate real revenue analysis for last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayBookings = await Booking.find({
        stationId: { $in: stationIds },
        createdAt: { $gte: dayStart, $lte: dayEnd },
        'payment.paymentStatus': 'completed'
      });
      
      const revenue = dayBookings.reduce((sum, booking) => sum + (booking.payment?.paidAmount || 0), 0);
      
      // Only include days with data to avoid cluttering the chart
      if (i < 5 || revenue > 0) {
        last30Days.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.round(revenue)
        });
      }
    }

    // Sample recent activity
    const recentActivity = recentBookings.map(booking => ({
      station: booking.stationId?.name || 'Unknown Station',
      activity: `Charging session by ${booking.userId?.personalInfo?.firstName || 'User'}`,
      time: new Date(booking.createdAt).toLocaleString(),
      status: booking.status === 'completed' ? 'Success' : 'Pending'
    }));

    // Sample stations data
    const stationsData = stations.map(station => ({
      id: station._id,
      name: station.name,
      location: station.location,
      status: station.status,
      connectors: station.connectors?.length || 0,
      power: station.connectors?.reduce((sum, conn) => sum + (conn.power || 0), 0) || 0,
      manager: station.managerName || 'Unassigned'
    }));

    // Real station managers for this franchise
    const stationManagersDocs = await User.find({
      role: 'station_manager',
      'roleSpecificData.stationManagerInfo.franchiseId': franchiseId
    }).select('personalInfo credentials roleSpecificData.stationManagerInfo');
    
    // Get assigned stations for each manager
    const stationManagers = await Promise.all(stationManagersDocs.map(async (m) => {
      const assignedStationIds = m.roleSpecificData?.stationManagerInfo?.assignedStations || [];
      const assignedStations = await Station.find({
        _id: { $in: assignedStationIds },
        franchiseId: franchiseId
      }).select('name code location.address location.city managerId');

      return {
        id: m._id,
        name: `${m.personalInfo.firstName} ${m.personalInfo.lastName}`.trim(),
        email: m.personalInfo.email,
        phone: m.personalInfo.phone,
        assignedStations: assignedStations.map(station => ({
          id: station._id,
          _id: station._id,
          name: station.name,
          code: station.code,
          address: station.location?.address || station.address || '',
          city: station.location?.city || '',
          managerId: station.managerId
        })),
        assignedStationsCount: assignedStations.length,
        status: m.credentials?.isActive ? 'Active' : 'Inactive'
      };
    }));

    // Sample promotions data
    const promotions = [
      {
        id: '1',
        title: 'Weekend Special',
        description: '20% off on all weekend charging sessions',
        discount: 20,
        status: 'Active',
        validFrom: '2025-01-01',
        validTo: '2025-01-31',
        usageCount: 45
      },
      {
        id: '2',
        title: 'Early Bird Discount',
        description: '15% off for charging between 6 AM - 9 AM',
        discount: 15,
        status: 'Scheduled',
        validFrom: '2025-02-01',
        validTo: '2025-02-28',
        usageCount: 0
      }
    ];

    res.json({
      success: true,
      data: {
        franchise: {
          name: franchise.name,
          status: franchise.status
        },
        totalStations,
        activeSessions: recentBookings.filter(b => b.status === 'active').length,
        monthlyRevenue,
        uptime: Math.round(uptime),
        energyDelivered: Math.round(recentBookings.reduce((sum, b) => sum + (b.energyConsumed || 0), 0)),
        avgSessionDuration: recentBookings.length > 0 ? Math.round(recentBookings.reduce((sum, b) => sum + (b.duration || 0), 0) / recentBookings.length) : 0,
        customerSatisfaction: 92, // This would come from ratings/feedback system
        usageTrends: last7Days,
        stationPerformance,
        revenueAnalysis: last30Days,
        recentActivity,
        stations: stationsData,
        stationManagers,
        promotions
      }
    });
  } catch (error) {
    console.error('Error getting franchise owner dashboard data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const { period = '7d' } = req.query;

    // Get stations for this franchise
    const stations = await Station.find({ franchiseId: franchiseId });
    const stationIds = stations.map(s => s._id);

    // Get bookings based on period
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '1d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
        break;
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      default:
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
    }

    const bookings = await Booking.find({
      stationId: { $in: stationIds },
      ...dateFilter
    });

    // Calculate analytics
    const totalSessions = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    const avgSessionDuration = bookings.length > 0 
      ? bookings.reduce((sum, booking) => sum + (booking.duration || 0), 0) / bookings.length 
      : 0;

    res.json({
      success: true,
      data: {
        period,
        totalSessions,
        totalRevenue,
        avgSessionDuration: Math.round(avgSessionDuration),
        bookings: bookings.map(booking => ({
          id: booking._id,
          stationId: booking.stationId,
          userId: booking.userId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          energyDelivered: booking.energyDelivered,
          totalAmount: booking.totalAmount,
          status: booking.status
        }))
      }
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get stations
export const getStations = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const stations = await Station.find({ franchiseId: franchiseId })
      .populate('managerId', 'personalInfo.firstName personalInfo.lastName personalInfo.email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: stations.map(station => ({
        id: station._id,
        _id: station._id,
        name: station.name,
        code: station.code,
        description: station.description,
        location: station.location,
        capacity: station.capacity,
        pricing: station.pricing,
        operational: station.operational,
        contact: station.contact,
        analytics: station.analytics,
        amenities: station.amenities,
        images: station.images,
        managerId: station.managerId,
        manager: station.managerId ? {
          id: station.managerId._id,
          name: `${station.managerId.personalInfo.firstName} ${station.managerId.personalInfo.lastName}`,
          email: station.managerId.personalInfo.email
        } : null,
        createdAt: station.createdAt,
        updatedAt: station.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error getting stations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Add station
export const addStation = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    // Get corporate ID from franchise
    const Franchise = (await import('../models/franchise.model.js')).default;
    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json({ success: false, message: 'Franchise not found' });
    }

    const {
      name,
      code,
      description,
      address,
      city,
      state,
      country = 'India',
      pincode,
      latitude = 0,
      longitude = 0,
      locationDms,
      dms,
      nearbyLandmarks,
      totalChargers,
      chargerTypes,
      maxPowerPerCharger,
      totalPowerCapacity,
      pricePerMinute,
      cancellationPolicy,
      status = 'active',
      parkingSlots,
      parkingFee = 0,
      is24Hours = true,
      customHours = { start: '00:00', end: '23:59' },
      managerEmail,
      supportPhone,
      supportEmail,
      amenities = [],
      images = []
    } = req.body;

    // Validation
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Station name is required'
      });
    }
    if (!address?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Station address is required'
      });
    }
    if (!city?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'City is required'
      });
    }
    if (!state?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'State is required'
      });
    }
    if (!pincode?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pincode is required'
      });
    }
    if (!totalChargers || totalChargers < 1 || totalChargers > 50) {
      return res.status(400).json({
        success: false,
        message: 'Total chargers must be between 1 and 50'
      });
    }
    if (!chargerTypes || !Array.isArray(chargerTypes) || chargerTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one charger type must be selected'
      });
    }
    if (!maxPowerPerCharger || maxPowerPerCharger < 1 || maxPowerPerCharger > 500) {
      return res.status(400).json({
        success: false,
        message: 'Max power per charger must be between 1 and 500 kW'
      });
    }
    if (!pricePerMinute || pricePerMinute < 1 || pricePerMinute > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Price per minute must be between 1 and 5000'
      });
    }
    if (parkingSlots == null || parkingSlots < 0 || parkingSlots > 30) {
      return res.status(400).json({
        success: false,
        message: 'Parking slots must be between 0 and 30'
      });
    }
    if (parkingFee != null && (parkingFee < 0 || parkingFee > 1000)) {
      return res.status(400).json({
        success: false,
        message: 'Parking fee must be between 0 and 1000'
      });
    }

    // Find manager by email if provided
    let managerId = null;
    if (managerEmail?.trim()) {
      const User = (await import('../models/user.model.js')).default;
      const manager = await User.findOne({ 
        'personalInfo.email': managerEmail.toLowerCase().trim(),
        role: 'station_manager'
      });
      if (manager) {
        managerId = manager._id;
      }
    }

    const stationData = {
      name: name.trim(),
      code: code?.trim() || undefined, // Will be auto-generated if not provided
      description: description?.trim() || '',
      location: {
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        pincode: pincode.trim(),
        dms: (locationDms?.trim() || dms?.trim() || ''),
        coordinates: {
          latitude: parseFloat(latitude) || 0,
          longitude: parseFloat(longitude) || 0
        },
        nearbyLandmarks: nearbyLandmarks?.trim() || ''
      },
      capacity: {
        totalChargers: Math.min(50, Math.max(1, parseInt(totalChargers))),
        chargerTypes: chargerTypes,
        maxPowerPerCharger: Math.min(500, Math.max(1, parseFloat(maxPowerPerCharger))),
        totalPowerCapacity: parseFloat(totalPowerCapacity) || (parseInt(totalChargers) * parseFloat(maxPowerPerCharger))
      },
      pricing: {
        pricePerMinute: Math.min(5000, Math.max(1, parseFloat(pricePerMinute))),
        cancellationPolicy: cancellationPolicy?.trim() || ''
      },
      operational: {
        status: status,
        parkingSlots: Math.min(30, Math.max(0, parseInt(parkingSlots))),
        parkingFee: Math.min(1000, Math.max(0, parseFloat(parkingFee) || 0)),
        operatingHours: {
          is24Hours: Boolean(is24Hours),
          customHours: {
            start: customHours.start || '00:00',
            end: customHours.end || '23:59'
          }
        }
      },
      contact: {
        managerEmail: managerEmail?.trim().toLowerCase() || '',
        supportPhone: supportPhone?.trim() || '',
        supportEmail: supportEmail?.trim().toLowerCase() || ''
      },
      corporateId: franchise.corporateId,
      franchiseId: franchiseId,
      managerId: managerId,
      amenities: Array.isArray(amenities) ? amenities.filter(a => a?.trim()) : [],
      images: Array.isArray(images) ? images.filter(i => i?.trim()) : [],
      createdBy: req.user.sub || req.user.sub
    };

    const station = await Station.create(stationData);

    // Add station to manager's assigned stations if manager was assigned
    if (managerId) {
      console.log('Adding new station to manager assigned stations:', {
        stationId: station._id,
        managerId,
        managerEmail
      });
      
      const User = (await import('../models/user.model.js')).default;
      await User.findByIdAndUpdate(managerId, {
        $addToSet: { 'roleSpecificData.stationManagerInfo.assignedStations': station._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Station added successfully',
      data: {
        id: station._id,
        name: station.name,
        code: station.code,
        location: station.location,
        capacity: station.capacity,
        pricing: station.pricing,
        operational: station.operational,
        contact: station.contact,
        analytics: station.analytics,
        amenities: station.amenities,
        images: station.images,
        createdAt: station.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding station:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Station code already exists'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update station
export const updateStation = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const { stationId } = req.params;
    const {
      name,
      code,
      description,
      address,
      city,
      state,
      country,
      pincode,
      latitude,
      longitude,
      locationDms,
      dms,
      nearbyLandmarks,
      totalChargers,
      chargerTypes,
      maxPowerPerCharger,
      totalPowerCapacity,
      pricePerMinute,
      cancellationPolicy,
      status,
      parkingSlots,
      parkingFee,
      is24Hours,
      customHours,
      managerEmail,
      supportPhone,
      supportEmail,
      amenities,
      images
    } = req.body;

    // Verify station belongs to this franchise
    const station = await Station.findOne({ _id: stationId, franchiseId: franchiseId });
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    // Build update data object
    const updateData = {
      updatedBy: req.user.sub || req.user.sub
    };

    // Update basic info
    if (name?.trim()) updateData.name = name.trim();
    if (code?.trim()) updateData.code = code.trim();
    if (description !== undefined) updateData.description = description?.trim() || '';

    // Update location
    if (address || city || state || country || pincode || latitude !== undefined || longitude !== undefined || nearbyLandmarks !== undefined || locationDms !== undefined || dms !== undefined) {
      updateData.location = {
        ...station.location,
        ...(address?.trim() && { address: address.trim() }),
        ...(city?.trim() && { city: city.trim() }),
        ...(state?.trim() && { state: state.trim() }),
        ...(country?.trim() && { country: country.trim() }),
        ...(pincode?.trim() && { pincode: pincode.trim() }),
        ...((locationDms !== undefined || dms !== undefined) && { dms: (locationDms?.trim() || dms?.trim() || '') }),
        ...(latitude !== undefined && longitude !== undefined && {
          coordinates: {
            latitude: parseFloat(latitude) || 0,
            longitude: parseFloat(longitude) || 0
          }
        }),
        ...(nearbyLandmarks !== undefined && { nearbyLandmarks: nearbyLandmarks?.trim() || '' })
      };
    }

    // Update capacity
    if (totalChargers || chargerTypes || maxPowerPerCharger !== undefined || totalPowerCapacity !== undefined) {
      updateData.capacity = {
        ...station.capacity,
        ...(totalChargers && { totalChargers: parseInt(totalChargers) }),
        ...(chargerTypes && { chargerTypes: chargerTypes }),
        ...(maxPowerPerCharger !== undefined && { maxPowerPerCharger: parseFloat(maxPowerPerCharger) }),
        ...(totalPowerCapacity !== undefined && { totalPowerCapacity: parseFloat(totalPowerCapacity) })
      };
      
      // Recalculate available slots if total chargers changed
      if (totalChargers) {
        updateData.capacity.availableSlots = parseInt(totalChargers);
      }
    }

    // Update pricing (only per-minute supported)
    if (pricePerMinute !== undefined || cancellationPolicy !== undefined) {
      const pricingUpdate = { ...station.pricing };
      if (pricePerMinute !== undefined) pricingUpdate.pricePerMinute = Math.min(5000, Math.max(1, parseFloat(pricePerMinute)));
      if (cancellationPolicy !== undefined) pricingUpdate.cancellationPolicy = cancellationPolicy?.trim() || '';
      updateData.pricing = pricingUpdate;
    }

    // Update operational details
    if (status || parkingSlots || parkingFee !== undefined || is24Hours !== undefined || customHours) {
      updateData.operational = {
        ...station.operational,
        ...(status && { status: status }),
        ...(parkingSlots && { parkingSlots: parseInt(parkingSlots) }),
        ...(parkingFee !== undefined && { parkingFee: parseFloat(parkingFee) || 0 }),
        ...(is24Hours !== undefined && customHours && {
          operatingHours: {
            is24Hours: Boolean(is24Hours),
            customHours: {
              start: customHours.start || '00:00',
              end: customHours.end || '23:59'
            }
          }
        })
      };
      
      // Also update the main status field for consistency
      if (status) {
        updateData.status = status;
      }
    }

    // Update contact info
    if (managerEmail !== undefined || supportPhone !== undefined || supportEmail !== undefined) {
      updateData.contact = {
        ...station.contact,
        ...(managerEmail !== undefined && { managerEmail: managerEmail?.trim().toLowerCase() || '' }),
        ...(supportPhone !== undefined && { supportPhone: supportPhone?.trim() || '' }),
        ...(supportEmail !== undefined && { supportEmail: supportEmail?.trim().toLowerCase() || '' })
      };
    }

    // Update manager if email provided
    let newManagerId = null;
    if (managerEmail?.trim()) {
      const User = (await import('../models/user.model.js')).default;
      const manager = await User.findOne({ 
        'personalInfo.email': managerEmail.toLowerCase().trim(),
        role: 'station_manager'
      });
      newManagerId = manager ? manager._id : null;
      updateData.managerId = newManagerId;
    }

    // Update amenities and images
    if (amenities !== undefined) {
      updateData.amenities = Array.isArray(amenities) ? amenities.filter(a => a?.trim()) : [];
    }
    if (images !== undefined) {
      updateData.images = Array.isArray(images) ? images.filter(i => i?.trim()) : [];
    }

    // Handle manager assignment changes
    if (managerEmail !== undefined) {
      const User = (await import('../models/user.model.js')).default;
      console.log('Updating station manager assignment:', {
        stationId,
        previousManagerId: station.managerId,
        newManagerId,
        managerEmail
      });
      
      // Remove station from previous manager's assigned stations if any
      if (station.managerId) {
        console.log('Removing station from previous manager:', station.managerId);
        await User.findByIdAndUpdate(station.managerId, {
          $pull: { 'roleSpecificData.stationManagerInfo.assignedStations': stationId }
        });
      }
      
      // Add station to new manager's assigned stations if assigned
      if (newManagerId) {
        console.log('Adding station to new manager:', newManagerId);
        await User.findByIdAndUpdate(newManagerId, {
          $addToSet: { 'roleSpecificData.stationManagerInfo.assignedStations': stationId }
        });
      }
    }

    const updatedStation = await Station.findByIdAndUpdate(
      stationId,
      updateData,
      { new: true, runValidators: true }
    ).populate('managerId', 'personalInfo.firstName personalInfo.lastName personalInfo.email');

    res.json({
      success: true,
      message: 'Station updated successfully',
      data: {
        id: updatedStation._id,
        name: updatedStation.name,
        code: updatedStation.code,
        description: updatedStation.description,
        location: updatedStation.location,
        capacity: updatedStation.capacity,
        pricing: updatedStation.pricing,
        operational: updatedStation.operational,
        contact: updatedStation.contact,
        analytics: updatedStation.analytics,
        amenities: updatedStation.amenities,
        images: updatedStation.images,
        manager: updatedStation.managerId ? {
          id: updatedStation.managerId._id,
          name: `${updatedStation.managerId.personalInfo.firstName} ${updatedStation.managerId.personalInfo.lastName}`,
          email: updatedStation.managerId.personalInfo.email
        } : null,
        updatedAt: updatedStation.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating station:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Station code already exists'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete station
export const deleteStation = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const { stationId } = req.params;

    // Verify station belongs to this franchise
    const station = await Station.findOne({ _id: stationId, franchiseId: franchiseId });
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    await Station.findByIdAndDelete(stationId);

    res.json({
      success: true,
      message: 'Station deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// =========================
// Station Manager Management
// =========================

// Get station managers for this franchise
export const getStationManagers = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const managers = await User.find({
      role: 'station_manager',
      'roleSpecificData.stationManagerInfo.franchiseId': franchiseId
    }).select('personalInfo roleSpecificData.stationManagerInfo');

    // Get station details for assigned stations
    const stationIds = managers.flatMap(m => m.roleSpecificData?.stationManagerInfo?.assignedStations || []);
    const stations = await Station.find({ _id: { $in: stationIds } }).select('name _id');
    const stationMap = new Map(stations.map(s => [s._id.toString(), s]));

    res.json({
      success: true,
      data: managers.map(m => {
        const assignedStations = m.roleSpecificData?.stationManagerInfo?.assignedStations || [];
        const stationDetails = assignedStations.map(id => stationMap.get(id.toString())).filter(Boolean);
        
        return {
          id: m._id,
          firstName: m.personalInfo.firstName,
          lastName: m.personalInfo.lastName,
          email: m.personalInfo.email,
          phone: m.personalInfo.phone,
          assignedStations: stationDetails,
          assignedStation: stationDetails[0]?.name || 'Unassigned',
          stationId: stationDetails[0]?._id || null,
          status: m.credentials?.isActive ? 'Active' : 'Inactive'
        };
      })
    });
  } catch (error) {
    console.error('Error getting station managers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Add a new station manager under this franchise
export const addStationManager = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const { firstName, lastName, email, phone } = req.body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'First name, last name, email and phone are required' });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(phoneDigits)) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    const existing = await User.findOne({ 'personalInfo.email': email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const manager = await User.create({
      role: 'station_manager',
      personalInfo: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phoneDigits
      },
      credentials: {
        passwordHash,
        isActive: true,
        mustChangePassword: true
      },
      roleSpecificData: {
        stationManagerInfo: {
          franchiseId,
          assignedStations: [],
          commissionRate: 0
        }
      }
    });

    // Send station manager welcome email
    try {
      const { sendStationManagerWelcomeEmail } = await import('../utils/emailService.js');
      const franchise = await Franchise.findById(franchiseId);
      await sendStationManagerWelcomeEmail({
        managerName: `${firstName} ${lastName}`.trim(),
        managerEmail: email.trim().toLowerCase(),
        tempPassword,
        franchiseName: franchise?.name || 'Your Franchise'
      });
    } catch (e) {
      console.warn('Email send skipped/failed for station manager:', e?.message || e);
    }

    res.status(201).json({
      success: true,
      message: 'Station manager created successfully',
      data: { id: manager._id }
    });
  } catch (error) {
    console.error('Error adding station manager:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update station manager basic info and assignment
export const updateStationManager = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }
    const { managerId } = req.params;
    const { firstName, lastName, phone, isActive } = req.body;

    const update = {};
    if (firstName) update['personalInfo.firstName'] = firstName.trim();
    if (lastName) update['personalInfo.lastName'] = lastName.trim();
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (!/^\d{10}$/.test(digits)) {
        return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
      }
      update['personalInfo.phone'] = digits;
    }
    if (isActive !== undefined) update['credentials.isActive'] = Boolean(isActive);

    const manager = await User.findOneAndUpdate(
      { _id: managerId, role: 'station_manager', 'roleSpecificData.stationManagerInfo.franchiseId': franchiseId },
      update,
      { new: true }
    );
    if (!manager) return res.status(404).json({ success: false, message: 'Station manager not found' });

    res.json({ success: true, message: 'Station manager updated', data: { id: manager._id } });
  } catch (error) {
    console.error('Error updating station manager:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete station manager
export const deleteStationManager = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }
    const { managerId } = req.params;

    const manager = await User.findOneAndDelete({
      _id: managerId,
      role: 'station_manager',
      'roleSpecificData.stationManagerInfo.franchiseId': franchiseId
    });
    if (!manager) return res.status(404).json({ success: false, message: 'Station manager not found' });

    // Unassign this manager from stations, if any
    await Station.updateMany({ managerId: managerId }, { $set: { managerId: null, 'contact.managerEmail': '' } });

    res.json({ success: true, message: 'Station manager removed' });
  } catch (error) {
    console.error('Error deleting station manager:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get compliance status
export const getComplianceStatus = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    // Sample compliance data
    const complianceData = {
      safetyInspections: { status: 'compliant', lastCheck: '2025-01-15', nextDue: '2025-02-15' },
      environmentalStandards: { status: 'compliant', lastCheck: '2025-01-10', nextDue: '2025-02-10' },
      operationalGuidelines: { status: 'pending', lastCheck: '2025-01-05', nextDue: '2025-01-20' },
      maintenanceRecords: { status: 'compliant', lastCheck: '2025-01-12', nextDue: '2025-02-12' }
    };

    res.json({
      success: true,
      data: complianceData
    });
  } catch (error) {
    console.error('Error getting compliance status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get promotions
export const getPromotions = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    // Sample promotions data (in real app, this would come from a promotions collection)
    const promotions = [
      {
        id: '1',
        title: 'Weekend Special',
        description: '20% off on all weekend charging sessions',
        discount: 20,
        status: 'Active',
        validFrom: '2025-01-01',
        validTo: '2025-01-31',
        usageCount: 45
      },
      {
        id: '2',
        title: 'Early Bird Discount',
        description: '15% off for charging between 6 AM - 9 AM',
        discount: 15,
        status: 'Scheduled',
        validFrom: '2025-02-01',
        validTo: '2025-02-28',
        usageCount: 0
      }
    ];

    res.json({
      success: true,
      data: promotions
    });
  } catch (error) {
    console.error('Error getting promotions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create promotion
export const createPromotion = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const {
      title,
      description,
      discount,
      validFrom,
      validTo,
      status = 'active'
    } = req.body;

    // Validation
    if (!title || !description || !discount || !validFrom || !validTo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, discount, validFrom, validTo'
      });
    }

    // In a real app, you would save this to a promotions collection
    const promotion = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      discount: Number(discount),
      status: status,
      validFrom: validFrom,
      validTo: validTo,
      usageCount: 0,
      franchiseId: franchiseId
    };

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: promotion
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update promotion
export const updatePromotion = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const { promotionId } = req.params;
    const updateData = req.body;

    // In a real app, you would update the promotion in the database
    res.json({
      success: true,
      message: 'Promotion updated successfully',
      data: { id: promotionId, ...updateData }
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete promotion
export const deletePromotion = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const { promotionId } = req.params;

    // In a real app, you would delete the promotion from the database
    res.json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.credentials.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.findByIdAndUpdate(req.user.sub, {
      'credentials.passwordHash': hashedNewPassword,
      'credentials.mustChangePassword': false
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, city, state, pincode } = req.body;

    const updateData = {};
    if (firstName) updateData['personalInfo.firstName'] = firstName.trim();
    if (lastName) updateData['personalInfo.lastName'] = lastName.trim();
    if (phone) updateData['personalInfo.phone'] = phone.replace(/\D/g, '');
    if (address) updateData['personalInfo.address'] = address.trim();
    if (city) updateData['personalInfo.city'] = city.trim();
    if (state) updateData['personalInfo.state'] = state.trim();
    if (pincode) updateData['personalInfo.pincode'] = pincode.trim();

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        personalInfo: user.personalInfo
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Assign station to manager
export const assignStationToManager = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const { managerId, stationId } = req.body;
    console.log('Assigning station:', stationId, 'to manager:', managerId);

    // Validate inputs
    if (!managerId || !stationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Manager ID and Station ID are required' 
      });
    }

    // Find the manager and verify they belong to this franchise
    const manager = await User.findOne({
      _id: managerId,
      role: 'station_manager',
      'roleSpecificData.stationManagerInfo.franchiseId': franchiseId
    });

    if (!manager) {
      return res.status(404).json({ success: false, message: 'Station manager not found' });
    }

    // Find the station and verify it belongs to this franchise
    const station = await Station.findOne({
      _id: stationId,
      franchiseId: franchiseId
    });

    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    console.log('Current station managerId:', station.managerId);

    // Check if station is already assigned to another manager
    if (station.managerId && station.managerId.toString() !== managerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Station is already assigned to another manager' 
      });
    }

    // Unassign station from current manager if any
    if (station.managerId) {
      await User.findByIdAndUpdate(station.managerId, {
        $pull: { 'roleSpecificData.stationManagerInfo.assignedStations': stationId }
      });
    }

    // Assign station to new manager
    await Station.findByIdAndUpdate(stationId, { managerId: managerId });

    // Add station to manager's assigned stations
    await User.findByIdAndUpdate(managerId, {
      $addToSet: { 'roleSpecificData.stationManagerInfo.assignedStations': stationId }
    });

    console.log('Station assigned successfully');
    res.json({ success: true, message: 'Station assigned to manager successfully' });
  } catch (error) {
    console.error('Error assigning station to manager:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Unassign station from manager
export const unassignStationFromManager = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const { managerId, stationId } = req.body;
    console.log('Unassigning station:', stationId, 'from manager:', managerId);

    // Validate inputs
    if (!managerId || !stationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Manager ID and Station ID are required' 
      });
    }

    // Find the manager and verify they belong to this franchise
    const manager = await User.findOne({
      _id: managerId,
      role: 'station_manager',
      'roleSpecificData.stationManagerInfo.franchiseId': franchiseId
    });

    if (!manager) {
      return res.status(404).json({ success: false, message: 'Station manager not found' });
    }

    // Find the station and verify it belongs to this franchise
    const station = await Station.findOne({
      _id: stationId,
      franchiseId: franchiseId
    });

    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    console.log('Current station managerId:', station.managerId);

    // Unassign station from manager
    await Station.findByIdAndUpdate(stationId, { $unset: { managerId: 1 } });

    // Remove station from manager's assigned stations
    await User.findByIdAndUpdate(managerId, {
      $pull: { 'roleSpecificData.stationManagerInfo.assignedStations': stationId }
    });

    console.log('Station unassigned successfully');
    res.json({ success: true, message: 'Station unassigned from manager successfully' });
  } catch (error) {
    console.error('Error unassigning station from manager:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get available station managers for assignment
export const getAvailableStationManagers = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    const managers = await User.find({
      role: 'station_manager',
      'roleSpecificData.stationManagerInfo.franchiseId': franchiseId
    }).select('personalInfo.firstName personalInfo.lastName personalInfo.email roleSpecificData.stationManagerInfo.assignedStations');

    res.json({ success: true, data: managers });
  } catch (error) {
    console.error('Error getting available station managers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get unassigned stations
export const getUnassignedStations = async (req, res) => {
  try {
    const franchiseId = await getFranchiseIdFromUser(req);
    if (!franchiseId) {
      return res.status(403).json({ success: false, message: 'Franchise not found' });
    }

    console.log('Getting unassigned stations for franchise:', franchiseId);
    
    const stations = await Station.find({
      franchiseId: franchiseId,
      $or: [
        { managerId: { $exists: false } },
        { managerId: null }
      ]
    }).select('name code location.address location.city');

    console.log('Found unassigned stations:', stations.length);
    console.log('Unassigned stations data:', stations);

    res.json({ success: true, data: stations });
  } catch (error) {
    console.error('Error getting unassigned stations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

