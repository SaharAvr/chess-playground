import React from 'react';
import { Box } from '@mui/material';
import { 
  GiChessKing, 
  GiChessQueen, 
  GiChessBishop, 
  GiChessKnight, 
  GiChessRook, 
  GiChessPawn 
} from 'react-icons/gi';

const getPieceIcon = (piece) => {
  if (!piece || typeof piece !== 'string') return null;
  
  // Determine color based on the square's rank
  const isWhite = piece === piece.toUpperCase();
  const pieceType = piece.toLowerCase();
  
  const icons = {
    'k': GiChessKing,
    'q': GiChessQueen,
    'b': GiChessBishop,
    'n': GiChessKnight,
    'r': GiChessRook,
    'p': GiChessPawn
  };

  const Icon = icons[pieceType];
  return Icon ? (
    <Icon 
      style={{ 
        color: isWhite ? '#fff' : '#000',
        filter: isWhite ? 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' : 'none',
        fontSize: '220%',
        transition: 'transform 0.15s ease',
        transform: 'scale(1.1)',
        pointerEvents: 'none'
      }}
    />
  ) : null;
};

export default function ChessPiece({ piece, isDragging, style, square, onDragStart, onDragEnd }) {
  const Icon = getPieceIcon(piece);
  
  if (!Icon) return null;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', piece);
    e.dataTransfer.setData('square', square);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(square);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <Box
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing',
        },
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.15s ease',
        userSelect: 'none',
        ...style
      }}
    >
      {Icon}
    </Box>
  );
} 