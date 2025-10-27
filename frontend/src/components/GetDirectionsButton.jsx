import React from 'react';
import { Button } from '@mui/material';
import DirectionsIcon from '@mui/icons-material/Directions';

const GetDirectionsButton = ({ onClick }) => {
  return (
    <Button
      variant="contained"
      fullWidth
      startIcon={<DirectionsIcon />}
      onClick={onClick}
      sx={{
        py: 1.5,
        bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        '&:hover': {
          bgcolor: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        },
        transition: 'all 0.2s ease'
      }}
    >
      Get Directions
    </Button>
  );
};

export default GetDirectionsButton;