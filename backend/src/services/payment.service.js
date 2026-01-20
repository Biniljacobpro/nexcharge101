import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/payment.model.js';
import Booking from '../models/booking.model.js';
import Station from '../models/station.model.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export class PaymentService {
  /**
   * Create a new Razorpay order and payment record
   */
  static async createOrder(bookingData, userId, metadata = {}) {
    try {
      // Validate booking data
      const { stationId, chargerType, startTime, endTime, vehicleId, currentCharge, targetCharge, notes } = bookingData;
      
      if (!stationId || !chargerType || !startTime || !endTime || !vehicleId) {
        throw new Error('Missing required booking fields');
      }

      // Get station details
      const station = await Station.findById(stationId);
      if (!station) {
        throw new Error('Station not found');
      }

      // Calculate pricing
      const start = new Date(startTime);
      const end = new Date(endTime);
      const duration = Math.round((end - start) / (1000 * 60)); // minutes
      
      const pricePerMinute = Number(station.pricing?.pricePerMinute || 10);
      const baseAmount = duration * pricePerMinute;
      
      // Calculate GST (18% on charging services in India)
      const gstRate = 0.18;
      const gstAmount = Math.round(baseAmount * gstRate);
      
      // Platform fee (2% of base amount)
      const platformFeeRate = 0.02;
      const platformFee = Math.round(baseAmount * platformFeeRate);
      
      const totalAmount = baseAmount + gstAmount + platformFee;

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // Convert to paise
        currency: 'INR',
        receipt: `booking_${Date.now()}_${userId.substring(0, 8)}`,
        notes: {
          stationId,
          chargerType,
          userId,
          vehicleId,
          duration: duration.toString(),
          ...notes
        }
      });

      // Create pending booking
      const booking = new Booking({
        userId,
        stationId,
        chargerId: 'pending_payment',
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
          estimatedCost: totalAmount
        },
        payment: {
          razorpayOrderId: razorpayOrder.id,
          paymentStatus: 'pending',
          paidAmount: 0
        },
        notes,
        status: 'pending'
      });

      await booking.save();

      // Create payment transaction record
      const payment = new Payment({
        bookingId: booking._id,
        userId,
        stationId,
        razorpay: {
          orderId: razorpayOrder.id
        },
        amount: {
          orderAmount: totalAmount,
          paidAmount: 0,
          refundedAmount: 0,
          tax: {
            gst: gstAmount,
            platformFee: platformFee
          }
        },
        status: 'created',
        timestamps: {
          created: new Date()
        },
        metadata: {
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          device: metadata.device,
          browser: metadata.browser,
          platform: metadata.platform
        }
      });

      await payment.save();

      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        bookingId: booking._id,
        paymentId: payment._id,
        breakdown: {
          baseAmount,
          gst: gstAmount,
          platformFee,
          total: totalAmount
        },
        stationName: station.name,
        duration
      };

    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  static verifySignature(orderId, paymentId, signature) {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    return expectedSignature === signature;
  }

  /**
   * Capture payment and confirm booking
   */
  static async capturePayment(razorpayData, bookingId, metadata = {}) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpayData;

      // Verify signature
      const isValid = this.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        throw new Error('Invalid payment signature');
      }

      // Get payment details from Razorpay
      const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

      // Find payment record
      const payment = await Payment.findOne({ 'razorpay.orderId': razorpay_order_id });
      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Find booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Get station and allocate charger
      const station = await Station.findById(booking.stationId);
      if (!station) {
        throw new Error('Station not found');
      }

      // Initialize chargers array if needed
      if (!Array.isArray(station.capacity?.chargers) || station.capacity.chargers.length === 0) {
        this.initializeStationChargers(station, booking.chargerType);
      }

      // Find available charger
      const availableCharger = station.capacity.chargers.find(
        charger => charger.type === booking.chargerType && charger.isAvailable
      );

      if (!availableCharger) {
        // No charger available - initiate refund
        payment.status = 'refund_pending';
        payment.refund = {
          reason: 'No available charger',
          requestedAt: new Date(),
          status: 'requested',
          amount: payment.amount.orderAmount
        };
        await payment.save();

        booking.status = 'cancelled';
        booking.cancellationReason = 'No available charger after payment';
        booking.payment.paymentStatus = 'completed';
        booking.payment.razorpayPaymentId = razorpay_payment_id;
        await booking.save();

        // Process refund
        await this.processRefund(payment._id, payment.amount.orderAmount, 'No available charger');

        throw new Error('No available chargers. Refund initiated.');
      }

      // Allocate charger
      availableCharger.isAvailable = false;
      availableCharger.currentBooking = booking._id;
      booking.chargerId = availableCharger.chargerId;

      // Update available slots
      const slots = station?.capacity?.availableSlots;
      if (typeof slots === 'number' && Number.isFinite(slots)) {
        station.capacity.availableSlots = Math.max(0, slots - 1);
      } else {
        station.capacity.availableSlots = station.capacity.chargers.filter(c => c.isAvailable).length;
      }

      // Update payment record
      payment.razorpay.paymentId = razorpay_payment_id;
      payment.razorpay.signature = razorpay_signature;
      payment.status = 'completed';
      payment.amount.paidAmount = razorpayPayment.amount / 100; // Convert from paise
      payment.timestamps.completed = new Date();
      payment.timestamps.captured = new Date();
      
      // Extract payment method details
      payment.paymentMethod = {
        type: razorpayPayment.method,
        provider: razorpayPayment.bank || razorpayPayment.wallet || razorpayPayment.vpa,
        email: razorpayPayment.email,
        contact: razorpayPayment.contact
      };

      if (razorpayPayment.card) {
        payment.paymentMethod.last4 = razorpayPayment.card.last4;
        payment.paymentMethod.provider = razorpayPayment.card.network;
      }

      if (razorpayPayment.vpa) {
        payment.paymentMethod.vpa = razorpayPayment.vpa;
      }

      await payment.save();

      // Update booking
      booking.payment.razorpayPaymentId = razorpay_payment_id;
      booking.payment.razorpaySignature = razorpay_signature;
      booking.payment.paymentStatus = 'completed';
      booking.payment.paymentMethod = razorpayPayment.method;
      booking.payment.paidAmount = razorpayPayment.amount / 100;
      booking.payment.paymentDate = new Date();
      booking.status = 'confirmed';

      await booking.save();
      await station.save();

      return {
        success: true,
        booking,
        payment,
        charger: availableCharger
      };

    } catch (error) {
      console.error('Error capturing payment:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  static async processRefund(paymentId, amount, reason) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (!payment.canRefund()) {
        throw new Error('Payment cannot be refunded');
      }

      const refundAmount = amount || payment.netAmount;

      // Create refund in Razorpay
      const refund = await razorpay.payments.refund(payment.razorpay.paymentId, {
        amount: Math.round(refundAmount * 100), // Convert to paise
        notes: {
          reason: reason || 'Customer request',
          paymentId: payment._id.toString()
        }
      });

      // Update payment record
      payment.razorpay.refundId = refund.id;
      payment.amount.refundedAmount += refundAmount;
      payment.refund = {
        reason: reason || 'Customer request',
        requestedAt: payment.refund?.requestedAt || new Date(),
        processedAt: new Date(),
        status: 'completed',
        amount: refundAmount
      };

      if (payment.amount.refundedAmount >= payment.amount.paidAmount) {
        payment.status = 'refunded';
        payment.timestamps.refunded = new Date();
      } else {
        payment.status = 'partially_refunded';
      }

      await payment.save();

      // Update booking
      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        booking.payment.refundId = refund.id;
        booking.payment.refundAmount = refundAmount;
        booking.payment.paymentStatus = payment.status === 'refunded' ? 'refunded' : booking.payment.paymentStatus;
        await booking.save();
      }

      return {
        success: true,
        refundId: refund.id,
        amount: refundAmount,
        payment
      };

    } catch (error) {
      // Mark refund as failed
      const payment = await Payment.findById(paymentId);
      if (payment) {
        payment.refund.status = 'failed';
        payment.refund.failureReason = error.message;
        payment.status = 'completed'; // Revert to completed
        await payment.save();
      }
      
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Handle Razorpay webhook
   */
  static async handleWebhook(webhookBody, signature) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(webhookBody))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const event = webhookBody.event;
      const payload = webhookBody.payload;

      // Find payment by order ID or payment ID
      let payment;
      if (payload.payment?.entity?.order_id) {
        payment = await Payment.findOne({ 'razorpay.orderId': payload.payment.entity.order_id });
      } else if (payload.payment?.entity?.id) {
        payment = await Payment.findOne({ 'razorpay.paymentId': payload.payment.entity.id });
      }

      if (payment) {
        // Log webhook event
        payment.webhookEvents.push({
          event,
          payload,
          receivedAt: new Date()
        });

        // Handle different event types
        switch (event) {
          case 'payment.authorized':
            payment.status = 'authorized';
            payment.timestamps.authorized = new Date();
            break;

          case 'payment.captured':
            payment.status = 'captured';
            payment.timestamps.captured = new Date();
            break;

          case 'payment.failed':
            payment.markFailed({
              code: payload.payment.entity.error_code,
              description: payload.payment.entity.error_description,
              reason: payload.payment.entity.error_reason,
              step: payload.payment.entity.error_step,
              source: payload.payment.entity.error_source
            });
            break;

          case 'refund.created':
          case 'refund.processed':
            payment.status = 'refunded';
            payment.timestamps.refunded = new Date();
            break;
        }

        await payment.save();
      }

      return { success: true, event };

    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  static async getStatistics(filter = {}) {
    return await Payment.getStatistics(filter);
  }

  /**
   * Get revenue breakdown
   */
  static async getRevenueBreakdown(startDate, endDate) {
    return await Payment.getRevenueBreakdown(startDate, endDate);
  }

  /**
   * Get payment history for a user
   */
  static async getUserPayments(userId, options = {}) {
    const { limit = 50, skip = 0, status } = options;
    
    const query = { userId };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('bookingId', 'startTime endTime duration status')
      .populate('stationId', 'name location')
      .sort({ 'timestamps.created': -1 })
      .limit(limit)
      .skip(skip);

    const total = await Payment.countDocuments(query);

    return {
      payments,
      total,
      hasMore: (skip + limit) < total
    };
  }

  /**
   * Get payment details
   */
  static async getPaymentDetails(paymentId, userId = null) {
    const query = { _id: paymentId };
    if (userId) {
      query.userId = userId;
    }

    const payment = await Payment.findOne(query)
      .populate('bookingId')
      .populate('stationId', 'name location pricing')
      .populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.email');

    return payment;
  }

  /**
   * Initialize station chargers if not present
   */
  static initializeStationChargers(station, chargerType) {
    if (!station.capacity) {
      station.capacity = {};
    }

    station.capacity.chargers = [];
    const types = Array.isArray(station.capacity?.chargerTypes) ? station.capacity.chargerTypes : [chargerType];
    const total = Number(station.capacity?.totalChargers || 1);
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
        chargerId: `${chargerType}_0_0`,
        type: chargerType,
        power: station.capacity?.maxPowerPerCharger || 7,
        isAvailable: true,
        currentBooking: null
      });
    }
  }

  /**
   * Fetch payment from Razorpay
   */
  static async fetchPaymentFromRazorpay(paymentId) {
    try {
      return await razorpay.payments.fetch(paymentId);
    } catch (error) {
      console.error('Error fetching payment from Razorpay:', error);
      throw error;
    }
  }

  /**
   * Fetch order from Razorpay
   */
  static async fetchOrderFromRazorpay(orderId) {
    try {
      return await razorpay.orders.fetch(orderId);
    } catch (error) {
      console.error('Error fetching order from Razorpay:', error);
      throw error;
    }
  }
}

export default PaymentService;
