import Station from '../models/station.model.js';
import Booking from '../models/booking.model.js';

// Get real-time availability for a station at current time
export const getStationAvailability = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { checkTime } = req.query; // Optional: check availability at specific time
    
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    const currentTime = checkTime ? new Date(checkTime) : new Date();
    
    // Get all active bookings that overlap with current time
    const activeBookings = await Booking.find({
      stationId,
      status: { $in: ['confirmed', 'active'] },
      startTime: { $lte: currentTime },
      endTime: { $gt: currentTime }
    });

    const totalChargers = Number(station.capacity?.totalChargers || 0);
    const occupiedSlots = activeBookings.length;
    const availableSlots = Math.max(0, totalChargers - occupiedSlots);

    // Get availability by charger type
    const chargerTypes = station.capacity?.chargerTypes || [];
    const availabilityByType = {};

    for (const type of chargerTypes) {
      const typeBookings = activeBookings.filter(booking => booking.chargerType === type);
      const typeChargers = station.capacity?.chargers?.filter(c => c.type === type) || [];
      const totalOfType = typeChargers.length || Math.ceil(totalChargers / chargerTypes.length);
      const occupiedOfType = typeBookings.length;
      const availableOfType = Math.max(0, totalOfType - occupiedOfType);
      
      availabilityByType[type] = {
        total: totalOfType,
        occupied: occupiedOfType,
        available: availableOfType
      };
    }

    res.status(200).json({
      success: true,
      data: {
        stationId,
        totalChargers,
        availableSlots,
        occupiedSlots,
        availabilityByType,
        activeBookings: activeBookings.length,
        checkTime: currentTime.toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting station availability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get real-time availability for multiple stations
export const getMultipleStationsAvailability = async (req, res) => {
  try {
    const { stationIds } = req.body; // Array of station IDs
    const { checkTime } = req.query;
    
    if (!Array.isArray(stationIds) || stationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'stationIds array is required'
      });
    }

    const currentTime = checkTime ? new Date(checkTime) : new Date();
    const availabilityData = {};

    for (const stationId of stationIds) {
      try {
        const station = await Station.findById(stationId);
        if (!station) continue;

        const activeBookings = await Booking.find({
          stationId,
          status: { $in: ['confirmed', 'active'] },
          startTime: { $lte: currentTime },
          endTime: { $gt: currentTime }
        });

        const totalChargers = Number(station.capacity?.totalChargers || 0);
        const occupiedSlots = activeBookings.length;
        const availableSlots = Math.max(0, totalChargers - occupiedSlots);

        availabilityData[stationId] = {
          totalChargers,
          availableSlots,
          occupiedSlots,
          activeBookings: activeBookings.length
        };
      } catch (err) {
        console.error(`Error processing station ${stationId}:`, err);
        availabilityData[stationId] = {
          error: 'Failed to fetch availability'
        };
      }
    }

    res.status(200).json({
      success: true,
      data: availabilityData,
      checkTime: currentTime.toISOString()
    });

  } catch (error) {
    console.error('Error getting multiple stations availability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get availability for a specific time range (for booking validation)
export const getAvailabilityForTimeRange = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { startTime, endTime, chargerType } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'startTime and endTime are required'
      });
    }

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Find overlapping bookings
    const overlappingBookings = await Booking.find({
      stationId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    let availableForTimeRange = true;
    let availableChargers = 0;

    if (chargerType) {
      // Check availability for specific charger type
      const typeBookings = overlappingBookings.filter(booking => booking.chargerType === chargerType);
      const typeChargers = station.capacity?.chargers?.filter(c => c.type === chargerType) || [];
      const totalOfType = typeChargers.length || 1;
      availableChargers = Math.max(0, totalOfType - typeBookings.length);
      availableForTimeRange = availableChargers > 0;
    } else {
      // Check overall availability
      const totalChargers = Number(station.capacity?.totalChargers || 0);
      availableChargers = Math.max(0, totalChargers - overlappingBookings.length);
      availableForTimeRange = availableChargers > 0;
    }

    res.status(200).json({
      success: true,
      data: {
        stationId,
        timeRange: { startTime, endTime },
        chargerType: chargerType || 'any',
        availableForTimeRange,
        availableChargers,
        overlappingBookings: overlappingBookings.length
      }
    });

  } catch (error) {
    console.error('Error checking availability for time range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
