import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import Piece from 'react-chess-pieces';

const MotionBox = motion.create(Box);

const scaredAnimation = {
  initial: { scale: 1, rotate: 0 },
  animate: [
    { scale: 1.1, rotate: -5, transition: { duration: 0.1 } },
    { scale: 1.1, rotate: 5, transition: { duration: 0.1 } },
    { scale: 1.1, rotate: -5, transition: { duration: 0.1 } },
    { scale: 1.1, rotate: 5, transition: { duration: 0.1 } },
    { scale: 1, rotate: 0, transition: { duration: 0.2 } }
  ]
};

export default function ChessPiece({ piece, isGameOver }) {
  // piece is an object with { type, color } from chess.js
  const isWhite = piece.color === 'w';
  const pieceSymbol = isWhite ? piece.type.toUpperCase() : piece.type.toLowerCase();

  return (
    <MotionBox
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', duration: 0.3 }}
      variants={isWhite && !isGameOver ? scaredAnimation : undefined}
      sx={{
        width: { xs: '2rem', sm: '2.5rem', md: '3rem' },
        height: { xs: '2rem', sm: '2.5rem', md: '3rem' },
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      <Piece piece={pieceSymbol} />
    </MotionBox>
  );
} 