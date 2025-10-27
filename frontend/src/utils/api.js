const API_BASE = process.env.REACT_APP_API_BASE || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://nexcharge-qu9o.vercel.app/api' 
    : 'http://localhost:4000/api');

const getTokens = () => ({
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
});

const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

// Admin Station Management API
export const adminGetStations = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const res = await authFetch(`${API_BASE}/admin/stations${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to load stations');
  return data.data || [];
};

export const adminUpdateStationStatus = async (id, status) => {
  const res = await authFetch(`${API_BASE}/admin/stations/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to update station status');
  return data.data;
};

export const adminUpdateStationManager = async (id, managerId) => {
  const res = await authFetch(`${API_BASE}/admin/stations/${id}/manager`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managerId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to update station manager');
  return data.data;
};

export const signupApi = async ({ firstName, lastName, email, password }) => {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Signup failed');
  setTokens(data);
  return data;
};

// EV User vehicles (multiple)
export const getMyVehiclesApi = async () => {
  const res = await authFetch(`${API_BASE}/auth/my-vehicles`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to load vehicles');
  return data.data || [];
};

export const addUserVehicleApi = async ({ make, model, year, batteryCapacity, preferredChargingType, chargingAC, chargingDC }) => {
  const res = await authFetch(`${API_BASE}/auth/my-vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ make, model, year, batteryCapacity, preferredChargingType, chargingAC, chargingDC })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to add vehicle');
  return data.data || [];
};

export const removeUserVehicleApi = async (index) => {
  const res = await authFetch(`${API_BASE}/auth/my-vehicles/${index}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to remove vehicle');
  return data.data || [];
};

export const updateUserVehicleAtIndexApi = async (index, payload) => {
  const res = await authFetch(`${API_BASE}/auth/my-vehicles/${index}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to update vehicle');
  return data.data || [];
};

export const loginApi = async ({ email, password }) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Login failed');
    err.status = res.status;
    throw err;
  }
  setTokens(data);
  return data;
};

export const googleLoginApi = async (idToken) => {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google sign-in failed');
  setTokens(data);
  return data;
};

export const refreshAccessToken = async () => {
  const { refreshToken } = getTokens();
  if (!refreshToken) throw new Error('No refresh token');
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Refresh failed');
  setTokens({ accessToken: data.accessToken });
  return data.accessToken;
};

export const authFetch = async (url, options = {}) => {
  const { accessToken } = getTokens();
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }
  });
  
  // Handle password change required
  if (res.status === 428) {
    // Check user role to redirect to appropriate password reset page
    try {
      const userData = await getMe();
      if (userData.role === 'station_manager') {
        window.location.href = '/station-manager/password-reset';
      } else {
        window.location.href = '/first-login-reset';
      }
    } catch (error) {
      // Fallback to general password reset if we can't determine role
      window.location.href = '/first-login-reset';
    }
    return res;
  }
  
  if (res.status !== 401) return res;
  const newAT = await refreshAccessToken();
  return fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${newAT}` } });
};

// Admin API
export const getMe = async () => {
  const res = await authFetch(`${API_BASE}/auth/me`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load profile');
  return data.user;
};

export const adminOverview = async () => {
  const res = await authFetch(`${API_BASE}/admin/overview`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load overview');
  return data;
};

export const adminLiveStats = async () => {
  const res = await authFetch(`${API_BASE}/admin/stats/live`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to load live stats');
  return data.data || { 
    activeStations: 0, 
    totalRevenue: 0, 
    totalPayments: 0, 
    liveChargingSessions: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenueChart: []
  };
};

// Payments API
export const getMyPaymentsApi = async () => {
  const res = await authFetch(`${API_BASE}/payments/my`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to load payments');
  return Array.isArray(data?.data) ? data.data : [];
};

export const downloadReceiptPdf = async (bookingId) => {
  const url = `${API_BASE}/payments/receipt/${encodeURIComponent(bookingId)}`;
  const res = await authFetch(url, { method: 'GET' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'Failed to download receipt');
  }
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `receipt_${bookingId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const adminUsers = async () => {
  const res = await authFetch(`${API_BASE}/admin/users`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load users');
  return data.users;
};

export const adminUpdateUserStatus = async (id, isActive) => {
  const res = await authFetch(`${API_BASE}/admin/users/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user status');
  return data;
};

// Corporate Applications API
// Deprecated corporate applications API removed

// Corporate Admin Management API
export const getCorporateAdmins = async () => {
  const res = await authFetch(`${API_BASE}/admin/corporate-admins`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load corporate admins');
  return data.admins;
};

export const addCorporateAdmin = async (corporateData) => {
  const res = await authFetch(`${API_BASE}/admin/add-corporate-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corporateData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add corporate admin');
  return data;
};

export const updateCorporateAdminStatusApi = async (id, isActive) => {
  const res = await authFetch(`${API_BASE}/admin/corporate-admins/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update status');
  return data;
};

// Profile API
export const updateProfileApi = async (profileData) => {
  const res = await authFetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data;
};

export const setUserVehicleApi = async ({ make, model, year, batteryCapacity, preferredChargingType, chargingAC, chargingDC, specifications }) => {
  const res = await authFetch(`${API_BASE}/auth/user-vehicle`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ make, model, year, batteryCapacity, preferredChargingType, chargingAC, chargingDC, specifications })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to update user vehicle');
  return data;
};

export const updatePasswordApi = async (passwordData) => {
  const res = await authFetch(`${API_BASE}/auth/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passwordData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update password');
  return data;
};

export const updateProfileImageApi = async (imageUrl) => {
  const res = await authFetch(`${API_BASE}/auth/profile-image`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileImage: imageUrl })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile image');
  return data;
};

export const uploadProfileImageApi = async (file) => {
  const formData = new FormData();
  formData.append('profileImage', file);

  const { accessToken } = getTokens();
  const res = await fetch(`${API_BASE}/auth/upload-profile-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });
  
  if (res.status === 401) {
    const newAT = await refreshAccessToken();
    const retryRes = await fetch(`${API_BASE}/auth/upload-profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${newAT}`
      },
      body: formData
    });
    const data = await retryRes.json();
    if (!retryRes.ok) throw new Error(data.error || 'Failed to upload profile image');
    return data;
  }
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload profile image');
  return data;
};

// Forgot password (OTP) API
export const requestPasswordResetOtpApi = async (email) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to request OTP');
  return data;
};

export const verifyPasswordResetOtpApi = async (email, otp) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Invalid OTP');
  return data;
};

export const resetPasswordWithOtpApi = async (email, newPassword) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to reset password');
  return data;
};

