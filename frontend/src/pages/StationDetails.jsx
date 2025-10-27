import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMe, getMyVehiclesApi } from '../utils/api';
import { useSingleStationAvailability } from '../hooks/useRealTimeAvailability';
import {
  Box,
  Container,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Avatar,
  Stack,
  Rating,
  IconButton
} from '@mui/material';
import UserNavbar from '../components/UserNavbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import GoogleMapsDirections from '../components/GoogleMapsDirections';
import StationMapPreview from '../components/StationMapPreview';
import GetDirectionsButton from '../components/GetDirectionsButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EvStationIcon from '@mui/icons-material/EvStation';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

const StationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState(null);
  const [myVehicles, setMyVehicles] = useState([]);
  const [catalogVehicles, setCatalogVehicles] = useState([]); // public vehicles catalog
  const [myBookings, setMyBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: ''
  });
  
  // Real-time availability for this station
  const { availability: realTimeAvailability } = useSingleStationAvailability(id, 30000);
  const [bookingDialog, setBookingDialog] = useState(false);
  
  const [bookingForm, setBookingForm] = useState({
    chargerType: '',
    duration: '2', // Default 2 hours
    startTime: null,
    endTime: null,
    selectedVehicleIndex: '', // index in myVehicles
    currentCharge: '20',
    targetCharge: '80'
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [directionsDialog, setDirectionsDialog] = useState(false);
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
  const API_ORIGIN = API_BASE.replace(/\/api$/, '');

  // Duration options in 30-minute increments up to 5 hours
  const DURATION_OPTIONS = [
    { value: '0.5', label: '30 minutes' },
    { value: '1', label: '1 hour' },
    { value: '1.5', label: '1 hour 30 minutes' },
    { value: '2', label: '2 hours' },
    { value: '2.5', label: '2 hours 30 minutes' },
    { value: '3', label: '3 hours' },
    { value: '3.5', label: '3 hours 30 minutes' },
    { value: '4', label: '4 hours' },
    { value: '4.5', label: '4 hours 30 minutes' },
    { value: '5', label: '5 hours' }
  ];

  // Enrich user vehicles with catalog connectorTypes if missing (defined early to avoid TDZ)
  const enrichedMyVehicles = React.useMemo(() => {
    if (!Array.isArray(myVehicles) || myVehicles.length === 0) return [];
    const norm = (s) => String(s || '').trim().toLowerCase();
    return myVehicles.map((v) => {
      const hasAC = v?.chargingAC?.supported && Array.isArray(v?.chargingAC?.connectorTypes) && v.chargingAC.connectorTypes.length > 0;
      const hasDC = v?.chargingDC?.supported && Array.isArray(v?.chargingDC?.connectorTypes) && v.chargingDC.connectorTypes.length > 0;
      if (hasAC || hasDC) return v;
      const match = Array.isArray(catalogVehicles) ? catalogVehicles.find(cv => norm(cv.make) === norm(v?.make) && norm(cv.model) === norm(v?.model)) : null;
      if (!match) return v;
      return {
        ...v,
        chargingAC: match.chargingAC ? {
          supported: !!match.chargingAC.supported,
          ...(typeof match.chargingAC.maxPower === 'number' ? { maxPower: match.chargingAC.maxPower } : {}),
          connectorTypes: Array.isArray(match.chargingAC.connectorTypes) ? match.chargingAC.connectorTypes.map((t) => String(t).toLowerCase()) : []
        } : v.chargingAC,
        chargingDC: match.chargingDC ? {
          supported: !!match.chargingDC.supported,
          ...(typeof match.chargingDC.maxPower === 'number' ? { maxPower: match.chargingDC.maxPower } : {}),
          connectorTypes: Array.isArray(match.chargingDC.connectorTypes) ? match.chargingDC.connectorTypes.map((t) => String(t).toLowerCase()) : []
        } : v.chargingDC,
      };
    });
  }, [myVehicles, catalogVehicles]);

  const toLocalDateTimeValue = (date) => {
    if (!date) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Infer best charger type for a given vehicle based on station support and availability
  const getCompatibleTypesForVehicle = (vehicle) => {
    if (!station) return [];
    const stationTypes = Array.isArray(station.capacity?.chargerTypes) ? station.capacity.chargerTypes : [];
    // Filter types that the vehicle supports using existing checkVehicleSupport logic
    const compatible = stationTypes.filter((t) => checkVehicleSupport(t, [vehicle]));
    // Sort compatible types by current availability desc
    const withAvailability = compatible.map((t) => ({
      type: t,
      available: getAvailableChargersByType(t).length
    })).sort((a, b) => b.available - a.available);
    return withAvailability.map((x) => x.type);
  };

  // Auto-select charger type when vehicle or station changes
  useEffect(() => {
    try {
      const idx = Number(bookingForm.selectedVehicleIndex);
      const v = Number.isInteger(idx) ? enrichedMyVehicles[idx] : undefined;
      if (!v) return;
      const compat = getCompatibleTypesForVehicle(v);
      if (compat && compat.length > 0) {
        if (bookingForm.chargerType !== compat[0]) {
          setBookingForm((bf) => ({ ...bf, chargerType: compat[0] }));
        }
      } else {
        // Fallback: clear if no compatible
        if (bookingForm.chargerType) {
          setBookingForm((bf) => ({ ...bf, chargerType: '' }));
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingForm.selectedVehicleIndex, enrichedMyVehicles, station]);

  const getMinStartTime = () => {
    return toLocalDateTimeValue(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes from now
  };

  const handleStartTimeChange = (value) => {
    const start = value ? new Date(value) : null;
    
    // Validate that start time is at least 10 minutes from now
    if (start) {
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
      if (start < tenMinutesFromNow) {
        setSnackbar({ open: true, message: 'Start time must be at least 10 minutes from now', severity: 'error' });
        return;
      }
    }
    
    let computedEnd = null;
    if (start) {
      // Calculate end time based on selected duration
      const durationHours = parseFloat(bookingForm.duration);
      const startMs = start.getTime();
      const endMs = startMs + (durationHours * 60 * 60 * 1000);
      computedEnd = new Date(endMs);
    }
    setBookingForm({ ...bookingForm, startTime: value, endTime: computedEnd ? toLocalDateTimeValue(computedEnd) : '' });
  };

  const handleDurationChange = (duration) => {
    setBookingForm({ ...bookingForm, duration });
    // Recalculate end time if start time is set
    if (bookingForm.startTime) {
      const start = new Date(bookingForm.startTime);
      const durationHours = parseFloat(duration);
      const startMs = start.getTime();
      const endMs = startMs + (durationHours * 60 * 60 * 1000);
      const computedEnd = new Date(endMs);
      setBookingForm(prev => ({ ...prev, endTime: toLocalDateTimeValue(computedEnd) }));
    }
  };

  const loadMyVehicles = async () => {
    try {
      const list = await getMyVehiclesApi().catch(() => []);
      setMyVehicles(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error loading my vehicles:', err);
      setMyVehicles([]);
    }
  };

  const loadCatalogVehicles = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      const res = await fetch(`${apiBase}/public/vehicles`);
      if (!res.ok) throw new Error('Failed to load vehicle catalog');
      const data = await res.json();
      setCatalogVehicles(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error(e);
      setCatalogVehicles([]);
    }
  };

  const loadMyBookings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { setMyBookings([]); return; }
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      const res = await fetch(`${apiBase}/bookings/my-bookings?limit=5&_=${Date.now()}` , { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) setMyBookings(Array.isArray(data.data) ? data.data : []);
    } catch (e) { console.error('Failed to load bookings', e); }
  };

  // Mapping between station charger types and vehicle connector types (new unified types)
  const chargerTypeToConnectorTypeMap = {
    'type1': ['type1'],
    'type2': ['type2'],
    'bharat_ac_001': ['bharat_ac_001', 'type2'],
    'bharat_dc_001': ['bharat_dc_001'],
    'ccs2': ['ccs2'],
    'chademo': ['chademo'],
    'gbt_type6': ['gbt_type6'],
    'type7_leccs': ['type7_leccs'],
    'mcs': ['mcs'],
    'chaoji': ['chaoji']
  };

  

  // Function to check if any user vehicle supports a specific charger type
  const checkVehicleSupport = (chargerType, vehicles) => {
    // If no vehicles, return false
    if (!vehicles || vehicles.length === 0) {
      return false;
    }
    
    // Get the connector types that match this charger type
    const key = String(chargerType || '').trim().toLowerCase();
    const supportedConnectorTypes = chargerTypeToConnectorTypeMap[key] || [];
    
    // Check if any vehicle supports any of these connector types
    return vehicles.some(vehicle => {
      // Check AC charging support
      if (vehicle.chargingAC && vehicle.chargingAC.supported) {
        if (vehicle.chargingAC.connectorTypes && 
            vehicle.chargingAC.connectorTypes.some(type => supportedConnectorTypes.includes(String(type).toLowerCase()))) {
          return true;
        }
      }
      
      // Check DC charging support
      if (vehicle.chargingDC && vehicle.chargingDC.supported) {
        if (vehicle.chargingDC.connectorTypes && 
            vehicle.chargingDC.connectorTypes.some(type => supportedConnectorTypes.includes(String(type).toLowerCase()))) {
          return true;
        }
      }
      
      return false;
    });
  };

  const handleBookingSubmit = async () => {
    if (!bookingForm.chargerType || !bookingForm.startTime || !bookingForm.endTime || bookingForm.selectedVehicleIndex === '') {
      setSnackbar({ open: true, message: 'Please fill all required fields including vehicle selection', severity: 'error' });
      return;
    }
    
    // Validate that start time is at least 10 minutes from now
    const startTime = new Date(bookingForm.startTime);
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
    if (startTime < tenMinutesFromNow) {
      setSnackbar({ open: true, message: 'Start time must be at least 10 minutes from now', severity: 'error' });
      return;
    }
    
    // Validate charge fields (use defaults if not provided since they're hidden)
    const curr = Number(bookingForm.currentCharge || 20);
    const targ = Number(bookingForm.targetCharge || 80);
    if (Number.isNaN(curr) || Number.isNaN(targ) || curr < 0 || curr > 100 || targ < 0 || targ > 100 || curr >= targ) {
      setSnackbar({ open: true, message: 'Invalid charge levels detected. Please try again.', severity: 'error' });
      return;
    }

    // Map selected user vehicle to catalog vehicle ID (by make+model)
    const idx = Number(bookingForm.selectedVehicleIndex);
    const sel = myVehicles[idx];
    const norm = (s) => String(s || '').trim().toLowerCase();
    const catalogMatch = catalogVehicles.find(cv => norm(cv.make) === norm(sel?.make) && norm(cv.model) === norm(sel?.model));
    if (!catalogMatch?._id) {
      setSnackbar({ open: true, message: 'Selected vehicle not found in catalog. Please contact support.', severity: 'error' });
      return;
    }

    setBookingLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      
      const requestBody = {
        stationId: id,
        chargerType: bookingForm.chargerType,
        startTime: new Date(bookingForm.startTime).toISOString(),
        endTime: new Date(bookingForm.endTime).toISOString(),
        vehicleId: catalogMatch._id,
        currentCharge: curr,
        targetCharge: targ
      };

      console.log('Creating payment order:', requestBody);

      // Create Razorpay order instead of direct booking
      const response = await fetch(`${apiBase}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('Payment order response:', result);
      
      if (result.success) {
        // Initialize Razorpay payment
        const options = {
          key: result.data.keyId,
          amount: result.data.amount,
          currency: result.data.currency,
          name: 'NexCharge',
          description: `Charging at ${result.data.stationName}`,
          order_id: result.data.orderId,
          handler: async function (response) {
            console.log('Payment successful:', response);
            await handlePaymentSuccess(response, result.data.bookingId);
          },
          prefill: {
            name: user?.personalInfo?.firstName + ' ' + user?.personalInfo?.lastName,
            email: user?.personalInfo?.email,
            contact: user?.personalInfo?.phone
          },
          theme: {
            color: '#1976d2'
          },
          modal: {
            ondismiss: function() {
              console.log('Payment cancelled by user');
              setSnackbar({ open: true, message: 'Payment cancelled', severity: 'warning' });
              setBookingLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        const errorMsg = result.message || `Failed to create payment order (${response.status})`;
        console.error('Payment order failed:', errorMsg, result);
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        setBookingLoading(false);
      }
    } catch (err) {
      console.error('Payment order error:', err);
      const errorMsg = err?.message || 'Network error creating payment order';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      setBookingLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResponse, bookingId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

      console.log('Verifying payment:', paymentResponse);

      const verifyResponse = await fetch(`${apiBase}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          bookingId: bookingId
        })
      });

      const verifyResult = await verifyResponse.json();
      console.log('Payment verification response:', verifyResult);

      if (verifyResult.success) {
        setSnackbar({ open: true, message: 'Payment successful! Booking confirmed.', severity: 'success' });
        setBookingDialog(false);
        // Refresh recent bookings list
        loadMyBookings();
        // Refresh station details to reflect updated availability
        try {
          const stationRes = await fetch(`${API_BASE}/public/stations/${id}`, { cache: 'no-store' });
          if (stationRes.ok) {
            const stationBody = await stationRes.json();
            if (stationBody?.data) setStation(stationBody.data);
          }
        } catch (_) {}
      } else {
        setSnackbar({ open: true, message: verifyResult.message || 'Payment verification failed', severity: 'error' });
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setSnackbar({ open: true, message: 'Payment verification failed', severity: 'error' });
    } finally {
      setBookingLoading(false);
    }
  };

  // Check if user has completed a booking at this station
  const checkUserCanReview = () => {
    if (!user || !myBookings || myBookings.length === 0) return false;
    
    // Check if user has a completed booking at this station
    return myBookings.some(booking => {
      // Handle both string and object formats for stationId
      const bookingStationId = booking.stationId?._id || booking.stationId;
      return bookingStationId === id && booking.status === 'completed';
    });
  };

  // Check if user has already reviewed this station
  const getUserReview = () => {
    if (!user || !reviews || reviews.length === 0) return null;
    
    // Get user ID in various possible formats
    const userId = user._id || user.id || (user._id && user._id.toString());
    
    return reviews.find(review => {
      // Get review user ID in various possible formats
      const reviewUserId = review.userId?._id || review.userId || (review.userId && review.userId.toString());
      
      // Compare user IDs
      return reviewUserId === userId;
    });
  };

  // Handle like/dislike for reviews
  const handleLikeReview = async (reviewId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setSnackbar({ open: true, message: 'You must be logged in to like a review', severity: 'error' });
        return;
      }

      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      const response = await fetch(`${apiBase}/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the reviews state with new like count
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review._id === reviewId 
              ? { ...review, likes: result.data.likes, dislikes: result.data.dislikes } 
              : review
          )
        );
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to like review', severity: 'error' });
      }
    } catch (error) {
      console.error('Error liking review:', error);
      setSnackbar({ open: true, message: 'Network error liking review', severity: 'error' });
    }
  };

  const handleDislikeReview = async (reviewId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setSnackbar({ open: true, message: 'You must be logged in to dislike a review', severity: 'error' });
        return;
      }

      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      const response = await fetch(`${apiBase}/reviews/${reviewId}/dislike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the reviews state with new dislike count
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review._id === reviewId 
              ? { ...review, likes: result.data.likes, dislikes: result.data.dislikes } 
              : review
          )
        );
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to dislike review', severity: 'error' });
      }
    } catch (error) {
      console.error('Error disliking review:', error);
      setSnackbar({ open: true, message: 'Network error disliking review', severity: 'error' });
    }
  };

  // Handle review submission
  const handleReviewSubmit = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setSnackbar({ open: true, message: 'You must be logged in to submit a review', severity: 'error' });
        return;
      }

      // Check if user has completed a booking at this station
      const completedBooking = myBookings.find(booking => {
        // Handle both string and object formats for stationId
        const bookingStationId = booking.stationId?._id || booking.stationId;
        return bookingStationId === id && booking.status === 'completed';
      });

      if (!completedBooking) {
        setSnackbar({ open: true, message: 'You can only review stations where you have completed a booking', severity: 'error' });
        return;
      }

      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      
      // Always create a new review (no editing)
      const url = `${apiBase}/reviews`;
      const method = 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stationId: id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          bookingId: completedBooking._id || completedBooking.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSnackbar({ open: true, message: 'Review submitted successfully', severity: 'success' });
        setShowReviewForm(false);
        setReviewForm({ rating: 0, comment: '' });
        // Reload reviews
        loadReviews();
        // Refresh station details to reflect updated rating
        try {
          const stationRes = await fetch(`${API_BASE}/public/stations/${id}`, { cache: 'no-store' });
          if (stationRes.ok) {
            const stationBody = await stationRes.json();
            if (stationBody?.data) setStation(stationBody.data);
          }
        } catch (_) {}
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to submit review', severity: 'error' });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setSnackbar({ open: true, message: 'Network error submitting review', severity: 'error' });
    }
  };

  // Handle review deletion
  const handleDeleteReview = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setSnackbar({ open: true, message: 'You must be logged in to delete a review', severity: 'error' });
        return;
      }

      const userReview = getUserReview();
      if (!userReview) {
        setSnackbar({ open: true, message: 'No review found to delete', severity: 'error' });
        return;
      }

      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete your review?')) {
        return;
      }

      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      const response = await fetch(`${apiBase}/reviews/${userReview._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setSnackbar({ open: true, message: 'Review deleted successfully', severity: 'success' });
        setShowReviewForm(false);
        setReviewForm({ rating: 0, comment: '' });
        // Reload reviews
        loadReviews();
        // Refresh station details to reflect updated rating
        try {
          const stationRes = await fetch(`${API_BASE}/public/stations/${id}`, { cache: 'no-store' });
          if (stationRes.ok) {
            const stationBody = await stationRes.json();
            if (stationBody?.data) setStation(stationBody.data);
          }
        } catch (_) {}
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to delete review', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      setSnackbar({ open: true, message: 'Network error deleting review', severity: 'error' });
    }
  };

  // Load reviews for the station
  const loadReviews = useCallback(async () => {
    try {
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      const response = await fetch(`${apiBase}/reviews/station/${id}`);
      if (response.ok) {
        const result = await response.json();
        setReviews(result.data || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  }, [id]);

  // Populate review form when showing form - always reset to initial values
  useEffect(() => {
    if (showReviewForm) {
      // Reset form for new review
      setReviewForm({
        rating: 0,
        comment: ''
      });
    }
  }, [showReviewForm]);

  useEffect(() => {
    const load = async () => {
      try {
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
        const [stationRes, userRes] = await Promise.all([
          fetch(`${apiBase}/public/stations/${id}`),
          getMe().catch(() => null)
        ]);
        
        if (!stationRes.ok) throw new Error(`Failed to load station: ${stationRes.status}`);
        const stationData = await stationRes.json();
        setStation(stationData?.data);
        
        // Set the first image as the selected image when station data loads
        if (stationData?.data?.images && stationData.data.images.length > 0) {
          setSelectedImage(stationData.data.images[0]);
        }

        // Load user's vehicles, catalog vehicles, bookings, and reviews
        await Promise.all([
          loadMyVehicles(), 
          loadCatalogVehicles(), 
          loadMyBookings(),
          loadReviews()
        ]);

        if (userRes) {
          setUser(userRes);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, loadReviews]);

  // Calculate available chargers by type - use real-time availability data
  const getAvailableChargersByType = (type) => {
    // Use real-time availability data if available
    if (realTimeAvailability?.availabilityByType?.[type]) {
      const typeData = realTimeAvailability.availabilityByType[type];
      return Array.from({ length: typeData.available }, (_, i) => ({
        chargerId: `realtime-${type}-${i}`,
        type: type,
        power: station?.capacity?.maxPowerPerCharger || 50,
        isAvailable: true
      }));
    }
    
    // Fallback to static data
    const availableChargers = station?.capacity?.availableChargers || [];
    const chargersOfType = availableChargers.filter(c => c.type === type);
    
    // If we have individual charger data, use it
    if (chargersOfType.length > 0) {
      return chargersOfType;
    }
    
    // Otherwise, if the station has this charger type, assume some are available
    const hasChargerType = station?.capacity?.chargerTypes?.includes(type);
    const totalAvailable = realTimeAvailability?.availableSlots ?? station?.capacity?.availableSlots ?? 0;
    if (hasChargerType && totalAvailable > 0) {
      // Return a mock array with available slots count
      return Array.from({ length: Math.min(totalAvailable, 5) }, (_, i) => ({
        chargerId: `mock-${type}-${i}`,
        type: type,
        power: station?.capacity?.maxPowerPerCharger || 50,
        isAvailable: true
      }));
    }
    
    return [];
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
        <AnimatedBackground />
        <UserNavbar user={user} />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error || !station) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
        <AnimatedBackground />
        <UserNavbar user={user} />
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Typography color="error" sx={{ mb: 2 }}>{error || 'Station not found'}</Typography>
          <Button variant="outlined" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>Back</Button>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <AnimatedBackground />
      <UserNavbar user={user} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="text"
            color="inherit"
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2 }}
          >
            Back to Map
          </Button>
          {station.operational?.status === 'maintenance' && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              🚧 This station is currently under maintenance. Booking is temporarily unavailable.
            </Alert>
          )}
        </Box>

        {/* Enhanced Hero Section */}
        <Card sx={{
          mb: 4,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          position: 'relative'
        }}>
          <Box sx={{
            p: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="7" cy="7" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }
          }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box>
                  <Typography variant="h2" sx={{
                    fontWeight: 800,
                    mb: 1,
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    letterSpacing: '-0.025em'
                  }}>
                    {station.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOnIcon sx={{ mr: 1.5, fontSize: 20 }} />
                    <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '1.1rem' }}>
                      {station.location?.address}, {station.location?.city}, {station.location?.state} {station.location?.pincode}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating value={station.analytics?.rating || 0} readOnly precision={0.5} sx={{ color: '#fbbf24', mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {(station.analytics?.rating || 0).toFixed(1)} ({station.analytics?.totalReviews || 0} reviews)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {station.operational?.operatingHours?.is24Hours ? '🟢 24/7 Open' : '🕐 Limited Hours'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{
                  textAlign: { xs: 'left', md: 'right' },
                  p: 3,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Chip
                    label={station.operational?.status === 'maintenance' 
                      ? '🚧 Under maintenance' 
                      : (() => {
                          const available = realTimeAvailability?.availableSlots ?? station.capacity?.availableSlots ?? 0;
                          return available > 0 ? `⚡ ${available} Available` : '🚫 Full';
                        })()}
                    color={station.operational?.status === 'maintenance' 
                      ? 'warning' 
                      : (() => {
                          const available = realTimeAvailability?.availableSlots ?? station.capacity?.availableSlots ?? 0;
                          return available > 0 ? 'success' : 'error';
                        })()}
                    variant="filled"
                    sx={{
                      fontSize: '1rem',
                      py: 1.5,
                      px: 3,
                      mb: 3,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  />
                  <Typography variant="h3" sx={{
                    fontWeight: 800,
                    mb: 1,
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    ₹{station.pricing?.pricePerMinute ?? station.pricing?.basePrice ?? 0}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    per minute
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Main Content Grid - Two-Column Layout */}
        <Grid container spacing={4}>
          {/* Left Column - 65% width */}
          <Grid item xs={12} lg={8}>
            {/* Station Reviews - Moved to top of left column */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Station Reviews
                </Typography>
                
                {/* Add Review Button - Only shown if user hasn't reviewed yet */}
                {user && checkUserCanReview() && !getUserReview() && !showReviewForm && (
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      setShowReviewForm(true);
                    }}
                    sx={{ mb: 3 }}
                  >
                    Write a Review
                  </Button>
                )}
                
                {/* Delete Review Button - Only shown if user has already reviewed */}
                {user && getUserReview() && !showReviewForm && (
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={handleDeleteReview}
                    sx={{ mb: 3 }}
                  >
                    Delete Review
                  </Button>
                )}
                
                {/* Review Form */}
                {showReviewForm && (
                  <Card sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Write Your Review
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography sx={{ mr: 2 }}>Rating:</Typography>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconButton
                          key={star}
                          sx={{ 
                            fontSize: 32, 
                            color: reviewForm.rating >= star ? '#fbbf24' : '#d1d5db',
                            '&:hover': { color: '#fbbf24' }
                          }}
                          onClick={() => {
                            setReviewForm(prev => ({ ...prev, rating: star }));
                          }}
                        >
                          ★
                        </IconButton>
                      ))}
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      variant="outlined"
                      placeholder="Share your experience at this station..."
                      value={reviewForm.comment}
                      onChange={(e) => {
                        setReviewForm(prev => ({ ...prev, comment: e.target.value }));
                      }}
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button 
                        variant="contained" 
                        onClick={handleReviewSubmit}
                        disabled={reviewForm.rating === 0}
                      >
                        Submit Review
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={() => {
                          setShowReviewForm(false);
                          // Reset form to initial values
                          setReviewForm({
                            rating: 0,
                            comment: ''
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Card>
                )}
                
                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <Stack spacing={3}>
                    {reviews.map((review) => (
                      <Box key={review._id} sx={{ borderBottom: '1px solid #e5e7eb', pb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar 
                            src={review.userId?.personalInfo?.profileImage} 
                            sx={{ width: 40, height: 40, mr: 2 }}
                          >
                            {review.userId?.personalInfo?.firstName?.[0] || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {review.userId?.personalInfo?.firstName} {review.userId?.personalInfo?.lastName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Box
                                  key={star}
                                  component="span"
                                  sx={{ 
                                    fontSize: 16, 
                                    color: review.rating >= star ? '#fbbf24' : '#d1d5db'
                                  }}
                                >
                                  ★
                                </Box>
                              ))}
                              <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                {new Date(review.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        {review.comment && (
                          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                            {review.comment}
                          </Typography>
                        )}
                        {/* Like/Dislike Buttons */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleLikeReview(review._id)}
                              sx={{ 
                                color: review.likedBy?.includes(user?._id) ? '#3b82f6' : 'text.secondary',
                                '&:hover': { color: '#3b82f6' }
                              }}
                            >
                              <ThumbUpIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {review.likes || 0}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDislikeReview(review._id)}
                              sx={{ 
                                color: review.dislikedBy?.includes(user?._id) ? '#ef4444' : 'text.secondary',
                                '&:hover': { color: '#ef4444' }
                              }}
                            >
                              <ThumbDownIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {review.dislikes || 0}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No reviews yet. {user && checkUserCanReview() ? 'Be the first to add a review!' : 'Only users who have completed a booking can review this station.'}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Charging Overview */}
            <Card sx={{ mb: 4, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                  <EvStationIcon sx={{ mr: 1 }} />
                  Charging Overview
                </Typography>

                {/* Enhanced Status Overview */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                    📊 Station Overview
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e5e7eb',
                        textAlign: 'center'
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937', mb: 0.5 }}>
                          {station.capacity?.totalChargers ?? 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Total Chargers
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: (() => {
                          const available = realTimeAvailability?.availableSlots ?? station.capacity?.availableSlots ?? 0;
                          return available > 0 ? '#f0fdf4' : '#fef2f2';
                        })(),
                        border: (() => {
                          const available = realTimeAvailability?.availableSlots ?? station.capacity?.availableSlots ?? 0;
                          return `1px solid ${available > 0 ? '#10b981' : '#dc2626'}`;
                        })(),
                        textAlign: 'center'
                      }}>
                        <Typography variant="h5" sx={{
                          fontWeight: 700,
                          color: (() => {
                            const available = realTimeAvailability?.availableSlots ?? station.capacity?.availableSlots ?? 0;
                            return available > 0 ? '#10b981' : '#dc2626';
                          })(),
                          mb: 0.5
                        }}>
                          {realTimeAvailability?.availableSlots ?? station.capacity?.availableSlots ?? 0}
                        </Typography>
                        <Typography variant="caption" sx={{
                          fontWeight: 500,
                          color: (() => {
                            const available = realTimeAvailability?.availableSlots ?? station.capacity?.availableSlots ?? 0;
                            return available > 0 ? '#059669' : '#b91c1c';
                          })()
                        }}>
                          Available Now
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#f0f9ff',
                        border: '1px solid #0ea5e9',
                        textAlign: 'center'
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0ea5e9', mb: 0.5 }}>
                          {station.capacity?.maxPowerPerCharger ?? 0}
                        </Typography>
                        <Typography variant="caption" color="#0369a1" sx={{ fontWeight: 500 }}>
                          Max Power (kW)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#fef3c7',
                        border: '1px solid #f59e0b',
                        textAlign: 'center'
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#92400e', mb: 0.5 }}>
                          {station.capacity?.totalPowerCapacity ?? 0}
                        </Typography>
                        <Typography variant="caption" color="#78350f" sx={{ fontWeight: 500 }}>
                          Total Capacity (kW)
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Charger Types Grid */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Available Connector Types
                </Typography>
                <Grid container spacing={3}>
                  {(station.capacity?.chargerTypes || []).map((type, idx) => {
                    const available = getAvailableChargersByType(type);
                    const power = available[0]?.power || station.capacity?.maxPowerPerCharger || 50;
                    const isAvailable = available.length > 0;
                    
                    // Check if any user vehicle supports this charger type
                    const userHasCompatibleVehicle = checkVehicleSupport(type, enrichedMyVehicles);
                    const showNotSupported = !userHasCompatibleVehicle && myVehicles && myVehicles.length > 0;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={idx}>
                        <Card sx={{
                          border: `2px solid ${isAvailable ? '#10b981' : '#f3f4f6'}`,
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          background: isAvailable ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' : '#fafafa',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            borderColor: isAvailable ? '#059669' : '#667eea'
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                              {type.toUpperCase()}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {isAvailable ? `${available.length} available` : 'Not available'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {power} kW
                            </Typography>
                            {showNotSupported && (
                              <Typography variant="caption" color="error" sx={{ mb: 2 }}>
                                No compatible vehicle found
                              </Typography>
                            )}
                            {userHasCompatibleVehicle && (
                              <Button
                                variant="contained"
                                color="success"
                                onClick={() => {
                                  setBookingForm((bf) => ({
                                    ...bf,
                                    chargerType: type,
                                    selectedVehicleIndex: ''
                                  }));
                                  setBookingDialog(true);
                                }}
                                sx={{ mt: 2 }}
                              >
                                Book Now
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>

            {/* Station Images */}
            <Card sx={{ mb: 4, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Station Images
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {station.images?.map((img, idx) => (
                    <Box key={idx} sx={{ position: 'relative', width: '100%', height: 0, pb: '56.25%', cursor: 'pointer' }}>
                      <img
                        src={img}
                        alt={`Station ${idx + 1}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        onClick={() => {
                          setSelectedImage(img);
                          setImageViewerOpen(true);
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Station Details */}
            <Card sx={{ mb: 4, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Station Details
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Address:
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {station.location?.address}, {station.location?.city}, {station.location?.state} {station.location?.pincode}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Operating Hours:
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {station.operational?.operatingHours?.is24Hours ? '24/7' : 'Limited Hours'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Pricing:
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    ₹{station.pricing?.pricePerMinute ?? station.pricing?.basePrice ?? 0} per minute
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - 35% width */}
          <Grid item xs={12} lg={4}>
            {/* Map and Directions */}
            <Card sx={{ mb: 4, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Map and Directions
                </Typography>
                {/* Small Map Preview */}
                <Box sx={{ mb: 2, height: 200 }}>
                  <StationMapPreview station={station} height={200} />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <GetDirectionsButton onClick={() => setDirectionsDialog(true)} />
                </Box>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card sx={{ mb: 4, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Recent Bookings
                </Typography>
                {myBookings.length > 0 ? (
                  <Stack spacing={2}>
                    {myBookings.map((booking) => (
                      <Box key={booking._id} sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {new Date(booking.startTime).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {booking.duration} hours
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No recent bookings
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Booking Dialog */}
        <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Book Charging Slot</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel shrink>Charger Type</InputLabel>
                  <Box sx={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 1,
                    px: 2,
                    py: 1.5,
                    color: bookingForm.chargerType ? 'text.primary' : 'text.secondary'
                  }}>
                    {bookingForm.chargerType
                      ? bookingForm.chargerType.replace('_',' ').toUpperCase()
                      : 'Auto-selected based on your vehicle'}
                  </Box>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
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
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 
                    min: getMinStartTime()
                  }}
                  value={bookingForm.startTime || ''}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ readOnly: true }}
                  value={bookingForm.endTime || ''}
                  required
                />
              </Grid>
              
              {/* estimated Total */}
              <Grid item xs={12}>
                <Box sx={{ mt: 0.5, p: 2, borderRadius: 2, bgcolor: '#f0f9ff', border: '1px solid #0ea5e9' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                    estimated Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
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
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                  Vehicle Selection (for charging optimization)
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
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
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => {
                      localStorage.setItem('openAddVehicle', '1');
                      navigate('/home');
                    }}>
                      Add Vehicle
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                      You need to add a vehicle before booking
                    </Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                {/* Hidden from UI: current charge is assumed for optimization */}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                {/* Hidden from UI: target charge is assumed for optimization */}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBookingDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleBookingSubmit} 
              variant="contained" 
              disabled={bookingLoading}
            >
              {bookingLoading ? 'Processing...' : 'Pay & Book Now'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          <Alert 
            onClose={() => setSnackbar({...snackbar, open: false})} 
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        
        {/* Image Viewer Dialog */}
        <Dialog 
          open={imageViewerOpen} 
          onClose={() => setImageViewerOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              overflow: 'hidden'
            }
          }}
        >
          <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'transparent' }}>
            {selectedImage && (
              <Box 
                component="img" 
                src={selectedImage} 
                alt="Station" 
                sx={{ 
                  maxWidth: '100%', 
                  maxHeight: '80vh', 
                  objectFit: 'contain',
                  borderRadius: 1,
                  bgcolor: 'black'
                }} 
              />
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', bgcolor: 'transparent' }}>
            <Button 
              onClick={() => setImageViewerOpen(false)} 
              variant="contained" 
              sx={{ 
                bgcolor: 'rgba(0, 0, 0, 0.7)', 
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.9)'
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
        
        </Container>
        <Footer />
      </Box>
    );
  };

export default StationDetails;


