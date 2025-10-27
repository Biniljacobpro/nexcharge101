import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

// Custom hook for real-time availability of multiple stations
export const useRealTimeAvailability = (stationIds, refreshInterval = 30000) => {
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAvailability = useCallback(async () => {
    // Only fetch if we have station IDs
    if (!stationIds || stationIds.length === 0) return;

    try {
      setLoading(true);
      console.log(`Fetching availability for ${stationIds.length} stations at ${new Date().toLocaleTimeString()}`);
      
      const response = await fetch(`${API_BASE}/availability/stations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stationIds })
      });

      const result = await response.json();
      
      if (result.success) {
        setAvailability(result.data);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch availability');
      }
    } catch (err) {
      setError(err.message || 'Network error');
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(stationIds)]); // Stringify to properly compare arrays

  // Initial fetch
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Set up interval for real-time updates
  useEffect(() => {
    // Don't set up interval if refreshInterval is not valid
    if (!refreshInterval || refreshInterval <= 0) return;

    console.log(`Setting up availability refresh interval: ${refreshInterval}ms`);
    const interval = setInterval(fetchAvailability, refreshInterval);
    
    // Cleanup function
    return () => {
      console.log('Clearing availability refresh interval');
      clearInterval(interval);
    };
  }, [fetchAvailability, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    availability,
    loading,
    error,
    refresh
  };
};

// Custom hook for single station availability
export const useSingleStationAvailability = (stationId, refreshInterval = 30000) => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAvailability = useCallback(async () => {
    if (!stationId) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/availability/station/${stationId}`);
      const result = await response.json();
      
      if (result.success) {
        setAvailability(result.data);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch availability');
      }
    } catch (err) {
      setError(err.message || 'Network error');
      console.error('Error fetching station availability:', err);
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  // Initial fetch
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Set up interval for real-time updates
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(fetchAvailability, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAvailability, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    availability,
    loading,
    error,
    refresh
  };
};

export default useRealTimeAvailability;