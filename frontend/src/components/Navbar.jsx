import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import nexchargeLogo from '../assets/nexcharge-high-resolution-logo-transparent.png';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: '#ffffff',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)',
        borderBottom: '1px solid #EAEAEA',
        backdropFilter: 'blur(20px)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 2 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
            onClick={() => navigate('/')}
          >
            <img
              src={nexchargeLogo}
              alt="NexCharge"
              style={{
                height: '56px',
                width: 'auto',
              }}
            />
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                minWidth: isMobile ? 80 : 100,
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: 600,
                borderRadius: 3,
                borderColor: '#00E6B6',
                color: '#00E6B6',
                borderWidth: '2px',
                px: 3,
                py: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 230, 182, 0.08)',
                  borderColor: '#00B894',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 15px rgba(0, 230, 182, 0.2)',
                },
              }}
            >
              {isMobile ? 'Login' : 'Login'}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/signup')}
              sx={{
                minWidth: isMobile ? 80 : 100,
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: 600,
                borderRadius: 3,
                px: 3,
                py: 1,
                background: 'linear-gradient(135deg, #00E6B6 0%, #00B894 100%)',
                boxShadow: '0 4px 15px rgba(0, 230, 182, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00B894 0%, #00A085 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0, 230, 182, 0.4)',
                },
              }}
            >
              {isMobile ? 'Signup' : 'Sign Up'}
            </Button>
          </Box>
        </motion.div>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
