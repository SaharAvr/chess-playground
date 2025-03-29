import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  LinearProgress,
  Fade,
  Tooltip,
  IconButton,
  Grid,
  Zoom,
  useTheme,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TimerIcon from '@mui/icons-material/Timer';
import ScoreIcon from '@mui/icons-material/Score';
import PhaseIcon from '@mui/icons-material/AccountTree';
import BoardIcon from '@mui/icons-material/GridOn';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useChessGame } from '../hooks/useChessGame';
import { fetchRandomPosition, GAME_PHASES, calculateMoveProbability } from '../utils/chessUtils';
import ForkedBoards from './ForkedBoards';
import ScoreBreakdown from './ScoreBreakdown';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { FloatingBoard } from './FloatingBoard';
import { Chess } from 'chess.js';

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionButton = motion(Button);

export const ChessMovePredictor = () => {
  const {
    game,
    boards,
    score,
    makeMove,
    addBoard,
    removeBoard,
    makeMoveOnBoard,
    calculateTotalScore,
    setGame,
    setBoards,
    setScore
  } = useChessGame();

  const [gamePhase, setGamePhase] = useState(GAME_PHASES.RANDOM);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hasMadeFirstMove, setHasMadeFirstMove] = useState(false);
  const [showFloatingBoard, setShowFloatingBoard] = useState(false);
  const [tempBoard, setTempBoard] = useState(null);
  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [scoreAnimation, setScoreAnimation] = useState(0);

  // Motion values for score animation
  const scoreMotionValue = useMotionValue(0);
  const scoreScale = useTransform(scoreMotionValue, [0, 1], [1, 1.2]);
  const scoreOpacity = useTransform(scoreMotionValue, [0, 1], [1, 0.8]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    let timer;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      calculateTotalScore();
      setMessage('Time\'s up! Your score has been calculated.');
      setShowSuccess(true);
      setShowScoreBreakdown(true);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, calculateTotalScore]);

  // Spring animation for score changes
  useEffect(() => {
    if (scoreAnimation > 0) {
      scoreMotionValue.set(1);
      const spring = useSpring(scoreMotionValue, {
        stiffness: 300,
        damping: 20,
        from: 1,
        to: 0
      });
      return () => spring.stop();
    }
  }, [scoreAnimation]);

  const handleNewGame = async () => {
    setIsLoading(true);
    try {
      const newGame = await fetchRandomPosition(gamePhase);
      setGame(newGame);
      setBoards([]);
      setScore(0);
      setTimeLeft(30);
      setIsPlaying(true);
      setHasMadeFirstMove(false);
      setShowScoreBreakdown(false);
      setMessage('New game started! Make your first move to begin.');
      setShowSuccess(true);
    } catch (error) {
      console.error('Error fetching new position:', error);
      setMessage('Error starting new game. Please try again.');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBoard = () => {
    if (boards.length >= 3) {
      setMessage('Maximum 3 forks allowed per game!');
      setShowError(true);
      return;
    }
    setTempBoard({
      id: Date.now(),
      game: new Chess(game.fen()),
      moves: [],
      probability: 0
    });
    setShowFloatingBoard(true);
  };

  const handleFloatingBoardClose = () => {
    setShowFloatingBoard(false);
    setTempBoard(null);
  };

  const handleFloatingBoardConfirm = () => {
    if (tempBoard) {
      setIsAddingBoard(true);
      setTimeout(() => {
        setBoards(prev => [...prev, tempBoard]);
        setShowFloatingBoard(false);
        setTempBoard(null);
        setMessage('New board added successfully!');
        setShowSuccess(true);
        setIsAddingBoard(false);
      }, 300);
    }
  };

  const handleFloatingBoardMove = (move) => {
    if (tempBoard) {
      try {
        const newGame = new Chess(tempBoard.game.fen());
        const result = newGame.move(move);
        if (result) {
          const probability = calculateMoveProbability(newGame, move);
          setTempBoard({
            ...tempBoard,
            game: newGame,
            moves: [...tempBoard.moves, move],
            probability
          });
        }
      } catch (error) {
        console.error('Move validation error:', error);
      }
    }
  };

  const handleMakeMove = (boardId, move) => {
    if (!isPlaying) {
      setMessage('Game is over! Start a new game to continue.');
      setShowError(true);
      return;
    }

    const success = makeMoveOnBoard(boardId, move);
    if (success) {
      if (!hasMadeFirstMove) {
        setHasMadeFirstMove(true);
        setMessage('Great! Now you can add boards to explore different move paths.');
        setShowSuccess(true);
      } else {
        setMessage('Move made successfully!');
        setShowSuccess(true);
      }
    } else {
      setMessage('Invalid move! Try again.');
      setShowError(true);
    }
  };

  // Add this new function to handle moves on the main board
  const handleMainBoardMove = (move) => {
    if (!isPlaying) {
      setMessage('Game is over! Start a new game to continue.');
      setShowError(true);
      return;
    }

    const success = makeMove(move);
    if (success) {
      if (!hasMadeFirstMove) {
        setHasMadeFirstMove(true);
        setMessage('Great! Now you can add boards to explore different move paths.');
        setShowSuccess(true);
      } else {
        setMessage('Move made successfully!');
        setShowSuccess(true);
      }
    } else {
      setMessage('Invalid move! Try again.');
      setShowError(true);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ 
        py: { xs: 1, sm: 2, md: 4 },
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%),
            radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)
          `,
          zIndex: -1,
        }
      }}>
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 4 }}>
          {/* Main Board Column */}
          <Grid item xs={12} md={8}>
            <MotionPaper 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              elevation={3} 
              sx={{ 
                p: { xs: 1.5, sm: 2, md: 3 }, 
                width: '100%', 
                maxWidth: { xs: '100%', md: 800 },
                borderRadius: { xs: 2, sm: 3 },
                position: 'relative',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  transform: isMobile ? 'none' : 'translateY(-2px)',
                  boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.12)',
                  borderColor: 'primary.main'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at top right, rgba(14, 165, 233, 0.03) 0%, transparent 50%)',
                  borderRadius: { xs: 2, sm: 3 },
                  pointerEvents: 'none'
                }
              }}
            >
              {isLoading && (
                <MotionBox
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 1,
                    backdropFilter: 'blur(4px)',
                    borderRadius: { xs: 2, sm: 3 }
                  }}
                >
                  <CircularProgress size={isMobile ? 32 : 40} />
                </MotionBox>
              )}
              <Chessboard 
                position={game.fen()}
                boardOrientation="white"
                customBoardStyle={{
                  borderRadius: { xs: '4px', sm: '8px' },
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)'
                }}
                boardWidth={isMobile ? 300 : isTablet ? 400 : 500}
                onPieceDrop={(sourceSquare, targetSquare) => {
                  if (isPlaying) {
                    handleMainBoardMove({
                      from: sourceSquare,
                      to: targetSquare,
                      promotion: 'q'
                    });
                  }
                }}
              />
            </MotionPaper>
          </Grid>

          {/* Controls and Info Column */}
          <Grid item xs={12} md={4}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              {/* Game Controls Card */}
              <MotionPaper
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                elevation={2}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: 2, sm: 3 },
                  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.12)',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <Stack spacing={{ xs: 2, sm: 3 }}>
                  {/* Game Phase Selector */}
                  <Tooltip 
                    title="Choose the phase of the game to practice"
                    arrow
                    TransitionComponent={Zoom}
                    disableHoverListener={isMobile}
                  >
                    <FormControl fullWidth>
                      <InputLabel>Game Phase</InputLabel>
                      <Select
                        value={gamePhase}
                        label="Game Phase"
                        onChange={(e) => setGamePhase(e.target.value)}
                        disabled={isPlaying}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'divider',
                            transition: 'all 0.2s ease',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          }
                        }}
                      >
                        <MenuItem value={GAME_PHASES.OPENING}>Opening</MenuItem>
                        <MenuItem value={GAME_PHASES.MIDDLEGAME}>Middlegame</MenuItem>
                        <MenuItem value={GAME_PHASES.ENDGAME}>Endgame</MenuItem>
                        <MenuItem value={GAME_PHASES.RANDOM}>Random</MenuItem>
                      </Select>
                    </FormControl>
                  </Tooltip>

                  {/* Action Buttons */}
                  <Stack spacing={2}>
                    <Tooltip 
                      title="Start a new position to practice"
                      arrow
                      TransitionComponent={Zoom}
                      disableHoverListener={isMobile}
                    >
                      <MotionButton
                        whileHover={{ scale: isMobile ? 1 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        variant="contained"
                        color="primary"
                        size={isMobile ? "medium" : "large"}
                        onClick={handleNewGame}
                        disabled={isLoading}
                        fullWidth
                        sx={{
                          transition: 'all 0.3s ease',
                          background: 'linear-gradient(45deg, #0EA5E9 30%, #0284C7 90%)',
                          boxShadow: '0 3px 12px rgba(14, 165, 233, 0.3)',
                          height: isMobile ? 44 : 48,
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)',
                            background: 'linear-gradient(45deg, #0284C7 30%, #0EA5E9 90%)',
                          },
                          '&:disabled': {
                            background: 'rgba(14, 165, 233, 0.3)',
                          }
                        }}
                      >
                        New Position
                      </MotionButton>
                    </Tooltip>
                    
                    <Tooltip 
                      title={hasMadeFirstMove 
                        ? "Add a new board to explore different move paths"
                        : "Make your first move before adding boards"
                      }
                      arrow
                      TransitionComponent={Zoom}
                      disableHoverListener={isMobile}
                    >
                      <MotionButton
                        whileHover={{ scale: isMobile ? 1 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        variant="outlined"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={handleAddBoard}
                        disabled={!isPlaying || boards.length >= 3 || !hasMadeFirstMove}
                        fullWidth
                        size={isMobile ? "medium" : "large"}
                        sx={{
                          transition: 'all 0.3s ease',
                          borderWidth: 2,
                          height: isMobile ? 44 : 48,
                          '&:hover': {
                            borderWidth: 2,
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                          },
                          '&:disabled': {
                            opacity: 0.7,
                            borderWidth: 1,
                          }
                        }}
                      >
                        Add Board
                      </MotionButton>
                    </Tooltip>
                  </Stack>

                  {/* Score Display */}
                  <MotionBox
                    style={{
                      scale: scoreScale,
                      opacity: scoreOpacity
                    }}
                    sx={{
                      background: 'linear-gradient(45deg, #0EA5E9 30%, #0284C7 90%)',
                      color: 'white',
                      p: { xs: 2, sm: 3 },
                      borderRadius: { xs: 2, sm: 3 },
                      textAlign: 'center',
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: isMobile ? 'none' : 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)',
                      }
                    }}
                  >
                    <Typography 
                      variant="h3" 
                      component="div" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 1,
                        letterSpacing: '-0.02em',
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                      }}
                    >
                      {score}
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        opacity: 0.9, 
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      Total Score
                    </Typography>
                  </MotionBox>

                  {/* Timer */}
                  {isPlaying && (
                    <MotionBox
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <LinearProgress 
                        variant="determinate" 
                        value={(timeLeft / 30) * 100} 
                        color={timeLeft <= 5 ? 'error' : 'primary'}
                        sx={{ 
                          height: { xs: 6, sm: 8 }, 
                          borderRadius: 4,
                          bgcolor: 'rgba(14, 165, 233, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            transition: 'width 1s linear',
                            borderRadius: 4,
                          }
                        }}
                      />
                      <MotionBox
                        animate={{
                          scale: timeLeft <= 5 ? [1, 1.05, 1] : 1,
                          color: timeLeft <= 5 ? '#ef4444' : 'text.secondary'
                        }}
                        transition={{
                          scale: {
                            duration: 0.5,
                            repeat: timeLeft <= 5 ? Infinity : 0,
                            repeatType: "reverse"
                          },
                          color: {
                            duration: 0.3
                          }
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          align="center" 
                          sx={{ 
                            mt: 1,
                            fontWeight: 500,
                            fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9rem' }
                          }}
                        >
                          Time left: {timeLeft}s
                        </Typography>
                      </MotionBox>
                    </MotionBox>
                  )}
                </Stack>
              </MotionPaper>

              {/* Help Card */}
              <MotionPaper
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                elevation={2}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: 2, sm: 3 },
                  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.12)',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HelpOutlineIcon 
                    color="primary" 
                    sx={{ 
                      mr: 1, 
                      fontSize: { xs: 24, sm: 28 } 
                    }} 
                  />
                  <Typography 
                    variant="h6" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    How to Play
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  paragraph 
                  sx={{ 
                    lineHeight: 1.6,
                    fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }
                  }}
                >
                  Predict opponent moves and score points based on move probability. Add boards to create multiple prediction paths!
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { text: 'Select a game phase to focus on specific positions', icon: PhaseIcon },
                    { text: 'Add up to 3 boards to explore different move paths', icon: BoardIcon },
                    { text: 'Make moves within the time limit', icon: TimerIcon },
                    { text: 'Score points based on move probability', icon: ScoreIcon }
                  ].map((item, index) => (
                    <MotionBox
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                      whileHover={{ x: isMobile ? 0 : 5 }}
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Box
                        sx={{
                          width: { xs: 4, sm: 6 },
                          height: { xs: 4, sm: 6 },
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          mr: 1.5,
                          opacity: 0.8
                        }}
                      />
                      <item.icon 
                        sx={{ 
                          mr: 1, 
                          fontSize: { xs: 18, sm: 20 }, 
                          color: 'primary.main', 
                          opacity: 0.8 
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          lineHeight: 1.5,
                          fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }
                        }}
                      >
                        {item.text}
                      </Typography>
                    </MotionBox>
                  ))}
                </Stack>
              </MotionPaper>

              {/* Score Breakdown */}
              <AnimatePresence>
                {showScoreBreakdown && (
                  <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ScoreBreakdown boards={boards} score={score} />
                  </MotionBox>
                )}
              </AnimatePresence>
            </Stack>
          </Grid>
        </Grid>

        {/* Forked Boards */}
        <Box sx={{ mt: { xs: 2, sm: 3, md: 4 } }}>
          <ForkedBoards
            boards={boards}
            onRemoveBoard={removeBoard}
            onMakeMove={handleMakeMove}
          />
        </Box>

        {/* Floating Board Dialog */}
        <FloatingBoard
          open={showFloatingBoard}
          onClose={handleFloatingBoardClose}
          onConfirm={handleFloatingBoardConfirm}
          position={tempBoard?.game.fen()}
          onMakeMove={handleFloatingBoardMove}
          isPlaying={isPlaying}
        />

        {/* Notifications */}
        <Snackbar 
          open={showSuccess} 
          autoHideDuration={3000} 
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setShowSuccess(false)} 
            severity="success" 
            sx={{ 
              width: '100%',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
              '& .MuiAlert-icon': {
                fontSize: { xs: 24, sm: 28 }
              }
            }}
            elevation={6}
            variant="filled"
          >
            {message}
          </Alert>
        </Snackbar>

        <Snackbar 
          open={showError} 
          autoHideDuration={3000} 
          onClose={() => setShowError(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setShowError(false)} 
            severity="error" 
            sx={{ 
              width: '100%',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
              '& .MuiAlert-icon': {
                fontSize: { xs: 24, sm: 28 }
              }
            }}
            elevation={6}
            variant="filled"
          >
            {message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}; 