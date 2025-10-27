import Vehicle from '../models/vehicle.model.js';
import User from '../models/user.model.js';

// Helper to get user ID from request
const getUserId = (req) => req.user.sub || req.user.id;

// GET /api/vehicles - Get all vehicles (admin only)
export const getAllVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, vehicleType, isActive } = req.query;
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    // Vehicle type filter
    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const vehicles = await Vehicle.find(query)
      .populate('compatibleChargingStations', 'name location')
      .populate('createdBy', 'personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vehicle.countDocuments(query);

    res.json({
      success: true,
      data: vehicles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/vehicles/:id - Get single vehicle
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id)
      .populate('compatibleChargingStations', 'name location capacity')
      .populate('createdBy', 'personalInfo.firstName personalInfo.lastName');

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/vehicles - Create new vehicle (admin only)
export const createVehicle = async (req, res) => {
  try {
    const userId = getUserId(req);
    
    // Validate required fields
    const { make, model, vehicleType, batteryCapacity } = req.body;
    
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
    
    if (!vehicleType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vehicle type is required' 
      });
    }
    
    const batteryCapacityNum = Number(batteryCapacity);
    if (isNaN(batteryCapacityNum) || batteryCapacityNum < 1 || batteryCapacityNum > 500) {
      return res.status(400).json({ 
        success: false, 
        message: 'Battery capacity must be between 1-500 kWh' 
      });
    }
    
    const vehicleData = {
      ...req.body,
      make: make.trim(),
      model: model.trim(),
      batteryCapacity: batteryCapacityNum,
      createdBy: userId
    };

    // Validate charging specifications
    if (vehicleData.chargingAC && !vehicleData.chargingAC.supported && !vehicleData.chargingDC.supported) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vehicle must support at least AC or DC charging' 
      });
    }

    const vehicle = await Vehicle.create(vehicleData);
    await vehicle.populate('compatibleChargingStations', 'name location');
    await vehicle.populate('createdBy', 'personalInfo.firstName personalInfo.lastName');

    // Create admin action notification
    try {
      const { createAdminActionNotification } = await import('./notification.controller.js');
      await createAdminActionNotification(userId, 'vehicle_added', {
        make: vehicle.make,
        model: vehicle.model
      });
    } catch (notificationError) {
      console.error('Failed to create vehicle added notification:', notificationError);
    }

    res.status(201).json({ success: true, message: 'Vehicle created successfully', data: vehicle });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message) 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /api/vehicles/:id - Update vehicle (admin only)
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    // Validate required fields if they are being updated
    const { make, model, vehicleType, batteryCapacity } = req.body;
    
    if (make !== undefined && (!make || !make.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Make is required' 
      });
    }
    
    if (model !== undefined && (!model || !model.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Model is required' 
      });
    }
    
    if (vehicleType !== undefined && !vehicleType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vehicle type is required' 
      });
    }
    
    if (batteryCapacity !== undefined) {
      const batteryCapacityNum = Number(batteryCapacity);
      if (isNaN(batteryCapacityNum) || batteryCapacityNum < 1 || batteryCapacityNum > 500) {
        return res.status(400).json({ 
          success: false, 
          message: 'Battery capacity must be between 1-500 kWh' 
        });
      }
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Check if trying to deactivate vehicle and if any user has this vehicle
    if (req.body.isActive === false) {
      // Find users who have this vehicle (matching make and model)
      const usersWithVehicle = await User.find({
        'roleSpecificData.evUserInfo.vehicles': {
          $elemMatch: {
            make: vehicle.make,
            model: vehicle.model
          }
        }
      });

      if (usersWithVehicle.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot deactivate vehicle because it is assigned to one or more users',
          assignedUsersCount: usersWithVehicle.length
        });
      }
    }

    // Validate charging specifications
    if (req.body.chargingAC && !req.body.chargingAC.supported && 
        req.body.chargingDC && !req.body.chargingDC.supported) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vehicle must support at least AC or DC charging' 
      });
    }

    const oldVehicle = await Vehicle.findById(id);
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id, 
      { ...req.body, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    )
      .populate('compatibleChargingStations', 'name location')
      .populate('createdBy', 'personalInfo.firstName personalInfo.lastName');

    // Create admin action notification if status changed
    try {
      if (oldVehicle && oldVehicle.isActive !== updatedVehicle.isActive) {
        const { createAdminActionNotification } = await import('./notification.controller.js');
        await createAdminActionNotification(userId, 'vehicle_status_changed', {
          make: updatedVehicle.make,
          model: updatedVehicle.model,
          isActive: updatedVehicle.isActive
        });
      }
    } catch (notificationError) {
      console.error('Failed to create vehicle status change notification:', notificationError);
    }

    res.json({ success: true, message: 'Vehicle updated successfully', data: updatedVehicle });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message) 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /api/vehicles/:id - Delete vehicle (admin only)
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete = false } = req.query;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Check if any user has this vehicle in their vehicles array
    // Find users who have this vehicle (matching make and model)
    const usersWithVehicle = await User.find({
      'roleSpecificData.evUserInfo.vehicles': {
        $elemMatch: {
          make: vehicle.make,
          model: vehicle.model
        }
      }
    });

    if (usersWithVehicle.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete or deactivate vehicle because it is assigned to one or more users',
        assignedUsersCount: usersWithVehicle.length
      });
    }

    if (hardDelete === 'true') {
      await Vehicle.findByIdAndDelete(id);
      res.json({ success: true, message: 'Vehicle permanently deleted' });
    } else {
      // Soft delete
      vehicle.isActive = false;
      await vehicle.save();
      res.json({ success: true, message: 'Vehicle deactivated successfully' });
    }
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/vehicles/search/compatible - Get vehicles compatible with specific charger types
export const getCompatibleVehicles = async (req, res) => {
  try {
    const { chargerTypes } = req.query;
    
    if (!chargerTypes) {
      return res.status(400).json({ 
        success: false, 
        message: 'Charger types are required' 
      });
    }

    const types = Array.isArray(chargerTypes) ? chargerTypes : chargerTypes.split(',');
    const vehicles = await Vehicle.getCompatibleVehicles(types);

    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Error fetching compatible vehicles:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/vehicles/stats - Get vehicle statistics (admin only)
export const getVehicleStats = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ isActive: true });
    const vehiclesByType = await Vehicle.aggregate([
      { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const vehiclesByMake = await Vehicle.aggregate([
      { $group: { _id: '$make', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        total: totalVehicles,
        active: activeVehicles,
        inactive: totalVehicles - activeVehicles,
        byType: vehiclesByType,
        topMakes: vehiclesByMake
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/vehicles/:id/compatible-stations - Update compatible charging stations
export const updateCompatibleStations = async (req, res) => {
  try {
    const { id } = req.params;
    const { stationIds } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Validate station IDs
    const stations = await Station.find({ _id: { $in: stationIds } });
    if (stations.length !== stationIds.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'One or more station IDs are invalid' 
      });
    }

    vehicle.compatibleChargingStations = stationIds;
    await vehicle.save();

    await vehicle.populate('compatibleChargingStations', 'name location capacity');

    res.json({ 
      success: true, 
      message: 'Compatible stations updated successfully', 
      data: vehicle 
    });
  } catch (error) {
    console.error('Error updating compatible stations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/vehicles/models?make=Tesla - Get distinct models for a given make
export const getModelsByMake = async (req, res) => {
  try {
    const { make } = req.query;
    if (!make || !String(make).trim()) {
      return res.status(400).json({ success: false, message: 'make is required' });
    }
    const makeStr = String(make).trim();
    const rows = await Vehicle.aggregate([
      { $match: { make: { $regex: `^${makeStr}$`, $options: 'i' } } },
      { $group: { _id: '$model' } },
      { $project: { _id: 0, model: '$_id' } },
      { $sort: { model: 1 } }
    ]);
    const models = rows.map(r => r.model).filter(Boolean);
    return res.json({ success: true, data: models });
  } catch (error) {
    console.error('Error fetching models by make:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/vehicles/capacities?make=Tesla&model=Model 3 - Existing capacities for make+model
export const getCapacitiesByMakeModel = async (req, res) => {
  try {
    const { make, model } = req.query;
    if (!make || !model) {
      return res.status(400).json({ success: false, message: 'make and model are required' });
    }
    const makeStr = String(make).trim();
    const modelStr = String(model).trim();
    const rows = await Vehicle.aggregate([
      { $match: { 
        make: { $regex: `^${makeStr}$`, $options: 'i' },
        model: { $regex: `^${modelStr}$`, $options: 'i' },
        batteryCapacity: { $type: 'number' }
      } },
      { $group: { _id: '$batteryCapacity' } },
      { $project: { _id: 0, capacity: '$_id' } },
      { $sort: { capacity: 1 } }
    ]);
    const capacities = rows.map(r => r.capacity).filter((n) => typeof n === 'number');
    return res.json({ success: true, data: capacities });
  } catch (error) {
    console.error('Error fetching capacities by make & model:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/vehicles/makes - Distinct makes from admin-added vehicles
export const getMakes = async (req, res) => {
  try {
    const rows = await Vehicle.aggregate([
      { $match: { make: { $type: 'string' } } },
      { $group: { _id: { $toLower: '$make' }, original: { $first: '$make' } } },
      { $replaceRoot: { newRoot: { make: '$original' } } },
      { $sort: { make: 1 } }
    ]);
    const makes = rows.map(r => r.make).filter(Boolean);
    return res.json({ success: true, data: makes });
  } catch (error) {
    console.error('Error fetching makes:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


