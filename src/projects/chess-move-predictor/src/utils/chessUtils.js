import { Chess } from 'chess.js';
import axios from 'axios';

// Generate a random number between min and max (inclusive)
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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
];

// Move categories and their base probabilities
const MOVE_CATEGORIES = {
  CAPTURE: 0.8,
  CHECK: 0.7,
  CASTLE: 0.6,
  PAWN_PUSH: 0.5,
  PIECE_DEVELOPMENT: 0.4,
  DEFAULT: 0.3
};

export const fetchRandomPosition = async (gamePhase = GAME_PHASES.RANDOM) => {
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

    // Check if response is empty or has no games
    if (!response.data || response.data.trim() === '') {
      console.warn(`No games found for ${randomPlayer}, trying another player...`);
      return fetchRandomPosition(gamePhase);
    }

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

    return game;
  } catch (error) {
    console.error("Error fetching games:", error.message);
    // Handle 404 errors or any other errors by trying a different user
    if (error.response?.status === 404) {
      console.warn(`User not found or no games available, trying another player...`);
    }
    return fetchRandomPosition(gamePhase);
  }
};

// Calculate move probability based on various factors
export const calculateMoveProbability = (game, move) => {
  try {
    const moveObj = game.move(move);
    if (!moveObj) return 0;

    let probability = MOVE_CATEGORIES.DEFAULT;

    // Check for captures
    if (moveObj.captured) {
      probability = MOVE_CATEGORIES.CAPTURE;
    }
    // Check for checks
    else if (game.in_check()) {
      probability = MOVE_CATEGORIES.CHECK;
    }
    // Check for castling
    else if (moveObj.flags.includes('k') || moveObj.flags.includes('q')) {
      probability = MOVE_CATEGORIES.CASTLE;
    }
    // Check for pawn pushes
    else if (moveObj.piece === 'p') {
      probability = MOVE_CATEGORIES.PAWN_PUSH;
    }
    // Check for piece development
    else if (['n', 'b', 'r', 'q'].includes(moveObj.piece)) {
      probability = MOVE_CATEGORIES.PIECE_DEVELOPMENT;
    }

    // Adjust probability based on game phase
    const gamePhase = determineGamePhase(game);
    switch (gamePhase) {
      case GAME_PHASES.OPENING:
        // Higher probability for development moves in opening
        if (['n', 'b', 'r', 'q'].includes(moveObj.piece)) {
          probability *= 1.2;
        }
        break;
      case GAME_PHASES.MIDDLEGAME:
        // Higher probability for tactical moves in middlegame
        if (moveObj.captured || game.in_check()) {
          probability *= 1.3;
        }
        break;
      case GAME_PHASES.ENDGAME:
        // Higher probability for king activity in endgame
        if (moveObj.piece === 'k') {
          probability *= 1.4;
        }
        break;
    }

    // Adjust probability based on piece value
    const pieceValues = {
      'p': 1,
      'n': 3,
      'b': 3,
      'r': 5,
      'q': 9,
      'k': 0
    };
    const pieceValue = pieceValues[moveObj.piece];
    probability *= (1 + pieceValue * 0.05);

    // Ensure probability stays within bounds
    return Math.min(Math.max(probability, 0.1), 1);
  } catch (error) {
    console.error('Error calculating move probability:', error);
    return 0;
  }
};

// Determine the current game phase
const determineGamePhase = (game) => {
  const pieceCount = game.board().flat().filter(Boolean).length;
  const moveCount = game.history().length;

  if (moveCount <= 15) return GAME_PHASES.OPENING;
  if (pieceCount <= 12) return GAME_PHASES.ENDGAME;
  return GAME_PHASES.MIDDLEGAME;
};

// Calculate total score for a board
export const calculateBoardScore = (board) => {
  if (!board.moves.length) return 0;

  // Calculate average probability of moves
  const avgProbability = board.moves.reduce((acc, move) => 
    acc + calculateMoveProbability(board.game, move), 0) / board.moves.length;

  // Bonus for number of moves (diminishing returns)
  const moveBonus = Math.min(board.moves.length * 0.1, 0.5);

  // Bonus for maintaining material advantage
  const materialBonus = calculateMaterialAdvantage(board.game);

  return (avgProbability + moveBonus + materialBonus) * 100;
};

// Calculate material advantage
const calculateMaterialAdvantage = (game) => {
  const pieceValues = {
    'p': 1,
    'n': 3,
    'b': 3,
    'r': 5,
    'q': 9,
    'k': 0
  };

  let advantage = 0;
  game.board().forEach(row => {
    row.forEach(piece => {
      if (piece) {
        const value = pieceValues[piece.type];
        advantage += piece.color === 'w' ? value : -value;
      }
    });
  });

  // Normalize advantage to a value between 0 and 1
  return Math.max(0, Math.min(1, (advantage + 39) / 78));
};

export const validateMove = (game, move) => {
  try {
    const result = game.move(move);
    return result !== null;
  } catch (error) {
    return false;
  }
};

export const calculateScore = (boards) => {
  // TODO: Implement scoring system
  // This will consider:
  // 1. Number of valid moves
  // 2. Probability of moves
  // 3. Number of boards created
  return 0; // Placeholder
}; 