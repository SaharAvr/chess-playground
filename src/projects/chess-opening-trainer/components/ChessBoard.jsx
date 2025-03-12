import React from 'react';
import { Box, Typography } from '@mui/material';
import ChessSquare from './ChessSquare';
import MoveArrow from './MoveArrow';

const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export default function ChessBoard({ position, onSquareClick, selectedSquare, highlightedMove }) {
  const pieces = parseFEN(position);

  return (
    <Box
      sx={{
        display: 'inline-block',
        padding: { xs: 1, sm: 2 },
        background: '#8B4513',
        borderRadius: 2,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gridTemplateRows: '1fr auto',
          gap: 0.5,
        }}
      >
        {/* Rank labels (left side) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', pr: 1 }}>
          {RANKS.map(rank => (
            <Typography
              key={rank}
              sx={{
                color: '#FFF',
                fontSize: { xs: '10px', sm: '12px' },
                fontWeight: 500,
                height: { xs: 40, sm: 56, md: 72 },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {rank}
            </Typography>
          ))}
        </Box>

        {/* Main board */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid #603808',
            borderRadius: 1,
            position: 'relative',
          }}
        >
          {RANKS.map((rank, rankIndex) => (
            <Box
              key={rank}
              sx={{
                display: 'flex',
              }}
            >
              {FILES.map((file, fileIndex) => {
                const square = `${file}${rank}`;
                const piece = pieces[square];
                const isLight = (rankIndex + fileIndex) % 2 === 0;
                const isSelected = selectedSquare === square;

                return (
                  <ChessSquare
                    key={square}
                    square={square}
                    piece={piece}
                    isLight={isLight}
                    isSelected={isSelected}
                    onClick={() => onSquareClick(square)}
                  />
                );
              })}
            </Box>
          ))}
          {highlightedMove && (
            <Box sx={{ position: 'absolute', inset: 0 }}>
              <MoveArrow from={highlightedMove.from} to={highlightedMove.to} position={position} />
            </Box>
          )}
        </Box>

        {/* Rank labels (right side) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', pl: 1 }}>
          {RANKS.map(rank => (
            <Typography
              key={rank}
              sx={{
                color: '#FFF',
                fontSize: { xs: '10px', sm: '12px' },
                fontWeight: 500,
                height: { xs: 40, sm: 56, md: 72 },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {rank}
            </Typography>
          ))}
        </Box>

        {/* File labels */}
        <Box sx={{ gridColumn: '2/3', display: 'flex', justifyContent: 'space-around', pt: 1 }}>
          {FILES.map(file => (
            <Typography
              key={file}
              sx={{
                color: '#FFF',
                fontSize: { xs: '10px', sm: '12px' },
                fontWeight: 500,
                width: { xs: 40, sm: 56, md: 72 },
                textAlign: 'center',
              }}
            >
              {file}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function parseFEN(fen) {
  const pieces = {};
  const [position] = fen.split(' ');
  const ranks = position.split('/');

  ranks.forEach((rank, rankIndex) => {
    let fileIndex = 0;
    
    for (let i = 0; i < rank.length; i++) {
      const char = rank[i];
      
      if (/\d/.test(char)) {
        fileIndex += parseInt(char, 10);
      } else {
        const square = `${FILES[fileIndex]}${RANKS[rankIndex]}`;
        pieces[square] = char;
        fileIndex++;
      }
    }
  });

  return pieces;
} 