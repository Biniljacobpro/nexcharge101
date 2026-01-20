import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { AttachMoney as MoneyIcon, CheckCircle, Payment } from '@mui/icons-material';
import * as api from '../utils/api';

const AdminCommissionsPage = () => {
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({
    totalCommission: 0,
    totalNet: 0,
    pendingCommission: 0,
    paidCommission: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState({ open: false, commission: null });
  const [paymentData, setPaymentData] = useState({
    paymentMethod: '',
    paymentReference: '',
    notes: ''
  });

  useEffect(() => {
    loadCommissions();
  }, [statusFilter, entityTypeFilter, yearFilter, monthFilter, page]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(entityTypeFilter !== 'all' && { entityType: entityTypeFilter }),
        ...(yearFilter && { year: yearFilter }),
        ...(monthFilter !== 'all' && { month: monthFilter })
      };
      
      const response = await api.getAllCommissions(params);
      
      if (response.success && response.data) {
        setCommissions(response.data.commissions || []);
        setTotalPages(response.data.pagination?.pages || 1);
        if (response.data.summary) {
          setStats(response.data.summary);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commissionId) => {
    try {
      setError('');
      await api.approveCommission(commissionId);
      setSuccess('Commission approved successfully');
      loadCommissions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to approve commission');
    }
  };

  const handleOpenPaymentDialog = (commission) => {
    setPaymentDialog({ open: true, commission });
    setPaymentData({
      paymentMethod: '',
      paymentReference: '',
      notes: ''
    });
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialog({ open: false, commission: null });
    setPaymentData({
      paymentMethod: '',
      paymentReference: '',
      notes: ''
    });
  };

  const handleMarkAsPaid = async () => {
    try {
      setError('');
      await api.markCommissionPaid(paymentDialog.commission._id, paymentData);
      setSuccess('Commission marked as paid successfully');
      handleClosePaymentDialog();
      loadCommissions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to mark commission as paid');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'info',
      paid: 'success',
      cancelled: 'error',
      disputed: 'error'
    };
    return colors[status] || 'default';
  };

  const StatCard = ({ title, value, gradient, icon }) => (
    <Card sx={{ 
      background: gradient,
      color: 'white',
      height: '100%'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(value)}
            </Typography>
          </Box>
          {icon}
        </Box>
      </CardContent>
    </Card>
  );

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3436' }}>
          Commission Management
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#636e72' }}>
          Manage and approve commissions for all franchises and corporates
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Commission"
            value={stats.totalCommission}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            icon={<MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Net"
            value={stats.totalNet}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            icon={<MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pendingCommission}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            icon={<MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Paid"
            value={stats.paidCommission}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            icon={<MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />}
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="disputed">Disputed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={entityTypeFilter}
                  label="Entity Type"
                  onChange={(e) => {
                    setEntityTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="franchise">Franchise</MenuItem>
                  <MenuItem value="corporate">Corporate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  value={yearFilter}
                  label="Year"
                  onChange={(e) => {
                    setYearFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  {years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Month</InputLabel>
                <Select
                  value={monthFilter}
                  label="Month"
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  {months.map(month => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            All Commissions
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : commissions.length === 0 ? (
            <Alert severity="info">No commissions found for the selected filters.</Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Owner</strong></TableCell>
                      <TableCell><strong>Station</strong></TableCell>
                      <TableCell align="right"><strong>Base Amount</strong></TableCell>
                      <TableCell align="center"><strong>Rate</strong></TableCell>
                      <TableCell align="right"><strong>Commission</strong></TableCell>
                      <TableCell align="right"><strong>Tax</strong></TableCell>
                      <TableCell align="right"><strong>Net</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission._id} hover>
                        <TableCell>{formatDate(commission.createdAt)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={commission.entityType} 
                            size="small"
                            color={commission.entityType === 'franchise' ? 'primary' : 'secondary'}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {commission.ownerId?.firstName || 'N/A'} {commission.ownerId?.lastName || ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {commission.ownerId?.email || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {commission.stationId?.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(commission.baseAmount)}
                        </TableCell>
                        <TableCell align="center">
                          {commission.commissionRate}%
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(commission.commissionAmount)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(commission.taxAmount)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(commission.netCommission)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={commission.status}
                            color={getStatusColor(commission.status)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {commission.status === 'pending' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<CheckCircle />}
                              onClick={() => handleApprove(commission._id)}
                            >
                              Approve
                            </Button>
                          )}
                          {commission.status === 'approved' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<Payment />}
                              onClick={() => handleOpenPaymentDialog(commission)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Commission as Paid</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Payment Method"
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="e.g., Bank Transfer, UPI, Cheque"
            />
            <TextField
              fullWidth
              label="Payment Reference"
              value={paymentData.paymentReference}
              onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="e.g., Transaction ID, Cheque Number"
            />
            <TextField
              fullWidth
              label="Notes"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              multiline
              rows={3}
              placeholder="Additional notes (optional)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button 
            onClick={handleMarkAsPaid} 
            variant="contained" 
            color="success"
            disabled={!paymentData.paymentMethod || !paymentData.paymentReference}
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCommissionsPage;
