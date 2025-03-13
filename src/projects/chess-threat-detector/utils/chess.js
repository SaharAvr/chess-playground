import { Chess } from 'chess.js';
import axios from 'axios';

const INITIAL_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const LICHESS_API = 'https://explorer.lichess.ovh/masters';

// Generate a random number between min and max (inclusive)
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Get the color of a square (light or dark)
export const getSquareColor = (square) => {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  return (file + rank) % 2 === 0 ? 'light' : 'dark';
};

// Game phase constants
export const GAME_PHASES = {
  OPENING: 'opening',
  MIDDLEGAME: 'middlegame',
  ENDGAME: 'endgame',
  RANDOM: 'random'
};

// Get move range for each phase
const getMoveRange = (phase) => {
  switch (phase) {
    case GAME_PHASES.OPENING:
      return { min: 1, max: 10 };
    case GAME_PHASES.MIDDLEGAME:
      return { min: 11, max: 30 };
    case GAME_PHASES.ENDGAME:
      return { min: 31, max: 60 };
    case GAME_PHASES.RANDOM:
    default:
      return { min: 1, max: 60 };
  }
};

// Fetch a random position from Lichess master games
const fetchRandomPosition = async (gamePhase = GAME_PHASES.RANDOM) => {
  try {
    // Adjust API parameters based on game phase
    const params = {
      speeds: ['rapid', 'classical'].join(','),
      ratings: [2200, 2500].join(','),
      since: 2000,
      topGames: 1,
      recentGames: 1,
      moves: ''
    };

    // For opening positions, we want to ensure we get early game positions
    if (gamePhase === GAME_PHASES.OPENING) {
      params.moves = '10'; // Get positions after exactly 10 moves
      params.play = ['e2e4', 'e7e5'].join(','); // Common opening moves to ensure we get real openings
    }
    // For middlegame positions, we want complex positions with most pieces
    else if (gamePhase === GAME_PHASES.MIDDLEGAME) {
      params.moves = '20'; // Get positions after exactly 20 moves
    }
    // For endgame positions, we want positions with fewer pieces
    else if (gamePhase === GAME_PHASES.ENDGAME) {
      params.moves = '40'; // Get positions after exactly 40 moves
    }
    // For random positions, use any move count
    else {
      params.moves = randomInt(10, 40).toString();
    }

    console.log('Fetching position with params:', params);
    const response = await axios.get(LICHESS_API, { params });
    console.log('API Response:', response.data);

    if (response.data?.games?.length > 0) {
      const game = response.data.games[0];
      console.log('Selected game:', game);
      
      const gameObj = new Chess();
      
      // Split moves and play them
      if (game.moves) {
        const moves = game.moves.split(' ');
        console.log('Playing moves:', moves);
        
        // Play moves up to our target
        const targetMoves = parseInt(params.moves);
        const movesToPlay = Math.min(moves.length, targetMoves);
        
        for (let i = 0; i < movesToPlay; i++) {
          try {
            gameObj.move(moves[i]);
          } catch (error) {
            console.error('Error playing move:', moves[i], error);
            return createRandomPositionFallback();
          }
        }
      } else {
        console.error('No moves found in game data');
        return createRandomPositionFallback();
      }

      // Get the current position
      const position = {};
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const square = `${String.fromCharCode(97 + j)}${8 - i}`;
          const piece = gameObj.get(square);
          if (piece) {
            position[square] = piece;
          }
        }
      }

      // Count pieces by type and color
      const pieceCounts = {
        w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0, total: 0 },
        b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0, total: 0 }
      };

      Object.values(position).forEach(piece => {
        pieceCounts[piece.color][piece.type]++;
        pieceCounts[piece.color].total++;
      });

      console.log('Position piece counts:', pieceCounts);

      // Validate position based on game phase
      const totalPieces = pieceCounts.w.total + pieceCounts.b.total;
      console.log('Total pieces:', totalPieces);
      
      let isValidPosition = false;
      
      if (gamePhase === GAME_PHASES.OPENING) {
        // Opening should have most pieces (24-32)
        isValidPosition = totalPieces >= 24;
      } else if (gamePhase === GAME_PHASES.MIDDLEGAME) {
        // Middlegame should have moderate number of pieces (16-24)
        isValidPosition = totalPieces >= 16 && totalPieces <= 24;
      } else if (gamePhase === GAME_PHASES.ENDGAME) {
        // Endgame should have fewer pieces (8-16)
        isValidPosition = totalPieces <= 16 && totalPieces >= 8;
      } else {
        // Random positions can have any number of pieces
        isValidPosition = totalPieces >= 8;
      }

      console.log('Is valid position:', isValidPosition);

      if (isValidPosition) {
        return position;
      }
    }
  } catch (error) {
    console.error('Error fetching random position:', error);
  }
  
  console.log('Falling back to random position generation');
  return createRandomPositionFallback();
};

