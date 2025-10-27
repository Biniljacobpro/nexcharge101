import Station from '../models/station.model.js';
import Vehicle from '../models/vehicle.model.js';

// GET /api/public/stations - Get all public stations
export const getPublicStations = async (req, res) => {
  try {
    // Show stations that are active or under maintenance (hide inactive)
    const stations = await Station.find({ 'operational.status': { $in: ['active', 'maintenance'] } })
      .select('name location capacity pricing operational images analytics')
      .lean();

    const stationsWithAvailability = stations.map(s => ({
      ...s,
      // If maintenance, expose zero availability for clarity on UI
      availableSlots: s.operational?.status === 'maintenance'
        ? 0
        : (s.capacity?.chargers?.filter(c => c.isAvailable).length || s.capacity?.availableSlots || 0),
      availableChargers: s.operational?.status === 'maintenance'
        ? []
        : (s.capacity?.chargers?.filter(c => c.isAvailable) || [])
    }));

    res.json({ success: true, data: stationsWithAvailability });
  } catch (error) {
    console.error('Error fetching public stations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/public/stations/:id - Get single public station
export const getPublicStationById = async (req, res) => {
  try {
    const { id } = req.params;
    const station = await Station.findById(id)
      .select('name location capacity pricing operational analytics images')
      .lean();

    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    // Hide inactive stations from public details as well
    if (station.operational?.status === 'inactive') {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    const stationWithAvailability = {
      ...station,
      availableSlots: station.operational?.status === 'maintenance'
        ? 0
        : (station.capacity?.chargers?.filter(c => c.isAvailable).length || station.capacity?.availableSlots || 0),
      availableChargers: station.operational?.status === 'maintenance'
        ? []
        : (station.capacity?.chargers?.filter(c => c.isAvailable) || [])
    };

    res.json({ success: true, data: stationWithAvailability });
  } catch (error) {
    console.error('Error fetching public station:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/public/vehicles - Get all active vehicles for EV users
export const getPublicVehicles = async (req, res) => {
  try {
    const { vehicleType, make, search } = req.query;
    const query = { isActive: true };

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    if (make) {
      query.make = { $regex: make, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query)
      .select('make model vehicleType batteryCapacity chargingAC chargingDC specifications images displayName fullName')
      .sort({ make: 1, model: 1 })
      .lean();

    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Error fetching public vehicles:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/public/vehicles/:id - Get single vehicle details
export const getPublicVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id)
      .select('make model vehicleType batteryCapacity chargingAC chargingDC specifications images displayName fullName')
      .lean();

    if (!vehicle || !vehicle.isActive) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error fetching public vehicle:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};