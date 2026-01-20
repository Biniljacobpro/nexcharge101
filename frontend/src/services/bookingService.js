const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

/**
 * Get smart charging recommendation
 * @param {string} vehicleId - Vehicle ID
 * @param {string} stationId - Station ID
 * @param {number} currentCharge - Current charge level (0-100)
 * @param {number} duration - Duration in hours
 * @returns {Promise<object>} Recommendation data
 */
export const getChargingRecommendation = async (vehicleId, stationId, currentCharge, duration) => {
  try {
    const token = localStorage.getItem('accessToken');
    console.log('Token found:', !!token);
    if (!token) throw new Error('No authentication token found');
    
    // Validate parameters
    if (!vehicleId || !stationId || currentCharge === undefined || duration === undefined) {
      throw new Error('Missing required parameters');
    }
    
    const url = `${API_BASE}/bookings/recommendation?vehicleId=${encodeURIComponent(vehicleId)}&stationId=${encodeURIComponent(stationId)}&currentCharge=${encodeURIComponent(currentCharge)}&duration=${encodeURIComponent(duration)}`;
    console.log('Fetching recommendation from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    // Handle case where response is not JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.log('Non-JSON response:', text);
      throw new Error(`Server returned non-JSON response: ${text}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) throw new Error(data.message || 'Failed to get recommendation');
    
    return data;
  } catch (error) {
    console.error('Error getting charging recommendation:', error);
    throw error;
  }
};