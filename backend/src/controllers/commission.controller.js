import Commission from '../models/commission.model.js';
import Booking from '../models/booking.model.js';
import Payment from '../models/payment.model.js';
import Franchise from '../models/franchise.model.js';
import Corporate from '../models/corporate.model.js';
import Station from '../models/station.model.js';

// Auto-generate commission when booking is completed
export const generateCommissionFromBooking = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('stationId')
      .populate('userId');
    
    if (!booking || booking.status !== 'completed') {
      return null;
    }
    
    const station = booking.stationId;
    if (!station) return null;
    
    // Check if commission already exists
    const existing = await Commission.findOne({ bookingId });
    if (existing) return existing;
    
    let commissionData = null;
    
    // For franchise stations
    if (station.franchiseId) {
      const franchise = await Franchise.findById(station.franchiseId);
      if (franchise && franchise.status === 'active') {
        const baseAmount = booking.totalCost || 0;
        const rate = franchise.financialInfo?.commissionRate || 10;
        const calculated = Commission.calculateCommission(baseAmount, rate, 18); // 18% GST
        
        commissionData = {
          entityType: 'franchise',
          entityId: franchise._id,
          ownerId: franchise.ownerId,
          sourceType: 'booking',
          bookingId: booking._id,
          stationId: station._id,
          baseAmount,
          commissionRate: rate,
          ...calculated,
          period: {
            month: new Date(booking.endTime).getMonth() + 1,
            year: new Date(booking.endTime).getFullYear(),
            quarter: Math.ceil((new Date(booking.endTime).getMonth() + 1) / 3)
          },
          status: 'pending'
        };
      }
    }
    
    // For corporate stations
    if (station.corporateId) {
      const corporate = await Corporate.findById(station.corporateId);
      if (corporate && corporate.status === 'approved') {
        const baseAmount = booking.totalCost || 0;
        const rate = corporate.commissionRate || 15;
        const calculated = Commission.calculateCommission(baseAmount, rate, 18);
        
        commissionData = {
          entityType: 'corporate',
          entityId: corporate._id,
          ownerId: corporate.adminId,
          sourceType: 'booking',
          bookingId: booking._id,
          stationId: station._id,
          baseAmount,
          commissionRate: rate,
          ...calculated,
          period: {
            month: new Date(booking.endTime).getMonth() + 1,
            year: new Date(booking.endTime).getFullYear(),
            quarter: Math.ceil((new Date(booking.endTime).getMonth() + 1) / 3)
          },
          status: 'pending'
        };
      }
    }
    
    if (commissionData) {
      const commission = await Commission.create(commissionData);
      return commission;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating commission from booking:', error);
    throw error;
  }
};

