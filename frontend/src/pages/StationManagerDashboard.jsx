import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Hidden
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EvStation as StationIcon,
  EvStation as EvStationIcon,
  BookOnline as BookingIcon,
  Build as MaintenanceIcon,
  AttachMoney as PricingIcon,
  Assessment as ReportsIcon,
  Reviews as FeedbackIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Speed,
  CheckCircle,
  Star,
  Warning,
  Error,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
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
  ExpandMore as ExpandMoreIcon,
  BatteryChargingFull
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import GoogleMapsLocationPicker from '../components/GoogleMapsLocationPicker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import stationManagerService from '../services/stationManagerService';
import StationPhotosModal from '../components/StationPhotosModal';
import Footer from '../components/Footer';

const drawerWidth = 280;

const navigationItems = [
  { id: 'overview', label: 'Station Dashboard', icon: <DashboardIcon />, description: 'Real-time slot occupancy and operational status' },
  { id: 'bookings', label: 'Booking Management', icon: <BookingIcon />, description: 'Approve, monitor, or cancel reservations' },
  { id: 'maintenance', label: 'Maintenance Scheduling', icon: <MaintenanceIcon />, description: 'Block slots during repairs' },
  { id: 'maintenance-predictions', label: 'Predictive Maintenance', icon: <MaintenanceIcon />, description: 'View maintenance risk predictions' },
  { id: 'pricing', label: 'Offers', icon: <PricingIcon />, description: 'Set station-level pricing and promotions' },
  { id: 'reports', label: 'Performance Reports', icon: <ReportsIcon />, description: 'Utilization rates, uptime, and user ratings' },
  { id: 'feedback', label: 'Reviews', icon: <FeedbackIcon />, description: 'View customer reviews' },
  { id: 'profile', label: 'Profile Settings', icon: <ProfileIcon />, description: 'Manage account and preferences' }
];

const StationManagerDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Station management state
  const [stationDialog, setStationDialog] = useState({ open: false, mode: 'view', station: null });
  const [photosModal, setPhotosModal] = useState({ open: false, station: null });
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
  const [availableManagers, setAvailableManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  
  // Profile form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [imageForm, setImageForm] = useState({
    imageUrl: '',
    file: null
  });
  
  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    loadDashboardData();
  }, []);

  // Load feedback data when feedback section is active
  useEffect(() => {
    if (activeSection === 'feedback' && !feedbackData) {
      loadFeedbackData();
    }
  }, [activeSection, feedbackData]);

  const loadUserData = async () => {
    try {
      const { getMe } = await import('../utils/api');
      const me = await getMe();
      setUser(me);
      setProfileForm({
        firstName: me.firstName || '',
        lastName: me.lastName || '',
        phone: me.phone || '',
        address: me.address || ''
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      navigate('/login');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await stationManagerService.getDashboardData();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to load dashboard data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load feedback data for the feedback section
  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      const response = await stationManagerService.getFeedback();
      setFeedbackData(response.data);
    } catch (error) {
      console.error('Error loading feedback data:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to load feedback data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStationStatusChange = async (stationId, newStatus) => {
    try {
      await stationManagerService.updateStationDetails(stationId, {
        'operational.status': newStatus
      });
      
      setSnackbar({ 
        open: true, 
        message: `Station status updated to ${newStatus}`, 
        severity: 'success' 
      });
      
      // Refresh dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error updating station status:', error);
      setSnackbar({ 
        open: true, 
        message: error.message || 'Failed to update station status', 
        severity: 'error' 
      });
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

  // Placeholder functions to prevent runtime errors
  const handleViewBooking = (booking) => {
    console.log('View booking:', booking);
  };

  const handleApproveBooking = (bookingId) => {
    console.log('Approve booking:', bookingId);
  };

  const handleCancelBooking = (bookingId) => {
    console.log('Cancel booking:', bookingId);
  };

  const handleEditMaintenance = (maintenanceId) => {
    console.log('Edit maintenance:', maintenanceId);
  };

  const handleCancelMaintenance = (maintenanceId) => {
    console.log('Cancel maintenance:', maintenanceId);
  };

  const handleScheduleMaintenance = () => {
    console.log('Schedule maintenance');
  };

  const handleUpdatePricing = (stationId) => {
    console.log('Update pricing for station:', stationId);
  };

  const handleCreatePromotion = () => {
    console.log('Create promotion');
  };

  const handleBulkUpdatePricing = () => {
    console.log('Bulk update pricing');
  };

  // Profile validation functions
  const validateProfile = () => {
    const errors = {};
    
    if (!profileForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (!/^[A-Za-z]+$/.test(profileForm.firstName.trim())) {
      errors.firstName = 'Letters only, no spaces';
    } else if (profileForm.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    } else if (profileForm.firstName.trim().length > 10) {
      errors.firstName = 'First name must be less than 10 characters';
    }

    if (!profileForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (!/^[A-Za-z]+$/.test(profileForm.lastName.trim())) {
      errors.lastName = 'Letters only, no spaces';
    } else if (profileForm.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    } else if (profileForm.lastName.trim().length > 10) {
      errors.lastName = 'Last name must be less than 10 characters';
    }

    if (profileForm.phone && profileForm.phone.trim() !== '') {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(profileForm.phone)) {
        errors.phone = 'Phone number must be exactly 10 digits';
      }
    }

    if (profileForm.address && profileForm.address.length > 80) {
      errors.address = 'Address must be less than 80 characters';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (!passwordForm.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateImage = () => {
    const errors = {};
    if (!imageForm.imageUrl.trim()) errors.imageUrl = 'Image URL is required';
    else {
      try {
        new URL(imageForm.imageUrl);
      } catch {
        errors.imageUrl = 'Please enter a valid URL';
      }
    }

    setImageErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Profile update handlers
  const handleProfileUpdate = async () => {
    if (!validateProfile()) return;

    try {
      const { updateProfileApi } = await import('../utils/api');
      const result = await updateProfileApi(profileForm);
      setUser(result.user);
      setIsEditingProfile(false);
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to update profile', severity: 'error' });
    }
  };

  const handlePasswordUpdate = async () => {
    if (!validatePassword()) return;

    try {
      const { updatePasswordApi } = await import('../utils/api');
      await updatePasswordApi({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setIsEditingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSnackbar({ open: true, message: 'Password updated successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to update password', severity: 'error' });
    }
  };

  const handleImageUpdate = async () => {
    try {
      const { uploadProfileImageApi, updateProfileImageApi } = await import('../utils/api');
      let result;
      if (imageForm.file) {
        result = await uploadProfileImageApi(imageForm.file);
      } else if (imageForm.imageUrl) {
        if (!validateImage()) return;
        result = await updateProfileImageApi(imageForm.imageUrl);
      } else {
        setSnackbar({ open: true, message: 'Please select a file or enter an image URL', severity: 'error' });
        return;
      }
      
      setUser(result.user);
      setIsImageDialogOpen(false);
      setImageForm({ imageUrl: '', file: null });
      setSnackbar({ open: true, message: 'Profile image updated successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to update image', severity: 'error' });
    }
  };

  const cancelProfileEdit = () => {
    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setProfileErrors({});
    setIsEditingProfile(false);
  };

  const cancelPasswordEdit = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    setIsEditingPassword(false);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setMobileOpen(false);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ open: false });
  };

  const handleStationDialogOpen = (mode, station = null) => {
    setStationDialog({ open: true, mode, station });
  };

  const handleStationDialogClose = () => {
    setStationDialog({ open: false, mode: 'view', station: null });
  };

  const handlePhotosModalOpen = (station) => {
    setPhotosModal({ open: true, station });
  };

  const handlePhotosModalClose = () => {
    setPhotosModal({ open: false, station: null });
  };

  const handleStationFormChange = (event) => {
    const { name, value } = event.target;
    setStationForm((prevForm) => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handleStationFormSubmit = async () => {
    try {
      setStationLoading(true);
      if (stationDialog.mode === 'add') {
        await stationManagerService.addStation(stationForm);
        setSnackbar({ open: true, message: 'Station added successfully', severity: 'success' });
      } else if (stationDialog.mode === 'edit') {
        await stationManagerService.updateStationDetails(stationDialog.station._id, stationForm);
        setSnackbar({ open: true, message: 'Station updated successfully', severity: 'success' });
      }
      handleStationDialogClose();
      await loadDashboardData();
    } catch (error) {
      console.error('Error submitting station form:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to submit station form', severity: 'error' });
    } finally {
      setStationLoading(false);
    }
  };

  const handleDeleteStation = async (stationId) => {
    try {
      await stationManagerService.deleteStation(stationId);
      setSnackbar({ open: true, message: 'Station deleted successfully', severity: 'success' });
      await loadDashboardData();
    } catch (error) {
      console.error('Error deleting station:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to delete station', severity: 'error' });
    }
  };

  const handleLoadManagers = async () => {
    try {
      setManagersLoading(true);
      const response = await stationManagerService.getAvailableManagers();
      setAvailableManagers(response.data);
    } catch (error) {
      console.error('Error loading managers:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to load managers', severity: 'error' });
    } finally {
      setManagersLoading(false);
    }
  };

  const handleAssignManager = async (stationId, managerId) => {
    try {
      await stationManagerService.assignManager(stationId, managerId);
      setSnackbar({ open: true, message: 'Manager assigned successfully', severity: 'success' });
      await loadDashboardData();
    } catch (error) {
      console.error('Error assigning manager:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to assign manager', severity: 'error' });
    }
  };

  // Station management functions
  const handleViewStation = (station) => {
    // Ensure we're passing a valid station object
    if (station && station._id) {
      setPhotosModal({ open: true, station });
    }
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
    setStationDialog({ open: true, mode: 'edit', station });
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

      await stationManagerService.updateStation((stationDialog.station.id || stationDialog.station._id), stationData);
      setSnackbar({ open: true, message: 'Station updated successfully', severity: 'success' });

      setStationDialog({ open: false, mode: 'view', station: null });
      // Refresh data
      await loadDashboardData();
    } catch (error) {
      console.error('Error saving station:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to save station', severity: 'error' });
    } finally {
      setStationLoading(false);
    }
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
        Station Dashboard
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
        Real-time monitoring of your assigned charging station
      </Typography>

      {/* Station Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card sx={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {dashboardData?.stationInfo?.availableSlots || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Available Slots
                    </Typography>
                  </Box>
                  <LocalParking sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {dashboardData?.stationInfo?.uptime || 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Station Uptime
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {dashboardData?.stationInfo?.utilizationRate || 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Utilization Rate
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card sx={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      ₹{dashboardData?.stationInfo?.monthlyRevenue || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Monthly Revenue
                    </Typography>
                  </Box>
                  <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Assigned Stations Information */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                  Assigned Stations ({dashboardData?.assignedStations?.length || 0})
                </Typography>
                {dashboardData?.assignedStations?.map((station, index) => (
                  <Box
                    key={station.id}
                    sx={{
                      mb: 3,
                      p: 3,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      borderRadius: 2,
                      backgroundColor: 'grey.50',
                      transition: 'all 0.2s ease',
                      '&:hover': { boxShadow: 3, borderColor: 'primary.light', backgroundColor: '#ffffff' }
                    }}
                  >
                    {/* Station Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <StationIcon fontSize="small" color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                          {station.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({station.code})
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={station.operational?.status || 'inactive'} 
                          color={
                            station.operational?.status === 'active' ? 'success' : 
                            station.operational?.status === 'maintenance' ? 'warning' : 'error'
                          } 
                          size="small" 
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel id={`station-status-label-${station.id}`}>Status</InputLabel>
                          <Select
                            labelId={`station-status-label-${station.id}`}
                            value={station.operational?.status || 'inactive'}
                            label="Status"
                            onChange={(e) => handleStationStatusChange(station.id, e.target.value)}
                          >
                            <SelectMenuItem value="active">Active</SelectMenuItem>
                            <SelectMenuItem value="maintenance">Maintenance</SelectMenuItem>
                            <SelectMenuItem value="inactive">Inactive</SelectMenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>

                    {/* Station Description */}
                    {station.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {station.description}
                      </Typography>
                    )}

                    {/* Location Details */}
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <LocationOn fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {station.location?.address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {station.location?.city}, {station.location?.state} - {station.location?.pincode}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Charger Information */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocalParking fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            <strong>{station.availableChargers}/{station.totalChargers}</strong> Chargers Available
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AttachMoney fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            <strong>₹{station.basePrice}/kWh</strong> Base Rate
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Charger Types */}
                    {station.chargerTypes && station.chargerTypes.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Charger Types:</strong>
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {station.chargerTypes.map((type, idx) => (
                            <Chip key={idx} label={type} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Amenities */}
                    {station.amenities && station.amenities.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Amenities:</strong>
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {station.amenities.map((amenity, idx) => (
                            <Chip key={idx} label={amenity} size="small" color="primary" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Contact Information */}
                    {station.contact && (station.contact.phone || station.contact.email) && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Contact:</strong>
                        </Typography>
                        <Box display="flex" gap={2}>
                          {station.contact.phone && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Phone fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {station.contact.phone}
                              </Typography>
                            </Box>
                          )}
                          {station.contact.email && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Email fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {station.contact.email}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Operational Status */}
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Power fontSize="small" color={station.operational?.isActive ? 'success' : 'error'} />
                        <Typography variant="body2" color="text.secondary">
                          {station.operational?.isActive ? 'Operational' : 'Offline'}
                        </Typography>
                      </Box>
                      {station.operational?.lastMaintenance && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Last Maintenance: {new Date(station.operational.lastMaintenance).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                      <Button 
                        variant="outlined" 
                        startIcon={<EditIcon />} 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStation(station);
                        }}
                      >
                        Edit Station
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<ViewIcon />} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotosModal({ open: true, station });
                        }}
                      >
                        View Photos
                      </Button>
                    </Box>
                  </Box>
                )) || (
                  <Typography variant="body2" color="text.secondary">
                    No assigned stations found. Please contact your franchise owner.
                  </Typography>
                )}
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
      case 'bookings':
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Booking Management
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
              Monitor and manage reservations for your assigned stations
            </Typography>
            
            {/* Today's Bookings */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Today's Bookings ({dashboardData?.todayBookings?.length || 0})
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Station</TableCell>
                        <TableCell>Time Slot</TableCell>
                        <TableCell>Charger Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData?.todayBookings && dashboardData.todayBookings.length > 0 ? (
                        dashboardData.todayBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {booking.user}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {booking.userEmail}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{booking.vehicle}</TableCell>
                          <TableCell>{booking.stationName}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {booking.startTime} - {booking.endTime}
                            </Typography>
                          </TableCell>
                          <TableCell>{booking.chargerType}</TableCell>
                          <TableCell>
                            <Chip 
                              label={booking.status} 
                              color={
                                booking.status === 'confirmed' ? 'success' : 
                                booking.status === 'pending' ? 'warning' : 
                                booking.status === 'cancelled' ? 'error' : 'default'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Button 
                                size="small" 
                                startIcon={<ViewIcon />}
                                onClick={() => handleViewBooking(booking)}
                                variant="outlined"
                              >
                                View
                              </Button>
                              {booking.status === 'pending' && (
                                <Button 
                                  size="small" 
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleApproveBooking(booking.id)}
                                  color="success"
                                  variant="contained"
                                >
                                  Approve
                                </Button>
                              )}
                              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                <Button 
                                  size="small" 
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleCancelBooking(booking.id)}
                                  color="error"
                                  variant="outlined"
                                >
                                  Cancel
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                              No bookings for today
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Bookings</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Station</TableCell>
                        <TableCell>Time Slot</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData?.recentBookings && dashboardData.recentBookings.length > 0 ? (
                        dashboardData.recentBookings.slice(0, 10).map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {booking.user}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {booking.userEmail}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{booking.vehicle}</TableCell>
                          <TableCell>{booking.stationName}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {booking.startTime}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.endTime}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={booking.status} 
                              color={
                                booking.status === 'confirmed' ? 'success' : 
                                booking.status === 'pending' ? 'warning' : 
                                booking.status === 'cancelled' ? 'error' : 'default'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              ₹{booking.cost}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Button 
                                size="small" 
                                startIcon={<ViewIcon />}
                                onClick={() => handleViewBooking(booking)}
                                variant="outlined"
                              >
                                View
                              </Button>
                              {booking.status === 'pending' && (
                                <Button 
                                  size="small" 
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleApproveBooking(booking.id)}
                                  color="success"
                                  variant="contained"
                                >
                                  Approve
                                </Button>
                              )}
                              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                <Button 
                                  size="small" 
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleCancelBooking(booking.id)}
                                  color="error"
                                  variant="outlined"
                                >
                                  Cancel
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                              No recent bookings available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        );
      case 'maintenance':
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Maintenance Scheduling
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
              Schedule and manage maintenance activities for your assigned stations
            </Typography>
            
            {/* Upcoming Maintenance */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upcoming Maintenance ({dashboardData?.upcomingMaintenance?.length || 0})
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Station</TableCell>
                        <TableCell>Charger</TableCell>
                        <TableCell>Time Slot</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData?.upcomingMaintenance?.map((maintenance) => (
                        <TableRow key={maintenance.id}>
                          <TableCell>{maintenance.stationName}</TableCell>
                          <TableCell>{maintenance.chargerId}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {maintenance.startTime} - {maintenance.endTime}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={maintenance.status} 
                              color={
                                maintenance.status === 'scheduled' ? 'warning' : 
                                maintenance.status === 'completed' ? 'success' : 
                                maintenance.status === 'cancelled' ? 'error' : 'default'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Button 
                                size="small" 
                                startIcon={<ViewIcon />}
                                onClick={() => console.log('View maintenance:', maintenance)}
                                variant="outlined"
                              >
                                View
                              </Button>
                              {maintenance.status === 'scheduled' && (
                                <Button 
                                  size="small" 
                                  startIcon={<EditIcon />}
                                  onClick={() => handleEditMaintenance(maintenance.id)}
                                  variant="outlined"
                                >
                                  Edit
                                </Button>
                              )}
                              {maintenance.status !== 'completed' && maintenance.status !== 'cancelled' && (
                                <Button 
                                  size="small" 
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleCancelMaintenance(maintenance.id)}
                                  color="error"
                                  variant="outlined"
                                >
                                  Cancel
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      )) || []}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Recent Maintenance */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Maintenance</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Station</TableCell>
                        <TableCell>Charger</TableCell>
                        <TableCell>Time Slot</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData?.recentMaintenance?.slice(0, 10).map((maintenance) => (
                        <TableRow key={maintenance.id}>
                          <TableCell>{maintenance.stationName}</TableCell>
                          <TableCell>{maintenance.chargerId}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {maintenance.startTime}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {maintenance.endTime}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={maintenance.status} 
                              color={
                                maintenance.status === 'scheduled' ? 'warning' : 
                                maintenance.status === 'completed' ? 'success' : 
                                maintenance.status === 'cancelled' ? 'error' : 'default'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              startIcon={<ViewIcon />}
                              onClick={() => console.log('View maintenance:', maintenance)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )) || []}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        );
      case 'maintenance':
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Maintenance Scheduling
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
              Block slots during repairs and maintenance
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Upcoming Maintenance</Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleScheduleMaintenance}
                sx={{ backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.dark' } }}
              >
                Schedule Maintenance
              </Button>
            </Box>
            
            <Card>
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Station</TableCell>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData?.maintenanceSchedule?.map((maintenance) => (
                        <TableRow key={maintenance.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <MaintenanceIcon fontSize="small" color="action" />
                              <Typography variant="body2" fontWeight="medium">
                                {maintenance.type}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {maintenance.station}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(maintenance.scheduledDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(maintenance.scheduledDate).toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {maintenance.duration}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {maintenance.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={maintenance.status} 
                              color={
                                maintenance.status === 'scheduled' ? 'success' : 
                                maintenance.status === 'in-progress' ? 'warning' : 
                                maintenance.status === 'completed' ? 'info' : 'default'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Button 
                                size="small" 
                                startIcon={<EditIcon />}
                                onClick={() => handleEditMaintenance(maintenance.id)}
                                variant="outlined"
                              >
                                Edit
                              </Button>
                              {maintenance.status === 'scheduled' && (
                                <Button 
                                  size="small" 
                                  startIcon={<DeleteIcon />} 
                                  color="error"
                                  onClick={() => handleCancelMaintenance(maintenance.id)}
                                  variant="outlined"
                                >
                                  Cancel
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      )) || []}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        );
      case 'maintenance-predictions':
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Predictive Maintenance
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
              View maintenance risk predictions for your stations
            </Typography>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Stations Requiring Attention</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Stations with Medium or High maintenance risk predictions
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Station</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Risk Level</TableCell>
                        <TableCell>Last Prediction</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData?.maintenancePredictions && dashboardData.maintenancePredictions.length > 0 ? (
                        dashboardData.maintenancePredictions.map((station) => (
                        <TableRow key={station.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {station.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {station.code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={station.latestRiskClassification}
                              color={
                                station.latestRiskClassification === 'High' ? 'error' : 
                                station.latestRiskClassification === 'Medium' ? 'warning' : 'success'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {station.lastPredictionDate ? new Date(station.lastPredictionDate).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {station.location?.city}, {station.location?.state}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Button 
                                size="small" 
                                startIcon={<ViewIcon />}
                                variant="outlined"
                                onClick={() => navigate(`/station-manager/stations/${station.id}`)}
                              >
                                View Details
                              </Button>
                              <Button 
                                size="small" 
                                startIcon={<MaintenanceIcon />}
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                  // Navigate to maintenance scheduling for this station
                                  setActiveSection('maintenance');
                                  // TODO: Pass station ID to maintenance section
                                }}
                              >
                                Schedule
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                              No stations are under maintenance risk
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        );
      case 'pricing':
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Pricing & Offers
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
              Set station-level pricing and promotions
            </Typography>
            
            {/* Pricing Management */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Pricing Management</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Manage pricing strategies, discounts, and promotional offers for your assigned stations.
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleCreatePromotion}
                    sx={{ backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.dark' } }}
                  >
                    Create Promotion
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<EditIcon />}
                    onClick={handleBulkUpdatePricing}
                  >
                    Bulk Update Pricing
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<ViewIcon />}
                  >
                    View Pricing History
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
      case 'reports':
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Performance Reports
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
              Utilization rates, uptime, and user ratings
            </Typography>
            
            {/* Performance Metrics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          {dashboardData?.performanceMetrics?.utilizationRate || 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Utilization Rate
                        </Typography>
                      </Box>
                      <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                          {dashboardData?.performanceMetrics?.avgRating || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Average Rating
                        </Typography>
                      </Box>
                      <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color="info.main">
                          {dashboardData?.performanceMetrics?.totalSessions || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Sessions
                        </Typography>
                      </Box>
                      <AttachMoney sx={{ fontSize: 40, color: 'info.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color="warning.main">
                          ₹{dashboardData?.performanceMetrics?.monthlyRevenue || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Monthly Revenue
                        </Typography>
                      </Box>
                      <AttachMoney sx={{ fontSize: 40, color: 'warning.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Performance Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Utilization Trends</Typography>
                    <Box height={300}>
                      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 10 }}>
                        Utilization chart will be displayed here
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Revenue Analysis</Typography>
                    <Box height={300}>
                      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 10 }}>
                        Revenue chart will be displayed here
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Station Performance Summary */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Station Performance Summary</Typography>
                <Grid container spacing={2}>
                  {dashboardData?.assignedStations?.map((station) => (
                    <Grid item xs={12} sm={6} md={4} key={station.id}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {station.name}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">Utilization:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {station.analytics?.utilizationRate || 0}%
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">Rating:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {station.analytics?.averageRating || 0}/5
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">Sessions:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {station.analytics?.totalSessions || 0}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Revenue:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            ₹{station.analytics?.monthlyRevenue || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )) || []}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );
      case 'feedback':
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Reviews
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
              View customer reviews
            </Typography>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Customer Reviews ({feedbackData?.length || 0})
                </Typography>
                {feedbackData && feedbackData.length > 0 ? (
                  feedbackData.map((feedback) => (
                    <Box key={feedback.id} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {feedback.user}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              sx={{ 
                                fontSize: 20, 
                                color: i < feedback.rating ? '#FFD700' : 'grey.300' 
                              }} 
                            />
                          ))}
                          <Typography variant="body2" color="text.secondary">
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Station: {feedback.stationName}
                      </Typography>
                      <Typography variant="body1">
                        {feedback.comment}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent feedback available.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        );
      case 'profile':
        const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Profile Settings
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
              Manage account and preferences
            </Typography>

            <Grid container spacing={4}>
              {/* Profile Image Section */}
              <Grid item xs={12} md={4}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: 'fit-content' }}>
                  <CardContent sx={{ textAlign: 'center', p: 4 }}>
                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                      <Avatar 
                        src={user?.profileImage || undefined}
                        sx={{ 
                          width: 150, 
                          height: 150, 
                          bgcolor: user?.profileImage ? 'transparent' : 'primary.main', 
                          fontSize: '4rem',
                          mx: 'auto'
                        }}
                      >
                        {!user?.profileImage && initials}
                      </Avatar>
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }}
                        onClick={() => setIsImageDialogOpen(true)}
                      >
                        <PhotoCameraIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      {user?.firstName} {user?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {user?.email}
                    </Typography>
                    <Chip 
                      label="Station Manager" 
                      color="primary" 
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Profile Details Section */}
              <Grid item xs={12} md={8}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Personal Information
                      </Typography>
                      {!isEditingProfile ? (
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => setIsEditingProfile(true)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleProfileUpdate}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={cancelProfileEdit}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          value={profileForm.firstName}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^[A-Za-z]*$/.test(value) || value === '') {
                              setProfileForm({ ...profileForm, firstName: value });
                              if (value.trim() === '') {
                                setProfileErrors(prev => ({ ...prev, firstName: 'First name is required' }));
                              } else if (!/^[A-Za-z]+$/.test(value)) {
                                setProfileErrors(prev => ({ ...prev, firstName: 'Letters only, no spaces' }));
                              } else if (value.trim().length < 2) {
                                setProfileErrors(prev => ({ ...prev, firstName: 'First name must be at least 2 characters' }));
                              } else if (value.trim().length > 10) {
                                setProfileErrors(prev => ({ ...prev, firstName: 'First name must be less than 10 characters' }));
                              } else {
                                setProfileErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.firstName;
                                  return newErrors;
                                });
                              }
                            }
                          }}
                          disabled={!isEditingProfile}
                          error={!!profileErrors.firstName}
                          helperText={profileErrors.firstName}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          value={profileForm.lastName}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^[A-Za-z]*$/.test(value) || value === '') {
                              setProfileForm({ ...profileForm, lastName: value });
                              if (value.trim() === '') {
                                setProfileErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
                              } else if (!/^[A-Za-z]+$/.test(value)) {
                                setProfileErrors(prev => ({ ...prev, lastName: 'Letters only, no spaces' }));
                              } else if (value.trim().length < 2) {
                                setProfileErrors(prev => ({ ...prev, lastName: 'Last name must be at least 2 characters' }));
                              } else if (value.trim().length > 10) {
                                setProfileErrors(prev => ({ ...prev, lastName: 'Last name must be less than 10 characters' }));
                              } else {
                                setProfileErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.lastName;
                                  return newErrors;
                                });
                              }
                            }
                          }}
                          disabled={!isEditingProfile}
                          error={!!profileErrors.lastName}
                          helperText={profileErrors.lastName}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={user?.email || ''}
                          disabled
                          helperText="Email cannot be changed"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          value={profileForm.phone}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value) || value === '') {
                              setProfileForm({ ...profileForm, phone: value });
                              if (value.trim() !== '' && !/^\d*$/.test(value)) {
                                setProfileErrors(prev => ({ ...prev, phone: 'Phone number can only contain digits' }));
                              } else if (value.trim() !== '' && value.length !== 10) {
                                setProfileErrors(prev => ({ ...prev, phone: 'Phone number must be exactly 10 digits' }));
                              } else {
                                setProfileErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.phone;
                                  return newErrors;
                                });
                              }
                            }
                          }}
                          disabled={!isEditingProfile}
                          error={!!profileErrors.phone}
                          helperText={profileErrors.phone}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          value={profileForm.address}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 80) {
                              setProfileForm({ ...profileForm, address: value });
                              if (value.length > 80) {
                                setProfileErrors(prev => ({ ...prev, address: 'Address must be less than 80 characters' }));
                              } else {
                                setProfileErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.address;
                                  return newErrors;
                                });
                              }
                            }
                          }}
                          disabled={!isEditingProfile}
                          multiline
                          rows={3}
                          error={!!profileErrors.address}
                          helperText={profileErrors.address || `${profileForm.address.length}/80 characters`}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Password Section */}
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Password
                      </Typography>
                      {!isEditingPassword ? (
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => setIsEditingPassword(true)}
                          disabled={!user?.credentials?.passwordHash}
                        >
                          Change Password
                        </Button>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handlePasswordUpdate}
                          >
                            Update
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={cancelPasswordEdit}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                    </Box>

                    {!user?.credentials?.passwordHash && (
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Password change is not available for Google accounts.
                      </Alert>
                    )}

                    {isEditingPassword && (
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Current Password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            error={!!passwordErrors.currentPassword}
                            helperText={passwordErrors.currentPassword}
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  edge="end"
                                >
                                  {showCurrentPassword ? <VisibilityOffIcon /> : <ViewIcon />}
                                </IconButton>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="New Password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            error={!!passwordErrors.newPassword}
                            helperText={passwordErrors.newPassword}
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  edge="end"
                                >
                                  {showNewPassword ? <VisibilityOffIcon /> : <ViewIcon />}
                                </IconButton>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            error={!!passwordErrors.confirmPassword}
                            helperText={passwordErrors.confirmPassword}
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                >
                                  {showConfirmPassword ? <VisibilityOffIcon /> : <ViewIcon />}
                                </IconButton>
                              ),
                            }}
                          />
                        </Grid>
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Profile Image Dialog */}
            <Dialog open={isImageDialogOpen} onClose={() => setIsImageDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Update Profile Image</DialogTitle>
              <DialogContent>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Upload from Device</Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-image-file"
                    type="file"
                    onChange={(e) => setImageForm({ ...imageForm, file: e.target.files[0], imageUrl: '' })}
                  />
                  <label htmlFor="profile-image-file">
                    <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />}>
                      Choose Image
                    </Button>
                  </label>
                  {imageForm.file && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                      Selected: {imageForm.file.name}
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">OR</Typography>
                </Divider>
                
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>Enter Image URL</Typography>
                  <TextField
                    fullWidth
                    label="Image URL"
                    value={imageForm.imageUrl}
                    onChange={(e) => setImageForm({ ...imageForm, imageUrl: e.target.value, file: null })}
                    error={!!imageErrors.imageUrl}
                    helperText={imageErrors.imageUrl || "Enter a valid image URL"}
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => {
                  setIsImageDialogOpen(false);
                  setImageForm({ imageUrl: '', file: null });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleImageUpdate} variant="contained">Update</Button>
              </DialogActions>
            </Dialog>
          </Box>
        );
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
          },
          display: { xs: 'none', md: 'block' }
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            NexCharge
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Station Manager Portal
          </Typography>
        </Box>
        <Divider sx={{ borderColor: '#e2e8f0' }} />
        <List>
          {navigationItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={activeSection === item.id}
                onClick={() => setActiveSection(item.id)}
                sx={{
                  mb: 0.5,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: '#f1f5f9',
                    '&:hover': { bgcolor: '#f1f5f9' },
                    color: '#1e293b'
                  },
                  '&:hover': { bgcolor: '#f8fafc' }
                }}
              >
                <ListItemIcon sx={{ color: activeSection === item.id ? '#1e293b' : '#64748b', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: activeSection === item.id ? 600 : 400 }}
                  secondary={item.description}
                  secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <AppBar position="static" sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: 'text.primary', display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 700 }}>
              Station Manager Dashboard
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Welcome, {user?.firstName || 'Manager'}
              </Typography>
              <IconButton onClick={handleMenuClick} sx={{ color: 'text.primary' }}>
                <Avatar 
                  src={user?.profileImage || undefined}
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: user?.profileImage ? 'transparent' : 'primary.main' 
                  }}
                >
                  {!user?.profileImage && (user?.firstName?.charAt(0) || 'M')}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { handleMenuClose(); setActiveSection('profile'); }}>
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
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {renderContent()}
        </Box>

        {/* Footer */}
        <Footer />
      </Box>

      {/* Station Form Dialog */}
      <Dialog 
        open={stationDialog.open} 
        onClose={() => setStationDialog({ open: false, mode: 'view', station: null })}
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <EvStationIcon color="primary" />
            <Typography variant="h6">
              {stationDialog.mode === 'view' ? 'View Station' : 'Edit Station'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mt: 2 }}>
            {/* Basic Station Info */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>  
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
                      disabled
                      helperText="Unique identifier"
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
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
                      disabled={stationDialog.mode === 'view'}
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
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
                    <FormControl fullWidth required disabled={stationDialog.mode === 'view'}>
                      <InputLabel>Charger Types Supported</InputLabel>
                      <Select
                        multiple
                        value={stationForm.chargerTypes}
                        onChange={(e) => setStationForm({ ...stationForm, chargerTypes: e.target.value })}
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
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <People color="primary" />
                  <Typography variant="h6">Contact & Ownership</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
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
            onClick={() => setStationDialog({ open: false, mode: 'view', station: null })}
            disabled={stationLoading}
          >
            Close
          </Button>
          {stationDialog.mode === 'view' ? (
            <Button 
              onClick={() => setStationDialog({ ...stationDialog, mode: 'edit' })}
              variant="contained"
              startIcon={<EditIcon />}
            >
              Edit Station
            </Button>
          ) : (
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
                'Update Station'
              )}
            </Button>
          )}
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
      
      <StationPhotosModal 
        open={photosModal.open}
        onClose={() => setPhotosModal({ open: false, station: null })}
        station={photosModal.station}
        onRefresh={loadDashboardData}
      />

    </Box>
  );
};

export default StationManagerDashboard;