// Public: check if email is already registered (for live validation)
export const checkEmailAvailabilityApi = async (email) => {
  const res = await fetch(`${API_BASE}/auth/check-email?email=${encodeURIComponent(email)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Email check failed');
  return data; // { success: true, isAvailable: boolean }
};

// Vehicles (Admin)
export const getVehiclesApi = async () => {
  const res = await authFetch(`${API_BASE}/vehicles`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load vehicles');
  return data;
};

export const createVehicleApi = async (payload) => {
  const res = await authFetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.errors && Array.isArray(data.errors)) {
      throw new Error(`Validation error: ${data.errors.join(', ')}`);
    }
    throw new Error(data.error || data.message || 'Failed to create vehicle');
  }
  return data;
};

export const updateVehicleApi = async (id, payload) => {
  const res = await authFetch(`${API_BASE}/vehicles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.errors && Array.isArray(data.errors)) {
      throw new Error(`Validation error: ${data.errors.join(', ')}`);
    }
    throw new Error(data.error || data.message || 'Failed to update vehicle');
  }
  return data;
};

export const deleteVehicleApi = async (id, hardDelete = false) => {
  const res = await authFetch(`${API_BASE}/vehicles/${id}?hardDelete=${hardDelete ? 'true' : 'false'}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete vehicle');
  return data;
};

// Vehicle Requests
export const createVehicleRequestApi = async ({ make, model }) => {
  const res = await authFetch(`${API_BASE}/vehicle-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ make, model })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to submit vehicle request');
  return data;
};

export const getVehicleRequestsApi = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const res = await authFetch(`${API_BASE}/vehicle-requests${qs ? `?${qs}` : ''}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to load vehicle requests');
  return data;
};

export const updateVehicleRequestStatusApi = async (id, { status, notes }) => {
  const res = await authFetch(`${API_BASE}/vehicle-requests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to update vehicle request');
  return data;
};

export const deleteVehicleRequestApi = async (id) => {
  const res = await authFetch(`${API_BASE}/vehicle-requests/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete vehicle request');
  return data;
};

export const getModelsByMakeApi = async (make) => {
  const url = `${API_BASE}/vehicles/models?make=${encodeURIComponent(make)}`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to load models');
  return data.data || [];
};

export const getCapacitiesByMakeModelApi = async (make, model) => {
  const url = `${API_BASE}/vehicles/capacities?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to load capacities');
  return data.data || [];
};

export const getMakesApi = async () => {
  const url = `${API_BASE}/vehicles/makes`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to load makes');
  return data.data || [];
};

// Public stations listing
export const getPublicStationsApi = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}/public/stations${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load stations');
  return data;
};

// Bookings
export const updateBookingApi = async (bookingId, payload) => {
  const res = await authFetch(`${API_BASE}/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to update booking');
  return data;
};

export const cancelBookingApi = async (bookingId, reason) => {
  const res = await authFetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to cancel booking');
  return data;
};

// OTP and charging functions
export const generateOTPApi = async (bookingId) => {
  const res = await authFetch(`${API_BASE}/bookings/${bookingId}/generate-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to generate OTP');
  return data;
};

export const verifyOTPApi = async (bookingId, otp) => {
  const res = await authFetch(`${API_BASE}/bookings/${bookingId}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to verify OTP');
  return data;
};

export const stopChargingApi = async (bookingId) => {
  const res = await authFetch(`${API_BASE}/bookings/${bookingId}/stop-charging`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to stop charging');
  return data;
};

export default API_BASE;
