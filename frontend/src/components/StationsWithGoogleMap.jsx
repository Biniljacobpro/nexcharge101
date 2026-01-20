import React, { useState, useCallback, useEffect } from 'react';
import { Box, Card, CardContent, CircularProgress, Alert, Typography, Chip } from '@mui/material';
import { GoogleMap, LoadScript, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';

// Keep libraries array as static to avoid LoadScript reloading
const GOOGLE_MAPS_LIBRARIES = ['geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946
};

const StationsWithGoogleMap = ({ 
  stations = [], 
  selectedStation = null, 
  onStationSelect,
  height = 440 
}) => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredStation, setHoveredStation] = useState(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Debug: Log stations when they change
  useEffect(() => {
    console.log('StationsWithGoogleMap received stations:', stations.length);
    if (stations.length > 0) {
      console.log('First station sample:', {
        name: stations[0].name,
        location: stations[0].location,
        lat: stations[0].lat,
        lng: stations[0].lng
      });
    }
  }, [stations]);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Use default location if geolocation fails
          setUserLocation(defaultCenter);
        }
      );
    } else {
      setUserLocation(defaultCenter);
    }
  }, []);

  const calculateDirections = useCallback(() => {
    if (!selectedStation || !userLocation || !isGoogleMapsLoaded) return;
    
    // Check if Google Maps API is fully loaded
    if (!window.google?.maps?.DirectionsService) {
      console.warn('Google Maps DirectionsService not available');
      setError('Maps service temporarily unavailable');
      return;
    }

    setLoading(true);
    setError('');

    const destination = {
      lat: selectedStation.location?.coordinates?.latitude || selectedStation.lat,
      lng: selectedStation.location?.coordinates?.longitude || selectedStation.lng
    };

    try {
      const directionsService = new window.google.maps.DirectionsService();
        
        directionsService.route(
          {
            origin: userLocation,
            destination: destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            setLoading(false);
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirections(result);
            } else {
              setError('Could not calculate directions');
              setDirections(null);
            }
          }
      );
      } catch (err) {
        console.error('Error calculating directions:', err);
        setLoading(false);
        setError('Failed to load directions service');
      }
  }, [selectedStation, userLocation, isGoogleMapsLoaded]);

  // Effect to calculate directions when map is loaded and station is selected
  React.useEffect(() => {
    if (isGoogleMapsLoaded && selectedStation && userLocation) {
      // Add a small delay to ensure DirectionsService is fully initialized
      const timer = setTimeout(() => {
        calculateDirections();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isGoogleMapsLoaded, selectedStation, userLocation, calculateDirections]);

  // Calculate directions when a station is selected
  useEffect(() => {
    if (selectedStation && userLocation && map) {
      // Small delay to ensure Google Maps API is ready
      const timer = setTimeout(() => {
        calculateDirections();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedStation, userLocation, map, calculateDirections]);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Adjust map bounds to show all stations and user location
  useEffect(() => {
    if (!map || !window.google || stations.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    
    // Add user location to bounds
    if (userLocation) {
      bounds.extend(userLocation);
    }
    
    // Add all stations to bounds
    stations.forEach((station) => {
      const lat = station.location?.coordinates?.latitude || 
                  station.location?.coordinates?.[1] || 
                  station.location?.latitude || 
                  station.lat;
      const lng = station.location?.coordinates?.longitude || 
                  station.location?.coordinates?.[0] || 
                  station.location?.longitude || 
                  station.lng;
      
      if (lat && lng && lat !== 0 && lng !== 0) {
        bounds.extend({ lat, lng });
      }
    });
    
    // Only fit bounds if we have valid stations
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, stations, userLocation]);

  const handleStationMarkerClick = (station) => {
    if (onStationSelect) {
      onStationSelect(station);
    }
  };

  if (!apiKey) {
    return (
      <Card elevation={3} sx={{ height }}>
        <CardContent sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Alert severity="error">
            Google Maps API key not configured
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show billing error message if Google Maps fails to load
  const handleMapError = () => {
    return (
      <Card elevation={3} sx={{ height }}>
        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Alert severity="warning" sx={{ mb: 2, width: '100%' }}>
            <strong>Google Maps Billing Required</strong>
          </Alert>
          <Box sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            <p>To use Google Maps, please:</p>
            <ol style={{ textAlign: 'left', margin: '16px 0' }}>
              <li>Go to Google Cloud Console</li>
              <li>Enable billing for your project</li>
              <li>Google provides $200 free credit monthly</li>
              <li>Development usage stays within free limits</li>
            </ol>
            <p><strong>Stations:</strong> {stations.length} available</p>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Show fallback if billing error detected
  if (error && error.includes('billing')) {
    return handleMapError();
  }

  return (
    <Card elevation={3} sx={{ height, position: 'relative' }}>
      <CardContent sx={{ p: 0, height: '100%' }}>
        {loading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: 'rgba(255,255,255,0.8)', 
              zIndex: 1000 
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Box sx={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 1000 }}>
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </Box>
        )}

        <LoadScript 
          googleMapsApiKey={apiKey} 
          libraries={GOOGLE_MAPS_LIBRARIES}
          onLoad={() => {
            console.log('Google Maps API loaded successfully');
            setIsGoogleMapsLoaded(true);
          }}
          onError={() => setError('Google Maps billing not enabled. Please enable billing in Google Cloud Console.')}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={userLocation || defaultCenter}
            zoom={13}
            onLoad={onMapLoad}
          >
            {/* Show directions if available */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: {
                    strokeColor: '#4285F4',
                    strokeWeight: 5,
                  },
                }}
              />
            )}
            
            {/* User location marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                title="Your Location"
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="6" fill="#4285F4" stroke="white" stroke-width="2"/>
                    </svg>
                  `),
                  scaledSize: { width: 16, height: 16 }
                }}
              />
            )}
            
            {/* Station markers */}
            {stations.length > 0 && stations.map((station) => {
              // Extract coordinates from various possible data structures
              const position = {
                lat: station.location?.coordinates?.latitude || 
                     station.location?.coordinates?.[1] || 
                     station.location?.latitude || 
                     station.lat || 0,
                lng: station.location?.coordinates?.longitude || 
                     station.location?.coordinates?.[0] || 
                     station.location?.longitude || 
                     station.lng || 0
              };
              
              // Skip if no valid coordinates
              if (position.lat === 0 || position.lng === 0) {
                console.warn('Skipping station with invalid coordinates:', station.name, position);
                return null;
              }
              
              const isSelected = selectedStation && selectedStation._id === station._id;
              const isAvailable = typeof station.availableSlots === 'number' ? station.availableSlots > 0 : true;
              const isMaintenance = station.operational?.status === 'maintenance';
              
              // Marker color based on status
              const markerColor = isMaintenance ? '#f59e0b' : (isAvailable ? '#10b981' : '#ef4444');
              const markerSize = isSelected ? 32 : 24;
              
              return (
                <React.Fragment key={station._id}>
                  <Marker
                    position={position}
                    title={station.name}
                    onClick={() => handleStationMarkerClick(station)}
                    onMouseOver={() => setHoveredStation(station)}
                    onMouseOut={() => setHoveredStation(null)}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="${markerSize}" height="${markerSize}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${markerColor}" stroke="white" stroke-width="1.5"/>
                          <circle cx="12" cy="9" r="3" fill="white"/>
                          ${isMaintenance ? '<text x="12" y="11" text-anchor="middle" fill="' + markerColor + '" font-size="6" font-weight="bold">!</text>' : ''}
                        </svg>
                      `),
                      scaledSize: { width: markerSize, height: markerSize },
                      anchor: new window.google.maps.Point(markerSize / 2, markerSize)
                    }}
                  />
                  
                  {/* InfoWindow for hovered or selected station */}
                  {(hoveredStation?._id === station._id || isSelected) && (
                    <InfoWindow
                      position={position}
                      onCloseClick={() => {
                        setHoveredStation(null);
                        if (isSelected && onStationSelect) {
                          onStationSelect(null);
                        }
                      }}
                    >
                      <Box sx={{ minWidth: 200, maxWidth: 300 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '14px' }}>
                          {station.name}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {isMaintenance ? (
                            <Chip size="small" label="Under Maintenance" color="warning" sx={{ fontSize: '11px' }} />
                          ) : (
                            <Chip 
                              size="small" 
                              label={`${typeof station.availableSlots === 'number' ? station.availableSlots : '?'}/${station.capacity?.totalChargers || '?'} Available`}
                              color={isAvailable ? 'success' : 'error'}
                              sx={{ fontSize: '11px' }}
                            />
                          )}
                          {station.pricing?.pricePerMinute && (
                            <Chip 
                              size="small" 
                              label={`₹${station.pricing.pricePerMinute}/min`}
                              sx={{ fontSize: '11px' }}
                            />
                          )}
                        </Box>
                        
                        {station.capacity?.chargerTypes && station.capacity.chargerTypes.length > 0 && (
                          <Typography variant="body2" sx={{ fontSize: '12px', mb: 0.5, color: 'text.secondary' }}>
                            <strong>Chargers:</strong> {station.capacity.chargerTypes.map(t => typeof t === 'string' ? t : t.type).join(', ')}
                          </Typography>
                        )}
                        
                        {station.analytics?.rating && (
                          <Typography variant="body2" sx={{ fontSize: '12px', mb: 0.5, color: 'text.secondary' }}>
                            ⭐ {station.analytics.rating.toFixed(1)}/5
                          </Typography>
                        )}
                        
                        {station.amenities && station.amenities.length > 0 && (
                          <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                            <strong>Amenities:</strong> {station.amenities.slice(0, 3).join(', ')}{station.amenities.length > 3 ? '...' : ''}
                          </Typography>
                        )}
                        
                        {station.address && (
                          <Typography variant="body2" sx={{ fontSize: '11px', mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                            {station.address}
                          </Typography>
                        )}
                      </Box>
                    </InfoWindow>
                  )}
                </React.Fragment>
              );
            })}
          </GoogleMap>
        </LoadScript>
      </CardContent>
    </Card>
  );
};

export default StationsWithGoogleMap;
