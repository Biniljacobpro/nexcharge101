import express from 'express';
import { 
  getUserNotifications, 
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(requireAuth);

// Get user notifications
router.get('/', getUserNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark notifications as read
router.patch('/mark-read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

export default router;
