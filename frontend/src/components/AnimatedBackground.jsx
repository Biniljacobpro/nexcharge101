import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import ElectricCarIcon from '@mui/icons-material/ElectricCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const AnimatedBackground = () => {
  const floatingIcons = [
    { icon: DirectionsCarIcon, delay: 0, duration: 12 },
    { icon: BatteryChargingFullIcon, delay: 2, duration: 15 },
    { icon: ElectricCarIcon, delay: 4, duration: 14 },
    { icon: LocationOnIcon, delay: 6, duration: 16 },
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: -1,
      }}
    >
      {/* Subtle gradient background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.02) 0%, rgba(37, 99, 235, 0.02) 100%)',
        }}
      />

      {/* Floating icons */}
      {floatingIcons.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <motion.div
            key={index}
            style={{
              position: 'absolute',
              color: 'rgba(0, 212, 170, 0.05)',
            }}
            animate={{
              y: [-20, 20, -20],
              x: [0, 10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              delay: item.delay,
              ease: 'easeInOut',
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
          >
            <IconComponent
              sx={{
                fontSize: { xs: 16, sm: 20, md: 24 },
                opacity: 0.1,
              }}
            />
          </motion.div>
        );
      })}
    </Box>
  );
};

export default AnimatedBackground;
