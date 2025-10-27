import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  FormControlLabel,
  Switch,
  FormGroup,
  Checkbox,
  InputAdornment,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EvStation,
  EvStation as StationIcon,
  Analytics as AnalyticsIcon,
  Security as ComplianceIcon,
  Campaign as PromotionIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Speed,
  CheckCircle,
  Warning,
  Error,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocationOn,
  Schedule,
  Phone,
  Email,
  Power,
  LocalParking,
  AccessTime,
  Business,
  Description,
  Code,
  Map,
  AttachMoney as MoneyIcon,
  Settings,
  ExpandMore,
  BatteryChargingFull
} from '@mui/icons-material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import GoogleMapsLocationPicker from '../components/GoogleMapsLocationPicker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { franchiseOwnerService } from '../services/franchiseOwnerService';
import { updatePasswordApi, uploadProfileImageApi, getMe, updateProfileApi } from '../utils/api';
import nexchargeLogo from '../assets/nexcharge-high-resolution-logo-transparent.png';

const drawerWidth = 280;

const navigationItems = [
  { id: 'overview', label: 'Franchise Dashboard', icon: <DashboardIcon />, description: 'Performance summary across managed stations' },
  { id: 'stations', label: 'Station Management', icon: <StationIcon />, description: 'Add and manage charging stations' },
  { id: 'managers', label: 'Manager Management', icon: <People />, description: 'Add and manage station managers' },
  { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon />, description: 'Monitor uptime, usage, and revenue trends' },
  { id: 'compliance', label: 'Compliance', icon: <ComplianceIcon />, description: 'Ensure stations follow operational guidelines' },
  { id: 'promotions', label: 'Promotion Management', icon: <PromotionIcon />, description: 'Push franchise-wide offers' },
  { id: 'profile', label: 'Profile Settings', icon: <ProfileIcon />, description: 'Manage account and preferences' }
];

const FranchiseOwnerDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editProfileDialog, setEditProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', address: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const navigate = useNavigate();

  // Station management state
  const [stationDialog, setStationDialog] = useState({ open: false, mode: 'add', station: null });
  const [stationForm, setStationForm] = useState({
    // Basic Station Info
    name: '',
    code: '',
    description: '',
    
    // Location Info
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    locationDms: '',
    latitude: '',
    longitude: '',
    nearbyLandmarks: '',
    
    // Station Capacity & Chargers
    totalChargers: 1,
    chargerTypes: [],
    maxPowerPerCharger: '',
    totalPowerCapacity: '',
    
    // Pricing & Policies (only per-minute)
    pricePerMinute: '',
    cancellationPolicy: '',
    
    // Operational Details
    openingHours: '24/7',
    customHours: { start: '00:00', end: '23:59' },
    is24Hours: true,
    status: 'active',
    parkingSlots: 1,
    parkingFee: '',
    
    // Contact & Ownership
    supportPhone: '',
    supportEmail: '',
    managerEmail: ''
  });
  const [stationLoading, setStationLoading] = useState(false);
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);

  // Station Manager management state
  const [managerDialog, setManagerDialog] = useState({ open: false, mode: 'add', manager: null });
  const [managerForm, setManagerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    assignedStation: '',
    stationId: ''
  });
  const [managerLoading, setManagerLoading] = useState(false);
  const [unassignedStations, setUnassignedStations] = useState([]);
  const [unassignedStationsLoading, setUnassignedStationsLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    loadDashboardData();
    loadStations();
    loadUnassignedStations();
  }, []);

  // Refresh unassigned stations when switching to managers section
  useEffect(() => {
    if (activeSection === 'managers') {
      loadUnassignedStations();
    }
  }, [activeSection]);

  const loadUserData = async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch (error) {
      console.error('Error loading user data:', error);
      navigate('/login');
    }
  };

  const handlePickProfileImage = () => {
    if (uploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleProfileFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const res = await uploadProfileImageApi(file);
      // The backend uploadProfileImage function directly updates the user and returns user data
      if (res?.user) {
        setUser(res.user);
        setSnackbar({ open: true, message: 'Profile photo updated', severity: 'success' });
      } else {
        // Fallback: refresh user data
        const refreshed = await getMe();
        setUser(refreshed);
        setSnackbar({ open: true, message: 'Profile photo updated', severity: 'success' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to upload profile image', severity: 'error' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdatePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSnackbar({ open: true, message: 'Please fill all password fields', severity: 'warning' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSnackbar({ open: true, message: 'New passwords do not match', severity: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setSnackbar({ open: true, message: 'New password must be at least 8 characters', severity: 'warning' });
      return;
    }
    try {
      setPasswordLoading(true);
      await updatePasswordApi({ currentPassword, newPassword });
      setSnackbar({ open: true, message: 'Password updated successfully', severity: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to update password', severity: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEditProfile = () => {
    // Pre-fill form with current user data
    setProfileForm({
      firstName: user?.firstName || user?.personalInfo?.firstName || '',
      lastName: user?.lastName || user?.personalInfo?.lastName || '',
      phone: user?.phone || user?.personalInfo?.phone || '',
      address: user?.address || user?.personalInfo?.address || ''
    });
    setEditProfileDialog(true);
  };

  const handleUpdateProfile = async () => {
    const { firstName, lastName, phone, address } = profileForm;
    if (!firstName.trim() || !lastName.trim()) {
      setSnackbar({ open: true, message: 'First name and last name are required', severity: 'warning' });
      return;
    }
    try {
      setProfileLoading(true);
      const response = await updateProfileApi({ firstName, lastName, phone, address });
      if (response?.user) {
        setUser(response.user);
      } else {
        // Fallback: refresh user data
        const refreshed = await getMe();
        setUser(refreshed);
      }
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
      setEditProfileDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to update profile', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await franchiseOwnerService.getDashboardData();
      // Backend returns { success, data }. Store the inner data payload.
      setDashboardData(data?.data || data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load dashboard data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('jwt');
    navigate('/login');
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    setMobileOpen(false);
    if (sectionId === 'stations') {
      loadStations();
    }
  };

  const loadStations = async () => {
    try {
      setStationsLoading(true);
      const res = await franchiseOwnerService.getStations();
      const stationsData = res?.data || res || [];
      setStations(stationsData);
    } catch (error) {
      console.error('Error loading stations:', error);
      setSnackbar({ open: true, message: 'Failed to load stations', severity: 'error' });
    } finally {
      setStationsLoading(false);
    }
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2d3436', fontWeight: 'bold' }}>
        Franchise Dashboard
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#636e72', mb: 3 }}>
        Performance summary across managed stations
      </Typography>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {/* Key Metrics Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #00b894, #00a085)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" gutterBottom variant="h6">
                        My Stations
                      </Typography>
                      <Typography variant="h4" color="white" sx={{ fontWeight: 'bold' }}>
                        {dashboardData?.totalStations || 0}
                      </Typography>
                      <Typography color="white" variant="body2">
                        Charging points
                      </Typography>
                    </Box>
                    <StationIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #0984e3, #74b9ff)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" gutterBottom variant="h6">
                        Active Sessions
                      </Typography>
                      <Typography variant="h4" color="white" sx={{ fontWeight: 'bold' }}>
                        {dashboardData?.activeSessions || 0}
                      </Typography>
                      <Typography color="white" variant="body2">
                        Currently charging
                      </Typography>
                    </Box>
                    <Speed sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #00b894, #00cec9)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" gutterBottom variant="h6">
                        Franchise Revenue
                      </Typography>
                      <Typography variant="h4" color="white" sx={{ fontWeight: 'bold' }}>
                        ₹{Number(dashboardData?.monthlyRevenue || 0).toLocaleString()}
                      </Typography>
                      <Typography color="white" variant="body2">
                        This month
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 36, color: 'white', opacity: 0.85, lineHeight: 1, fontWeight: 700 }}>
                      ₹
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e17055, #d63031)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" gutterBottom variant="h6">
                        Station Uptime
                      </Typography>
                      <Typography variant="h4" color="white" sx={{ fontWeight: 'bold' }}>
                        {dashboardData?.uptime || 0}%
                      </Typography>
                      <Typography color="white" variant="body2">
                        Healthy
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Station</TableCell>
                          <TableCell>Activity</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData?.recentActivity?.map((activity, index) => (
                          <TableRow key={index}>
                            <TableCell>{activity.station}</TableCell>
                            <TableCell>{activity.activity}</TableCell>
                            <TableCell>{activity.time}</TableCell>
                            <TableCell>
                              <Chip
                                label={activity.status}
                                color={activity.status === 'Success' ? 'success' : activity.status === 'Warning' ? 'warning' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        )) || []}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Stats
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Energy Delivered Today
                    </Typography>
                    <Typography variant="h6">
                      {dashboardData?.energyDelivered || 0} kWh
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Average Session Duration
                    </Typography>
                    <Typography variant="h6">
                      {dashboardData?.avgSessionDuration || 0} min
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Customer Satisfaction
                    </Typography>
                    <Typography variant="h6">
                      {dashboardData?.customerSatisfaction || 0}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  // Load available station managers
  const loadAvailableManagers = async () => {
    try {
      setManagersLoading(true);
      const response = await franchiseOwnerService.getAvailableStationManagers();
      if (response.success) {
        setAvailableManagers(response.data);
      }
    } catch (error) {
      console.error('Error loading available managers:', error);
    } finally {
      setManagersLoading(false);
    }
  };

  // Load unassigned stations
  const loadUnassignedStations = async () => {
    try {
      setUnassignedStationsLoading(true);
      const response = await franchiseOwnerService.getUnassignedStations();
      if (response.success) {
        setUnassignedStations(response.data);
      }
    } catch (error) {
      console.error('Error loading unassigned stations:', error);
    } finally {
      setUnassignedStationsLoading(false);
    }
  };

  // Station management functions
  const handleAddStation = () => {
    setStationForm({
      name: '',
      code: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      locationDms: '',
      latitude: '',
      longitude: '',
      nearbyLandmarks: '',
      totalChargers: 1,
      chargerTypes: [],
      maxPowerPerCharger: '',
      totalPowerCapacity: '',
      pricePerMinute: '',
      cancellationPolicy: '',
      openingHours: '24/7',
      customHours: { start: '00:00', end: '23:59' },
      is24Hours: true,
      status: 'active',
      parkingSlots: 1,
      parkingFee: '',
      supportPhone: '',
      supportEmail: '',
      managerEmail: ''
    });
    // Load available managers for assignment
    loadAvailableManagers();
    setStationDialog({ open: true, mode: 'add', station: null });
  };

  const handleEditStation = (station) => {
    const loc = station.location || {};
    const cap = station.capacity || {};
    const pricing = station.pricing || {};
    const op = station.operational || {};
    const contact = station.contact || {};
    setStationForm({
      name: station.name || '',
      code: station.code || '',
      description: station.description || '',
      address: loc.address || station.address || '',
      city: loc.city || station.city || '',
      state: loc.state || station.state || '',
      country: loc.country || station.country || 'India',
      pincode: loc.pincode || station.pincode || '',
      locationDms: (loc.dms || station.locationDms || ''),
      latitude: loc.latitude ?? station.latitude ?? '',
      longitude: loc.longitude ?? station.longitude ?? '',
      nearbyLandmarks: loc.nearbyLandmarks || station.nearbyLandmarks || '',
      totalChargers: cap.totalChargers ?? station.totalChargers ?? 1,
      chargerTypes: cap.chargerTypes || station.chargerTypes || [],
      maxPowerPerCharger: cap.maxPowerPerCharger ?? station.maxPowerPerCharger ?? '',
      totalPowerCapacity: cap.totalPowerCapacity ?? station.totalPowerCapacity ?? '',
      // Backward compatibility: fall back to legacy basePrice if present
      pricePerMinute: pricing.pricePerMinute ?? pricing.basePrice ?? station.pricePerMinute ?? station.basePrice ?? '',
      cancellationPolicy: pricing.cancellationPolicy || station.cancellationPolicy || '',
      openingHours: op.openingHours || station.openingHours || '24/7',
      customHours: op.customHours || station.customHours || { start: '00:00', end: '23:59' },
      is24Hours: op.is24Hours !== undefined ? op.is24Hours : (station.is24Hours !== undefined ? station.is24Hours : true),
      status: op.status || station.status || 'active',
      parkingSlots: op.parkingSlots ?? station.parkingSlots ?? 1,
      parkingFee: op.parkingFee ?? station.parkingFee ?? '',
      supportPhone: contact.supportPhone || station.supportPhone || '',
      supportEmail: contact.supportEmail || station.supportEmail || '',
      managerEmail: station.manager?.email || station.contact?.managerEmail || ''
    });
    // Load available managers so user can reassign
    loadAvailableManagers();
    setStationDialog({ open: true, mode: 'edit', station });
  };

  const handleViewStation = (station) => {
    handleEditStation(station);
    setStationDialog(prev => ({ ...prev, mode: 'view' }));
  };

  // Parse a DMS string like 9°32'41.5"N 76°49'02.8"E into decimal lat/lng
  const parseDmsToDecimal = (dmsStr) => {
    if (!dmsStr || typeof dmsStr !== 'string') return null;
    const cleaned = dmsStr.trim().replace(/\s+/g, ' ');
    const dmsRegex = /([0-9]{1,3})°\s*([0-9]{1,2})'\s*([0-9]{1,2}(?:\.[0-9]+)?)"?\s*([NS])\s+([0-9]{1,3})°\s*([0-9]{1,2})'\s*([0-9]{1,2}(?:\.[0-9]+)?)"?\s*([EW])/i;
    const m = cleaned.match(dmsRegex);
    if (!m) return null;
    const toDecimal = (deg, min, sec, hemi) => {
      const dec = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
      const sign = (hemi.toUpperCase() === 'S' || hemi.toUpperCase() === 'W') ? -1 : 1;
      return dec * sign;
    };
    const lat = toDecimal(m[1], m[2], m[3], m[4]);
    const lng = toDecimal(m[5], m[6], m[7], m[8]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  };

  const handleStationSubmit = async () => {
    try {
      setStationLoading(true);
      
      // Validation
      if (!stationForm.name.trim()) {
        setSnackbar({ open: true, message: 'Station name is required', severity: 'error' });
        return;
      }
      if (!stationForm.address.trim()) {
        setSnackbar({ open: true, message: 'Station address is required', severity: 'error' });
        return;
      }
      if (!stationForm.city.trim()) {
        setSnackbar({ open: true, message: 'City is required', severity: 'error' });
        return;
      }
      if (stationForm.chargerTypes.length === 0) {
        setSnackbar({ open: true, message: 'At least one charger type must be selected', severity: 'error' });
        return;
      }

      // Range validations
      const totalChargersNum = parseInt(stationForm.totalChargers);
      if (Number.isNaN(totalChargersNum) || totalChargersNum < 1 || totalChargersNum > 50) {
        setSnackbar({ open: true, message: 'Total chargers must be between 1 and 50', severity: 'error' });
        return;
      }
      const maxPowerNum = parseFloat(stationForm.maxPowerPerCharger);
      if (Number.isNaN(maxPowerNum) || maxPowerNum < 1 || maxPowerNum > 500) {
        setSnackbar({ open: true, message: 'Max power per charger must be between 1 and 500 kW', severity: 'error' });
        return;
      }
      const ppmNum = parseFloat(stationForm.pricePerMinute);
      if (Number.isNaN(ppmNum) || ppmNum < 1 || ppmNum > 5000) {
        setSnackbar({ open: true, message: 'Price per minute must be between ₹1 and ₹5000', severity: 'error' });
        return;
      }
      const parkingSlotsNum = parseInt(stationForm.parkingSlots);
      if (Number.isNaN(parkingSlotsNum) || parkingSlotsNum < 0 || parkingSlotsNum > 30) {
        setSnackbar({ open: true, message: 'EV parking slots must be between 0 and 30', severity: 'error' });
        return;
      }
      const parkingFeeNum = stationForm.parkingFee === '' ? 0 : parseFloat(stationForm.parkingFee);
      if (Number.isNaN(parkingFeeNum) || parkingFeeNum < 0 || parkingFeeNum > 1000) {
        setSnackbar({ open: true, message: 'Parking fee must be between 0 and 1000', severity: 'error' });
        return;
      }

      // Prefer DMS input if provided
      let latitude = parseFloat(stationForm.latitude) || 0;
      let longitude = parseFloat(stationForm.longitude) || 0;
      if (stationForm.locationDms && stationForm.locationDms.trim()) {
        const parsed = parseDmsToDecimal(stationForm.locationDms.trim());
        if (!parsed) {
          setSnackbar({ open: true, message: 'Invalid DMS location. Example: 9°32\'41.5"N 76°49\'02.8"E', severity: 'error' });
          return;
        }
        latitude = parsed.lat;
        longitude = parsed.lng;
      }

      const stationData = {
        ...stationForm,
        totalChargers: totalChargersNum,
        maxPowerPerCharger: maxPowerNum,
        // Send undefined if empty so backend computes automatically
        totalPowerCapacity: stationForm.totalPowerCapacity !== '' ? (parseFloat(stationForm.totalPowerCapacity) || 0) : undefined,
        pricePerMinute: ppmNum,
        parkingSlots: parkingSlotsNum,
        parkingFee: parkingFeeNum,
        latitude,
        longitude
      };

      if (stationDialog.mode === 'add') {
        await franchiseOwnerService.addStation(stationData);
        setSnackbar({ open: true, message: 'Station added successfully', severity: 'success' });
      } else {
        await franchiseOwnerService.updateStation((stationDialog.station.id || stationDialog.station._id), stationData);
        setSnackbar({ open: true, message: 'Station updated successfully', severity: 'success' });
      }

      setStationDialog({ open: false, mode: 'add', station: null });
      // Refresh data to update both Station Management and Manager Management sections
      await Promise.all([
        loadDashboardData(),
        loadStations()
      ]);
    } catch (error) {
      console.error('Error saving station:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to save station', severity: 'error' });
    } finally {
      setStationLoading(false);
    }
  };

  const handleDeleteStation = async (stationId) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      try {
        await franchiseOwnerService.deleteStation(stationId);
        setSnackbar({ open: true, message: 'Station deleted successfully', severity: 'success' });
        // Refresh data to update both Station Management and Manager Management sections
        await Promise.all([
          loadDashboardData(),
          loadStations()
        ]);
      } catch (error) {
        console.error('Error deleting station:', error);
        setSnackbar({ open: true, message: error.message || 'Failed to delete station', severity: 'error' });
      }
    }
  };

  // Station Manager management functions
  const handleAddManager = () => {
    setManagerForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      assignedStation: '',
      stationId: ''
    });
    loadUnassignedStations();
    setManagerDialog({ open: true, mode: 'add', manager: null });
  };

  const handleEditManager = (manager) => {
    // Extract first and last name from the combined name field
    const nameParts = (manager.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Get assigned station info
    const assignedStation = manager.assignedStations?.[0];
    
    setManagerForm({
      firstName: firstName,
      lastName: lastName,
      email: manager.email || '',
      phone: manager.phone || '',
      assignedStation: assignedStation?.name || 'unassigned',
      stationId: assignedStation?.id || assignedStation?._id || ''
    });
    loadUnassignedStations();
    setManagerDialog({ open: true, mode: 'edit', manager });
  };

  const handleManagerSubmit = async () => {
    try {
      setManagerLoading(true);
      
      // Validation
      if (!managerForm.firstName.trim()) {
        setSnackbar({ open: true, message: 'First name is required', severity: 'error' });
        return;
      }
      if (!managerForm.lastName.trim()) {
        setSnackbar({ open: true, message: 'Last name is required', severity: 'error' });
        return;
      }
      if (!managerForm.email.trim()) {
        setSnackbar({ open: true, message: 'Email is required', severity: 'error' });
        return;
      }

      const managerData = {
        firstName: managerForm.firstName.trim(),
        lastName: managerForm.lastName.trim(),
        email: managerForm.email.trim().toLowerCase(),
        phone: managerForm.phone.replace(/\D/g, '')
      };

      let manager;
      if (managerDialog.mode === 'add') {
        manager = await franchiseOwnerService.addStationManager(managerData);
        setSnackbar({ open: true, message: 'Station manager added successfully', severity: 'success' });
      } else {
        manager = await franchiseOwnerService.updateStationManager(managerDialog.manager.id, managerData);
        setSnackbar({ open: true, message: 'Station manager updated successfully', severity: 'success' });
      }

      // Handle station assignment if a station is selected
      if (managerForm.assignedStation && managerForm.assignedStation !== 'unassigned') {
        try {
          const selectedStation = unassignedStations.find(s => s.name === managerForm.assignedStation);
          if (selectedStation) {
            await franchiseOwnerService.assignStationToManager(
              manager.data?.id || manager.data?._id || managerDialog.manager.id,
              selectedStation._id
            );
          }
        } catch (error) {
          console.error('Error assigning station to manager:', error);
          setSnackbar({ open: true, message: 'Manager created but station assignment failed', severity: 'warning' });
        }
      }

      setManagerDialog({ open: false, mode: 'add', manager: null });
      // Refresh data to update both Station Management and Manager Management sections
      await Promise.all([
        loadDashboardData(),
        loadUnassignedStations()
      ]);
    } catch (error) {
      console.error('Error saving station manager:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to save station manager', severity: 'error' });
    } finally {
      setManagerLoading(false);
    }
  };

  const handleDeleteManager = async (managerId) => {
    if (window.confirm('Are you sure you want to delete this station manager?')) {
      try {
        await franchiseOwnerService.deleteStationManager(managerId);
        setSnackbar({ open: true, message: 'Station manager deleted successfully', severity: 'success' });
        // Refresh data to update both Station Management and Manager Management sections
        await Promise.all([
          loadDashboardData(),
          loadStations()
        ]);
      } catch (error) {
        console.error('Error deleting station manager:', error);
        setSnackbar({ open: true, message: error.message || 'Failed to delete station manager', severity: 'error' });
      }
    }
  };

  // Handle station assignment to manager
  const handleAssignStation = async (managerId, stationId) => {
    if (!stationId) return;
    
    try {
      await franchiseOwnerService.assignStationToManager(managerId, stationId);
      setSnackbar({ open: true, message: 'Station assigned to manager successfully', severity: 'success' });
      
      // Update local state immediately
      setStations(prevStations => 
        prevStations.map(station => 
          station._id === stationId || station.id === stationId 
            ? { ...station, managerId: managerId }
            : station
        )
      );
      
      // Refresh data to update both Station Management and Manager Management sections
      await Promise.all([
        loadDashboardData(),
        loadStations(),
        loadUnassignedStations()
      ]);
    } catch (error) {
      console.error('Error assigning station to manager:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to assign station to manager', severity: 'error' });
    }
  };

  // Handle station unassignment from manager
  const handleUnassignStation = async (managerId, stationId) => {
    if (window.confirm('Are you sure you want to unassign this station from the manager?')) {
      try {
        await franchiseOwnerService.unassignStationFromManager(managerId, stationId);
        setSnackbar({ open: true, message: 'Station unassigned from manager successfully', severity: 'success' });
        
        // Update local state immediately
        setStations(prevStations => 
          prevStations.map(station => 
            station._id === stationId || station.id === stationId 
              ? { ...station, managerId: null }
              : station
          )
        );
        
        // Refresh data to update both Station Management and Manager Management sections
        await Promise.all([
          loadDashboardData(),
          loadStations(),
          loadUnassignedStations()
        ]);
      } catch (error) {
        console.error('Error unassigning station from manager:', error);
        setSnackbar({ open: true, message: error.message || 'Failed to unassign station from manager', severity: 'error' });
      }
    }
  };

  // Handle station status change
  const handleStationStatusChange = async (stationId, newStatus) => {
    try {
      await franchiseOwnerService.updateStation(stationId, {
        status: newStatus,
        operational: { status: newStatus }
      });
      
      setSnackbar({ 
        open: true, 
        message: `Station status updated to ${newStatus}`, 
        severity: 'success' 
      });
      
      // Refresh stations data
      await Promise.all([
        loadDashboardData(),
        loadStations()
      ]);
    } catch (error) {
      console.error('Error updating station status:', error);
      setSnackbar({ 
        open: true, 
        message: error.message || 'Failed to update station status', 
        severity: 'error' 
      });
    }
  };

  const renderStations = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: '#2d3436', fontWeight: 'bold' }}>
            Station Management
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#636e72' }}>
            Add and manage charging stations with complete details
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddStation}
          sx={{
            background: 'linear-gradient(135deg, #00b894, #00a085)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00a085, #00b894)'
            }
          }}
        >
          Add Station
        </Button>
      </Box>

      {/* Station Overview Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Station Overview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Monitor and manage charging stations across your network
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total Stations
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {stations?.length || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Active Stations
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {stations?.filter(s => (s.operational?.status || s.status) === 'active').length || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Maintenance Required
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      {stations?.filter(s => (s.operational?.status || s.status) === 'maintenance').length || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Average Utilization
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                      {stations?.length > 0 ? 
                        Math.round(stations.reduce((acc, s) => acc + (s.utilization || 0), 0) / stations.length) : 0}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stations List */}
      <Grid container spacing={3}>
        {stationsLoading && (
          <Grid item xs={12}>
            <LinearProgress />
          </Grid>
        )}
        {(stations || []).map((station, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {station.name || 'Station Name'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Code: {station.code || 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={(station.operational?.status || station.status || 'active')}
                        color={(station.operational?.status || station.status) === 'active' ? 'success' : (station.operational?.status || station.status) === 'maintenance' ? 'warning' : 'error'}
                        size="small"
                      />
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={station.operational?.status || station.status || 'active'}
                          label="Status"
                          onChange={(e) => handleStationStatusChange(station._id || station.id, e.target.value)}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="maintenance">Maintenance</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {station.location?.address || station.address || 'Location not set'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Power fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {(station.capacity?.totalPowerCapacity || station.totalPowerCapacity || 0)} kW • {(station.capacity?.totalChargers || station.totalChargers || 0)} chargers
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <BatteryChargingFull fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Available: {(station.capacity?.availableSlots || station.availableSlots || 0)}/{(station.capacity?.totalChargers || station.totalChargers || 0)} slots
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <MoneyIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        ₹{(station.pricing?.basePrice ?? station.basePrice ?? 0)}/kWh
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <People fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Manager: {station.manager?.name || 'Unassigned'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" gap={1}>
                    <Button size="small" startIcon={<ViewIcon />} onClick={() => handleViewStation(station)}>
                      View
                    </Button>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditStation(station)}>
                      Edit
                    </Button>
                    <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={() => handleDeleteStation(station.id || station._id)}>
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
        
        {/* Empty state */}
        {(!stations || stations.length === 0) && !stationsLoading && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <EvStation sx={{ fontSize: 64, color: '#bdc3c7', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No stations added yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start by adding your first charging station to begin operations
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddStation}
                  sx={{
                    background: 'linear-gradient(135deg, #00b894, #00a085)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #00a085, #00b894)'
                    }
                  }}
                >
                  Add Your First Station
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Station Form Dialog */}
      <Dialog 
        open={stationDialog.open} 
        onClose={() => setStationDialog({ open: false, mode: 'add', station: null })}
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <EvStation color="primary" />
            <Typography variant="h6">
              {stationDialog.mode === 'add' ? 'Add New Station' : stationDialog.mode === 'edit' ? 'Edit Station' : 'View Station'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mt: 2 }}>
            {/* Basic Station Info */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Business color="primary" />
                  <Typography variant="h6">Basic Station Information</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Station Name"
                      value={stationForm.name}
                      onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                      required
                      disabled={stationDialog.mode === 'view'}
                      helperText="e.g., NexCharge Kochi Central"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Station Code/ID"
                      value={stationForm.code}
                      onChange={(e) => setStationForm({ ...stationForm, code: e.target.value })}
                      disabled={stationDialog.mode === 'view'}
                      helperText="Unique identifier (auto-generated if empty)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={stationForm.description}
                      onChange={(e) => setStationForm({ ...stationForm, description: e.target.value })}
                      multiline
                      rows={2}
                      disabled={stationDialog.mode === 'view'}
                      helperText="Short description of the station"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Location Information */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <LocationOn color="primary" />
                  <Typography variant="h6">Location Information</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Address"
                      value={stationForm.address}
                      onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })}
                      required
                      multiline
                      rows={2}
                      disabled={stationDialog.mode === 'view'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="City"
                      value={stationForm.city}
                      onChange={(e) => setStationForm({ ...stationForm, city: e.target.value })}
                      required
                      disabled={stationDialog.mode === 'view'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="State"
                      value={stationForm.state}
                      onChange={(e) => setStationForm({ ...stationForm, state: e.target.value })}
                      required
                      disabled={stationDialog.mode === 'view'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Pin Code"
                      value={stationForm.pincode}
                      onChange={(e) => setStationForm({ ...stationForm, pincode: e.target.value })}
                      required
                      disabled={stationDialog.mode === 'view'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Location (DMS)"
                      placeholder={`9°32'41.5"N 76°49'02.8"E`}
                      value={stationForm.locationDms}
                      onChange={(e) => setStationForm({ ...stationForm, locationDms: e.target.value })}
                      disabled={stationDialog.mode === 'view'}
                      helperText={`Enter coordinates in DMS format or pick on the map below`}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <GoogleMapsLocationPicker
                      value={{ lat: Number(stationForm.latitude) || undefined, lng: Number(stationForm.longitude) || undefined }}
                      onChange={({ lat, lng, dms }) => {
                        setStationForm({
                          ...stationForm,
                          latitude: lat,
                          longitude: lng,
                          locationDms: dms,
                        });
                      }}
                      initialCenter={{ lat: 9.9312, lng: 76.2673 }}
                      height={280}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nearby Landmarks"
                      value={stationForm.nearbyLandmarks}
                      onChange={(e) => setStationForm({ ...stationForm, nearbyLandmarks: e.target.value })}
                      disabled={stationDialog.mode === 'view'}
                      helperText="Optional: Helps users find the station easily"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Station Capacity & Chargers */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Power color="primary" />
                  <Typography variant="h6">Station Capacity & Chargers</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Total Number of Chargers"
                      type="number"
                      value={stationForm.totalChargers}
                      onChange={(e) => setStationForm({ ...stationForm, totalChargers: e.target.value })}
                      required
                      disabled={stationDialog.mode === 'view'}
                      inputProps={{ min: 1, max: 50 }}
                      helperText="Enter a value between 1 and 50"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Max Power per Charger (kW)"
                      type="number"
                      value={stationForm.maxPowerPerCharger}
                      onChange={(e) => setStationForm({ ...stationForm, maxPowerPerCharger: e.target.value })}
                      required
                      disabled={stationDialog.mode === 'view'}
                      inputProps={{ min: 1, max: 500, step: 0.1 }}
                      helperText="Enter a value between 1 and 500 kW"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Total Power Capacity (kW)"
                      type="number"
                      value={stationForm.totalPowerCapacity}
                      onChange={(e) => setStationForm({ ...stationForm, totalPowerCapacity: e.target.value })}
                      disabled={stationDialog.mode === 'view'}
                      inputProps={{ min: 0, step: 0.1 }}
                      helperText="Optional: Auto-calculated if left empty"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Charger Types Supported</InputLabel>
                      <Select
                        multiple
                        value={stationForm.chargerTypes}
                        onChange={(e) => setStationForm({ ...stationForm, chargerTypes: e.target.value })}
                        disabled={stationDialog.mode === 'view'}
                        renderValue={(selected) => selected.join(', ')}
                      >
                        <SelectMenuItem value="type1">Type 1 (SAE J1772)</SelectMenuItem>
                        <SelectMenuItem value="type2">Type 2 (IEC Type 2)</SelectMenuItem>
                        <SelectMenuItem value="bharat_ac_001">Bharat AC-001</SelectMenuItem>
                        <SelectMenuItem value="bharat_dc_001">Bharat DC-001</SelectMenuItem>
                        <SelectMenuItem value="ccs2">CCS-2</SelectMenuItem>
                        <SelectMenuItem value="chademo">CHAdeMO</SelectMenuItem>
                        <SelectMenuItem value="gbt_type6">GB/T Type-6</SelectMenuItem>
                        <SelectMenuItem value="type7_leccs">Type-7 (LECCS)</SelectMenuItem>
                        <SelectMenuItem value="mcs">Megawatt Charging System (MCS)</SelectMenuItem>
                        <SelectMenuItem value="chaoji">ChaoJi</SelectMenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Pricing & Policies (Per-Minute only) */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <MoneyIcon color="primary" />
                  <Typography variant="h6">Pricing & Policies</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Price Per Minute (₹/min)"
                      type="number"
                      value={stationForm.pricePerMinute}
                      onChange={(e) => setStationForm({ ...stationForm, pricePerMinute: e.target.value })}
                      required
                      disabled={stationDialog.mode === 'view'}
                      inputProps={{ min: 1, max: 5000, step: 0.01 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                      helperText="Enter a value between ₹1 and ₹5000"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Cancellation Policy"
                      value={stationForm.cancellationPolicy}
                      onChange={(e) => setStationForm({ ...stationForm, cancellationPolicy: e.target.value })}
                      multiline
                      rows={3}
                      disabled={stationDialog.mode === 'view'}
                      helperText="Describe your cancellation and refund policy"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Operational Details */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Settings color="primary" />
                  <Typography variant="h6">Operational Details</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required disabled={stationDialog.mode === 'view'}>
                      <InputLabel>Station Status</InputLabel>
                      <Select
                        value={stationForm.status}
                        onChange={(e) => setStationForm({ ...stationForm, status: e.target.value })}
                      >
                        <SelectMenuItem value="active">Active</SelectMenuItem>
                        <SelectMenuItem value="inactive">Inactive</SelectMenuItem>
                        <SelectMenuItem value="maintenance">Under Maintenance</SelectMenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Number of EV Parking Slots"
                      type="number"
                      value={stationForm.parkingSlots}
                      onChange={(e) => setStationForm({ ...stationForm, parkingSlots: e.target.value })}
                      required
                      disabled={stationDialog.mode === 'view'}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Parking Fee (₹)"
                      type="number"
                      value={stationForm.parkingFee}
                      onChange={(e) => setStationForm({ ...stationForm, parkingFee: e.target.value })}
                      disabled={stationDialog.mode === 'view'}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText="Leave empty if parking is free"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={stationForm.is24Hours}
                          onChange={(e) => setStationForm({ ...stationForm, is24Hours: e.target.checked })}
                          disabled={stationDialog.mode === 'view'}
                        />
                      }
                      label="24/7 Operation"
                    />
                  </Grid>
                  {!stationForm.is24Hours && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Opening Time"
                          type="time"
                          value={stationForm.customHours.start}
                          onChange={(e) => setStationForm({ 
                            ...stationForm, 
                            customHours: { ...stationForm.customHours, start: e.target.value }
                          })}
                          InputLabelProps={{ shrink: true }}
                          disabled={stationDialog.mode === 'view'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Closing Time"
                          type="time"
                          value={stationForm.customHours.end}
                          onChange={(e) => setStationForm({ 
                            ...stationForm, 
                            customHours: { ...stationForm.customHours, end: e.target.value }
                          })}
                          InputLabelProps={{ shrink: true }}
                          disabled={stationDialog.mode === 'view'}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Contact & Ownership */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <People color="primary" />
                  <Typography variant="h6">Contact & Ownership</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={stationDialog.mode === 'view'}>
                      <InputLabel>Assign Station Manager</InputLabel>
                      <Select
                        value={stationForm.managerEmail}
                        label="Assign Station Manager"
                        onChange={(e) => {
                          const email = e.target.value;
                          const m = (availableManagers || []).find(x => (x.email || x.personalInfo?.email) === email);
                          setStationForm({
                            ...stationForm,
                            managerEmail: email,
                            supportEmail: email || stationForm.supportEmail,
                            supportPhone: (m?.phone || m?.personalInfo?.phone || stationForm.supportPhone || '')
                          });
                        }}
                      >
                        {(availableManagers || []).length === 0 ? (
                          <SelectMenuItem value="" disabled>No available managers</SelectMenuItem>
                        ) : (
                          (availableManagers || []).map((m) => (
                            <SelectMenuItem key={(m.id || m._id || m.email || m.personalInfo?.email)} value={(m.email || m.personalInfo?.email) || ''}>
                              {`${m.firstName || m.personalInfo?.firstName || ''} ${m.lastName || m.personalInfo?.lastName || ''}`.trim()} — {(m.email || m.personalInfo?.email) || ''}
                            </SelectMenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Support Phone Number"
                      value={stationForm.supportPhone}
                      onChange={(e) => setStationForm({ ...stationForm, supportPhone: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">+91</InputAdornment>
                      }}
                      disabled={stationDialog.mode === 'view'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Support Email"
                      type="email"
                      value={stationForm.supportEmail}
                      onChange={(e) => setStationForm({ ...stationForm, supportEmail: e.target.value })}
                      disabled={stationDialog.mode === 'view'}
                      helperText="Customer support email for this station"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setStationDialog({ open: false, mode: 'add', station: null })}
            disabled={stationLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStationSubmit}
            variant="contained"
            disabled={stationLoading}
            sx={{
              background: 'linear-gradient(135deg, #00b894, #00a085)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00a085, #00b894)'
              }
            }}
          >
            {stationLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              stationDialog.mode === 'add' ? 'Add Station' : 'Update Station'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderManagers = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: '#2d3436', fontWeight: 'bold' }}>
            Manager Management
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#636e72' }}>
            Add and manage station managers for your charging stations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<People />}
          onClick={handleAddManager}
          sx={{
            background: 'linear-gradient(135deg, #00b894, #00a085)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00a085, #00b894)'
            }
          }}
        >
          Add Manager
        </Button>
      </Box>

      {/* Station Assignment Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Station Assignment Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {stations?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Stations
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {dashboardData?.stationManagers?.reduce((total, manager) => total + (manager.assignedStationsCount || 0), 0) || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assigned Stations
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {(stations?.length || 0) - (dashboardData?.stationManagers?.reduce((total, manager) => total + (manager.assignedStationsCount || 0), 0) || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unassigned Stations
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {dashboardData?.stationManagers?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Managers
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Station Managers List */}
      <Grid container spacing={2}>
        {dashboardData?.stationManagers?.map((manager, index) => {
          const assignedStations = manager.assignedStations || [];
          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: '#00b894' }}>
                        {manager.name?.charAt(0) || 'M'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {manager.name || 'Manager Name'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {manager.email || 'manager@example.com'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Assigned Stations */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary" gutterBottom>
                        Assigned Stations ({assignedStations.length})
                      </Typography>
                      {assignedStations.length > 0 ? (
                        <Box>
                          {assignedStations.map((station, idx) => (
                            <Chip
                              key={idx}
                              label={station.name}
                              size="small"
                              color="primary"
                              sx={{ mr: 1, mb: 1 }}
                              onDelete={() => handleUnassignStation(manager.id, station.id)}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No stations assigned
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Phone: {manager.phone || 'N/A'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CheckCircle fontSize="small" color="success" />
                        <Typography variant="body2" color="text.secondary">
                          Status: {manager.status || 'Active'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Assignment Actions */}
                    <Box display="flex" flexDirection="column" gap={1}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Assign Station</InputLabel>
                        <Select
                          value=""
                          onChange={(e) => handleAssignStation(manager.id, e.target.value)}
                          disabled={unassignedStationsLoading}
                        >
                          {unassignedStations.map((station) => (
                            <MenuItem key={station._id} value={station._id}>
                              {station.name} - {station.location?.address || station.address || ''}
                            </MenuItem>
                          ))}
                          {unassignedStations.length === 0 && !unassignedStationsLoading && (
                            <MenuItem disabled>No unassigned stations</MenuItem>
                          )}
                          {unassignedStationsLoading && (
                            <MenuItem disabled>Loading stations...</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      
                      <Box display="flex" gap={1}>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditManager(manager)}>
                          Edit
                        </Button>
                        <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={() => handleDeleteManager(manager.id)}>
                          Remove
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        }) || []}
        
        {/* Empty state for managers */}
        {(!dashboardData?.stationManagers || dashboardData.stationManagers.length === 0) && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <People sx={{ fontSize: 64, color: '#bdc3c7', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No station managers added yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Add station managers to oversee your charging stations
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<People />}
                  onClick={handleAddManager}
                  sx={{
                    background: 'linear-gradient(135deg, #00b894, #00a085)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #00a085, #00b894)'
                    }
                  }}
                >
                  Add Your First Manager
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Station Manager Form Dialog */}
      <Dialog 
        open={managerDialog.open} 
        onClose={() => setManagerDialog({ open: false, mode: 'add', manager: null })}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <People color="primary" />
            <Typography variant="h6">
              {managerDialog.mode === 'add' ? 'Add New Station Manager' : 'Edit Station Manager'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={managerForm.firstName}
                  onChange={(e) => setManagerForm({ ...managerForm, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={managerForm.lastName}
                  onChange={(e) => setManagerForm({ ...managerForm, lastName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={managerForm.email}
                  onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                  required
                  helperText="Manager's email address"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={managerForm.phone}
                  onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+91</InputAdornment>
                  }}
                  helperText="10 digits only"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assign Station</InputLabel>
                  <Select
                    value={managerForm.assignedStation}
                    onChange={(e) => setManagerForm({ ...managerForm, assignedStation: e.target.value })}
                    disabled={unassignedStationsLoading}
                  >
                    <MenuItem value="unassigned">
                      <em>Unassigned (Assign Later)</em>
                    </MenuItem>
                    {/* Show currently assigned station if in edit mode */}
                    {managerDialog.mode === 'edit' && managerDialog.manager?.assignedStations?.[0] && (
                      <MenuItem 
                        key={managerDialog.manager.assignedStations[0]._id} 
                        value={managerDialog.manager.assignedStations[0].name}
                      >
                        {managerDialog.manager.assignedStations[0].name} - {managerDialog.manager.assignedStations[0].address || ''} (Currently Assigned)
                      </MenuItem>
                    )}
                    {unassignedStations.map((station) => (
                      <MenuItem key={station._id} value={station.name}>
                        {station.name} - {station.location?.address || station.address || ''}
                      </MenuItem>
                    ))}
                  </Select>
                  {unassignedStationsLoading && (
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <CircularProgress size={16} />
                      <Typography variant="caption">Loading stations...</Typography>
                    </Box>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setManagerDialog({ open: false, mode: 'add', manager: null })}
            disabled={managerLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleManagerSubmit}
            variant="contained"
            disabled={managerLoading}
            sx={{
              background: 'linear-gradient(135deg, #00b894, #00a085)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00a085, #00b894)'
              }
            }}
          >
            {managerLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              managerDialog.mode === 'add' ? 'Add Manager' : 'Update Manager'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderAnalytics = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2d3436', fontWeight: 'bold' }}>
        Analytics & Reports
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#636e72', mb: 3 }}>
        Monitor uptime, usage patterns, and revenue trends
      </Typography>

      <Grid container spacing={3}>
        {/* Usage Trends */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Usage Trends (Last 7 Days)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData?.usageTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sessions" stroke="#00b894" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#0984e3" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Station Performance */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Station Performance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData?.stationPerformance || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent, value }) => value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                      labelLine={false}
                    >
                      {dashboardData?.stationPerformance?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#00b894', '#0984e3', '#e17055'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} stations`, name]} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => `${value}: ${entry.payload.value || 0}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Revenue Analysis */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Analysis (Last 30 Days)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData?.revenueAnalysis || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#00b894" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );

  const renderCompliance = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2d3436', fontWeight: 'bold' }}>
        Compliance & Guidelines
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#636e72', mb: 3 }}>
        Ensure stations follow operational guidelines and safety standards
      </Typography>

      <Grid container spacing={3}>
        {/* Compliance Status */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Compliance Status
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Safety Inspections</Typography>
                    <Chip label="Compliant" color="success" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Environmental Standards</Typography>
                    <Chip label="Compliant" color="success" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Operational Guidelines</Typography>
                    <Chip label="Pending" color="warning" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Maintenance Records</Typography>
                    <Chip label="Compliant" color="success" size="small" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Upcoming Tasks */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upcoming Tasks
                </Typography>
                <Box>
                  <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Monthly Safety Inspection
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due: March 15, 2025
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Update Station Information
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due: March 20, 2025
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Environmental Compliance Review
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due: March 25, 2025
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Guidelines */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Operational Guidelines
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Safety Protocols
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Regular safety inspections, emergency procedures, and staff training requirements.
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Environmental Standards
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Energy efficiency guidelines, waste management, and sustainability practices.
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Customer Service
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Response times, customer support standards, and feedback management.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );

  const renderPromotions = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: '#2d3436', fontWeight: 'bold' }}>
            Promotion Management
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#636e72' }}>
            Create and manage franchise-wide offers and promotions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            background: 'linear-gradient(135deg, #00b894, #00a085)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00a085, #00b894)'
            }
          }}
        >
          Create Promotion
        </Button>
      </Box>

      <Grid container spacing={3}>
        {dashboardData?.promotions?.map((promotion, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {promotion.title}
                    </Typography>
                    <Chip
                      label={promotion.status}
                      color={promotion.status === 'Active' ? 'success' : promotion.status === 'Scheduled' ? 'warning' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {promotion.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Discount: {promotion.discount}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Valid: {promotion.validFrom} - {promotion.validTo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usage: {promotion.usageCount} times
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Button size="small" startIcon={<ViewIcon />}>
                      View
                    </Button>
                    <Button size="small" startIcon={<EditIcon />}>
                      Edit
                    </Button>
                    <Button size="small" startIcon={<DeleteIcon />} color="error">
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        )) || []}
      </Grid>
    </Box>
  );

  const renderProfile = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2d3436', fontWeight: 'bold' }}>
        Profile Settings
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#636e72', mb: 3 }}>
        Manage your account information and security settings
      </Typography>

      <Grid container spacing={3}>
        {/* Avatar & identity */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={user?.profileImage || user?.personalInfo?.profileImage || undefined}
                      sx={{ width: 80, height: 80 }}
                    />
                    <IconButton
                      onClick={handlePickProfileImage}
                      size="medium"
                      sx={{ position: 'absolute', right: -6, bottom: -6, bgcolor: 'background.paper', boxShadow: 2 }}
                      disabled={uploadingAvatar}
                    >
                      <PhotoCameraIcon />
                    </IconButton>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfileFileSelected}
                      style={{ display: 'none' }}
                    />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {(user?.firstName || user?.personalInfo?.firstName || '') + ' ' + (user?.lastName || user?.personalInfo?.lastName || '')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {user?.email || user?.personalInfo?.email || ''}
                </Typography>
                <Chip label={user?.role || 'franchise_owner'} variant="outlined" color="primary" />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {(user?.firstName || user?.personalInfo?.firstName || '') + ' ' + (user?.lastName || user?.personalInfo?.lastName || '')}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {user?.email || user?.personalInfo?.email || ''}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">
                    {user?.phone || user?.personalInfo?.phone || ''}
                  </Typography>
                </Box>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEditProfile}>
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Password
                  </Typography>
                  <input
                    type="password"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    New Password
                  </Typography>
                  <input
                    type="password"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Confirm New Password
                  </Typography>
                  <input
                    type="password"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  />
                </Box>
                <Button
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #00b894, #00a085)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #00a085, #00b894)'
                    }
                  }}
                  disabled={passwordLoading}
                  onClick={handleUpdatePassword}
                >
                  {passwordLoading ? 'Updating…' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'stations':
        return renderStations();
      case 'managers':
        return renderManagers();
      case 'analytics':
        return renderAnalytics();
      case 'compliance':
        return renderCompliance();
      case 'promotions':
        return renderPromotions();
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <img
            src={nexchargeLogo}
            alt="NexCharge"
            style={{ height: '52px', width: 'auto' }}
          />
          <Typography variant="subtitle2" noWrap sx={{ color: '#2d3436', fontWeight: 'bold', mt: 1 }}>
            Franchise Owner
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={activeSection === item.id}
              onClick={() => handleSectionChange(item.id)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 184, 148, 0.1)',
                  borderRight: '3px solid #00b894',
                  '& .MuiListItemIcon-root': {
                    color: '#00b894'
                  },
                  '& .MuiListItemText-primary': {
                    color: '#00b894',
                    fontWeight: 'bold'
                  }
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                secondary={item.description}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: '#2d3436' }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: '#2d3436' }}>
            {navigationItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
          >
            <Avatar src={user?.profileImage || user?.personalInfo?.profileImage || undefined} sx={{ bgcolor: '#00b894' }}>
              {(!(user?.profileImage || user?.personalInfo?.profileImage) && (user?.firstName?.charAt(0) || user?.personalInfo?.firstName?.charAt(0) || 'F'))}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { setActiveSection('profile'); handleMenuClose(); }}>
              <ListItemIcon>
                <ProfileIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: '#f8f9fa',
          minHeight: '100vh'
        }}
      >
        {renderContent()}
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialog} onClose={() => setEditProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="First Name"
              value={profileForm.firstName}
              onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              value={profileForm.lastName}
              onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Address"
              value={profileForm.address}
              onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateProfile} 
            variant="contained" 
            disabled={profileLoading}
            sx={{
              background: 'linear-gradient(135deg, #00b894, #00a085)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00a085, #00b894)'
              }
            }}
          >
            {profileLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FranchiseOwnerDashboard;
