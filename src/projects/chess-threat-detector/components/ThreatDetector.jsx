import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Visibility as VisibilityIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import ChessBoard from './ChessBoard';
import Stats from './Stats';
import { fetchRandomPosition, findThreatenedPieces, GAME_PHASES } from '../utils/chess';

const MotionPaper = motion.create(Paper);
const MotionChip = motion.create(Chip);
const MotionBox = motion.create(Box);

const TIME_OPTIONS = [10, 20, 30];

export default function ThreatDetector() {
  const [position, setPosition] = useState(null);
  const [selectedSquares, setSelectedSquares] = useState([]);
  const [timeLimit, setTimeLimit] = useState(10);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    wrong: 0,
    missed: 0,
  });
  const [threatenedPieces, setThreatenedPieces] = useState([]);
  const [showSolution, setShowSolution] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.RANDOM);
  const [learningQueue, setLearningQueue] = useState([]);
  const [didCloseResultsDialog, setDidCloseResultsDialog] = useState(false);
  const [didRevealSolution, setDidRevealSolution] = useState(false);
  const [lastBoardHeight, setLastBoardHeight] = useState(0);
  const boardRef = useRef(null);

  const startNewTurn = useCallback(async () => {
    setIsLoading(true);
    try {
      let newPosition;

      // If there are positions in the learning queue, have a 30% chance to review one
      if (learningQueue.length > 0 && Math.random() < 0.3) {
        // Randomly select a position from the learning queue
        const randomIndex = Math.floor(Math.random() * learningQueue.length);
        newPosition = learningQueue[randomIndex];
        // Move the selected position to the front of the queue
        if (randomIndex !== 0) {
          setLearningQueue(prev => {
            const newQueue = [...prev];
            const [selected] = newQueue.splice(randomIndex, 1);
            return [selected, ...newQueue];
          });
        }
      } else {
        newPosition = await fetchRandomPosition(gamePhase);
      }

      setPosition(newPosition);
      setSelectedSquares([]);
      setTimeLeft(timeLimit);
      setIsGameOver(false);
      setShowResults(false);
      setShowSolution(false);
      setThreatenedPieces([]);
      setDidCloseResultsDialog(false);
      setDidRevealSolution(false);
    } catch (error) {
      console.error('Error starting new turn:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeLimit, gamePhase, learningQueue]);

  const calculateThreatenedPieces = useCallback(() => {
    if (!position) return;
    const { threatenedPieces: threatened } = findThreatenedPieces(position);
    setThreatenedPieces(threatened);
    return threatened;
  }, [position]);

  const handleSquareClick = (square) => {
    if (isGameOver || showSolution) return;

    setSelectedSquares(prev => {
      if (prev.includes(square)) {
        return prev.filter(s => s !== square);
      }
      return [...prev, square];
    });
  };

  const handleContinue = () => {
    const threatenedPieces = calculateThreatenedPieces();
    setIsGameOver(true);

    if (didCloseResultsDialog) {
      handleNextTurn();
      return;
    }

    // Check if there are any mistakes
    const wrong = selectedSquares.some(square => !threatenedPieces.includes(square));
    const missed = threatenedPieces.some(square => !selectedSquares.includes(square));
    const correct = !wrong && !missed;

    if (correct) {
      // Show success animation and start next turn after animation
      setShowResults(false);
      // Wait for animation to complete before starting next turn
      setTimeout(() => {
        handleNextTurn();
      }, 1000); // 250ms for fade in + 500ms display + 250ms fade out
    } else {
      setShowResults(true);
    }
  };

  const handleNextTurn = useCallback(() => {
    const threatenedPieces = calculateThreatenedPieces();

    const wrong = selectedSquares.some(square => !threatenedPieces.includes(square));
    const missed = threatenedPieces.some(square => !selectedSquares.includes(square));
    const correct = !wrong && !missed;

    // Update stats
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (wrong ? 1 : 0),
      missed: prev.missed + (missed ? 1 : 0),
    }));

    // If the position wasn't solved perfectly
    if (wrong || missed) {
      // Keep the current position in the queue if it's not already there
      if (!learningQueue.includes(position)) {
        setLearningQueue(prev => [position, ...prev]);
      }
      // Reset the current position to try again
      setShowResults(false);
      setSelectedSquares([]);
      setTimeLeft(timeLimit);
      setIsGameOver(false);
      setShowSolution(false);
      return; // Don't proceed to new position
    }

    // Position was solved correctly
    if (learningQueue.length > 0 && learningQueue[0] === position) {
      setLearningQueue(prev => prev.slice(1));
    }

    // Clear current state before loading new position
    setPosition(null);
    setSelectedSquares([]);
    setThreatenedPieces([]);
    setShowResults(false);
    setIsGameOver(false);
    setShowSolution(false);
    setTimeLeft(timeLimit);
  }, [calculateThreatenedPieces, learningQueue, position, selectedSquares, timeLimit]);

  const handleTimeChange = (event) => {
    const newTime = event.target.value;
    setTimeLimit(newTime);
    setTimeLeft(newTime);
  };

  const handleGamePhaseChange = (event) => {
    setGamePhase(event.target.value);
  };

  useEffect(() => {
    if ((isGameOver || showSolution) && position) {
      calculateThreatenedPieces();
    }
  }, [isGameOver, showSolution, position, calculateThreatenedPieces]);

  useEffect(() => {
    if (!position) {
      startNewTurn();
      return;
    }

    if (timeLeft > 0 && !isGameOver && !showSolution) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isGameOver) {
      const threatenedPieces = calculateThreatenedPieces();
      const wrong = selectedSquares.some(square => !threatenedPieces.includes(square));
      const missed = threatenedPieces.some(square => !selectedSquares.includes(square));

      if (wrong || missed) {
        setShowResults(true);
      } else {
        setTimeout(() => {
          handleNextTurn();
        }, 1000);
      }

      setIsGameOver(true);
    }
  }, [timeLeft, isGameOver, position, startNewTurn, showSolution, calculateThreatenedPieces, selectedSquares, handleNextTurn]);

  useEffect(() => {
    if (position) {
      const boardHeight = boardRef.current?.offsetHeight;
      setLastBoardHeight(boardHeight);
    }
  }, [position]);

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      }}
    >
      <Box sx={{
        p: { xs: 1, sm: 2 },
        maxWidth: 1400,
        mx: 'auto',
        height: 'min-content',
        minHeight: 'calc(100vh - 65px)',
        maxHeight: 'min-content',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        position: 'relative'
      }}>
        <Grid container spacing={2} sx={{
          flex: 1,
          minHeight: 0,
          height: 'min-content',
          zoom: {
            xs: (() => {
              const width = window.innerWidth;
              if (width < 240) return Math.min(0.5, width / 480);
              if (width < 340) return 0.5;
              if (width < 600) return Math.min(1, width / 600);
              return 1;
            })(),
            sm: 1
          }
        }}>
          <Grid
            item
            xs={12}
            md={8}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              p: 0
            }}
          >
            <MotionPaper
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              sx={{
                p: 0,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                maxHeight: (lastBoardHeight > 0) ? (lastBoardHeight + 80) : 'min-content',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
              }}
            >
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 0.5,
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '4px 4px 0 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, pl: 1 }}>
                    Find Threatened Pieces
                  </Typography>
                  <AnimatePresence>
                    {!isGameOver && (
                      <MotionChip
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        label="Playing as White"
                        color="primary"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiChip-label': {
                            color: '#fff',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                          },
                        }}
                      />
                    )}
                  </AnimatePresence>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: timeLeft <= 3 ? '#ff4444' : '#fff',
                      fontWeight: 600
                    }}
                  >
                    Time: {timeLeft}s
                  </Typography>
                  {!showSolution && (
                    <Tooltip title="Reveal solution">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setDidRevealSolution(true);
                          setShowSolution(true);
                          setIsGameOver(true);
                        }}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: '#fff',
                          }
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => setShowSettings(true)}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Box>
              </Box>

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, p: 0 }}>
                  <CircularProgress sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </Box>
              ) : (
                position && (
                  <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    minHeight: 0,
                    p: 0,
                    my: { xs: 0, sm: 2 },
                    position: 'relative'
                  }}>
                    <Box sx={{
                      width: '-webkit-fill-available',
                      position: 'relative',
                      display: 'inline-block',
                      lineHeight: 0 // Remove any extra space
                    }}>
                      <ChessBoard
                        ref={boardRef}
                        position={position}
                        selectedSquares={selectedSquares}
                        threatenedPieces={(showSolution || isGameOver) ? threatenedPieces : []}
                        onSquareClick={handleSquareClick}
                        isGameOver={isGameOver || showSolution}
                      />
                      {/* Success Animation */}
                      <AnimatePresence>
                        {isGameOver && !showResults && !didCloseResultsDialog && !didRevealSolution && (
                          <MotionBox
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{
                              duration: 0.25,
                              opacity: { duration: 0.25 },
                              scale: { duration: 0.25 },
                            }}
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              margin: 'auto',
                              width: 'fit-content',
                              height: 'fit-content',
                              zIndex: 1000,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1,
                              pointerEvents: 'none',
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              padding: 3,
                              borderRadius: 2,
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50' }} />
                            <Typography variant="h6" sx={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                              Perfect!
                            </Typography>
                          </MotionBox>
                        )}
                      </AnimatePresence>
                    </Box>
                    {showSolution && !threatenedPieces?.length && (
                      <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
                        <Button
                          variant="contained"
                          sx={{
                            pointerEvents: 'none',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            },
                          }}
                        >
                          No threatened pieces
                        </Button>
                      </Box>
                    )}
                  </Box>
                )
              )}
            </MotionPaper>
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              <Stats stats={stats} />
              <Button
                variant="contained"
                onClick={handleContinue}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                Continue
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Dialog
          open={showResults}
          onClose={() => {
            setShowResults(false);
            setDidCloseResultsDialog(true);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: '#fff' }}>
            Results {learningQueue.length > 0 ? `(${learningQueue.length} positions to practice)` : ''}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#fff', mb: 2 }}>
              Threatened pieces: {threatenedPieces.length}
            </Typography>
            <Typography sx={{ color: '#fff', mb: 2 }}>
              Correctly identified: {selectedSquares.filter(square => threatenedPieces.includes(square)).length}
            </Typography>
            <Typography sx={{ color: '#fff', mb: 2 }}>
              Wrong selections: {selectedSquares.filter(square => !threatenedPieces.includes(square)).length}
            </Typography>
            <Typography sx={{ color: '#fff' }}>
              Missed pieces: {threatenedPieces.filter(square => !selectedSquares.includes(square)).length}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleNextTurn}
              sx={{
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Next Turn
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={showSettings}
          onClose={() => setShowSettings(false)}
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <DialogTitle sx={{ color: '#fff' }}>
            Settings
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Time Limit</InputLabel>
              <Select
                value={timeLimit}
                onChange={handleTimeChange}
                label="Time Limit"
                sx={{
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              >
                {TIME_OPTIONS.map(time => (
                  <MenuItem key={time} value={time}>{time} seconds</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Game Phase</InputLabel>
              <Select
                value={gamePhase}
                onChange={handleGamePhaseChange}
                label="Game Phase"
                sx={{
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              >
                <MenuItem value={GAME_PHASES.OPENING}>Opening (1-10 moves)</MenuItem>
                <MenuItem value={GAME_PHASES.MIDDLEGAME}>Middlegame (11-30 moves)</MenuItem>
                <MenuItem value={GAME_PHASES.ENDGAME}>Endgame (31-60 moves)</MenuItem>
                <MenuItem value={GAME_PHASES.RANDOM}>Random</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowSettings(false)}
              sx={{
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
} 