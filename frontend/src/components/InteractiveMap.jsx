import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Container, 
  TextField, 
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Snackbar,
  Grid,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon, 
  MyLocation as MyLocationIcon,
  Directions as DirectionsIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './InteractiveMap.css';

const DEFAULT_LOCATION = { lat: 20.5937, lng: 78.9629 }; // Center of India

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const InteractiveMap = ({ compact = false, height }) => {
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [map, setMap] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState('');
  const geolocationTimeoutRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const stationMarkersRef = useRef([]);

  // Handle station navigation
  const handleStationNavigation = useRef((event) => {
    const stationId = event.detail;
    navigate(`/station/${stationId}`);
  });

  useEffect(() => {
    // Start with default location
    setCurrentLocation(DEFAULT_LOCATION);
    setAlertMessage('Loading nearby stations for India. Enable location access for precise results.');
    setAlertType('info');
    setShowAlert(true);

    if (!navigator.geolocation) {
      setAlertMessage('Location services not supported. Using default view.');
      setAlertType('warning');
      return;
    }

    geolocationTimeoutRef.current = setTimeout(() => {
      setAlertMessage('Unable to detect your location quickly. Showing default view.');
      setAlertType('warning');
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (geolocationTimeoutRef.current) {
          clearTimeout(geolocationTimeoutRef.current);
        }
        const { latitude, longitude } = position.coords;
        const userLocation = { lat: latitude, lng: longitude };
        setCurrentLocation(userLocation);
        setAlertMessage('Location detected successfully!');
        setAlertType('success');
        setShowAlert(true);
        
        // Update map view to user's location
        if (map) {
          map.setView([latitude, longitude], 13);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setAlertMessage('Unable to access your location. Showing default stations.');
        setAlertType('warning');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );

    return () => {
      if (geolocationTimeoutRef.current) {
        clearTimeout(geolocationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentLocation && !map) {
      try {
        setIsLoading(true);
        setMapError('');

        // Ensure the container is free from a previous Leaflet instance
        if (mapRef.current && mapRef.current._leaflet_id) {
          try { mapRef.current._leaflet_id = null; } catch (_) {}
        }

        // Initialize map with current location as center
        const newMap = L.map(mapRef.current).setView([currentLocation.lat, currentLocation.lng], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(newMap);

        // Add current location marker
        const currentLocationIcon = L.divIcon({
          className: 'custom-current-location',
          html: '<div style="background-color: #00D4AA; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        const currentMarker = L.marker([currentLocation.lat, currentLocation.lng], { icon: currentLocationIcon })
          .addTo(newMap)
          .bindPopup('<b>Your Location</b><br>You are here')
          .openPopup();
          
        currentMarkerRef.current = currentMarker;

        // Fetch real stations from backend
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
        fetch(`${apiBase}/public/stations`)
          .then(async (res) => {
            if (!res.ok) throw new Error(`Failed to load stations: ${res.status}`);
            const body = await res.json();
            const stations = (body?.data || []).map((s, index) => {
              // Extract coordinates properly
              let lat = 0;
              let lng = 0;
              
              // Handle different coordinate formats
              if (s.location?.coordinates) {
                if (Array.isArray(s.location.coordinates)) {
                  // [longitude, latitude] format (GeoJSON)
                  lng = s.location.coordinates[0];
                  lat = s.location.coordinates[1];
                } else if (typeof s.location.coordinates === 'object') {
                  // { latitude, longitude } format
                  lat = s.location.coordinates.latitude || s.location.coordinates.lat || 0;
                  lng = s.location.coordinates.longitude || s.location.coordinates.lng || 0;
                }
              } else {
                // Fallback to direct properties
                lat = s.lat || s.latitude || 0;
                lng = s.lng || s.longitude || 0;
              }
              
              // Calculate available slots from chargers array if available
              let availableSlots = s.availableSlots ?? s.capacity?.availableSlots ?? 0;
              let totalChargers = s.capacity?.totalChargers ?? 0;
              
              // If we have chargers array, calculate available slots from it
              if (s.capacity?.chargers && Array.isArray(s.capacity.chargers)) {
                totalChargers = s.capacity.chargers.length;
                availableSlots = s.capacity.chargers.filter(charger => charger.isAvailable).length;
              }
              
              return {
                id: s.id || s._id || `station-${index}`,
                name: s.name || 'Unknown Station',
                lat: parseFloat(lat) || 0,
                lng: parseFloat(lng) || 0,
                type: (Array.isArray(s.capacity?.chargerTypes) && s.capacity.chargerTypes.length > 0) ? s.capacity.chargerTypes[0] : 'Various',
                available: availableSlots,
                total: totalChargers,
                pricePerMinute: (s.pricing?.pricePerMinute ?? s.pricing?.basePrice ?? 0),
                status: s.operational?.status || 'active',
                rating: s.analytics?.rating ?? 0, // Use actual rating from analytics with nullish coalescing
                amenities: s.amenities || []
              };
            });

            setNearbyStations(stations);
            setFilteredStations(stations);

            // Clear existing station markers
            stationMarkersRef.current.forEach(marker => {
              try {
                newMap.removeLayer(marker);
              } catch (e) {
                console.warn('Failed to remove marker:', e);
              }
            });
            stationMarkersRef.current = [];

            // Add charging station markers
            stations.forEach((station) => {
              // Skip stations with invalid coordinates
              if (!station.lat || !station.lng || (station.lat === 0 && station.lng === 0)) {
                console.warn('Skipping station with invalid coordinates:', station.name);
                return;
              }
              
              // Validate coordinate ranges
              if (station.lat < -90 || station.lat > 90 || station.lng < -180 || station.lng > 180) {
                console.warn('Skipping station with out-of-range coordinates:', station.name, station.lat, station.lng);
                return;
              }
              
              // Blue for available, red for full, orange for maintenance
              const color = station.status === 'maintenance'
                ? '#f59e0b'
                : (station.available > 0 ? '#2563eb' : '#dc2626');
              const stationIcon = L.divIcon({
                className: 'custom-station-marker',
                html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              });

              const marker = L.marker([station.lat, station.lng], { icon: stationIcon })
                .addTo(newMap)
                .bindPopup(`
                  <div style="min-width: 250px;">
                    <h4 style="margin: 0 0 8px 0; color: #1f2937;">${station.name}</h4>
                    <p style="margin: 4px 0; color: #6b7280;">
                      <strong>Type:</strong> ${station.type}
                    </p>
                    <p style="margin: 4px 0; color: #6b7280;">
                      <strong>Available:</strong> ${station.available}/${station.total} slots
                    </p>
                    <p style="margin: 4px 0; color: #6b7280;">
                      <strong>Price:</strong> ₹${station.pricePerMinute}/minute
                    </p>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                      <button
                        onclick="window.dispatchEvent(new CustomEvent('navigateToStation', { detail: '${station.id}' }))"
                        style="
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          border: none;
                          padding: 8px 16px;
                          border-radius: 6px;
                          cursor: pointer;
                          font-weight: 500;
                          flex: 1;
                        "
                      >
                        View Details
                      </button>
                      <button
                        onclick="window.location.href='/stations/${station.id}'"
                        style="
                          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                          color: white;
                          border: none;
                          padding: 8px 16px;
                          border-radius: 6px;
                          cursor: pointer;
                          font-weight: 500;
                          flex: 1;
                        "
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                `);

              // Add click event to center map on station
              marker.on('click', () => {
                newMap.setView([station.lat, station.lng], 16);
              });
              
              // Store reference to marker
              stationMarkersRef.current.push(marker);
            });
          })
          .catch((err) => {
            console.error('Failed loading stations:', err);
            setAlertMessage('Failed to load charging stations. Please try again later.');
            setAlertType('error');
          });

        // Add event listener for station navigation
        const navHandler = handleStationNavigation.current;
        window.addEventListener('navigateToStation', navHandler);

        setMap(newMap);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to load map. Please refresh the page.');
        setIsLoading(false);
      }
    }

    // Update map when currentLocation changes
    if (map && currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 13);
      
      // Update or create current location marker
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
      } else {
        const currentLocationIcon = L.divIcon({
          className: 'custom-current-location',
          html: '<div style="background-color: #00D4AA; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        const currentMarker = L.marker([currentLocation.lat, currentLocation.lng], { icon: currentLocationIcon })
          .addTo(map)
          .bindPopup('<b>Your Location</b><br>You are here')
          .openPopup();
          
        currentMarkerRef.current = currentMarker;
      }
    }

    return () => {
      if (map) {
        try { map.remove(); } catch (_) {}
      }
      // Clean up event listener
      const navHandler = handleStationNavigation.current;
      window.removeEventListener('navigateToStation', navHandler);
      // Clear marker references
      currentMarkerRef.current = null;
      stationMarkersRef.current = [];
      // Clear Leaflet id tag
      if (mapRef.current && mapRef.current._leaflet_id) {
        try { mapRef.current._leaflet_id = null; } catch (_) {}
      }
    };
  }, [currentLocation, map]);

  // Filter stations based on search and filter criteria
  useEffect(() => {
    let filtered = nearbyStations;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(station => station.type === filterType);
    }

    setFilteredStations(filtered);
  }, [searchTerm, filterType, nearbyStations]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterType(event.target.value);
  };

  const centerOnCurrentLocation = () => {
    if (map && currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 13);
      setAlertMessage('Centered on your location!');
      setAlertType('info');
      setShowAlert(true);
      
      // Open popup for current location marker
      if (currentMarkerRef.current) {
        currentMarkerRef.current.openPopup();
      }
    }
  };

  const getDirections = (station) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(url, '_blank');
  };

  if (!compact && mapError) {
    return (
      <Box sx={{ py: 6, background: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ fontSize: '1.1rem', py: 2 }}>
            {mapError}
          </Alert>
        </Container>
      </Box>
    );
  }

  if (compact) {
    return (
      <Box sx={{ position: 'relative' }}>
        {isLoading && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 1 }}>
            <CircularProgress size={40} />
          </Box>
        )}
        <Box ref={mapRef} sx={{ height: height || 400, width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 6, background: '#f8fafc' }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#1f2937', mb: 2 }}>
              Find Charging Stations Near You
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}>
              Discover nearby EV charging stations with real-time availability and detailed information
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField fullWidth placeholder="Search stations by name..." value={searchTerm} onChange={handleSearch} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }} sx={{ backgroundColor: 'white' }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Station Type</InputLabel>
                  <Select value={filterType} label="Station Type" onChange={handleFilterChange} sx={{ backgroundColor: 'white' }}>
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="DC Fast">DC Fast</MenuItem>
                    <MenuItem value="Level 2">Level 2</MenuItem>
                    <MenuItem value="Level 1">Level 1</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth variant="outlined" startIcon={<MyLocationIcon />} onClick={centerOnCurrentLocation} sx={{ height: 56, borderColor: '#00D4AA', color: '#00D4AA', '&:hover': { borderColor: '#009B7A', backgroundColor: 'rgba(0, 212, 170, 0.05)' } }}>My Location</Button>
              </Grid>
            </Grid>
          </Box>

          <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4, position: 'relative' }}>
            {isLoading && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1000 }}>
                <CircularProgress size={60} sx={{ color: '#00D4AA' }} />
              </Box>
            )}
            <Box ref={mapRef} sx={{ height: { xs: 400, md: 500 }, width: '100%', position: 'relative' }} />
          </Paper>

          {/* Nearby Stations Summary */}
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1f2937' }}>
                Nearby Charging Stations ({filteredStations.length})
              </Typography>
              <Chip label={`${filteredStations.filter(s => s.available > 0).length} Available`} color="success" variant="outlined" />
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              {filteredStations.map((station, index) => (
                <motion.div key={station.id || `station-${index}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                  <Paper elevation={2} sx={{ p: 3, pb: 2, borderRadius: 2, width: 320, height: 260, display: 'flex', flexDirection: 'column', border: '1px solid #e5e7eb', position: 'relative', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s ease', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' } }} onClick={() => navigate(`/stations/${station.id}`)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {station.name}
                        </Typography>
                        {station.status === 'maintenance' && (
                          <Box sx={{ ml: 0.5, px: 1, py: 0.25, borderRadius: 1, bgcolor: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            Under maintenance
                          </Box>
                        )}
                      </Box>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); getDirections(station); }} sx={{ color: '#00D4AA' }}>
                        <DirectionsIcon />
                      </IconButton>
                    </Box>
                    {(() => {
                      const typeMap = {
                        'type1': 'Type 1',
                        'type2': 'Type 2',
                        'bharat_ac_001': 'Bharat AC',
                        'bharat_dc_001': 'Bharat DC',
                        'ccs2': 'CCS-2',
                        'chademo': 'CHAdeMO',
                        'gbt_type6': 'GB/T',
                        'type7_leccs': 'Type-7',
                        'mcs': 'MCS',
                        'chaoji': 'ChaoJi'
                      };
                      const friendlyType = typeMap[String(station.type || '').toLowerCase()] || 'Various';
                      const priceStr = `₹${Number(station.pricePerMinute || 0).toFixed(2)}/min`;
                      const available = Number(station.available || 0);
                      const total = Number(station.total || 0);
                      const hasSpots = available > 0 && station.status !== 'maintenance';
                      return (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                            <Chip label={friendlyType} size="small" sx={{ backgroundColor: '#eef2ff', color: '#3730a3', fontWeight: 600 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#065f46' }}>{priceStr}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            {station.status === 'maintenance' ? (
                              <Chip label="Under maintenance" size="small" color="warning" variant="outlined" />
                            ) : hasSpots ? (
                              <Chip label="Available now" size="small" color="success" variant="outlined" />
                            ) : (
                              <Chip label="Currently full" size="small" color="error" variant="outlined" />
                            )}
                            {total > 0 && (
                              <Typography variant="caption" color="text.secondary">{available}/{total} free</Typography>
                            )}
                          </Box>
                        </>
                      );
                    })()}
                    {(() => {
                      const amenities = Array.isArray(station.amenities) ? station.amenities : [];
                      if (amenities.length === 0) return null;
                      const show = amenities.slice(0, 2).join(', ');
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mt: 1 }}>
                          Amenities: {show}{amenities.length > 2 ? ' +' : ''}
                        </Typography>
                      );
                    })()}
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mt: 0.5 }}>
                      ⭐ {(typeof station.rating === 'number' && !isNaN(station.rating) ? station.rating.toFixed(1) : '0.0')}/5
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigate(`/stations/${station.id}`); 
                      }}
                      disabled={station.status === 'maintenance'}
                      sx={{ 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        mt: 'auto',
                        mb: 0.5,
                        '&:hover': { 
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                          background: '#9ca3af'
                        }
                      }}
                    >
                      {station.status === 'maintenance' ? '🚧 Under Maintenance' : '⚡ Book now'}
                    </Button>
                  </Paper>
                </motion.div>
              ))}
            </Box>
          </Box>
        </motion.div>
      </Container>

      {/* Alert Snackbar */}
      <Snackbar open={showAlert} autoHideDuration={4000} onClose={() => setShowAlert(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setShowAlert(false)} severity={alertType} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InteractiveMap;