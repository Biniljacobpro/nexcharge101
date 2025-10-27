import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, Chip, Grid, Skeleton, Alert, Button, Divider, Stack } from '@mui/material';
import UserNavbar from '../components/UserNavbar';
import Footer from '../components/Footer';
import { getMe, getMyPaymentsApi, downloadReceiptPdf } from '../utils/api';

const statusColor = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'completed': return 'success';
    case 'pending': return 'warning';
    case 'failed': return 'error';
    case 'refunded': return 'info';
    default: return 'default';
  }
};

const toShortDate = (ts) => {
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const formatWindow = (start, end, duration) => {
  const s = start ? toShortDate(start) : '';
  const e = end ? toShortDate(end) : '';
  const dur = typeof duration === 'number' ? `${duration} min` : '';
  if (s && e && dur) return `${s} → ${e} • ${dur}`;
  if (s && e) return `${s} → ${e}`;
  return s || e || '';
};

const PaymentsPage = () => {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [u, payments] = await Promise.all([getMe(), getMyPaymentsApi()]);
        setUser(u);
        setItems(payments);
      } catch (e) {
        setError(e.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <UserNavbar user={user} />
      <Box component="main" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937', mb: 0.5 }}>Payments</Typography>
              <Typography variant="body2" color="text.secondary">Recent transactions</Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={() => (window.location.href = '/bookings')}>View bookings</Button>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          <Grid container spacing={2}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} key={i}>
                  <Card>
                    <CardContent>
                      <Skeleton width="40%" height={28} />
                      <Skeleton width="60%" />
                      <Skeleton width="20%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              items.length === 0 ? (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="body1" color="text.secondary">No payments found.</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ) : (
                items.map((p) => (
                  <Grid item xs={12} key={p.id}>
                    <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                      <CardContent sx={{ p: 2.0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.stationName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatWindow(p.startTime, p.endTime, p.duration)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Button size="small" variant="text" onClick={() => downloadReceiptPdf(p.id)}>Receipt</Button>
                            <Chip label={String(p.status).toUpperCase()} color={statusColor(p.status)} variant="outlined" size="small" />
                          </Stack>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {toShortDate(p.paymentDate || p.createdAt)}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {p.method && (
                              <Chip size="small" label={p.method.toUpperCase()} />
                            )}
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>₹{Number(p.paidAmount || p.price || 0).toFixed(2)}</Typography>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )
            )}
          </Grid>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default PaymentsPage;



