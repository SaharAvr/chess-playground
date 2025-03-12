import React from 'react';
import { Box } from '@mui/material';
import ChessPiece from './ChessPiece';

const LIGHT_SQUARE = '#F0D9B5';
const DARK_SQUARE = '#B58863';
const SELECTED_SQUARE = 'rgba(62, 142, 185, 0.9)';

export default function ChessSquare({ square, piece, isLight, isSelected, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: { xs: 40, sm: 56, md: 72 },
        height: { xs: 40, sm: 56, md: 72 },
        backgroundColor: isSelected ? SELECTED_SQUARE : (isLight ? LIGHT_SQUARE : DARK_SQUARE),
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        '&:hover': {
          backgroundColor: isSelected 
            ? SELECTED_SQUARE 
            : (isLight 
              ? 'rgba(240, 217, 181, 0.9)' 
              : 'rgba(181, 136, 99, 0.9)')
        },
        // Show coordinates on the edges
        '&::after': {
          content: square.length === 2 ? `"${square}"` : '""',
          position: 'absolute',
          fontSize: '10px',
          color: isLight ? DARK_SQUARE : LIGHT_SQUARE,
          opacity: 0.7,
          bottom: 2,
          right: 2,
          pointerEvents: 'none',
        }
      }}
    >
      {piece && <ChessPiece piece={piece} />}
    </Box>
  );
} 