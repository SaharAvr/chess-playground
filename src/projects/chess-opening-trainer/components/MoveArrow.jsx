import React from 'react';
import { Box } from '@mui/material';
import Xarrow from 'react-xarrows';

const calculateSquareCenter = (square) => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7 for a-h
  const rank = 8 - parseInt(square[1]); // 0-7 for 8-1
  return {
    x: (file + 0.5) * (100 / 8),
    y: (rank + 0.5) * (100 / 8)
  };
};

const parseFEN = (fen) => {
  const [position, turn] = fen.split(' ');
  const pieces = {};
  const ranks = position.split('/');
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  ranks.forEach((rank, rankIndex) => {
    let fileIndex = 0;
    
    for (let i = 0; i < rank.length; i++) {
      const char = rank[i];
      
      if (/\d/.test(char)) {
        fileIndex += parseInt(char, 10);
      } else {
        const square = `${files[fileIndex]}${8 - rankIndex}`;
        pieces[square] = char;
        fileIndex++;
      }
    }
  });

  return { pieces, turn };
};

export default function MoveArrow({ from, to, position }) {
  const { pieces, turn } = parseFEN(position);
  
  // Only show arrows on white's turn
  if (turn !== 'w') {
    return null;
  }

  const fromPiece = pieces[from];
  
  // Only render the arrow if the starting square has a white piece (uppercase letter)
  if (!fromPiece || fromPiece !== fromPiece.toUpperCase()) {
    return null;
  }

  const fromCenter = calculateSquareCenter(from);
  const toCenter = calculateSquareCenter(to);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      <div id={`from-${from}-${to}`} style={{ 
        position: 'absolute',
        left: `${fromCenter.x}%`,
        top: `${fromCenter.y}%`,
        width: '1px',
        height: '1px'
      }} />
      <div id={`to-${from}-${to}`} style={{ 
        position: 'absolute',
        left: `${toCenter.x}%`,
        top: `${toCenter.y}%`,
        width: '1px',
        height: '1px'
      }} />
      <Xarrow
        start={`from-${from}-${to}`}
        end={`to-${from}-${to}`}
        color="#4CAF50"
        strokeWidth={2}
        headSize={4}
        path="straight"
        showHead={true}
        showTail={false}
        opacity={0.7}
      />
    </Box>
  );
} 