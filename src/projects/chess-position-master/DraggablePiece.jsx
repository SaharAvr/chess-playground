import React from 'react';
import { Box } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { Piece } from '@chessire/pieces';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

export function DraggablePiece({ piece, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: piece,
    disabled,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  return (
    <MotionBox
      whileHover={disabled ? {} : { scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Box
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        sx={{
          width: '80px',
          height: '80px',
          backgroundColor: 'transparent',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'grab',
          opacity: isDragging ? 0 : (disabled ? 0.5 : 1),
          touchAction: 'none',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <Piece
          piece={piece}
          color="white"
          width={56}
          height={56}
        />
      </Box>
    </MotionBox>
  );
} 