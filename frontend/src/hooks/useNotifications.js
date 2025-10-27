import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

export const useNotifications = (refreshInterval = 60000) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      console.log('Fetching notifications from:', `${API_BASE}/notifications?page=${page}&limit=${limit}`);
      const response = await fetch(`${API_BASE}/notifications?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders()
      });

      const result = await response.json();
      console.log('Notifications API response:', result);
      
      if (result.success) {
        console.log(`Received ${result.data.notifications.length} notifications, unread count: ${result.data.unreadCount}`);
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
        setError(null);
      } else {
        console.error('API returned error:', result.message);
        setError(result.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Network error fetching notifications:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    try {
      console.log('Fetching unread count from:', `${API_BASE}/notifications/unread-count`);
      const response = await fetch(`${API_BASE}/notifications/unread-count`, {
        headers: getAuthHeaders()
      });

      const result = await response.json();
      console.log('Unread count API response:', result);
      
      if (result.success) {
        console.log('Updating unread count to:', result.data.unreadCount);
        setUnreadCount(result.data.unreadCount);
      } else {
        console.error('API returned error for unread count:', result.message);
      }
    } catch (err) {
      console.error('Network error fetching unread count:', err);
    }
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds) => {
    try {
      const response = await fetch(`${API_BASE}/notifications/mark-read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notificationIds })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification._id) 
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
        return true;
      } else {
        throw new Error(result.message || 'Failed to mark as read');
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            isRead: true, 
            readAt: new Date() 
          }))
        );
        setUnreadCount(0);
        return true;
      } else {
        throw new Error(result.message || 'Failed to mark all as read');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        // Decrease unread count if notification was unread
        const notification = notifications.find(n => n._id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return true;
      } else {
        throw new Error(result.message || 'Failed to delete notification');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, [notifications]);

  // Initial fetch
  useEffect(() => {
    console.log('Initial fetch of notifications');
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up interval for unread count updates
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    console.log('Setting up interval for unread count updates');
    const interval = setInterval(fetchUnreadCount, refreshInterval);
    return () => {
      console.log('Clearing interval');
      clearInterval(interval);
    };
  }, [fetchUnreadCount, refreshInterval]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications
  };
};

export default useNotifications;