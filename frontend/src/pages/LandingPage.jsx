import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import RouteIcon from '@mui/icons-material/Route';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import Lottie from 'lottie-react';
import greenEnergyAnimation from '../assets/animations/greenEnergyAnimation.json';

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const features = [
    {
      icon: RouteIcon,
      title: 'AI Route Planner',
      description: 'Intelligent route optimization for efficient charging stops.',
    },
    {
      icon: ScheduleIcon,
      title: 'Smart Booking',
      description: 'Reserve charging stations in advance with real-time availability.',
    },
    {
      icon: BatteryChargingFullIcon,
      title: 'Battery Health',
      description: 'Monitor and optimize your EV battery performance.',
    },
    {
      icon: LocationOnIcon,
      title: 'Station Finder',
      description: 'Find nearby charging stations with detailed information.',
    },
    {
      icon: SpeedIcon,
      title: 'Fast Charging',
      description: 'Access to high-speed charging networks.',
    },
    {
      icon: SecurityIcon,
      title: 'Secure Payments',
      description: 'Safe and encrypted payment processing.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      <AnimatedBackground />
      <Navbar />
      
      {/* Hero Section */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          background: 'linear-gradient(135deg, #F8F8F8 0%, #ffffff 50%, #F8F8F8 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
                  <Typography
                    variant="h1"
                    sx={{
                      mb: 3,
                      textAlign: { xs: 'center', md: 'left' },
                      color: '#222222',
                      fontWeight: 800,
                      fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Power Your Future with{' '}
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
                      Clean Energy
                    </Box>
                  </Typography>
                  
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 5,
                      textAlign: { xs: 'center', md: 'left' },
                      lineHeight: 1.6,
                      fontWeight: 400,
                      maxWidth: '550px',
                      color: '#6B7280',
                      fontSize: { xs: '1.1rem', md: '1.2rem' },
                    }}
                  >
                    AI-powered, intelligent, and sustainable charging ecosystem that revolutionizes your EV experience with smart booking, real-time updates, and eco-friendly insights.
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: { xs: 'center', md: 'flex-start' },
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/signup')}
                      sx={{
                        px: 5,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #00E6B6 0%, #00B894 100%)',
                        boxShadow: '0 8px 25px rgba(0, 230, 182, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00B894 0%, #00A085 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 35px rgba(0, 230, 182, 0.4)',
                        },
                      }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{
                        px: 5,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: 3,
                        borderColor: '#00E6B6',
                        color: '#00E6B6',
                        borderWidth: '2px',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 230, 182, 0.08)',
                          borderColor: '#00B894',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0, 230, 182, 0.2)',
                        },
                      }}
                    >
                      Learn More
                    </Button>
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: { xs: 350, md: 500 },
                    position: 'relative',
                  }}
                >
                  {/* Background decorative elements */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '10%',
                      right: '10%',
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(0, 230, 182, 0.1) 0%, rgba(45, 90, 135, 0.1) 100%)',
                      animation: 'float 6s ease-in-out infinite',
                      '@keyframes float': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-20px)' },
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: '15%',
                      left: '5%',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(45, 90, 135, 0.1) 0%, rgba(0, 230, 182, 0.1) 100%)',
                      animation: 'float 4s ease-in-out infinite reverse',
                    }}
                  />
                  
                  {/* Main visual container */}
                  <Box
                    sx={{
                      width: { xs: 280, md: 380 },
                      height: { xs: 280, md: 380 },
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 248, 248, 0.9) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        transition: 'transform 0.3s ease',
                      },
                    }}
                  >
                    <Lottie
                      animationData={greenEnergyAnimation}
                      loop
                      autoplay
                      style={{ width: '90%', height: '90%' }}
                    />
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>


      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: '#F8F8F8' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography
              variant="h2"
              textAlign="center"
              sx={{ 
                mb: 6, 
                color: '#222222',
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Why Choose NexCharge?
            </Typography>
          </motion.div>

          {/* Uniform Grid Layout */}
          <Grid container spacing={4}>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              
              return (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  key={index}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card
                      sx={{
                        height: 280,
                        width: '100%',
                        textAlign: 'center',
                        p: 3,
                        background: 'linear-gradient(135deg, #ffffff 0%, #F8F8F8 100%)',
                        borderRadius: 4,
                        border: '1px solid #EAEAEA',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 20px 40px rgba(0, 230, 182, 0.15)',
                          '& .feature-icon': {
                            transform: 'scale(1.1) rotate(5deg)',
                            background: 'linear-gradient(135deg, #00E6B6 0%, #00B894 100%)',
                            '& svg': {
                              color: '#ffffff',
                            },
                          },
                          '& .feature-bg': {
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      {/* Background decoration */}
                      <Box
                        className="feature-bg"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: 100,
                          height: 100,
                          background: 'linear-gradient(135deg, rgba(0, 230, 182, 0.05) 0%, rgba(45, 90, 135, 0.05) 100%)',
                          borderRadius: '0 0 0 100%',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                        }}
                      />
                      
                      <CardContent sx={{ 
                        position: 'relative', 
                        zIndex: 1, 
                        p: 0,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}>
                        {/* Icon Section */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mb: 2,
                          }}
                        >
                          <Box
                            className="feature-icon"
                            sx={{
                              width: 70,
                              height: 70,
                              borderRadius: 4,
                              background: 'linear-gradient(135deg, rgba(0, 230, 182, 0.1) 0%, rgba(45, 90, 135, 0.1) 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.3s ease',
                              border: '1px solid rgba(0, 230, 182, 0.2)',
                            }}
                          >
                            <IconComponent
                              sx={{
                                fontSize: 32,
                                color: '#00E6B6',
                                transition: 'color 0.3s ease',
                              }}
                            />
                          </Box>
                        </Box>
                        
                        {/* Content Section */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography
                            variant="h6"
                            sx={{ 
                              mb: 2, 
                              fontWeight: 700, 
                              color: '#222222',
                              fontSize: '1.25rem',
                              lineHeight: 1.3,
                            }}
                          >
                            {feature.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ 
                              color: '#6B7280',
                              fontSize: '0.9rem',
                              lineHeight: 1.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {feature.description}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ 
        py: { xs: 12, md: 16 }, 
        background: 'linear-gradient(135deg, #222222 0%, #1E3A5F 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(0, 230, 182, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(45, 90, 135, 0.1) 0%, transparent 50%)',
          }}
        />
        
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <Typography
                variant="h2"
                sx={{ 
                  mb: 4, 
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                Start Charging{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #00E6B6 0%, #33EBC4 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800,
                  }}
                >
                  Smarter Today
                </Box>
              </Typography>
              <Typography
                variant="h5"
                sx={{ 
                  mb: 6,
                  maxWidth: '700px',
                  mx: 'auto',
                  lineHeight: 1.6,
                  color: '#D1D5DB',
                  fontWeight: 400,
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                }}
              >
                Join thousands of EV drivers who are already experiencing the future of sustainable transportation with intelligent charging solutions.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/signup')}
                sx={{
                  px: 8,
                  py: 3,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #00E6B6 0%, #00B894 100%)',
                  boxShadow: '0 12px 40px rgba(0, 230, 182, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00B894 0%, #00A085 100%)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 16px 50px rgba(0, 230, 182, 0.5)',
                  },
                }}
              >
                Get Started Now
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default LandingPage;
