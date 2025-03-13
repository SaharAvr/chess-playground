import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ChessBoard from './ChessBoard';
import { getAllOpenings, getOpeningByKey } from '../utils/chess';
import useChessGame from '../hooks/useChessGame';

const MotionPaper = motion.create(Paper);
const MotionBox = motion.create(Box);

export default function OpeningTrainer() {
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleCorrectMove = useCallback((move) => {
    setFeedback(`Correct! ${move} is a common move in this position.`);
    setIsCorrect(true);
  }, []);

  const handleIncorrectMove = useCallback((move) => {
    setFeedback(`${move} is not a common move in this position. Try another move!`);
    setIsCorrect(false);
  }, []);

  const {
    position,
    selectedSquare,
    openingData,
    loading,
    highlightedMove,
    handleSquareClick,
    reset,
    playMove,
    undo,
    handleMoveHover,
    handleMoveHoverEnd
  } = useChessGame(handleCorrectMove, handleIncorrectMove);

  const openings = getAllOpenings();
  const currentOpening = selectedOpening ? getOpeningByKey(selectedOpening) : null;

  const handleOpeningChange = (event) => {
    setSelectedOpening(event.target.value);
    setFeedback(null);
    setIsCorrect(false);
    reset();
  };

  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        maxWidth: 1400, 
        mx: 'auto',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#fff'
      }}
    >
      <Box sx={{ mb: { xs: 3, sm: 4 }, textAlign: 'center' }}>
        <Select
          value={selectedOpening || ''}
          onChange={handleOpeningChange}
          displayEmpty
          sx={{
            minWidth: { xs: 280, sm: 320 },
            '.MuiSelect-select': {
              py: 1.5,
            },
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.4)',
            },
          }}
        >
          <MenuItem value="">
            <em>Select an opening to practice</em>
          </MenuItem>
          {openings.map((opening) => (
            <MenuItem key={opening.key} value={opening.key}>
              {opening.name}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {selectedOpening && (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            gap: { xs: 3, sm: 4 },
            alignItems: { xs: 'center', md: 'flex-start' }
          }}
        >
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 3,
              p: { xs: 1, sm: 2 },
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ChessBoard
              position={position}
              onMove={handleSquareClick}
              selectedSquare={selectedSquare}
              highlightedMove={highlightedMove}
            />
          </MotionBox>

          <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
            <MotionPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{ 
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#fff',
                    flex: 1
                  }}
                >
                  {currentOpening.name}
                </Typography>
                <Tooltip title="Undo last move">
                  <IconButton onClick={undo} size="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <UndoIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset position">
                  <IconButton onClick={reset} size="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography 
                variant="body1"
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 3,
                  lineHeight: 1.6
                }}
              >
                {currentOpening.description}
              </Typography>

              <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <Box sx={{ minHeight: 200 }}>
                {loading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    opacity: 0.5
                  }}>
                    <CircularProgress size={24} sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </Box>
                ) : (
                  <MotionBox
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {feedback && (
                      <MotionBox 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        sx={{ 
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: isCorrect 
                            ? 'rgba(46, 125, 50, 0.15)'
                            : 'rgba(211, 47, 47, 0.15)',
                          border: `1px solid ${isCorrect 
                            ? 'rgba(46, 125, 50, 0.3)'
                            : 'rgba(211, 47, 47, 0.3)'}`,
                          mb: 3,
                          backdropFilter: 'blur(5px)'
                        }}
                      >
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                          {feedback}
                        </Typography>
                      </MotionBox>
                    )}

                    {openingData && openingData.moves.length > 0 && (
                      <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ 
                            fontWeight: 600,
                            color: '#fff',
                            mb: 2,
                            opacity: 0.9
                          }}
                        >
                          Popular moves in this position:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {openingData.moves.slice(0, 5).map((move, index) => (
                            <Tooltip 
                              key={index}
                              title={`Win rate: ${Math.round(move.white * 100)}%`}
                              enterDelay={400}
                              arrow
                            >
                              <Chip
                                icon={<PlayArrowIcon sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />}
                                label={move.san}
                                onClick={() => playMove(move.san)}
                                onMouseEnter={() => {
                                  console.log('Chip mouse enter:', move.san);
                                  handleMoveHover(move.san);
                                }}
                                onMouseLeave={() => {
                                  console.log('Chip mouse leave');
                                  handleMoveHoverEnd();
                                }}
                                sx={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                  color: '#fff',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                    borderColor: 'rgba(255, 255, 255, 0.25)',
                                  },
                                }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </MotionBox>
                    )}
                  </MotionBox>
                )}
              </Box>
            </MotionPaper>

            {currentOpening.variations && (
              <MotionPaper
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                sx={{ 
                  p: 3,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 600,
                    color: '#fff',
                    mb: 2
                  }}
                >
                  Key Variations
                </Typography>
                {currentOpening.variations.map((variation, index) => (
                  <Box key={index} sx={{ mb: index < currentOpening.variations.length - 1 ? 3 : 0 }}>
                    <Typography 
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        color: '#fff',
                        mb: 1
                      }}
                    >
                      {variation.name}
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        mb: 1
                      }}
                    >
                      {variation.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {variation.moves.map((move, moveIndex) => (
                        <Chip
                          key={moveIndex}
                          label={move}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </MotionPaper>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
} 