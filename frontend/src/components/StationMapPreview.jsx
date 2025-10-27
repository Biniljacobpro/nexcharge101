import React, { useState, useCallback, useEffect } from 'react';
import { Box, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// Keep libraries array as static to avoid LoadScript reloading
const GOOGLE_MAPS_LIBRARIES = ['geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '200px' // Small height for preview
};

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946
};

const StationMapPreview = ({ 
  station,
  height = 200
}) => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Get user location on component mount
  useEffect(() => {
    // Set a default user location immediately for better UX
    setUserLocation(defaultCenter);
    
    // Try to get actual user location in background
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
          // Keep default location
        }
      );
    }
  }, []);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    setMapLoaded(true);
  }, []);

  if (!apiKey) {
    return (
      <Card elevation={3} sx={{ height: height }}>
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
      <Card elevation={3} sx={{ height: height }}>
        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Alert severity="warning" sx={{ mb: 2, width: '100%' }}>
            <strong>Google Maps Billing Required</strong>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  // Show fallback if billing error detected
  if (error && error.includes('billing')) {
    return handleMapError();
  }

  const stationPosition = {
    lat: station?.location?.coordinates?.latitude || station?.location?.latitude || station?.lat || 0,
    lng: station?.location?.coordinates?.longitude || station?.location?.longitude || station?.lng || 0
  };

  // Center the map on the station position
  const mapCenter = stationPosition.lat && stationPosition.lng ? stationPosition : defaultCenter;

  return (
    <Card elevation={3} sx={{ height: height, position: 'relative', overflow: 'hidden' }}>
      <CardContent sx={{ p: 0, height: '100%' }}>
        {error && (
          <Box sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 1000 }}>
            <Alert severity="error" onClose={() => setError('')} sx={{ py: 0.5 }}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Static map placeholder while loading */}
        {!mapLoaded && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              bgcolor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={24} />
              <Box component="span" sx={{ display: 'block', mt: 1, fontSize: '0.8rem', color: 'text.secondary' }}>
                Loading map...
              </Box>
            </Box>
          </Box>
        )}

        <LoadScript 
          googleMapsApiKey={apiKey} 
          libraries={GOOGLE_MAPS_LIBRARIES}
          onError={() => setError('Google Maps billing not enabled. Please enable billing in Google Cloud Console.')}
          loadingElement={
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          }
        >
          <GoogleMap
            mapContainerStyle={{ ...mapContainerStyle, height: `${height}px` }}
            center={mapCenter}
            zoom={14}
            onLoad={onMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              gestureHandling: 'none', // Disable gestures for preview
              styles: [
                {
                  featureType: "all",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "administrative",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "road",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            }}
          >
            {/* Station marker */}
            {stationPosition.lat && stationPosition.lng && (
              <Marker
                position={stationPosition}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#10b981" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="4" fill="white"/>
                    </svg>
                  `),
                  scaledSize: { width: 20, height: 20 }
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </CardContent>
    </Card>
  );
};

export default StationMapPreview;