import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  FormControlLabel
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import { signupApi, checkEmailAvailabilityApi } from '../utils/api';
import SocialAuthRow from '../components/SocialAuthRow';
import Link from '@mui/material/Link';

const SignupPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    newsletter: true,
  });
  const [errors, setErrors] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const debounceTimerRef = useRef(null);
  const allowedDomains = useMemo(() => ['gmail.com', 'mca.ajce.in'], []);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const nameRegex = /^[A-Za-z]+$/;

    // First name: required, letters only, no spaces
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!nameRegex.test(formData.firstName)) {
      newErrors.firstName = 'Letters only, no spaces';
    }

    // Last name: required, letters only, no spaces
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!nameRegex.test(formData.lastName)) {
      newErrors.lastName = 'Letters only, no spaces';
    }

    // Email: required, format, and allowed domain check
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailFormatValid) {
      newErrors.email = 'Invalid email format';
    } else if (!emailDomainValid) {
      newErrors.email = 'Enter a valid email domain';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'At least 6 characters';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Include at least one number';
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/.test(formData.password)) {
      newErrors.password = 'Include at least one special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field) => (event) => {
    const value = field === 'newsletter' ? event.target.checked : event.target.value;
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // Live validation per field
    setErrors((prev) => {
      const next = { ...prev };
      if (field === 'firstName') {
        const nameRegex = /^[A-Za-z]+$/;
        if (!updated.firstName.trim()) next.firstName = 'First name is required';
        else if (!nameRegex.test(updated.firstName)) next.firstName = 'Letters only, no spaces';
        else next.firstName = '';
      }
      if (field === 'lastName') {
        const nameRegex = /^[A-Za-z]+$/;
        if (!updated.lastName.trim()) next.lastName = 'Last name is required';
        else if (!nameRegex.test(updated.lastName)) next.lastName = 'Letters only, no spaces';
        else next.lastName = '';
      }
      if (field === 'password') {
        if (!updated.password) next.password = 'Password is required';
        else if (updated.password.length < 6) next.password = 'At least 6 characters';
        else if (!/\d/.test(updated.password)) next.password = 'Include at least one number';
        else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/.test(updated.password)) next.password = 'Include at least one special character';
        else next.password = '';
        // Also update confirm match on password change
        if (updated.confirmPassword && updated.confirmPassword !== updated.password) {
          next.confirmPassword = 'Passwords do not match';
        } else if (updated.confirmPassword) {
          next.confirmPassword = '';
        }
      }
      if (field === 'confirmPassword') {
        if (!updated.confirmPassword) next.confirmPassword = 'Confirm your password';
        else if (updated.confirmPassword !== updated.password) next.confirmPassword = 'Passwords do not match';
        else next.confirmPassword = '';
      }
      if (field === 'email') {
        const email = updated.email.trim().toLowerCase();
        if (!email) next.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = 'Invalid email format';
        else if (!allowedDomains.includes(email.split('@')[1] || '')) next.email = 'Enter a valid email domain';
        else next.email = '';
      }
      return next;
    });
  };

  // Real-time email availability check with debounce
  useEffect(() => {
    if (!formData.email) {
      return;
    }
    if (!emailFormatValid) {
      setErrors((prev) => ({ ...prev, email: 'Invalid email format' }));
      return;
    }
    if (!emailDomainValid) {
      setErrors((prev) => ({ ...prev, email: 'Enter a valid email domain' }));
      return;
    }
    setErrors((prev) => ({ ...prev, email: '' }));
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setEmailChecking(true);
        const { available } = await checkEmailAvailabilityApi(formData.email.trim());
        if (!available) {
          setErrors((prev) => ({ ...prev, email: 'Email already in use' }));
        }
      } catch (e) {
        setErrors((prev) => ({ ...prev, email: e.message || 'Failed to validate email' }));
      } finally {
        setEmailChecking(false);
      }
    }, 400);
    return () => debounceTimerRef.current && clearTimeout(debounceTimerRef.current);
  }, [formData.email, emailFormatValid]);

  const handleEmailBlur = async () => {
    if (!formData.email || !emailFormatValid) return;
    try {
      setEmailChecking(true);
      const { available } = await checkEmailAvailabilityApi(formData.email.trim());
      if (!available) {
        setErrors((prev) => ({ ...prev, email: 'Email already in use' }));
      }
    } catch (e) {
      setErrors((prev) => ({ ...prev, email: e.message || 'Failed to validate email' }));
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    try {
      const data = await signupApi({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      setShowSuccess(true);
      
      // Determine redirect based on user role
      let next = '/home';
      if (data?.user?.role === 'admin') {
        next = '/admin';
      } else if (data?.user?.role === 'corporate_admin') {
        next = '/corporate/dashboard';
      }
      
      setTimeout(() => navigate(next), 1000);
    } catch (e) {
      setErrors({ ...errors, email: e.message });
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
        <Container maxWidth="lg">
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
                    The Best{' '}
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
                      Offer
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
                    For Your
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
                    Business
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
                    Power your business with NexCharge — onboard customers faster, manage charging seamlessly, and unlock
                    real-time insights for stations, pricing, and performance. Also for EV drivers, find nearby chargers, reserve slots, and power your journey with clean, reliable, and sustainable energy — all in one simple platform.
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
                          Account created successfully! Redirecting...
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
                        Create Your Account
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
                          {/* Single column layout for names */}
                          <TextField
                            label="First name"
                            fullWidth
                            placeholder="Enter your first name"
                            value={formData.firstName}
                            onChange={handleInputChange('firstName')}
                            error={!!errors.firstName}
                            helperText={errors.firstName}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Person sx={{ color: '#9CA3AF', fontSize: '1.2rem' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                          
                          <TextField
                            label="Last name"
                            fullWidth
                            placeholder="Enter your last name"
                            value={formData.lastName}
                            onChange={handleInputChange('lastName')}
                            error={!!errors.lastName}
                            helperText={errors.lastName}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Person sx={{ color: '#9CA3AF', fontSize: '1.2rem' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                          
                          <TextField
                            label="Email address"
                            type="email"
                            fullWidth
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleInputChange('email')}
                            onBlur={handleEmailBlur}
                            error={!!errors.email}
                            helperText={errors.email || (emailChecking ? 'Checking email…' : '')}
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
                          
                          <TextField
                            label="Confirm password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            fullWidth
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange('confirmPassword')}
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Lock sx={{ color: '#9CA3AF', fontSize: '1.2rem' }} />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton 
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                                    edge="end" 
                                    sx={{ color: '#6B7280' }}
                                    size="small"
                                  >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                          
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
                            Sign Up
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
                          Already have an account?{' '}
                          <Link 
                            component="button" 
                            variant="body2" 
                            onClick={() => navigate('/login')} 
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
                            Login
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
    </Box>
  );
};

export default SignupPage;
