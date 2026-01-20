import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  CircularProgress,
  IconButton,
  FormHelperText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const BookingModal = ({ 
  open, 
  onClose, 
  bookingForm, 
  setBookingForm, 
  myVehicles, 
  DURATION_OPTIONS, 
  handleDurationChange, 
  handleStartTimeChange, 
  handleBookingSubmit, 
  bookingLoading, 
  station, 
  recommendation, 
  recommendationLoading,
  navigate,
  getMinStartTime
}) => {
  // Validate that minutes are either 00 or 30
  const validateTimeFormat = (timeString) => {
    if (!timeString) return true;
    
    const date = new Date(timeString);
    const minutes = date.getMinutes();
    return minutes === 0 || minutes === 30;
  };

  // Check if current start time is valid
  const isStartTimeValid = validateTimeFormat(bookingForm.startTime);

  // Effect to round time to nearest 30-minute slot when user selects an invalid time
  useEffect(() => {
    if (bookingForm.startTime && !isStartTimeValid) {
      const date = new Date(bookingForm.startTime);
      const minutes = date.getMinutes();
      
      // Round to nearest 30-minute slot
      if (minutes > 0 && minutes < 30) {
        date.setMinutes(0);
      } else if (minutes > 30 && minutes < 60) {
        date.setMinutes(30);
      }
      
      // Format back to datetime-local string
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      
      const roundedTimeString = `${year}-${month}-${day}T${hours}:${mins}`;
      
      // Update the form with rounded time
      handleStartTimeChange(roundedTimeString);
    }
  }, [bookingForm.startTime, isStartTimeValid, handleStartTimeChange]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          bgcolor: '#1976d2', 
          color: 'white', 
          fontWeight: 600,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        Book Charging Slot
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'white',
            padding: 0.5,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ 
          p: 2, 
          borderRadius: 2, 
          bgcolor: '#f8fafc',
          mb: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
            Vehicle & Charger Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Your Vehicle</InputLabel>
                <Select
                  value={bookingForm.selectedVehicleIndex}
                  onChange={(e) => setBookingForm({
                    ...bookingForm,
                    selectedVehicleIndex: e.target.value
                  })}
                  label="Select Your Vehicle"
                >
                  {myVehicles.length === 0 ? (
                    <MenuItem value="" disabled>
                      No vehicles found
                    </MenuItem>
                  ) : (
                    myVehicles.map((v, idx) => (
                      <MenuItem key={`${v.make}-${v.model}-${idx}`} value={String(idx)}>
                        {`${v.make || ''} ${v.model || ''}`.trim()} {v.year ? `(${v.year})` : ''} {v.batteryCapacity ? `- ${v.batteryCapacity} kWh` : ''}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              
              {myVehicles.length === 0 && (
                <Box sx={{ mt: 1 }}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => {
                      localStorage.setItem('openAddVehicle', '1');
                      navigate('/home');
                    }}
                    sx={{ mr: 1 }}
                  >
                    Add Vehicle
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    You need to add a vehicle before booking
                  </Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Charger Type</InputLabel>
                <Box sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  color: bookingForm.chargerType ? 'text.primary' : 'text.secondary',
                  bgcolor: '#ffffff'
                }}>
                  {bookingForm.chargerType
                    ? bookingForm.chargerType.replace('_',' ').toUpperCase()
                    : 'Auto-selected based on your vehicle'}
                </Box>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ 
          p: 2, 
          borderRadius: 2, 
          bgcolor: '#f8fafc',
          mb: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
            Time & Duration
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Duration</InputLabel>
                <Select
                  value={bookingForm.duration}
                  label="Duration"
                  onChange={(e) => handleDurationChange(e.target.value)}
                >
                  {DURATION_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!isStartTimeValid} size="small">
                <TextField
                  fullWidth
                  label="Start Time"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 
                    min: getMinStartTime(),
                    style: { height: 36, padding: '0 14px' }
                  }}
                  value={bookingForm.startTime || ''}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  required
                  size="small"
                  error={!isStartTimeValid}
                  helperText="Use 30-min increments (e.g., 9:00 or 9:30)"
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="End Time"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                inputProps={{ 
                  readOnly: true,
                  style: { height: 36, padding: '0 14px' }
                }}
                value={bookingForm.endTime || ''}
                required
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ 
          p: 2, 
          borderRadius: 2, 
          bgcolor: '#f8fafc',
          mb: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
            Charge Level
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Charge (%)"
                type="number"
                InputLabelProps={{ shrink: true }}
                inputProps={{ 
                  min: 0, 
                  max: 100,
                  step: 1,
                  style: { height: 36, padding: '0 14px' }
                }}
                value={bookingForm.currentCharge}
                onChange={(e) => setBookingForm({
                  ...bookingForm,
                  currentCharge: e.target.value
                })}
                required
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
        
        {/* Smart Charging Recommendation */}
        {recommendation && (
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            bgcolor: '#ecfdf5', 
            border: '1px solid #10b981',
            mb: 3
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              💡 Smart Recommendation
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#047857' }}>
              {recommendation.chargeGained ? 
                `Charge gain: ${recommendation.chargeGained}% for ${recommendation.duration} minutes` : 
                recommendation.recommendation}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {recommendation.power}kW charger | Estimated cost: ₹{recommendation.cost}
            </Typography>
          </Box>
        )}
        
        {/* Loading indicator for recommendation */}
        {recommendationLoading && (
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            bgcolor: '#f0f9ff', 
            border: '1px solid #0ea5e9',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <CircularProgress size={20} />
            <Typography>Calculating smart recommendation...</Typography>
          </Box>
        )}
        
        {/* Estimated Total */}
        <Box sx={{ 
          p: 2, 
          borderRadius: 2, 
          bgcolor: '#e3f2fd', 
          border: '1px solid #1976d2',
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)'
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
            Estimated Total
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0d47a1' }}>
            {(() => {
              const ppm = Number(station?.pricing?.pricePerMinute ?? station?.pricing?.basePrice ?? 0);
              const mins = Math.round((Number(bookingForm.duration || 0)) * 60);
              const total = ppm * (Number.isFinite(mins) ? mins : 0);
              return `₹${(Number.isFinite(total) ? total : 0).toFixed(2)}`;
            })()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(() => {
              const ppm = Number(station?.pricing?.pricePerMinute ?? station?.pricing?.basePrice ?? 0);
              const mins = Math.round((Number(bookingForm.duration || 0)) * 60);
              return `₹${ppm}/minute × ${mins} minutes`;
            })()}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#64748b',
            fontWeight: 500,
            px: 3
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleBookingSubmit} 
          variant="contained"
          disabled={bookingLoading || !isStartTimeValid}
          sx={{ 
            bgcolor: '#1976d2',
            '&:hover': { bgcolor: '#1565c0' },
            fontWeight: 600,
            px: 3,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
          }}
        >
          {bookingLoading ? 'Processing...' : 'Pay & Book Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingModal;