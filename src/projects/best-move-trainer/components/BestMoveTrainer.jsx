import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, IconButton, Tooltip, Chip,
  Divider, CircularProgress, Badge, Button,
  TextField, Snackbar, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import BarChartIcon from '@mui/icons-material/BarChart';
import SchoolIcon from '@mui/icons-material/School';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { InputAdornment } from '@mui/material';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from 'use-sound';
import moveSound from '../../tactics-finder/sounds/move.mp3';
import captureSound from '../../tactics-finder/sounds/capture.mp3';
import StatsPanel from './StatsPanel';
import SharedModal from './SharedModal';
import { useToast } from '../context/ToastContext';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { analyzeLocal } from '../utils/stockfish';

// ─── Gemini Hint ─────────────────────────────────────────────────────────────
async function fetchHintClue(fen, bestMoveSan, excludeHint = '') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') return null;
  try {
    const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      contents: [{
        role: 'user',
        parts: [{ text: `You are a practical, direct chess coach. Give a HINT for the best move (${bestMoveSan}) in this position: ${fen}. 
          RULES: 
          1. Use simple English. NO poetry or abstract metaphors (e.g., skip "heart of the battle").
          2. Be literal: Mention things like "the center", "king safety", "piece activity", or "attacking pieces".
          3. One short sentence (max 12 words).
          4. Do NOT name the move, piece, or square.
          5. ${excludeHint ? `Do NOT repeat: "${excludeHint}".` : ''} 
          
          GOOD example: "Look for a way to attack two pieces at the same time."
          BAD example: "Strengthen your grip on the battlefield's heart."` }]
      }]
    });
    return res.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error('Hint fetch error:', err);
    return null;
  }
}

// ─── Gemini Explanation ───────────────────────────────────────────────────────
async function fetchMoveExplanation(fen, bestMoveSan, pv = '') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') return null;

  try {
    const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      contents: [{
        role: 'user',
        parts: [{ text: `You are a practical, direct chess coach. Explain briefly (1-2 sentences) why "${bestMoveSan}" is the best move in this position: ${fen}.
          RULES:
          1. Use simple English. No complex professional terminology or flowery metaphors.
          2. Explain the concrete strategic or tactical logic (e.g., "It controls the center" or "It pins the queen").
          3. ${pv ? `Expected continuation: ${pv}. ` : ''}
          4. Do NOT mention FEN.` }]
      }]
    });
    return res.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Explanation fetch error:", err);
    return "Failed to load explanation.";
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'chess_best_move_trainer_stats';
const FAILURES_KEY = 'chess_best_move_failures';
const THEME_COLOR = '#7C3AED';

// ─── Themes ───────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: 'linear-gradient(180deg, #fffef1 0%, #ffffff 55%)',
  textPrimary: '#0F172A', textSecondary: '#64748B', textTertiary: '#94A3B8',
  iconColor: '#64748B', iconBorder: 'rgba(0,0,0,0.12)',
  boardShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
  boardBorder: 'rgba(0,0,0,0.07)', loadingBg: 'linear-gradient(135deg, #f8f4ee, #f5f0e8)',
  cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.07)', divider: 'rgba(0,0,0,0.07)',
  playBg: '#ffffff', playBorder: 'rgba(124,58,237,0.15)', playTitle: '#1E1B4B', playSub: '#64748B',
  correctBg: '#f0fdf4', correctBorder: '#bbf7d0', correctTitle: '#15803D', correctSub: '#166534',
  wrongBg: '#fef2f2', wrongBorder: '#fecaca', wrongTitle: '#991B1B', wrongSub: '#B91C1C',
  retryBg: '#fffbeb', retryBorder: '#fde68a', retryTitle: '#92400E', retrySub: '#B45309',
};
const DARK = {
  bg: 'linear-gradient(135deg, #0F0720 0%, #1A0938 40%, #0D1B2A 100%)',
  textPrimary: '#F1F5F9', textSecondary: '#94A3B8', textTertiary: '#64748B',
  iconColor: '#94A3B8', iconBorder: 'rgba(255,255,255,0.1)',
  boardShadow: '0 0 60px rgba(124,58,237,0.25), 0 20px 60px rgba(0,0,0,0.5)',
  boardBorder: 'rgba(255,255,255,0.08)', loadingBg: 'rgba(15,7,32,0.9)',
  cardBg: 'rgba(255,255,255,0.04)', cardBorder: 'rgba(255,255,255,0.09)', divider: 'rgba(255,255,255,0.07)',
  playBg: 'rgba(124,58,237,0.08)', playBorder: 'rgba(124,58,237,0.2)', playTitle: '#C4B5FD', playSub: '#7C6FA6',
  correctBg: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
  correctBorder: 'rgba(34,197,94,0.3)', correctTitle: '#86EFAC', correctSub: '#4ADE80',
  wrongBg: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
  wrongBorder: 'rgba(239,68,68,0.3)', wrongTitle: '#FCA5A5', wrongSub: '#FCA5A5',
  retryBg: 'rgba(251,191,36,0.1)', retryBorder: 'rgba(251,191,36,0.3)', retryTitle: '#FCD34D', retrySub: '#FDE68A',
};

// ─── Stats helpers ────────────────────────────────────────────────────────────
const initStats = () => ({
  totalAttempts: 0, totalCorrect: 0, dailyHistory: {},
  lastPlayed: null, streak: 0, longestStreak: 0,
});
const loadStats = () => {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? { ...initStats(), ...JSON.parse(r) } : initStats(); }
  catch (_) { return initStats(); }
};
const saveStats = s => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (_) { } };
const todayKey = () => new Date().toISOString().slice(0, 10);

// ─── Failures helpers ─────────────────────────────────────────────────────────
const fenKey = fen => fen.split(' ').slice(0, 2).join(' '); // board + turn only

const loadFailures = () => {
  try { const r = localStorage.getItem(FAILURES_KEY); return r ? JSON.parse(r) : {}; }
  catch (_) { return {}; }
};
const saveFailures = f => { try { localStorage.setItem(FAILURES_KEY, JSON.stringify(f)); } catch (_) { } };

// Sort failures: successes/(fails+1) ascending — hardest (least success rate) first
const sortedFailures = failures =>
  Object.values(failures)
    .filter(f => f.fails > 0)
    .sort((a, b) => (a.successes / (a.fails + 1)) - (b.successes / (b.fails + 1)));

