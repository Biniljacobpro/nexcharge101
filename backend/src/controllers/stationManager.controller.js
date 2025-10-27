import Station from '../models/station.model.js';
import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import path from 'path';
import fs from 'fs';

// Get dashboard data for station manager
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    // Get user's assigned stations
    const user = await User.findById(userId).populate('roleSpecificData.stationManagerInfo.assignedStations');
    const assignedStations = user?.roleSpecificData?.stationManagerInfo?.assignedStations || [];
    
    if (assignedStations.length === 0) {
      return res.json({
        success: true,
        data: {
          stationInfo: {
            totalStations: 0,
            availableSlots: 0,
            totalSlots: 0,
            uptime: 0,
            utilizationRate: 0,
            monthlyRevenue: 0
          },
          assignedStations: [],
          todayBookings: [],
          recentBookings: [],
          maintenanceSchedule: [],
          performanceMetrics: {
            utilizationRate: 0,
            averageRating: 0,
            totalSessions: 0,
            monthlyRevenue: 0
          },
          recentFeedback: []
        }
      });
    }

    const stationIds = assignedStations.map(station => station._id);
    
    // Get station details
    const stations = await Station.find({ _id: { $in: stationIds } });
    
    // Calculate station info
    const totalSlots = stations.reduce((sum, station) => sum + (station.capacity?.totalChargers || 0), 0);
    const availableSlots = stations.reduce((sum, station) => {
      const available = station.capacity?.chargers?.filter(c => c.isAvailable).length || 0;
      return sum + available;
    }, 0);
    
    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayBookings = await Booking.find({
      station: { $in: stationIds },
      startTime: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'pending'] }
    }).populate('user', 'personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone')
      .populate('station', 'name location.address')
      .sort({ startTime: 1 });

    // Get recent bookings (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentBookings = await Booking.find({
      station: { $in: stationIds },
      startTime: { $gte: weekAgo },
      status: { $in: ['confirmed', 'completed', 'cancelled'] }
    }).populate('user', 'personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone')
      .populate('station', 'name location.address')
      .sort({ startTime: -1 })
      .limit(10);

    // Mock maintenance schedule (you can implement real maintenance tracking)
    const maintenanceSchedule = [
      {
        id: '1',
        type: 'Routine Inspection',
        station: stations[0]?.name || 'Station 1',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: '2 hours',
        status: 'scheduled',
        description: 'Monthly routine inspection of charging equipment'
      },
      {
        id: '2',
        type: 'Software Update',
        station: stations[0]?.name || 'Station 1',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        duration: '1 hour',
        status: 'scheduled',
        description: 'Update charging station software to latest version'
      }
    ];

    // Calculate performance metrics
    const totalBookings = await Booking.countDocuments({
      station: { $in: stationIds },
      status: 'completed'
    });
    
    const utilizationRate = totalSlots > 0 ? ((totalSlots - availableSlots) / totalSlots * 100).toFixed(1) : 0;
    const monthlyRevenue = totalBookings * 150; // Mock calculation: ₹150 per booking

    // Mock recent feedback
    const recentFeedback = [
      {
        id: '1',
        user: 'John Doe',
        station: stations[0]?.name || 'Station 1',
        rating: 4.5,
        comment: 'Great charging experience, fast and reliable.',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        id: '2',
        user: 'Sarah Wilson',
        station: stations[0]?.name || 'Station 1',
        rating: 5.0,
        comment: 'Excellent service, will definitely come back!',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'responded'
      }
    ];

    // Get maintenance predictions for assigned stations
    const maintenancePredictions = await Station.find({
      _id: { $in: stationIds },
      latestRiskClassification: { $in: ['Medium', 'High'] }
    })
    .sort({
      latestRiskClassification: -1, // High first, then Medium
      lastPredictionDate: 1         // Oldest predictions first
    })
    .select('_id name code latestRiskClassification lastPredictionDate location');

    res.json({
      success: true,
      data: {
        stationInfo: {
          totalStations: stations.length,
          availableSlots,
          totalSlots,
          uptime: 98.5, // Mock uptime percentage
          utilizationRate: parseFloat(utilizationRate),
          monthlyRevenue
        },
        assignedStations: stations.map(station => ({
          id: station._id,
          name: station.name,
          code: station.code,
          description: station.description,
          location: {
            address: station.location?.address || 'N/A',
            city: station.location?.city || 'N/A',
            state: station.location?.state || 'N/A',
            pincode: station.location?.pincode || 'N/A',
            coordinates: station.location?.coordinates || null
          },
          status: station.operational?.isActive ? 'active' : 'inactive',
          totalChargers: station.capacity?.totalChargers || 0,
          availableChargers: station.capacity?.chargers?.filter(c => c.isAvailable).length || 0,
          chargerTypes: station.capacity?.chargerTypes || [],
          chargers: station.capacity?.chargers || [],
          basePrice: station.pricing?.basePricePerKwh || 0,
          pricing: station.pricing || {},
          amenities: station.amenities || [],
          contact: station.contact || {},
          operational: station.operational || {},
          analytics: station.analytics || {},
          images: station.images || [],
          createdAt: station.createdAt,
          updatedAt: station.updatedAt
        })),
        todayBookings: todayBookings.map(booking => ({
          id: booking._id,
          user: `${booking.user?.personalInfo?.firstName || ''} ${booking.user?.personalInfo?.lastName || ''}`.trim(),
          email: booking.user?.personalInfo?.email || '',
          phone: booking.user?.personalInfo?.phone || '',
          station: booking.station?.name || '',
          chargerType: booking.chargerType,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          vehicleMake: booking.vehicleInfo?.make || '',
          vehicleModel: booking.vehicleInfo?.model || ''
        })),
        recentBookings: recentBookings.map(booking => ({
          id: booking._id,
          user: `${booking.user?.personalInfo?.firstName || ''} ${booking.user?.personalInfo?.lastName || ''}`.trim(),
          email: booking.user?.personalInfo?.email || '',
          phone: booking.user?.personalInfo?.phone || '',
          station: booking.station?.name || '',
          chargerType: booking.chargerType,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          vehicleMake: booking.vehicleInfo?.make || '',
          vehicleModel: booking.vehicleInfo?.model || ''
        })),
        maintenanceSchedule,
        maintenancePredictions: maintenancePredictions.map(station => ({
          id: station._id,
          name: station.name,
          code: station.code,
          latestRiskClassification: station.latestRiskClassification,
          lastPredictionDate: station.lastPredictionDate,
          location: station.location
        })),
        performanceMetrics: {
          utilizationRate: parseFloat(utilizationRate),
          averageRating: 4.3, // Mock average rating
          totalSessions: totalBookings,
          monthlyRevenue
        },
        recentFeedback
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Delete a station image (only if assigned)
export const deleteStationImage = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;
    const { url } = req.body || {};

    if (!url) return res.status(400).json({ success: false, message: 'Image url is required' });

    const user = await User.findById(userId);
    const assigned = user?.roleSpecificData?.stationManagerInfo?.assignedStations || [];
    // Convert both to strings for comparison
    const assignedIds = assigned.map(String);
    const stationId = String(id);
    if (!assignedIds.includes(stationId)) {
      return res.status(403).json({ success: false, message: 'Access denied to this station' });
    }

    const station = await Station.findById(id);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    const before = station.images?.length || 0;
    station.images = (station.images || []).filter((u) => u !== url);
    const after = station.images.length;
    await station.save();

    // Try to remove file from disk if it is inside uploads
    try {
      if (url.startsWith('/uploads/')) {
        const filePath = path.resolve(process.cwd(), url.slice(1));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (e) {
      // ignore file deletion errors
      console.warn('Failed to delete file:', e.message);
    }

    return res.json({ success: true, message: 'Image deleted', removed: before - after, images: station.images });
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete image', error: error.message });
  }
};

// Get bookings for assigned stations
export const getBookings = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { status, date } = req.query;
    
    // Get user's assigned stations
    const user = await User.findById(userId);
    const assignedStations = user?.roleSpecificData?.stationManagerInfo?.assignedStations || [];
    
    if (assignedStations.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const query = { station: { $in: assignedStations } };
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.startTime = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone')
      .populate('station', 'name location.address')
      .sort({ startTime: -1 });

    res.json({
      success: true,
      data: bookings.map(booking => ({
        id: booking._id,
        user: `${booking.user?.personalInfo?.firstName || ''} ${booking.user?.personalInfo?.lastName || ''}`.trim(),
        email: booking.user?.personalInfo?.email || '',
        phone: booking.user?.personalInfo?.phone || '',
        station: booking.station?.name || '',
        chargerType: booking.chargerType,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        vehicleMake: booking.vehicleInfo?.make || '',
        vehicleModel: booking.vehicleInfo?.model || ''
      }))
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if station manager has access to this booking's station
    const userId = req.user.sub;
    const user = await User.findById(userId);
    const assignedStations = user?.roleSpecificData?.stationManagerInfo?.assignedStations || [];
    
    if (!assignedStations.includes(booking.station)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this booking'
      });
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        id: booking._id,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

// Get performance reports
export const getReports = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    // Get user's assigned stations
    const user = await User.findById(userId);
    const assignedStations = user?.roleSpecificData?.stationManagerInfo?.assignedStations || [];
    
    if (assignedStations.length === 0) {
      return res.json({
        success: true,
        data: {
          utilizationRate: 0,
          averageRating: 0,
          totalSessions: 0,
          monthlyRevenue: 0
        }
      });
    }

    // Calculate metrics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalBookings = await Booking.countDocuments({
      station: { $in: assignedStations },
      startTime: { $gte: thirtyDaysAgo },
      status: 'completed'
    });

    const monthlyRevenue = totalBookings * 150; // Mock calculation

    res.json({
      success: true,
      data: {
        utilizationRate: 75.5, // Mock data
        averageRating: 4.3, // Mock data
        totalSessions: totalBookings,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Placeholder functions for future implementation
export const getMaintenanceSchedule = async (req, res) => {
  res.json({
    success: true,
    data: []
  });
};

export const createMaintenanceTask = async (req, res) => {
  res.json({
    success: true,
    message: 'Maintenance task created successfully'
  });
};

export const updateMaintenanceTask = async (req, res) => {
  res.json({
    success: true,
    message: 'Maintenance task updated successfully'
  });
};

export const getFeedback = async (req, res) => {
  res.json({
    success: true,
    data: []
  });
};

export const respondToFeedback = async (req, res) => {
  res.json({
    success: true,
    message: 'Feedback response submitted successfully'
  });
};

// Get single station details (only if assigned to manager)
export const getStationDetails = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;

    const user = await User.findById(userId);
    const assigned = user?.roleSpecificData?.stationManagerInfo?.assignedStations || [];
    // Convert both to strings for comparison
    const assignedIds = assigned.map(String);
    const stationId = String(id);
    if (!assignedIds.includes(stationId)) {
      return res.status(403).json({ success: false, message: 'Access denied to this station' });
    }

    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    console.log('Station images from database:', station.images);

    return res.json({ success: true, data: station });
  } catch (error) {
    console.error('Error fetching station details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch station details', error: error.message });
  }
};

// Update station details (only allowed fields, and only if assigned)
export const updateStationDetails = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;
    const updates = req.body || {};

    const user = await User.findById(userId);
    const assigned = user?.roleSpecificData?.stationManagerInfo?.assignedStations || [];
    // Convert both to strings for comparison
    const assignedIds = assigned.map(String);
    const stationId = String(id);
    if (!assignedIds.includes(stationId)) {
      return res.status(403).json({ success: false, message: 'Access denied to this station' });
    }

    // Whitelist updatable paths
    const allowedPaths = [
      'name',
      'description',
      'location.address', 'location.city', 'location.state', 'location.pincode', 'location.nearbyLandmarks',
      'capacity.totalChargers', 'capacity.chargerTypes', 'capacity.maxPowerPerCharger',
      'pricing.model', 'pricing.basePrice', 'pricing.cancellationPolicy',
      'operational.status', 'operational.parkingSlots', 'operational.parkingFee', 'operational.operatingHours.is24Hours', 'operational.operatingHours.customHours.start', 'operational.operatingHours.customHours.end',
      'amenities'
    ];

    const applyUpdates = (doc, pathStr, value) => {
      const keys = pathStr.split('.');
      let cur = doc;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (cur[k] == null) cur[k] = {};
        cur = cur[k];
      }
      cur[keys[keys.length - 1]] = value;
    };

    const station = await Station.findById(id);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    Object.entries(updates).forEach(([key, val]) => {
      if (allowedPaths.includes(key)) {
        applyUpdates(station, key, val);
      }
    });

    station.updatedBy = userId;
    await station.save();

    return res.json({ success: true, message: 'Station updated successfully', data: station });
  } catch (error) {
    console.error('Error updating station:', error);
    return res.status(500).json({ success: false, message: 'Failed to update station', error: error.message });
  }
};

