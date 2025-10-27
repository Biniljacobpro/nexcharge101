import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Container,
  Chip
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Map as StationsIcon,
  EventNote as BookingsIcon,
  HelpOutline as SupportIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import NotificationDropdown from './NotificationDropdown';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import nexchargeLogo from '../assets/nexcharge-high-resolution-logo-transparent.png';

const UserNavbar = ({ user }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleHome = () => {
    handleClose();
    navigate('/home');
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)'
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
          {/* Logo and Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/home')}>
              <img 
                src={nexchargeLogo} 
                alt="NexCharge" 
                style={{ height: '40px', marginRight: '12px' }}
              />
              {/* <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#1f2937',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                NexCharge
              </Typography> */}
            </Box>
          </motion.div>

          {/* Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5 }}>
            <Button color="inherit" sx={{ color: '#1f2937', fontWeight: 500 }} onClick={() => navigate('/home')} startIcon={<HomeIcon />}>
              Home
            </Button>
            <Button color="inherit" sx={{ color: '#1f2937', fontWeight: 500 }} onClick={() => navigate('/stations')} startIcon={<StationsIcon />}>
              Stations
            </Button>
            <Button color="inherit" sx={{ color: '#1f2937', fontWeight: 500 }} onClick={() => navigate('/bookings')} startIcon={<BookingsIcon />}>
              Bookings
            </Button>
            <Button color="inherit" sx={{ color: '#1f2937', fontWeight: 500 }} startIcon={<SupportIcon />}>
              Support
            </Button>
          </Box>

          {/* User Profile Section (simplified, no welcome text) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Notification Bell */}
              <NotificationDropdown />
              
              {/* User Avatar and Menu */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={user?.profileImage || undefined}
                  sx={{ 
                    width: 44, 
                    height: 44, 
                    bgcolor: user?.profileImage ? 'transparent' : 'primary.main',
                    cursor: 'pointer',
                    border: '2px solid rgba(0, 0, 0, 0.1)'
                  }}
                  onClick={handleMenu}
                >
                  {!user?.profileImage && initials}
                </Avatar>
                <IconButton
                  size="small"
                  onClick={handleMenu}
                  sx={{ color: '#1f2937', ml: 0.5 }}
                >
                  <ArrowDownIcon />
                </IconButton>
              </Box>

              {/* User Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    borderRadius: 2
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleHome} sx={{ py: 1.5 }}>
                  <HomeIcon sx={{ mr: 2, fontSize: 20 }} />
                  <Typography variant="body2">Home</Typography>
                </MenuItem>
                <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
                  <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
                  <Typography variant="body2">Profile Settings</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                  <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                  <Typography variant="body2">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </motion.div>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default UserNavbar;

