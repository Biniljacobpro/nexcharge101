const API_BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

class AdminService {
  async makeRequest(endpoint, options = {}) {
    // Be resilient to different token key names used elsewhere in the app
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('jwt');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      // Handle authentication-related responses explicitly
      if (response.status === 428) {
        // Password change required on first login
        try {
          const data = await response.json();
          if (typeof window !== 'undefined') {
            window.location.href = '/first-login-reset';
          }
          throw new Error(data?.message || 'Password change required');
        } catch (_e) {
          if (typeof window !== 'undefined') {
            window.location.href = '/first-login-reset';
          }
          throw new Error('Password change required');
        }
      }

      if (response.status === 401) {
        // Unauthorized: likely missing/expired token
        try {
          const data = await response.json();
          if (typeof window !== 'undefined') {
            // Optionally clear bad token and redirect to login
            // Do not remove other app state
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('authToken');
            localStorage.removeItem('jwt');
            window.location.href = '/login';
          }
          throw new Error(data?.message || 'Unauthorized');
        } catch (_e) {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Unauthorized');
        }
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Fraud monitoring
  async getFraudLogs(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return this.makeRequest(`/admin/fraud-logs?${params}`);
  }

  async updateFraudLogStatus(logId, status) {
    return this.makeRequest(`/admin/fraud-logs/${logId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Dashboard data
  async getDashboardData() {
    return this.makeRequest('/admin/overview');
  }

  async getLiveStats() {
    return this.makeRequest('/admin/stats/live');
  }

  // Reports data
  async getReportsData(params = {}) {
    const urlParams = new URLSearchParams(params);
    return this.makeRequest(`/admin/reports?${urlParams}`);
  }

  // User management
  async getUsers() {
    return this.makeRequest('/admin/users');
  }

  async updateUserStatus(userId, isActive) {
    return this.makeRequest(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
  }

  // Corporate admin management
  async getCorporateAdmins() {
    return this.makeRequest('/admin/corporate-admins');
  }

  async addCorporateAdmin(adminData) {
    return this.makeRequest('/admin/add-corporate-admin', {
      method: 'POST',
      body: JSON.stringify(adminData)
    });
  }

  async updateCorporateAdminStatus(adminId, isActive) {
    return this.makeRequest(`/admin/corporate-admins/${adminId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
  }

  // Station management
  async getStations(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.makeRequest(`/admin/stations?${params}`);
  }

  async updateStationStatus(stationId, status) {
    return this.makeRequest(`/admin/stations/${stationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async updateStationManager(stationId, managerId) {
    return this.makeRequest(`/admin/stations/${stationId}/manager`, {
      method: 'PATCH',
      body: JSON.stringify({ managerId })
    });
  }
}

const adminService = new AdminService();

export default adminService;