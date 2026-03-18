import React from 'react';
import { Box } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { Piece } from '@chessire/pieces';

const MotionBox = motion.create(Box);

export function ChessSquare({ square, isLight, children, result, selectedSquare, landingPiece, onSquareClick, gameMode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: square,
  });

  const isSelected = square === selectedSquare;
  const isCorrect = result === 'correct' && isSelected;
  const isWrong = result === 'wrong' && isSelected;
  const shouldShowResult = gameMode !== 'clickSquareFirst';

  const getBackgroundColor = () => {
    if (shouldShowResult) {
      if (isCorrect) return '#86efac';
      if (isWrong) return '#fca5a5';
    }
    if (isOver && gameMode === 'drag') return '#bfdbfe';
    if (isSelected && (gameMode === 'clickPieceFirst' || gameMode === 'clickSquareFirst')) return '#93c5fd';
    return isLight ? '#f8fafc' : '#cbd5e1';
  };

  const isClickMode = gameMode === 'clickPieceFirst' || gameMode === 'clickSquareFirst';

  return (
    <Box
      ref={gameMode === 'drag' ? setNodeRef : undefined}
      onClick={() => isClickMode && onSquareClick?.(square)}
      sx={{
        width: '12.5%',
        aspectRatio: '1',
        backgroundColor: getBackgroundColor(),
        transition: isClickMode ? 'background-color 0.2s' : 'none',
        cursor: isClickMode ? 'pointer' : 'default',
        '&:hover': isClickMode ? {
          backgroundColor: '#dbeafe',
        } : undefined,
      }}
    >
      {shouldShowResult && isSelected && (
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
      {shouldShowResult && isSelected && result === 'correct' && (
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