// ─── Fetch position analysis ────────────────────────────────────────────────────
async function fetchPositionAnalysis(fen, engineMode = 'local', lichessGame = null) {
  const g = new Chess(fen);
  if (g.isGameOver()) throw new Error('Position already over');

  const orientation = g.turn() === 'w' ? 'white' : 'black';

  let bestData;
  try {
    if (engineMode === 'api') {
      bestData = await axios.post('https://chess-api.com/v1', { fen, depth: 14, variants: 3 })
        .then(res => ({ ...res.data, source: 'api' }));
    } else if (engineMode === 'local') {
      bestData = await analyzeLocal(fen, 14);
    } else {
      // Race mode
      const apiPromise = axios.post('https://chess-api.com/v1', { fen, depth: 14, variants: 3 })
        .then(res => ({ ...res.data, source: 'api' }));
      const localPromise = analyzeLocal(fen, 13);
      bestData = await Promise.race([apiPromise, localPromise]);
    }
    
    console.log(`🚀 Analysis source: ${bestData.source || 'api'}`);
    if (bestData.error) throw new Error(bestData.text || 'Engine error');
  } catch (err) {
    console.warn("Analysis error, falling back to local...", err);
    bestData = await analyzeLocal(fen, 12);
  }

  const topMoves = Array.isArray(bestData)
    ? bestData.map(m => m.move).filter(Boolean)
    : [bestData.move].filter(Boolean);
  
  if (!topMoves.length) throw new Error('No moves from engine');

  let username = 'Shared Position';
  if (lichessGame) {
    const white = lichessGame.players?.find(p => p.color === 'white')?.name || '?';
    const black = lichessGame.players?.find(p => p.color === 'black')?.name || '?';
    username = `${white} vs ${black}`;
  }

  // Convert UCI to SAN for local results if needed
  let bestMoveSan = bestData.san || bestData.text;
  if (!bestMoveSan && bestData.move) {
    try {
      const moveObj = g.move(bestData.move);
      if (moveObj) {
        bestMoveSan = moveObj.san;
        g.undo(); // pull back for consistency
      }
    } catch (_) { 
      bestMoveSan = bestData.move; 
    }
  }

  const pvRaw = bestData?.continuationArr || (bestData?.text?.includes(' ') ? bestData.text.split(' ') : [bestData?.text].filter(Boolean));
  const pv = pvRaw.join(' ');

  return {
    fen, orientation, topMoves,
    bestMoveSan: bestMoveSan || topMoves[0],
    evalScore: bestData?.eval,
    username,
    pv
  };
}

// ─── Fetch normal position (from a real game, NOT a puzzle) ──────────────────
// Pool of Lichess usernames across a range of skill levels
const PLAYER_POOL = [
  // ── Top GMs ──────────────────────────────────────────────────────────────
  'DrNykterstein', 'MagnusCarlsen', 'nihalsarin2004', 'Firouzja2003',
  'Hikaru', 'alireza2003', 'DanielNaroditsky', 'lachesisQ',
  'Zhigalko_Sergei', 'rpragchess', 'penguingim1', 'Andrew-tang',
  // ── Strong IMs / FMs ─────────────────────────────────────────────────────
  'oleksandr_bortnyk', 'joppie2', 'Lance5500', 'Rebel-1',
  'Keaton_Kassa', 'chess-network', 'GothamChess',
  // ── Club Players (1500–1800) ──────────────────────────────────────────────
  'nanoballoon', 'Ondine56', 'chess_enjoyer_99', 'Patzer1971',
  'TacticsKing', 'middlegame_maniac', 'e4e5forever', 'CaissaFan',
  'Oncegood', 'PlacidoMingo', 'TheBishopPair', 'blunderbuss88',
  // ── Beginners / Casual (1000–1400) ───────────────────────────────────────
  'Rookie2024', 'letsplaychess99', 'PawnsAndDreams', 'Coffeehouseking',
  'just_learning_chess', 'Tuesday_Blitz', 'chessaddict42', 'OpeningTrap',
  // ── Misc active players ───────────────────────────────────────────────────
  'chessbrahs', 'SimonWilliams1', 'kassa_korley', 'Eric_Rosen',
  'JohnBartholomewChess', 'agadmator',
];

