import { get } from 'lodash';
import { Chess } from 'chess.js';

export const INITIAL_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Mapping of SAN moves to UCI format for common opening moves
const MOVE_MAPPINGS = {
  'e4': 'e2e4',
  'e5': 'e7e5',
  'Nf3': 'g1f3',
  'Nc6': 'b8c6',
  'Bb5': 'f1b5',
  'c5': 'c7c5',
  'Nc3': 'b1c3',
  'd4': 'd2d4',
  'd5': 'd7d5',
  'exd5': 'e4d5',
  'Nxd5': 'f3d5',
  'Nf6': 'g8f6',
  'Bc4': 'f1c4',
  'Bg5': 'c1g5',
  'Be2': 'f1e2',
  'O-O': 'e1g1',
  'O-O-O': 'e1c1',
};

export const OPENINGS = {
  'sicilian-defense': {
    name: 'Sicilian Defense',
    description: 'A sharp, aggressive defense against 1.e4',
    firstMove: 'e4',
    response: 'c5',
    variations: [
      {
        name: 'Open Sicilian',
        moves: ['e4', 'c5', 'Nf3'],
        description: 'The most principled continuation, leading to sharp tactical play'
      },
      {
        name: 'Closed Sicilian',
        moves: ['e4', 'c5', 'Nc3'],
        description: 'A more positional approach avoiding the main theoretical lines'
      }
    ]
  },
  'ruy-lopez': {
    name: 'Ruy Lopez',
    description: 'One of the oldest and most popular openings',
    firstMove: 'e4',
    response: 'e5',
    variations: [
      {
        name: 'Main Line',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
        description: 'The classical approach, putting pressure on Black\'s e5 pawn'
      }
    ]
  },
  'queens-gambit': {
    name: 'Queen\'s Gambit',
    description: 'A strategic opening that aims to control the center',
    firstMove: 'd4',
    response: 'd5',
    variations: [
      {
        name: 'Accepted',
        moves: ['d4', 'd5', 'c4', 'dxc4'],
        description: 'Black accepts the gambit pawn, leading to dynamic play'
      },
      {
        name: 'Declined',
        moves: ['d4', 'd5', 'c4', 'e6'],
        description: 'Black declines the gambit, maintaining a solid position'
      }
    ]
  },
  'italian-game': {
    name: 'Italian Game',
    description: 'A classical opening focusing on rapid development',
    firstMove: 'e4',
    response: 'e5',
    variations: [
      {
        name: 'Main Line',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'],
        description: 'The traditional Italian Game with balanced development'
      }
    ]
  },
  'french-defense': {
    name: 'French Defense',
    description: 'A solid defense that leads to rich strategic positions',
    firstMove: 'e4',
    response: 'e6',
    variations: [
      {
        name: 'Main Line',
        moves: ['e4', 'e6', 'd4', 'd5'],
        description: 'The classical French Defense with a solid pawn structure'
      }
    ]
  },
  'caro-kann': {
    name: 'Caro-Kann Defense',
    description: 'A solid and reliable defense against 1.e4',
    firstMove: 'e4',
    response: 'c6',
    variations: [
      {
        name: 'Main Line',
        moves: ['e4', 'c6', 'd4', 'd5'],
        description: 'The traditional Caro-Kann with a solid pawn structure'
      }
    ]
  },
  'kings-indian': {
    name: 'King\'s Indian Defense',
    description: 'A dynamic defense that leads to complex positions',
    firstMove: 'd4',
    response: 'Nf6',
    variations: [
      {
        name: 'Main Line',
        moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7'],
        description: 'The classical King\'s Indian setup with fianchettoed bishop'
      }
    ]
  }
};

// Create a new chess game instance
export function createGame(fen = INITIAL_POSITION) {
  return new Chess(fen);
}

// Make a move and return the result
export function makeMove(game, move) {
  try {
    return game.move(move);
  } catch (error) {
    console.error('Invalid move:', error);
    return null;
  }
}

// Validate a move without making it
export function validateMove(game, move) {
  try {
    const moves = game.moves({ verbose: true });
    if (typeof move === 'string') {
      // SAN format
      return moves.some(m => m.san === move);
    } else {
      // UCI format
      return moves.some(m => m.from === move.from && m.to === move.to);
    }
  } catch (error) {
    console.error('Error validating move:', error);
    return false;
  }
}

// Get FEN string after applying a sequence of moves
export function getFENFromMoves(moves) {
  const game = createGame();
  moves.forEach(move => {
    try {
      game.move(move);
    } catch (error) {
      console.error(`Invalid move: ${move}`, error);
    }
  });
  return game.fen();
}

export function getOpeningByKey(key) {
  return get(OPENINGS, key);
}

export function getAllOpenings() {
  return Object.entries(OPENINGS).map(([key, opening]) => ({
    key,
    ...opening
  }));
}

export function sanToUci(san) {
  // Create a new game to convert the move
  const game = new Chess();
  try {
    const move = game.move(san);
    if (move) {
      return move.from + move.to + (move.promotion || '');
    }
  } catch (error) {
    console.error('Error converting move to UCI:', error);
  }
  return san;
}

export function movesToUci(moves) {
  // Create a game to track position
  const game = new Chess();
  return moves.map(san => {
    try {
      const move = game.move(san);
      if (move) {
        const uci = move.from + move.to + (move.promotion || '');
        return uci;
      }
    } catch (error) {
      console.error('Error converting move to UCI:', error);
    }
    return san;
  });
} 