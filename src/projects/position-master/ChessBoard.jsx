import React from 'react';
import { Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { ChessSquare } from './ChessSquare';
import { ResultOverlay } from './ResultOverlay';

export function ChessBoard({ result, selectedSquare, landingPiece, onSquareClick, gameMode }) {
  const squares = [];
  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const square = String.fromCharCode(97 + file) + (rank + 1);
      const isLight = (rank + file) % 2 === 0;
      squares.push(
        <ChessSquare
          key={square}
          square={square}
          isLight={isLight}
          result={result}
          selectedSquare={selectedSquare}
          landingPiece={landingPiece}
          onSquareClick={onSquareClick}
          gameMode={gameMode}
        />
      );
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '600px',
        aspectRatio: '1',
        display: 'flex',
        flexWrap: 'wrap',
        border: '8px solid #8B4513',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        position: 'relative',
      }}
    >
      {squares}
      <AnimatePresence>
        {result && <ResultOverlay result={result} />}
      </AnimatePresence>
    </Box>
  );
} 