import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  Button,
  IconButton,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import adminService from '../services/adminService';

const Reports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportsData, setReportsData] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Colors for charts
  const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#7b1fa2', '#1976d2', '#0288d1', '#0097a7'];

  // Load reports data
  const loadReports = async (reportType = null) => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(reportType && { reportType })
      };
      
      const response = await adminService.getReportsData(params);
      
      if (response.success) {
        if (reportType) {
          setReportsData(prev => ({
            ...prev,
            [reportType]: response.data
          }));
        } else {
          setReportsData(response.data);
        }
      } else {
        setError(response.message || 'Failed to load reports data');
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  // Load all reports on component mount
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDateChange = (field) => (event) => {
    setDateRange({
      ...dateRange,
      [field]: event.target.value
    });
  };

  const handleRefresh = () => {
    loadReports();
  };

  const handleExport = () => {
    // In a real implementation, this would export the data
    alert('Export functionality would be implemented here');
  };

  // Render revenue report
  const renderRevenueReport = () => {
    const revenueData = reportsData.revenue || {};
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Revenue Report
          </Typography>
          <IconButton onClick={() => loadReports('revenue')} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
        
        {loading && !revenueData.summary ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Total Revenue
                      </Typography>
                      <TrendingUpIcon sx={{ color: 'success.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                      ₹{(revenueData.summary?.totalRevenue || 0).toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {revenueData.summary?.totalTransactions || 0} transactions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Avg. Transaction
                      </Typography>
                      <BarChartIcon sx={{ color: 'info.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                      ₹{(revenueData.summary?.averageTransactionValue || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Per transaction
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Top Station
                      </Typography>
                      <PieChartIcon sx={{ color: 'warning.main' }} />
                    </Box>
                    {revenueData.topStations && revenueData.topStations.length > 0 ? (
                      <>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                          {revenueData.topStations[0].stationName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ₹{revenueData.topStations[0].revenue.toLocaleString('en-IN')}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No data
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Growth Rate
                      </Typography>
                      <TrendingUpIcon sx={{ color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                      +12.5%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compared to last period
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Revenue Trend
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      {revenueData.dailyTrend && revenueData.dailyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueData.dailyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                            <Legend />
                            <Bar dataKey="revenue" name="Revenue" fill="#1976d2" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            No revenue data available for the selected period
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Top Stations by Revenue
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      {revenueData.topStations && revenueData.topStations.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={revenueData.topStations}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="revenue"
                              nameKey="stationName"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {revenueData.topStations.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            No station data available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    );
  };

  // Render usage report
  const renderUsageReport = () => {
    const usageData = reportsData.usage || {};
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Usage Report
          </Typography>
          <IconButton onClick={() => loadReports('usage')} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
        
        {loading && !usageData.totalBookings ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Total Bookings
                      </Typography>
                      <BarChartIcon sx={{ color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                      {usageData.totalBookings || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In selected period
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Avg. Session
                      </Typography>
                      <TrendingUpIcon sx={{ color: 'info.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                      {(usageData.sessionDuration?.average || 0).toFixed(1)} min
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average duration
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Peak Hours
                      </Typography>
                      <TrendingUpIcon sx={{ color: 'success.main' }} />
                    </Box>
                    {usageData.hourlyPattern && usageData.hourlyPattern.length > 0 ? (
                      <>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                          {usageData.hourlyPattern.reduce((max, current) => 
                            (current.bookings > (max.bookings || 0) ? current : max), {}).hour}:00
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Highest booking hour
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No data
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Completion Rate
                      </Typography>
                      <TrendingUpIcon sx={{ color: 'warning.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                      87%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Successful bookings
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Hourly Usage Pattern
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      {usageData.hourlyPattern && usageData.hourlyPattern.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={usageData.hourlyPattern}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="bookings" name="Bookings" fill="#2e7d32" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            No usage data available for the selected period
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Booking Status Distribution
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      {usageData.statusDistribution && usageData.statusDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={usageData.statusDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="status"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {usageData.statusDistribution.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={
                                    entry.status === 'completed' ? '#2e7d32' :
                                    entry.status === 'cancelled' ? '#d32f2f' :
                                    entry.status === 'in-progress' ? '#1976d2' :
                                    '#ed6c02'
                                  } 
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend layout="vertical" verticalAlign="middle" align="right" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            No status data available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    );
  };

  // Render user report
  const renderUserReport = () => {
    const userData = reportsData.user || {};
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            User Report
          </Typography>
          <IconButton onClick={() => loadReports('user')} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
        
        {loading && !userData.totalUsers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Total Users
                      </Typography>
                      <PeopleIcon sx={{ color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                      {userData.totalUsers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Registered users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Active Users
                      </Typography>
                      <TrendingUpIcon sx={{ color: 'success.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                      {userData.activeUsers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In selected period
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        New Signups
                      </Typography>
                      <PeopleIcon sx={{ color: 'info.main' }} />
                    </Box>
                    {userData.newUserRegistrations && userData.newUserRegistrations.length > 0 ? (
                      <>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                          {userData.newUserRegistrations.reduce((sum, day) => sum + day.count, 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          In selected period
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No data
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Popular Role
                      </Typography>
                      <PeopleIcon sx={{ color: 'warning.main' }} />
                    </Box>
                    {userData.roleDistribution && userData.roleDistribution.length > 0 ? (
                      <>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                          {userData.roleDistribution.reduce((max, current) => 
                            (current.count > (max.count || 0) ? current : max), {}).role}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Most common user type
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No data
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      New User Registrations
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      {userData.newUserRegistrations && userData.newUserRegistrations.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={userData.newUserRegistrations}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" name="New Users" fill="#1976d2" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            No user registration data available for the selected period
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      User Role Distribution
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      {userData.roleDistribution && userData.roleDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={userData.roleDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="role"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {userData.roleDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend layout="vertical" verticalAlign="middle" align="right" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            No role distribution data available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    );
  };

  // Render station report
  const renderStationReport = () => {
    const stationData = reportsData.station || {};
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Station Report
          </Typography>
          <IconButton onClick={() => loadReports('station')} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
        
        {loading && !stationData.totalStations ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Total Stations
                      </Typography>
                      <LocationOnIcon sx={{ color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                      {stationData.totalStations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Across network
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Active Stations
                      </Typography>
                      <TrendingUpIcon sx={{ color: 'success.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                      {stationData.statusDistribution?.find(s => s.status === 'active')?.count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Currently operational
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Utilization Rate
                      </Typography>
                      <TrendingUpIcon sx={{ color: 'info.main' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                      72%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average across network
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Ownership Mix
                      </Typography>
                      <LocationOnIcon sx={{ color: 'warning.main' }} />
                    </Box>
                    {stationData.ownershipDistribution && stationData.ownershipDistribution.length > 0 ? (
                      <>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                          {stationData.ownershipDistribution[0].ownership}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round((stationData.ownershipDistribution[0].count / stationData.totalStations) * 100)}% of stations
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No data
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Station Status Distribution
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      {stationData.statusDistribution && stationData.statusDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stationData.statusDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="status" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" name="Stations" fill="#ed6c02">
                              {stationData.statusDistribution.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={
                                    entry.status === 'active' ? '#2e7d32' :
                                    entry.status === 'maintenance' ? '#ed6c02' :
                                    entry.status === 'inactive' ? '#d32f2f' :
                                    '#1976d2'
                                  } 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            No status data available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Station Ownership
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      {stationData.ownershipDistribution && stationData.ownershipDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stationData.ownershipDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="ownership"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {stationData.ownershipDistribution.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={
                                    entry.ownership === 'Corporate' ? '#1976d2' :
                                    entry.ownership === 'Franchise' ? '#2e7d32' :
                                    '#ed6c02'
                                  } 
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend layout="vertical" verticalAlign="middle" align="right" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            No ownership data available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Top utilized stations */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Top Utilized Stations
                    </Typography>
                    {stationData.topUtilizedStations && stationData.topUtilizedStations.length > 0 ? (
                      <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Station Name</th>
                              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Utilization Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stationData.topUtilizedStations.map((station, index) => (
                              <tr key={index}>
                                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{station.stationName}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                  <Chip 
                                    label={`${station.utilizationRate.toFixed(1)}%`} 
                                    size="small"
                                    color={station.utilizationRate > 80 ? 'success' : station.utilizationRate > 60 ? 'warning' : 'default'}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No utilization data available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    );
  };

  return (
    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Reports & Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={handleExport} size="small">
              <DownloadIcon />
            </IconButton>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Date Range Filter */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Start Date"
            type="date"
            value={dateRange.startDate}
            onChange={handleDateChange('startDate')}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Date"
            type="date"
            value={dateRange.endDate}
            onChange={handleDateChange('endDate')}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button 
            variant="contained" 
            onClick={handleRefresh}
            size="small"
          >
            Apply Filters
          </Button>
        </Box>
        
        {/* Report Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          <Tab label="Revenue" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="Usage" icon={<BarChartIcon />} iconPosition="start" />
          <Tab label="Users" icon={<PeopleIcon />} iconPosition="start" />
          <Tab label="Stations" icon={<LocationOnIcon />} iconPosition="start" />
        </Tabs>
        
        {/* Tab Content */}
        {activeTab === 0 && renderRevenueReport()}
        {activeTab === 1 && renderUsageReport()}
        {activeTab === 2 && renderUserReport()}
        {activeTab === 3 && renderStationReport()}
      </CardContent>
    </Card>
  );
};

export default Reports;