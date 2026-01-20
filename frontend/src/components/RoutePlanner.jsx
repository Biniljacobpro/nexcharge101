import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper
} from '@mui/material';
import GoogleMapsLocationPicker from './GoogleMapsLocationPicker';
import PlaceAutocomplete from './PlaceAutocomplete';
import {
  Map as MapIcon,
  Directions as DirectionsIcon,
  ElectricCar as ElectricCarIcon,
  BatteryChargingFull as BatteryIcon,
  LocationOn as LocationIcon,
  Flag as FlagIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { getMyVehiclesApi, authFetch } from '../utils/api';

const RoutePlanner = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [routeResult, setRouteResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    start: { lat: '', lng: '', placeName: '' },
    destination: { lat: '', lng: '', placeName: '' },
    selectedVehicleIndex: '',
    currentSOC: 65,
    departureTime: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  });

  // Parse a DMS string like 9°32'41.5"N 76°49'02.8"E into decimal lat/lng
  const parseDmsToDecimal = useCallback((dmsStr) => {
    if (!dmsStr || typeof dmsStr !== 'string') return null;
    const cleaned = dmsStr.trim().replace(/\s+/g, ' ');
    const dmsRegex = /([0-9]{1,3})°\s*([0-9]{1,2})'\s*([0-9]{1,2}(?:\.[0-9]+)?)"?\s*([NS])\s+([0-9]{1,3})°\s*([0-9]{1,2})'\s*([0-9]{1,2}(?:\.[0-9]+)?)"?\s*([EW])/i;
    const m = cleaned.match(dmsRegex);
    if (!m) return null;
    const toDecimal = (deg, min, sec, hemi) => {
      const dec = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
      const sign = (hemi.toUpperCase() === 'S' || hemi.toUpperCase() === 'W') ? -1 : 1;
      return dec * sign;
    };
    const lat = toDecimal(m[1], m[2], m[3], m[4]);
    const lng = toDecimal(m[5], m[6], m[7], m[8]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, []);

  // Load user vehicles
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        console.log('Loading vehicles...');
        const list = await getMyVehiclesApi();
        const vehicleList = Array.isArray(list) ? list : [];
        console.log('Vehicles loaded:', vehicleList);
        setVehicles(vehicleList);
        
        // Set default vehicle if we have vehicles and no vehicle is currently selected
        if (vehicleList.length > 0 && (!formData.selectedVehicleIndex || formData.selectedVehicleIndex === '')) {
          console.log('Setting default vehicle index to 0');
          setFormData(prev => ({
            ...prev,
            selectedVehicleIndex: '0'
          }));
        } else if (vehicleList.length === 0) {
          console.log('No vehicles found, clearing selection');
          setFormData(prev => ({
            ...prev,
            selectedVehicleIndex: ''
          }));
        }
      } catch (err) {
        console.error('Error loading vehicles:', err);
        setVehicles([]);
        setFormData(prev => ({
          ...prev,
          selectedVehicleIndex: ''
        }));
      }
    };

    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field, value) => {
    console.log('handleChange called:', { field, value, formData, vehicles });
    if (field === 'startLat') {
      setFormData(prev => ({
        ...prev,
        start: { ...prev.start, lat: value }
      }));
    } else if (field === 'startLng') {
      setFormData(prev => ({
        ...prev,
        start: { ...prev.start, lng: value }
      }));
    } else if (field === 'startDms') {
      // Parse DMS and update lat/lng
      const parsed = parseDmsToDecimal(value);
      if (parsed) {
        setFormData(prev => ({
          ...prev,
          start: { 
            ...prev.start, 
            lat: parsed.lat, 
            lng: parsed.lng,
            dms: value
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          start: { 
            ...prev.start, 
            dms: value
          }
        }));
      }
    } else if (field === 'destLat') {
      setFormData(prev => ({
        ...prev,
        destination: { ...prev.destination, lat: value }
      }));
    } else if (field === 'destLng') {
      setFormData(prev => ({
        ...prev,
        destination: { ...prev.destination, lng: value }
      }));
    } else if (field === 'destDms') {
      // Parse DMS and update lat/lng
      const parsed = parseDmsToDecimal(value);
      if (parsed) {
        setFormData(prev => ({
          ...prev,
          destination: { 
            ...prev.destination, 
            lat: parsed.lat, 
            lng: parsed.lng,
            dms: value
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          destination: { 
            ...prev.destination, 
            dms: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    console.log('FormData updated:', { ...formData, [field]: value });
  };

  const validateForm = () => {
    console.log('Validating form:', formData, vehicles);
    
    // Validate start location
    if (!formData.start.lat || !formData.start.lng) {
      setError('Please select or enter valid start coordinates');
      return false;
    }
    
    // Validate destination location
    if (!formData.destination.lat || !formData.destination.lng) {
      setError('Please select or enter valid destination coordinates');
      return false;
    }
    
    // Check if a vehicle is selected
    if (formData.selectedVehicleIndex === '' || formData.selectedVehicleIndex === null || formData.selectedVehicleIndex === undefined) {
      setError('Please select a vehicle');
      return false;
    }
    
    // Check if vehicles array is populated
    if (vehicles.length === 0) {
      setError('No vehicles found. Please add a vehicle first.');
      return false;
    }
    
    // Check if selected vehicle index is valid
    const selectedIndex = parseInt(formData.selectedVehicleIndex);
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= vehicles.length) {
      setError(`Please select a valid vehicle. Selected index: ${formData.selectedVehicleIndex}, Available vehicles: ${vehicles.length}`);
      return false;
    }
    
    // Check if the selected vehicle has required fields
    const selectedVehicle = vehicles[selectedIndex];
    if (!selectedVehicle || !selectedVehicle.make || !selectedVehicle.model) {
      setError('Selected vehicle is invalid. Please select another vehicle.');
      return false;
    }
    
    if (formData.currentSOC < 0 || formData.currentSOC > 100) {
      setError('State of charge must be between 0 and 100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    console.log('Form data before validation:', formData, vehicles);
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      
      // Validate and prepare form data
      console.log('Preparing payload with:', { formData, vehicles });
      const selectedIndex = parseInt(formData.selectedVehicleIndex);
      console.log('Selected index:', selectedIndex);
      console.log('Vehicles array length:', vehicles.length);
      
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= vehicles.length) {
        throw new Error(`Invalid vehicle index: ${selectedIndex}. Available vehicles: ${vehicles.length}`);
      }
      
      const selectedVehicle = vehicles[selectedIndex];
      console.log('Selected vehicle:', selectedVehicle);
      
      if (!selectedVehicle) {
        throw new Error('Selected vehicle is invalid');
      }
      
      // Prepare vehicle data for the backend
      const vehicleData = {
        make: selectedVehicle.make || '',
        model: selectedVehicle.model || '',
        year: selectedVehicle.year || undefined,
        batteryCapacity: selectedVehicle.batteryCapacity || 0,
        preferredChargingType: selectedVehicle.preferredChargingType || undefined,
        chargingAC: selectedVehicle.chargingAC || undefined,
        chargingDC: selectedVehicle.chargingDC || undefined
      };
      
      const payload = {
        start: {
          lat: parseFloat(formData.start.lat),
          lng: parseFloat(formData.start.lng)
        },
        destination: {
          lat: parseFloat(formData.destination.lat),
          lng: parseFloat(formData.destination.lng)
        },
        vehicle: vehicleData,
        currentSOC: parseFloat(formData.currentSOC),
        departureTime: formData.departureTime
      };
      
      console.log('Sending payload:', payload);
      
      const response = await authFetch(`${apiBase}/route-planner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to plan route');
      }

      setRouteResult(data.data);
      setShowResult(true);
      setSuccess('Route planned successfully!');
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'An error occurred while planning the route');
    } finally {
      setLoading(false);
    }
  };

  const closeResultDialog = () => {
    setShowResult(false);
    setRouteResult(null);
  };

  const handleBookStation = (stationId, arrivalTime, chargingTime) => {
    // Navigate to the station booking page with the arrival time and charging duration
    navigate(`/stations/${stationId}`, { 
      state: { 
        bookingTime: arrivalTime,
        chargingTime: chargingTime // in minutes
      } 
    });
  };

  return (
    <>
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <DirectionsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Smart Multi-Stop EV Route Planner
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Plan your electric vehicle journey with optimal charging stops calculated using advanced algorithms and machine learning predictions.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Start Location */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LocationIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Start Location
                    </Typography>
                  </Box>
                  
                  <PlaceAutocomplete
                    label="Search Place"
                    placeholder="Type a place name (e.g., Times Square, New York)"
                    value={formData.start.placeName}
                    onChange={({ lat, lng, placeName }) => {
                      setFormData(prev => ({
                        ...prev,
                        start: {
                          lat: lat,
                          lng: lng,
                          placeName: placeName
                        }
                      }));
                    }}
                    helperText="Type and select a place from the dropdown"
                    required
                  />
                  

                  <GoogleMapsLocationPicker
                    value={{ lat: Number(formData.start.lat) || undefined, lng: Number(formData.start.lng) || undefined }}
                    onChange={({ lat, lng, dms, placeName }) => {
                      setFormData(prev => ({
                        ...prev,
                        start: {
                          ...prev.start,
                          lat: lat,
                          lng: lng,
                          dms: dms,
                          placeName: placeName || prev.start.placeName
                        }
                      }));
                    }}
                    initialCenter={{ lat: 12.9716, lng: 77.5946 }}
                    height={280}
                  />
                </Paper>
              </Grid>

              {/* Destination */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FlagIcon color="secondary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Destination
                    </Typography>
                  </Box>
                  
                  <PlaceAutocomplete
                    label="Search Destination"
                    placeholder="Type a place name (e.g., Central Park, New York)"
                    value={formData.destination.placeName}
                    onChange={({ lat, lng, placeName }) => {
                      setFormData(prev => ({
                        ...prev,
                        destination: {
                          lat: lat,
                          lng: lng,
                          placeName: placeName
                        }
                      }));
                    }}
                    helperText="Type and select a place from the dropdown"
                    required
                  />
                  

                  <GoogleMapsLocationPicker
                    value={{ lat: Number(formData.destination.lat) || undefined, lng: Number(formData.destination.lng) || undefined }}
                    onChange={({ lat, lng, dms, placeName }) => {
                      setFormData(prev => ({
                        ...prev,
                        destination: {
                          ...prev.destination,
                          lat: lat,
                          lng: lng,
                          dms: dms,
                          placeName: placeName || prev.destination.placeName
                        }
                      }));
                    }}
                    initialCenter={{ lat: 13.0827, lng: 80.2707 }}
                    height={280}
                  />
                </Paper>
              </Grid>

              {/* Vehicle Selection */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ElectricCarIcon color="success" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Vehicle
                    </Typography>
                  </Box>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="vehicle-select-label">Select Your Vehicle</InputLabel>
                    <Select
                      labelId="vehicle-select-label"
                      value={formData.selectedVehicleIndex}
                      label="Select Your Vehicle"
                      onChange={(e) => handleChange('selectedVehicleIndex', e.target.value)}
                      required
                    >
                      {vehicles.length === 0 ? (
                        <MenuItem value="" disabled>
                          <em>No vehicles found</em>
                        </MenuItem>
                      ) : (
                        vehicles.map((vehicle, index) => (
                          <MenuItem key={`${vehicle._id}-${index}`} value={String(index)}>
                            {vehicle.make} {vehicle.model} ({vehicle.batteryCapacity} kWh)
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Current State of Charge (%)"
                    type="number"
                    inputProps={{ min: 0, max: 100 }}
                    value={formData.currentSOC}
                    onChange={(e) => handleChange('currentSOC', e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Departure Date & Time"
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={(e) => handleChange('departureTime', e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                    }}
                    required
                  />
                </Paper>
              </Grid>

              {/* Info Panel */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%', bgcolor: '#f8f9fa' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <BatteryIcon color="warning" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      How It Works
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Our smart route planner uses:
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                    <li>
                      <Typography variant="body2">
                        Advanced graph algorithms for optimal pathfinding
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Machine learning models for accurate energy consumption predictions
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Real-time charging station data
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Elevation and traffic-aware routing
                      </Typography>
                    </li>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Ensures you never run out of charge with optimal charging stops.
                  </Typography>
                </Paper>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <MapIcon />}
                    sx={{ minWidth: 200, py: 1.5 }}
                  >
                    {loading ? 'Planning Route...' : 'Plan My Route'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Route Result Dialog */}
      <Dialog 
        open={showResult} 
        onClose={closeResultDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DirectionsIcon color="primary" />
            <Typography variant="h6">Route Plan Result</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {routeResult && (
            <Box sx={{ py: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Journey Summary
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Departure:</Typography>
                      <Typography>{new Date(routeResult.departureTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Estimated Arrival:</Typography>
                      <Typography sx={{ fontWeight: 500, color: 'primary.main' }}>{new Date(routeResult.estimatedArrival).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Total Distance:</Typography>
                      <Typography>{routeResult.totalDistance?.toFixed(2)} km</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Total Journey Time:</Typography>
                      <Typography sx={{ fontWeight: 500 }}>
                        {Math.floor(routeResult.totalTime / 60) > 0 && `${Math.floor(routeResult.totalTime / 60)} hr `}
                        {Math.round(routeResult.totalTime % 60)} min
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Final Arrival SOC:</Typography>
                      <Chip 
                        label={`${routeResult.finalArrivalSOC?.toFixed(1)}%`} 
                        color={routeResult.finalArrivalSOC > 20 ? "success" : "warning"} 
                        size="small"
                      />
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Charging Stops
                    </Typography>
                    
                    {routeResult.chargingStops && routeResult.chargingStops.length > 0 ? (
                      routeResult.chargingStops.map((stop, index) => (
                        <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < routeResult.chargingStops.length - 1 ? '1px solid #eee' : 'none' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {stop.stationName || `Stop #${index + 1}`}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">Arrival Time:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{new Date(stop.arrivalTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">Arrival SOC:</Typography>
                            <Chip 
                              label={`${stop.arrivalSOC?.toFixed(1)}%`} 
                              size="small"
                              color={stop.arrivalSOC > 20 ? "default" : "warning"}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">Charge To:</Typography>
                            <Chip 
                              label={`${stop.chargeToSOC?.toFixed(1)}%`} 
                              size="small"
                              color="primary"
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">Charging Time:</Typography>
                            <Typography variant="body2">{Math.round(stop.chargingTime)} minutes</Typography>
                          </Box>
                          
                          <Box sx={{ mt: 2 }}>
                            <Button 
                              variant="contained" 
                              size="small" 
                              fullWidth
                              startIcon={<EventIcon />}
                              onClick={() => handleBookStation(stop.stationId, stop.arrivalTime, stop.chargingTime)}
                              sx={{ textTransform: 'none' }}
                            >
                              Book This Station
                            </Button>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box>
                        {routeResult.noStationsAvailable ? (
                          <Alert severity="warning" sx={{ mb: 0 }}>
                            No charging stations are available on this route. Consider choosing a different route or ensuring your vehicle has sufficient charge to reach the destination.
                          </Alert>
                        ) : (
                          <Typography color="text.secondary">
                            No charging stops required for this journey.
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeResultDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RoutePlanner;