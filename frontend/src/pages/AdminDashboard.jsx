import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Menu,
  Autocomplete
} from '@mui/material';
import {
  People as PeopleIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Storage as StorageIcon,
  Business as BusinessIcon,
  Psychology as PsychologyIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Build as BuildIcon,
  Monitor as MonitorIcon,
  Assignment as AssignmentIcon,
  Menu as MenuIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  RequestQuote as RequestQuoteIcon
} from '@mui/icons-material';
import NotificationDropdown from '../components/NotificationDropdown';
import { useNavigate } from 'react-router-dom';
import nexchargeLogo from '../assets/nexcharge-high-resolution-logo-transparent.png';
import * as api from '../utils/api';

const StatCard = ({ title, value, change, icon, color = 'primary', status }) => (
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
          {change && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {change > 0 ? (
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
              ) : (
                <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
              )}
              <Typography variant="caption" color={change > 0 ? 'success.main' : 'error.main'}>
                {Math.abs(change)}% since last month
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          bgcolor: `${color}.light`, 
          color: `${color}.main`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
      </Box>
      {status && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
          <Typography variant="caption" color="success.main">
            {status}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const ChartCard = ({ title, value, subtitle, change, status, children, actionIcon }) => (
  <Card sx={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {subtitle}
          </Typography>
          {change && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
              <Typography variant="caption" color="success.main">
                {change}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {status && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
              <Typography variant="caption" color="success.main">
                {status}
              </Typography>
            </Box>
          )}
          {actionIcon && (
            <IconButton size="small">
              {actionIcon}
            </IconButton>
          )}
        </Box>
      </Box>
      {children}
    </CardContent>
  </Card>
);

// Corporate Admin Management Section Component
const CorporateAdminManagementSection = ({ admins, onRefresh, onAddAdmin }) => {
  // Ensure admins is always an array
  const safeAdmins = Array.isArray(admins) ? admins : [];

  // Local search and status filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'inactive'

  const getActiveChip = (isActive) => (
    <Chip 
      label={isActive ? 'Active' : 'Inactive'}
      size="small"
      sx={{
        bgcolor: isActive ? 'success.main' : 'warning.main',
        color: 'white'
      }}
    />
  );

  const matchesSearch = (adm) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${adm.personalInfo?.firstName || ''} ${adm.personalInfo?.lastName || ''}`.toLowerCase();
    const email = (adm.personalInfo?.email || '').toLowerCase();
    const company = (adm.roleSpecificData?.corporateAdminInfo?.corporateId?.name || '').toLowerCase();
    const brn = (adm.roleSpecificData?.corporateAdminInfo?.corporateId?.businessRegistrationNumber || '').toLowerCase();
    return name.includes(q) || email.includes(q) || company.includes(q) || brn.includes(q);
  };

  const matchesStatus = (adm) => {
    if (!statusFilter) return true;
    const active = !!adm.credentials?.isActive;
    return statusFilter === 'active' ? active : !active;
  };

  const filteredAdmins = safeAdmins.filter(a => matchesSearch(a) && matchesStatus(a));

  return (
    <>

      {/* Corporate Admins Table */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Corporate Admins ({filteredAdmins.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search name, email, company, BRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 280 }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              {onAddAdmin && (
                <Button
                  variant="contained"
                  startIcon={<PersonIcon />}
                  onClick={onAddAdmin}
                >
                  Add Corporate Admin
                </Button>
              )}
            </Box>
          </Box>
          
          {filteredAdmins.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BusinessIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No corporate admins found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add corporate admins to see them listed here
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
          <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>BRN</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAdmins.map((adm) => (
                    <TableRow key={adm._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {adm.personalInfo?.firstName?.[0]}{adm.personalInfo?.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {adm.personalInfo?.firstName} {adm.personalInfo?.lastName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{adm.roleSpecificData?.corporateAdminInfo?.corporateId?.name || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{adm.roleSpecificData?.corporateAdminInfo?.corporateId?.businessRegistrationNumber || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{adm.personalInfo?.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{adm.personalInfo?.phone || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        {getActiveChip(adm.credentials?.isActive)}
                      </TableCell>
              <TableCell>
                <Typography variant="body2">{new Date(adm.createdAt).toLocaleDateString()}</Typography>
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant={adm.credentials?.isActive ? 'outlined' : 'contained'}
                  color={adm.credentials?.isActive ? 'warning' : 'success'}
                  onClick={async () => {
                    try {
                      await api.updateCorporateAdminStatusApi(adm._id, !adm.credentials?.isActive);
                      await onRefresh();
                    } catch (e) {
                      console.error('Failed to update status', e);
                      alert(e.message || 'Failed to update status');
                    }
                  }}
                >
                  {adm.credentials?.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
};

// Add Corporate Admin Section Component
const AddCorporateAdminSection = ({ onRefresh }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    firstName: '',
    lastName: '',
    contactNumber: '',
    businessRegistrationNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Client-side validation helpers
  const isValidEmail = (email) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(email).trim());
  const isValidPhone = (phone) => (/^\d{10}$/).test(String(phone).replace(/\D/g, ''));
  const isValidBRN = (brn) => (/^[A-Za-z0-9]{21}$/).test(String(brn).trim());
  const isLettersAndSpaces = (name) => (/^[A-Za-z ]+$/).test(String(name).trim());
  const validate = () => {
    if (!formData.companyName || formData.companyName.trim().length > 20) return 'Company name is required and must be <= 20 characters';
    if (!formData.companyEmail || !isValidEmail(formData.companyEmail)) return 'Enter a valid company email';
    if (!formData.firstName || !isLettersAndSpaces(formData.firstName)) return 'First name must contain only letters and spaces';
    if (!formData.lastName || !isLettersAndSpaces(formData.lastName)) return 'Last name must contain only letters and spaces';
    if (!formData.contactNumber || !isValidPhone(formData.contactNumber)) return 'Contact number must be exactly 10 digits';
    if (!formData.businessRegistrationNumber || !isValidBRN(formData.businessRegistrationNumber)) return 'Business Registration Number must be a 21-character alphanumeric code';
    return '';
  };

  

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const msg = validate();
    if (msg) {
      setLoading(false);
      setError(msg);
      return;
    }
    
    try {
      const result = await api.addCorporateAdmin(formData);
      
      if (result.success) {
        setSuccess(true);
        setFormData({
          companyName: '',
          companyEmail: '',
          firstName: '',
          lastName: '',
          contactNumber: '',
          businessRegistrationNumber: ''
        });
        onRefresh();
      } else {
        setError(result.message || 'Failed to add corporate admin');
      }
    } catch (err) {
      console.error('Error adding corporate admin:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" sx={{ mb: 2, color: 'success.main' }}>
          Corporate Admin Added Successfully!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          A temporary password has been sent to the corporate admin's email address.
        </Typography>
        <Button
          variant="contained"
          onClick={() => setSuccess(false)}
          sx={{ mr: 2 }}
        >
          Add Another Corporate Admin
        </Button>
        <Button
          variant="outlined"
          onClick={() => onRefresh()}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
          Add Corporate Admin
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new corporate admin account directly
        </Typography>
      </Box>

      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Email"
                  name="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Registration Number"
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </Grid>
              {/* Removed Additional Information field */}
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #00b894, #00a085)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #009B7A, #008F6F)'
                  }
                }}
              >
                {loading ? 'Adding...' : 'Add Corporate Admin'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => onRefresh()}
              >
                Cancel
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

// User Management Section Component
const UserManagementSection = ({ users, onAddCorporateAdmin, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Filter users based on search query and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      `${user.personalInfo?.firstName || ''} ${user.personalInfo?.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.personalInfo?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Get unique roles for filter dropdown
  const uniqueRoles = [...new Set(users.map(u => u.role))].sort();

  return (
    <>
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              All Users ({filteredUsers.length})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {uniqueRoles.map(role => (
                    <MenuItem key={role} value={role}>
                      {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {onAddCorporateAdmin && (
                <Button
                  variant="contained"
                  startIcon={<PersonIcon />}
                  onClick={onAddCorporateAdmin}
                >
                  Add Corporate Admin
                </Button>
              )}
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
                        {searchQuery || roleFilter ? 'No users found matching your search criteria' : 'No users found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            src={u.profileImage || undefined}
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: u.profileImage ? 'transparent' : 'primary.main' 
                            }}
                          >
                            {!u.profileImage && `${u.personalInfo?.firstName?.[0] || ''}${u.personalInfo?.lastName?.[0] || ''}`}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {u.personalInfo?.firstName} {u.personalInfo?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {u.personalInfo?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={u.role} 
                          size="small" 
                          sx={{ 
                            bgcolor: u.role === 'admin' ? 'error.main' : 'primary.main',
                            color: 'white'
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={u.credentials?.isActive ? 'Active' : 'Inactive'} 
                          size="small" 
                          sx={{ bgcolor: u.credentials?.isActive ? 'success.main' : 'warning.main', color: 'white' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant={u.credentials?.isActive ? 'outlined' : 'contained'}
                          color={u.credentials?.isActive ? 'warning' : 'success'}
                          disabled={updatingUserId === u._id}
                          onClick={async () => {
                            try {
                              setUpdatingUserId(u._id);
                              await api.adminUpdateUserStatus(u._id, !u.credentials?.isActive);
                              // Refresh the parent component's data
                              if (onRefresh) {
                                await onRefresh();
                              }
                            } catch (e) {
                              console.error('Failed to update user status', e);
                              alert(e.message || 'Failed to update status');
                            } finally {
                              setUpdatingUserId(null);
                            }
                          }}
                        >
                          {updatingUserId === u._id ? (
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                          ) : null}
                          {u.credentials?.isActive ? 'Deactivate' : 'Activate'}
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
    </>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [stats, setStats] = useState({ 
    activeStations: 0, 
    totalRevenue: 0, 
    totalPayments: 0, 
    liveChargingSessions: 0, 
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenueChart: [],
    lastUpdated: null 
  });
  const [revTooltip, setRevTooltip] = useState(null); // { left, top, value, dateStr }
  const [users, setUsers] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [corporateAdmins, setCorporateAdmins] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    vehicleType: 'car',
    batteryCapacity: '',
    chargingAC: { supported: true, maxPower: '', connectorTypes: [] },
    chargingDC: { supported: true, maxPower: '', connectorTypes: [] },
    specifications: { year: '', range: '', weight: '' }
  });
  const [makeModels, setMakeModels] = useState([]);
  const [blockedCapacities, setBlockedCapacities] = useState([]);
  const [vehicleErrors, setVehicleErrors] = useState({});
  const [error, setError] = useState('');
  const [vehicleActionError, setVehicleActionError] = useState('');
  const [vehicleActionSuccess, setVehicleActionSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetVehicle, setDeleteTargetVehicle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  // Vehicle Requests state
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [vehicleRequestsLoading, setVehicleRequestsLoading] = useState(false);
  const [vehicleRequestsError, setVehicleRequestsError] = useState('');
  const [vehicleRequestActionSuccess, setVehicleRequestActionSuccess] = useState('');
  const [vehicleRequestActionError, setVehicleRequestActionError] = useState('');
  const [activeVehicleTab, setActiveVehicleTab] = useState('vehicles');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [currentVehicleRequest, setCurrentVehicleRequest] = useState(null);

  // Connector types mapping
  const connectorTypes = [
    { value: 'type1', label: 'Type 1 (SAE J1772)' },
    { value: 'type2', label: 'Type 2 (Mennekes / IEC Type 2)' },
    { value: 'bharat_ac_001', label: 'Bharat AC-001' },
    { value: 'bharat_dc_001', label: 'Bharat DC-001' },
    { value: 'ccs2', label: 'CCS-2' },
    { value: 'chademo', label: 'CHAdeMO' },
    { value: 'gbt_type6', label: 'GB/T Type-6' },
    { value: 'type7_leccs', label: 'Type-7 (LECCS)' },
    { value: 'mcs', label: 'Megawatt Charging System (MCS)' },
    { value: 'chaoji', label: 'ChaoJi' },
    { value: 'other', label: 'Other' }
  ];

  // Vehicle makes for autocomplete
  const vehicleMakes = [
    'Tata', 'MG', 'Hyundai', 'BYD', 'Mahindra', 'Kia', 'Volkswagen',
    'Tesla', 'Renault', 'VinFast', 'Ather', 'Ola', 'TVS', 'Bajaj',
    'Hero Electric', 'Revolt', 'Okinawa', 'Ampere', 'Oben', 'PureEV',
    'Vespa', 'Piaggio', 'Olectra/Volvo'
  ];
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  // Station Management state
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationError, setStationError] = useState('');
  const [stationFilters, setStationFilters] = useState({ q: '', status: '', city: '', state: '' });

  const loadDashboard = async () => {
    try {
      const profile = await api.getMe();
      if (profile.role !== 'admin') {
        navigate('/login');
        return;
      }
      setUser(profile);
      
      const [ov, live, userList, corpAdmins, vehicleList] = await Promise.all([
        api.adminOverview(),
        api.adminLiveStats(),
        api.adminUsers(),
        api.getCorporateAdmins(),
        loadVehicles()
      ]);
      
      console.log('Corporate Admins:', corpAdmins);
      
      setOverview(ov);
      setStats(live || {});
      setUsers((userList || []).filter((u) => u.role !== 'admin'));
      setCorporateAdmins(corpAdmins || []);
      setVehicles(vehicleList || []);
    } catch (e) {
      console.error('Dashboard load error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      setVehicleLoading(true);
      const data = await api.getVehiclesApi();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error loading vehicles:', error);
      return [];
    } finally {
      setVehicleLoading(false);
    }
  };
  
  const loadVehicleRequests = async (filters = {}) => {
    try {
      setVehicleRequestsLoading(true);
      setVehicleRequestsError('');
      
      // Import the API function
      const { getVehicleRequestsApi } = await import('../utils/api');
      const data = await getVehicleRequestsApi(filters);
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error loading vehicle requests:', error);
      setVehicleRequestsError(error.message || 'Failed to load vehicle requests');
      return [];
    } finally {
      setVehicleRequestsLoading(false);
    }
  };

  const loadLiveStats = useCallback(async () => {
    try {
      const live = await api.adminLiveStats();
      setStats(live || {});
    } catch (e) {
      // Non-fatal: keep showing last known values
      console.error('Live stats load error:', e);
    }
  }, []);

  // Profile image upload handlers (Admin Settings)
  const handlePickProfileImage = () => {
    fileInputRef.current?.click();
  };

  const handleProfileFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      // 1) Upload file to server to get a URL/path
      const uploadRes = await api.uploadProfileImageApi(file);
      console.log('Profile image upload response:', uploadRes);

      // Build absolute URL helper from API base
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
      const apiOrigin = (() => {
        try { return new URL(apiBase).origin; } catch { return apiBase.replace(/\/api\/?$/, ''); }
      })();
      const toAbs = (p) => {
        if (!p) return '';
        if (/^https?:\/\//i.test(p)) return p;
        const clean = String(p).replace(/^\//, '');
        return `${apiOrigin}/${clean}`;
      };

      let imageUrl = uploadRes?.url
        || uploadRes?.imageUrl
        || uploadRes?.fileUrl
        || toAbs(uploadRes?.path)
        || toAbs(uploadRes?.filePath)
        || (uploadRes?.filename ? `${apiOrigin}/uploads/${uploadRes.filename}` : '')
        || uploadRes?.user?.profileImage; // Backend returns user object with profileImage

      if (!imageUrl) throw new Error('Upload did not return image URL');
      
      // If we got the user object from upload, use it directly, otherwise fetch fresh user data
      if (uploadRes?.user) {
        setUser(uploadRes.user);
      } else {
        // 2) Save profile image URL on user profile
        await api.updateProfileImageApi(imageUrl);
        // 3) Refresh current user
        const me = await api.getMe();
        setUser(me);
      }
    } catch (err) {
      console.error('Profile image update failed:', err);
      alert(err.message || 'Failed to update profile image');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Station Management: loader and actions
  const loadStations = async () => {
    if (activeSection !== 'stations') return;
    try {
      setStationsLoading(true);
      setStationError('');
      const data = await api.adminGetStations({
        ...(stationFilters.q ? { q: stationFilters.q } : {}),
        ...(stationFilters.status ? { status: stationFilters.status } : {}),
        ...(stationFilters.city ? { city: stationFilters.city } : {}),
        ...(stationFilters.state ? { state: stationFilters.state } : {}),
      });
      setStations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load stations', e);
      setStationError(e.message || 'Failed to load stations');
      setStations([]);
    } finally {
      setStationsLoading(false);
    }
  };

  const handleUpdateStationStatus = async (id, nextStatus) => {
    try {
      await api.adminUpdateStationStatus(id, nextStatus);
      await loadStations();
    } catch (e) {
      alert(e.message || 'Failed to update status');
    }
  };

  // Reload stations when filters change (debounced)
  useEffect(() => {
    if (activeSection !== 'stations') return;
    const t = setTimeout(() => { loadStations(); }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationFilters]);

  const handleVehicleInputChange = (field) => (event) => {
    const value = event.target.value;
    const updated = { ...vehicleForm };

    // Handle nested fields
    if (field.startsWith('chargingAC.')) {
      const subField = field.split('.')[1];
      updated.chargingAC = { ...updated.chargingAC, [subField]: value };
    } else if (field.startsWith('chargingDC.')) {
      const subField = field.split('.')[1];
      updated.chargingDC = { ...updated.chargingDC, [subField]: value };
    } else if (field.startsWith('specifications.')) {
      const subField = field.split('.')[1];
      updated.specifications = { ...updated.specifications, [subField]: value };
    } else {
      updated[field] = value;
    }

    setVehicleForm(updated);

    // Live validation per field
    setVehicleErrors((prev) => {
      const next = { ...prev };

      if (field === 'make') {
        if (!updated.make.trim()) next.make = 'Make is required';
        else next.make = '';
      }
      if (field === 'model') {
        if (!updated.model.trim()) next.model = 'Model is required';
        else if (updated.model.length > 50) next.model = 'Model must be 50 characters or less';
        else next.model = '';
      }
      if (field === 'vehicleType') {
        if (!updated.vehicleType) next.vehicleType = 'Vehicle type is required';
        else next.vehicleType = '';
      }
      if (field === 'batteryCapacity') {
        const batteryNum = Number(updated.batteryCapacity);
        if (updated.batteryCapacity === '') next.batteryCapacity = 'Battery capacity is required';
        else if (isNaN(batteryNum) || batteryNum < 1 || batteryNum > 500) next.batteryCapacity = 'Battery capacity must be between 1-500 kWh';
        else next.batteryCapacity = '';
      }
      if (field === 'chargingAC.maxPower') {
        const powerNum = Number(updated.chargingAC.maxPower);
        if (updated.chargingAC.supported && updated.chargingAC.maxPower !== '' && (isNaN(powerNum) || powerNum < 2 || powerNum > 50)) {
          next.acMaxPower = 'AC max power must be between 2-50 kW';
        } else {
          next.acMaxPower = '';
        }
      }
      if (field === 'chargingDC.maxPower') {
        const powerNum = Number(updated.chargingDC.maxPower);
        if (updated.chargingDC.supported && updated.chargingDC.maxPower !== '' && (isNaN(powerNum) || powerNum < 2 || powerNum > 100)) {
          next.dcMaxPower = 'DC max power must be between 2-100 kW';
        } else {
          next.dcMaxPower = '';
        }
      }
      if (field === 'specifications.year') {
        const yearNum = Number(updated.specifications.year);
        if (updated.specifications.year !== '' && (isNaN(yearNum) || yearNum < 2015 || yearNum > 2025)) {
          next.year = 'Year must be between 2015-2025';
        } else {
          next.year = '';
        }
      }
      if (field === 'specifications.range') {
        const rangeNum = Number(updated.specifications.range);
        if (updated.specifications.range !== '' && (isNaN(rangeNum) || rangeNum < 20 || rangeNum > 2000)) {
          next.range = 'Range must be between 20-2000 km';
        } else {
          next.range = '';
        }
      }

      return next;
    });
  };

  const handleConnectorTypeChange = (chargingType, newValue) => {
    const updated = { ...vehicleForm };
    if (chargingType === 'AC') {
      updated.chargingAC = { ...updated.chargingAC, connectorTypes: newValue };
    } else if (chargingType === 'DC') {
      updated.chargingDC = { ...updated.chargingDC, connectorTypes: newValue };
    }
    setVehicleForm(updated);
  };

  useEffect(() => {
    const loadModels = async () => {
      if (!vehicleForm.make?.trim()) {
        setMakeModels([]);
        return;
      }
      try {
        const models = await api.getModelsByMakeApi(vehicleForm.make.trim());
        setMakeModels(models);
      } catch (e) {
        console.error('Failed to load models for make', e);
        setMakeModels([]);
      }
    };
    loadModels();
  }, [vehicleForm.make]);

  useEffect(() => {
    const loadCapacities = async () => {
      if (!vehicleForm.make?.trim() || !vehicleForm.model?.trim()) {
        setBlockedCapacities([]);
        return;
      }
      try {
        const caps = await api.getCapacitiesByMakeModelApi(vehicleForm.make.trim(), vehicleForm.model.trim());
        setBlockedCapacities((caps || []).map((c) => Number(c)).filter((n) => !Number.isNaN(n)));
      } catch (e) {
        console.error('Failed to load capacities', e);
        setBlockedCapacities([]);
      }
    };
    loadCapacities();
  }, [vehicleForm.make, vehicleForm.model]);

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      setVehicleLoading(true);
      setVehicleErrors({});
      // Client-side validation
      const errs = {};
      const isEmpty = (v) => v === undefined || v === null || String(v).trim() === '';
      const toNumber = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
      const inRange = (num, min, max) => typeof num === 'number' && !Number.isNaN(num) && num >= min && num <= max;

      if (isEmpty(vehicleForm.make)) errs.make = 'Make is required';
      if (isEmpty(vehicleForm.model)) errs.model = 'Model is required';
      if (isEmpty(vehicleForm.vehicleType)) errs.vehicleType = 'Vehicle type is required';
      const batteryNum = toNumber(vehicleForm.batteryCapacity);
      if (batteryNum === undefined) errs.batteryCapacity = 'Battery capacity is required';
      else if (!inRange(batteryNum, 1, 500)) errs.batteryCapacity = 'Battery capacity must be between 1-500 kWh';

      // At least one of AC/DC supported
      const acSupported = !!vehicleForm.chargingAC?.supported;
      const dcSupported = !!vehicleForm.chargingDC?.supported;
      if (!acSupported && !dcSupported) errs.charging = 'Enable AC or DC charging';

      // If supported, validate power when provided
      const acPower = toNumber(vehicleForm.chargingAC?.maxPower);
      if (acSupported && (acPower === undefined || isNaN(acPower))) errs.acMaxPower = 'AC max power is required when AC charging is supported';
      else if (acSupported && !inRange(acPower, 2, 50)) errs.acMaxPower = 'AC max power must be between 2-50 kW';
      
      const dcPower = toNumber(vehicleForm.chargingDC?.maxPower);
      if (dcSupported && (dcPower === undefined || isNaN(dcPower))) errs.dcMaxPower = 'DC max power is required when DC charging is supported';
      else if (dcSupported && !inRange(dcPower, 2, 100)) errs.dcMaxPower = 'DC max power must be between 2-100 kW';

      // Optional specs
      const yearNum = toNumber(vehicleForm.specifications?.year);
      if (yearNum !== undefined && !inRange(yearNum, 2015, 2025)) errs.year = 'Year 2015–2025';
      const rangeNum = toNumber(vehicleForm.specifications?.range);
      if (rangeNum !== undefined && !inRange(rangeNum, 20, 2000)) errs.range = 'Range 20–2000 km';

      if (Object.keys(errs).length > 0) {
        setVehicleErrors(errs);
        setVehicleLoading(false);
        return;
      }
      // Build sanitized payload
      const acSupportedFinal = acSupported;
      const dcSupportedFinal = dcSupported;

      const payload = {
        make: vehicleForm.make?.trim(),
        model: vehicleForm.model?.trim(),
        vehicleType: vehicleForm.vehicleType,
        batteryCapacity: toNumber(vehicleForm.batteryCapacity),
        chargingAC: {
          supported: acSupportedFinal,
          ...(acSupportedFinal && acPower !== undefined && !isNaN(acPower) ? { maxPower: acPower } : {}),
          ...(acSupportedFinal && Array.isArray(vehicleForm.chargingAC?.connectorTypes) ? { connectorTypes: vehicleForm.chargingAC.connectorTypes } : {})
        },
        chargingDC: {
          supported: dcSupportedFinal,
          ...(dcSupportedFinal && dcPower !== undefined && !isNaN(dcPower) ? { maxPower: dcPower } : {}),
          ...(dcSupportedFinal && Array.isArray(vehicleForm.chargingDC?.connectorTypes) ? { connectorTypes: vehicleForm.chargingDC.connectorTypes } : {})
        },
        specifications: {
          ...(toNumber(vehicleForm.specifications?.year) ? { year: toNumber(vehicleForm.specifications?.year) } : {}),
          ...(toNumber(vehicleForm.specifications?.range) ? { range: toNumber(vehicleForm.specifications?.range) } : {}),
          ...(toNumber(vehicleForm.specifications?.weight) ? { weight: toNumber(vehicleForm.specifications?.weight) } : {})
        }
      };

      const data = editingVehicle
        ? await api.updateVehicleApi(editingVehicle._id, payload)
        : await api.createVehicleApi(payload);
      if (data.success) {
        await loadVehicles().then(setVehicles);
        setVehicleDialogOpen(false);
        setEditingVehicle(null);
        setVehicleErrors({});
        setVehicleForm({
          make: '',
          model: '',
          vehicleType: 'car',
          batteryCapacity: '',
          chargingAC: { supported: true, maxPower: '', connectorTypes: [] },
          chargingDC: { supported: true, maxPower: '', connectorTypes: [] },
          specifications: { year: '', range: '', weight: '' }
        });
        
        // If this vehicle was created from a request, update the request status to 'added'
        if (currentVehicleRequest) {
          try {
            // Import the API function
            const { updateVehicleRequestStatusApi } = await import('../utils/api');
            await updateVehicleRequestStatusApi(currentVehicleRequest._id, { status: 'added' });
            
            // Reload requests
            const requests = await loadVehicleRequests();
            setVehicleRequests(requests);
            
            // Update pending count
            const pendingCount = requests.filter(r => r.status === 'pending').length;
            setPendingRequestsCount(pendingCount);
            
            // Clear the current vehicle request
            setCurrentVehicleRequest(null);
          } catch (err) {
            console.error('Failed to update vehicle request status', err);
          }
        }
        
        setVehicleActionSuccess('Vehicle saved successfully');
        setTimeout(() => setVehicleActionSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      
      // Handle validation errors specifically
      if (error.message && error.message.includes('Validation error')) {
        // Extract validation error messages
        const validationErrors = error.message.replace('Validation error: ', '').split(', ');
        setVehicleActionError(`Validation failed: ${validationErrors.join(', ')}`);
      } else {
        setVehicleActionError(error.message || 'Failed to save vehicle');
      }
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      make: vehicle.make || '',
      model: vehicle.model || '',
      vehicleType: vehicle.vehicleType || 'car',
      batteryCapacity: vehicle.batteryCapacity || '',
      chargingAC: {
        supported: vehicle.chargingAC?.supported !== undefined ? vehicle.chargingAC.supported : true,
        maxPower: vehicle.chargingAC?.maxPower || '',
        connectorTypes: Array.isArray(vehicle.chargingAC?.connectorTypes) ? vehicle.chargingAC.connectorTypes : []
      },
      chargingDC: {
        supported: vehicle.chargingDC?.supported !== undefined ? vehicle.chargingDC.supported : true,
        maxPower: vehicle.chargingDC?.maxPower || '',
        connectorTypes: Array.isArray(vehicle.chargingDC?.connectorTypes) ? vehicle.chargingDC.connectorTypes : []
      },
      specifications: {
        year: vehicle.specifications?.year || '',
        range: vehicle.specifications?.range || '',
        weight: vehicle.specifications?.weight || ''
      }
    });
    setVehicleErrors({}); // Clear errors when editing
    setVehicleDialogOpen(true);
  };

  const handleHardDeleteVehicle = async () => {
    if (!deleteTargetVehicle) return;
    try {
      setVehicleActionError('');
      const data = await api.deleteVehicleApi(deleteTargetVehicle._id, true);
      if (data.success) {
        setVehicleActionSuccess('Vehicle permanently deleted');
        await loadVehicles().then(setVehicles);
        setTimeout(() => setVehicleActionSuccess(''), 2000);
      } else {
        setVehicleActionError(data.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      // Check if the error is due to vehicle being assigned to users
      if (error.message && error.message.includes('assigned to one or more users')) {
        setVehicleActionError('Cannot delete vehicle because it is assigned to one or more users');
      } else {
        setVehicleActionError(error.message || 'Network error while deleting');
      }
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTargetVehicle(null);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Auto-refresh live stats every 15s
    const t = setInterval(() => {
      loadLiveStats();
    }, 15000);
    return () => clearInterval(t);
  }, [loadLiveStats]);

  useEffect(() => {
    console.log('AdminDashboard state changed:', { 
      activeSection,
      corporateAdmins: corporateAdmins?.length || 0
    });
  }, [activeSection, corporateAdmins]);

  // Load stations when switching to Station Management
  useEffect(() => {
    if (activeSection === 'stations') {
      loadStations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);
  
  // Load vehicle requests and update pending count when switching to Vehicle Management and requests tab is active
  useEffect(() => {
    if (activeSection === 'vehicles' && activeVehicleTab === 'requests') {
      (async () => {
        const requests = await loadVehicleRequests();
        // Filter out requests with "added" status
        const filteredRequests = requests.filter(r => r.status !== 'added');
        setVehicleRequests(filteredRequests);
        
        // Update pending count (only pending requests)
        const pendingCount = filteredRequests.filter(r => r.status === 'pending').length;
        setPendingRequestsCount(pendingCount);
      })();
    }
    // Also update pending count when vehicles section becomes active
    if (activeSection === 'vehicles' && activeVehicleTab === 'vehicles') {
      (async () => {
        const requests = await loadVehicleRequests();
        // Filter out requests with "added" status
        const filteredRequests = requests.filter(r => r.status !== 'added');
        const pendingCount = filteredRequests.filter(r => r.status === 'pending').length;
        setPendingRequestsCount(pendingCount);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, activeVehicleTab]);

  const navigationItems = [
    { id: 'dashboard', label: 'Main Dashboard', icon: <HomeIcon />, active: true },
    { id: 'users', label: 'User Management', icon: <PeopleIcon /> },
    { id: 'corporate-admins', label: 'Corporate Admin Management', icon: <BusinessIcon /> },
    { id: 'stations', label: 'Station Management', icon: <StorageIcon /> },
    { id: 'vehicles', label: 'Vehicle Management', icon: <ShoppingCartIcon /> },
    { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    { id: 'ai-models', label: 'AI Models', icon: <PsychologyIcon /> },
    { id: 'system', label: 'System Health', icon: <MonitorIcon /> },
    { id: 'security', label: 'Security', icon: <SecurityIcon /> },
    { id: 'integrations', label: 'Integrations', icon: <BuildIcon /> },
    { id: 'policies', label: 'Policies', icon: <AssignmentIcon /> },
    { id: 'reports', label: 'Reports', icon: <BarChartIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Paper sx={{ p: 3, maxWidth: 400 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Error</Typography>
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
          <Button variant="contained" onClick={() => navigate('/login')}>Go to Login</Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Left Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerOpen ? 80 : 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? 80 : 280,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            overflowX: 'hidden'
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: drawerOpen ? 'center' : 'space-between', gap: 1 }}>
          {!drawerOpen && (
            <img src={nexchargeLogo} alt="NexCharge" style={{ height: '40px', width: 'auto' }} />
          )}
          {!drawerOpen && (
            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 'bold' }}>Platform Admin</Typography>
          )}
          <IconButton size="small" onClick={() => setDrawerOpen(!drawerOpen)} sx={{ ml: drawerOpen ? 0 : 'auto' }}>
            <MenuIcon />
          </IconButton>
        </Box>
        
        <List sx={{ px: drawerOpen ? 1 : 2, py: 1 }}>
          {navigationItems.map((item) => (
            <ListItem
              key={item.id}
              button
              onClick={() => setActiveSection(item.id)}
              sx={{
                mb: 1,
                borderRadius: 2,
                bgcolor: activeSection === item.id ? '#f1f5f9' : 'transparent',
                color: activeSection === item.id ? '#1e293b' : '#64748b',
                '&:hover': {
                  bgcolor: activeSection === item.id ? '#f1f5f9' : '#f8fafc',
                },
                justifyContent: drawerOpen ? 'center' : 'flex-start'
              }}
            >
              <ListItemIcon sx={{ 
                color: activeSection === item.id ? '#1e293b' : '#64748b',
                minWidth: drawerOpen ? 0 : 40,
                mr: drawerOpen ? 0 : 1,
                display: 'flex',
                justifyContent: 'center'
              }}>
                {item.icon}
              </ListItemIcon>
              {!drawerOpen && (
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontWeight: activeSection === item.id ? 600 : 400 
                  }} 
                />
              )}
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <Box sx={{ 
          bgcolor: '#ffffff', 
          borderBottom: '1px solid #e2e8f0',
          px: 4,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
              {navigationItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {{
                dashboard: 'Overview and KPIs',
                users: 'Manage platform users and their roles',
                'corporate-admins': 'View and manage corporate administrators',
                
                stations: 'Manage charging stations and operational status',
                vehicles: 'Manage vehicle catalog and user requests',
                analytics: 'Platform analytics and insights',
                'ai-models': 'Manage AI models and configurations',
                system: 'System health and uptime metrics',
                security: 'Security and access controls',
                integrations: 'Third-party integrations and settings',
                policies: 'Policy management and permissions',
                reports: 'Operational and financial reports'
              }[activeSection] || ' '
              }
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationDropdown />
            <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)}>
              <Avatar 
                src={user?.profileImage || undefined}
                sx={{ 
                  bgcolor: user?.profileImage ? 'transparent' : 'primary.main', 
                  width: 40, 
                  height: 40 
                }}
              >
                {!user?.profileImage && `${user?.personalInfo?.firstName?.[0] || ''}${user?.personalInfo?.lastName?.[0] || ''}`}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
            >
              <MenuItem onClick={() => { setActiveSection('settings'); setUserMenuAnchor(null); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
              Settings
              </MenuItem>
              <MenuItem onClick={() => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); navigate('/login'); }}>
                <ListItemIcon>
                  <LockIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Dashboard Content */}
        <Box sx={{ flexGrow: 1, p: 4 }}>
          <Container maxWidth="xl" disableGutters>
            {/* Conditional Content Based on Active Section */}
            {activeSection === 'dashboard' && (
              <>
                {/* KPI Cards Row */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <Box onClick={() => setActiveSection('analytics')} sx={{ cursor: 'pointer' }}>
                      <StatCard
                        title="Total Users"
                        value={overview?.totalUsers || 0}
                        change={12}
                        icon={<PeopleIcon />}
                        color="primary"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <Box onClick={() => setActiveSection('analytics')} sx={{ cursor: 'pointer' }}>
                      <StatCard
                        title="Active Stations"
                        value={(stats?.activeStations ?? 0).toLocaleString()}
                        change={8}
                        icon={<StorageIcon />}
                        color="primary"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <Box onClick={() => setActiveSection('analytics')} sx={{ cursor: 'pointer' }}>
                      <StatCard
                        title="Total Revenue"
                        value={`₹${Number(stats?.totalRevenue || 0).toLocaleString()}`}
                        change={23}
                        icon={<BarChartIcon />}
                        color="success"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <Box onClick={() => setActiveSection('analytics')} sx={{ cursor: 'pointer' }}>
                      <StatCard
                        title="Charging Sessions (Live)"
                        value={(stats?.liveChargingSessions ?? 0).toLocaleString()}
                        change={15}
                        icon={<MonitorIcon />}
                        color="info"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <Box onClick={() => setActiveSection('analytics')} sx={{ cursor: 'pointer' }}>
                      <StatCard
                        title="System Uptime"
                        value="99.9%"
                        status="Healthy"
                        icon={<CheckCircleIcon />}
                        color="success"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <StatCard
                      title="AI Models"
                      value={overview?.aiModels || 0}
                      change={5}
                      icon={<PsychologyIcon />}
                      color="warning"
                    />
                  </Grid>
                </Grid>

                {/* Charts Row */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} lg={8}>
                    <Box onClick={() => setActiveSection('analytics')} sx={{ cursor: 'pointer' }}>
                      <ChartCard
                        title="This month"
                        value={`₹${Number(stats?.monthlyRevenue || 0).toLocaleString()}`}
                        subtitle="Total Revenue"
                        change="+2.45%"
                        status="On track"
                        actionIcon={<MoreVertIcon />}
                      >
                      <Box sx={{ height: 220, p: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Daily Revenue (Last 7 Days)
                        </Typography>
                        {stats?.dailyRevenueChart?.length > 1 ? (
                          (() => {
                            const data = stats.dailyRevenueChart;
                            const maxVal = Math.max(...data.map(d => d.dailyRevenue), 1);
                            const width = 600; // container will scale via viewBox
                            const height = 140;
                            const paddingX = 8;
                            const paddingY = 8;
                            const innerW = width - paddingX * 2;
                            const innerH = height - paddingY * 2;
                            const n = data.length;
                            const points = data.map((d, i) => {
                              const x = paddingX + (n === 1 ? innerW/2 : (i * innerW) / (n - 1));
                              const y = paddingY + innerH - (d.dailyRevenue / maxVal) * innerH;
                              return { x, y, v: d.dailyRevenue };
                            });
                            const areaPath = `M ${paddingX} ${height - paddingY} ` +
                              points.map((p, idx) => `${idx === 0 ? 'L' : 'L'} ${p.x} ${p.y}`).join(' ') +
                              ` L ${paddingX + innerW} ${height - paddingY} Z`;
                            const linePath = 'M ' + points.map((p, idx) => `${idx === 0 ? '' : 'L '}${p.x} ${p.y}`).join(' ');
                            return (
                              <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
                                  <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#1976d2" stopOpacity="0.35" />
                                      <stop offset="100%" stopColor="#1976d2" stopOpacity="0.05" />
                                    </linearGradient>
                                  </defs>
                                  <path d={areaPath} fill="url(#revGrad)" stroke="none" />
                                  <path d={linePath} fill="none" stroke="#1976d2" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                                  {points.map((p, i) => (
                                    <g key={i}>
                                      <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={4}
                                        fill="#1976d2"
                                        onMouseEnter={() => {
                                          try {
                                            const d = data[i]?._id;
                                            const dateStr = d ? new Date(d.year, (d.month || 1) - 1, d.day || 1).toLocaleDateString() : '';
                                            setRevTooltip({
                                              left: `${(p.x / width) * 100}%`,
                                              top: `${(p.y / height) * 100}%`,
                                              value: p.v,
                                              dateStr
                                            });
                                          } catch (_) {
                                            setRevTooltip({ left: `${(p.x / width) * 100}%`, top: `${(p.y / height) * 100}%`, value: p.v, dateStr: '' });
                                          }
                                        }}
                                        onMouseLeave={() => setRevTooltip(null)}
                                      />
                                    </g>
                                  ))}
                                </svg>
                                {revTooltip && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      left: revTooltip.left,
                                      top: revTooltip.top,
                                      transform: 'translate(-50%, -120%)',
                                      bgcolor: 'grey.900',
                                      color: 'common.white',
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                      boxShadow: 3,
                                      fontSize: 12,
                                      whiteSpace: 'nowrap',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <Box sx={{ fontWeight: 600 }}>{revTooltip.dateStr || '—'}</Box>
                                    <Box>₹{Number(revTooltip.value || 0).toLocaleString()}</Box>
                                  </Box>
                                )}
                              </Box>
                            );
                          })()
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ width: '100%', textAlign: 'center', py: 6 }}>
                            Not enough data to render chart
                          </Typography>
                        )}
                      </Box>
                    </ChartCard>
                    </Box>
                  </Grid>
                  <Grid item xs={12} lg={4}>
                    <Box onClick={() => setActiveSection('analytics')} sx={{ cursor: 'pointer' }}>
                      <ChartCard
                      title="Weekly Revenue"
                      value={`₹${Number(stats?.weeklyRevenue || 0).toLocaleString()}`}
                      subtitle="Current Week"
                      change="+5.2%"
                      actionIcon={<BarChartIcon />}
                    >
                      <Box sx={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                        <Box sx={{ 
                          width: 120, 
                          height: 120, 
                          borderRadius: '50%', 
                          background: `conic-gradient(#1976d2 0deg ${(stats?.weeklyRevenue || 0) / Math.max(stats?.monthlyRevenue || 1, 1) * 360}deg, #e3f2fd ${(stats?.weeklyRevenue || 0) / Math.max(stats?.monthlyRevenue || 1, 1) * 360}deg 360deg)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          mb: 2
                        }}>
                          <Box sx={{ 
                            width: 80, 
                            height: 80, 
                            borderRadius: '50%', 
                            bgcolor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {stats?.monthlyRevenue > 0 ? Math.round((stats?.weeklyRevenue || 0) / stats.monthlyRevenue * 100) : 0}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              of month
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          Weekly vs Monthly Revenue
                        </Typography>
                      </Box>
                    </ChartCard>
                    </Box>
                  </Grid>
                </Grid>

                {/* Bottom Row */}
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={6}>
                    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Recent Users
                          </Typography>
                          <IconButton size="small">
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>NAME</TableCell>
                                <TableCell>ROLE</TableCell>
                                <TableCell>STATUS</TableCell>
                                <TableCell>JOINED</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {users.slice(0, 5).map((u) => (
                                <TableRow key={u._id}>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Avatar 
                                        src={u.profileImage || undefined}
                                        sx={{ 
                                          width: 32, 
                                          height: 32, 
                                          bgcolor: u.profileImage ? 'transparent' : 'primary.main' 
                                        }}
                                      >
                                        {!u.profileImage && `${u.personalInfo?.firstName?.[0] || ''}${u.personalInfo?.lastName?.[0] || ''}`}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {u.personalInfo?.firstName} {u.personalInfo?.lastName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {u.personalInfo?.email}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={u.role} 
                                      size="small" 
                                      sx={{ 
                                        bgcolor: u.role === 'admin' ? 'error.main' : 'primary.main',
                                        color: 'white'
                                      }} 
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label="Active" 
                                      size="small" 
                                      sx={{ bgcolor: 'success.main', color: 'white' }} 
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(u.createdAt).toLocaleDateString()}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} lg={3}>
                    <ChartCard
                      title="Daily Traffic"
                      value="2.579"
                      subtitle="Active Users"
                      change="+2.45%"
                    >
                      <Box sx={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Traffic Chart
                        </Typography>
                      </Box>
                    </ChartCard>
                  </Grid>
                  
                  <Grid item xs={12} lg={3}>
                    <ChartCard
                      title="System Health"
                      value="98.5%"
                      subtitle="Overall Status"
                      status="Excellent"
                    >
                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">API Response</Typography>
                          <Typography variant="caption" color="success.main">99.2%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={99.2} sx={{ mb: 2 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Database</Typography>
                          <Typography variant="caption" color="success.main">98.7%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={98.7} sx={{ mb: 2 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">AI Models</Typography>
                          <Typography variant="caption" color="warning.main">95.1%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={95.1} color="warning" />
                      </Box>
                    </ChartCard>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Corporate Admin Management Section */}
            {activeSection === 'corporate-admins' && (
              <CorporateAdminManagementSection 
                admins={corporateAdmins}
                onRefresh={loadDashboard}
                onAddAdmin={() => setAddAdminDialogOpen(true)}
              />
            )}

            {/* User Management Section (merged view with Add Corporate Admin) */}
            {activeSection === 'users' && (
              <UserManagementSection 
                users={users} 
                onAddCorporateAdmin={() => setAddAdminDialogOpen(true)}
                onRefresh={loadDashboard}
              />
            )}

            {/* Analytics Section */}
            {activeSection === 'analytics' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      Business Analytics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Comprehensive insights into your platform performance
                    </Typography>
                  </Box>
                </Box>

                {/* Revenue Analytics */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} lg={8}>
                    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Revenue Trends
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', my: 1 }}>
                              ₹{Number(stats?.totalRevenue || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total Revenue (All Time)
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                                +12.5%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                vs last month
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Daily Revenue (Last 7 Days)
                        </Typography>
                        {stats?.dailyRevenueChart?.length > 1 ? (
                          (() => {
                            const data = stats.dailyRevenueChart;
                            const maxVal = Math.max(...data.map(d => d.dailyRevenue), 1);
                            const width = 600;
                            const height = 200;
                            const paddingX = 8;
                            const paddingY = 8;
                            const innerW = width - paddingX * 2;
                            const innerH = height - paddingY * 2;
                            const n = data.length;
                            const points = data.map((d, i) => {
                              const x = paddingX + (n === 1 ? innerW/2 : (i * innerW) / (n - 1));
                              const y = paddingY + innerH - (d.dailyRevenue / maxVal) * innerH;
                              return { x, y, v: d.dailyRevenue };
                            });
                            const areaPath = `M ${paddingX} ${height - paddingY} ` +
                              points.map((p, idx) => `${idx === 0 ? 'L' : 'L'} ${p.x} ${p.y}`).join(' ') +
                              ` L ${paddingX + innerW} ${height - paddingY} Z`;
                            const linePath = 'M ' + points.map((p, idx) => `${idx === 0 ? '' : 'L '}${p.x} ${p.y}`).join(' ');
                            return (
                              <Box sx={{ width: '100%', height: 200, position: 'relative' }}>
                                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
                                  <defs>
                                    <linearGradient id="revGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#1976d2" stopOpacity="0.35" />
                                      <stop offset="100%" stopColor="#1976d2" stopOpacity="0.05" />
                                    </linearGradient>
                                  </defs>
                                  <path d={areaPath} fill="url(#revGradAnalytics)" stroke="none" />
                                  <path d={linePath} fill="none" stroke="#1976d2" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                                  {points.map((p, i) => (
                                    <circle key={i} cx={p.x} cy={p.y} r="5" fill="#1976d2" />
                                  ))}
                                </svg>
                              </Box>
                            );
                          })()
                        ) : (
                          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Not enough data to render chart
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={4}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                              Monthly Revenue
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                              ₹{Number(stats?.monthlyRevenue || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              This Month
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                                +8.2%
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12}>
                        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                              Weekly Revenue
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                              ₹{Number(stats?.weeklyRevenue || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              This Week
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                                +5.2%
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Key Metrics */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Active Stations
                          </Typography>
                          <StorageIcon sx={{ color: 'primary.main' }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                          {(stats?.activeStations ?? 0).toLocaleString()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                            +8 stations
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Total Users
                          </Typography>
                          <PeopleIcon sx={{ color: 'info.main' }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                          {users.length}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                            +12 users
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Live Sessions
                          </Typography>
                          <MonitorIcon sx={{ color: 'warning.main' }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                          {(stats?.liveChargingSessions ?? 0).toLocaleString()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                            +15 sessions
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Total Payments
                          </Typography>
                          <BarChartIcon sx={{ color: 'success.main' }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                          {(stats?.totalPayments ?? 0).toLocaleString()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                            +23 payments
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* User Analytics */}
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={6}>
                    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                          User Role Distribution
                        </Typography>
                        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {(() => {
                            const roleStats = users.reduce((acc, user) => {
                              acc[user.role] = (acc[user.role] || 0) + 1;
                              return acc;
                            }, {});
                            const roles = Object.keys(roleStats);
                            const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#7b1fa2'];
                            
                            return (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                                {roles.map((role, index) => (
                                  <Box key={role} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ 
                                      width: 16, 
                                      height: 16, 
                                      borderRadius: '50%', 
                                      bgcolor: colors[index % colors.length] 
                                    }} />
                                    <Typography variant="body2" sx={{ minWidth: 120 }}>
                                      {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Typography>
                                    <Box sx={{ 
                                      flexGrow: 1, 
                                      height: 8, 
                                      bgcolor: 'grey.200', 
                                      borderRadius: 1,
                                      overflow: 'hidden'
                                    }}>
                                      <Box sx={{ 
                                        width: `${(roleStats[role] / users.length) * 100}%`, 
                                        height: '100%', 
                                        bgcolor: colors[index % colors.length] 
                                      }} />
                                    </Box>
                                    <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                                      {roleStats[role]}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            );
                          })()}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={6}>
                    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                          Recent Activity
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <CheckCircleIcon sx={{ color: 'success.main' }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                New user registration
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                2 minutes ago
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <BarChartIcon sx={{ color: 'primary.main' }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Payment completed
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                5 minutes ago
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <StorageIcon sx={{ color: 'info.main' }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                New station activated
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                1 hour ago
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <Card sx={{ maxWidth: 520, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={user?.profileImage || undefined}
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
                    {(user?.personalInfo?.firstName || user?.firstName || '') + ' ' + (user?.personalInfo?.lastName || user?.lastName || '')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {user?.personalInfo?.email || user?.email || ''}
                  </Typography>
                  <Chip
                    label={user?.role || user?.personalInfo?.role || 'ev_user'}
                    variant="outlined"
                    color="primary"
                  />

                </CardContent>
              </Card>
            )}

            {/* Station Management Section */}
            {activeSection === 'stations' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Station Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage charging stations and operational status
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      placeholder="Search..."
                      value={stationFilters.q}
                      onChange={(e) => setStationFilters({ ...stationFilters, q: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ width: 260 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        value={stationFilters.status}
                        onChange={(e) => setStationFilters({ ...stationFilters, status: e.target.value })}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      label="City"
                      value={stationFilters.city}
                      onChange={(e) => setStationFilters({ ...stationFilters, city: e.target.value })}
                    />
                    <TextField
                      size="small"
                      label="State"
                      value={stationFilters.state}
                      onChange={(e) => setStationFilters({ ...stationFilters, state: e.target.value })}
                    />
                    <Button variant="outlined" onClick={() => loadStations()} startIcon={<RefreshIcon />}>Refresh</Button>
                  </Box>
                </Box>

                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    {stationError && (
                      <Alert severity="error" sx={{ mb: 2 }}>{stationError}</Alert>
                    )}
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Corporate</TableCell>
                            <TableCell>Franchise</TableCell>
                            <TableCell>Station</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Types</TableCell>
                            <TableCell align="right">Chargers</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stationsLoading ? (
                            <TableRow>
                              <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                <CircularProgress />
                              </TableCell>
                            </TableRow>
                          ) : stations.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">No stations found</Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            stations.map((s) => (
                              <TableRow key={s.id} hover>
                                <TableCell>{s.corporate?.name || '-'}</TableCell>
                                <TableCell>{s.franchise?.name || '-'}</TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{s.code}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{s.location?.city || '-'}, {s.location?.state || '-'}</Typography>
                                  <Typography variant="caption" color="text.secondary">{s.location?.pincode || ''}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {(s.capacity?.chargerTypes || []).map((t) => (
                                      <Chip key={t} label={t} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </TableCell>
                                <TableCell align="right">{s.capacity?.totalChargers ?? 0}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={s.status}
                                    size="small"
                                    color={s.status === 'active' ? 'success' : s.status === 'maintenance' ? 'warning' : 'default'}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel id={`status-label-${s.id}`}>Set Status</InputLabel>
                                    <Select
                                      labelId={`status-label-${s.id}`}
                                      label="Set Status"
                                      value={s.status || ''}
                                      onChange={(e) => handleUpdateStationStatus(s.id, e.target.value)}
                                    >
                                      <MenuItem value={''} disabled>Select status</MenuItem>
                                      <MenuItem value="active">Active</MenuItem>
                                      <MenuItem value="maintenance">Maintenance</MenuItem>
                                      <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                  </FormControl>
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
            )}

            {/* Vehicle Management Section */}
            {activeSection === 'vehicles' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Vehicle Management
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<ShoppingCartIcon />}
                    onClick={() => {
                      setEditingVehicle(null);
                      setVehicleForm({
                        make: '',
                        model: '',
                        vehicleType: 'car',
                        batteryCapacity: '',
                        chargingAC: { supported: true, maxPower: '', connectorTypes: [] },
                        chargingDC: { supported: true, maxPower: '', connectorTypes: [] },
                        specifications: { year: '', range: '', weight: '' }
                      });
                      setVehicleErrors({});
                      setVehicleDialogOpen(true);
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                      }
                    }}
                  >
                    Add Vehicle
                  </Button>
                </Box>
                
                {/* Tabs for Vehicles and Requests */}
                <Box sx={{ mb: 3 }}>
                  <Button 
                    variant={activeVehicleTab === 'vehicles' ? 'contained' : 'outlined'}
                    onClick={() => setActiveVehicleTab('vehicles')}
                    sx={{ mr: 1 }}
                  >
                    Vehicle Catalog
                  </Button>
                  <Button 
                    variant={activeVehicleTab === 'requests' ? 'contained' : 'outlined'}
                    onClick={() => setActiveVehicleTab('requests')}
                  >
                    Vehicle Requests ({pendingRequestsCount})
                  </Button>
                </Box>

                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    {activeVehicleTab === 'vehicles' ? (
                      // Vehicle Catalog Tab
                      <>
                        {vehicleActionSuccess && (
                          <Alert severity="success" sx={{ mb: 2 }}>
                            {vehicleActionSuccess}
                          </Alert>
                        )}
                        {vehicleActionError && (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {vehicleActionError}
                          </Alert>
                        )}
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Make & Model</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Battery (kWh)</TableCell>
                                <TableCell>AC Charging</TableCell>
                                <TableCell>DC Charging</TableCell>
                                <TableCell>Year</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {vehicleLoading ? (
                                <TableRow>
                                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                    <CircularProgress />
                                  </TableCell>
                                </TableRow>
                              ) : vehicles.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      No vehicles found
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                vehicles.map((vehicle) => (
                                  <TableRow key={vehicle._id}>
                                    <TableCell>
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {vehicle.make} {vehicle.model}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          ID: {vehicle._id.substring(0, 8)}...
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={vehicle.vehicleType} 
                                        size="small" 
                                        sx={{ textTransform: 'capitalize' }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {vehicle.batteryCapacity} kWh
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip 
                                          label={vehicle.chargingAC?.supported ? 'Yes' : 'No'} 
                                          size="small" 
                                          color={vehicle.chargingAC?.supported ? 'success' : 'default'}
                                        />
                                        {vehicle.chargingAC?.maxPower && (
                                          <Typography variant="caption">
                                            {vehicle.chargingAC.maxPower} kW
                                          </Typography>
                                        )}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip 
                                          label={vehicle.chargingDC?.supported ? 'Yes' : 'No'} 
                                          size="small" 
                                          color={vehicle.chargingDC?.supported ? 'success' : 'default'}
                                        />
                                        {vehicle.chargingDC?.maxPower && (
                                          <Typography variant="caption">
                                            {vehicle.chargingDC.maxPower} kW
                                          </Typography>
                                        )}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {vehicle.specifications?.year || 'N/A'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Inactive</Typography>
                                        <Switch
                                          size="small"
                                          checked={!!vehicle.isActive}
                                          onChange={async (e) => {
                                            try {
                                              await api.updateVehicleApi(vehicle._id, { isActive: e.target.checked });
                                              await loadVehicles().then(setVehicles);
                                            } catch (err) {
                                              console.error('Status toggle failed', err);
                                              // Check if the error is due to vehicle being assigned to users
                                              if (err.message && err.message.includes('assigned to one or more users')) {
                                                setVehicleActionError('Cannot deactivate vehicle because it is assigned to one or more users');
                                              } else {
                                                setVehicleActionError(err.message || 'Failed to update status');
                                              }
                                            }
                                          }}
                                          inputProps={{ 'aria-label': 'vehicle active toggle' }}
                                        />
                                        <Typography variant="caption" color="text.secondary">Active</Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton 
                                          size="small" 
                                          onClick={() => handleEditVehicle(vehicle)}
                                          sx={{ color: 'primary.main' }}
                                          title="Edit Vehicle"
                                        >
                                          <SettingsIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton 
                                          size="small" 
                                          onClick={() => { setDeleteTargetVehicle(vehicle); setDeleteDialogOpen(true); }}
                                          sx={{ color: 'error.main' }}
                                          title="Delete Vehicle"
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    ) : (
                      // Vehicle Requests Tab
                      <>
                        {vehicleRequestActionSuccess && (
                          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setVehicleRequestActionSuccess('')}>
                            {vehicleRequestActionSuccess}
                          </Alert>
                        )}
                        {vehicleRequestActionError && (
                          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setVehicleRequestActionError('')}>
                            {vehicleRequestActionError}
                          </Alert>
                        )}
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell>Vehicle</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Requested At</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {vehicleRequestsLoading ? (
                                <TableRow>
                                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                    <CircularProgress />
                                  </TableCell>
                                </TableRow>
                              ) : vehicleRequests.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      No vehicle requests found
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                vehicleRequests.map((request) => (
                                  <TableRow key={request._id}>
                                    <TableCell>
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {request.userId?.personalInfo?.firstName} {request.userId?.personalInfo?.lastName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {request.userEmail}
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {request.make} {request.model}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={request.status} 
                                        size="small" 
                                        color={
                                          request.status === 'approved' ? 'success' : 
                                          request.status === 'rejected' ? 'error' : 
                                          request.status === 'added' ? 'primary' : 'default'
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {new Date(request.createdAt).toLocaleDateString()}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button 
                                          size="small" 
                                          variant="outlined" 
                                          color="success"
                                          onClick={() => {
                                            // Store the current vehicle request
                                            setCurrentVehicleRequest(request);
                                            
                                            // Pre-fill the vehicle form with the request details
                                            setVehicleForm({
                                              make: request.make || '',
                                              model: request.model || '',
                                              vehicleType: 'car',
                                              batteryCapacity: '',
                                              chargingAC: { supported: true, maxPower: '', connectorTypes: [] },
                                              chargingDC: { supported: true, maxPower: '', connectorTypes: [] },
                                              specifications: { year: '', range: '', weight: '' }
                                            });
                                            
                                            // Clear any existing errors
                                            setVehicleErrors({});
                                            
                                            // Set editing vehicle to null (add mode)
                                            setEditingVehicle(null);
                                            
                                            // Close the vehicle requests tab and switch to the vehicle form
                                            setActiveVehicleTab('vehicles');
                                            
                                            // Open the vehicle dialog
                                            setVehicleDialogOpen(true);
                                          }}
                                        >
                                          Add
                                        </Button>
                                        <Button 
                                          size="small" 
                                          color="error"
                                          onClick={async () => {
                                            try {
                                              // Import the API function
                                              const { deleteVehicleRequestApi } = await import('../utils/api');
                                              await deleteVehicleRequestApi(request._id);
                                              
                                              // Reload requests
                                              const requests = await loadVehicleRequests();
                                              setVehicleRequests(requests);
                                              
                                              // Update pending count
                                              const pendingCount = requests.filter(r => r.status === 'pending').length;
                                              setPendingRequestsCount(pendingCount);
                                              
                                              setVehicleRequestActionSuccess('Vehicle request deleted successfully');
                                            } catch (err) {
                                              console.error('Failed to delete request', err);
                                              setVehicleRequestActionError(err.message || 'Failed to delete request');
                                            }
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}



            {/* Settings Section */}
            {activeSection === 'settings' && (
              <Box sx={{ maxWidth: 520 }}>
                <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Change Password
                    </Typography>
                    {passwordError && (
                      <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>
                    )}
                    {passwordSuccess && (
                      <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>
                    )}
                    <Box component="form" onSubmit={async (e) => {
                      e.preventDefault();
                      setPasswordError('');
                      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                        setPasswordError('New passwords do not match');
                        return;
                      }
                      setPasswordLoading(true);
                      try {
                        await api.updatePasswordApi({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
                        setPasswordSuccess('Password updated successfully');
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setTimeout(() => setPasswordSuccess(''), 3000);
                      } catch (err) {
                        setPasswordError(err.message || 'Failed to update password');
                      } finally {
                        setPasswordLoading(false);
                      }
                    }}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        margin="normal"
                        required
                      />
                      <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        margin="normal"
                        required
                      />
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        margin="normal"
                        required
                      />
                      <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={passwordLoading}>
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Other sections can be added here */}
            {activeSection !== 'dashboard' && activeSection !== 'users' && activeSection !== 'corporate-admins' && activeSection !== 'add-corporate-admin' && activeSection !== 'vehicles' && activeSection !== 'settings' && activeSection !== 'analytics' && activeSection !== 'stations' && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" color="text.secondary">
                  {navigationItems.find(item => item.id === activeSection)?.label} - Coming Soon
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  This section is under development
                </Typography>
              </Box>
            )}
          </Container>
        </Box>
      </Box>

      {/* Vehicle Form Dialog */}
      <Dialog
        open={vehicleDialogOpen}
        onClose={() => {
          setVehicleDialogOpen(false);
          setEditingVehicle(null);
          setVehicleErrors({});
          setVehicleForm({
            make: '',
            model: '',
            vehicleType: 'car',
            batteryCapacity: '',
            chargingAC: { supported: true, maxPower: '', connectorTypes: [] },
            chargingDC: { supported: true, maxPower: '', connectorTypes: [] },
            specifications: { year: '', range: '', weight: '' }
          });
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ flexShrink: 0 }}>
          {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        </DialogTitle>
        <DialogContent sx={{ flex: 1, overflowY: 'auto', minHeight: 0, px: { xs: 2, sm: 3 }, py: 1 }}>
          <Box id="vehicle-form" component="form" onSubmit={handleVehicleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  options={vehicleMakes}
                  value={vehicleForm.make}
                  onChange={(event, newValue) => {
                    const updated = { ...vehicleForm, make: newValue || '', model: '' };
                    setVehicleForm(updated);
                    setVehicleErrors((prev) => ({ ...prev, make: !newValue?.trim() ? 'Make is required' : '' }));
                  }}
                  onInputChange={(event, newInputValue) => {
                    if (event && event.type === 'change') {
                      const updated = { ...vehicleForm, make: newInputValue, model: '' };
                      setVehicleForm(updated);
                      setVehicleErrors((prev) => ({ ...prev, make: !newInputValue.trim() ? 'Make is required' : '' }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Make"
                      placeholder="Search for a make (e.g., Tesla)"
                      required
                      error={Boolean(vehicleErrors.make)}
                      helperText={vehicleErrors.make}
                    />
                  )}
                  freeSolo
                  clearOnEscape
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  options={makeModels}
                  value={vehicleForm.model}
                  onChange={(event, newValue) => {
                    const updated = { ...vehicleForm, model: newValue || '' };
                    setVehicleForm(updated);
                    setVehicleErrors((prev) => ({ ...prev, model: !newValue?.trim() ? 'Model is required' : '' }));
                  }}
                  onInputChange={(event, newInputValue) => {
                    if (event && event.type === 'change') {
                      const updated = { ...vehicleForm, model: newInputValue };
                      setVehicleForm(updated);
                      setVehicleErrors((prev) => ({ ...prev, model: !newInputValue.trim() ? 'Model is required' : '' }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Model"
                      required
                      error={Boolean(vehicleErrors.model)}
                      helperText={vehicleErrors.model}
                    />
                  )}
                  freeSolo
                  clearOnEscape
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(vehicleErrors.vehicleType)}>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={vehicleForm.vehicleType}
                    onChange={handleVehicleInputChange('vehicleType')}
                    label="Vehicle Type"
                  >
                    <MenuItem value="car">Car</MenuItem>
                    <MenuItem value="two_wheeler">Two Wheeler</MenuItem>
                    <MenuItem value="three_wheeler">Three Wheeler</MenuItem>
                    <MenuItem value="bus">Bus</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {vehicleErrors.vehicleType && (
                    <Typography variant="caption" color="error">{vehicleErrors.vehicleType}</Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Battery Capacity (kWh)"
                  type="number"
                  value={vehicleForm.batteryCapacity}
                  onChange={(e) => {
                    handleVehicleInputChange('batteryCapacity')(e);
                    const num = Number(e.target.value);
                    setVehicleErrors((prev) => ({
                      ...prev,
                      batteryCapacity: blockedCapacities.includes(num) ? 'This capacity already exists for the selected make and model' : prev.batteryCapacity
                    }));
                  }}
                  required
                  inputProps={{ min: 1, max: 500 }}
                  error={Boolean(vehicleErrors.batteryCapacity) || blockedCapacities.includes(Number(vehicleForm.batteryCapacity))}
                  helperText={blockedCapacities.includes(Number(vehicleForm.batteryCapacity)) ? 'This capacity already exists for the selected make and model' : vehicleErrors.batteryCapacity || 'Battery capacity must be between 1-500 kWh'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Year"
                  type="number"
                  value={vehicleForm.specifications.year}
                  onChange={handleVehicleInputChange('specifications.year')}
                  inputProps={{ min: 2015, max: 2025 }}
                  error={Boolean(vehicleErrors.year)}
                  helperText={vehicleErrors.year || 'Year must be between 2015-2025'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Range (km)"
                  type="number"
                  value={vehicleForm.specifications.range}
                  onChange={handleVehicleInputChange('specifications.range')}
                  error={Boolean(vehicleErrors.range)}
                  helperText={vehicleErrors.range || 'Range must be between 20-2000 km'}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>AC Charging</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={vehicleForm.chargingAC.supported}
                          onChange={(e) => {
                            const updated = { ...vehicleForm };
                            updated.chargingAC = { ...updated.chargingAC, supported: e.target.checked };
                            setVehicleForm(updated);
                          }}
                        />
                      }
                      label="AC Charging Supported"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Max AC Power (kW)"
                      type="number"
                      value={vehicleForm.chargingAC.maxPower}
                      onChange={handleVehicleInputChange('chargingAC.maxPower')}
                      disabled={!vehicleForm.chargingAC.supported}
                      inputProps={{ min: 2, max: 50 }}
                      error={Boolean(vehicleErrors.acMaxPower)}
                      helperText={vehicleErrors.acMaxPower || 'AC max power must be between 2-50 kW'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      disabled={!vehicleForm.chargingAC.supported}
                      options={connectorTypes}
                      getOptionLabel={(option) => typeof option === 'string' ? connectorTypes.find(type => type.value === option)?.label || option : option.label}
                      value={(vehicleForm.chargingAC.connectorTypes || []).map(type => typeof type === 'string' ? connectorTypes.find(option => option.value === type) || type : type)}
                      onChange={(event, newValue) => {
                        const values = newValue.map(item => typeof item === 'string' ? item : item.value);
                        handleConnectorTypeChange('AC', values);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="AC Connector Types"
                          placeholder="Select connector types"
                        />
                      )}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => {
                          const label = typeof option === 'string'
                            ? connectorTypes.find(type => type.value === option)?.label || option
                            : option.label;
                          return (
                            <Chip
                              label={label}
                              {...getTagProps({ index })}
                              size="small"
                            />
                          );
                        })
                      }
                      limitTags={3}
                      sx={{
                        '& .MuiAutocomplete-listbox': {
                          maxHeight: '200px'
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>DC Charging</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={vehicleForm.chargingDC.supported}
                          onChange={(e) => {
                            const updated = { ...vehicleForm };
                            updated.chargingDC = { ...updated.chargingDC, supported: e.target.checked };
                            setVehicleForm(updated);
                          }}
                        />
                      }
                      label="DC Charging Supported"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Max DC Power (kW)"
                      type="number"
                      value={vehicleForm.chargingDC.maxPower}
                      onChange={handleVehicleInputChange('chargingDC.maxPower')}
                      disabled={!vehicleForm.chargingDC.supported}
                      inputProps={{ min: 2, max: 100 }}
                      error={Boolean(vehicleErrors.dcMaxPower)}
                      helperText={vehicleErrors.dcMaxPower || 'DC max power must be between 2-100 kW'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      disabled={!vehicleForm.chargingDC.supported}
                      options={connectorTypes}
                      getOptionLabel={(option) => typeof option === 'string' ? connectorTypes.find(type => type.value === option)?.label || option : option.label}
                      value={(vehicleForm.chargingDC.connectorTypes || []).map(type => typeof type === 'string' ? connectorTypes.find(option => option.value === type) || type : type)}
                      onChange={(event, newValue) => {
                        const values = newValue.map(item => typeof item === 'string' ? item : item.value);
                        handleConnectorTypeChange('DC', values);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="DC Connector Types"
                          placeholder="Select connector types"
                        />
                      )}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => {
                          const label = typeof option === 'string'
                            ? connectorTypes.find(type => type.value === option)?.label || option
                            : option.label;
                          return (
                            <Chip
                              label={label}
                              {...getTagProps({ index })}
                              size="small"
                            />
                          );
                        })
                      }
                      limitTags={3}
                      sx={{
                        '& .MuiAutocomplete-listbox': {
                          maxHeight: '200px'
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              {vehicleErrors.charging && (
                <Grid item xs={12}>
                  <Alert severity="error">{vehicleErrors.charging}</Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ flexShrink: 0, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={() => {
              setVehicleDialogOpen(false);
              setEditingVehicle(null);
              setVehicleForm({
                make: '',
                model: '',
                vehicleType: 'car',
                batteryCapacity: '',
                chargingAC: { supported: true, maxPower: '', connectorTypes: [] },
                chargingDC: { supported: true, maxPower: '', connectorTypes: [] },
                specifications: { year: '', range: '', weight: '' }
              });
              setVehicleErrors({});
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="vehicle-form"
            variant="contained" 
            disabled={vehicleLoading}
          >
            {vehicleLoading ? 'Saving...' : (editingVehicle ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Vehicle Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setDeleteTargetVehicle(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Vehicle</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Permanently delete this vehicle? This cannot be undone.
          </Typography>
          {deleteTargetVehicle && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Vehicle</Typography>
              <Typography variant="body2">{deleteTargetVehicle.make} {deleteTargetVehicle.model}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setDeleteTargetVehicle(null); }}>Cancel</Button>
          <Button onClick={handleHardDeleteVehicle} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Add Corporate Admin Dialog */}
      <Dialog
        open={addAdminDialogOpen}
        onClose={() => setAddAdminDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Corporate Admin</DialogTitle>
        <DialogContent dividers>
          <AddCorporateAdminSection onRefresh={() => { loadDashboard(); setAddAdminDialogOpen(false); }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAdminDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
