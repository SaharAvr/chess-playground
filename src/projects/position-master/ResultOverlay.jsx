import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

export function ResultOverlay({ result }) {
  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          backgroundColor: result === 'correct' ? 'rgba(5, 150, 105, 0.95)' : 'rgba(220, 38, 38, 0.95)',
          borderRadius: '16px',
          padding: '16px 32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            color: 'white',
            fontWeight: 700,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {result === 'correct' ? (
            <MotionBox
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ duration: 0.2, repeat: 3, repeatType: "reverse" }}
            >
              Correct! 🎉
            </MotionBox>
          ) : (
            <MotionBox
              initial={{ x: -5 }}
              animate={{ x: 5 }}
              transition={{ duration: 0.1, repeat: 3, repeatType: "reverse" }}
            >
              Try Again
            </MotionBox>
          )}
        </Typography>
      </Box>
    </MotionBox>
  );
} 