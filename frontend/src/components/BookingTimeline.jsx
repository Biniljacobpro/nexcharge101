import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Tooltip, 
  IconButton,
  TextField,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const BookingTimeline = ({ 
  stationId, 
  chargerType, 
  onSlotSelect,
  selectedVehicle 
}) => {
  // Initialize with today's date and ensure it's not in the past
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Ensure selected date is never in the past
  useEffect(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(selectedDate);
    
    if (selectedDateObj < todayDate) {
      setSelectedDate(today);
    }
  }, [selectedDate, today]);

  // Generate time slots (30-minute intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          hour,
          minute
        });
      }
    }
    return slots;
  }, []);

  // Fetch bookings for the selected date
  useEffect(() => {
    const fetchBookings = async () => {
      if (!stationId || !selectedDate) return;
      
      setLoading(true);
      try {
        const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
        const url = `${API_BASE}/public/bookings/station/${stationId}/timeline?date=${selectedDate}${chargerType ? `&chargerType=${chargerType}` : ''}`;
        
        console.log('Fetching bookings from URL:', url);
        
        const response = await fetch(url);
        
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        // Check if response is OK (2xx status)
        if (!response.ok) {
          console.error(`HTTP Error: ${response.status} ${response.statusText}`);
          setBookings([]); // Clear bookings on error
          return;
        }
        
        // Check content type before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Response is not JSON:', contentType);
          setBookings([]); // Clear bookings on error
          return;
        }
        
        const result = await response.json();
        
        if (result.success) {
          setBookings(result.data);
        } else {
          console.error('API Error:', result.message);
          setBookings([]); // Clear bookings on API error
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]); // Clear bookings on network error
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [stationId, selectedDate, chargerType]);

  // Check if a time slot is booked
  const isSlotBooked = (slotTime) => {
    const slotHour = parseInt(slotTime.split(':')[0]);
    const slotMinute = parseInt(slotTime.split(':')[1]);
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(slotHour, slotMinute, 0, 0);
    
    return bookings.some(booking => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      return slotDateTime >= start && slotDateTime < end;
    });
  };

  // Get booking info for a time slot (for tooltip)
  const getBookingInfo = (slotTime) => {
    const slotHour = parseInt(slotTime.split(':')[0]);
    const slotMinute = parseInt(slotTime.split(':')[1]);
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(slotHour, slotMinute, 0, 0);
    
    return bookings.find(booking => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      return slotDateTime >= start && slotDateTime < end;
    });
  };

  // Handle slot click
  const handleSlotClick = (slotTime) => {
    if (isSlotBooked(slotTime)) return;
    
    const [hours, minutes] = slotTime.split(':').map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(hours, minutes, 0, 0);
    
    // Check if the selected time slot is in the past for today
    const now = new Date();
    if (selectedDate === now.toISOString().split('T')[0] && startDate < now) {
      // Don't allow selection of past time slots for today
      return;
    }
    
    // Default to 2-hour duration
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 2);
    
    if (onSlotSelect) {
      onSlotSelect({
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString()
      });
    }
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    
    // Prevent navigating to past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newDate >= today) {
      setSelectedDate(newDate.toISOString().split('T')[0]);
    }
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time for tooltip
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Convert 24-hour format to 12-hour format
  const convertTo12Hour = (hour24) => {
    if (hour24 === 0) return '12 AM';
    if (hour24 === 12) return '12 PM';
    if (hour24 < 12) return `${hour24} AM`;
    return `${hour24 - 12} PM`;
  };

  return (
    <Box sx={{ mt: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
        Booking Timeline
      </Typography>
      
      {/* Date Selector - Modern styling */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2,
        p: 1.5,
        borderRadius: 2,
        bgcolor: '#f8fafc',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <IconButton 
          onClick={goToPreviousDay} 
          size="small"
          sx={{ 
            bgcolor: '#e3f2fd',
            '&:hover': { bgcolor: '#bbdefb' }
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
        </IconButton>
        
        <TextField
          type="date"
          value={selectedDate}
          onChange={(e) => {
            const selectedDateValue = e.target.value;
            const selectedDateObj = new Date(selectedDateValue);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Only update if the selected date is today or in the future
            if (selectedDateObj >= today) {
              setSelectedDate(selectedDateValue);
            }
          }}
          sx={{ mx: 2, width: 140 }}
          size="small"
          InputProps={{
            sx: { 
              fontSize: '0.9rem',
              height: 36,
              borderRadius: 2
            }
          }}
          inputProps={{
            min: new Date().toISOString().split('T')[0]
          }}
        />
        
        <IconButton 
          onClick={goToNextDay} 
          size="small"
          sx={{ 
            bgcolor: '#e3f2fd',
            '&:hover': { bgcolor: '#bbdefb' }
          }}
        >
          <ArrowForwardIcon sx={{ fontSize: 18 }} />
        </IconButton>
        
        <Typography variant="body2" sx={{ ml: 2, fontWeight: 500 }}>
          {formatDate(selectedDate)}
        </Typography>
      </Box>
      
      {/* Horizontal Timeline */}
      <Box sx={{ 
        width: '100%',
        overflowX: 'auto',
        pb: 1,
        mb: 1,
        '&::-webkit-scrollbar': {
          height: 6
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#90caf9',
          borderRadius: 3
        }
      }}>
        <Box sx={{ 
          display: 'flex', 
          minWidth: '1200px',
          minHeight: '60px',
          position: 'relative'
        }}>
          {/* Hour markers */}
          {Array.from({ length: 25 }).map((_, hour) => (
            <Box 
              key={hour}
              sx={{ 
                position: 'absolute',
                left: `${(hour / 24) * 100}%`,
                top: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}
            >
              <Box sx={{ 
                width: '1px', 
                height: '10px', 
                bgcolor: hour % 2 === 0 ? '#90caf9' : '#e3f2fd' 
              }} />
              {hour % 2 === 0 && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 0.5, 
                    color: '#64b5f6',
                    fontWeight: 500,
                    fontSize: '0.7rem'
                  }}
                >
                  {convertTo12Hour(hour)}
                </Typography>
              )}
            </Box>
          ))}
          
          {/* Time slots */}
          {timeSlots.map((slot, index) => {
            const isBooked = isSlotBooked(slot.time);
            const bookingInfo = getBookingInfo(slot.time);
            
            // Check if this time slot is in the past for today
            const slotDateTime = new Date(selectedDate);
            const [slotHours, slotMinutes] = slot.time.split(':').map(Number);
            slotDateTime.setHours(slotHours, slotMinutes, 0, 0);
            const now = new Date();
            const isPastSlot = selectedDate === now.toISOString().split('T')[0] && slotDateTime < now;
            
            return (
              <Tooltip 
                key={index}
                title={
                  isBooked 
                    ? `Booked: ${formatTime(bookingInfo?.startTime)} - ${formatTime(bookingInfo?.endTime)}`
                    : isPastSlot
                    ? 'Cannot select past time slots'
                    : `${slot.time} - Click to select this time slot`
                }
                arrow
                placement="top"
              >
                <Box
                  onClick={() => !isPastSlot && handleSlotClick(slot.time)}
                  sx={{
                    position: 'absolute',
                    left: `${(index / timeSlots.length) * 100}%`,
                    width: `${(1 / timeSlots.length) * 100}%`,
                    height: '40px',
                    backgroundColor: isBooked ? '#e57373' : isPastSlot ? '#cccccc' : '#81c784',
                    border: '1px solid #fff',
                    cursor: isBooked || isPastSlot ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isBooked ? '#ef5350' : isPastSlot ? '#cccccc' : '#66bb6a',
                      transform: isBooked || isPastSlot ? 'none' : 'scale(1.05)',
                      zIndex: 1
                    }
                  }}
                />
              </Tooltip>
            );
          })}

        </Box>
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {/* Legend */}
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <Box sx={{ width: 12, height: 12, backgroundColor: '#81c784', borderRadius: 1, mr: 1 }} />
          <Typography variant="caption">Available</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 12, height: 12, backgroundColor: '#e57373', borderRadius: 1, mr: 1 }} />
          <Typography variant="caption">Booked</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default BookingTimeline;