import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Divider
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { Chess } from 'chess.js';
import axios from 'axios';
import ChessBoard from './ChessBoard';
import RefreshIcon from '@mui/icons-material/Refresh';

const STORAGE_KEY = 'chess_tactics_finder_games';

const ChessTacticsFinder = () => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [tactic, setTactic] = useState(null);
  const [currentTacticIndex, setCurrentTacticIndex] = useState(0);
  const [arrows, setArrows] = useState([]);
  const [savedGames, setSavedGames] = useState([]);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });

  // Load saved games on component mount
  useEffect(() => {
    const savedGamesData = localStorage.getItem(STORAGE_KEY);
    if (savedGamesData) {
      try {
        const games = JSON.parse(savedGamesData);
        setSavedGames(games);
      } catch (error) {
        console.error('❌ Error loading saved games:', error);
      }
    }
  }, []);

  const getDefaultGameName = () => {
    const now = new Date();
    return `Game ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  };

  const handleSaveClick = () => {
    setNewGameName(getDefaultGameName());
    setIsSaveDialogOpen(true);
  };

  const saveGame = () => {
    if (!newGameName.trim()) {
      setNewGameName(getDefaultGameName());
      return;
    }

    const gameData = {
      id: Date.now(),
      name: newGameName.trim(),
      pgn: game.pgn(),
      date: new Date().toLocaleString(),
      tactic,
      currentTacticIndex,
      arrows
    };

    const updatedGames = [...savedGames, gameData];
    setSavedGames(updatedGames);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGames));
    setNewGameName('');
    setIsSaveDialogOpen(false);
  };

  const loadGame = (gameData) => {
    try {
      game.loadPgn(gameData.pgn);
      setFen(game.fen());
      setTactic(gameData.tactic);
      setCurrentTacticIndex(gameData.currentTacticIndex);
      setArrows(gameData.arrows);
      setIsLoadDialogOpen(false);
    } catch (error) {
      console.error('❌ Error loading game:', error);
    }
  };

  const deleteGame = (gameId) => {
    const updatedGames = savedGames.filter(game => game.id !== gameId);
    setSavedGames(updatedGames);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGames));
  };

  const findTactic = async () => {
    console.log('\n\n');

    // Only analyze if it's white's turn
    if (game.turn() !== 'w') {
      console.log('⏭️ Skipping analysis - not white\'s turn');
      return;
    }

    // If we're in a tactic sequence, just return
    if (tactic) {
      console.log('⏭️ Skipping analysis - in middle of tactic sequence');
      return;
    }

    console.log('🔍 Analyzing position...');
    console.log('FEN:', game.fen());

    // Initialize analysis
    const analysisGame = new Chess(game.fen());
    let initialEval = 0;
    let tacticEval = 0;
    const moves = [];
    const counterMoves = [];
    const whiteAnalyses = [];
    const blackAnalyses = [];
    const iterations = 3;
    const tacticsFound = [];

    try {
      // Loop to find a tactic
      for (let i = 0; i < iterations; i++) {
        console.log(`\n📊 Analysis iteration ${i + 1}:`);

        // 3.1 White's move analysis
        console.log('📡 Analyzing white\'s move (depth 3)...');
        const whiteAnalysis = whiteAnalyses[i] || (await axios.post('https://chess-api.com/v1', {
          fen: analysisGame.fen(),
          depth: 17,
          variants: 1
        }))?.data;

        if (whiteAnalysis.error) {
          throw new Error(blackAnalyses.text)
        }

        whiteAnalyses[i] = whiteAnalysis;

        // Save initial evaluation on first iteration
        if (i === 0) {
          initialEval = whiteAnalysis.eval;
          console.log('Initial position evaluation:', initialEval);
        }

        // Play white's best move
        const whiteBestMove = whiteAnalysis.move;
        const didWhiteTakeBlackPiece = analysisGame.get(whiteBestMove.slice(2, 4))?.color === 'b';

        analysisGame.move({
          from: whiteBestMove.slice(0, 2),
          to: whiteBestMove.slice(2, 4)
        });
        moves.push(whiteBestMove);
        console.log('White\'s best move:', whiteBestMove);

        if (analysisGame.isCheckmate()) {
          tacticEval = 100;
          tacticsFound.push({
            evaluation: tacticEval,
            length: moves.length,
            moves: [...moves],
            counterMoves: [...counterMoves]
          });
          break;
        }

        // 3.2 Black's counter move analysis
        console.log('📡 Analyzing black\'s response (depth 1)...');
        const blackAnalysis = blackAnalyses[i] || (await axios.post('https://chess-api.com/v1', {
          fen: analysisGame.fen(),
          depth: 1,
          variants: 1
        }))?.data;

        if (blackAnalyses.error) {
          throw new Error(blackAnalyses.text)
        }

        blackAnalyses[i] = blackAnalysis;

        // Find all possible captures for black
        const possibleMoves = analysisGame.moves({ verbose: true });
        const captures = possibleMoves.filter(move => move.captured);
        
        let blackNextMove;
        if (captures.length > 0) {
          // Find the capture that takes the most valuable piece using lodash
          const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
          const bestCapture = _.maxBy(captures, move => pieceValues[move.captured.toLowerCase()]);
          blackNextMove = bestCapture;
          console.log('Found capturing move:', blackNextMove.san);
        } else {
          // Look for counter-attacks against the piece white just moved
          const whiteLastMove = whiteBestMove.slice(2, 4); // The square white moved to
          const counterAttacks = possibleMoves.filter(move => move.to === whiteLastMove);

          if (counterAttacks.length > 0) {
            // Just take the first counter-attack move since we know which piece we're threatening
            blackNextMove = counterAttacks[0];
            console.log('Found counter-attack move:', blackNextMove.san);
          } else {
            // No captures or counter-attacks available, use engine's best move
            blackNextMove = {
              from: blackAnalysis.move.slice(0, 2),
              to: blackAnalysis.move.slice(2, 4)
            };
            console.log('Using engine\'s best move:', blackAnalysis.move);
          }
        }

        analysisGame.move(blackNextMove);
        counterMoves.push(`${blackNextMove.from}${blackNextMove.to}`);
        console.log('Black\'s move:', `${blackNextMove.from}${blackNextMove.to}`);

        const didBlackTakeWhitePieceBack = (blackNextMove.to === whiteBestMove.slice(2, 4));

        if (analysisGame.isCheckmate()) {
          // reaching here means that opponent can checkmate us...
          // so we should stop the analysis
          console.log('🚨 Opponent can checkmate us... stopping analysis');
          break;
        }

        // 3.3 Evaluate position after black's move
        console.log('📡 Evaluating position after black\'s move (depth 3)...');
        const evaluationAnalysis = (await axios.post('https://chess-api.com/v1', {
          fen: analysisGame.fen(),
          depth: 3,
          variants: 1
        }))?.data;

        if (evaluationAnalysis.error) {
          throw new Error(evaluationAnalysis.text)
        }

        // Store evaluation analysis for next iteration if not the last one
        if (i < iterations - 1) {
          whiteAnalyses[i + 1] = evaluationAnalysis;
        }

        // Update tactic evaluation
        tacticEval += (evaluationAnalysis.eval - initialEval);
        console.log('Current tactic evaluation:', tacticEval);

        // Check if we found a tactic
        if (tacticEval >= 0.7 && didWhiteTakeBlackPiece && !didBlackTakeWhitePieceBack && i > 0) {
          const tacticCounterMoves = [...counterMoves];
          tacticCounterMoves.pop();
          tacticsFound.push({
            evaluation: tacticEval,
            length: moves.length,
            moves: [...moves],
            counterMoves: tacticCounterMoves
          });
        }
      }

      if (tacticsFound.length === 0) {
        // No tactic found after 3 iterations
        console.log('No significant tactic found');
        setTactic(null);
        setCurrentTacticIndex(0);
        setArrows([]);
        return;
      }

      const bestTactic = _.maxBy(tacticsFound, 'evaluation');

      console.log('🎯 Tactic found!');
      console.log('Final evaluation:', bestTactic.evaluation);
      console.log('Moves:', bestTactic.moves);
      console.log('Counter moves:', bestTactic.counterMoves);

      setTactic({
        evaluation: bestTactic.evaluation,
        length: bestTactic.length,
        moves: bestTactic.moves,
        counterMoves: bestTactic.counterMoves
      });
      setCurrentTacticIndex(0);
      setArrows([
        bestTactic.moves[0] && [bestTactic.moves[0].slice(0, 2), bestTactic.moves[0].slice(2, 4), '#4caf50'],
        bestTactic.counterMoves[0] && [bestTactic.counterMoves[0].slice(0, 2), bestTactic.counterMoves[0].slice(2, 4), '#f44336']
      ].filter(Boolean));

    } catch (error) {
      console.error('❌ Error analyzing position:', error);
      console.error('Error details:', error.response?.data || error.message);
      setTactic(null);
      setCurrentTacticIndex(0);
      setArrows([]);
    }
  };

  const handleMove = (move) => {
    const moveResult = game.move(move);
    setFen(game.fen());

    // Track captured pieces
    if (moveResult.captured) {
      setCapturedPieces(prev => ({
        ...prev,
        [game.turn() === 'w' ? 'black' : 'white']: [...prev[game.turn() === 'w' ? 'black' : 'white'], moveResult.captured]
      }));
    }

    // If we're in a tactic sequence
    if (tactic) {

      const isTacticCompleted = currentTacticIndex >= tactic.length;
      const didWhiteDitchTactic = (game.turn() === 'b' && `${move.from}${move.to}` !== tactic.moves[currentTacticIndex]);

      // If we've completed the tactic sequence or white didn't play the tactic move, clear the tactic
      if (isTacticCompleted || didWhiteDitchTactic) {
        setTactic(null);
        setCurrentTacticIndex(0);
        setArrows([]);
      } else {
        // Update arrows based on current tactic step
        // const whiteMoveArrow = tactic.moves[currentTacticIndex] && [tactic.moves[currentTacticIndex].slice(0, 2), tactic.moves[currentTacticIndex].slice(2, 4), '#4caf50'];
        const whiteNextMoveArrow = tactic.moves[currentTacticIndex + 1] && [tactic.moves[currentTacticIndex + 1].slice(0, 2), tactic.moves[currentTacticIndex + 1].slice(2, 4), '#4caf50'];
        const blackMoveArrow = tactic.counterMoves[currentTacticIndex] && [tactic.counterMoves[currentTacticIndex].slice(0, 2), tactic.counterMoves[currentTacticIndex].slice(2, 4), '#f44336'];
        const blackNextMoveArrow = tactic.counterMoves[currentTacticIndex + 1] && [tactic.counterMoves[currentTacticIndex + 1].slice(0, 2), tactic.counterMoves[currentTacticIndex + 1].slice(2, 4), '#f44336'];
        if (game.turn() === 'w') {
          setArrows([whiteNextMoveArrow, blackNextMoveArrow].filter(Boolean));
          setCurrentTacticIndex(currentTacticIndex + 1);
        } else {
          setArrows([blackMoveArrow].filter(Boolean));
        }
      }
    }

    // Only analyze if it's white's turn
    if (game.turn() === 'w') {
      findTactic();
    }
  };

  const handleUndo = () => {
    if (game.history().length > 0) {
      const move = game.undo();
      setFen(game.fen());

      // Remove captured piece if the move was a capture
      if (move.captured) {
        setCapturedPieces(prev => ({
          ...prev,
          [game.turn() === 'w' ? 'white' : 'black']: prev[game.turn() === 'w' ? 'white' : 'black'].slice(0, -1)
        }));
      }

      // If we're in a tactic sequence
      if (tactic) {
        if (currentTacticIndex > 0) {
          // Go back one step in the tactic
          const newIndex = currentTacticIndex - 1;
          setCurrentTacticIndex(newIndex);
          setArrows([
            [tactic.moves[newIndex].slice(0, 2), tactic.moves[newIndex].slice(2, 4), '#4caf50'],
            [tactic.counterMoves[newIndex].slice(0, 2), tactic.counterMoves[newIndex].slice(2, 4), '#f44336']
          ]);
        } else {
          // Clear tactic if we're at the beginning
          setTactic(null);
          setCurrentTacticIndex(0);
          setArrows([]);
        }
      }

      // Re-analyze the position if it's white's turn
      if (game.turn() === 'w') {
        findTactic();
      }
    }
  };

  const handleNewGame = () => {
    game.reset();
    setFen(game.fen());
    setTactic(null);
    setCurrentTacticIndex(0);
    setArrows([]);
    setCapturedPieces({ white: [], black: [] });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ChessBoard
            fen={fen}
            onMove={handleMove}
            arrows={arrows}
            onNewGame={handleNewGame}
            capturedPieces={capturedPieces}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Tooltip title="New Game">
              <IconButton
                onClick={handleNewGame}
                color="primary"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Undo">
              <span>
                <IconButton
                  onClick={handleUndo}
                  disabled={!game.history().length}
                  color="primary"
                >
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Save Game">
              <span>
                <IconButton
                  onClick={handleSaveClick}
                  color="primary"
                >
                  <SaveIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Load Game">
              <span>
                <IconButton
                  onClick={() => setIsLoadDialogOpen(true)}
                  disabled={!savedGames.length}
                  color="primary"
                >
                  <FileOpenIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
        <Paper sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'flex-start' }}>
          <Typography variant="body1" color="text.secondary">
            Make moves on the board. The system will analyze after white's moves to find tactical opportunities.
          </Typography>
        </Paper>
      </Box>

      {tactic && (
        <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
          <Typography variant="h6" gutterBottom>
            Tactic Found!
          </Typography>
          <Typography>
            Evaluation: {tactic.evaluation} centipawns
          </Typography>
          <Typography>
            Moves remaining: {tactic.length - currentTacticIndex}
          </Typography>
          <Typography>
            Continuation moves: {tactic.moves.join(' ')}
          </Typography>
        </Paper>
      )}

      <Dialog
        open={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{
          m: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">Save Game</Typography>
          <IconButton
            onClick={() => setIsSaveDialogOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder={getDefaultGameName()}
            onChange={(e) => setNewGameName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                saveGame();
              }
            }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={saveGame}
              variant="contained"
              startIcon={<SaveIcon />}
              sx={{
                minWidth: 100,
                borderRadius: 1
              }}
            >
              Save
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isLoadDialogOpen}
        onClose={() => setIsLoadDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{
          m: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">Load Game</Typography>
          <IconButton
            onClick={() => setIsLoadDialogOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {savedGames.length === 0 ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 3,
              gap: 1
            }}>
              <FileOpenIcon sx={{ fontSize: 24, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                No saved games
              </Typography>
            </Box>
          ) : (
            <List dense>
              {savedGames.map((gameData, index) => (
                <React.Fragment key={gameData.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={gameData.name}
                      secondary={gameData.date}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          edge="end"
                          color="primary"
                          onClick={() => loadGame(gameData)}
                          size="small"
                        >
                          <FileOpenIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => deleteGame(gameData.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ChessTacticsFinder; 