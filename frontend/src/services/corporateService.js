const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

class CorporateService {
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

  // Dashboard data
  async getDashboardData() {
    return this.makeRequest('/corporate/dashboard');
  }

  // Analytics
  async getAnalytics(period = 'month') {
    return this.makeRequest(`/corporate/analytics?period=${period}`);
  }

  // Recent bookings
  async getRecentBookings(limit = 10) {
    return this.makeRequest(`/corporate/bookings/recent?limit=${limit}`);
  }

  // Franchise management
  async getFranchiseOwners(page = 1, limit = 10, status = '', search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(search && { search }),
      _: Date.now().toString() // cache-buster to avoid 304 cached payload after mutations
    });
    return this.makeRequest(`/corporate/franchises?${params}`);
  }

  async getCorporateStations() {
    return this.makeRequest('/corporate/stations');
  }

  async updateCorporateStationStatus(stationId, status) {
    return this.makeRequest(`/corporate/stations/${stationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Corporate info
  async getCorporateInfo() {
    return this.makeRequest('/corporate/info');
  }

  async updateCorporateName(name) {
    return this.makeRequest('/corporate/info/name', {
      method: 'PATCH',
      body: JSON.stringify({ name })
    });
  }

  async addFranchiseOwner(franchiseData) {
    return this.makeRequest('/corporate/franchises', {
      method: 'POST',
      body: JSON.stringify(franchiseData),
    });
  }

  async updateFranchiseOwner(franchiseId, franchiseData) {
    return this.makeRequest(`/corporate/franchises/${franchiseId}`, {
      method: 'PUT',
      body: JSON.stringify(franchiseData),
    });
  }

  async deleteFranchiseOwner(franchiseId) {
    return this.makeRequest(`/corporate/franchises/${franchiseId}`, {
      method: 'DELETE',
    });
  }

  // User management
  async getCorporateUsers() {
    return this.makeRequest('/corporate/users');
  }

  async updateCorporateUserStatus(userId, isActive) {
    return this.makeRequest(`/corporate/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
  }


  // Future-ready methods for extensibility
  async getStationAnalytics(stationId) {
    return this.makeRequest(`/corporate/stations/${stationId}/analytics`);
  }

  async getRevenueReport(startDate, endDate) {
    return this.makeRequest(`/corporate/reports/revenue?start=${startDate}&end=${endDate}`);
  }

  async getFranchisePerformance(franchiseId) {
    return this.makeRequest(`/corporate/franchises/${franchiseId}/performance`);
  }

  async updateCorporateSettings(settings) {
    return this.makeRequest('/corporate/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getNotifications() {
    return this.makeRequest('/corporate/notifications');
  }

  async markNotificationAsRead(notificationId) {
    return this.makeRequest(`/corporate/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async exportData(type, format = 'csv') {
    return this.makeRequest(`/corporate/export/${type}?format=${format}`);
  }

  async getSystemHealth() {
    return this.makeRequest('/corporate/health');
  }

  async getAuditLogs(page = 1, limit = 20) {
    return this.makeRequest(`/corporate/audit-logs?page=${page}&limit=${limit}`);
  }
}

export default new CorporateService();

