import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Skeleton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  AddCircleOutline as AddIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMe, getModelsByMakeApi, getCapacitiesByMakeModelApi, getMakesApi, getMyVehiclesApi, addUserVehicleApi, removeUserVehicleApi, updateUserVehicleAtIndexApi, updateBookingApi, cancelBookingApi, generateOTPApi, verifyOTPApi, stopChargingApi } from '../utils/api';
import UserNavbar from '../components/UserNavbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import InteractiveMap from '../components/InteractiveMap';

const UserHomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [requestVehicleDialogOpen, setRequestVehicleDialogOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', year: '', batteryCapacity: '', preferredChargingType: 'fast' });
  const [requestVehicleForm, setRequestVehicleForm] = useState({ make: '', model: '' });
  const [modelsForMake, setModelsForMake] = useState([]);
  const [makes, setMakes] = useState([]);
  const [capacitiesForModel, setCapacitiesForModel] = useState([]);
  const [capacityError, setCapacityError] = useState('');
  const [yearError, setYearError] = useState('');
  const [duplicateError, setDuplicateError] = useState('');
  const [requestVehicleError, setRequestVehicleError] = useState('');
  const [requestVehicleSuccess, setRequestVehicleSuccess] = useState('');
  const [myVehicles, setMyVehicles] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  
  // OTP and charging state
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [chargingStatus, setChargingStatus] = useState({});
  
  // Vehicle makes for autocomplete (same as in admin module)
  const vehicleMakes = [
    'Tata', 'MG', 'Hyundai', 'BYD', 'Mahindra', 'Kia', 'Volkswagen',
    'Tesla', 'Renault', 'VinFast', 'Ather', 'Ola', 'TVS', 'Bajaj',
    'Hero Electric', 'Revolt', 'Okinawa', 'Ampere', 'Oben', 'PureEV',
    'Vespa', 'Piaggio', 'Olectra/Volvo'
  ];
  const [myBookings, setMyBookings] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({ startTime: '', duration: '60', chargerType: 'ac_type2' });

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getMe();
        if (profile.role === 'admin') {
          navigate('/admin');
          return;
        }
        setUser(profile);

        // Fire vehicles fetch in background
        (async () => {
          try {
            setVehiclesLoading(true);
            const list = await getMyVehiclesApi();
            setMyVehicles(Array.isArray(list) ? list : []);
          } catch {
            setMyVehicles([]);
          } finally {
            setVehiclesLoading(false);
          }
        })();

        // Fire bookings fetch in background
        (async () => {
          try {
            setBookingsLoading(true);
            const token = localStorage.getItem('accessToken');
            if (token) {
              const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
              const res = await fetch(`${apiBase}/bookings/my-bookings?limit=5&_=${Date.now()}` , { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
              const data = await res.json();
              if (res.ok && data.success) setMyBookings(Array.isArray(data.data) ? data.data : []);
              else setMyBookings([]);
            } else {
              setMyBookings([]);
            }
          } catch (e) {
            // ignore booking load errors in dashboard
          } finally {
            setBookingsLoading(false);
          }
        })();

        // If redirected here to add a vehicle from StationDetails
        const flag = localStorage.getItem('openAddVehicle');
        if (flag === '1') {
          setEditIndex(null);
          setVehicleForm({ make: '', model: '', year: '', batteryCapacity: '', preferredChargingType: 'fast' });
          setCapacityError('');
          setYearError('');
          setDuplicateError('');
          setVehicleDialogOpen(true);
          localStorage.removeItem('openAddVehicle');
        }
      } catch (e) {
        setError(e.message);
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        // We can render the page while lists load (skeletons will show)
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  // Load available makes when dialog opens
  useEffect(() => {
    if (!vehicleDialogOpen) return;
    (async () => {
      try {
        const mk = await getMakesApi();
        setMakes(mk);
      } catch { setMakes([]); }
    })();
  }, [vehicleDialogOpen]);

  // Load models when make changes
  useEffect(() => {
    if (!vehicleForm.make) {
      setModelsForMake([]);
      return;
    }
    (async () => {
      try {
        const models = await getModelsByMakeApi(vehicleForm.make);
        setModelsForMake(models);
      } catch { 
        setModelsForMake([]); 
      }
    })();
  }, [vehicleForm.make]);

  // Load capacities when make and model change
  useEffect(() => {
    if (!vehicleForm.make || !vehicleForm.model) {
      setCapacitiesForModel([]);
      return;
    }
    (async () => {
      try {
        const caps = await getCapacitiesByMakeModelApi(vehicleForm.make, vehicleForm.model);
        setCapacitiesForModel(caps);
      } catch { 
        setCapacitiesForModel([]); 
      }
    })();
  }, [vehicleForm.make, vehicleForm.model]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  // OTP and charging functions
  const handleGenerateOTP = async (bookingId) => {
    try {
      setOtpLoading(true);
      await generateOTPApi(bookingId);
      alert('OTP sent to your email! Check your inbox.');
    } catch (error) {
      alert(error.message || 'Failed to generate OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (bookingId, otp) => {
    try {
      setOtpLoading(true);
      await verifyOTPApi(bookingId, otp);
      setChargingStatus(prev => ({ ...prev, [bookingId]: 'started' }));
      setOtpInput('');
      alert('Charging started successfully!');
      // Refresh bookings to update status
      const token = localStorage.getItem('accessToken');
      if (token) {
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
        const res = await fetch(`${apiBase}/bookings/my-bookings?limit=5&_=${Date.now()}` , { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const data = await res.json();
        if (res.ok && data.success) setMyBookings(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      alert(error.message || 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleStopCharging = async (bookingId) => {
    try {
      setOtpLoading(true);
      await stopChargingApi(bookingId);
      setChargingStatus(prev => ({ ...prev, [bookingId]: 'stopped' }));
      alert('Charging stopped successfully!');
      // Refresh bookings to update status
      const token = localStorage.getItem('accessToken');
      if (token) {
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
        const res = await fetch(`${apiBase}/bookings/my-bookings?limit=5&_=${Date.now()}` , { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const data = await res.json();
        if (res.ok && data.success) setMyBookings(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      alert(error.message || 'Failed to stop charging');
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Paper sx={{ p: 3, maxWidth: 400 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Error</Typography>
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
          <Typography variant="body2" color="text.secondary">Redirecting to login...</Typography>
        </Paper>
      </Box>
    );
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      <AnimatedBackground />
      <UserNavbar user={user} />

      <Box component="main" sx={{ flex: 1, py: { xs: 4, md: 8 } }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Hero / Greeting */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 5 }}>
              <Avatar
                src={user?.profileImage || undefined}
                sx={{ width: 60, height: 60, bgcolor: user?.profileImage ? 'transparent' : 'primary.main', fontSize: '1.25rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              >
                {!user?.profileImage && `${(user?.firstName || 'U')[0]}${(user?.lastName || 'N')[0]}`}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', letterSpacing: -0.2 }}>
                  {(() => { const h=new Date().getHours(); const t=h<12?'Good morning':h<18?'Good afternoon':'Good evening'; return `${t}, ${user?.firstName || 'User'}!`; })()}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Find stations, manage bookings, and keep your EV ready.
                </Typography>
              </Box>
            </Box>

            {/* Next Booking Widget */}
            <Box sx={{ mb: 4 }}>
              {bookingsLoading ? (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Skeleton variant="text" width={180} height={24} />
                  <Skeleton variant="text" width={280} height={18} />
                  <Skeleton variant="rectangular" height={36} sx={{ mt: 1, borderRadius: 1 }} />
                </Paper>
              ) : (() => {
                const now = new Date();
                const upcoming = (myBookings || [])
                  .filter(b => (b.status !== 'cancelled' && b.status !== 'completed') && new Date(b.startTime) > now)
                  .sort((a,b) => new Date(a.startTime) - new Date(b.startTime));
                const next = upcoming[0];
                if (!next) return null;
                const start = new Date(next.startTime);
                const end = new Date(next.endTime);
                const canCancel = (start.getTime() - Date.now()) >= 2*60*60*1000;
                const isChargingStarted = chargingStatus[next._id] === 'started';
                const isChargingStopped = chargingStatus[next._id] === 'stopped';
                const timeToStart = Math.round((start.getTime() - now.getTime()) / (1000 * 60)); // minutes
                const canStartCharging = timeToStart <= 5 && timeToStart >= -15; // 5 minutes before to 15 minutes after
                
                return (
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={7}>
                        <Typography variant="subtitle2" color="text.secondary">Next Booking</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{next.stationId?.name || 'Station'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {start.toLocaleString()} → {end.toLocaleString()}
                        </Typography>
                        
                        {/* OTP Input Section */}
                        {canStartCharging && !isChargingStopped && !isChargingStarted && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                              🔐 Enter OTP to Start Charging
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                              <TextField
                                size="small"
                                placeholder="6-digit OTP"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                sx={{ width: 120 }}
                                disabled={otpLoading}
                              />
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                disabled={otpInput.length !== 6 || otpLoading}
                                onClick={() => handleVerifyOTP(next._id, otpInput)}
                              >
                                {otpLoading ? 'Verifying...' : 'Start'}
                              </Button>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleGenerateOTP(next._id)}
                                disabled={otpLoading}
                              >
                                {otpLoading ? 'Sending...' : '📧 Get OTP'}
                              </Button>
                            </Box>
                          </Box>
                        )}
                        
                        {/* Charging Active Section */}
                        {isChargingStarted && !isChargingStopped && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                              🔋 Charging Active
                            </Typography>
                            
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleStopCharging(next._id)}
                              disabled={otpLoading}
                            >
                              {otpLoading ? 'Stopping...' : '⏹️ Stop Charging'}
                            </Button>
                          </Box>
                        )}
                        
                        {/* Charging Completed Section */}
                        {isChargingStopped && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#059669' }}>
                              ✅ Charging Completed
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              This session has been completed
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                        <Chip 
                          size="small" 
                          color={isChargingStarted ? "success" : isChargingStopped ? "warning" : "primary"} 
                          label={isChargingStarted ? "charging" : isChargingStopped ? "stopped" : "upcoming"} 
                        />
                        <Button size="small" variant="outlined" onClick={() => {
                          setEditingBooking(next);
                          setEditForm({
                            startTime: new Date(next.startTime).toISOString().slice(0,16),
                            duration: String(Math.max(30, Math.round((new Date(next.endTime) - new Date(next.startTime)) / (1000*60)))) ,
                            chargerType: next.chargerType || 'ac_type2'
                          });
                          setEditBookingDialogOpen(true);
                        }}>Edit</Button>
                        {canCancel && (
                          <Tooltip title="Cancellations are allowed up to 2 hours before the start time">
                            <Button size="small" color="error" variant="outlined" onClick={async () => {
                              const ok = window.confirm('Are you sure you want to cancel this booking? The slot will be made available again.');
                              if (!ok) return;
                              try {
                                await cancelBookingApi(next._id, 'User requested');
                                // refresh bookings
                                const token = localStorage.getItem('accessToken');
                                if (token) {
                                  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
                                  const res = await fetch(`${apiBase}/bookings/my-bookings?limit=5&_=${Date.now()}` , { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
                                  const data = await res.json();
                                  if (res.ok && data.success) setMyBookings(Array.isArray(data.data) ? data.data : []);
                                  else setMyBookings([]);
                                }
                              } catch (e) {
                                alert(e.message || 'Failed to cancel booking');
                              }
                            }}>Cancel</Button>
                          </Tooltip>
                        )}
                        <Button size="small" onClick={() => navigate('/bookings')}>View all</Button>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })()}
            </Box>

            {/* User Profile Card */}
            <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid item xs={12} md={12} lg={12}>
                <Grid container spacing={3}>
                  {/* Quick Actions */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
                        Quick Actions
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card onClick={() => navigate('/stations')} sx={{ height: '100%', borderRadius: 3, boxShadow: '0 6px 24px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 28px rgba(0,0,0,0.12)' } }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 3, minHeight: 150 }}>
                        <LocationIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          Find Stations
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mx: 'auto' }}>
                          Locate nearby charging stations
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card onClick={() => {
                      setEditIndex(null);
                      setVehicleForm({ make: '', model: '', year: '', batteryCapacity: '', preferredChargingType: 'fast' });
                      setCapacityError('');
                      setYearError('');
                      setDuplicateError('');
                      setVehicleDialogOpen(true);
                    }} sx={{ height: '100%', borderRadius: 3, boxShadow: '0 6px 24px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 28px rgba(0,0,0,0.12)' } }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 3, minHeight: 150 }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                          <CarIcon sx={{ fontSize: 40, color: 'success.main' }} />
                          <AddIcon sx={{ position: 'absolute', right: -8, bottom: -6, fontSize: 20, color: 'success.main' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                          Add Your Vehicle
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mx: 'auto' }}>
                          Select from admin-added makes and models
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card onClick={() => navigate('/bookings')} sx={{ height: '100%', borderRadius: 3, boxShadow: '0 6px 24px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 28px rgba(0,0,0,0.12)' } }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 3, minHeight: 150 }}>
                        <HistoryIcon sx={{ fontSize: 40, color: 'info.main', mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          Bookings
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mx: 'auto' }}>
                          View your reservations
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card onClick={() => navigate('/payments')} sx={{ height: '100%', borderRadius: 3, boxShadow: '0 6px 24px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 28px rgba(0,0,0,0.12)' } }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 3, minHeight: 150 }}>
                        <PaymentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          Payments
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mx: 'auto' }}>
                          Manage payment methods
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Nearby Charging Stations */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937', mb: 2 }}>
                Nearby Charging Stations
              </Typography>
              <InteractiveMap />
            </Box>

            {/* Recent Activity */}
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 6, borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Recent Activity
                  </Typography>
                  <Button size="small" onClick={() => navigate('/bookings')}>View all</Button>
                </Box>
                {(!myBookings || myBookings.length === 0) ? (
                  bookingsLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[1,2,3].map(k => (
                        <Paper key={k} variant="outlined" sx={{ p: 2 }}>
                          <Skeleton variant="text" width={220} height={20} />
                          <Skeleton variant="text" width={300} height={16} />
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">No recent bookings.</Typography>
                      <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/stations')}>Book your first charge</Button>
                    </Box>
                  )
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {myBookings.map((b) => {
                      const now = new Date();
                      const start = new Date(b.startTime);
                      const end = new Date(b.endTime);
                      const isPast = end < now;
                      const isUpcoming = start > now;
                      const isCancelled = b.status === 'cancelled';
                      const isCompleted = b.status === 'completed';
                      const label = isCancelled ? 'cancelled' : (isCompleted ? 'completed' : (isPast ? 'past' : (isUpcoming ? 'upcoming' : 'ongoing')));
                      const chipColor = isCancelled ? 'error' : (isCompleted ? 'default' : (isPast ? 'default' : (isUpcoming ? 'primary' : 'success')));
                      return (
                        <Paper key={b._id} variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {b.stationId?.name || 'Station'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {start.toLocaleString()} → {end.toLocaleString()}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip size="small" color={chipColor} label={label} />
                              {isUpcoming && !isCancelled && (
                                <Button size="small" variant="outlined" onClick={() => {
                                  setEditingBooking(b);
                                  setEditForm({
                                    startTime: new Date(b.startTime).toISOString().slice(0,16),
                                    duration: String(Math.max(30, Math.round((new Date(b.endTime) - new Date(b.startTime)) / (1000*60)))),
                                    chargerType: b.chargerType || 'ac_type2'
                                  });
                                  setEditBookingDialogOpen(true);
                                }}>Edit</Button>
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mt: 4, borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Your Vehicles
                  </Typography>
                  <Button variant="outlined" onClick={() => {
                      setEditIndex(null);
                      setVehicleForm({ make: '', model: '', year: '', batteryCapacity: '', preferredChargingType: 'fast' });
                      setCapacityError('');
                      setYearError('');
                      setDuplicateError('');
                      setVehicleDialogOpen(true);
                    }}>Add Vehicle</Button>
                </Box>
                {myVehicles.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No vehicles added yet.</Typography>
                ) : (
                  <Grid container spacing={3} justifyContent="center">
                    {myVehicles.map((vehicle, index) => (
                      <Grid item xs={12} sm={6} md={4} key={`${vehicle.make}-${vehicle.model}-${index}`}>
                        <Paper sx={{ p: 3, border: '1px solid #e5e7eb', borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                            <CarIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'left' }}>
                                {vehicle.make} {vehicle.model}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                                {vehicle.year || ''}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 'auto' }}>
                            <Button 
                              size="small" 
                              onClick={() => {
                                setEditIndex(index);
                                setVehicleDialogOpen(true);
                                setVehicleForm({
                                  make: vehicle.make || '',
                                  model: vehicle.model || '',
                                  year: vehicle.year ? String(vehicle.year) : '',
                                  batteryCapacity: vehicle.batteryCapacity ? String(vehicle.batteryCapacity) : '',
                                  preferredChargingType: vehicle.preferredChargingType || 'fast'
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="small" 
                              color="error" 
                              onClick={async () => {
                                try {
                                  const list = await removeUserVehicleApi(index);
                                  setMyVehicles(list);
                                } catch (e) {
                                  setError(e.message || 'Failed to remove vehicle');
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </Box>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                              Battery: {vehicle.batteryCapacity} kWh
                            </Typography>
                            {vehicle.preferredChargingType && (
                              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                                Preferred: {vehicle.preferredChargingType}
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>

            
          </motion.div>
        </Container>
      </Box>

      <Footer />

      {/* Request New Vehicle Dialog */}
      <Dialog 
        open={requestVehicleDialogOpen} 
        onClose={() => { 
          setRequestVehicleDialogOpen(false);
          setRequestVehicleForm({ make: '', model: '' });
          setRequestVehicleError('');
          setRequestVehicleSuccess('');
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Request New Vehicle</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Can't find your vehicle in our list? Request it here and our team will add it.
          </Typography>
          
          {requestVehicleSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {requestVehicleSuccess}
            </Alert>
          )}
          
          {requestVehicleError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {requestVehicleError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                options={vehicleMakes}
                value={requestVehicleForm.make}
                onChange={(event, newValue) => {
                  setRequestVehicleForm({ ...requestVehicleForm, make: newValue || '' });
                  setRequestVehicleError('');
                }}
                onInputChange={(event, newInputValue) => {
                  if (event && event.type === 'change') {
                    setRequestVehicleForm({ ...requestVehicleForm, make: newInputValue });
                    setRequestVehicleError('');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Make"
                    placeholder="Search for a make (e.g., Tesla)"
                    required
                    helperText="Select or type the make of your vehicle"
                  />
                )}
                freeSolo
                clearOnEscape
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Model"
                value={requestVehicleForm.model}
                onChange={(e) => {
                  setRequestVehicleForm({ ...requestVehicleForm, model: e.target.value });
                  setRequestVehicleError('');
                }}
                required
                helperText="Enter the model of your vehicle (e.g., Model 3, Leaf, etc.)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => { 
              setRequestVehicleDialogOpen(false);
              setRequestVehicleForm({ make: '', model: '' });
              setRequestVehicleError('');
              setRequestVehicleSuccess('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              setRequestVehicleError('');
              setRequestVehicleSuccess('');
              
              // Validation
              if (!requestVehicleForm.make.trim()) {
                setRequestVehicleError('Make is required');
                return;
              }
              
              if (!requestVehicleForm.model.trim()) {
                setRequestVehicleError('Model is required');
                return;
              }
              
              try {
                // Import the API function
                const { createVehicleRequestApi } = await import('../utils/api');
                await createVehicleRequestApi({
                  make: requestVehicleForm.make.trim(),
                  model: requestVehicleForm.model.trim()
                });
                
                setRequestVehicleSuccess('Vehicle request submitted successfully! Our team will review it.');
                
                // Clear form after success
                setRequestVehicleForm({ make: '', model: '' });
                
                // Close dialog after 2 seconds
                setTimeout(() => {
                  setRequestVehicleDialogOpen(false);
                  setRequestVehicleSuccess('');
                }, 2000);
              } catch (e) {
                setRequestVehicleError(e.message || 'Failed to submit vehicle request');
              }
            }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Vehicle Dialog */}
      <Dialog open={vehicleDialogOpen} onClose={() => { 
                      setVehicleDialogOpen(false); 
                      setEditIndex(null);
                      setVehicleForm({ make: '', model: '', year: '', batteryCapacity: '', preferredChargingType: 'fast' });
                      setCapacityError('');
                      setYearError('');
                      setDuplicateError('');
                    }} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Your Vehicle
          <Button 
            size="small" 
            onClick={() => {
              setVehicleDialogOpen(false);
              setRequestVehicleDialogOpen(true);
            }}
            sx={{ float: 'right', mt: -0.5 }}
          >
            Request Vehicle Model
          </Button>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Make"
                value={vehicleForm.make}
                onChange={async (e) => {
                  const make = e.target.value;
                  setVehicleForm({ ...vehicleForm, make, model: '', batteryCapacity: '' });
                  setCapacityError('');
                  setDuplicateError('');
                  setYearError('');
                }}
                required
                helperText={makes.length === 0 ? 'No makes available' : ''}
              >
                {makes.map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Model"
                value={vehicleForm.model}
                onChange={async (e) => {
                  const model = e.target.value;
                  setVehicleForm({ ...vehicleForm, model, batteryCapacity: '' });
                  setCapacityError('');
                  setDuplicateError('');
                  setYearError('');
                }}
                required
                helperText={!vehicleForm.make ? 'Select make first' : (duplicateError || '')}
                error={!!duplicateError}
              >
                {modelsForMake.map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                inputProps={{ min: 2015, max: new Date().getFullYear() }}
                value={vehicleForm.year}
                onChange={(e) => { setVehicleForm({ ...vehicleForm, year: e.target.value }); setYearError(''); setDuplicateError(''); }}
                helperText={yearError || ((vehicleForm.year && (Number(vehicleForm.year) < 2015 || Number(vehicleForm.year) > new Date().getFullYear())) ? `Enter a year between 2015 and ${new Date().getFullYear()}` : '')}
                error={!!yearError || (!!vehicleForm.year && (Number(vehicleForm.year) < 2015 || Number(vehicleForm.year) > new Date().getFullYear()))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Battery Capacity (kWh)"
                value={vehicleForm.batteryCapacity}
                onChange={(e) => {
                  setVehicleForm({ ...vehicleForm, batteryCapacity: e.target.value });
                  setCapacityError('');
                  setDuplicateError('');
                  setYearError('');
                }}
                required
                helperText={!vehicleForm.model ? 'Select model first' : capacityError}
                error={!!capacityError}
              >
                {capacitiesForModel.map((c) => (
                  <MenuItem key={c} value={String(c)}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Preferred Charging"
                value={vehicleForm.preferredChargingType}
                onChange={(e) => setVehicleForm({ ...vehicleForm, preferredChargingType: e.target.value })}
              >
                <MenuItem value="fast">Fast</MenuItem>
                <MenuItem value="slow">Slow</MenuItem>
                <MenuItem value="rapid">Rapid</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { 
                      setVehicleDialogOpen(false); 
                      setEditIndex(null);
                      setVehicleForm({ make: '', model: '', year: '', batteryCapacity: '', preferredChargingType: 'fast' });
                      setCapacityError('');
                      setYearError('');
                      setDuplicateError('');
                    }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              setCapacityError(''); setYearError(''); setDuplicateError('');
              if (!vehicleForm.make || !vehicleForm.model || !vehicleForm.batteryCapacity) {
                setCapacityError(!vehicleForm.batteryCapacity ? 'Battery capacity is required' : capacityError);
                return;
              }
            if (capacityError) return;
            // Inline duplicate validation (case-insensitive, trim)
            const norm = (s) => String(s || '').trim().toLowerCase();
            const make = vehicleForm.make.trim();
            const model = vehicleForm.model.trim();
            const year = vehicleForm.year ? Number(vehicleForm.year) : undefined;
            const batteryCapacity = Number(vehicleForm.batteryCapacity);
            const dup = myVehicles.some((v, i) => (editIndex === null || i !== editIndex) &&
              norm(v.make) === norm(make) &&
              norm(v.model) === norm(model) &&
              (v.year || undefined) === year &&
              Number(v.batteryCapacity) === batteryCapacity
            );
            if (dup) {
              setDuplicateError('Vehicle with same details already exists');
              return;
            }
            // Year bounds
            if (year && (year < 2015 || year > new Date().getFullYear())) {
              setYearError(`Enter a year between 2015 and ${new Date().getFullYear()}`);
              return;
            }
              try {
                let list;
                if (editIndex !== null) {
                  list = await updateUserVehicleAtIndexApi(editIndex, {
                    make,
                    model,
                    year,
                    batteryCapacity,
                    preferredChargingType: vehicleForm.preferredChargingType
                  });
                } else {
                  // Try to enrich with catalog connectors
                  let chargingAC, chargingDC;
                  try {
                    const caps = await getCapacitiesByMakeModelApi(make, model);
                    // If catalog returns connector details elsewhere, extend here in future
                  } catch {}
                  // If admin added full details to catalog, fetch from public catalog and map by make+model
                  try {
                    const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
                    const res = await fetch(`${apiBase}/public/vehicles`);
                    if (res.ok) {
                      const data = await res.json();
                      const list = Array.isArray(data?.data) ? data.data : [];
                      const norm = (s) => String(s || '').trim().toLowerCase();
                      const v = list.find(cv => norm(cv.make) === norm(make) && norm(cv.model) === norm(model));
                      if (v) {
                        if (v.chargingAC && v.chargingAC.supported) {
                          chargingAC = {
                            supported: true,
                            ...(typeof v.chargingAC.maxPower === 'number' ? { maxPower: v.chargingAC.maxPower } : {}),
                            connectorTypes: Array.isArray(v.chargingAC.connectorTypes) ? v.chargingAC.connectorTypes.map(String) : []
                          };
                        }
                        if (v.chargingDC && v.chargingDC.supported) {
                          chargingDC = {
                            supported: true,
                            ...(typeof v.chargingDC.maxPower === 'number' ? { maxPower: v.chargingDC.maxPower } : {}),
                            connectorTypes: Array.isArray(v.chargingDC.connectorTypes) ? v.chargingDC.connectorTypes.map(String) : []
                          };
                        }
                      }
                    }
                  } catch {}

                  list = await addUserVehicleApi({
                    make,
                    model,
                    year,
                    batteryCapacity,
                    preferredChargingType: vehicleForm.preferredChargingType,
                    ...(chargingAC ? { chargingAC } : {}),
                    ...(chargingDC ? { chargingDC } : {})
                  });
                }
                setMyVehicles(Array.isArray(list) ? list : []);
                setVehicleDialogOpen(false);
                setEditIndex(null);
                setCapacityError(''); setYearError(''); setDuplicateError('');
              } catch (e) {
                setError(e.message || 'Failed to save vehicle');
              }
            }}
          >
            {editIndex !== null ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={editBookingDialogOpen} onClose={() => { setEditBookingDialogOpen(false); setEditingBooking(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Booking</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={editForm.startTime}
                onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16) }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Duration (minutes)"
                value={editForm.duration}
                onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
              >
                {[30,60,90,120,150,180,210,240,270,300].map((m) => (
                  <MenuItem key={m} value={String(m)}>{m}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Charger Type"
                value={editForm.chargerType}
                onChange={(e) => setEditForm({ ...editForm, chargerType: e.target.value })}
              >
                {['type1','type2','bharat_ac_001','bharat_dc_001','ccs2','chademo','gbt_type6','type7_leccs','mcs','chaoji'].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditBookingDialogOpen(false); setEditingBooking(null); }}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
            if (!editingBooking) return;
            
            // Validate that start time is at least 10 minutes from now
            const startTime = new Date(editForm.startTime);
            const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
            if (startTime < tenMinutesFromNow) {
              alert('Start time must be at least 10 minutes from now');
              return;
            }
            
            const startISO = new Date(editForm.startTime).toISOString();
            const endISO = new Date(new Date(editForm.startTime).getTime() + Number(editForm.duration) * 60000).toISOString();
            try {
              await updateBookingApi(editingBooking._id, {
                startTime: startISO,
                endTime: endISO,
                chargerType: editForm.chargerType
              });
              // refresh list
              const token = localStorage.getItem('accessToken');
              if (token) {
                const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
                const res = await fetch(`${apiBase}/bookings/my-bookings?limit=5&_=${Date.now()}` , { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
                const data = await res.json();
                if (res.ok && data.success) setMyBookings(Array.isArray(data.data) ? data.data : []);
              }
              setEditBookingDialogOpen(false);
              setEditingBooking(null);
            } catch (e) {
              alert(e.message || 'Failed to update booking');
            }
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserHomePage;