async function fetchRandomPosition(engineMode = 'local') {
  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const username = PLAYER_POOL[Math.floor(Math.random() * PLAYER_POOL.length)];
      // Fetch up to 8 of their recent rated blitz or rapid games in ndjson format
      const gamesRes = await axios.get(
        `https://lichess.org/api/games/user/${username}?max=8&rated=true&perfType=blitz,rapid&clocks=false&evals=false&opening=false`,
        { headers: { Accept: 'application/x-ndjson' }, responseType: 'text' }
      );

      // Parse newline-delimited JSON
      const games = gamesRes.data
        .trim()
        .split('\n')
        .map(line => { try { return JSON.parse(line); } catch { return null; } })
        .filter(Boolean)
        .filter(g => g.status !== 'aborted' && g.moves && g.moves.split(' ').length > 25);

      if (!games.length) continue;

      const game = games[Math.floor(Math.random() * games.length)];
      const tokens = game.moves.split(' ').filter(t =>
        !t.match(/^(\d+\.+|1-0|0-1|1\/2-1\/2|\*)$/)
      );
      if (tokens.length < 20) continue;

      // Pick a random position between move 12 and move 40 (or 80% through, whichever is less)
      const minPly = Math.min(24, Math.floor(tokens.length * 0.25)); // ~move 12
      const maxPly = Math.min(80, Math.floor(tokens.length * 0.80)); // ~move 40 or 80%
      if (maxPly <= minPly) continue;
      const targetPly = minPly + Math.floor(Math.random() * (maxPly - minPly));

      const g = new Chess();
      for (let i = 0; i < targetPly; i++) {
        try { g.move(tokens[i]); } catch (_) { break; }
      }

      if (g.isGameOver()) continue;

      const white = game.players?.white?.user?.name || '?';
      const black = game.players?.black?.user?.name || '?';
      const lichessGameMeta = { players: [{ color: 'white', name: white }, { color: 'black', name: black }] };

      return fetchPositionAnalysis(g.fen(), engineMode, lichessGameMeta);
    } catch (err) {
      console.warn(`fetchRandomPosition attempt ${attempt + 1} failed:`, err.message);
      if (attempt === maxRetries - 1) throw err;
    }
  }
  throw new Error('Could not fetch a valid position after retries');
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BestMoveTrainer() {
  const [mode, setMode] = useState('normal'); // 'normal' | 'practice'
  const [position, setPosition] = useState(null);
  const [game, setGame] = useState(null);
  const [fen, setFen] = useState('start');
  const [status, setStatus] = useState('loading');
  const [hintUsed, setHintUsed] = useState(false);
  const [aiHint, setAiHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0); // per-position wrong count
  const [sessionRecorded, setSessionRecorded] = useState(false); // only record once per position
  const [stats, setStats] = useState(loadStats);
  const [failures, setFailures] = useState(loadFailures);
  const [showStats, setShowStats] = useState(false);
  const [arrows, setArrows] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [wrongSquares, setWrongSquares] = useState({});
  const [correctSquares, setCorrectSquares] = useState({});
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveHighlights, setMoveHighlights] = useState({});
  const [explanation, setExplanation] = useState(null);
  const [explainingStatus, setExplainingStatus] = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [boardWidth, setBoardWidth] = useState(440);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [pvIndex, setPvIndex] = useState(-1);
  const [engineMode, setEngineMode] = useState(() => localStorage.getItem('best_move_engine_mode') || 'dual');

  useEffect(() => {
    localStorage.setItem('best_move_engine_mode', engineMode);
  }, [engineMode]);



  const [playMove] = useSound(moveSound, { volume: 0.7 });
  const [playCapture] = useSound(captureSound, { volume: 0.7 });

  // ── Load ──────────────────────────────────────────────────────────────────
  const resetBoard = useCallback(() => {
    setFen('');
    setFeedback(null);
    setArrows([]);
    setWrongSquares({});
    setCorrectSquares({});
    setHintUsed(false);
    setAiHint(null);
    setHintLoading(false);
    setWrongAttempts(0);
    setExplanation(null);
    setExplainingStatus('idle');
    setSessionRecorded(false);
    setPvIndex(-1);
    setSelectedSquare(null);
    setMoveHighlights({});
  }, []);

  const initialFenRef = React.useRef(true);
  const isFetchingRef = React.useRef(false);

  const loadNewPosition = useCallback(async (currentMode) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const m = currentMode ?? mode;
    setStatus('loading');
    setPosition(null);
    resetBoard();

    let urlFen = null;
    if (initialFenRef.current) {
      initialFenRef.current = false;
      const param = new URLSearchParams(window.location.search).get('fen');
      if (param) urlFen = param.replace(/_/g, ' '); // Decode underscores back to spaces
    }

    try {
      let p;
      if (urlFen) {
        p = await fetchPositionAnalysis(urlFen, engineMode);
      } else if (m === 'practice') {
        const fl = loadFailures();
        const sorted = sortedFailures(fl);
        if (!sorted.length) { 
          setMode('normal'); 
          setStatus('loading'); 
          isFetchingRef.current = false;
          return loadNewPosition('normal'); 
        }
        // Pick from top 3 hardest (add slight randomness)
        const topN = Math.min(3, sorted.length);
        const picked = sorted[Math.floor(Math.random() * topN)];
        p = {
          fen: picked.fen,
          orientation: picked.orientation,
          topMoves: [picked.bestMove],
          bestMoveSan: picked.bestMoveSan,
          evalScore: picked.evalScore,
          username: picked.username,
          pv: picked.pv,
          practiceStats: { fails: picked.fails, successes: picked.successes },
          explanation: picked.explanation,
        };
      } else {
        p = await fetchRandomPosition(engineMode);
      }
      setPosition(p);
      setGame(new Chess(p.fen));
      setFen(p.fen);
      setStatus('playing');

      const baseUrl = window.location.origin + window.location.pathname;
      const fenParam = p.fen.replace(/ /g, '_');
      window.history.replaceState({}, '', `${baseUrl}?fen=${fenParam}`);
    } catch (err) {
      console.error(err);
      try {
        const p = await fetchRandomPosition(engineMode);
        setPosition(p); setGame(new Chess(p.fen)); setFen(p.fen); setStatus('playing');

        const baseUrl = window.location.origin + window.location.pathname;
        const fenParam = p.fen.replace(/ /g, '_');
        window.history.replaceState({}, '', `${baseUrl}?fen=${fenParam}`);
      } catch (_) { setStatus('loading'); }
    } finally {
      isFetchingRef.current = false;
    }
  }, [mode]); // eslint-disable-line

  useEffect(() => { loadNewPosition(mode); }, []); // eslint-disable-line

  // ── Responsive Board Width ────────────────────────────────────────────────
  useEffect(() => {
    const calcWidth = () => {
      if (window.innerWidth < 900) {
        setBoardWidth(window.innerWidth - 32); 
      } else {
        // Desktop: fill available height to perfectly fit screen
        // We give 80px total vertical padding (40px top, 40px bottom)
        const availableHeight = window.innerHeight - 80;
        const maxWidth = (window.innerWidth - 120) * 0.6; // account for gap and right panel
        setBoardWidth(Math.max(400, Math.min(availableHeight, maxWidth, 1000))); 
      }
    };
    calcWidth();
    window.addEventListener('resize', calcWidth);
    return () => window.removeEventListener('resize', calcWidth);
  }, []);

  // Toasts and confirmation are handled via context or local state
  const handleCloseStats = useCallback(() => setShowStats(false), []);
  const handleCloseSettings = useCallback(() => setShowSettings(false), []);
  const handleCloseConfirmReset = useCallback(() => setShowConfirmReset(false), []);

  // ── Toast/Settings ────────────────────────────────────────────────────────
  const showToast = useToast();

  const handleSaveSettings = () => {
    // API key is optional for board functionality but needed for AI explanations
    if (apiKeyInput.trim()) {
      localStorage.setItem('gemini_api_key', apiKeyInput);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    
    setShowSettings(false);
    setExplainingStatus('idle');
    showToast('Settings saved successfully!', 'success');
  };

  const handleResetStats = () => {
    const fresh = initStats();
    setStats(fresh);
    saveStats(fresh);
    setShowConfirmReset(false);
    showToast('Statistics have been reset.', 'success');
  };

  // ── Overall stats ─────────────────────────────────────────────────────────
  const recordResult = useCallback((correct) => {
    setStats(prev => {
      const today = todayKey();
      const daily = prev.dailyHistory[today] || { attempts: 0, correct: 0 };
      const newStr = correct ? prev.streak + 1 : 0;
      const updated = {
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
        dailyHistory: { ...prev.dailyHistory, [today]: { attempts: daily.attempts + 1, correct: daily.correct + (correct ? 1 : 0) } },
        lastPlayed: new Date().toISOString(),
        streak: newStr,
        longestStreak: Math.max(prev.longestStreak, newStr),
      };
      saveStats(updated);
      return updated;
    });
  }, []);

  // ── Failures tracking ─────────────────────────────────────────────────────
  const recordFailure = useCallback((pos) => {
    if (!pos) return;
    const key = fenKey(pos.fen);
    setFailures(prev => {
      const existing = prev[key] || {
        fen: pos.fen, orientation: pos.orientation,
        bestMove: pos.topMoves[0], bestMoveSan: pos.bestMoveSan,
        evalScore: pos.evalScore, username: pos.username,
        pv: pos.pv,
        fails: 0, successes: 0, addedAt: todayKey(),
      };
      const updated = { ...prev, [key]: { ...existing, fails: existing.fails + 1, lastAttempted: new Date().toISOString() } };
      saveFailures(updated);
      return updated;
    });
  }, []);

  const recordSuccess = useCallback((pos) => {
    if (!pos) return;
    const key = fenKey(pos.fen);
    setFailures(prev => {
      if (!prev[key]) return prev; // not in failures, no need to track success
      const updated = { ...prev, [key]: { ...prev[key], successes: prev[key].successes + 1, lastAttempted: new Date().toISOString() } };
      saveFailures(updated);
      return updated;
    });
  }, []);

  const updateFailureExplanation = useCallback((pos, exp) => {
    if (!pos) return;
    const key = fenKey(pos.fen);
    setFailures(prev => {
      if (!prev[key]) return prev;
      const updated = { ...prev, [key]: { ...prev[key], explanation: exp } };
      saveFailures(updated);
      return updated;
    });
  }, []);

  // ── Move highlights ───────────────────────────────────────────────────────
  const getMoveHighlights = useCallback((square) => {
    if (!game) return {};
    const movesFrom = game.moves({ verbose: true }).filter(m => m.from === square);
    const hl = { [square]: { background: 'rgba(246,246,105,0.28)' } };
    movesFrom.forEach(m => {
      hl[m.to] = m.captured
        ? { background: 'radial-gradient(circle, transparent 58%, rgba(20,20,20,0.22) 58%)' }
        : { background: 'radial-gradient(circle, rgba(20,20,20,0.18) 28%, transparent 29%)' };
    });
    return hl;
  }, [game]);

  const clearSelection = useCallback(() => { setSelectedSquare(null); setMoveHighlights({}); }, []);

  // ── Execute move ──────────────────────────────────────────────────────────
  const executeMoveAttempt = useCallback((src, tgt) => {
    if (!game || !position) return false;
    // Allow exploring if correct or revealed
    if (status !== 'playing' && status !== 'correct' && status !== 'revealed') return false;

    const gameCopy = new Chess(game.fen());
    let moveResult;
    try {
      const moving = gameCopy.get(src);
      const promo = moving?.type === 'p' &&
        ((moving.color === 'w' && tgt[1] === '8') || (moving.color === 'b' && tgt[1] === '1'))
        ? 'q' : undefined;
      moveResult = gameCopy.move({ from: src, to: tgt, promotion: promo });
    } catch (_) { return false; }
    if (!moveResult) return false;

    const playedUci = `${src}${tgt}`;
    
    // Exploratory mode
    if (status === 'correct' || status === 'revealed') {
      const pvArray = (position.pv || '').split(' ').filter(Boolean);
      
      // If we haven't started tracking, find where we are in the PV
      let currentIdx = pvIndex;
      if (currentIdx === -1 && pvArray.length > 0) {
        // If the move I just played is PV[0], then I'm at index 0.
        // If it's NOT PV[0], maybe I'm playing PV[1] (if PV[0] was the opponent response)? 
        // Or maybe I just went off-track.
        if (playedUci === pvArray[0]) currentIdx = 0;
      } else if (currentIdx !== -1) {
        // We were already on track, check if this is the next move
        if (playedUci === pvArray[currentIdx + 1]) {
          currentIdx++;
        } else {
          currentIdx = -1; // Off-track
        }
      }

      if (moveResult.captured) playCapture(); else playMove();
      setGame(gameCopy); setFen(gameCopy.fen());
      setCorrectSquares({}); setWrongSquares({});
      clearSelection();

      setPvIndex(currentIdx);
      if (currentIdx !== -1) {
        const nextMove = pvArray[currentIdx + 1];
        if (nextMove && nextMove.length >= 4) {
          const from = nextMove.slice(0, 2);
          const to = nextMove.slice(2, 4);
          // Restore bold color since it will be UNDER the pieces now
          setArrows([[from, to, '#8B5CF6']]);
          setCorrectSquares({ 
            [from]: { background: 'radial-gradient(circle, transparent 20%, rgba(139,92,246,0.5) 21%, rgba(139,92,246,0.5) 30%, transparent 31%)' }, 
            [to]: { background: isDark ? 'rgba(139,92,246,0.5)' : 'rgba(124,58,237,0.3)', borderRadius: '12px' } 
          });
        } else {
          setArrows([]);
          setCorrectSquares({});
        }
      } else {
        setArrows([]);
        setCorrectSquares({});
      }
      return true;
    }

    const isCorrect = position.topMoves.some(m => m.startsWith(playedUci));

    clearSelection();

    if (isCorrect) {
      if (moveResult.captured) playCapture(); else playMove();
      setCorrectSquares({ [src]: { background: 'rgba(34,197,94,0.35)' }, [tgt]: { background: 'rgba(34,197,94,0.55)' } });
      setWrongSquares({});
      setGame(gameCopy); setFen(gameCopy.fen());
      setArrows([]);
      setFeedback({ type: 'correct', san: moveResult.san });
      setStatus('correct');
      
      // Start PV / continuation tracking
      const pvArray = position.pv.split(' ').filter(Boolean);
      if (pvArray.length > 0) {
        // If the first move in the PV array is NOT the move we just played, 
        // then the PV starts with the opponent's response.
        const firstIsMine = pvArray[0] === playedUci;
        const currentIdxInPV = firstIsMine ? 0 : -1;
        setPvIndex(currentIdxInPV);
        
        const nextMove = pvArray[currentIdxInPV + 1];
        if (nextMove && nextMove.length >= 4) {
          const from = nextMove.slice(0, 2);
          const to = nextMove.slice(2, 4);
          setArrows([[from, to, '#8B5CF6']]);
          setCorrectSquares({ 
            [from]: { background: 'radial-gradient(circle, transparent 20%, rgba(139,92,246,0.5) 21%, rgba(139,92,246,0.5) 30%, transparent 31%)' }, 
            [to]: { background: isDark ? 'rgba(139,92,246,0.5)' : 'rgba(124,58,237,0.3)', borderRadius: '12px' } 
          });
        }
      }

      if (!sessionRecorded) { recordResult(true); setSessionRecorded(true); }
      recordSuccess(position);
    } else {
      // Wrong: flash briefly, then return to 'playing' — let them retry
      setWrongSquares({ [src]: { background: 'rgba(239,68,68,0.4)' }, [tgt]: { background: 'rgba(239,68,68,0.3)' } });
      setCorrectSquares({});
      setFeedback({ type: 'retry', attempts: wrongAttempts + 1 });
      setWrongAttempts(w => w + 1);

      if (!sessionRecorded) {
        recordResult(false);
        recordFailure(position); // track per-position failure only once per session
        setSessionRecorded(true);
      }
      
      setTimeout(() => {
        setWrongSquares({});
        // Keep feedback as 'retry' so they can see attempt count
      }, 700);
      // Don't change status — stays 'playing'
    }
    return isCorrect;
  }, [game, position, status, wrongAttempts, sessionRecorded, playMove, playCapture, recordResult, recordSuccess, recordFailure, clearSelection]);

  // ── Drag / Click ──────────────────────────────────────────────────────────
  // onPieceDragBegin: fires reliably from react-chessboard when dragging starts.
  const onPieceDragBegin = useCallback((_piece, sourceSquare) => {
    if (status !== 'playing' && status !== 'correct' && status !== 'revealed') return;
    setSelectedSquare(sourceSquare);
    setMoveHighlights(getMoveHighlights(sourceSquare));
    setWrongSquares({}); setCorrectSquares({});
  }, [status, getMoveHighlights]);

  const onPieceDrop = useCallback((src, tgt) => {
    clearSelection();
    return executeMoveAttempt(src, tgt);
  }, [executeMoveAttempt, clearSelection]);

  const onSquareClick = useCallback((square) => {
    if (!game) return;
    if (status !== 'playing' && status !== 'correct' && status !== 'revealed') return;

    // Use game.turn() directly — always in sync with the actual board position
    const playerColor = game.turn(); // 'w' or 'b'
    const piece = game.get(square);

    // Second click on a highlighted destination → execute move
    if (selectedSquare && moveHighlights[square] && square !== selectedSquare) {
      executeMoveAttempt(selectedSquare, square);
      return;
    }

    // Click on own piece → select + show moves
    if (piece && piece.color === playerColor) {
      if (selectedSquare === square) {
        clearSelection();
      } else {
        // Inline move highlight calculation — avoids any stale getMoveHighlights closure
        const movesFrom = game.moves({ verbose: true }).filter(m => m.from === square);
        const hl = { [square]: { background: 'rgba(246,246,105,0.28)' } };
        movesFrom.forEach(m => {
          hl[m.to] = m.captured
            ? { background: 'radial-gradient(circle, transparent 58%, rgba(20,20,20,0.22) 58%)' }
            : { background: 'radial-gradient(circle, rgba(20,20,20,0.18) 28%, transparent 29%)' };
        });
        setSelectedSquare(square);
        setMoveHighlights(hl);
        setWrongSquares({}); setCorrectSquares({});
      }
      return;
    }

    clearSelection();
  }, [game, status, selectedSquare, moveHighlights, executeMoveAttempt, clearSelection]);

  // ── Compute Check Square ──────────────────────────────────────────────────
  const checkSquare = React.useMemo(() => {
    if (!game || !game.inCheck()) return {};
    const turn = game.turn();
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          return { [p.square]: { background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.9) 0%, rgba(239,68,68,0.4) 40%, transparent 70%)', borderRadius: '50%' } };
        }
      }
    }
    return {};
  }, [game, fen]); // recompute when FEN updates

  // ── Hint ──────────────────────────────────────────────────────────────────
  const showHint = useCallback(async (refresh = false) => {
    if (!position || status !== 'playing') return;
    if (!refresh) setHintUsed(true); 
    clearSelection();
    
    const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    const hasApiKey = apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim() !== '';
    
    if (hasApiKey) {
      setHintLoading(true);
      const clue = await fetchHintClue(position.fen, position.bestMoveSan, refresh ? aiHint : '');
      setAiHint(clue || 'Think about forcing moves — checks, captures, and threats.');
      setHintLoading(false);
    } else {
      const best = position.topMoves[0];
      if (best) setArrows([[best.slice(0, 2), best.slice(2, 4), THEME_COLOR]]);
    }
  }, [position, status, clearSelection, aiHint]);

  // ── Reveal ────────────────────────────────────────────────────────────────
  const revealAnswer = useCallback(() => {
    if (!position) return;
    const best = position.topMoves[0];
    if (best) setArrows([[best.slice(0, 2), best.slice(2, 4), '#EF4444']]);
    setFeedback({ type: 'revealed', best: position.bestMoveSan });
    setStatus('revealed'); clearSelection();
    
    // Record this position attempt as a loss if not yet recorded
    if (!sessionRecorded) { 
      recordResult(false); 
      recordFailure(position);
      setSessionRecorded(true); 
    }
  }, [position, sessionRecorded, recordResult, recordFailure, clearSelection]);

  // ── Ask AI ────────────────────────────────────────────────────────────────
  const handleAskAI = useCallback(() => {
    if (position?.explanation) {
      setExplanation(position.explanation);
      setExplainingStatus('done');
      return;
    }
    setExplainingStatus('loading');
    const san = status === 'correct' ? feedback?.san : position.bestMoveSan;
    fetchMoveExplanation(position.fen, san, position.pv).then(exp => {
      setExplanation(exp);
      setExplainingStatus('done');
      updateFailureExplanation(position, exp);
    });
  }, [position, status, feedback, updateFailureExplanation]);

  // ── Skip ──────────────────────────────────────────────────────────────────
  const skipPosition = useCallback(() => {
    if (!sessionRecorded && wrongAttempts > 0) { recordResult(false); }
    loadNewPosition(mode);
  }, [sessionRecorded, wrongAttempts, recordResult, loadNewPosition, mode]);

  // ── Mode switch ───────────────────────────────────────────────────────────
  const switchMode = useCallback((newMode) => {
    setMode(newMode);
    loadNewPosition(newMode);
  }, [loadNewPosition]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isDark = position?.orientation === 'black';
  const T = isDark ? DARK : LIGHT;
  const accuracy = stats.totalAttempts > 0 ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : 0;
  const todayStats = stats.dailyHistory[todayKey()] || { attempts: 0, correct: 0 };
  const todayAcc = todayStats.attempts > 0 ? Math.round((todayStats.correct / todayStats.attempts) * 100) : 0;
  const evalDisp = position?.evalScore != null ? (position.evalScore > 0 ? `+${position.evalScore.toFixed(1)}` : position.evalScore.toFixed(1)) : null;
  const failureCount = Object.keys(failures).filter(k => failures[k].fails > 0).length;
  const posStats = position ? failures[fenKey(position.fen)] : null;

  // ── Render Helpers ───────────────────────────────────────────────────────
  const renderHeader = (displaySx) => (
    <Box sx={{ display: displaySx, width: '100%', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 1.5, md: 0 }, flexWrap: 'wrap', gap: 1, px: { xs: 1.5, md: 0 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Box sx={{ width: { xs: 30, md: 36 }, height: { xs: 30, md: 36 }, borderRadius: '10px', background: `linear-gradient(135deg, ${THEME_COLOR}, #9F67FA)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 15px ${THEME_COLOR}30`, flexShrink: 0 }}>
          <EmojiEventsIcon sx={{ color: '#fff', fontSize: { xs: 16, md: 20 } }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: T.textPrimary, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: { xs: '0.9rem', md: '1.2rem' } }}>
            Best Move Trainer
          </Typography>
          <Typography variant="caption" sx={{ color: T.textSecondary, display: { xs: 'none', sm: 'block' }, lineHeight: 1.2, mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem' }}>
            {mode === 'practice' ? '🔁 Practice failures' : 'Real games · Stockfish'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
        {stats.streak > 1 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Chip icon={<TrendingUpIcon sx={{ fontSize: 13 }} />} label={`${stats.streak}`} size="small"
              sx={{ background: 'linear-gradient(90deg, #F59E0B, #EF4444)', color: '#fff', fontWeight: 600, fontSize: '0.7rem', height: 20, '& .MuiChip-icon': { color: '#fff' } }} />
          </motion.div>
        )}

        {(failureCount > 0 || mode === 'practice') && (
        <Tooltip title={mode === 'normal' ? `Practice failures (${failureCount})` : 'Back to normal mode'}>
          <span>
            <IconButton onClick={() => switchMode(mode === 'normal' ? 'practice' : 'normal')} sx={{ color: mode === 'practice' ? '#F59E0B' : T.iconColor, border: `1.5px solid ${mode === 'practice' ? '#F59E0B' : T.iconBorder}`, borderRadius: '8px', p: '6px', transition: 'all 0.2s' }}>
              <Badge badgeContent={failureCount > 0 ? failureCount : null} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.55rem', height: 14, minWidth: 14 } }}>
                {mode === 'practice' ? <FlashOnIcon sx={{ fontSize: 18 }} /> : <SchoolIcon sx={{ fontSize: 18 }} />}
              </Badge>
            </IconButton>
          </span>
        </Tooltip>
        )}

        <Tooltip title="Stats">
          <IconButton onClick={() => setShowStats(v => !v)} sx={{ color: showStats ? THEME_COLOR : T.iconColor, border: `1.5px solid ${showStats ? THEME_COLOR : T.iconBorder}`, borderRadius: '8px', p: '6px', transition: 'all 0.2s' }}>
            <BarChartIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Settings">
          <IconButton onClick={() => setShowSettings(true)} sx={{ color: T.iconColor, border: `1.5px solid ${T.iconBorder}`, borderRadius: '8px', p: '6px', transition: 'all 0.2s' }}>
            <SettingsIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  const renderMeta = (displaySx) => position && (
    <Box sx={{ display: displaySx, justifyContent: 'space-between', alignItems: 'center', px: 0.5, gap: '16px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: isDark ? '#1E293B' : '#e2e8f0', border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}` }} />
        <Typography variant="body2" sx={{ color: T.textSecondary, fontWeight: 700, fontSize: { md: '0.85rem' } }}>
          {position.orientation === 'white' ? 'White' : 'Black'} to move
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', minWidth: 0 }}>
        {evalDisp && <Chip label={evalDisp} size="small" sx={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', color: THEME_COLOR, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />}
        <Typography variant="caption" sx={{ color: T.textTertiary, fontSize: { xs: '0.65rem', md: '0.75rem' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{position.username}</Typography>
      </Box>
    </Box>
  );

  const renderTools = (displaySx) => (
    <Box sx={{ display: displaySx, gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
      {[
        { label: 'Hint', icon: <LightbulbIcon sx={{ fontSize: 18 }} />, color: '#D97706', action: showHint, disabled: status !== 'playing' || hintUsed },
        { label: 'Reveal', icon: <Visibility sx={{ fontSize: 18 }} />, color: '#DC2626', action: revealAnswer, disabled: status !== 'playing' },
        { label: 'Skip', icon: <SkipNextIcon sx={{ fontSize: 18 }} />, color: '#64748B', action: skipPosition, disabled: false },
        { label: 'New', icon: <RefreshIcon sx={{ fontSize: 18 }} />, color: THEME_COLOR, action: () => loadNewPosition(mode), disabled: false },
      ].map(({ label, icon, color, action, disabled }) => (
        <Tooltip title={label} key={label}>
          <span>
            <IconButton onClick={action} disabled={disabled} sx={{ color: color, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: '10px', p: '8px', transition: 'all 0.2s', '&:hover': { background: `${color}18`, transform: 'translateY(-1px)' }, '&.Mui-disabled': { opacity: 0.3 } }}>
              {icon}
            </IconButton>
          </span>
        </Tooltip>
      ))}
    </Box>
  );

  const renderHintContent = () => {
    if (!aiHint && !hintLoading) return null;
    return (
      <Box sx={{ mt: 2, pt: 2, borderTop: isDark ? '1px solid rgba(251,191,36,0.15)' : '1px solid rgba(217,119,6,0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightbulbIcon sx={{ color: '#D97706', fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
              Coach Clue
            </Typography>
          </Box>
          {aiHint && !hintLoading && (
            <Tooltip title="Get another hint">
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); showHint(true); }}
                sx={{ color: '#D97706', p: 0.5, '&:hover': { background: 'rgba(217,119,6,0.1)' } }}
              >
                <RefreshIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {hintLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
            <CircularProgress size={14} thickness={5} sx={{ color: '#D97706' }} />
            <Typography variant="body2" sx={{ color: isDark ? '#FCD34D' : '#92400E', fontStyle: 'italic', fontWeight: 500, fontSize: '0.8rem' }}>
              {aiHint ? "Coach is thinking of a better clue…" : "Coach is thinking of a clue…"}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ 
            color: isDark ? '#FCD34D' : '#78350F', 
            fontStyle: 'italic', 
            fontSize: '0.85rem',
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            "{aiHint}"
          </Typography>
        )}
      </Box>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ 
        height: { xs: 'auto', md: '100vh' }, 
        minHeight: { xs: '100vh', md: 'auto' },
        background: T.bg, 
        transition: 'background 0.5s ease', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        pt: { xs: `calc(18px + env(safe-area-inset-top, 0px))`, md: 0 }, 
        pb: { xs: `calc(16px + env(safe-area-inset-bottom, 0px))`, md: 0 }, 
        px: { xs: `calc(12px + env(safe-area-inset-left, 0px))`, md: 4 },
      }}>

        {/* Mobile Top Header */}
        {renderHeader({ xs: 'flex', md: 'none' })}

        {/* ── Main Wrapper ── */}
        <Box sx={{ 
          width: '100%', 
          maxWidth: 1600, 
          height: { xs: 'auto', md: '100%' },
          display: 'flex', 
          gap: { xs: 2, md: 6, lg: 10 }, 
          flexDirection: { xs: 'column', md: 'row' }, 
          alignItems: { xs: 'stretch', md: 'center' }, 
          px: { xs: 0, md: 0 }, 
          justifyContent: 'center',
          py: { xs: 1, md: 4 }
        }}>

          {/* ── Left Column (Board Only) ── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: '0 0 auto', width: { xs: '100%', md: 'auto' }, alignItems: 'center' }}>
            {/* Mobile Meta UI (for small screens) */}
            {renderMeta({ xs: 'flex', md: 'none' })}

            {/* Core Board */}
            <Box sx={{ 
              width: boardWidth, 
              borderRadius: '16px', 
              boxShadow: T.boardShadow, 
              border: `1px solid ${T.boardBorder}`, 
              position: 'relative', 
              transition: 'all 0.3s ease', 
              flexShrink: 0,
              // FIX: Push Arrows under Pieces
              // react-chessboard renders arrows in an SVG sibling to the pieces container
              '& svg[width][height]': { zIndex: 1, position: 'relative' },
              '& [data-piece]': { zIndex: 10, position: 'relative' }
            }}>
              {status === 'loading' ? (
                <Box sx={{ width: boardWidth, height: boardWidth, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.loadingBg, borderRadius: '12px' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={32} sx={{ color: THEME_COLOR, mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: T.textTertiary }}>Loading position…</Typography>
                  </Box>
                </Box>
              ) : (
                <Chessboard
                  position={fen}
                  onPieceDrop={onPieceDrop}
                  onPieceDragBegin={onPieceDragBegin}
                  onSquareClick={onSquareClick}
                  boardOrientation={position?.orientation || 'white'}
                  areDraggablePieces={status === 'playing' || status === 'correct' || status === 'revealed'}
                  customBoardStyle={{ borderRadius: '12px' }}
                  customDarkSquareStyle={{ backgroundColor: '#769656' }}
                  customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
                  customArrows={arrows}
                  customSquareStyles={{ ...checkSquare, ...moveHighlights, ...wrongSquares, ...correctSquares }}
                  boardWidth={boardWidth}
                />
              )}
            </Box>

            {/* Mobile Tools (below board) */}
            {renderTools({ xs: 'flex', md: 'none' })}
          </Box>

          {/* ── Right Column (Everything Else) ── */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: { xs: 2, md: 3 }, 
            flex: 1, 
            minWidth: 0, 
            maxWidth: { xs: '100%', md: 540 },
            height: { xs: 'auto', md: '100%' },
            overflowY: { xs: 'visible', md: 'auto' },
            pr: { xs: 0, md: 3 }, 
            py: { xs: 1, md: 3 },
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '10px' },
          }}>
            {/* Header */}
            {renderHeader({ xs: 'none', md: 'flex' })}

            {/* Desktop Tools & Meta */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 2 }}>
              {renderMeta('flex')}
              {renderTools('flex')}
              <Divider sx={{ borderColor: T.divider }} />
            </Box>

            {/* Feedback Section */}
            <Box sx={{ flexShrink: 0 }}>
              <AnimatePresence mode="wait">
                {status === 'loading' ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: '16px', background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                      <Typography variant="body1" sx={{ color: T.textTertiary, fontWeight: 600 }}>Analyzing position…</Typography>
                      <Typography variant="body2" sx={{ color: T.textTertiary, mt: 0.5, opacity: 0.7, display: { xs: 'none', sm: 'block' } }}>
                        {mode === 'practice' ? 'Loading your hardest position' : 'Fetching a real game from Lichess'}
                      </Typography>
                    </Box>
                  </motion.div>
                ) : status === 'correct' ? (
                  <motion.div key="correct" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: '16px', background: T.correctBg, border: `1px solid ${T.correctBorder}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <CheckCircleIcon sx={{ color: isDark ? '#22C55E' : '#16A34A', fontSize: { xs: 20, md: 26 } }} />
                        <Typography variant="h6" sx={{ color: T.correctTitle, fontWeight: 700, fontSize: { xs: '0.95rem', md: '1.25rem' } }}>
                          {wrongAttempts > 0 ? `Found it! (${wrongAttempts} wrong)` : hintUsed ? 'Correct (hint used)' : 'Best move! ✓'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: T.correctSub, mb: 2 }}>
                        <strong>{feedback?.san}</strong> matches the engine's top choice.
                      </Typography>
                      <ExplanationBox status={explainingStatus} explanation={explanation} T={T} isDark={isDark} THEME_COLOR={THEME_COLOR} onAskAI={handleAskAI} />
                      <NextBtn onClick={() => loadNewPosition(mode)} />
                    </Box>
                  </motion.div>
                ) : status === 'revealed' ? (
                  <motion.div key="revealed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: '16px', background: T.wrongBg, border: `1px solid ${T.wrongBorder}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <LightbulbIcon sx={{ color: isDark ? '#EF4444' : '#DC2626', fontSize: { xs: 20, md: 26 } }} />
                        <Typography variant="h6" sx={{ color: T.wrongTitle, fontWeight: 700, fontSize: { xs: '0.95rem', md: '1.25rem' } }}>Answer Revealed</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: T.wrongSub, mb: 2 }}>
                        Best move: <strong>{feedback?.best}</strong>. Saved to practice.
                      </Typography>
                      <ExplanationBox status={explainingStatus} explanation={explanation} T={T} isDark={isDark} THEME_COLOR={THEME_COLOR} onAskAI={handleAskAI} />
                      <NextBtn onClick={() => loadNewPosition(mode)} />
                    </Box>
                  </motion.div>
                ) : (
                  <motion.div key="playing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <AnimatePresence mode="wait">
                      {feedback?.type === 'retry' ? (
                        <motion.div key="retry" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                          <Box sx={{ p: { xs: 1.5, md: 3 }, borderRadius: '16px', background: T.retryBg, border: `1px solid ${T.retryBorder}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                              <CancelIcon sx={{ color: isDark ? '#FBBF24' : '#D97706', fontSize: { xs: 18, md: 24 } }} />
                              <Typography variant="h6" sx={{ color: T.retryTitle, fontWeight: 700, fontSize: { xs: '0.9rem', md: '1.25rem' } }}>
                                Not quite — keep trying!
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mt: 1.5 }}>
                              <Typography variant="body2" sx={{ color: T.retrySub }}>
                                Attempt #{feedback.attempts} · Stuck?
                              </Typography>
                              <Button 
                                onClick={() => showHint()} 
                                disabled={hintUsed}
                                size="small" 
                                variant="outlined" 
                                startIcon={<LightbulbIcon sx={{ fontSize: 16 }} />}
                                sx={{ 
                                  color: '#D97706', 
                                  borderColor: 'rgba(217,119,6,0.3)',
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderRadius: '8px',
                                  px: 1.5,
                                  '&:hover': {
                                    borderColor: '#D97706',
                                    background: 'rgba(217,119,6,0.05)',
                                  },
                                  '&.Mui-disabled': {
                                    color: 'rgba(217,119,6,0.3)',
                                    borderColor: 'rgba(217,119,6,0.1)',
                                  }
                                }}
                              >
                                {hintUsed ? 'Hint Shown' : 'Show Hint'}
                              </Button>
                            </Box>
                            {renderHintContent()}
                          </Box>
                        </motion.div>
                      ) : (
                        <motion.div key="prompt" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          <Box sx={{ p: { xs: 1.5, md: 3 }, borderRadius: '16px', background: T.playBg, border: `1px solid ${T.playBorder}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            <Typography variant="body1" sx={{ color: T.playTitle, fontWeight: 600, mb: 0.5 }}>
                              {mode === 'practice' && posStats
                                ? `Practice — ${posStats.fails}✗ / ${posStats.successes}✓`
                                : 'Find the best move'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: T.playSub }}>
                              {position?.orientation === 'white' ? 'White' : 'Black'} to play — find the move Stockfish considers best.
                            </Typography>
                            <Button 
                               onClick={revealAnswer} 
                               size="small" 
                               variant="text" 
                               startIcon={<Visibility sx={{ fontSize: 14 }} />}
                               sx={{ 
                                 mt: 1,
                                 color: T.textTertiary, 
                                 textTransform: 'none',
                                 fontSize: '0.7rem',
                                 fontWeight: 500,
                                 borderRadius: '6px',
                                 p: '2px 8px',
                                 '&:hover': {
                                   color: '#DC2626',
                                   background: 'rgba(220,38,38,0.05)',
                                 }
                               }}
                             >
                               Reveal Solution
                             </Button>
                            {renderHintContent()}
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Box>
        </Box>

        {/* ── Stats Modal ── */}
        <SharedModal 
          open={showStats} 
          onClose={handleCloseStats} 
          title="Training History"
          maxWidth="md"
          paperSx={{ 
            background: isDark ? '#160B2A' : '#ffffff', 
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}
          isDark={isDark}
          T={T}
        >
          <StatsPanel stats={stats} onReset={() => setShowConfirmReset(true)} isDark={isDark} T={T} />
        </SharedModal>

        {/* ── Settings Modal ── */}
        <SharedModal
          open={showSettings}
          onClose={handleCloseSettings}
          title="Settings"
          isDark={isDark}
          T={T}
          paperSx={{ 
            background: isDark ? '#160B2A' : '#ffffff', 
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none' 
          }}
        >
          <Typography variant="body2" sx={{ color: T.textSecondary, mb: 3 }}>
            To get AI explanations for the best moves, you can provide your own free Gemini API key. This is stored locally in your browser and never sent to our servers.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Gemini API Key"
            variant="outlined"
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            InputLabelProps={{ sx: { color: T.textSecondary } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={showApiKey ? "Hide key" : "Show key"}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setShowApiKey(!showApiKey); }} sx={{ color: T.textSecondary, mr: apiKeyInput ? 0.5 : -1 }}>
                      {showApiKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  {apiKeyInput && (
                    <>
                      <Tooltip title="Copy key">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(apiKeyInput); }} sx={{ color: T.textSecondary, mr: 0.5 }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove key">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setApiKeyInput(''); localStorage.removeItem('gemini_api_key'); }} sx={{ color: '#EF4444', mr: -1 }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: T.textPrimary,
                '& fieldset': { borderColor: T.iconBorder },
                '&:hover fieldset': { borderColor: THEME_COLOR },
                pr: 1
              }
            }}
          />

          <Box sx={{ mt: 4, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <FlashOnIcon sx={{ color: THEME_COLOR, fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: T.textPrimary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Engine Source</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: T.textSecondary, mb: 2, fontSize: '0.8rem', lineHeight: 1.5 }}>
              Choose how the app analyzes positions. Local Stockfish runs entirely on your device and is the fastest and most private option.
            </Typography>
            <TextField
              select
              fullWidth
              value={engineMode}
              onChange={(e) => setEngineMode(e.target.value)}
              SelectProps={{ native: true }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  color: T.textPrimary,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  '& fieldset': { borderColor: T.iconBorder },
                  '&:hover fieldset': { borderColor: THEME_COLOR },
                }
              }}
            >
              <option value="local">Local Stockfish Only (Recommended)</option>
              <option value="api">Cloud API Only</option>
              <option value="race">Dual Race (Fastest Wins)</option>
            </TextField>
          </Box>

          {/* Inline Buttons for better flow on mobile */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            width: '100%', 
            gap: 1.5,
            mt: 4,
            pb: 2
          }}>
            <Button 
              onClick={handleSaveSettings} 
              variant="contained" 
              fullWidth={true}
              sx={{ 
                background: THEME_COLOR, 
                '&:hover': { background: '#6D28D9' }, 
                textTransform: 'none', 
                fontWeight: 600, 
                borderRadius: '12px',
                py: 1.5,
                order: { xs: 1, sm: 2 } 
              }}
            >
              Save Settings
            </Button>
            <Button 
              onClick={handleCloseSettings} 
              fullWidth={true}
              sx={{ 
                color: T.textSecondary, 
                textTransform: 'none', 
                fontWeight: 600, 
                borderRadius: '12px', 
                py: 1.5,
                border: `1px solid ${T.borderColor}`,
                order: { xs: 2, sm: 1 } 
              }}
            >
              Cancel
            </Button>
          </Box>
        </SharedModal>
        {/* ── Confirmation Modal ── */}
        <SharedModal
          open={showConfirmReset}
          onClose={handleCloseConfirmReset}
          title="Reset Statistics?"
          maxWidth="xs"
          isDark={isDark}
          T={T}
          paperSx={{ 
            background: isDark ? '#160B2A' : '#ffffff', 
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none' 
          }}
          actions={(
            <>
              <Button onClick={handleCloseConfirmReset} sx={{ color: T.textSecondary, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
              <Button onClick={handleResetStats} variant="contained" sx={{ background: '#EF4444', '&:hover': { background: '#DC2626' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
                Confirm Reset
              </Button>
            </>
          )}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 1 }}>
            <WarningAmberIcon sx={{ fontSize: 48, color: '#EF4444', mb: 2 }} />
            <Typography variant="body1" sx={{ color: T.textPrimary, fontWeight: 700, mb: 1 }}>
              Are you absolutely sure?
            </Typography>
            <Typography variant="body2" sx={{ color: T.textSecondary }}>
              This will permanently delete your accuracy, streak, and daily progress history. This action cannot be undone.
            </Typography>
          </Box>
        </SharedModal>
    </Box>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, dark }) {
  return (
    <Box sx={{ p: 1, borderRadius: '8px', background: dark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`, textAlign: 'center' }}>
      <Typography variant="h6" sx={{ color, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, fontSize: '1.2rem' }}>{value}</Typography>
      <Typography sx={{ color: dark ? '#64748B' : '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.55rem', mt: 0.5, lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</Typography>
      <Typography variant="caption" sx={{ color: dark ? '#475569' : '#94A3B8', fontSize: '0.55rem', fontWeight: 500, display: 'block', mt: 0.25 }}>{sub}</Typography>
    </Box>
  );
}

function NextBtn({ onClick, label = 'Next Position →' }) {
  return (
    <Box component="button" onClick={onClick} sx={{ display: 'block', width: '100%', py: 1.25, px: 3, border: 'none', borderRadius: '10px', background: 'linear-gradient(90deg, #7C3AED, #9F67FA)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '-0.01em', boxShadow: '0 4px 14px rgba(124,58,237,0.2)', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(124,58,237,0.3)' } }}>
      {label}
    </Box>
  );
}

function ExplanationBox({ status, explanation, T, isDark, THEME_COLOR, onAskAI }) {
  if (status === 'idle') {
    return (
      <Box sx={{ mb: 2 }}>
        <Button onClick={onAskAI} variant="outlined" size="small" startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />} sx={{ color: THEME_COLOR, borderColor: `${THEME_COLOR}50`, textTransform: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', py: 0.5, '&:hover': { background: `${THEME_COLOR}10`, borderColor: THEME_COLOR } }}>
          Ask AI Coach why this is best
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 1.5, mb: 2, p: 1.5, borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.12)'}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <AutoAwesomeIcon sx={{ fontSize: 13, color: THEME_COLOR }} />
        <Typography variant="caption" sx={{ color: THEME_COLOR, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Coach Explanation</Typography>
      </Box>
      {status === 'loading' ? (
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
           <CircularProgress size={12} sx={{ color: T.textTertiary }} />
           <Typography variant="body2" sx={{ color: T.textTertiary, fontStyle: 'italic', fontSize: '0.8rem' }}>Analyzing...</Typography>
         </Box>
      ) : explanation ? (
        <Typography variant="body2" sx={{ color: T.textPrimary, mt: 0.5, lineHeight: 1.45, fontSize: '0.85rem' }}>
          {explanation}
        </Typography>
      ) : (
        <Box>
          <Typography variant="body2" sx={{ color: T.textTertiary, mt: 0.5, fontStyle: 'italic', mb: 1, fontSize: '0.8rem' }}>
            No API key found. Add a free Gemini key in Settings.
          </Typography>
          <Button onClick={onAskAI} variant="outlined" size="small" startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />} sx={{ color: THEME_COLOR, borderColor: `${THEME_COLOR}50`, textTransform: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', '&:hover': { background: `${THEME_COLOR}10`, borderColor: THEME_COLOR } }}>
            Try Again
          </Button>
        </Box>
      )}
    </Box>
  );
}
