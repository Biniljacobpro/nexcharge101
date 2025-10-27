import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  // User who should receive the notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Notification details
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['booking_confirmed', 'booking_cancelled', 'payment_success', 'payment_failed', 'booking_reminder', 'booking_completed', 'system', 'promotion', 'admin_action', 'user_status_changed', 'corporate_admin_added', 'vehicle_added', 'station_status_changed', 'vehicle_request_submitted', 'vehicle_request_status_changed', 'franchise_owner_added'],
    required: true,
    index: true
  },

  // Status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  // Related data
  relatedBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  relatedStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station'
  },

  // Action data for navigation
  actionType: {
    type: String,
    enum: ['navigate_to_bookings', 'navigate_to_station', 'navigate_to_payment', 'none'],
    default: 'none'
  },
  actionData: {
    type: mongoose.Schema.Types.Mixed // Can store URLs, IDs, etc.
  },

  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  readAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, isDeleted: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for time ago
NotificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  return await notification.save();
};

// Static method to mark as read
NotificationSchema.statics.markAsRead = async function(userId, notificationIds) {
  return await this.updateMany(
    { 
      userId, 
      _id: { $in: notificationIds },
      isDeleted: false 
    },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    userId,
    isRead: false,
    isDeleted: false
  });
};

export default mongoose.model('Notification', NotificationSchema);




