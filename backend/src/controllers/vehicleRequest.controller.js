import VehicleRequest from '../models/vehicleRequest.model.js';
import User from '../models/user.model.js';

// Helper to get user ID from request
const getUserId = (req) => req.user.sub || req.user.id;

// POST /api/vehicle-requests - Create a new vehicle request (user only)
export const createVehicleRequest = async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const { make, model } = req.body;
    
    // Validate required fields
    if (!make || !make.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Make is required' 
      });
    }
    
    if (!model || !model.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Model is required' 
      });
    }
    
    // Check if a request for the same make/model already exists for this user
    const existingRequest = await VehicleRequest.findOne({
      userId,
      make: make.trim(),
      model: model.trim()
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already requested this vehicle' 
      });
    }
    
    const vehicleRequest = new VehicleRequest({
      make: make.trim(),
      model: model.trim(),
      userId,
      userEmail: user.personalInfo.email
    });
    
    await vehicleRequest.save();
    
    // Create admin action notification for the new vehicle request
    try {
      const { createAdminActionNotification } = await import('./notification.controller.js');
      await createAdminActionNotification(userId, 'vehicle_request_submitted', {
        make: vehicleRequest.make,
        model: vehicleRequest.model,
        userEmail: vehicleRequest.userEmail
      });
    } catch (notificationError) {
      console.error('Failed to create vehicle request notification:', notificationError);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Vehicle request submitted successfully', 
      data: vehicleRequest 
    });
  } catch (error) {
    console.error('Error creating vehicle request:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/vehicle-requests - Get all vehicle requests (admin only)
export const getAllVehicleRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    const requests = await VehicleRequest.find(query)
      .populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await VehicleRequest.countDocuments(query);
    
    res.json({
      success: true,
      data: requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle requests:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /api/vehicle-requests/:id - Update vehicle request status (admin only)
export const updateVehicleRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate status
    if (!['pending', 'approved', 'rejected', 'added'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be pending, approved, rejected, or added' 
      });
    }
    
    const vehicleRequest = await VehicleRequest.findById(id);
    if (!vehicleRequest) {
      return res.status(404).json({ success: false, message: 'Vehicle request not found' });
    }
    
    const oldStatus = vehicleRequest.status;
    vehicleRequest.status = status;
    if (notes !== undefined) {
      vehicleRequest.notes = notes;
    }
    
    await vehicleRequest.save();
    
    // Create admin action notification for status change
    try {
      const adminUserId = req.user.sub || req.user.id;
      const { createAdminActionNotification } = await import('./notification.controller.js');
      await createAdminActionNotification(adminUserId, 'vehicle_request_status_changed', {
        make: vehicleRequest.make,
        model: vehicleRequest.model,
        userEmail: vehicleRequest.userEmail,
        oldStatus,
        newStatus: status
      });
    } catch (notificationError) {
      console.error('Failed to create vehicle request status change notification:', notificationError);
    }
    
    res.json({ 
      success: true, 
      message: `Vehicle request ${status} successfully`, 
      data: vehicleRequest 
    });
  } catch (error) {
    console.error('Error updating vehicle request:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /api/vehicle-requests/:id - Delete vehicle request (admin only)
export const deleteVehicleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicleRequest = await VehicleRequest.findById(id);
    if (!vehicleRequest) {
      return res.status(404).json({ success: false, message: 'Vehicle request not found' });
    }
    
    await VehicleRequest.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'Vehicle request deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting vehicle request:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};