import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES = ['geometry', 'places'];

const containerStyle = { width: '100%', height: 320 };

function toDms(coord, isLat) {
  const absolute = Math.abs(coord);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;
  const hemisphere = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
  const secondsFixed = seconds.toFixed(1);
  return `${degrees}°${minutes}'${secondsFixed}"${hemisphere}`;
}

export default function GoogleMapsLocationPicker({
  value,
  onChange,
  height,
  initialCenter,
  autoLoad = false,
}) {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const [selected, setSelected] = useState(() => {
    if (value && typeof value.lat === 'number' && typeof value.lng === 'number') {
      return { lat: value.lat, lng: value.lng };
    }
    return null;
  });

  // Lazy mount to avoid blocking initial UI and improve reliability
  const [mounted, setMounted] = useState(autoLoad);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: apiKey || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Get user's current location
  const getUserLocation = useCallback(() => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationLoading(false);
        },
        (error) => {
          console.warn('Error getting user location:', error);
          setLocationLoading(false);
          // Fallback to default location
        }
      );
    } else {
      console.warn('Geolocation is not supported by this browser');
      setLocationLoading(false);
    }
  }, []);

  // Update selected marker when value prop changes (from PlaceAutocomplete)
  useEffect(() => {
    if (value && typeof value.lat === 'number' && typeof value.lng === 'number') {
      setSelected({ lat: value.lat, lng: value.lng });
    }
  }, [value]);

  // Handle Load Map Picker button click
  const handleLoadMap = useCallback(() => {
    getUserLocation();
    setMounted(true);
  }, [getUserLocation]);

  const center = useMemo(() => {
    if (selected) return selected;
    if (userLocation) return userLocation;
    if (initialCenter && typeof initialCenter.lat === 'number' && typeof initialCenter.lng === 'number') {
      return initialCenter;
    }
    return { lat: 12.9716, lng: 77.5946 };
  }, [selected, userLocation, initialCenter]);

  const handleMapClick = useCallback((e) => {
    if (!e || !e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const dmsLat = toDms(lat, true);
    const dmsLng = toDms(lng, false);
    const dms = `${dmsLat} ${dmsLng}`;
    const next = { lat, lng };
    setSelected(next);
    
    // Reverse geocode to get place name
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const placeName = results[0].formatted_address;
          if (onChange) onChange({ lat, lng, dms, placeName });
        } else {
          if (onChange) onChange({ lat, lng, dms });
        }
      });
    } else {
      if (onChange) onChange({ lat, lng, dms });
    }
  }, [onChange]);

  return (
    <Box>
      {!apiKey && (
        <Typography color="error" variant="body2">
          Google Maps API key not configured. Set REACT_APP_GOOGLE_MAPS_API_KEY in frontend/.env
        </Typography>
      )}

      {apiKey && !mounted && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">Click below to load the map picker</Typography>
          <Button variant="outlined" size="small" onClick={handleLoadMap} disabled={locationLoading}>
            {locationLoading ? 'Getting Location...' : 'Load Map Picker'}
          </Button>
        </Box>
      )}

      {apiKey && mounted && !isLoaded && (
        <Box sx={{ height: height || containerStyle.height, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, backgroundColor: '#fafafa', border: '1px solid #eee' }}>
          <CircularProgress size={28} />
          <Typography sx={{ ml: 1 }} variant="body2" color="text.secondary">Loading map…</Typography>
        </Box>
      )}

      {apiKey && mounted && loadError && (
        <Typography color="error" variant="body2">
          Failed to load Google Maps. Please ensure billing is enabled and the key is valid.
        </Typography>
      )}

      {apiKey && mounted && isLoaded && (
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height: height || containerStyle.height }}
          center={center}
          zoom={14}
          onClick={handleMapClick}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'greedy',
          }}
        >
          {selected && (
            <Marker position={selected} />
          )}
        </GoogleMap>
      )}
    </Box>
  );
}


