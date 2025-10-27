import { authFetch } from '../utils/api';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

export const stationManagerService = {
  // Get dashboard data
  getDashboardData: async () => {
    try {
      const response = await authFetch(`${API_BASE}/station-manager/dashboard`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch dashboard data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Get station bookings
  getStationBookings: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.date) queryParams.append('date', params.date);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await authFetch(`${API_BASE}/station-manager/bookings?${queryParams}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch bookings');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status, notes = '') => {
    try {
      const response = await authFetch(`${API_BASE}/station-manager/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update booking status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  // Get performance reports
  getPerformanceReports: async (period = '30d') => {
    try {
      const response = await authFetch(`${API_BASE}/station-manager/reports?period=${period}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch performance reports');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching performance reports:', error);
      throw error;
    }
  },

  // Get station details by ID
  getStationDetails: async (stationId) => {
    const response = await authFetch(`${API_BASE}/station-manager/stations/${stationId}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch station details');
    }
    return await response.json();
  },

  // Update station details with whitelisted fields
  updateStationDetails: async (stationId, payload) => {
    const response = await authFetch(`${API_BASE}/station-manager/stations/${stationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update station');
    }
    return await response.json();
  },

  // Upload station images
  uploadStationImages: async (stationId, files) => {
    const formData = new FormData();
    [...files].forEach((file) => formData.append('images', file));
    const response = await authFetch(`${API_BASE}/station-manager/stations/${stationId}/images`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to upload images');
    }
    return await response.json();
  },

  // Delete a station image by URL
  deleteStationImage: async (stationId, url) => {
    const response = await authFetch(`${API_BASE}/station-manager/stations/${stationId}/images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete image');
    }
    return await response.json();
  },

  // Get maintenance predictions
  getMaintenancePredictions: async () => {
    try {
      const response = await authFetch(`${API_BASE}/station-manager/maintenance-predictions`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch maintenance predictions');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching maintenance predictions:', error);
      throw error;
    }
  }
};

export default stationManagerService;
