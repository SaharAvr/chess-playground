import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { validateMove, calculateMoveProbability, calculateBoardScore } from '../utils/chessUtils';

export const useChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [boards, setBoards] = useState([]);
  const [score, setScore] = useState(0);

  const makeMove = useCallback((move) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);
      if (result) {
        setGame(newGame);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Move validation error:', error);
      return false;
    }
  }, [game]);

  const addBoard = useCallback(() => {
    const newBoard = {
      id: Date.now(),
      game: new Chess(game.fen()),
      moves: [],
      probability: 0
    };
    setBoards(prev => [...prev, newBoard]);
  }, [game]);

  const removeBoard = useCallback((boardId) => {
    setBoards(prev => prev.filter(board => board.id !== boardId));
  }, []);

  const makeMoveOnBoard = useCallback((boardId, move) => {
    setBoards(prev => prev.map(board => {
      if (board.id === boardId) {
        try {
          const newGame = new Chess(board.game.fen());
          const result = newGame.move(move);
          if (result) {
            const probability = calculateMoveProbability(newGame, move);
            return {
              ...board,
              game: newGame,
              moves: [...board.moves, move],
              probability
            };
          }
        } catch (error) {
          console.error('Move validation error:', error);
        }
      }
      return board;
    }));
  }, []);

  const calculateTotalScore = useCallback(() => {
    if (!boards.length) return 0;

    // Calculate score for each board
    const boardScores = boards.map(board => calculateBoardScore(board));

    // Calculate average score across all boards
    const avgScore = boardScores.reduce((acc, score) => acc + score, 0) / boardScores.length;

    // Bonus for number of boards (diminishing returns)
    const boardBonus = Math.min(boards.length * 10, 30);

    // Final score is average board score plus board bonus
    const finalScore = Math.round(avgScore + boardBonus);
    setScore(finalScore);
    return finalScore;
  }, [boards]);

  return {
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
  };
}; 