// Fallback function to create a random position (original implementation)
const createRandomPositionFallback = () => {
  const game = new Chess(INITIAL_POSITION);
  const pieces = [];
  const squares = [];

  // Get all pieces and squares
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = `${String.fromCharCode(97 + j)}${8 - i}`;
      const piece = game.get(square);
      if (piece) {
        pieces.push(piece);
        squares.push(square);
      }
    }
  }

  // Randomly place pieces
  const numPieces = randomInt(8, 16); // Random number of pieces between 8 and 16
  const selectedPieces = [];
  const selectedSquares = [];

  // Select random pieces
  while (selectedPieces.length < numPieces) {
    const randomIndex = randomInt(0, pieces.length - 1);
    if (!selectedPieces.includes(pieces[randomIndex])) {
      selectedPieces.push(pieces[randomIndex]);
    }
  }

  // Select random squares
  while (selectedSquares.length < numPieces) {
    const randomIndex = randomInt(0, squares.length - 1);
    if (!selectedSquares.includes(squares[randomIndex])) {
      selectedSquares.push(squares[randomIndex]);
    }
  }

  // Create new position
  const newPosition = {};
  selectedPieces.forEach((piece, index) => {
    newPosition[selectedSquares[index]] = piece;
  });

  return newPosition;
};

