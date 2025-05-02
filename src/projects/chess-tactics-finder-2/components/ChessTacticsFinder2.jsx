import React, { useState, useRef } from 'react';
import { Box, Container, Typography, Paper, TextField, Button, Grid, Slider, Alert, CircularProgress, Dialog, DialogContent, DialogActions, IconButton, Chip } from '@mui/material';
import { Chessboard } from 'react-chessboard';
import ChessEngine from './ChessEngine';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';

const ChessTacticsFinder2 = () => {
  const [evaluation, setEvaluation] = useState(0);
  const [tacticLevel, setTacticLevel] = useState(2);
  const [tacticThreshold, setTacticThreshold] = useState(50);
  const [tacticFound, setTacticFound] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [position, setPosition] = useState('start');
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [tacticSequence, setTacticSequence] = useState([]);
  const [currentTacticMoveIndex, setCurrentTacticMoveIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [arrows, setArrows] = useState([]);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [showCheckmateUI, setShowCheckmateUI] = useState(false);
  const engineRef = useRef(null);
  const tacticRef = useRef(null);

  const handleEvaluation = (score) => {
    setEvaluation(score);
  };

  const handleMove = async (move) => {
    if (move) {
      // Only append to move history if we're at the latest position
      if (currentMoveIndex === moveHistory.length - 1) {
        setMoveHistory(prev => [...prev, move]);
        setCurrentMoveIndex(moveHistory.length);
      }
      setPosition(engineRef.current.getFen());
      setCurrentTacticMoveIndex(-1);
      setError(null);
      
      // Check for checkmate after each move
      if (engineRef.current.isCheckmate()) {
        setIsCheckmate(true);
        setShowCheckmateUI(true);
        setIsAnalyzing(false);
      } else {
        // If it's white's turn next, automatically check for tactics
        if (engineRef.current.turn() === 'w') {
          await handleCheckTactic();
        }
      }
    }
  };

  const handleError = (error) => {
    setError(error.message);
    setIsAnalyzing(false);
  };

  const handleCheckTactic = async () => {
    if (!engineRef.current) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const tactic = await engineRef.current.findTactic(tacticLevel, tacticThreshold);
      tacticRef.current = tactic;
      setTacticFound(!!tactic);
      setTacticSequence(tactic);
      setCurrentTacticMoveIndex(tactic ? 0 : -1);
      setArrows([]);
    } catch (error) {
      setError(error.message);
      setTacticFound(false);
      setTacticSequence([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNextMove = async () => {
    if (!tacticRef.current) return;
    
    try {
      const found = await tacticRef.current();
      setTacticSequence(engineRef.current.getTacticSequence());
      
      if (found) {
        setTacticFound(true);
        setIsAnalyzing(false);
      } else {
        // Show the current move's arrow
        const currentMove = tacticSequence[tacticSequence.length - 1];
        if (currentMove) {
          setArrows([[currentMove.from, currentMove.to]]);
        }
      }
    } catch (error) {
      setError(error.message);
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (sourceSquare, targetSquare) => {
    if (!engineRef.current) return false;
    
    try {
      const move = engineRef.current.makeMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });
      
      return !!move;
    } catch {
      // Silently return false for invalid moves without showing error
      return false;
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setPosition('start');
      setMoveHistory([]);
      setCurrentMoveIndex(-1);
      setTacticSequence([]);
      setCurrentTacticMoveIndex(-1);
      setError(null);
      setIsCheckmate(false);
      setShowCheckmateUI(false);
    }
  };

  const navigateToMove = (index) => {
    if (!engineRef.current || index < -1 || index >= moveHistory.length) return;
    
    try {
      // Reset to starting position
      engineRef.current.reset();
      
      // Apply moves up to the target index
      for (let i = 0; i <= index; i++) {
        engineRef.current.makeMove(moveHistory[i]);
      }
      
      setPosition(engineRef.current.getFen());
      setCurrentMoveIndex(index);
      setError(null);
    } catch (error) {
      handleError(error);
    }
  };

  const goToStart = () => navigateToMove(-1);
  const goToEnd = () => navigateToMove(moveHistory.length - 1);
  const goToPreviousMove = () => navigateToMove(currentMoveIndex - 1);
  const goToNextMove = () => navigateToMove(currentMoveIndex + 1);

  const handleTacticMove = (index) => {
    if (!engineRef.current || index < 0 || index >= tacticSequence.length) return;
    
    try {
      // Reset to the position before the tactic
      engineRef.current.reset();
      moveHistory.forEach(move => engineRef.current.makeMove(move));
      
      // Apply moves up to the selected index
      for (let i = 0; i <= index; i++) {
        engineRef.current.makeMove(tacticSequence[i]);
      }
      
      setPosition(engineRef.current.getFen());
      setCurrentTacticMoveIndex(index);
      setError(null);

      // Update arrows to show the current move
      if (index >= 0) {
        const move = tacticSequence[index];
        setArrows([[move.from, move.to]]);
      } else {
        setArrows([]);
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 0, pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 0, position: 'relative' }}>
              <Box sx={{
                borderTop: engineRef.current?.turn() === 'b' ? '4px solid #1976d2' : '4px solid transparent',
                borderBottom: engineRef.current?.turn() === 'w' ? '4px solid #1976d2' : '4px solid transparent',
                transition: 'border-color 0.3s ease-in-out'
              }}>
                <Chessboard 
                  position={position}
                  onPieceDrop={handleDrop}
                  boardOrientation="white"
                  boardWidth={800}
                  customArrows={arrows}
                  style={{
                    width: '100%',
                    height: '80vh'
                  }}
                />
              </Box>
              {isAnalyzing && (
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: 2,
                  borderRadius: 1
                }}>
                  <CircularProgress />
                  <Typography variant="body2">Analyzing position...</Typography>
                </Box>
              )}
              {isCheckmate && showCheckmateUI && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  zIndex: 1000
                }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Checkmate!
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    {engineRef.current?.turn() === 'w' ? 'Black' : 'White'} wins!
                  </Typography>
                  {currentTacticMoveIndex === -1 ? (
                    <Button 
                      variant="contained" 
                      size="large"
                      onClick={handleReset}
                      sx={{ mt: 2 }}
                    >
                      Play Again
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      size="large"
                      onClick={() => setShowCheckmateUI(false)}
                      sx={{ mt: 2 }}
                    >
                      Continue with Tactic
                    </Button>
                  )}
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    onClick={goToStart}
                    disabled={currentMoveIndex === -1}
                    size="small"
                  >
                    <SkipPreviousIcon />
                  </IconButton>
                  <IconButton 
                    onClick={goToPreviousMove}
                    disabled={currentMoveIndex === -1}
                    size="small"
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                  <Typography variant="body1" sx={{ minWidth: '60px', textAlign: 'center' }}>
                    {currentMoveIndex + 1}/{moveHistory.length}
                  </Typography>
                  <IconButton 
                    onClick={goToNextMove}
                    disabled={currentMoveIndex === moveHistory.length - 1}
                    size="small"
                  >
                    <NavigateNextIcon />
                  </IconButton>
                  <IconButton 
                    onClick={goToEnd}
                    disabled={currentMoveIndex === moveHistory.length - 1}
                    size="small"
                  >
                    <SkipNextIcon />
                  </IconButton>
                </Box>
                <Button variant="outlined" onClick={handleReset}>
                  Reset Game
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <TextField
                  label="Tactic Level"
                  type="number"
                  value={tacticLevel}
                  onChange={(e) => setTacticLevel(parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 5 }}
                  disabled={isAnalyzing || isCheckmate}
                />
                <Button 
                  variant="contained" 
                  onClick={handleCheckTactic}
                  disabled={isAnalyzing || isCheckmate}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Check for Tactics'}
                </Button>
              </Box>

              <Typography variant="body1" gutterBottom>
                Tactic Threshold (centipawns): {tacticThreshold}
              </Typography>
              <Slider
                value={tacticThreshold}
                onChange={(_, value) => setTacticThreshold(value)}
                min={10}
                max={200}
                step={10}
                marks
                disabled={isAnalyzing || isCheckmate}
                sx={{ mb: 2 }}
              />

              <Typography variant="body1" gutterBottom>
                Current Evaluation: {evaluation / 100} pawns
              </Typography>
              {tacticFound && (
                <>
                  <Typography variant="body1" color="success.main" gutterBottom>
                    Tactic of level {tacticLevel} found!
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Tactic Sequence:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {tacticSequence.map((move, index) => (
                      <Button
                        key={index}
                        variant={currentTacticMoveIndex === index ? "contained" : "outlined"}
                        size="small"
                        onClick={() => handleTacticMove(index)}
                        disabled={isAnalyzing || isCheckmate}
                        sx={{ mr: 1, mb: 1 }}
                      >
                        {index + 1}. {move.san}
                      </Button>
                    ))}
                  </Box>
                </>
              )}
              <Button 
                variant="contained" 
                fullWidth 
                disabled={!isAnalyzing || isCheckmate}
                onClick={handleNextMove}
              >
                Next Move
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <ChessEngine 
        ref={engineRef}
        onEvaluation={handleEvaluation}
        onMove={handleMove}
        onError={handleError}
      />
    </Container>
  );
};

export default ChessTacticsFinder2; 