import React from 'react';
import { Box } from '@mui/material';
import ChessSquare from './ChessSquare';
import { getSquareColor } from '../utils/chess';

const BOARD_SIZE = 8;

const ChessBoard = React.forwardRef(({ position, selectedSquares, threatenedPieces, onSquareClick, isGameOver }, ref) => {
  const renderSquare = (i) => {
    const file = i % 8;
    const rank = Math.floor(i / 8);
    const square = `${String.fromCharCode(97 + file)}${8 - rank}`;
    const piece = position[square];
    const isSelected = selectedSquares.includes(square);
    const isThreatened = threatenedPieces.includes(square);
    const isLight = getSquareColor(square) === 'light';

    return (
      <ChessSquare
        key={square}
        square={square}
        piece={piece}
        isLight={isLight}
        isSelected={isSelected}
        isThreatened={isThreatened}
        onClick={() => onSquareClick(square)}
        isGameOver={isGameOver}
        position={position}
        threatenedPieces={threatenedPieces}
      />
    );
  };

  return (
    <Box
      ref={ref}
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        width: '100%',
        aspectRatio: '1',
        maxWidth: '600px',
        mx: 'auto',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => renderSquare(i))}
    </Box>
  );
});

export default ChessBoard;