// Upload station images (only if assigned)
export const uploadStationImages = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;

    const user = await User.findById(userId);
    const assigned = user?.roleSpecificData?.stationManagerInfo?.assignedStations || [];
    // Convert both to strings for comparison
    const assignedIds = assigned.map(String);
    const stationId = String(id);
    if (!assignedIds.includes(stationId)) {
      return res.status(403).json({ success: false, message: 'Access denied to this station' });
    }

    const station = await Station.findById(id);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    // Debug logging
    console.log('Upload request files:', JSON.stringify(req.files, null, 2));

    // Process uploaded files - handle both Cloudinary and local storage
    let files = [];
    if (req.files && Array.isArray(req.files)) {
      // Handle array of files
      files = req.files.map(f => {
        console.log('Processing file (array):', JSON.stringify(f, null, 2));
        // If it's a Cloudinary URL, use it directly
        if (f.path && (f.path.startsWith('http://') || f.path.startsWith('https://'))) {
          console.log('Detected Cloudinary URL:', f.path);
          console.log('Path length:', f.path.length);
          console.log('First 50 characters:', f.path.substring(0, 50));
          return f.path;
        }
        // Otherwise, it's a local file path
        console.log('Detected local file, constructing path from:', f.path);
        return `/${f.path.replace(/\\/g, '/')}`;
      });
    } else if (req.files && req.files.images && Array.isArray(req.files.images)) {
      // Handle multer.fields format
      files = req.files.images.map(f => {
        console.log('Processing file (images):', JSON.stringify(f, null, 2));
        // Check if it's a Cloudinary URL (starts with http/https)
        if (f.path && (f.path.startsWith('http://') || f.path.startsWith('https://'))) {
          console.log('Detected Cloudinary URL:', f.path);
          console.log('Path length:', f.path.length);
          console.log('First 50 characters:', f.path.substring(0, 50));
          return f.path;
        }
        // For local storage, multer gives us filename, not path
        if (f.filename) {
          console.log('Detected local file, constructing path from filename:', f.filename);
          return `/uploads/${f.filename}`;
        }
        // Fallback
        console.log('Fallback, constructing path from:', f.path);
        return `/${f.path.replace(/\\/g, '/')}`;
      });
    }

    console.log('Processed files to store:', files);

    // Additional debugging to check if files already have the API origin prefix
    const processedFiles = files.map(file => {
      console.log('Processing file for storage:', file);
      // If the file already starts with the API origin, remove it
      const apiOrigin = process.env.API_BASE || 'http://localhost:4000';
      console.log('API Origin:', apiOrigin);
      if (file.startsWith(apiOrigin)) {
        const correctedPath = file.substring(apiOrigin.length);
        console.log('Corrected file path from', file, 'to', correctedPath);
        return correctedPath;
      }
      // Also check if it's already an absolute URL
      if (file.startsWith('http://') || file.startsWith('https://')) {
        console.log('File is already an absolute URL:', file);
        return file;
      }
      return file;
    });

    station.images = [...(station.images || []), ...processedFiles];
    station.updatedBy = userId;
    await station.save();

    console.log('Final station images array:', station.images);

    return res.json({ success: true, message: 'Images uploaded successfully', data: station.images });
  } catch (error) {
    console.error('Error uploading images:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload images', error: error.message });
  }
};
