import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { motion, AnimatePresence } from 'framer-motion';
import { Piece } from '@chessire/pieces';

const MotionBox = motion(Box);

const PIECE_NAMES = {
  'P': 'Pawn',
  'N': 'Knight',
  'B': 'Bishop',
  'R': 'Rook',
  'Q': 'Queen',
  'K': 'King',
};

function ChessSquare({ square, isLight, children, result, selectedSquare, landingPiece }) {
  const { isOver, setNodeRef } = useDroppable({
    id: square,
  });

  const isSelected = square === selectedSquare;
  const baseColor = isLight ? '#F0D9B5' : '#B58863';

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: '12.5%',
        aspectRatio: '1',
        backgroundColor: baseColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <AnimatePresence>
        {isOver && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isLight ? 'rgba(103, 178, 230, 0.3)' : '#C49B76',
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>
      {isSelected && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: result === 'correct' ? '#059669' : '#DC2626',
            zIndex: 1,
          }}
        />
      )}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {children}
      </Box>
      {isSelected && result === 'correct' && (
        <MotionBox
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.8 }}
          sx={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <Piece
            piece={landingPiece}
            color="white"
            width={48}
            height={48}
          />
        </MotionBox>
      )}
    </Box>
  );
}

function ChessBoard({ result, selectedSquare, landingPiece }) {
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
        {result && (
          <MotionBox
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Box
              sx={{
                backgroundColor: result === 'correct' ? 'rgba(5, 150, 105, 0.95)' : 'rgba(220, 38, 38, 0.95)',
                borderRadius: '16px',
                padding: '16px 32px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  color: 'white',
                  fontWeight: 700,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {result === 'correct' ? (
                  <MotionBox
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 10 }}
                    transition={{ duration: 0.2, repeat: 3, repeatType: "reverse" }}
                  >
                    Correct! 🎉
                  </MotionBox>
                ) : (
                  <MotionBox
                    initial={{ x: -5 }}
                    animate={{ x: 5 }}
                    transition={{ duration: 0.1, repeat: 3, repeatType: "reverse" }}
                  >
                    Try Again
                  </MotionBox>
                )}
              </Typography>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

function DraggablePiece({ piece, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: piece,
    disabled,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  return (
    <MotionBox
      whileHover={disabled ? {} : { scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Box
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        sx={{
          width: '80px',
          height: '80px',
          backgroundColor: 'transparent',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'grab',
          opacity: isDragging ? 0 : (disabled ? 0.5 : 1),
          touchAction: 'none',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <Piece
          piece={piece}
          color="white"
          width={56}
          height={56}
        />
      </Box>
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