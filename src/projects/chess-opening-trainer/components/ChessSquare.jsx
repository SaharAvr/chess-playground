import React from 'react';
import { Box } from '@mui/material';
import ChessPiece from './ChessPiece';

const LIGHT_SQUARE = '#F0D9B5';
const DARK_SQUARE = '#B58863';
const SELECTED_SQUARE = 'rgba(62, 142, 185, 0.9)';

export default function ChessSquare({ 
  square, 
  piece, 
  isLight, 
  isSelected, 
  isHighlighted,
  onSquareClick,
  onPieceDrop,
  isValidDropTarget,
  onDragStart,
  onDragEnd
}) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const piece = e.dataTransfer.getData('text/plain');
    const fromSquare = e.dataTransfer.getData('square');
    
    console.log('Drop event:', { fromSquare, toSquare: square, piece });
    
    if (fromSquare && piece) {
      console.log('Calling onPieceDrop with:', { fromSquare, toSquare: square });
      onPieceDrop(fromSquare, square);
    }
  };

  return (
    <Box
      onClick={() => onSquareClick(square)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        width: { xs: 40, sm: 56, md: 72 },
        height: { xs: 40, sm: 56, md: 72 },
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isLight ? LIGHT_SQUARE : DARK_SQUARE,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        '&:hover': {
          backgroundColor: isLight 
            ? 'rgba(240, 217, 181, 0.9)' 
            : 'rgba(181, 136, 99, 0.9)'
        },
        ...(isSelected && {
          backgroundColor: SELECTED_SQUARE
        }),
        ...(isHighlighted && {
          backgroundColor: SELECTED_SQUARE
        }),
        ...(isValidDropTarget && {
          backgroundColor: isLight ? '#B7E4C7' : '#95D5B2'
        })
      }}
    >
      {piece && (
        <ChessPiece 
          piece={piece} 
          square={square} 
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      )}
      <Box
        sx={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          fontSize: '0.7rem',
          color: isLight ? DARK_SQUARE : LIGHT_SQUARE,
          opacity: 0.7,
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        {square}
      </Box>
    </Box>
  );
} 