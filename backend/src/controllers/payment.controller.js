import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/booking.model.js';
import Station from '../models/station.model.js';
import { createBookingNotification } from './notification.controller.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order for booking payment
export const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
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

    console.log('=== Creating payment order ===');
    console.log('User ID:', userId);
    console.log('Request body:', req.body);

    // Validate required fields
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
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Calculate duration and pricing
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end - start) / (1000 * 60)); // minutes
    
    // Ensure station has pricing
    if (!station.pricing?.pricePerMinute) {
      if (!station.pricing) station.pricing = {};
      station.pricing.pricePerMinute = 10;
      await station.save();
    }
    
    const pricePerMinute = Number(station.pricing.pricePerMinute);
    const estimatedCost = duration * pricePerMinute;

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(estimatedCost * 100), // Amount in paise (multiply by 100)
      currency: 'INR',
      receipt: `booking_${Date.now()}`,
      notes: {
        stationId,
        chargerType,
        startTime,
        endTime,
        vehicleId,
        currentCharge: currentCharge.toString(),
        targetCharge: targetCharge.toString(),
        duration: duration.toString(),
        pricePerMinute: pricePerMinute.toString(),
        userId,
        notes: notes || ''
      }
    };

    const order = await razorpay.orders.create(orderOptions);
    console.log('Razorpay order created:', order.id);

    // Create a pending booking with payment info
    const booking = new Booking({
      userId,
      stationId,
      chargerId: 'pending_payment', // Will be assigned after payment
      chargerType,
      startTime: start,
      endTime: end,
      duration,
      vehicleId,
      currentCharge,
      targetCharge,
      pricing: {
        basePrice: pricePerMinute,
        estimatedEnergy: 0,
        estimatedCost
      },
      payment: {
        razorpayOrderId: order.id,
        paymentStatus: 'pending',
        paidAmount: 0
      },
      notes,
      status: 'pending' // Will be confirmed after payment
    });

    await booking.save();
    console.log('Pending booking created:', booking._id);

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking._id,
        keyId: process.env.RAZORPAY_KEY_ID,
        estimatedCost,
        duration,
        stationName: station.name
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify payment and confirm booking
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    console.log('=== Verifying payment ===');
    console.log('Order ID:', razorpay_order_id);
    console.log('Payment ID:', razorpay_payment_id);
    console.log('Booking ID:', bookingId);

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.log('Payment signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    console.log('Payment details:', payment.status, payment.method);

    // Find and allocate charger
    const station = await Station.findById(booking.stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Ensure chargers array exists
    if (!Array.isArray(station.capacity?.chargers) || station.capacity.chargers.length === 0) {
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
        station.capacity.chargers.push({
          chargerId: `${booking.chargerType}_0_0`,
          type: booking.chargerType,
          power: station.capacity?.maxPowerPerCharger || 7,
          isAvailable: true,
          currentBooking: null
        });
      }
    }

    // Find available charger
    const availableCharger = station.capacity.chargers.find(
      charger => charger.type === booking.chargerType && charger.isAvailable
    );

    if (!availableCharger) {
      // Payment successful but no charger available - need to refund
      console.log('No available charger, booking cannot be confirmed');
      booking.status = 'cancelled';
      booking.cancellationReason = 'No available charger after payment';
      booking.payment.paymentStatus = 'completed'; // Payment was successful
      booking.payment.razorpayPaymentId = razorpay_payment_id;
      booking.payment.razorpaySignature = razorpay_signature;
      booking.payment.paymentMethod = payment.method;
      booking.payment.paidAmount = payment.amount / 100; // Convert from paise
      booking.payment.paymentDate = new Date();
      await booking.save();

      // Create notification for booking cancellation
      try {
        await createBookingNotification(booking.userId, 'booking_cancelled', booking, station);
      } catch (notificationError) {
        console.error('Error creating cancellation notification:', notificationError);
      }

      return res.status(400).json({
        success: false,
        message: 'No available chargers. Payment will be refunded.',
        bookingId: booking._id
      });
    }

    // Allocate charger and update booking
    availableCharger.isAvailable = false;
    availableCharger.currentBooking = booking._id;
    booking.chargerId = availableCharger.chargerId;
    
    // Update available slots
    const slots = station?.capacity?.availableSlots;
    if (typeof slots === 'number' && Number.isFinite(slots)) {
      station.capacity.availableSlots = Math.max(0, slots - 1);
    } else if (Array.isArray(station?.capacity?.chargers)) {
      station.capacity.availableSlots = station.capacity.chargers.filter(c => c.isAvailable).length;
    } else {
      const total = Number(station?.capacity?.totalChargers || 0);
      station.capacity.availableSlots = Math.max(0, total - 1);
    }

    // Update payment info
    booking.payment.razorpayPaymentId = razorpay_payment_id;
    booking.payment.razorpaySignature = razorpay_signature;
    booking.payment.paymentStatus = 'completed';
    booking.payment.paymentMethod = payment.method;
    booking.payment.paidAmount = payment.amount / 100; // Convert from paise
    booking.payment.paymentDate = new Date();
    booking.status = 'confirmed';

    // Save both booking and station
    await booking.save();
    await station.save();

    console.log('Payment verified and booking confirmed:', booking._id);

    // Create notifications for successful booking
    try {
      await createBookingNotification(booking.userId, 'payment_success', booking, station);
      await createBookingNotification(booking.userId, 'booking_confirmed', booking, station);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the payment verification if notification fails
    }

    // Populate booking details
    try {
      await booking.populate([
        { path: 'userId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.email' },
        { path: 'stationId', select: 'name location' }
      ]);
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment status for a booking
export const getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub || req.user.id;

    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate('stationId', 'name location');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id,
        paymentStatus: booking.payment?.paymentStatus || 'pending',
        paidAmount: booking.payment?.paidAmount || 0,
        paymentMethod: booking.payment?.paymentMethod,
        paymentDate: booking.payment?.paymentDate,
        bookingStatus: booking.status,
        estimatedCost: booking.pricing?.estimatedCost || 0
      }
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// List current user's payments (from bookings payment info)
export const listMyPayments = async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const rows = await Booking.find({ userId, 'payment.paymentStatus': { $in: ['completed', 'refunded', 'failed', 'pending'] } })
      .select('stationId pricing.estimatedCost payment status createdAt startTime endTime duration')
      .populate('stationId', 'name location');

    const items = rows.map((b) => ({
      id: b._id,
      stationName: b.stationId?.name || 'Station',
      price: b.pricing?.estimatedCost || 0,
      status: b.payment?.paymentStatus || 'pending',
      method: b.payment?.paymentMethod || undefined,
      paidAmount: b.payment?.paidAmount || 0,
      paymentDate: b.payment?.paymentDate || null,
      startTime: b.startTime || null,
      endTime: b.endTime || null,
      duration: typeof b.duration === 'number' ? b.duration : undefined,
      bookingStatus: b.status,
      createdAt: b.createdAt
    }));

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error listing my payments:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Generate PDF receipt for a booking payment
export const downloadReceipt = async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const { bookingId } = req.params;
    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate('stationId', 'name location pricing')
      .populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.email');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt_${bookingId}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // Branding
    try {
      const logoPath = path.resolve(process.cwd(), '..', 'frontend', 'public', 'favicon.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 38, { width: 28, height: 28 });
      }
    } catch {}
    doc.fillColor('#111111').fontSize(18).text('NexCharge', 74, 40, { continued: false });
    // Centered title
    doc.fontSize(16).fillColor('#111111').text('Payment Receipt', { align: 'center' });

    // Metadata block
    const metaTop = 88;
    const metaLeft = 40;
    const metaWidth = 515;
    const metaHeight = 54;
    // Background box
    doc.save();
    doc.roundedRect(metaLeft, metaTop, metaWidth, metaHeight, 6).fillOpacity(0.06).fill('#1f2937');
    doc.restore();
    // Content inside meta
    const issuedAt = new Date(booking.payment?.paymentDate || Date.now()).toLocaleString();
    const status = (booking.payment?.paymentStatus || 'pending').toUpperCase();
    const statusColor = status === 'COMPLETED' ? '#059669' : (status === 'PENDING' ? '#d97706' : '#dc2626');
    doc.fontSize(10).fillColor('#111111');
    doc.text(`Receipt ID: ${booking._id}`, metaLeft + 12, metaTop + 10);
    doc.text(`Issued: ${issuedAt}`, metaLeft + 12, metaTop + 28);
    // Status badge
    const badgeText = status;
    const badgePaddingX = 8;
    const badgePaddingY = 4;
    const badgeX = metaLeft + metaWidth - 130;
    const badgeY = metaTop + 16;
    const badgeW = 110;
    const badgeH = 20;
    doc.save();
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10).lineWidth(1).strokeColor(statusColor).stroke();
    doc.fillColor(statusColor).fontSize(10).text(badgeText, badgeX, badgeY + 4, { width: badgeW, align: 'center' });
    doc.restore();

    // Billed To
    const userName = `${booking.userId?.personalInfo?.firstName || ''} ${booking.userId?.personalInfo?.lastName || ''}`.trim();
    doc.moveTo(40, metaTop + metaHeight + 10).lineTo(555, metaTop + metaHeight + 10).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.8);
    doc.fontSize(12).fillColor('#111111').text('Billed To');
    doc.fontSize(10).fillColor('#222222').text(userName || 'EV User');
    if (booking.userId?.personalInfo?.email) doc.fillColor('#444444').text(booking.userId.personalInfo.email);

    // Station
    doc.moveDown(0.8);
    doc.fontSize(12).fillColor('#111111').text('Station Details');
    doc.fontSize(10).fillColor('#222222').text(booking.stationId?.name || 'Station');
    const loc = booking.stationId?.location;
    if (loc) {
      const addr = `${loc.address || ''}, ${loc.city || ''}, ${loc.state || ''} ${loc.pincode || ''}`;
      doc.fillColor('#444444').text(addr);
    }

    // Session details
    const pageLeft = 40; const pageRight = 555; const contentWidth = pageRight - pageLeft;
    doc.moveDown(0.8);
    doc.fontSize(12).fillColor('#111111').text('Session Details', pageLeft);
    // Two-column grid (labels left, values right-aligned)
    const colLabelX = pageLeft + 10; let rowY = doc.y + 6; const rowGap = 16;
    const niceConnector = (() => {
      const map = { 'dc_ccs': 'DC CCS', 'ccs2': 'CCS-2', 'dc_chademo': 'CHAdeMO' };
      const raw = String(booking.chargerType || '').toLowerCase();
      return map[raw] || raw.replace(/_/g, ' ').toUpperCase();
    })();
    const fmt = (d) => d ? new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const durText = (() => {
      if (typeof booking.duration !== 'number') return '';
      const h = Math.floor(booking.duration / 60);
      const m = booking.duration % 60;
      const parts = [];
      if (h) parts.push(`${h} hour${h===1?'':'s'}`);
      if (m) parts.push(`${m} minute${m===1?'':'s'}`);
      return parts.join(' ');
    })();
    doc.fontSize(10).fillColor('#444444').text('Connector Type', colLabelX, rowY);
    doc.fillColor('#111111').text(niceConnector, pageLeft, rowY, { width: contentWidth - 20, align: 'right' });
    rowY += rowGap;
    doc.fillColor('#444444').text('Start Time', colLabelX, rowY);
    doc.fillColor('#111111').text(fmt(booking.startTime), pageLeft, rowY, { width: contentWidth - 20, align: 'right' });
    rowY += rowGap;
    doc.fillColor('#444444').text('End Time', colLabelX, rowY);
    doc.fillColor('#111111').text(fmt(booking.endTime), pageLeft, rowY, { width: contentWidth - 20, align: 'right' });
    rowY += rowGap;
    doc.fillColor('#444444').text('Duration', colLabelX, rowY);
    doc.fillColor('#111111').text(durText || `${booking.duration} minutes`, pageLeft, rowY, { width: contentWidth - 20, align: 'right' });

    // Payment Summary (two-column)
    const ppm = booking.pricing?.basePrice || booking.stationId?.pricing?.pricePerMinute || 0;
    const est = booking.pricing?.estimatedCost || 0;
    const paid = booking.payment?.paidAmount || 0;
    const payStatus = booking.payment?.paymentStatus || 'pending';
    const method = booking.payment?.paymentMethod ? String(booking.payment.paymentMethod).toUpperCase() : '—';

    doc.moveDown(1.0);
    doc.fontSize(12).fillColor('#111111').text('Payment Summary', pageLeft);
    const psY = doc.y + 6;
    const boxX = pageLeft, boxW = contentWidth;
    doc.save();
    // light section background
    doc.roundedRect(boxX, psY - 8, boxW, 104, 6).fillOpacity(0.05).fill('#1f2937');
    doc.restore();
    // Total charged prominent (top-right inside box)
    const money = (n) => `₹${Number(n || 0).toFixed(2)}`;
    doc.fontSize(18).fillColor('#111111').text(money(paid), boxX, psY - 2, { width: boxW - 10, align: 'right' });

    // Ledger rows
    const labelX = boxX + 10; const row1Y = psY + 24; const rowStep = 18;
    doc.fontSize(10).fillColor('#444444');
    doc.text('Price per minute', labelX, row1Y);
    doc.text('Estimated cost', labelX, row1Y + rowStep);
    doc.text('Payment method', labelX, row1Y + rowStep * 2);
    doc.text('Payment status', labelX, row1Y + rowStep * 3);
    doc.fillColor('#111111');
    doc.text(money(ppm), boxX, row1Y, { width: boxW - 20, align: 'right' });
    doc.text(money(est), boxX, row1Y + rowStep, { width: boxW - 20, align: 'right' });
    doc.text(method, boxX, row1Y + rowStep * 2, { width: boxW - 20, align: 'right' });
    // Payment status value right-aligned (no inline badge here)
    doc.text(payStatus.toUpperCase(), boxX, row1Y + rowStep * 3, { width: boxW - 20, align: 'right' });

    // Footer
    doc.moveDown(6);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.6);
    doc.fontSize(9).fillColor('#6b7280').text('Thank you for charging with NexCharge. For support, contact support@nexcharge.local.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate receipt' });
  }
};
