import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { GoogleMap, LoadScript, DirectionsRenderer, Marker } from '@react-google-maps/api';

// Keep libraries array as static to avoid LoadScript reloading
const GOOGLE_MAPS_LIBRARIES = ['geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946
};

const GoogleMapsDirections = ({ 
  open, 
  onClose, 
  destination, 
  stationName
}) => {
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const calculateRoute = useCallback(() => {
    if (!destination || !window.google) return;

    setLoading(true);
    setError('');

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(origin);

          const directionsService = new window.google.maps.DirectionsService();
          
          directionsService.route(
            {
              origin: origin,
              destination: destination,
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              setLoading(false);
              if (status === window.google.maps.DirectionsStatus.OK) {
                setDirections(result);
              } else {
                setError('Could not calculate directions. Please try again.');
              }
            }
          );
        },
        (error) => {
          setLoading(false);
          setError('Unable to get your location. Please enable location services.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      setLoading(false);
      setError('Geolocation is not supported by this browser.');
    }
  }, [destination]);

  const openInGoogleMaps = () => {
    if (destination) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleMapLoad = useCallback(() => {
    if (open && destination) {
      calculateRoute();
    }
  }, [open, destination, calculateRoute]);

  if (!apiKey) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Directions</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">
            Google Maps API key is not configured. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your environment variables.
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Directions to {stationName || 'Charging Station'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'relative' }}>
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
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <LoadScript googleMapsApiKey={apiKey} libraries={GOOGLE_MAPS_LIBRARIES}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={destination || defaultCenter}
              zoom={13}
              onLoad={handleMapLoad}
            >
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
              
              {!directions && destination && (
                <Marker
                  position={destination}
                  title={stationName}
                />
              )}
              
              {!directions && userLocation && (
                <Marker
                  position={userLocation}
                  title="Your Location"
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                      </svg>
                    `),
                    scaledSize: { width: 20, height: 20 }
                  }}
                />
              )}
            </GoogleMap>
          </LoadScript>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button 
          onClick={openInGoogleMaps} 
          variant="contained" 
          color="primary"
          disabled={!destination}
        >
          Open in Google Maps
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleMapsDirections;
