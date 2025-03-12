import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Piece } from '@chessire/pieces';
import { ChessBoard } from './ChessBoard';
import { DraggablePiece } from './DraggablePiece';
import { PIECE_NAMES } from './constants';

export function ChessPositionMaster() {
  const [currentPiece, setCurrentPiece] = useState('P');
  const [currentSquare, setCurrentSquare] = useState('e4');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState(null);
  const [activePiece, setActivePiece] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const generateNewPosition = () => {
    const pieces = ['P', 'N', 'B', 'R', 'Q', 'K'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    const piece = pieces[Math.floor(Math.random() * pieces.length)];
    const file = files[Math.floor(Math.random() * files.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    
    setCurrentPiece(piece);
    setCurrentSquare(file + rank);
    setResult(null);
  };

  useEffect(() => {
    generateNewPosition();
  }, []);

  const handleDragStart = (event) => {
    setActivePiece(event.active.id);
    setResult(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActivePiece(null);
    
    if (!over) return;
    
    setSelectedSquare(over.id);
    setAttempts(prev => prev + 1);
    
    if (active.id === currentPiece && over.id === currentSquare) {
      setScore(prev => prev + 1);
      setResult('correct');
      setTimeout(() => {
        setSelectedSquare(null);
        generateNewPosition();
      }, 800);
    } else {
      setResult('wrong');
      setTimeout(() => {
        setSelectedSquare(null);
        setResult(null);
      }, 800);
    }
  };

  const resetGame = () => {
    setScore(0);
    setAttempts(0);
    generateNewPosition();
  };

  return (
    <Box sx={{ 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Paper 
            elevation={0} 
            sx={{ 
              py: 1,
              px: 2, 
              display: 'inline-flex', 
              gap: 2,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}
          >
            <Typography sx={{ color: '#64748B' }}>
              Score: <strong>{score}</strong>
            </Typography>
            <Typography sx={{ color: '#64748B' }}>
              Accuracy: <strong>{attempts ? Math.round((score / attempts) * 100) : 0}%</strong>
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={resetGame}
              sx={{ ml: 2 }}
            >
              Reset
            </Button>
          </Paper>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#1E293B',
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <Box component="span" sx={{ color: '#64748B', fontSize: '0.8em' }}>
              Move the
            </Box>
            {PIECE_NAMES[currentPiece]}
            <Box component="span" sx={{ color: '#64748B', fontSize: '0.8em' }}>
              onto
            </Box>
            {currentSquare}
          </Typography>

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
            autoScroll={false}
          >
            <ChessBoard 
              result={result} 
              selectedSquare={selectedSquare}
              landingPiece={currentPiece}
            />

            <Box sx={{ 
              mt: 0.5, 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {Object.keys(PIECE_NAMES).map((piece) => (
                <DraggablePiece 
                  key={piece}
                  piece={piece} 
                  disabled={result === 'correct'}
                />
              ))}
            </Box>

            <DragOverlay>
              {activePiece ? (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grabbing',
                }}>
                  <Piece
                    piece={activePiece}
                    color="white"
                    width={56}
                    height={56}
                  />
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>
        </Box>
      </Container>
    </Box>
  );
} 