// Create a random position based on game phase
const createRandomPosition = async (gamePhase = GAME_PHASES.RANDOM) => {
  const game = new Chess(INITIAL_POSITION);
  const position = {};
  
  // Define piece counts for each phase
  let pieceCounts;
  switch (gamePhase) {
    case GAME_PHASES.OPENING:
      // Opening: Keep most pieces (28-32)
      pieceCounts = {
        w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
        b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 }
      };
      break;
      
    case GAME_PHASES.MIDDLEGAME:
      // Middlegame: Moderate number of pieces (20-28)
      pieceCounts = {
        w: { p: randomInt(4, 6), n: randomInt(1, 2), b: randomInt(1, 2), r: randomInt(1, 2), q: randomInt(0, 1), k: 1 },
        b: { p: randomInt(4, 6), n: randomInt(1, 2), b: randomInt(1, 2), r: randomInt(1, 2), q: randomInt(0, 1), k: 1 }
      };
      break;
      
    case GAME_PHASES.ENDGAME:
      // Endgame: Few pieces (8-16)
      pieceCounts = {
        w: { p: randomInt(2, 4), n: randomInt(0, 1), b: randomInt(0, 1), r: randomInt(0, 1), q: randomInt(0, 1), k: 1 },
        b: { p: randomInt(2, 4), n: randomInt(0, 1), b: randomInt(0, 1), r: randomInt(0, 1), q: randomInt(0, 1), k: 1 }
      };
      break;
      
    default:
      // Random: Any number of pieces (8-32)
      pieceCounts = {
        w: { p: randomInt(2, 8), n: randomInt(0, 2), b: randomInt(0, 2), r: randomInt(0, 2), q: randomInt(0, 1), k: 1 },
        b: { p: randomInt(2, 8), n: randomInt(0, 2), b: randomInt(0, 2), r: randomInt(0, 2), q: randomInt(0, 1), k: 1 }
      };
  }

  // Define valid squares for each piece type based on game phase
  const getValidSquares = (piece, gamePhase) => {
    const squares = [];
    const { color, type } = piece;
    
    if (gamePhase === GAME_PHASES.OPENING) {
      // For openings, keep pieces close to their starting positions
      if (type === 'p') {
        // Pawns can only be on ranks 2-4 for White, 5-7 for Black
        const minRank = color === 'w' ? 2 : 5;
        const maxRank = color === 'w' ? 4 : 7;
        for (let rank = minRank; rank <= maxRank; rank++) {
          for (let file = 0; file < 8; file++) {
            squares.push(`${String.fromCharCode(97 + file)}${rank}`);
          }
        }
      } else if (type === 'n') {
        // Knights can be on their starting squares or one move away
        const startRanks = color === 'w' ? [1, 2] : [7, 8];
        const startFiles = [1, 6];
        startFiles.forEach(file => {
          startRanks.forEach(rank => {
            squares.push(`${String.fromCharCode(97 + file)}${rank}`);
          });
        });
      } else if (type === 'b') {
        // Bishops can be on their starting squares or one move away
        const startRanks = color === 'w' ? [1, 2] : [7, 8];
        const startFiles = [2, 5];
        startFiles.forEach(file => {
          startRanks.forEach(rank => {
            squares.push(`${String.fromCharCode(97 + file)}${rank}`);
          });
        });
      } else if (type === 'r') {
        // Rooks can be on their starting squares or one move away
        const startRanks = color === 'w' ? [1, 2] : [7, 8];
        const startFiles = [0, 7];
        startFiles.forEach(file => {
          startRanks.forEach(rank => {
            squares.push(`${String.fromCharCode(97 + file)}${rank}`);
          });
        });
      } else if (type === 'q') {
        // Queen can be on her starting square or one move away
        const startRank = color === 'w' ? 1 : 8;
        const startFile = 3;
        for (let rank = startRank - 1; rank <= startRank + 1; rank++) {
          for (let file = startFile - 1; file <= startFile + 1; file++) {
            if (rank >= 1 && rank <= 8 && file >= 0 && file < 8) {
              squares.push(`${String.fromCharCode(97 + file)}${rank}`);
            }
          }
        }
      } else if (type === 'k') {
        // King can be on his starting square or one move away
        const startRank = color === 'w' ? 1 : 8;
        const startFile = 4;
        for (let rank = startRank - 1; rank <= startRank + 1; rank++) {
          for (let file = startFile - 1; file <= startFile + 1; file++) {
            if (rank >= 1 && rank <= 8 && file >= 0 && file < 8) {
              squares.push(`${String.fromCharCode(97 + file)}${rank}`);
            }
          }
        }
      }
    } else {
      // For middlegame and endgame, allow more freedom but still maintain some rules
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const square = `${String.fromCharCode(97 + j)}${8 - i}`;
          const currentRank = 8 - i;
          
          // Pawns can't be on first or last rank
          if (type === 'p' && (currentRank === 1 || currentRank === 8)) continue;
          
          // Kings can't be adjacent
          if (type === 'k') {
            const isAdjacentToKing = Object.entries(position).some(([sq, p]) => {
              if (p.type === 'k' && p.color !== color) {
                const [kFile, kRank] = [sq.charCodeAt(0) - 97, parseInt(sq[1])];
                return Math.abs(kFile - j) <= 1 && Math.abs(kRank - currentRank) <= 1;
              }
              return false;
            });
            if (isAdjacentToKing) continue;
          }
          
          squares.push(square);
        }
      }
    }
    
    return squares;
  };

  // Create arrays of pieces to place
  const pieces = [];
  const colors = ['w', 'b'];
  
  colors.forEach(color => {
    Object.entries(pieceCounts[color]).forEach(([type, count]) => {
      for (let i = 0; i < count; i++) {
        pieces.push({ color, type });
      }
    });
  });

  // Place pieces on valid squares
  pieces.forEach(piece => {
    const validSquares = getValidSquares(piece, gamePhase);
    if (validSquares.length > 0) {
      const randomSquare = validSquares[Math.floor(Math.random() * validSquares.length)];
      position[randomSquare] = piece;
    }
  });

  return position;
};

