import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import ChessPiece from './ChessPiece';

const MotionBox = motion.create(Box);

const LIGHT_SQUARE_COLOR = '#f0d9b5';
const DARK_SQUARE_COLOR = '#b58863';
const SELECTED_COLOR = 'rgba(255, 255, 0, 0.5)';
const THREATENED_COLOR = 'rgba(255, 0, 0, 0.5)';
const MISSED_COLOR = 'rgba(0, 255, 0, 0.3)';

export default function ChessSquare({
  square,
  piece,
  isLight,
  isSelected,
  isThreatened,
  onClick,
  isGameOver,
}) {
  const getBackgroundColor = () => {
    if (isGameOver) {
      if (isThreatened) {
        return THREATENED_COLOR;
      }
      return isSelected ? SELECTED_COLOR : isLight ? LIGHT_SQUARE_COLOR : DARK_SQUARE_COLOR;
    }
    return isSelected ? SELECTED_COLOR : isLight ? LIGHT_SQUARE_COLOR : DARK_SQUARE_COLOR;
  };

  return (
    <MotionBox
      whileHover={!isGameOver ? { scale: 1.05 } : {}}
      whileTap={!isGameOver ? { scale: 0.95 } : {}}
      onClick={!isGameOver ? onClick : undefined}
      sx={{
        width: '100%',
        aspectRatio: '1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: getBackgroundColor(),
        cursor: isGameOver ? 'default' : 'pointer',
        position: 'relative',
        transition: 'background-color 0.2s ease',
      }}
    >
      {piece && (
        <ChessPiece
          piece={piece}
          square={square}
        />
      )}
    </MotionBox>
  );
} 