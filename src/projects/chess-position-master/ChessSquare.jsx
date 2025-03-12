import React from 'react';
import { Box } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Piece } from '@chessire/pieces';

const MotionBox = motion.create(Box);

export function ChessSquare({ square, isLight, children, result, selectedSquare, landingPiece }) {
  const { isOver, setNodeRef } = useDroppable({
    id: square,
  });

  const isSelected = square === selectedSquare;
  const baseColor = isLight ? '#F0D9B5' : '#B58863';

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: '12.5%',
        aspectRatio: '1',
        backgroundColor: baseColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <AnimatePresence>
        {isOver && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isLight ? 'rgba(103, 178, 230, 0.3)' : '#C49B76',
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>
      {isSelected && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: result === 'correct' ? '#059669' : '#DC2626',
            zIndex: 1,
          }}
        />
      )}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {children}
      </Box>
      {isSelected && result === 'correct' && (
        <MotionBox
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.8 }}
          sx={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <Piece
            piece={landingPiece}
            color="white"
            width={48}
            height={48}
          />
        </MotionBox>
      )}
    </Box>
  );
} 