import Booking from '../models/booking.model.js';
import Station from '../models/station.model.js';
import User from '../models/user.model.js';
import { createBookingNotification } from './notification.controller.js';
import { sendBookingConfirmationEmail, sendOTPEmail } from '../utils/emailService.js';

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    console.log('=== Creating booking ===');
    const userId = req.user.sub || req.user.id;
    console.log('User ID:', userId);
    const {
      stationId,
      chargerType,
      startTime,
      endTime,
      vehicleId,
      currentCharge,
      targetCharge,
      notes
    } = req.body;
    console.log('Request body:', req.body);

    // Validate required fields (allow 0 values for charges)
    const missing = (
      !stationId ||
      !chargerType ||
      !startTime ||
      !endTime ||
      !vehicleId ||
      (currentCharge === null || currentCharge === undefined) ||
      (targetCharge === null || targetCharge === undefined)
    );
    if (missing) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: stationId, chargerType, startTime, endTime, vehicleId, currentCharge, targetCharge'
      });
    }

    // Check if station exists
    console.log('Looking for station:', stationId);
    const station = await Station.findById(stationId);
    console.log('Station found:', station ? 'Yes' : 'No');
    if (station) {
      console.log('Station name:', station.name);
      console.log('Station pricing:', JSON.stringify(station.pricing, null, 2));
    }
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Check if station is active
    if (station.operational?.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Station is not available for booking'
      });
    }

    // Check if vehicle exists and is active
    console.log('Looking for vehicle:', vehicleId);
    const Vehicle = (await import('../models/vehicle.model.js')).default;
    const vehicle = await Vehicle.findById(vehicleId);
    console.log('Vehicle found:', vehicle ? 'Yes' : 'No', vehicle?.isActive ? 'Active' : 'Inactive');
    if (!vehicle || !vehicle.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or not available'
      });
    }

    // Validate charge levels
    if (currentCharge < 0 || currentCharge > 100 || targetCharge < 0 || targetCharge > 100) {
      return res.status(400).json({
        success: false,
        message: 'Charge levels must be between 0 and 100'
      });
    }

    if (currentCharge >= targetCharge) {
      return res.status(400).json({
        success: false,
        message: 'Target charge must be higher than current charge'
      });
    }

    // Ensure chargers array is present - if not, generate based on capacity
    console.log('Station chargers:', station.capacity?.chargers?.length || 0);
    if (!Array.isArray(station.capacity?.chargers) || station.capacity.chargers.length === 0) {
      console.log('Generating chargers for station');
      station.capacity.chargers = [];
      const types = Array.isArray(station.capacity?.chargerTypes) ? station.capacity.chargerTypes : [];
      const total = Number(station.capacity?.totalChargers || 0);
      const perType = types.length > 0 ? Math.ceil(total / types.length) : total;
      types.forEach((type, typeIndex) => {
        for (let i = 0; i < perType && station.capacity.chargers.length < total; i++) {
          station.capacity.chargers.push({
            chargerId: `${type}_${typeIndex}_${i}`,
            type,
            power: station.capacity?.maxPowerPerCharger || 7,
            isAvailable: true,
            currentBooking: null
          });
        }
      });
      if (station.capacity.chargers.length === 0 && total > 0) {
        // fallback single charger with requested type
        station.capacity.chargers.push({
          chargerId: `${chargerType}_0_0`,
          type: chargerType,
          power: station.capacity?.maxPowerPerCharger || 7,
          isAvailable: true,
          currentBooking: null
        });
      }
      if (typeof station.capacity.availableSlots !== 'number') {
        station.capacity.availableSlots = Math.max(0, total);
      }
      await station.save();
    }

    // Find available charger of the requested type
    const availableCharger = station.capacity?.chargers?.find(
      charger => charger.type === chargerType && charger.isAvailable
    );

    if (!availableCharger) {
      return res.status(400).json({
        success: false,
        message: `No available ${chargerType} chargers at this station`
      });
    }

    // Validate time slots
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    if (start < tenMinutesFromNow) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be at least 10 minutes from now'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      stationId,
      chargerId: availableCharger.chargerId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        {
          startTime: { $lt: end },
          endTime: { $gt: start }
        }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    // Check for user's overlapping bookings across all stations (unless different vehicle)
    const userOverlappingBooking = await Booking.findOne({
      userId,
      vehicleId, // Same vehicle cannot be at two places at once
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        {
          startTime: { $lt: end },
          endTime: { $gt: start }
        }
      ]
    });

    if (userOverlappingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking during this time period with the same vehicle. Use a different vehicle or choose a different time slot.'
      });
    }

    // Calculate duration and pricing (per-minute pricing)
    const duration = Math.round((end - start) / (1000 * 60)); // minutes
    
    // Ensure station has pricing.pricePerMinute - if not, set a default and save
    if (!station.pricing?.pricePerMinute) {
      console.log('Station missing pricePerMinute, setting default of 10');
      if (!station.pricing) station.pricing = {};
      station.pricing.pricePerMinute = 10; // Default ₹10 per minute
      await station.save();
    }
    
    const pricePerMinute = Number(station.pricing.pricePerMinute);
    const estimatedEnergy = 0; // not used in per-minute pricing
    const estimatedCost = duration * pricePerMinute;

    // Update station charger availability FIRST (before creating booking)
    availableCharger.isAvailable = false;
    availableCharger.currentBooking = null; // Will be set after booking is created
    
    // Safely update availableSlots
    const slots = station?.capacity?.availableSlots;
    if (typeof slots === 'number' && Number.isFinite(slots)) {
      station.capacity.availableSlots = Math.max(0, slots - 1);
    } else if (Array.isArray(station?.capacity?.chargers)) {
      station.capacity.availableSlots = station.capacity.chargers.filter(c => c.isAvailable).length;
    } else {
      const total = Number(station?.capacity?.totalChargers || 0);
      station.capacity.availableSlots = Math.max(0, total - 1);
    }
    
    // Ensure station has required pricing before saving
    if (!station.pricing?.pricePerMinute) {
      console.log('Station missing pricePerMinute before save, adding default');
      if (!station.pricing) station.pricing = {};
      station.pricing.pricePerMinute = 10;
    }
    
    await station.save();

    // Create booking with error handling
    let booking;
    try {
      console.log('Creating booking object with data:', {
        userId,
        stationId,
        chargerId: availableCharger.chargerId,
        chargerType,
        startTime: start,
        endTime: end,
        duration,
        vehicleId,
        currentCharge,
        targetCharge,
        pricing: {
          basePrice: pricePerMinute,
          estimatedEnergy,
          estimatedCost
        },
        notes,
        status: 'confirmed'
      });

      booking = new Booking({
        userId,
        stationId,
        chargerId: availableCharger.chargerId,
        chargerType,
        startTime: start,
        endTime: end,
        duration,
        vehicleId,
        currentCharge,
        targetCharge,
        pricing: {
          basePrice: pricePerMinute, // repurpose basePrice to store per-minute price
          estimatedEnergy,
          estimatedCost
        },
        notes,
        status: 'confirmed'
      });

      console.log('Saving booking to database...');
      await booking.save();
      console.log('Booking saved successfully with ID:', booking._id);

      // Update charger with booking reference
      availableCharger.currentBooking = booking._id;
      
      // Ensure station still has required pricing before final save
      if (!station.pricing?.pricePerMinute) {
        console.log('Station missing pricePerMinute before final save, adding default');
        if (!station.pricing) station.pricing = {};
        station.pricing.pricePerMinute = 10;
      }
      
      await station.save();
    } catch (bookingError) {
      // Rollback station changes if booking creation fails
      availableCharger.isAvailable = true;
      availableCharger.currentBooking = null;
      if (typeof station.capacity.availableSlots === 'number') {
        station.capacity.availableSlots = station.capacity.availableSlots + 1;
      }
      
      // Ensure station has required pricing before rollback save
      if (!station.pricing?.pricePerMinute) {
        console.log('Station missing pricePerMinute before rollback save, adding default');
        if (!station.pricing) station.pricing = {};
        station.pricing.pricePerMinute = 10;
      }
      
      await station.save();
      throw bookingError;
    }

    // Populate booking details (do not fail booking if populate throws)
    try {
      await booking.populate([
        { path: 'userId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.email' },
        { path: 'stationId', select: 'name location' }
      ]);
    } catch (_) {}

    // Send booking confirmation email
    try {
      await sendBookingConfirmationEmail(booking, booking.userId, booking.stationId);
    } catch (emailError) {
      console.error('Error sending booking confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    // Create booking confirmation notification
    try {
      await createBookingNotification(userId, 'booking_confirmed', booking, station);
    } catch (notificationError) {
      console.error('Error creating booking confirmation notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body was:', req.body);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update booking (time window and/or charger type)
export const updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub || req.user.id;
    const { startTime, endTime, chargerType } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (['cancelled', 'completed', 'no_show'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit a cancelled or completed booking' });
    }

    const now = new Date();
    const newStart = startTime ? new Date(startTime) : new Date(booking.startTime);
    const newEnd = endTime ? new Date(endTime) : new Date(booking.endTime);
    const desiredType = chargerType || booking.chargerType;

    if (!(newStart instanceof Date) || isNaN(newStart) || !(newEnd instanceof Date) || isNaN(newEnd)) {
      return res.status(400).json({ success: false, message: 'Invalid start or end time' });
    }
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    if (newStart < tenMinutesFromNow) {
      return res.status(400).json({ success: false, message: 'Start time must be at least 10 minutes from now' });
    }
    if (newEnd <= newStart) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const station = await Station.findById(booking.stationId);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    // Find an available charger of desiredType that does not overlap
    const candidateChargers = (station.capacity?.chargers || []).filter(c => c.type === desiredType);
    let chosenCharger = null;
    for (const c of candidateChargers) {
      const overlap = await Booking.findOne({
        stationId: booking.stationId,
        chargerId: c.chargerId,
        _id: { $ne: booking._id },
        status: { $in: ['pending', 'confirmed', 'active'] },
        $or: [{ startTime: { $lt: newEnd }, endTime: { $gt: newStart } }]
      });
      if (!overlap) { chosenCharger = c; break; }
    }

    if (!chosenCharger) {
      return res.status(400).json({ success: false, message: `No available ${desiredType} chargers for the selected time window` });
    }

    // Free previously held charger (if any) and occupy the new one immediately (consistent with createBooking behavior)
    const prevCharger = station.capacity?.chargers?.find(c => c.chargerId === booking.chargerId);
    if (prevCharger && !prevCharger.isAvailable) {
      prevCharger.isAvailable = true;
      prevCharger.currentBooking = null;
      if (typeof station.capacity.availableSlots === 'number') {
        station.capacity.availableSlots = station.capacity.availableSlots + 1;
      }
    }

    chosenCharger.isAvailable = false;
    chosenCharger.currentBooking = booking._id;
    if (typeof station.capacity.availableSlots === 'number') {
      station.capacity.availableSlots = station.capacity.availableSlots - 1;
    }
    await station.save();

    // Update booking
    booking.chargerType = desiredType;
    booking.chargerId = chosenCharger.chargerId;
    booking.startTime = newStart;
    booking.endTime = newEnd;
    booking.duration = Math.round((newEnd - newStart) / (1000 * 60));
    await booking.save();

    await booking.populate([
      { path: 'stationId', select: 'name location' },
      { path: 'userId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.email' }
    ]);

    res.json({ success: true, message: 'Booking updated successfully', data: booking });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get user's bookings
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const { status, limit = 10, page = 1 } = req.query;

    // Auto-complete expired bookings and free chargers
    const now = new Date();
    const expiring = await Booking.find({
      userId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      endTime: { $lt: now }
    });
    if (expiring.length > 0) {
      await Promise.all(expiring.map(async (b) => {
        try {
          b.status = 'completed';
          await b.save();
          const station = await Station.findById(b.stationId);
          if (station) {
            const charger = station.capacity?.chargers?.find(c => c.chargerId === b.chargerId);
            if (charger && !charger.isAvailable) {
              charger.isAvailable = true;
              charger.currentBooking = null;
              if (typeof station.capacity.availableSlots === 'number') {
                station.capacity.availableSlots = station.capacity.availableSlots + 1;
              }
              await station.save();
            }
          }
        } catch (e) {
          // swallow errors to not block response
        }
      }));
    }

    // Clean up orphaned bookings that might have been created during failed API calls
    // These are bookings created in the last 5 minutes that don't have proper charger allocation
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentBookings = await Booking.find({
      userId,
      status: { $in: ['pending', 'confirmed'] },
      createdAt: { $gte: fiveMinutesAgo }
    });
    
    for (const booking of recentBookings) {
      try {
        const station = await Station.findById(booking.stationId);
        if (station) {
          const charger = station.capacity?.chargers?.find(c => c.chargerId === booking.chargerId);
          // If charger doesn't exist or is available but has this booking, it's orphaned
          if (!charger || (charger.isAvailable && charger.currentBooking?.toString() === booking._id.toString())) {
            // Cancel the orphaned booking
            booking.status = 'cancelled';
            booking.cancellationReason = 'System cleanup - booking was not properly allocated';
            booking.cancelledAt = now;
            await booking.save();
            
            // Ensure charger is available
            if (charger) {
              charger.isAvailable = true;
              charger.currentBooking = null;
              await station.save();
            }
          }
        }
      } catch (e) {
        // Continue with other bookings if one fails
      }
    }

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('stationId', 'name location')
      .populate('vehicleId', 'make model vehicleType batteryCapacity specifications')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error getting user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub || req.user.id;

    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate('stationId', 'name location')
      .populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub || req.user.id;
    const { reason } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only allow cancellation if at least 2 hours before start time
    const now = new Date();
    const start = new Date(booking.startTime);
    const twoHoursMs = 2 * 60 * 60 * 1000;
    if (start.getTime() - now.getTime() < twoHoursMs) {
      return res.status(400).json({
        success: false,
        message: 'Cancellations are only allowed up to 2 hours before the start time'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;
    await booking.save();

    // Update station charger availability
    const station = await Station.findById(booking.stationId);
    if (station) {
      const charger = station.capacity?.chargers?.find(
        c => c.chargerId === booking.chargerId
      );
      if (charger) {
        charger.isAvailable = true;
        charger.currentBooking = null;
        station.capacity.availableSlots = station.capacity.availableSlots + 1;
        await station.save();
      }
    }

    // Create notification for booking cancellation
    try {
      await createBookingNotification(userId, 'booking_cancelled', booking, station);
    } catch (notificationError) {
      console.error('Error creating cancellation notification:', notificationError);
      // Don't fail the cancellation if notification fails
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Complete ongoing booking early
export const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub || req.user.id;

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'active' && booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only active or confirmed bookings can be completed'
      });
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    // Check if booking has actually started
    if (now < startTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete booking before it starts'
      });
    }

    // Update booking status
    booking.status = 'completed';
    booking.actualEndTime = now;
    booking.completedAt = now;

    // Calculate actual duration and cost
    const actualDurationMs = now - startTime;
    const actualDurationMinutes = Math.ceil(actualDurationMs / (1000 * 60));
    const pricePerMinute = booking.pricing?.pricePerMinute || 10;
    const actualCost = actualDurationMinutes * pricePerMinute;

    booking.actualDuration = actualDurationMinutes;
    booking.pricing.actualCost = actualCost;

    await booking.save();

    // Free up the charger
    const station = await Station.findById(booking.stationId);
    if (station) {
      const charger = station.capacity?.chargers?.find(
        c => c.chargerId === booking.chargerId
      );
      if (charger) {
        charger.isAvailable = true;
        charger.currentBooking = null;
        station.capacity.availableSlots = Math.min(
          station.capacity.totalChargers,
          (station.capacity.availableSlots || 0) + 1
        );
        await station.save();
      }
    }

    // Create notification for booking completion
    try {
      await createBookingNotification(userId, 'booking_completed', booking, station);
    } catch (notificationError) {
      console.error('Error creating completion notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Booking completed successfully',
      data: {
        booking,
        savedTime: Math.max(0, Math.ceil((endTime - now) / (1000 * 60))),
        actualCost,
        originalCost: booking.pricing?.estimatedCost || 0
      }
    });

  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Extend booking duration
export const extendBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub || req.user.id;
    const { additionalMinutes } = req.body;

    if (!additionalMinutes || additionalMinutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Additional minutes must be greater than 0'
      });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'confirmed' && booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed or active bookings can be extended'
      });
    }

    const currentEndTime = new Date(booking.endTime);
    const newEndTime = new Date(currentEndTime.getTime() + (additionalMinutes * 60 * 1000));

    // Check for overlapping bookings at the same station
    const overlappingBookings = await Booking.find({
      stationId: booking.stationId,
      chargerType: booking.chargerType,
      status: { $in: ['confirmed', 'active'] },
      _id: { $ne: bookingId },
      $or: [
        { startTime: { $lt: newEndTime }, endTime: { $gt: currentEndTime } }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot extend booking due to conflicting reservations',
        conflictingBookings: overlappingBookings.length
      });
    }

    // Check for user's overlapping bookings across all stations (unless different vehicle)
    const userOverlappingBookings = await Booking.find({
      userId,
      vehicleId: booking.vehicleId, // Same vehicle cannot be at two places at once
      status: { $in: ['confirmed', 'active'] },
      _id: { $ne: bookingId },
      $or: [
        { startTime: { $lt: newEndTime }, endTime: { $gt: currentEndTime } }
      ]
    });

    if (userOverlappingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot extend booking - you have another booking with the same vehicle during the extended time period.'
      });
    }

    // Calculate additional cost
    const pricePerMinute = booking.pricing?.pricePerMinute || 10;
    const additionalCost = additionalMinutes * pricePerMinute;

    // Update booking
    booking.endTime = newEndTime;
    booking.duration = booking.duration + additionalMinutes;
    booking.pricing.estimatedCost = (booking.pricing.estimatedCost || 0) + additionalCost;
    booking.extensionHistory = booking.extensionHistory || [];
    booking.extensionHistory.push({
      extendedAt: new Date(),
      additionalMinutes,
      additionalCost,
      newEndTime
    });

    await booking.save();

    res.json({
      success: true,
      message: 'Booking extended successfully',
      data: {
        booking,
        additionalCost,
        newEndTime,
        additionalMinutes
      }
    });

  } catch (error) {
    console.error('Error extending booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get station bookings (for station managers/franchise owners)
export const getStationBookings = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { status, limit = 20, page = 1 } = req.query;

    const query = { stationId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.email')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error getting station bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Generate and send OTP for booking
export const generateOTP = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub || req.user.id;

    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.email')
      .populate('stationId', 'name location');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'OTP can only be generated for confirmed bookings'
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

    // Update booking with OTP
    booking.otp = {
      code: otpCode,
      generatedAt: now,
      expiresAt: expiresAt,
      verified: false
    };
    await booking.save();

    // Send OTP email
    try {
      await sendOTPEmail(booking, booking.userId, booking.stationId, otpCode);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      // Don't fail the OTP generation if email fails
    }

    res.json({
      success: true,
      message: 'OTP generated and sent to your email',
      data: {
        bookingId: booking._id,
        expiresAt: expiresAt
      }
    });

  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify OTP and start charging
export const verifyOTPAndStartCharging = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp } = req.body;
    const userId = req.user.sub || req.user.id;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit OTP'
      });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can start charging'
      });
    }

    if (!booking.otp || !booking.otp.code) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this booking. Please generate OTP first.'
      });
    }

    if (booking.otp.verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP has already been used'
      });
    }

    const now = new Date();
    if (now > booking.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please generate a new OTP.'
      });
    }

    if (booking.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // Verify OTP and start charging
    booking.otp.verified = true;
    booking.status = 'active';
    booking.chargingStatus = 'started';
    booking.chargingStartedAt = now;
    await booking.save();

    res.json({
      success: true,
      message: 'OTP verified successfully. Charging started!',
      data: {
        bookingId: booking._id,
        chargingStartedAt: booking.chargingStartedAt,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Stop charging
export const stopCharging = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub || req.user.id;

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.chargingStatus !== 'started') {
      return res.status(400).json({
        success: false,
        message: 'Charging is not currently active'
      });
    }

    const now = new Date();
    booking.chargingStatus = 'stopped';
    booking.chargingStoppedAt = now;
    await booking.save();

    res.json({
      success: true,
      message: 'Charging stopped successfully',
      data: {
        bookingId: booking._id,
        chargingStoppedAt: booking.chargingStoppedAt,
        chargingStatus: booking.chargingStatus
      }
    });

  } catch (error) {
    console.error('Error stopping charging:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
