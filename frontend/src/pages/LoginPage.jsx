import React, { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  useTheme,
  InputAdornment,
  IconButton,
  Grid,
  Stack,
  Divider,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import Link from '@mui/material/Link';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import { loginApi } from '../utils/api';
import SocialAuthRow from '../components/SocialAuthRow';

const LoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: true,
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deactivatedDialogOpen, setDeactivatedDialogOpen] = useState(false);

  const allowedDomains = useMemo(() => ['gmail.com', 'mca.ajce.in'], []);
  const emailFormatValid = useMemo(() => {
    const email = formData.email.trim().toLowerCase();
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
  }, [formData.email]);
  const emailDomainValid = useMemo(() => {
    const email = formData.email.trim().toLowerCase();
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    return allowedDomains.includes(parts[1]);
  }, [formData.email, allowedDomains]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailFormatValid) {
      newErrors.email = 'Invalid email format';
    } else if (!emailDomainValid) {
      newErrors.email = 'Enter a valid email domain';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field) => (event) => {
    const value = field === 'remember' ? event.target.checked : event.target.value;
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // Live validation as user types
    setErrors((prev) => {
      const next = { ...prev };
      if (field === 'email') {
        const email = updated.email.trim().toLowerCase();
        if (!email) next.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = 'Invalid email format';
        else if (!allowedDomains.includes((email.split('@')[1] || ''))) next.email = 'Enter a valid email domain';
        else next.email = '';
      }
      if (field === 'password') {
        if (!updated.password) next.password = 'Password is required';
        else next.password = '';
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    try {
      const data = await loginApi({ email: formData.email, password: formData.password });
      setShowSuccess(true);
      
      // Determine redirect based on user role
      let next = '/home';
      if (data?.user?.role === 'admin') {
        next = '/admin';
      } else if (data?.user?.role === 'corporate_admin') {
        // If backend signals password change required, redirect to first-login reset
        if (data?.user?.credentials?.mustChangePassword) {
          next = '/first-login-reset';
        } else {
          next = '/corporate/dashboard';
        }
      } else if (data?.user?.role === 'franchise_owner') {
        // If backend signals password change required, redirect to first-login reset
        if (data?.user?.credentials?.mustChangePassword) {
          next = '/first-login-reset';
        } else {
          next = '/franchise/dashboard';
        }
      } else if (data?.user?.role === 'station_manager') {
        // If backend signals password change required, redirect to station manager password reset
        if (data?.user?.credentials?.mustChangePassword) {
          next = '/station-manager/password-reset';
        } else {
          next = '/station-manager/dashboard';
        }
      }
      
      setTimeout(() => navigate(next), 600);
    } catch (e) {
      if (e?.status === 403) {
        setDeactivatedDialogOpen(true);
        return;
      }
      setErrors({ ...errors, password: e.message });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      <AnimatedBackground />
      <Navbar />
      
      <Box component="main" sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        py: { xs: 6, md: 10 },
        background: 'linear-gradient(135deg, #F8F8F8 0%, #ffffff 50%, #F8F8F8 100%)',
      }}>
        <Container maxWidth="xl">
          <Grid container spacing={8} alignItems="center">
            {/* Left: Branding Visual */}
            <Grid item xs={12} md={6}>
              <motion.div 
                initial={{ opacity: 0, x: -30 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.8 }}
              >
                <Box sx={{ position: 'relative' }}>
                  {/* Background decorative elements */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -50,
                      right: -30,
                      width: 200,
                      height: 200,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(0, 230, 182, 0.1) 0%, rgba(45, 90, 135, 0.1) 100%)',
                      animation: 'float 8s ease-in-out infinite',
                      '@keyframes float': {
                        '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                        '50%': { transform: 'translateY(-30px) rotate(180deg)' },
                      },
                    }}
                  />
                  
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      color: '#222222', 
                      fontWeight: 800, 
                      mb: 3,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Charge{' '}
                    <Box
                      component="span"
                      sx={{
                        background: 'linear-gradient(135deg, #00E6B6 0%, #00B894 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 800,
                      }}
                    >
                      Smarter
                    </Box>
                  </Typography>
                  
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      color: '#2D5A87', 
                      fontWeight: 700, 
                      mb: 2,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                    }}
                  >
                    Drive Greener
                  </Typography>
                  
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      color: '#2D5A87', 
                      fontWeight: 700, 
                      mb: 4,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                    }}
                  >
                    To a Better Future
                  </Typography>
                  
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      maxWidth: 600,
                      color: '#6B7280',
                      lineHeight: 1.7,
                      fontWeight: 400,
                      fontSize: { xs: '1.1rem', md: '1.25rem' },
                    }}
                  >
                    NexCharge makes EV charging effortless with smart booking, real-time station updates, and eco-friendly energy insights. 
                    Find nearby chargers, reserve slots, and power your journey with clean, reliable, and sustainable energy — all in one simple platform.
                  </Typography>
                </Box>
              </motion.div>
            </Grid>

            {/* Right: Compact Professional Form */}
            <Grid item xs={12} md={6}>
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box sx={{ 
                  maxWidth: 400, 
                  mx: 'auto',
                  width: '100%',
                }}>
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    background: '#ffffff',
                    border: '1px solid #EAEAEA',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
                  }}>
                    <CardContent sx={{ p: 0 }}>
                      {showSuccess && (
                        <Alert 
                          severity="success" 
                          sx={{ 
                            mb: 2,
                            borderRadius: 2,
                            fontSize: '0.9rem',
                          }}
                        >
                          Login successful! Redirecting...
                        </Alert>
                      )}

                      <Typography 
                        variant="h5" 
                        sx={{ 
                          mb: 3, 
                          textAlign: 'center',
                          color: '#222222',
                          fontWeight: 700,
                        }}
                      >
                        Welcome Back
                      </Typography>

                      <Box 
                        component="form" 
                        onSubmit={handleSubmit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      >
                        <Stack spacing={2}>
                          <TextField
                            label="Email address"
                            type="email"
                            fullWidth
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleInputChange('email')}
                            error={!!errors.email}
                            helperText={errors.email}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Email sx={{ color: '#9CA3AF', fontSize: '1.2rem' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                          
                          <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleInputChange('password')}
                            error={!!errors.password}
                            helperText={errors.password}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Lock sx={{ color: '#9CA3AF', fontSize: '1.2rem' }} />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    edge="end" 
                                    sx={{ color: '#6B7280' }}
                                    size="small"
                                  >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                          
                          <Box sx={{ textAlign: 'right' }}>
                            <Link 
                              component="button" 
                              variant="body2" 
                              onClick={() => navigate('/forgot-password')} 
                              sx={{ 
                                cursor: 'pointer',
                                color: '#00E6B6',
                                fontWeight: 600,
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              Forgot your password?
                            </Link>
                          </Box>
                          
                          <Button 
                            type="submit" 
                            variant="contained" 
                            fullWidth 
                            sx={{ 
                              py: 1.5,
                              mt: 1,
                              fontSize: '1rem',
                              fontWeight: 600,
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, #00E6B6 0%, #00B894 100%)',
                              boxShadow: '0 4px 15px rgba(0, 230, 182, 0.3)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #00B894 0%, #00A085 100%)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 6px 20px rgba(0, 230, 182, 0.4)',
                              },
                            }}
                          >
                            Sign In
                          </Button>
                        </Stack>
                      </Box>

                      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ my: 3 }}>
                        <Divider flexItem sx={{ borderColor: '#EAEAEA' }} />
                        <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.9rem' }}>
                          or continue with
                        </Typography>
                        <Divider flexItem sx={{ borderColor: '#EAEAEA' }} />
                      </Stack>

                      <SocialAuthRow onGoogleSuccess={(data) => navigate(data?.user?.role === 'admin' ? '/admin' : '/home')} />

                      <Stack alignItems="center" sx={{ mt: 3 }}>
                        <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.9rem' }}>
                          Don't have an account?{' '}
                          <Link 
                            component="button" 
                            variant="body2" 
                            onClick={() => navigate('/signup')} 
                            sx={{ 
                              cursor: 'pointer',
                              color: '#00E6B6',
                              fontWeight: 600,
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            Sign up
                          </Link>
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Footer />
      <Dialog open={deactivatedDialogOpen} onClose={() => setDeactivatedDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Account Deactivated</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Your account has been deactivated. Please contact the administrator.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivatedDialogOpen(false)} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;
