import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Directions as DirectionsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RoutePlanner from '../components/RoutePlanner';
import UserNavbar from '../components/UserNavbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import { getMe } from '../utils/api';

const RoutePlannerPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <UserNavbar user={user} />
      <AnimatedBackground />
      
      {/* Header with Back Button */}
      <AppBar 
        position="static" 
        color="default" 
        elevation={0}
        sx={{ 
          borderBottom: '1px solid #e0e0e0',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/home')}
            sx={{ mr: 2 }}
          >
            <BackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DirectionsIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Route Planner
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <RoutePlanner />
      </Container>

      <Footer />
    </>
  );
};

export default RoutePlannerPage;