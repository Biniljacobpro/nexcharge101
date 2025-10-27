import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, Paper, Chip, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Stack, Snackbar, Alert, Divider } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import UserNavbar from '../components/UserNavbar';
import Footer from '../components/Footer';
import { getMe, updateBookingApi, cancelBookingApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const BookingsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({ startTime: '', duration: '60', chargerType: 'ac_type2' });
  const [bookingDetailsDialog, setBookingDetailsDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [actionLoading, setActionLoading] = useState(false);

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { setBookings([]); return; }
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      const res = await fetch(`${apiBase}/bookings/my-bookings?limit=50&_=${Date.now()}` , { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) setBookings(Array.isArray(data.data) ? data.data : []);
      else setBookings([]);
    } catch (e) {
      setBookings([]);
    }
  };

  const completeBooking = async (bookingId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('accessToken');
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      const res = await fetch(`${apiBase}/bookings/${bookingId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSnackbar({ open: true, message: `Booking completed! Saved ${data.data.savedTime} minutes.`, severity: 'success' });
        await loadBookings();
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to complete booking', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to complete booking', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };


  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setBookingDetailsDialog(true);
    // Fetch payment status to show actual paid amount
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
        const res = await fetch(`${apiBase}/payments/status/${booking._id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPaymentInfo(data.data);
        } else {
          setPaymentInfo(null);
        }
      } catch (_) {
        setPaymentInfo(null);
      }
    })();
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setUser(me);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => { loadBookings(); }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const now = new Date();
  const isCancelled = (b) => b.status === 'cancelled';
  const isCompleted = (b) => b.status === 'completed';
  const upcoming = bookings
    .filter(b => !isCancelled(b) && !isCompleted(b) && new Date(b.startTime) > now)
    .sort((a,b)=> new Date(a.startTime)-new Date(b.startTime));
  const ongoing = bookings
    .filter(b => !isCancelled(b) && !isCompleted(b) && new Date(b.startTime) <= now && new Date(b.endTime) >= now);
  const past = bookings
    .filter(b => !isCancelled(b) && (isCompleted(b) || new Date(b.endTime) < now))
    .sort((a,b)=> new Date(b.endTime)-new Date(a.endTime));
  const cancelled = bookings
    .filter(isCancelled)
    .sort((a,b)=> new Date(b.endTime || b.startTime) - new Date(a.endTime || a.startTime));
  const nextBooking = upcoming[0] || null;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      <UserNavbar user={user} />

      <Box component="main" sx={{ flex: 1, py: { xs: 4, md: 8 } }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <HistoryIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Your Bookings</Typography>
            </Box>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/home')}>
              Back to Home
            </Button>
          </Box>

          {/* Next Booking */}
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Next Booking</Typography>
              {!nextBooking ? (
                <Stack spacing={1} alignItems="flex-start">
                  <Typography variant="body2" color="text.secondary">No upcoming bookings.</Typography>
                  <Button variant="contained" onClick={() => navigate('/stations')}>Find a station</Button>
                </Stack>
              ) : (
                <Paper 
                  variant="outlined" 
                  sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                  onClick={() => openBookingDetails(nextBooking)}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={7}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{nextBooking.stationId?.name || 'Station'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(nextBooking.startTime).toLocaleString()} → {new Date(nextBooking.endTime).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }}}>
                      <Chip size="small" color="primary" label="upcoming" />
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = window.confirm('Are you sure you want to cancel this booking? The slot will be made available again.');
                          if (!ok) return;
                          try {
                            await cancelBookingApi(nextBooking._id, 'User requested');
                            await loadBookings();
                          } catch (e) {
                            alert(e.message || 'Failed to cancel booking');
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Ongoing */}
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="success" />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Ongoing</Typography>
              </Box>
              {ongoing.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No ongoing bookings.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {ongoing.map((b) => (
                    <Paper key={b._id} variant="outlined" sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }} onClick={() => openBookingDetails(b)}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{b.stationId?.name || 'Station'}</Typography>
                          <Typography variant="caption" color="text.secondary">{new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip size="small" color="success" label="ongoing" />
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Complete this charging session? The remaining time will be freed up.')) {
                                completeBooking(b._id);
                              }
                            }}
                            disabled={actionLoading}
                          >
                            Complete
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* History */}
        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DoneAllIcon color="action" />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>History</Typography>
            </Box>
            {past.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No past bookings.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {past.map((b) => (
                  <Paper key={b._id} variant="outlined" sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }} onClick={() => openBookingDetails(b)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{b.stationId?.name || 'Station'}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()}</Typography>
                      </Box>
                      <Chip size="small" label={b.status === 'completed' ? 'completed' : 'past'} color={b.status === 'completed' ? 'success' : 'default'} />
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Cancelled */}
        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DoneAllIcon color="error" />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Cancelled</Typography>
            </Box>
            {cancelled.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No cancelled bookings.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {cancelled.map((b) => (
                  <Paper key={b._id} variant="outlined" sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }} onClick={() => openBookingDetails(b)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{b.stationId?.name || 'Station'}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()}</Typography>
                      </Box>
                      <Chip size="small" color="error" label="cancelled" />
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
        </Container>
      </Box>

      {/* Booking Details Dialog */}
      <Dialog open={bookingDetailsDialog} onClose={() => { setBookingDetailsDialog(false); setSelectedBooking(null); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Booking Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Station</Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>{selectedBooking.stationId?.name || 'Unknown Station'}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Time Period</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(selectedBooking.startTime).toLocaleString()} → {new Date(selectedBooking.endTime).toLocaleString()}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Duration</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedBooking.duration || 60} minutes</Typography>
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Charger Type</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedBooking.chargerType || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                <Chip 
                  label={selectedBooking.status} 
                  color={selectedBooking.status === 'confirmed' ? 'success' : selectedBooking.status === 'cancelled' ? 'error' : 'default'}
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Estimated Cost</Typography>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>₹{selectedBooking.pricing?.estimatedCost || 0}</Typography>

                {paymentInfo?.paymentStatus === 'completed' && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Paid Amount</Typography>
                    <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>₹{paymentInfo.paidAmount}</Typography>
                    {paymentInfo.paymentMethod && (
                      <Typography variant="body2" sx={{ mb: 1 }}>Method: {paymentInfo.paymentMethod.toUpperCase()}</Typography>
                    )}
                    {paymentInfo.paymentDate && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Paid on: {new Date(paymentInfo.paymentDate).toLocaleString()}
                      </Typography>
                    )}
                  </>
                )}
                
                {selectedBooking.pricing?.actualCost && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Actual Cost</Typography>
                    <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>₹{selectedBooking.pricing.actualCost}</Typography>
                  </>
                )}
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booking ID</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, display: 'block' }}>
                  {selectedBooking._id}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setBookingDetailsDialog(false); setSelectedBooking(null); setPaymentInfo(null); }}>Close</Button>
        </DialogActions>
      </Dialog>


      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </Box>
  );
};

export default BookingsPage;