// Find all White pieces that are under threat
const findThreatenedPieces = (position, showLogs = false) => {
  if (showLogs) {
    console.log('\n=== Starting Threat Detection ===');
    
    // Create a visual representation of the board
    const board = Array(8).fill().map(() => Array(8).fill('.'));
    Object.entries(position).forEach(([square, piece]) => {
      const file = square.charCodeAt(0) - 97;
      const rank = 8 - parseInt(square[1]);
      board[rank][file] = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
    });
    
    console.log('\n=== Board Position ===');
    console.log('  a b c d e f g h');
    board.forEach((row, i) => {
      console.log(`${8 - i} ${row.join(' ')} ${8 - i}`);
    });
    console.log('  a b c d e f g h');
  }
  
  // Log complete board state
  const whitePieces = {};
  const blackPieces = {};
  
  // Sort pieces by color
  Object.entries(position).forEach(([square, piece]) => {
    if (piece.color === 'w') {
      whitePieces[square] = piece;
    } else {
      blackPieces[square] = piece;
    }
  });
  
  if (showLogs) {
    console.log('\n=== White Pieces ===');
    Object.entries(whitePieces).forEach(([square, piece]) => {
      console.log(`${square}: ${piece.type} (${piece.color})`);
    });
    
    console.log('\n=== Black Pieces ===');
    Object.entries(blackPieces).forEach(([square, piece]) => {
      console.log(`${square}: ${piece.type} (${piece.color})`);
    });
  }
  
  const threatenedPieces = [];
  const game = new Chess();
  
  // Set up the position
  Object.entries(position).forEach(([square, piece]) => {
    game.put(piece, square);
  });
  
  if (showLogs) {
    console.log('\n=== Game FEN ===');
    console.log(game.fen());
  }
  
  // Check each White piece
  Object.entries(whitePieces).forEach(([square, piece]) => {
    if (showLogs) {
      console.log(`\n=== Checking White ${piece.type} at ${square} ===`);
    }
    
    // Get all valid moves for each Black piece
    Object.entries(blackPieces).forEach(([fromSquare, attackingPiece]) => {
      if (showLogs) {
        console.log(`\nChecking Black ${attackingPiece.type} at ${fromSquare}`);
      }
      
      // Create a new game instance for each check to avoid state changes
      const gameCopy = new Chess();
      Object.entries(position).forEach(([sq, p]) => {
        gameCopy.put(p, sq);
      });
      
      // Set the turn to Black's turn
      gameCopy.load(gameCopy.fen().replace('w KQkq', 'b KQkq'));
      
      if (showLogs) {
        console.log(`Getting legal moves for Black ${attackingPiece.type} at ${fromSquare}`);
        console.log('Current game state:', gameCopy.fen());
      }
      
      const moves = gameCopy.moves({ square: fromSquare, verbose: true });
      
      if (showLogs) {
        console.log(`Number of legal moves found: ${moves.length}`);
        if (moves.length === 0) {
          console.log('No legal moves found. This might be because:');
          console.log('1. The piece is blocked by other pieces');
          console.log('2. The piece is pinned');
          console.log('3. The piece is not on the board');
          console.log('4. The piece is not the correct color for the current turn');
        } else {
          console.log('Legal moves:');
          moves.forEach(move => {
            console.log(`  ${move.from} -> ${move.to} (${move.piece}${move.captured ? ' captures ' + move.captured : ''})`);
          });
        }
      }
      
      // Check if any move can capture the White piece
      const canCapture = moves.some(move => move.to === square);
      
      if (canCapture) {
        if (showLogs) {
          console.log(`THREAT FOUND: Black ${attackingPiece.type} at ${fromSquare} can capture White ${piece.type} at ${square}`);
        }
        threatenedPieces.push(square);
      } else if (showLogs) {
        console.log(`No threat: Black ${attackingPiece.type} at ${fromSquare} cannot capture White ${piece.type} at ${square}`);
      }
    });
  });

  if (showLogs) {
    console.log('\n=== Final Results ===');
    console.log('Threatened pieces:', threatenedPieces);
  }
  
  return [...new Set(threatenedPieces)]; // Remove duplicates
};

export { createRandomPosition, findThreatenedPieces }; 