// Get commissions for a franchise owner
export const getFranchiseCommissions = async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const { status, year, month, page = 1, limit = 20 } = req.query;
    
    // Verify ownership
    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }
    
    if (req.user.role !== 'admin' && franchise.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = { entityType: 'franchise', entityId: franchiseId };
    if (status) query.status = status;
    if (year) query['period.year'] = parseInt(year);
    if (month) query['period.month'] = parseInt(month);
    
    const skip = (page - 1) * limit;
    
    const [commissions, total, summary] = await Promise.all([
      Commission.find(query)
        .populate('stationId', 'name location')
        .populate('bookingId', 'startTime endTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Commission.countDocuments(query),
      Commission.getSummary(query)
    ]);
    
    res.json({
      success: true,
      data: {
        commissions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        },
        summary: summary[0] || {
          totalCommission: 0,
          totalNet: 0,
          pendingCommission: 0,
          paidCommission: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching franchise commissions:', error);
    res.status(500).json({ message: 'Error fetching commissions', error: error.message });
  }
};

// Get commissions for a corporate admin
export const getCorporateCommissions = async (req, res) => {
  try {
    const { corporateId } = req.params;
    const { status, year, month, page = 1, limit = 20 } = req.query;
    
    // Verify ownership
    const corporate = await Corporate.findById(corporateId);
    if (!corporate) {
      return res.status(404).json({ message: 'Corporate not found' });
    }
    
    if (req.user.role !== 'admin' && corporate.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = { entityType: 'corporate', entityId: corporateId };
    if (status) query.status = status;
    if (year) query['period.year'] = parseInt(year);
    if (month) query['period.month'] = parseInt(month);
    
    const skip = (page - 1) * limit;
    
    const [commissions, total, summary] = await Promise.all([
      Commission.find(query)
        .populate('stationId', 'name location')
        .populate('bookingId', 'startTime endTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Commission.countDocuments(query),
      Commission.getSummary(query)
    ]);
    
    res.json({
      success: true,
      data: {
        commissions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        },
        summary: summary[0] || {
          totalCommission: 0,
          totalNet: 0,
          pendingCommission: 0,
          paidCommission: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching corporate commissions:', error);
    res.status(500).json({ message: 'Error fetching commissions', error: error.message });
  }
};

// Get monthly summary
export const getMonthlyCommissionSummary = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    // Verify access
    if (entityType === 'franchise') {
      const franchise = await Franchise.findById(entityId);
      if (!franchise) {
        return res.status(404).json({ message: 'Franchise not found' });
      }
      if (req.user.role !== 'admin' && franchise.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (entityType === 'corporate') {
      const corporate = await Corporate.findById(entityId);
      if (!corporate) {
        return res.status(404).json({ message: 'Corporate not found' });
      }
      if (req.user.role !== 'admin' && corporate.adminId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const summary = await Commission.getMonthlySummary(entityType, entityId, parseInt(year));
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
};

// Admin: Approve commission
export const approveCommission = async (req, res) => {
  try {
    const { commissionId } = req.params;
    
    const commission = await Commission.findById(commissionId);
    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' });
    }
    
    if (commission.status !== 'pending') {
      return res.status(400).json({ message: 'Commission is not in pending status' });
    }
    
    commission.status = 'approved';
    await commission.save();
    
    res.json({
      success: true,
      message: 'Commission approved successfully',
      data: commission
    });
  } catch (error) {
    console.error('Error approving commission:', error);
    res.status(500).json({ message: 'Error approving commission', error: error.message });
  }
};

// Admin: Mark commission as paid
export const markCommissionPaid = async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { paymentMethod, paymentReference, paymentDate, notes } = req.body;
    
    const commission = await Commission.findById(commissionId);
    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' });
    }
    
    if (commission.status !== 'approved') {
      return res.status(400).json({ message: 'Commission must be approved before marking as paid' });
    }
    
    commission.status = 'paid';
    commission.paymentMethod = paymentMethod;
    commission.paymentReference = paymentReference;
    commission.paymentDate = paymentDate || new Date();
    if (notes) commission.notes = notes;
    
    await commission.save();
    
    res.json({
      success: true,
      message: 'Commission marked as paid successfully',
      data: commission
    });
  } catch (error) {
    console.error('Error marking commission as paid:', error);
    res.status(500).json({ message: 'Error updating commission', error: error.message });
  }
};

// Admin: Get all commissions
export const getAllCommissions = async (req, res) => {
  try {
    const { status, entityType, year, month, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (entityType) query.entityType = entityType;
    if (year) query['period.year'] = parseInt(year);
    if (month) query['period.month'] = parseInt(month);
    
    const skip = (page - 1) * limit;
    
    const [commissions, total, summary] = await Promise.all([
      Commission.find(query)
        .populate('stationId', 'name location')
        .populate('ownerId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Commission.countDocuments(query),
      Commission.getSummary(query)
    ]);
    
    res.json({
      success: true,
      data: {
        commissions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        },
        summary: summary[0] || {
          totalCommission: 0,
          totalNet: 0,
          pendingCommission: 0,
          paidCommission: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all commissions:', error);
    res.status(500).json({ message: 'Error fetching commissions', error: error.message });
  }
};

// Get commission dashboard stats
export const getCommissionStats = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    // Verify access
    if (entityType === 'franchise') {
      const franchise = await Franchise.findById(entityId);
      if (!franchise || (req.user.role !== 'admin' && franchise.ownerId.toString() !== req.user._id.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (entityType === 'corporate') {
      const corporate = await Corporate.findById(entityId);
      if (!corporate || (req.user.role !== 'admin' && corporate.adminId.toString() !== req.user._id.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const [
      totalStats,
      monthlyStats,
      yearlyStats,
      recentCommissions
    ] = await Promise.all([
      Commission.getSummary({ entityType, entityId }),
      Commission.getSummary({ 
        entityType, 
        entityId, 
        'period.year': currentYear,
        'period.month': currentMonth 
      }),
      Commission.getMonthlySummary(entityType, entityId, currentYear),
      Commission.find({ entityType, entityId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('stationId', 'name')
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalStats[0] || {},
        thisMonth: monthlyStats[0] || {},
        yearlyBreakdown: yearlyStats,
        recentCommissions
      }
    });
  } catch (error) {
    console.error('Error fetching commission stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

export default {
  generateCommissionFromBooking,
  getFranchiseCommissions,
  getCorporateCommissions,
  getMonthlyCommissionSummary,
  approveCommission,
  markCommissionPaid,
  getAllCommissions,
  getCommissionStats
};
