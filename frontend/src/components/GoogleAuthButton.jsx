import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import GoogleIcon from '@mui/icons-material/Google';
import { googleLoginApi } from '../utils/api';

const GoogleAuthButton = ({ 
  variant = 'outlined', 
  fullWidth = true, 
  onSuccess, 
  children,
  sx = {} 
}) => {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!window.google || !process.env.REACT_APP_GOOGLE_CLIENT_ID) return;
    const client = window.google.accounts.id;
    client.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: async (resp) => {
        try {
          const data = await googleLoginApi(resp.credential);
          if (onSuccess) onSuccess(data);
        } catch (e) {
          console.error(e);
        }
      }
    });
    if (containerRef.current) {
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill'
      });
      setReady(true);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!ready || !containerRef.current) return;
    const btn = containerRef.current.querySelector('[role="button"]');
    if (btn) btn.click();
  }, [ready]);

  return (
    <>
      <div ref={containerRef} style={{ display: 'none' }} />
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button
          variant={variant}
          fullWidth={fullWidth}
          onClick={handleClick}
          startIcon={<GoogleIcon sx={{ fontSize: 18 }} />}
          sx={{
            borderColor: '#4285F4',
            color: '#4285F4',
            backgroundColor: '#ffffff',
            '&:hover': { borderColor: '#3367D6', backgroundColor: '#f8f9fa' },
            ...sx,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="button">
              {children || 'Continue with Google'}
            </Typography>
          </Box>
        </Button>
      </motion.div>
    </>
  );
};

export default GoogleAuthButton;
