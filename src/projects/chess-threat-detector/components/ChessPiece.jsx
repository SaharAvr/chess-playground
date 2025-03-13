import React from 'react';
import { Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

const PIECES = {
  'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
  'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
};

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

export default function ChessPiece({ piece, square, isGameOver }) {
  // piece is an object with { type, color } from chess.js
  const isWhite = piece.color === 'w';
  const pieceSymbol = PIECES[piece.type.toUpperCase()];

  return (
    <MotionBox
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', duration: 0.3 }}
      variants={isWhite && !isGameOver ? scaredAnimation : undefined}
      sx={{
        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
        color: isWhite ? '#fff' : '#000',
        textShadow: isWhite ? '0 0 2px #000' : '0 0 2px #fff',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {pieceSymbol}
    </MotionBox>
  );
} 