import React, { useEffect, useState } from 'react';
import { 
  Box, Container, Typography, Card, CardContent, Chip, Grid, Skeleton, Alert, 
  Button, Divider, Stack, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, IconButton, Tooltip, Collapse
} from '@mui/material';
import { 
  Receipt, Refresh, AttachMoney, ExpandMore, ExpandLess, 
  CheckCircle, Error, HourglassEmpty, InfoOutlined 
} from '@mui/icons-material';
import UserNavbar from '../components/UserNavbar';
import Footer from '../components/Footer';
import { getMe, getMyPaymentsApi, downloadReceiptPdf, requestRefund, retryPayment, getPaymentDetails } from '../utils/api';

const statusColor = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'completed':
    case 'captured':
      return 'success';
    case 'pending':
    case 'created':
    case 'authorized':
      return 'warning';
    case 'failed':
      return 'error';
    case 'refunded':
    case 'partially_refunded':
      return 'info';
    case 'refund_pending':
      return 'warning';
    default:
      return 'default';
  }
};

const statusIcon = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'completed':
    case 'captured':
      return <CheckCircle fontSize="small" />;
    case 'failed':
      return <Error fontSize="small" />;
    case 'pending':
    case 'created':
    case 'refund_pending':
      return <HourglassEmpty fontSize="small" />;
    default:
      return <InfoOutlined fontSize="small" />;
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
  const [refundDialog, setRefundDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({});

  const loadPayments = async () => {
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
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleRefundClick = (payment) => {
    setSelectedPayment(payment);
    setRefundDialog(true);
    setRefundReason('');
  };

  const handleRefundSubmit = async () => {
    if (!refundReason.trim()) {
      alert('Please provide a reason for refund');
      return;
    }

    setRefundLoading(true);
    try {
      await requestRefund(selectedPayment.id, refundReason);
      alert('Refund request submitted successfully');
      setRefundDialog(false);
      loadPayments(); // Reload payments
    } catch (e) {
      alert(e.message || 'Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  const handleRetryPayment = async (paymentId) => {
    try {
      const result = await retryPayment(paymentId);
      // Open Razorpay with new order
      const options = {
        key: result.keyId,
        amount: result.amount,
        currency: result.currency,
        name: 'NexCharge',
        description: `Charging at ${result.stationName}`,
        order_id: result.orderId,
        handler: async function (response) {
          alert('Payment successful!');
          loadPayments();
        },
        theme: {
          color: '#1976d2'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      alert(e.message || 'Failed to retry payment');
    }
  };

  const handleExpandClick = async (paymentId) => {
    if (expandedPayment === paymentId) {
      setExpandedPayment(null);
    } else {
      setExpandedPayment(paymentId);
      // Load detailed payment info if not already loaded
      if (!paymentDetails[paymentId]) {
        try {
          const details = await getPaymentDetails(paymentId);
          setPaymentDetails(prev => ({ ...prev, [paymentId]: details }));
        } catch (e) {
          console.error('Failed to load payment details:', e);
        }
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <UserNavbar user={user} />
      <Box component="main" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937', mb: 0.5 }}>Payments</Typography>
              <Typography variant="body2" color="text.secondary">Transaction history & receipts</Typography>
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
                          <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.stationName}
                              </Typography>
                              <Chip 
                                icon={statusIcon(p.status)} 
                                label={String(p.status).toUpperCase().replace(/_/g, ' ')} 
                                color={statusColor(p.status)} 
                                variant="outlined" 
                                size="small" 
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {formatWindow(p.startTime, p.endTime, p.duration)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {toShortDate(p.paymentDate || p.createdAt)}
                            </Typography>
                          </Stack>
                          
                          <Stack direction="column" spacing={1} alignItems="flex-end">
                            <Stack direction="row" spacing={1} alignItems="center">
                              {p.paymentMethod && (
                                <Chip size="small" label={p.paymentMethod.toUpperCase()} />
                              )}
                              <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
                                ₹{Number(p.paidAmount || p.amount || 0).toFixed(2)}
                              </Typography>
                            </Stack>
                            
                            {p.refundedAmount > 0 && (
                              <Typography variant="caption" color="error.main">
                                Refunded: ₹{Number(p.refundedAmount).toFixed(2)}
                              </Typography>
                            )}
                            
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Download Receipt">
                                <IconButton size="small" onClick={() => downloadReceiptPdf(p.bookingId || p.id)}>
                                  <Receipt fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              {p.canRefund && (
                                <Tooltip title="Request Refund">
                                  <IconButton size="small" color="error" onClick={() => handleRefundClick(p)}>
                                    <AttachMoney fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {p.status === 'failed' && (
                                <Tooltip title="Retry Payment">
                                  <IconButton size="small" color="primary" onClick={() => handleRetryPayment(p.id)}>
                                    <Refresh fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <IconButton size="small" onClick={() => handleExpandClick(p.id)}>
                                {expandedPayment === p.id ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Box>

                        <Collapse in={expandedPayment === p.id} timeout="auto" unmountOnExit>
                          <Divider sx={{ my: 1.5 }} />
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Payment Breakdown</Typography>
                            {p.breakdown && (
                              <Stack spacing={0.5}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Base Amount:</Typography>
                                  <Typography variant="body2">₹{Number(p.breakdown.base || 0).toFixed(2)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">GST (18%):</Typography>
                                  <Typography variant="body2">₹{Number(p.breakdown.gst || 0).toFixed(2)}</Typography>
                                </Box>
                                {p.breakdown.platformFee > 0 && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Platform Fee:</Typography>
                                    <Typography variant="body2">₹{Number(p.breakdown.platformFee).toFixed(2)}</Typography>
                                  </Box>
                                )}
                                <Divider sx={{ my: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Total:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{Number(p.amount || 0).toFixed(2)}</Typography>
                                </Box>
                                {p.netAmount !== undefined && p.netAmount !== p.paidAmount && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>Net Amount:</Typography>
                                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>₹{Number(p.netAmount).toFixed(2)}</Typography>
                                  </Box>
                                )}
                              </Stack>
                            )}
                            
                            {paymentDetails[p.id] && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                  Payment ID: {paymentDetails[p.id]._id}
                                </Typography>
                                {paymentDetails[p.id].razorpay?.paymentId && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Razorpay ID: {paymentDetails[p.id].razorpay.paymentId}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Collapse>
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

      {/* Refund Dialog */}
      <Dialog open={refundDialog} onClose={() => setRefundDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Refund</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are requesting a refund for ₹{Number(selectedPayment?.paidAmount || 0).toFixed(2)}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason for Refund"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Please provide a reason for requesting this refund..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialog(false)} disabled={refundLoading}>Cancel</Button>
          <Button 
            onClick={handleRefundSubmit} 
            variant="contained" 
            color="error"
            disabled={refundLoading || !refundReason.trim()}
          >
            {refundLoading ? 'Processing...' : 'Submit Refund Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsPage;



