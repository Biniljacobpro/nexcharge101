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
  Alert
} from '@mui/material';
import { CurrencyRupee as MoneyIcon } from '@mui/icons-material';
import * as api from '../utils/api';
import { franchiseOwnerService } from '../services/franchiseOwnerService';

const FranchiseCommissionsPage = ({ franchiseId: franchiseIdProp }) => {
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    pendingAmount: 0,
    paidAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [franchiseId, setFranchiseId] = useState(franchiseIdProp);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Fetch franchiseId from backend if not provided as prop
  useEffect(() => {
    const fetchFranchiseId = async () => {
      if (!franchiseIdProp) {
        try {
          const response = await franchiseOwnerService.getDashboardData();
          if (response?.success && response?.data?.franchiseId) {
            setFranchiseId(response.data.franchiseId);
          } else {
            setError('Franchise ID not found. Please wait for dashboard to load or contact your corporate admin if the problem persists.');
          }
        } catch (err) {
          console.error('Error fetching franchise ID:', err);
          setError('Franchise information not available. Please wait for dashboard to load or contact your corporate admin if the problem persists.');
        }
      }
    };
    
    fetchFranchiseId();
  }, [franchiseIdProp]);

  useEffect(() => {
    if (franchiseId) {
      loadCommissions();
      loadStats();
    }
  }, [franchiseId, statusFilter, yearFilter, monthFilter, page]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(yearFilter && { year: yearFilter }),
        ...(monthFilter !== 'all' && { month: monthFilter })
      };
      
      const response = await api.getFranchiseCommissions(franchiseId, params);
      
      if (response.success) {
        setCommissions(response.data.commissions || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.getCommissionStats('franchise', franchiseId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
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

  // Early return if no franchiseId
  if (!franchiseId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6">Franchise ID Not Found</Typography>
          <Typography>Franchise information not available. Please wait for dashboard to load or contact your corporate admin if the problem persists.</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3436' }}>
          Commission Management
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#636e72' }}>
          Track and manage your commission earnings from station bookings
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Earnings"
            value={stats.totalEarnings}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            icon={<MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="This Month"
            value={stats.thisMonth}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            icon={<MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pendingAmount}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            icon={<MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Paid"
            value={stats.paidAmount}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            icon={<MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />}
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            Commission History
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
                      <TableCell><strong>Booking ID</strong></TableCell>
                      <TableCell align="right"><strong>Base Amount</strong></TableCell>
                      <TableCell align="center"><strong>Commission %</strong></TableCell>
                      <TableCell align="right"><strong>Commission</strong></TableCell>
                      <TableCell align="right"><strong>Tax (18%)</strong></TableCell>
                      <TableCell align="right"><strong>Net Amount</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                      <TableCell><strong>Notes</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission._id} hover>
                        <TableCell>{formatDate(commission.createdAt)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {commission.bookingId?._id ? `...${commission.bookingId._id.toString().slice(-8)}` : 'N/A'}
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
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {commission.notes || '-'}
                          </Typography>
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
    </Container>
  );
};

export default FranchiseCommissionsPage;


