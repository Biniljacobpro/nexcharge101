import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import corporateService from '../services/corporateService';

const UserRetentionRisk = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [riskFilter, setRiskFilter] = useState('High');
  const [campaignDialog, setCampaignDialog] = useState({ open: false, user: null });
  const [campaignForm, setCampaignForm] = useState({ message: '', discount: 10 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Chart data
  const [riskDistribution, setRiskDistribution] = useState([
    { name: 'High Risk', value: 0, color: '#f44336' },
    { name: 'Medium Risk', value: 0, color: '#ff9800' },
    { name: 'Low Risk', value: 0, color: '#4caf50' }
  ]);

  // Load churn risk data
  useEffect(() => {
    loadChurnRiskData();
  }, [riskFilter]);

  const loadChurnRiskData = async () => {
    setLoading(true);
    try {
      // Get users with specific risk level
      const response = await corporateService.getChurnRiskUsers(riskFilter);
      if (response.success) {
        setUsers(response.data.users);
      }
      
      // Get distribution data for all risk levels
      const highRiskResponse = await corporateService.getChurnRiskUsers('High');
      const mediumRiskResponse = await corporateService.getChurnRiskUsers('Medium');
      const lowRiskResponse = await corporateService.getChurnRiskUsers('Low');
      
      if (highRiskResponse.success && mediumRiskResponse.success && lowRiskResponse.success) {
        setRiskDistribution([
          { name: 'High Risk', value: highRiskResponse.data.users.length, color: '#f44336' },
          { name: 'Medium Risk', value: mediumRiskResponse.data.users.length, color: '#ff9800' },
          { name: 'Low Risk', value: lowRiskResponse.data.users.length, color: '#4caf50' }
        ]);
      }
    } catch (error) {
      console.error('Error loading churn risk data:', error);
      setSnackbar({ open: true, message: 'Error loading data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRiskFilterChange = (event) => {
    setRiskFilter(event.target.value);
  };

  const handleInitiateCampaign = (user) => {
    setCampaignDialog({ open: true, user });
    setCampaignForm({ message: `Special offer for our valued customer ${user.firstName}!`, discount: 10 });
  };

  const handleCampaignSubmit = async () => {
    try {
      // In a real implementation, this would send the campaign to the user
      console.log('Campaign sent to:', campaignDialog.user.email);
      console.log('Message:', campaignForm.message);
      console.log('Discount:', campaignForm.discount);
      
      setSnackbar({ open: true, message: `Campaign initiated for ${campaignDialog.user.firstName}`, severity: 'success' });
      setCampaignDialog({ open: false, user: null });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error initiating campaign', severity: 'error' });
    }
  };

  const formatProbability = (probability) => {
    return `${(probability * 100).toFixed(1)}%`;
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return '#f44336';
      case 'Medium': return '#ff9800';
      case 'Low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        User Retention Risk
      </Typography>
      
      {/* Risk Distribution Chart */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Risk Distribution
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ flex: 1, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* User List */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              At-Risk Users
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Risk Level</InputLabel>
                <Select
                  label="Risk Level"
                  value={riskFilter}
                  onChange={handleRiskFilterChange}
                >
                  <MenuItem value="High">High Risk</MenuItem>
                  <MenuItem value="Medium">Medium Risk</MenuItem>
                  <MenuItem value="Low">Low Risk</MenuItem>
                  <MenuItem value="">All Users</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Probability</TableCell>
                    <TableCell>Last Prediction</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No users found with the selected risk level
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.churnRisk} 
                            size="small" 
                            sx={{ 
                              bgcolor: getRiskColor(user.churnRisk),
                              color: 'white'
                            }} 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatProbability(user.churnProbability)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {user.lastPredictionDate 
                              ? new Date(user.lastPredictionDate).toLocaleDateString() 
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleInitiateCampaign(user)}
                          >
                            Initiate Campaign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Campaign Dialog */}
      <Dialog 
        open={campaignDialog.open} 
        onClose={() => setCampaignDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Initiate Retention Campaign
        </DialogTitle>
        <DialogContent>
          {campaignDialog.user && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Sending campaign to: <strong>{campaignDialog.user.firstName} {campaignDialog.user.lastName}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={campaignForm.message}
                onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Discount Percentage"
                type="number"
                value={campaignForm.discount}
                onChange={(e) => setCampaignForm({ ...campaignForm, discount: e.target.value })}
                InputProps={{ endAdornment: '%' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCampaignDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleCampaignSubmit} 
            variant="contained"
            disabled={!campaignDialog.user}
          >
            Send Campaign
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
};

export default UserRetentionRisk;