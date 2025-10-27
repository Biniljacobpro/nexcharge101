import { authFetch } from '../utils/api';

// Always call the backend API host, not a relative path to the frontend
const API_BASE = `${process.env.REACT_APP_API_BASE || 'http://localhost:4000/api'}/franchise-owner`;

export const franchiseOwnerService = {
  // Get dashboard overview data
  getDashboardData: async () => {
    try {
      const response = await authFetch(`${API_BASE}/dashboard`);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      if (!response.ok) {
        if (isJson) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || err.error || 'Failed to fetch dashboard data');
        }
        throw new Error(`Request failed with status ${response.status}`);
      }
      return isJson ? await response.json() : {};
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Get analytics data
  getAnalytics: async (period = '7d') => {
    try {
      const response = await authFetch(`${API_BASE}/analytics?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  },

  // Get stations list
  getStations: async () => {
    try {
      const response = await authFetch(`${API_BASE}/stations`);
      if (!response.ok) {
        throw new Error('Failed to fetch stations');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching stations:', error);
      throw error;
    }
  },

  // Add new station
  addStation: async (stationData) => {
    try {
      const response = await authFetch(`${API_BASE}/stations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stationData),
      });
      if (!response.ok) {
        throw new Error('Failed to add station');
      }
      return await response.json();
    } catch (error) {
      console.error('Error adding station:', error);
      throw error;
    }
  },

  // Update station
  updateStation: async (stationId, stationData) => {
    try {
      const response = await authFetch(`${API_BASE}/stations/${stationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stationData),
      });
      if (!response.ok) {
        throw new Error('Failed to update station');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating station:', error);
      throw error;
    }
  },

  // Delete station
  deleteStation: async (stationId) => {
    try {
      const response = await authFetch(`${API_BASE}/stations/${stationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete station');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting station:', error);
      throw error;
    }
  },

  // Get compliance status
  getComplianceStatus: async () => {
    try {
      const response = await authFetch(`${API_BASE}/compliance`);
      if (!response.ok) {
        throw new Error('Failed to fetch compliance status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching compliance status:', error);
      throw error;
    }
  },

  // Get promotions
  getPromotions: async () => {
    try {
      const response = await authFetch(`${API_BASE}/promotions`);
      if (!response.ok) {
        throw new Error('Failed to fetch promotions');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw error;
    }
  },

  // Station managers
  getStationManagers: async () => {
    try {
      const response = await authFetch(`${API_BASE}/managers`);
      if (!response.ok) throw new Error('Failed to fetch station managers');
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.error('Error fetching station managers:', error);
      throw error;
    }
  },

  addStationManager: async (managerData) => {
    try {
      const response = await authFetch(`${API_BASE}/managers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(managerData)
      });
      const isJson = response.headers.get('content-type')?.includes('application/json');
      if (!response.ok) {
        const err = isJson ? await response.json().catch(() => ({})) : {};
        throw new Error(err.message || err.error || 'Failed to add station manager');
      }
      return isJson ? await response.json() : {};
    } catch (error) {
      console.error('Error adding station manager:', error);
      throw error;
    }
  },

  updateStationManager: async (managerId, managerData) => {
    try {
      const response = await authFetch(`${API_BASE}/managers/${managerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(managerData)
      });
      if (!response.ok) throw new Error('Failed to update station manager');
      return await response.json();
    } catch (error) {
      console.error('Error updating station manager:', error);
      throw error;
    }
  },

  deleteStationManager: async (managerId) => {
    try {
      const response = await authFetch(`${API_BASE}/managers/${managerId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete station manager');
      return await response.json();
    } catch (error) {
      console.error('Error deleting station manager:', error);
      throw error;
    }
  },

  // Create promotion
  createPromotion: async (promotionData) => {
    try {
      const response = await authFetch(`${API_BASE}/promotions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promotionData),
      });
      if (!response.ok) {
        throw new Error('Failed to create promotion');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  },

  // Update promotion
  updatePromotion: async (promotionId, promotionData) => {
    try {
      const response = await authFetch(`${API_BASE}/promotions/${promotionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promotionData),
      });
      if (!response.ok) {
        throw new Error('Failed to update promotion');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }
  },

  // Delete promotion
  deletePromotion: async (promotionId) => {
    try {
      const response = await authFetch(`${API_BASE}/promotions/${promotionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete promotion');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await authFetch(`${API_BASE}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });
      if (!response.ok) {
        throw new Error('Failed to change password');
      }
      return await response.json();
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await authFetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Station manager assignment functions
  getAvailableStationManagers: async () => {
    try {
      const response = await authFetch(`${API_BASE}/managers/available`);
      if (!response.ok) {
        throw new Error('Failed to fetch available station managers');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching available station managers:', error);
      throw error;
    }
  },

  getUnassignedStations: async () => {
    try {
      const response = await authFetch(`${API_BASE}/stations/unassigned`);
      if (!response.ok) {
        throw new Error('Failed to fetch unassigned stations');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching unassigned stations:', error);
      throw error;
    }
  },

  assignStationToManager: async (managerId, stationId) => {
    try {
      const response = await authFetch(`${API_BASE}/assign-station`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managerId, stationId }),
      });
      if (!response.ok) {
        throw new Error('Failed to assign station to manager');
      }
      return await response.json();
    } catch (error) {
      console.error('Error assigning station to manager:', error);
      throw error;
    }
  },

  unassignStationFromManager: async (managerId, stationId) => {
    try {
      const response = await authFetch(`${API_BASE}/unassign-station`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managerId, stationId }),
      });
      if (!response.ok) {
        throw new Error('Failed to unassign station from manager');
      }
      return await response.json();
    } catch (error) {
      console.error('Error unassigning station from manager:', error);
      throw error;
    }
  }
};
