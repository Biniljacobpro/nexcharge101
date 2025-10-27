import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Badge,
  Drawer,
  AppBar,
  Toolbar,
  InputAdornment,
  Menu,
  MenuItem as MenuItemComponent,
  Switch,
  FormControlLabel,
  LinearProgress
} from '@mui/material';
import corporateService from '../services/corporateService';
import * as api from '../utils/api';
import NotificationDropdown from '../components/NotificationDropdown';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  ChargingStation as ChargingStationIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MonetizationOnIcon,
  LocationOn as LocationOnIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Group as GroupIcon,
  Store as StoreIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Help as HelpIcon,
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  Psychology as PsychologyIcon,
  Security as SecurityIcon,
  Build as BuildIcon,
  Monitor as MonitorIcon,
  Assignment as AssignmentIcon,
  Folder as FolderIcon,
  Flag as FlagIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Storage as StorageIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import nexchargeLogo from '../assets/nexcharge-high-resolution-logo-transparent.png';

const CorporateDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [franchiseDialog, setFranchiseDialog] = useState({ open: false, mode: 'add', franchise: null });
  const [franchiseForm, setFranchiseForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    franchiseName: ''
  });
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [franchises, setFranchises] = useState([]);
  const [deleteFranchiseDlg, setDeleteFranchiseDlg] = useState({ open: false, franchise: null, status: 'idle', error: '' });
  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // State for data
  const [dashboardData, setDashboardData] = useState({
    totalFranchises: 0,
    totalStations: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    activeBookings: 0,
    totalUsers: 0,
    networkUtilization: 0,
    averageRating: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    revenueData: [],
    stationData: [],
    performanceMetrics: {}
  });
  const [corporateStations, setCorporateStations] = useState([]);

  // Corporate info state (for company name editing)
  const [corporateInfo, setCorporateInfo] = useState(null);
  const [corpName, setCorpName] = useState('');
  const [corpInfoLoading, setCorpInfoLoading] = useState(false);

  // Profile state
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState('');

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Main Dashboard', icon: <DashboardIcon />, description: 'Overview and KPIs' },
    { id: 'franchises', label: 'Franchise Management', icon: <BusinessIcon />, description: 'Manage franchise partners' },
    { id: 'stations', label: 'Station Management', icon: <ChargingStationIcon />, description: 'Monitor charging stations' },
    { id: 'users', label: 'User Management', icon: <PeopleIcon />, description: 'Manage franchise owners and station managers' },
    { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon />, description: 'Performance insights' },
    { id: 'bookings', label: 'Booking Management', icon: <ScheduleIcon />, description: 'Track charging sessions' },
    { id: 'profile', label: 'Profile Settings', icon: <PersonIcon />, description: 'Account management' },
    { id: 'settings', label: 'Corporate Settings', icon: <SettingsIcon />, description: 'System configuration' }
  ];

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    loadFranchises();
    loadRecentBookings();
    loadAnalytics();
    loadCorporateStations();
    loadUserProfile();
    loadCorporateInfo();
    loadUsers();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
      setProfileForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || ''
      });
      const currentImg = userData.profileImage || userData.personalInfo?.profileImage || '';
      setProfileImagePreview(currentImg);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setSnackbar({ open: true, message: 'Error loading profile', severity: 'error' });
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await corporateService.getDashboardData();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setSnackbar({ open: true, message: 'Error loading dashboard data', severity: 'error' });
    }
  };

  const loadFranchises = async () => {
    try {
      const response = await corporateService.getFranchiseOwners();
      if (response.success) {
        setFranchises(response.data.franchises);
      }
    } catch (error) {
      console.error('Error loading franchises:', error);
      setSnackbar({ open: true, message: 'Error loading franchises', severity: 'error' });
    }
  };

  const loadRecentBookings = async () => {
    try {
      const response = await corporateService.getRecentBookings();
      if (response.success) {
        setRecentBookings(response.data);
      }
    } catch (error) {
      console.error('Error loading recent bookings:', error);
      setSnackbar({ open: true, message: 'Error loading recent bookings', severity: 'error' });
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await corporateService.getAnalytics();
      if (response.success) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setSnackbar({ open: true, message: 'Error loading analytics', severity: 'error' });
    }
  };

  const loadCorporateStations = async () => {
    try {
      const res = await corporateService.getCorporateStations();
      if (res.success) setCorporateStations(res.data || []);
    } catch (error) {
      console.error('Error loading stations:', error);
    }
  };

  const loadCorporateInfo = async () => {
    try {
      setCorpInfoLoading(true);
      const res = await corporateService.getCorporateInfo();
      if (res?.success) {
        setCorporateInfo(res.data);
        setCorpName(res.data?.name || '');
      }
    } catch (error) {
      console.error('Error loading corporate info:', error);
      setSnackbar({ open: true, message: 'Error loading corporate info', severity: 'error' });
    } finally {
      setCorpInfoLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await corporateService.getCorporateUsers();
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setSnackbar({ open: true, message: 'Error loading users', severity: 'error' });
    }
  };

  const handleCorporateNameSave = async (e) => {
    e.preventDefault();
    if (!corpName || !corpName.trim()) {
      setSnackbar({ open: true, message: 'Company name cannot be empty', severity: 'warning' });
      return;
    }
    try {
      setCorpInfoLoading(true);
      const res = await corporateService.updateCorporateName(corpName.trim());
      if (res?.success) {
        setCorporateInfo(res.data);
        setCorpName(res.data?.name || corpName.trim());
        setSnackbar({ open: true, message: 'Company name updated', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to update company name', severity: 'error' });
    } finally {
      setCorpInfoLoading(false);
    }
  };

  // Update station status (active, maintenance, inactive)
  const handleCorporateStationStatusChange = async (stationId, nextStatus) => {
    try {
      setLoading(true);
      await corporateService.updateCorporateStationStatus(stationId, nextStatus);
      setSnackbar({ open: true, message: 'Station status updated', severity: 'success' });
      // Refresh the list to reflect the change
      await loadCorporateStations();
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Failed to update status', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const handleFranchiseDialog = (mode, franchise = null) => {
    setFranchiseDialog({ open: true, mode, franchise });
    if (mode === 'edit' && franchise) {
      setFranchiseForm({
        firstName: franchise.firstName || (franchise.name?.split(' ')[0] || ''),
        lastName: franchise.lastName || (franchise.name?.split(' ').slice(1).join(' ') || ''),
        email: franchise.email || '',
        phone: franchise.phone || '',
        franchiseName: franchise.franchiseName || franchise.name || ''
      });
    } else {
      setFranchiseForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        franchiseName: ''
      });
    }
  };

  const handleFranchiseSubmit = async () => {
    setLoading(true);
    try {
      if (franchiseDialog.mode === 'add') {
        await corporateService.addFranchiseOwner(franchiseForm);
        setSnackbar({ open: true, message: 'Franchise owner added successfully', severity: 'success' });
        loadFranchises(); // Reload franchises list
      } else {
        await corporateService.updateFranchiseOwner(franchiseDialog.franchise.id, franchiseForm);
        setSnackbar({ open: true, message: 'Franchise owner updated successfully', severity: 'success' });
        loadFranchises(); // Reload franchises list
      }
      
      setFranchiseDialog({ open: false, mode: 'add', franchise: null });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error processing request', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteFranchiseDialog = (franchise) => {
    setDeleteFranchiseDlg({ open: true, franchise, status: 'idle', error: '' });
  };

  const closeDeleteFranchiseDialog = () => {
    setDeleteFranchiseDlg({ open: false, franchise: null, status: 'idle', error: '' });
  };

  const confirmDeleteFranchise = async () => {
    const franchise = deleteFranchiseDlg.franchise;
    if (!franchise) return;
    setDeleteFranchiseDlg((d) => ({ ...d, status: 'loading', error: '' }));
    try {
      await corporateService.deleteFranchiseOwner(franchise.id);
      setSnackbar({ open: true, message: 'Franchise deleted successfully', severity: 'success' });
      // Optimistically update the UI
      setFranchises((prev) => prev.filter((f) => f.id !== franchise.id));
      closeDeleteFranchiseDialog();
      // Refresh lists and KPI cards
      loadFranchises();
      loadDashboardData();
    } catch (error) {
      // Show backend reason, e.g., stations/managers exist
      setDeleteFranchiseDlg((d) => ({ ...d, status: 'error', error: error.message || 'Error deleting franchise' }));
    }
  };



  const handleProfileChange = (field) => (e) => {
    setProfileForm({ ...profileForm, [field]: e.target.value });
    if (profileError) setProfileError('');
  };

  const handlePasswordChange = (field) => (e) => {
    setPasswordForm({ ...passwordForm, [field]: e.target.value });
    if (passwordError) setPasswordError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    try {
      await api.updateProfileApi(profileForm);
      setProfileSuccess('Profile updated successfully');
      setTimeout(() => setProfileSuccess(''), 3000);
      loadUserProfile(); // Reload user data
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    try {
      await api.updatePasswordApi({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Profile image handlers (upload/remove)
  const fileInputRef = useRef(null);
  const handleChooseImage = () => fileInputRef.current?.click();

  const handleProfileImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setProfileImagePreview(localUrl);
    setProfileImageLoading(true);
    try {
      await api.uploadProfileImageApi(file);
      setSnackbar({ open: true, message: 'Profile picture updated', severity: 'success' });
      await loadUserProfile();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to update profile picture', severity: 'error' });
      await loadUserProfile();
    } finally {
      setProfileImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveProfileImage = async () => {
    setProfileImageLoading(true);
    try {
      await api.updateProfileImageApi('');
      setSnackbar({ open: true, message: 'Profile picture removed', severity: 'success' });
      await loadUserProfile();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to remove profile picture', severity: 'error' });
    } finally {
      setProfileImageLoading(false);
    }
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Card sx={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {trend > 0 ? (
                  <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
                )}
                <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(trend)}% since last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const renderOverview = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Franchises"
            value={dashboardData.totalFranchises}
            icon={<BusinessIcon />}
            color="primary"
            subtitle="Active partners"
            trend={12.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Active Stations"
            value={dashboardData.totalStations}
            icon={<ChargingStationIcon />}
            color="info"
            subtitle="Charging points"
            trend={8.3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Revenue"
            value={`₹${(dashboardData.totalRevenue / 100000).toFixed(1)}L`}
            icon={<MonetizationOnIcon />}
            color="success"
            subtitle="This month"
            trend={dashboardData.monthlyGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Charging Sessions"
            value={dashboardData.activeBookings}
            icon={<BarChartIcon />}
            color="info"
            subtitle="Active bookings"
            trend={15.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="System Uptime"
            value="99.9%"
            icon={<CheckCircleIcon />}
            color="success"
            subtitle="Healthy"
            trend={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Network Efficiency"
            value={`${dashboardData.networkUtilization}%`}
            icon={<PsychologyIcon />}
            color="warning"
            subtitle="Performance"
            trend={5.2}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue & Bookings Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="bookings" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Station Type Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.stationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.stationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Station Cards */}
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          {corporateStations.map((s) => (
            <Grid item xs={12} sm={6} md={4} key={s.id}>
              <Card sx={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || 'Unnamed Station'}</Typography>
                      <Typography variant="caption" color="text.secondary">Code: {s.code || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={s.status}
                        color={s.status === 'active' ? 'success' : (s.status === 'maintenance' ? 'warning' : 'default')}
                      />
                      <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel id={`status-label-${s.id}`}>Status</InputLabel>
                        <Select
                          labelId={`status-label-${s.id}`}
                          label="Status"
                          value={s.status || ''}
                          onChange={(e) => handleCorporateStationStatusChange(s.id, e.target.value)}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="maintenance">Maintenance</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                    {s.description || 'No description provided.'}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Chargers</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{s.totalChargers}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Base Price</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{(s.basePrice || 0).toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Charger Types</Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(s.chargerTypes || []).map((t) => (
                          <Chip key={t} size="small" label={t} />
                        ))}
                        {(s.chargerTypes || []).length === 0 && (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Amenities</Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(s.amenities || []).map((a) => (
                          <Chip key={a} size="small" label={a} color="info" variant="outlined" />
                        ))}
                        {(s.amenities || []).length === 0 && (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Location</Typography>
                      <Typography variant="body2">{[s.address, s.city, s.state, s.pincode].filter(Boolean).join(', ') || '-'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {corporateStations.length === 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">No stations found for this corporate.</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );

  // Delete Franchise confirmation dialog
  const DeleteFranchiseDialog = () => (
    <Dialog open={deleteFranchiseDlg.open} onClose={closeDeleteFranchiseDialog} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Franchise Owner</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Are you sure you want to delete {deleteFranchiseDlg.franchise?.name || 'this franchise owner'}?
        </Typography>
        {deleteFranchiseDlg.status === 'error' && (
          <Alert severity="error" sx={{ mt: 2 }}>{deleteFranchiseDlg.error}</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDeleteFranchiseDialog} disabled={deleteFranchiseDlg.status === 'loading'}>Cancel</Button>
        <Button color="error" variant="contained" onClick={confirmDeleteFranchise} disabled={deleteFranchiseDlg.status === 'loading'}>
          {deleteFranchiseDlg.status === 'loading' ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderFranchiseManagement = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Franchise Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleFranchiseDialog('add')}
        >
          Add Franchise Owner
        </Button>
      </Box>

      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Franchise Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Stations</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {franchises.map((franchise) => (
                <TableRow key={franchise.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{franchise.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          Joined: {new Date(franchise.joinDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{franchise.email}</Typography>
                      <Typography variant="body2" color="textSecondary">{franchise.phone}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{franchise.location}</TableCell>
                  <TableCell>
                    <Chip label={franchise.stations} color="primary" size="small" />
                  </TableCell>
                  <TableCell>₹{franchise.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={franchise.status}
                      color={franchise.status === 'active' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>{franchise.rating}</Typography>
                      <Typography variant="body2" color="textSecondary">★</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <IconButton size="small" onClick={() => handleFranchiseDialog('edit', franchise)}>
                        <EditIcon />
                      </IconButton>
                      {franchise.stations > 0 ? (
                        <Tooltip title="Cannot delete: this franchise has stations. Transfer/remove stations and unassign managers first.">
                          <span>
                            <IconButton size="small" disabled>
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : (
                        <IconButton size="small" onClick={() => openDeleteFranchiseDialog(franchise)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                      <IconButton size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );

  // Handle user status toggle
  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      setUpdatingUserId(userId);
      await corporateService.updateCorporateUserStatus(userId, !currentStatus);
      await loadUsers(); // Refresh the users list
      setSnackbar({ 
        open: true, 
        message: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Failed to update user status', error);
      setSnackbar({ 
        open: true, 
        message: error.message || 'Failed to update user status', 
        severity: 'error' 
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const renderUserManagement = () => {
    // Filter users based on search query and role filter
    const filteredUsers = users.filter(user => {
      const matchesSearch = !userSearchQuery || 
        `${user.personalInfo?.firstName || ''} ${user.personalInfo?.lastName || ''}`.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (user.personalInfo?.email || '').toLowerCase().includes(userSearchQuery.toLowerCase());
      
      const matchesRole = !userRoleFilter || user.role === userRoleFilter;
      
      return matchesSearch && matchesRole;
    });

    // Get unique roles for filter dropdown (only franchise_owner and station_manager)
    const uniqueRoles = [...new Set(users.map(u => u.role))].filter(role => 
      ['franchise_owner', 'station_manager'].includes(role)
    ).sort();

    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          User Management
        </Typography>
        
        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                All Users ({filteredUsers.length})
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 250 }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    label="Role"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    {uniqueRoles.map(role => (
                      <MenuItem key={role} value={role}>
                        {role === 'franchise_owner' ? 'Franchise Owner' : 'Station Manager'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>NAME</TableCell>
                    <TableCell>ROLE</TableCell>
                    <TableCell>STATUS</TableCell>
                    <TableCell>JOINED</TableCell>
                    <TableCell align="right">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {userSearchQuery || userRoleFilter ? 'No users found matching your search criteria' : 'No users found'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {`${user.personalInfo?.firstName?.[0] || ''}${user.personalInfo?.lastName?.[0] || ''}`}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {user.personalInfo?.firstName} {user.personalInfo?.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.personalInfo?.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role === 'franchise_owner' ? 'Franchise Owner' : 'Station Manager'} 
                            size="small" 
                            sx={{ 
                              bgcolor: user.role === 'franchise_owner' ? 'primary.main' : 'info.main',
                              color: 'white'
                            }} 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.credentials?.isActive ? 'Active' : 'Inactive'} 
                            size="small" 
                            sx={{ bgcolor: user.credentials?.isActive ? 'success.main' : 'warning.main', color: 'white' }} 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant={user.credentials?.isActive ? 'outlined' : 'contained'}
                            color={user.credentials?.isActive ? 'warning' : 'success'}
                            disabled={updatingUserId === user._id}
                            onClick={() => handleUserStatusToggle(user._id, user.credentials?.isActive)}
                          >
                            {updatingUserId === user._id ? (
                              <CircularProgress size={16} sx={{ mr: 1 }} />
                            ) : null}
                            {user.credentials?.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderStationManagement = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Station Management
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Station Overview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Monitor and manage charging stations across your network
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Total Stations</Typography>
                <Typography variant="h6" color="primary.main">{dashboardData.totalStations}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Active Stations</Typography>
                <Typography variant="h6" color="success.main">{dashboardData.totalStations}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Maintenance Required</Typography>
                <Typography variant="h6" color="warning.main">2</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Average Utilization</Typography>
                <Typography variant="h6" color="info.main">{dashboardData.networkUtilization}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Station Performance
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Real-time performance metrics
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Uptime</Typography>
                <Typography variant="h6" color="success.main">99.9%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Energy Efficiency</Typography>
                <Typography variant="h6" color="success.main">94.2%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Customer Rating</Typography>
                <Typography variant="h6" color="primary.main">4.6/5</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Revenue per Station</Typography>
                <Typography variant="h6" color="info.main">₹26,042</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed station cards directly below overview/performance */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {corporateStations.map((s) => (
              <Grid item xs={12} sm={6} md={4} key={s.id}>
                <Card sx={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || 'Unnamed Station'}</Typography>
                        <Typography variant="caption" color="text.secondary">Code: {s.code || '-'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          size="small"
                          label={s.status}
                          color={s.status === 'active' ? 'success' : (s.status === 'maintenance' ? 'warning' : 'default')}
                        />
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                          <InputLabel id={`status2-label-${s.id}`}>Status</InputLabel>
                          <Select
                            labelId={`status2-label-${s.id}`}
                            label="Status"
                            value={s.status || ''}
                            onChange={(e) => handleCorporateStationStatusChange(s.id, e.target.value)}
                          >
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="maintenance">Maintenance</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                      {s.description || 'No description provided.'}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Chargers</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{s.totalChargers}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Base Price</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{(s.basePrice || 0).toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Charger Types</Typography>
                        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(s.chargerTypes || []).map((t) => (
                            <Chip key={t} size="small" label={t} />
                          ))}
                          {(s.chargerTypes || []).length === 0 && (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Amenities</Typography>
                        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(s.amenities || []).map((a) => (
                            <Chip key={a} size="small" label={a} color="info" variant="outlined" />
                          ))}
                          {(s.amenities || []).length === 0 && (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Location</Typography>
                        <Typography variant="body2">{[s.address, s.city, s.state, s.pincode].filter(Boolean).join(', ') || '-'}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {corporateStations.length === 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">No stations found for this corporate.</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );

  const renderAnalytics = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Advanced Analytics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Network Efficiency</Typography>
                <Typography variant="h6" color="success.main">{analyticsData.performanceMetrics.networkEfficiency || 87}%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Customer Satisfaction</Typography>
                <Typography variant="h6" color="primary.main">{analyticsData.performanceMetrics.customerSatisfaction || 4.6}/5</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Station Uptime</Typography>
                <Typography variant="h6" color="info.main">{analyticsData.performanceMetrics.stationUptime || 96.2}%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Revenue per Station</Typography>
                <Typography variant="h6" color="warning.main">₹{(analyticsData.performanceMetrics.revenuePerStation || 26042).toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Geographic Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Mumbai', stations: 15, revenue: 450000 },
                  { name: 'Delhi', stations: 12, revenue: 380000 },
                  { name: 'Bangalore', stations: 10, revenue: 320000 },
                  { name: 'Chennai', stations: 8, revenue: 250000 },
                  { name: 'Pune', stations: 6, revenue: 180000 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="stations" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderBookings = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Recent Bookings
      </Typography>
      
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Station</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                        {booking.user.charAt(0)}
                      </Avatar>
                      {booking.user}
                    </Box>
                  </TableCell>
                  <TableCell>{booking.station}</TableCell>
                  <TableCell>₹{booking.amount}</TableCell>
                  <TableCell>{booking.time}</TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      color={booking.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );

  const renderSettings = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Corporate Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Configuration
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Auto-approve new franchises"
                    secondary="Automatically approve franchise applications"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Revenue sharing percentage"
                    secondary="Current: 15%"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Minimum station requirement"
                    secondary="5 stations per franchise"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="New franchise applications"
                    secondary="Email notifications enabled"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Revenue milestones"
                    secondary="Weekly reports enabled"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="System alerts"
                    secondary="Critical issues only"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderProfile = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Profile Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
              {profileSuccess && <Alert severity="success" sx={{ mb: 2 }}>{profileSuccess}</Alert>}
              {/* Profile Picture */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={profileImagePreview || undefined}
                  alt={user?.firstName || 'User'}
                  sx={{ width: 72, height: 72 }}
                >
                  {(user?.firstName || 'U')[0]}
                </Avatar>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleProfileImageSelected}
                  />
                  <Button variant="outlined" onClick={handleChooseImage} disabled={profileImageLoading}>
                    {profileImageLoading ? <CircularProgress size={18} /> : 'Upload New'}
                  </Button>
                  <Button color="error" variant="text" onClick={handleRemoveProfileImage} disabled={profileImageLoading || !profileImagePreview}>
                    Remove
                  </Button>
                </Box>
              </Box>
              <Box component="form" onSubmit={handleProfileSubmit}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profileForm.firstName}
                  onChange={handleProfileChange('firstName')}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profileForm.lastName}
                  onChange={handleProfileChange('lastName')}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange('email')}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange('phone')}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                  value={profileForm.address}
                  onChange={handleProfileChange('address')}
                  margin="normal"
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={profileLoading}
                >
                  {profileLoading ? <CircularProgress size={20} /> : 'Update Profile'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
              {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}
              <Box component="form" onSubmit={handlePasswordSubmit}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange('currentPassword')}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange('newPassword')}
                  margin="normal"
                  required
                  helperText="At least 8 characters with uppercase, lowercase, and number"
                />
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange('confirmPassword')}
                  margin="normal"
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? <CircularProgress size={20} /> : 'Change Password'}
                </Button>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Corporate Information
              </Typography>
              <Box component="form" onSubmit={handleCorporateNameSave}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={corpName}
                  onChange={(e) => setCorpName(e.target.value)}
                  margin="normal"
                  required
                  helperText={corporateInfo?.businessRegistrationNumber ? `BRN: ${corporateInfo.businessRegistrationNumber}` : ''}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={corpInfoLoading}
                >
                  {corpInfoLoading ? <CircularProgress size={20} /> : 'Save Company Name'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const currentSection = navigationItems.find(item => item.id === activeSection);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid #e0e0e0'
          },
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <img src={nexchargeLogo} alt="NexCharge" style={{ height: '52px', width: 'auto' }} />
          <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 'bold', mt: 1 }}>Corporate Admin</Typography>
        </Box>
        
        <List sx={{ px: 2, py: 1 }}>
          {navigationItems.map((item) => (
            <ListItem
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              sx={{
                mb: 1,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: activeSection === item.id ? '#e3f2fd' : 'transparent',
                '&:hover': {
                  bgcolor: activeSection === item.id ? '#e3f2fd' : '#f5f5f5'
                }
              }}
            >
              <ListItemIcon sx={{ color: activeSection === item.id ? '#1976d2' : 'text.secondary', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: activeSection === item.id ? 600 : 400,
                  color: activeSection === item.id ? '#1976d2' : 'text.primary'
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                  color: 'text.secondary'
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'baseline', flexGrow: 1, gap: 2 }}>
              <Typography variant="h6" sx={{ color: 'text.primary' }}>
                {currentSection?.label}
              </Typography>
              {user && (
                <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                  Welcome, <strong>{user.firstName}</strong>
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>
              {currentSection?.description}
            </Typography>
            
            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mr: 2, width: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <NotificationDropdown />
            
            <IconButton sx={{ mr: 1 }}>
              <SettingsIcon />
            </IconButton>
            
            <IconButton sx={{ mr: 1 }}>
              <HelpIcon />
            </IconButton>
            
            <IconButton onClick={handleUserMenuOpen}>
              <Avatar
                src={user?.profileImage || user?.personalInfo?.profileImage || undefined}
                sx={{ width: 32, height: 32, bgcolor: '#4caf50' }}
              >
                {user?.firstName?.charAt(0) || 'C'}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
            >
              <MenuItemComponent onClick={() => { setActiveSection('profile'); handleUserMenuClose(); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItemComponent>
              <MenuItemComponent onClick={() => { setActiveSection('settings'); handleUserMenuClose(); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItemComponent>
              <Divider />
              <MenuItemComponent onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItemComponent>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          {activeSection === 'dashboard' && renderOverview()}
          {activeSection === 'franchises' && renderFranchiseManagement()}
          {activeSection === 'stations' && renderStationManagement()}
          {activeSection === 'users' && renderUserManagement()}
          {activeSection === 'analytics' && renderAnalytics()}
          {activeSection === 'bookings' && renderBookings()}
          {activeSection === 'profile' && renderProfile()}
          {activeSection === 'settings' && renderSettings()}
        </Box>
      </Box>

      {/* Franchise Dialog */}
      <Dialog open={franchiseDialog.open} onClose={() => setFranchiseDialog({ open: false, mode: 'add', franchise: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {franchiseDialog.mode === 'add' ? 'Add New Franchise Owner' : 'Edit Franchise Owner'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={franchiseForm.firstName}
                onChange={(e) => setFranchiseForm({ ...franchiseForm, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={franchiseForm.lastName}
                onChange={(e) => setFranchiseForm({ ...franchiseForm, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={franchiseForm.email}
                onChange={(e) => setFranchiseForm({ ...franchiseForm, email: e.target.value })}
                disabled={franchiseDialog.mode === 'edit'}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={franchiseForm.phone}
                onChange={(e) => setFranchiseForm({ ...franchiseForm, phone: e.target.value })}
                required
                helperText="10 digits only"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Franchise Name"
                value={franchiseForm.franchiseName}
                onChange={(e) => setFranchiseForm({ ...franchiseForm, franchiseName: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFranchiseDialog({ open: false, mode: 'add', franchise: null })}>
            Cancel
          </Button>
          <Button onClick={handleFranchiseSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : (franchiseDialog.mode === 'add' ? 'Add Franchise Owner' : 'Update')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Franchise Confirmation Dialog */}
      <DeleteFranchiseDialog />


      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CorporateDashboard;