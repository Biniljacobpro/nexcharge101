import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  CircularProgress
} from '@mui/material';
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <RoutePlanner />
      </Container>

      <Footer />
    </>
  );
};

export default RoutePlannerPage;