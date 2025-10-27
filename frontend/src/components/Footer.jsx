import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        mt: 'auto',
        background: 'linear-gradient(135deg, #F8F8F8 0%, #ffffff 100%)',
        borderTop: '1px solid #EAEAEA',
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Typography
              variant="body1"
              sx={{ 
                textAlign: { xs: 'center', sm: 'left' },
                color: '#6B7280',
                fontWeight: 500,
              }}
            >
              © NexCharge 2025. All rights reserved.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 4,
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
              }}
            >
              <Link
                href="#"
                sx={{
                  color: '#6B7280',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#00E6B6',
                    textDecoration: 'underline',
                  },
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#6B7280',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#00E6B6',
                    textDecoration: 'underline',
                  },
                }}
              >
                Terms of Service
              </Link>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Footer;
