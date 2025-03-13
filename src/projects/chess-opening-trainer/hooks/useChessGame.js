import { useState, useCallback, useRef, useEffect } from 'react';
import { getOpeningData } from '../api/lichess';
import { INITIAL_POSITION, createGame } from '../utils/chess';
import { playMoveSound, preloadSounds } from '../utils/sound';

export default function useChessGame(onCorrectMove, onIncorrectMove) {
  const [position, setPosition] = useState(INITIAL_POSITION);
  const [moves, setMoves] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [openingData, setOpeningData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highlightedMove, setHighlightedMove] = useState(null);
  const gameRef = useRef(createGame());

  useEffect(() => {
    // Preload sounds when the component mounts
    preloadSounds();
  }, []);

  const loadOpeningData = useCallback(async (moveList) => {
    setLoading(true);
    try {
      const data = await getOpeningData(moveList);
      setOpeningData(data);
      return data;
    } catch (error) {
      console.error('Error loading opening data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const playBlackMove = useCallback(async () => {
    const game = gameRef.current;
    
    // Only proceed if it's Black's turn
    if (game.turn() !== 'b') {
      console.warn('Not Black\'s turn to move');
      return;
    }

    // Get the current position's moves history
    const currentMoves = game.history();
    
    // Load opening data for the current position
    const data = await loadOpeningData(currentMoves);
    
    if (data?.moves?.length > 0) {
      // Choose one of the top 3 most popular moves randomly
      const topMoves = data.moves.slice(0, Math.min(3, data.moves.length));
      const randomMove = topMoves[Math.floor(Math.random() * topMoves.length)];
      
      try {
        const result = game.move(randomMove.san);
        if (result) {
          // Play sound based on whether it was a capture
          playMoveSound(result.captured);
          
          setMoves(game.history());
          setPosition(game.fen());
          // Load opening data for the new position after Black's move
          loadOpeningData(game.history());
        }
      } catch {
        // Silently handle invalid moves
      }
    } else {
      console.warn('No valid moves found for Black');
    }
  }, [loadOpeningData]);

  const makeWhiteMove = useCallback(async (san) => {
    const game = gameRef.current;
    
    // Only proceed if it's White's turn
    if (game.turn() !== 'w') {
      console.warn('Not White\'s turn to move');
      return;
    }

    try {
      const result = game.move(san);
      if (result) {
        // Play sound based on whether it was a capture
        playMoveSound(result.captured);
        
        setMoves(game.history());
        setPosition(game.fen());

        // Check if the move is in the opening database
        if (openingData && openingData.moves.some(m => m.san === result.san)) {
          onCorrectMove?.(san);
          // Only play Black's move if White's move was correct
          setTimeout(() => {
            playBlackMove();
          }, 500);
        } else {
          onIncorrectMove?.(san);
          // Don't play Black's move if White's move was incorrect
          loadOpeningData(game.history());
        }
      }
    } catch {
      // Silently handle invalid moves
    }
  }, [onCorrectMove, onIncorrectMove, playBlackMove, openingData, loadOpeningData]);

  const reset = useCallback(() => {
    gameRef.current = createGame();
    setPosition(INITIAL_POSITION);
    setMoves([]);
    setSelectedSquare(null);
    setOpeningData(null);
    loadOpeningData([]);
  }, [loadOpeningData]);

  const handleSquareClick = useCallback((moveOrSquare) => {
    const game = gameRef.current;
    
    // Only allow moves on White's turn
    if (game.turn() !== 'w') {
      console.warn('Not White\'s turn to move');
      return;
    }

    // Handle drag and drop move object
    if (typeof moveOrSquare === 'object' && moveOrSquare.from && moveOrSquare.to) {
      try {
        const result = game.move(moveOrSquare);
        if (result) {
          // Play sound based on whether it was a capture
          playMoveSound(result.captured);
          
          setMoves(game.history());
          setPosition(game.fen());

          // Check if the move is in the opening database
          if (openingData && openingData.moves.some(m => m.san === result.san)) {
            onCorrectMove?.(result.san);
            // Only play Black's move if White's move was correct
            setTimeout(() => {
              playBlackMove();
            }, 500);
          } else {
            onIncorrectMove?.(result.san);
            // Don't play Black's move if White's move was incorrect
            loadOpeningData(game.history());
          }
        }
      } catch {
        // Silently handle invalid moves
      }
      return;
    }

    // Handle square click
    const square = moveOrSquare;
    if (!selectedSquare) {
      setSelectedSquare(square);
      return;
    }

    const move = {
      from: selectedSquare,
      to: square,
      promotion: 'q' // Always promote to queen for simplicity
    };

    try {
      const result = game.move(move);
      if (result) {
        // Play sound based on whether it was a capture
        playMoveSound(result.captured);
        
        setMoves(game.history());
        setPosition(game.fen());

        // Check if the move is in the opening database
        if (openingData && openingData.moves.some(m => m.san === result.san)) {
          onCorrectMove?.(result.san);
          // Only play Black's move if White's move was correct
          setTimeout(() => {
            playBlackMove();
          }, 500);
        } else {
          onIncorrectMove?.(result.san);
          // Don't play Black's move if White's move was incorrect
          loadOpeningData(game.history());
        }
      }
    } catch {
      // Silently handle invalid moves
    }

    setSelectedSquare(null);
  }, [selectedSquare, openingData, onCorrectMove, onIncorrectMove, playBlackMove, loadOpeningData]);

  const undo = useCallback(() => {
    const game = gameRef.current;
    const history = game.history();
    
    if (history.length === 0) return;

    // If the last move was by Black (after a correct White move),
    // we need to undo both moves
    if (game.turn() === 'w' && history.length >= 2) {
      game.undo(); // Undo Black's move
      game.undo(); // Undo White's move
    } 
    // If it's Black's turn (after an incorrect White move),
    // or if there's only one move to undo
    else if (game.turn() === 'b' || history.length === 1) {
      game.undo(); // Undo just the last move
    }
    
    setMoves(game.history());
    setPosition(game.fen());
    setSelectedSquare(null);
    
    // Reload opening data for the new position
    loadOpeningData(game.history());
  }, [loadOpeningData]);

  const handleMoveHover = useCallback((san) => {
    console.log('Hovering move:', san);
    const game = gameRef.current;
    try {
      // Create a temporary game to validate and get move details
      const tempGame = createGame(game.fen());
      const move = tempGame.move(san);
      console.log('Move details:', move);
      if (move) {
        setHighlightedMove({
          from: move.from,
          to: move.to
        });
        console.log('Set highlighted move:', move.from, move.to);
      }
    } catch (error) {
      console.error('Error in handleMoveHover:', error);
      setHighlightedMove(null);
    }
  }, []);

  const handleMoveHoverEnd = useCallback(() => {
    console.log('Move hover end');
    setHighlightedMove(null);
  }, []);

  return {
    position,
    moves,
    selectedSquare,
    openingData,
    loading,
    highlightedMove,
    handleSquareClick,
    reset,
    playMove: makeWhiteMove,
    undo,
    handleMoveHover,
    handleMoveHoverEnd
  };
} 