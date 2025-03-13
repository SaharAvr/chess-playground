import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ChessSquare from './ChessSquare';
import MoveArrow from './MoveArrow';
import { Chess } from 'chess.js';

const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export default function ChessBoard({ 
  position, 
  onMove, 
  selectedSquare, 
  highlightedMove
}) {
  const [validDropTargets, setValidDropTargets] = useState([]);
  const [draggedSquare, setDraggedSquare] = useState(null);
  const chess = new Chess(position);

  const getValidMoves = (square) => {
    const moves = chess.moves({ square, verbose: true });
    return moves.map(move => move.to);
  };

  const handlePieceDragStart = (square) => {
    console.log('Drag start:', square);
    setDraggedSquare(square);
    const validMoves = getValidMoves(square);
    setValidDropTargets(validMoves);
  };

  const handlePieceDragEnd = () => {
    console.log('Drag end');
    setDraggedSquare(null);
    setValidDropTargets([]);
  };

  const handlePieceDrop = (fromSquare, toSquare) => {
    console.log('Handling piece drop:', { fromSquare, toSquare });
    try {
      const move = chess.move({
        from: fromSquare,
        to: toSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });
      
      console.log('Move result:', move);
      
      if (move && onMove) {
        console.log('Calling onMove with:', move);
        onMove(move);
      } else {
        console.log('Move invalid or onMove not provided');
      }
    } catch (error) {
      console.error('Invalid move:', error);
    } finally {
      handlePieceDragEnd();
    }
  };

  const renderSquare = (square, isLight) => {
    const piece = chess.get(square);
    return (
      <ChessSquare
        key={square}
        square={square}
        piece={piece ? (piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()) : null}
        isLight={isLight}
        isSelected={square === selectedSquare}
        isHighlighted={square === draggedSquare}
        isValidDropTarget={validDropTargets.includes(square)}
        onSquareClick={() => onMove && onMove({ from: square, to: square })}
        onPieceDrop={handlePieceDrop}
        onDragStart={handlePieceDragStart}
        onDragEnd={handlePieceDragEnd}
      />
    );
  };

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
                const isLight = (rankIndex + fileIndex) % 2 === 0;
                return renderSquare(square, isLight);
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
