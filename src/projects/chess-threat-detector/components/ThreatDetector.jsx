import React, { useState, useEffect, useCallback } from 'react';
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
import { Settings as SettingsIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import ChessBoard from './ChessBoard';
import Stats from './Stats';
import { createRandomPosition, findThreatenedPieces, GAME_PHASES } from '../utils/chess';

const MotionPaper = motion.create(Paper);
const MotionChip = motion.create(Chip);

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

  const startNewTurn = useCallback(async () => {
    console.log('Starting new turn...');
    setIsLoading(true);
    try {
      const newPosition = await createRandomPosition(gamePhase);
      console.log('New position created:', newPosition);
      setPosition(newPosition);
      setSelectedSquares([]);
      setTimeLeft(timeLimit);
      setIsGameOver(false);
      setShowResults(false);
      setShowSolution(false);
      const threatened = findThreatenedPieces(newPosition);
      console.log('Threatened pieces found:', threatened);
      setThreatenedPieces(threatened);
    } catch (error) {
      console.error('Error starting new turn:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeLimit, gamePhase]);

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
      setIsGameOver(true);
      setShowResults(true);
    }
  }, [timeLeft, isGameOver, position, startNewTurn, showSolution]);

  useEffect(() => {
    console.log('Game state changed:', {
      isGameOver,
      showSolution,
      showResults,
      threatenedPieces
    });
  }, [isGameOver, showSolution, showResults, threatenedPieces]);

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
    setIsGameOver(true);
    setShowResults(true);
  };

  const handleNextTurn = () => {
    const correct = selectedSquares.filter(square => threatenedPieces.includes(square)).length;
    const wrong = selectedSquares.filter(square => !threatenedPieces.includes(square)).length;
    const missed = threatenedPieces.filter(square => !selectedSquares.includes(square)).length;

    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + correct,
      wrong: prev.wrong + wrong,
      missed: prev.missed + missed,
    }));

    setShowResults(false);
    startNewTurn();
  };

  const handleTimeChange = (event) => {
    const newTime = event.target.value;
    setTimeLimit(newTime);
    setTimeLeft(newTime);
  };

  const handleGamePhaseChange = (event) => {
    setGamePhase(event.target.value);
  };

  return (
    <Box 
      sx={{ 
        p: { xs: 1, sm: 2 }, 
        maxWidth: 1400, 
        mx: 'auto',
        minHeight: '100vh',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#fff'
      }}
    >
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <MotionPaper
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            sx={{
              p: 1,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 0,
              p: 0.5,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 1,
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                {!isGameOver && !showSolution && (
                  <Tooltip title="Reveal solution">
                    <IconButton
                      size="small"
                      onClick={() => {
                        console.log('Reveal solution button clicked');
                        console.log('Current threatened pieces:', threatenedPieces);
                        setShowSolution(true);
                        setIsGameOver(true);
                        const threatened = findThreatenedPieces(position, true);
                        setThreatenedPieces(threatened);
                        console.log('Setting showSolution and isGameOver to true');
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
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CircularProgress sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </Box>
            ) : (
              position && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, mt: -1 }}>
                    <ChessBoard
                      position={position}
                      selectedSquares={selectedSquares}
                      threatenedPieces={showResults || showSolution ? threatenedPieces : []}
                      onSquareClick={handleSquareClick}
                      isGameOver={isGameOver || showSolution}
                    />
                  </Box>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    {!isGameOver && !showSolution && (
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
                    )}
                    {showSolution && (
                      <Button
                        variant="contained"
                        onClick={startNewTurn}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          },
                        }}
                      >
                        Next Position
                      </Button>
                    )}
                  </Box>
                </Box>
              )
            )}
          </MotionPaper>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Stats stats={stats} />
        </Grid>
      </Grid>

      <Dialog
        open={showResults}
        onClose={() => setShowResults(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Results
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
  );
} 