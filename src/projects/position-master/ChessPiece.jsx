import React from 'react';
import { Box } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { Piece } from '@chessire/pieces';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

export function ChessPiece({ 
  piece, 
  disabled, 
  isDraggable, 
  isSelected,
  onClick 
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: piece,
    disabled: disabled || !isDraggable,
  });

  const commonProps = {
    width: 72,
    height: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'default' : (isDraggable ? 'grab' : 'pointer'),
    borderRadius: 1,
    backgroundColor: isSelected ? '#E2E8F0' : 'transparent',
    opacity: isDragging ? 0.4 : 1,
    '&:hover': !disabled ? {
      backgroundColor: '#F1F5F9'
    } : undefined,
  };

  return (
    <MotionBox
      ref={isDraggable ? setNodeRef : undefined}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
      onClick={!isDraggable ? onClick : undefined}
      whileHover={!disabled ? { scale: 1.1 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      sx={commonProps}
    >
      <Piece
        piece={piece}
        color="white"
        width={64}
        height={64}
      />
    </MotionBox>
  );
} 