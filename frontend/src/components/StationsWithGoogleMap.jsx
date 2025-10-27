import React, { useState, useCallback, useEffect } from 'react';
import { Box, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { GoogleMap, LoadScript, DirectionsRenderer, Marker } from '@react-google-maps/api';

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

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

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

  // Calculate directions when a station is selected
  useEffect(() => {
    if (selectedStation && userLocation && map && window.google) {
      calculateDirections();
    }
  }, [selectedStation, userLocation, map]);

  const calculateDirections = useCallback(() => {
    if (!selectedStation || !userLocation || !window.google) return;

    setLoading(true);
    setError('');

    const destination = {
      lat: selectedStation.location?.coordinates?.latitude || selectedStation.lat,
      lng: selectedStation.location?.coordinates?.longitude || selectedStation.lng
    };

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
  }, [selectedStation, userLocation]);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

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
            {stations.map((station) => {
              const position = {
                lat: station.location?.coordinates?.latitude || station.lat || 0,
                lng: station.location?.coordinates?.longitude || station.lng || 0
              };
              
              const isSelected = selectedStation && selectedStation._id === station._id;
              const isAvailable = station.availableSlots > 0;
              const isMaintenance = station.operational?.status === 'maintenance';
              
              // Marker color based on status
              const markerColor = isMaintenance ? '#f59e0b' : (isAvailable ? '#10b981' : '#ef4444');
              const markerSize = isSelected ? 24 : 20;
              
              return (
                <Marker
                  key={station._id}
                  position={position}
                  title={station.name}
                  onClick={() => handleStationMarkerClick(station)}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="${markerSize}" height="${markerSize}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="${markerColor}" stroke="white" stroke-width="2"/>
                        <circle cx="12" cy="12" r="4" fill="white"/>
                      </svg>
                    `),
                    scaledSize: { width: markerSize, height: markerSize }
                  }}
                />
              );
            })}
          </GoogleMap>
        </LoadScript>
      </CardContent>
    </Card>
  );
};

export default StationsWithGoogleMap;
