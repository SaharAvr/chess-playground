import { Chess } from 'chess.js';
import axios from 'axios';
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

// List of notable Lichess players (GMs, IMs, streamers, etc.)
const LICHESS_PLAYERS = [
  'Aqua_Blazing',
  'KonstantinKornienko',
  'Zhigalko_Sergei',
  'penguingim1',
  'Night-King96',
  'Hripach007',
  'Mishka_The_Great',
  'ultraking1',
  'AngelitoRT',
  'msb2',
  'Firephoenix05',
  'abudabi22840',
  'dudewithabigflute',
  'Duhless1981',
  'Gordima',
  'merryxmaseverybody',
  'KontraJaKO',
  'SavvaVetokhin2009',
  'Guary1',
  'Tsoi_Dima',
  'Kirill_Klyukin',
  'cjota95',
  'Kostik_Mostik',
  'gmbarbosachess',
  'GutovAndrey',
  'kaumandur01',
  'doreality',
  'Vostanin',
  'EltajSafarli',
  'Loin_sn',
  'Samid2002',
  'TheRigos',
  'KILLERBISHOP888',
  'Never_back_down',
  'Nikita_Romanovskij',
  'Olaffo',
  'pressive',
  'AndrewHoma',
  'ElGafas',
  'herobrin1786',
  'Mamikon_Gharibyan',
  'FaustiOro',
  'ZH1END',
  'CakeinSpace',
  'AdriDem',
  'PumASan',
  'ChernyukMikhaiL',
  'Dr-CRO',
  'gan06',
  'Chewbacca18'
]

// Create a random position based on game phase
const createRandomPosition = async (gamePhase = GAME_PHASES.RANDOM) => {
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

const fetchRandomPosition = async (gamePhase = GAME_PHASES.RANDOM) => {

  const isCallingThisFunctionTooOften = (fetchRandomPosition?.cache && (Date.now() - fetchRandomPosition?.cache?.lastCallTime < 1000));
  if (isCallingThisFunctionTooOften) {
    const cache = fetchRandomPosition.cache;
    if (cache?.gamePhase === gamePhase) {
      if (cache?.position) {
        return cache.position;
      } else {
        const position = await cache.promise;
        return position;
      }
    }
  }

  fetchRandomPosition.cache = {};
  fetchRandomPosition.cache.lastCallTime = Date.now();
  fetchRandomPosition.cache.gamePhase = gamePhase;
  fetchRandomPosition.cache.promise = new Promise((resolve) => {
    fetchRandomPosition.cache.resolve = resolve;
  });

  try {
    // Pick a random player from the list
    const randomPlayer = LICHESS_PLAYERS[Math.floor(Math.random() * LICHESS_PLAYERS.length)];

    // Fetch the player's games (latest games first)
    const response = await axios.get(`https://lichess.org/api/games/user/${randomPlayer}?max=50&moves=true`);

    // Convert the NDJSON response into an array of game objects
    const gamesText = await response.data;
    const games = gamesText.trim().split("\n").map(line => JSON.parse(line));

    if (games.length === 0) {
      console.warn(`No games found for ${randomPlayer}, trying another player...`);
      return fetchRandomPosition(gamePhase); // Recursively try another player
    }

    // Pick a random game
    const randomGame = games[Math.floor(Math.random() * games.length)];

    // Extract the moves as an array
    const movesArray = randomGame.moves.split(" ");

    // Create a new chess instance to track the position
    const game = new Chess();

    // Determine which move to stop at based on game phase
    let targetMoveIndex;
    const totalMoves = movesArray.length;
    let startFromEnd;

    switch (gamePhase) {
      case GAME_PHASES.OPENING:
        // First 10-15 moves
        targetMoveIndex = Math.min(randomInt(10, 15) * 2, totalMoves);
        break;
      case GAME_PHASES.MIDDLEGAME:
        // Moves 15-30
        targetMoveIndex = Math.min(randomInt(15, 30) * 2, totalMoves);
        break;
      case GAME_PHASES.ENDGAME:
        // Last 15-20 moves
        startFromEnd = Math.min(randomInt(15, 20) * 2, totalMoves);
        targetMoveIndex = Math.max(totalMoves - startFromEnd, 0);
        break;
      default:
        // Random position
        targetMoveIndex = Math.min(randomInt(1, Math.floor(totalMoves / 2)) * 2, totalMoves);
    }

    // Play moves until target position
    for (let i = 0; i < targetMoveIndex; i++) {
      try {
        game.move(movesArray[i]);
      } catch {
        break;
      }
    }

    // Convert the position to the same format as createRandomPosition
    const position = {};
    const board = game.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const square = `${String.fromCharCode(97 + j)}${8 - i}`;
          position[square] = {
            type: piece.type,
            color: piece.color
          };
        }
      }
    }

    fetchRandomPosition.cache.position = position;
    fetchRandomPosition.cache.resolve(position);
    return position;

  } catch (error) {
    console.error("Error fetching games:", error.message);
    // Fallback to createRandomPosition if fetch fails
    // return createRandomPosition(gamePhase);
  }
};

// Find all White pieces that are under threat
function findThreatenedPieces(position) {
  // Step 1: Validate input and log position details
  if (!position || typeof position !== 'object') {
    console.error('Invalid position object');
    return { threatenedPieces: [], threatInfo: {} };
  }

  // Step 2: Create a new chess instance
  const game = new Chess();

  // Step 3: Set up the position
  try {
    // First, clear the board
    game.clear();

    // Then place each piece
    Object.entries(position).forEach(([square, piece]) => {
      if (!square || !piece || !piece.color || !piece.type) {
        console.error('Invalid piece data:', { square, piece });
        return;
      }
      game.put(piece, square);
    });

    // Step 4: Find threatened pieces
    const threatenedPieces = [];
    const threatInfo = {};

    // Get all pieces
    const whitePieces = [];
    const blackPieces = [];

    Object.entries(position).forEach(([square, piece]) => {
      if (piece.color === 'w') {
        whitePieces.push({ square, piece });
      } else if (piece.color === 'b') {
        blackPieces.push({ square, piece });
      }
    });

    // Check each white piece against each black piece
    whitePieces.forEach(({ square: whiteSquare, piece: whitePiece }) => {
      const attackers = game.attackers(whiteSquare, 'b');

      if (attackers.length > 0) {
        threatenedPieces.push(whiteSquare);
        threatInfo[whiteSquare] = {
          piece: whitePiece,
          attackers
        };
      }
    });

    return { threatenedPieces, threatInfo };
  } catch (error) {
    console.error('Error in threat detection:', error);
    return { threatenedPieces: [], threatInfo: {} };
  }
}

export { createRandomPosition, fetchRandomPosition, findThreatenedPieces }; 