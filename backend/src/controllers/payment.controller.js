import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/booking.model.js';
import Payment from '../models/payment.model.js';
import Station from '../models/station.model.js';
import { createBookingNotification } from './notification.controller.js';
import { PaymentService } from '../services/payment.service.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order for booking payment
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const bookingData = req.body;

    console.log('=== Creating payment order ===');
    console.log('User ID:', userId);
    console.log('Request body:', bookingData);

    // Extract metadata from request
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      device: req.get('sec-ch-ua-mobile') === '?1' ? 'mobile' : 'desktop',
      platform: req.get('sec-ch-ua-platform')
    };

    // Use PaymentService to create order
    const orderData = await PaymentService.createOrder(bookingData, userId, metadata);

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        ...orderData,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Verify payment and confirm booking
 */
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

    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    // Use PaymentService to capture payment
    const result = await PaymentService.capturePayment(
      { razorpay_order_id, razorpay_payment_id, razorpay_signature },
      bookingId,
      metadata
    );

    console.log('Payment verified and booking confirmed:', result.booking._id);

    // Create notifications for successful booking
    try {
      const station = await Station.findById(result.booking.stationId);
      await createBookingNotification(result.booking.userId, 'payment_success', result.booking, station);
      await createBookingNotification(result.booking.userId, 'booking_confirmed', result.booking, station);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the payment verification if notification fails
    }

    // Populate booking details
    try {
      await result.booking.populate([
        { path: 'userId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.email' },
        { path: 'stationId', select: 'name location' }
      ]);
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully',
      data: {
        booking: result.booking,
        payment: result.payment,
        charger: result.charger
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get payment status for a booking
 */
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

    // Also get detailed payment info from Payment model
    const payment = await Payment.findOne({ bookingId: bookingId });

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id,
        paymentStatus: booking.payment?.paymentStatus || 'pending',
        paidAmount: booking.payment?.paidAmount || 0,
        paymentMethod: booking.payment?.paymentMethod,
        paymentDate: booking.payment?.paymentDate,
        bookingStatus: booking.status,
        estimatedCost: booking.pricing?.estimatedCost || 0,
        detailedPayment: payment ? {
          paymentId: payment._id,
          status: payment.status,
          breakdown: {
            baseAmount: payment.amount.orderAmount - payment.amount.tax.gst - payment.amount.tax.platformFee,
            gst: payment.amount.tax.gst,
            platformFee: payment.amount.tax.platformFee,
            total: payment.amount.orderAmount
          },
          refunded: payment.amount.refundedAmount,
          netAmount: payment.netAmount
        } : null
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

/**
 * List current user's payments
 */
export const listMyPayments = async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const { limit = 50, skip = 0, status } = req.query;

    const result = await PaymentService.getUserPayments(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      status
    });

    const items = result.payments.map((payment) => ({
      id: payment._id,
      bookingId: payment.bookingId?._id,
      stationName: payment.stationId?.name || 'Station',
      amount: payment.amount.orderAmount,
      paidAmount: payment.amount.paidAmount,
      refundedAmount: payment.amount.refundedAmount,
      netAmount: payment.netAmount,
      status: payment.status,
      paymentMethod: payment.paymentMethod?.type,
      provider: payment.paymentMethod?.provider,
      paymentDate: payment.timestamps.completed || payment.timestamps.created,
      startTime: payment.bookingId?.startTime,
      endTime: payment.bookingId?.endTime,
      duration: payment.bookingId?.duration,
      breakdown: {
        base: payment.amount.orderAmount - payment.amount.tax.gst - payment.amount.tax.platformFee,
        gst: payment.amount.tax.gst,
        platformFee: payment.amount.tax.platformFee
      },
      canRefund: payment.canRefund()
    }));

    return res.json({ 
      success: true, 
      data: items,
      pagination: {
        total: result.total,
        hasMore: result.hasMore,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Error listing my payments:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get detailed payment information
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.sub || req.user.id;

    const payment = await PaymentService.getPaymentDetails(paymentId, userId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error getting payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Request refund for a payment
 */
export const requestRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, amount } = req.body;
    const userId = req.user.sub || req.user.id;

    // Verify user owns this payment
    const payment = await Payment.findOne({ _id: paymentId, userId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if refund is possible
    if (!payment.canRefund()) {
      return res.status(400).json({
        success: false,
        message: 'This payment cannot be refunded'
      });
    }

    // Process refund
    const result = await PaymentService.processRefund(paymentId, amount, reason);

    // Update booking status
    const booking = await Booking.findById(payment.bookingId);
    if (booking && booking.status === 'confirmed') {
      booking.status = 'cancelled';
      booking.cancellationReason = reason || 'User requested refund';
      await booking.save();

      // Release charger
      const station = await Station.findById(booking.stationId);
      if (station) {
        const charger = station.capacity?.chargers?.find(c => c.chargerId === booking.chargerId);
        if (charger) {
          charger.isAvailable = true;
          charger.currentBooking = null;
          station.capacity.availableSlots = (station.capacity.availableSlots || 0) + 1;
          await station.save();
        }
      }

      // Send notification
      try {
        await createBookingNotification(userId, 'booking_cancelled', booking, station);
      } catch (_) {}
    }

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: result
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Razorpay webhook handler
 */
export const handleWebhook = async (req, res) => {
  try {
    const webhookBody = req.body;
    const signature = req.get('X-Razorpay-Signature');

    console.log('=== Received Razorpay Webhook ===');
    console.log('Event:', webhookBody.event);

    await PaymentService.handleWebhook(webhookBody, signature);

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get payment statistics (Admin only)
 */
export const getPaymentStatistics = async (req, res) => {
  try {
    const { startDate, endDate, stationId } = req.query;

    const filter = {};
    if (stationId) {
      filter.stationId = stationId;
    }
    if (startDate && endDate) {
      filter['timestamps.completed'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await PaymentService.getStatistics(filter);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get revenue breakdown (Admin only)
 */
export const getRevenueBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const breakdown = await PaymentService.getRevenueBreakdown(start, end);

    res.status(200).json({
      success: true,
      data: breakdown
    });

  } catch (error) {
    console.error('Error getting revenue breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Generate PDF receipt for a booking payment
 */
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

    // Get detailed payment info
    const payment = await Payment.findOne({ bookingId: bookingId });

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
    doc.fontSize(16).fillColor('#111111').text('Payment Receipt', { align: 'center' });

    // Metadata block
    const metaTop = 88;
    const metaLeft = 40;
    const metaWidth = 515;
    const metaHeight = 54;
    
    doc.save();
    doc.roundedRect(metaLeft, metaTop, metaWidth, metaHeight, 6).fillOpacity(0.06).fill('#1f2937');
    doc.restore();
    
    const issuedAt = new Date(booking.payment?.paymentDate || Date.now()).toLocaleString();
    const status = (booking.payment?.paymentStatus || 'pending').toUpperCase();
    const statusColor = status === 'COMPLETED' ? '#059669' : (status === 'PENDING' ? '#d97706' : '#dc2626');
    
    doc.fontSize(10).fillColor('#111111');
    doc.text(`Receipt ID: ${booking._id}`, metaLeft + 12, metaTop + 10);
    doc.text(`Issued: ${issuedAt}`, metaLeft + 12, metaTop + 28);
    
    const badgeText = status;
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
    const pageLeft = 40;
    const pageRight = 555;
    const contentWidth = pageRight - pageLeft;
    
    doc.moveDown(0.8);
    doc.fontSize(12).fillColor('#111111').text('Session Details', pageLeft);
    
    const colLabelX = pageLeft + 10;
    let rowY = doc.y + 6;
    const rowGap = 16;
    
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

    // Payment Summary
    const money = (n) => `₹${Number(n || 0).toFixed(2)}`;
    
    let baseAmount, gstAmount, platformFee, totalAmount;
    
    if (payment) {
      baseAmount = payment.amount.orderAmount - payment.amount.tax.gst - payment.amount.tax.platformFee;
      gstAmount = payment.amount.tax.gst;
      platformFee = payment.amount.tax.platformFee;
      totalAmount = payment.amount.paidAmount;
    } else {
      const ppm = booking.pricing?.basePrice || booking.stationId?.pricing?.pricePerMinute || 0;
      const est = booking.pricing?.estimatedCost || 0;
      totalAmount = booking.payment?.paidAmount || est;
      baseAmount = totalAmount / 1.2; // Approximate
      gstAmount = totalAmount * 0.18;
      platformFee = 0;
    }

    doc.moveDown(1.0);
    doc.fontSize(12).fillColor('#111111').text('Payment Summary', pageLeft);
    const psY = doc.y + 6;
    const boxX = pageLeft;
    const boxW = contentWidth;
    
    doc.save();
    doc.roundedRect(boxX, psY - 8, boxW, 124, 6).fillOpacity(0.05).fill('#1f2937');
    doc.restore();
    
    doc.fontSize(18).fillColor('#111111').text(money(totalAmount), boxX, psY - 2, { width: boxW - 10, align: 'right' });

    // Ledger rows
    const labelX = boxX + 10;
    const row1Y = psY + 24;
    const rowStep = 18;
    
    doc.fontSize(10).fillColor('#444444');
    doc.text('Base amount', labelX, row1Y);
    doc.text('GST (18%)', labelX, row1Y + rowStep);
    if (platformFee > 0) {
      doc.text('Platform fee', labelX, row1Y + rowStep * 2);
      doc.text('Payment method', labelX, row1Y + rowStep * 3);
      doc.text('Payment status', labelX, row1Y + rowStep * 4);
    } else {
      doc.text('Payment method', labelX, row1Y + rowStep * 2);
      doc.text('Payment status', labelX, row1Y + rowStep * 3);
    }
    
    doc.fillColor('#111111');
    doc.text(money(baseAmount), boxX, row1Y, { width: boxW - 20, align: 'right' });
    doc.text(money(gstAmount), boxX, row1Y + rowStep, { width: boxW - 20, align: 'right' });
    
    if (platformFee > 0) {
      doc.text(money(platformFee), boxX, row1Y + rowStep * 2, { width: boxW - 20, align: 'right' });
      const method = booking.payment?.paymentMethod ? String(booking.payment.paymentMethod).toUpperCase() : '—';
      doc.text(method, boxX, row1Y + rowStep * 3, { width: boxW - 20, align: 'right' });
      const payStatus = (booking.payment?.paymentStatus || 'pending').toUpperCase();
      doc.text(payStatus, boxX, row1Y + rowStep * 4, { width: boxW - 20, align: 'right' });
    } else {
      const method = booking.payment?.paymentMethod ? String(booking.payment.paymentMethod).toUpperCase() : '—';
      doc.text(method, boxX, row1Y + rowStep * 2, { width: boxW - 20, align: 'right' });
      const payStatus = (booking.payment?.paymentStatus || 'pending').toUpperCase();
      doc.text(payStatus, boxX, row1Y + rowStep * 3, { width: boxW - 20, align: 'right' });
    }

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

/**
 * Retry failed payment
 */
export const retryPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.sub || req.user.id;

    const payment = await Payment.findOne({ _id: paymentId, userId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Only failed payments can be retried'
      });
    }

    // Get the original booking
    const booking = await Booking.findById(payment.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Create new order
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    const orderData = await PaymentService.createOrder({
      stationId: booking.stationId,
      chargerType: booking.chargerType,
      startTime: booking.startTime,
      endTime: booking.endTime,
      vehicleId: booking.vehicleId,
      currentCharge: booking.currentCharge,
      targetCharge: booking.targetCharge,
      notes: booking.notes
    }, userId, metadata);

    res.status(200).json({
      success: true,
      message: 'New payment order created',
      data: {
        ...orderData,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
