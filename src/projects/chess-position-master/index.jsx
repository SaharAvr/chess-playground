import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Container, Select, MenuItem, FormControl, InputLabel, Tooltip, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Piece } from '@chessire/pieces';
import { motion } from 'framer-motion';
import { ChessBoard } from './ChessBoard';
import { ChessPiece } from './ChessPiece';
import { PIECE_NAMES } from './constants';

const MotionBox = motion.create(Box);

const GAME_MODES = {
  drag: {
    label: 'Drag & Drop',
    description: 'Drag and drop the correct piece onto the target square'
  },
  clickPieceFirst: {
    label: 'Click Piece First',
    description: 'First click the correct piece, then click the target square'
  },
  clickSquareFirst: {
    label: 'Click Square First',
    description: 'First click the target square, then click the correct piece'
  }
};

function PieceBox({ piece, onClick, isSelected, disabled }) {
  return (
    <MotionBox
      onClick={onClick}
      whileHover={!disabled ? { scale: 1.1 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      sx={{
        width: 72,
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        borderRadius: 1,
        backgroundColor: isSelected ? '#E2E8F0' : 'transparent',
        '&:hover': !disabled ? {
          backgroundColor: '#F1F5F9'
        } : undefined,
      }}
    >
      <Piece
        piece={piece}
        color="white"
        width={64}
        height={64}
      />
    </MotionBox>
  );
}

export function ChessPositionMaster() {
  const [currentPiece, setCurrentPiece] = useState('P');
  const [currentSquare, setCurrentSquare] = useState('e4');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState(null);
  const [activePiece, setActivePiece] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [gameMode, setGameMode] = useState('drag');
  const [selectedPiece, setSelectedPiece] = useState(null);

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

  const handleGameModeChange = (event) => {
    const newMode = event.target.value;
    setGameMode(newMode);
    setSelectedPiece(null);
    setSelectedSquare(null);
    setResult(null);
  };

  const handleSquareClick = (square) => {
    if (gameMode === 'drag') return;
    
    if (gameMode === 'clickPieceFirst') {
      if (!selectedPiece) return;
      
      setAttempts(prev => prev + 1);
      if (selectedPiece === currentPiece && square === currentSquare) {
        setScore(prev => prev + 1);
        setResult('correct');
        setTimeout(() => {
          setSelectedSquare(null);
          setSelectedPiece(null);
          generateNewPosition();
        }, 800);
      } else {
        setResult('wrong');
        setTimeout(() => {
          setSelectedSquare(null);
          setSelectedPiece(null);
          setResult(null);
        }, 800);
      }
    } else if (gameMode === 'clickSquareFirst') {
      setSelectedSquare(square);
    }
  };

  const handlePieceClick = (piece) => {
    if (gameMode === 'drag') return;
    if (result === 'correct') return;
    
    if (gameMode === 'clickPieceFirst') {
      setSelectedPiece(piece);
    } else if (gameMode === 'clickSquareFirst' && selectedSquare) {
      setAttempts(prev => prev + 1);
      if (piece === currentPiece && selectedSquare === currentSquare) {
        setScore(prev => prev + 1);
        setResult('correct');
        setTimeout(() => {
          setSelectedSquare(null);
          setSelectedPiece(null);
          generateNewPosition();
        }, 800);
      } else {
        setResult('wrong');
        setTimeout(() => {
          setSelectedSquare(null);
          setSelectedPiece(null);
          setResult(null);
        }, 800);
      }
    }
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
              border: '1px solid #E2E8F0',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography sx={{ color: '#64748B' }}>
              Score: <strong>{score}</strong>
            </Typography>
            <Typography sx={{ color: '#64748B' }}>
              Accuracy: <strong>{attempts ? Math.round((score / attempts) * 100) : 0}%</strong>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="game-mode-label">Game Mode</InputLabel>
                <Select
                  labelId="game-mode-label"
                  id="game-mode-select"
                  value={gameMode}
                  label="Game Mode"
                  onChange={handleGameModeChange}
                >
                  {Object.entries(GAME_MODES).map(([mode, { label }]) => (
                    <MenuItem key={mode} value={mode}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip 
                title={GAME_MODES[gameMode].description}
                arrow
                placement="top"
              >
                <IconButton size="small" sx={{ color: '#64748B' }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={resetGame}
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

          {gameMode === 'drag' ? (
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
                onSquareClick={handleSquareClick}
                gameMode={gameMode}
              />

              <Box sx={{ 
                mt: 0.5, 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {Object.keys(PIECE_NAMES).map((piece) => (
                  <ChessPiece
                    key={piece}
                    piece={piece}
                    disabled={result === 'correct'}
                    isDraggable={true}
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
                      width={64}
                      height={64}
                    />
                  </Box>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <>
              <ChessBoard 
                result={result} 
                selectedSquare={selectedSquare}
                landingPiece={currentPiece}
                onSquareClick={handleSquareClick}
                gameMode={gameMode}
              />

              <Box sx={{ 
                mt: 0.5, 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {Object.keys(PIECE_NAMES).map((piece) => (
                  <ChessPiece
                    key={piece}
                    piece={piece}
                    onClick={() => handlePieceClick(piece)}
                    isSelected={selectedPiece === piece}
                    disabled={result === 'correct'}
                    isDraggable={false}
                  />
                ))}
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
} 