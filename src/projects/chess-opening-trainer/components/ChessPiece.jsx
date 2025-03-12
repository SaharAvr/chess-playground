import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

// SVG-based chess pieces using Material Design Icons
const PIECE_IMAGES = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
  P: '♙',
  N: '♘',
  B: '♗',
  R: '♖',
  Q: '♕',
  K: '♔'
};

export default function ChessPiece({ piece }) {
  const isWhite = piece === piece.toUpperCase();

  return (
    <MotionBox
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        mass: 0.5
      }}
      sx={{
        fontSize: { xs: '36px', sm: '42px', md: '48px' },
        fontFamily: "'Noto Sans', sans-serif",
        color: isWhite ? '#FFFFFF' : '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        userSelect: 'none',
        cursor: 'pointer',
        position: 'relative',
        textShadow: isWhite 
          ? '0px 1px 1px rgba(0,0,0,0.6), -1px 0px 1px rgba(0,0,0,0.4), 1px 0px 1px rgba(0,0,0,0.4)'
          : '0px 1px 1px rgba(0,0,0,0.4)',
        filter: isWhite 
          ? 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
          : 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))',
        zIndex: 10,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '65%',
          height: '65%',
          background: isWhite 
            ? 'radial-gradient(circle at 30% 30%, #FFFFFF 30%, #F8F8F8 100%)'
            : 'none',
          boxShadow: isWhite 
            ? 'inset -2px -2px 4px rgba(0,0,0,0.1), 0px 2px 4px rgba(0,0,0,0.2)'
            : 'none',
          borderRadius: '50%',
          zIndex: -1,
        }
      }}
    >
      {PIECE_IMAGES[piece]}
    </MotionBox>
  );
} 