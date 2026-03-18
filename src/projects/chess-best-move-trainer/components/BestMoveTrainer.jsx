import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, IconButton, Tooltip, Chip,
  Divider, CircularProgress, Badge,
} from '@mui/material';
import RefreshIcon      from '@mui/icons-material/Refresh';
import EmojiEventsIcon  from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import LightbulbIcon    from '@mui/icons-material/Lightbulb';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import CancelIcon       from '@mui/icons-material/Cancel';
import SkipNextIcon     from '@mui/icons-material/SkipNext';
import BarChartIcon     from '@mui/icons-material/BarChart';
import SchoolIcon       from '@mui/icons-material/School';
import FlashOnIcon      from '@mui/icons-material/FlashOn';
import { Chess }        from 'chess.js';
import { Chessboard }   from 'react-chessboard';
import axios            from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import useSound         from 'use-sound';
import moveSound    from '../../chess-tactics-finder/sounds/move.mp3';
import captureSound from '../../chess-tactics-finder/sounds/capture.mp3';
import StatsPanel   from './StatsPanel';

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY  = 'chess_best_move_trainer_stats';
const FAILURES_KEY = 'chess_best_move_failures';
const THEME_COLOR  = '#7C3AED';

// ─── Themes ───────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:            'linear-gradient(180deg, #fffef1 0%, #ffffff 55%)',
  textPrimary:   '#0F172A',  textSecondary: '#64748B',  textTertiary: '#94A3B8',
  iconColor:     '#64748B',  iconBorder:    'rgba(0,0,0,0.12)',
  boardShadow:   '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
  boardBorder:   'rgba(0,0,0,0.07)',  loadingBg: 'linear-gradient(135deg, #f8f4ee, #f5f0e8)',
  cardBg:        '#ffffff',   cardBorder:   'rgba(0,0,0,0.07)', divider: 'rgba(0,0,0,0.07)',
  playBg:        '#ffffff',   playBorder:   'rgba(124,58,237,0.15)', playTitle: '#1E1B4B', playSub: '#64748B',
  correctBg:     '#f0fdf4',   correctBorder:'#bbf7d0',  correctTitle: '#15803D', correctSub: '#166534',
  wrongBg:       '#fef2f2',   wrongBorder:  '#fecaca',  wrongTitle:   '#991B1B', wrongSub:   '#B91C1C',
  retryBg:       '#fffbeb',   retryBorder:  '#fde68a',  retryTitle:   '#92400E', retrySub:   '#B45309',
};
const DARK = {
  bg:            'linear-gradient(135deg, #0F0720 0%, #1A0938 40%, #0D1B2A 100%)',
  textPrimary:   '#F1F5F9',  textSecondary: '#94A3B8',  textTertiary: '#64748B',
  iconColor:     '#94A3B8',  iconBorder:    'rgba(255,255,255,0.1)',
  boardShadow:   '0 0 60px rgba(124,58,237,0.25), 0 20px 60px rgba(0,0,0,0.5)',
  boardBorder:   'rgba(255,255,255,0.08)', loadingBg: 'rgba(15,7,32,0.9)',
  cardBg:        'rgba(255,255,255,0.04)', cardBorder:'rgba(255,255,255,0.09)', divider: 'rgba(255,255,255,0.07)',
  playBg:        'rgba(124,58,237,0.08)', playBorder:'rgba(124,58,237,0.2)',  playTitle: '#C4B5FD', playSub: '#7C6FA6',
  correctBg:     'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
  correctBorder: 'rgba(34,197,94,0.3)',   correctTitle: '#86EFAC', correctSub: '#4ADE80',
  wrongBg:       'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
  wrongBorder:   'rgba(239,68,68,0.3)',   wrongTitle:   '#FCA5A5', wrongSub:   '#FCA5A5',
  retryBg:       'rgba(251,191,36,0.1)',  retryBorder:  'rgba(251,191,36,0.3)', retryTitle: '#FCD34D', retrySub: '#FDE68A',
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
const saveStats = s => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (_) {} };
const todayKey  = () => new Date().toISOString().slice(0, 10);

// ─── Failures helpers ─────────────────────────────────────────────────────────
const fenKey = fen => fen.split(' ').slice(0, 2).join(' '); // board + turn only

const loadFailures = () => {
  try { const r = localStorage.getItem(FAILURES_KEY); return r ? JSON.parse(r) : {}; }
  catch (_) { return {}; }
};
const saveFailures = f => { try { localStorage.setItem(FAILURES_KEY, JSON.stringify(f)); } catch (_) {} };

// Sort failures: successes/(fails+1) ascending — hardest (least success rate) first
const sortedFailures = failures =>
  Object.values(failures)
    .filter(f => f.fails > 0)
    .sort((a, b) => (a.successes / (a.fails + 1)) - (b.successes / (b.fails + 1)));

// ─── Fetch normal position ────────────────────────────────────────────────────
async function fetchRandomPosition() {
  const puzzleRes = await axios.get('https://lichess.org/api/puzzle/next', {
    headers: { Accept: 'application/json' },
  });
  const { game: lichessGame, puzzle } = puzzleRes.data;

  const tokens = lichessGame.pgn
    .replace(/\[.*?\]\s*/g, '').trim()
    .split(/\s+/)
    .filter(t => !t.match(/^(\d+\.+|1-0|0-1|1\/2-1\/2|\*)$/));

  const puzzlePly = Math.min(puzzle.initialPly + 1, tokens.length);
  const minPly    = Math.max(16, Math.floor(puzzlePly * 0.50));
  const maxPly    = Math.max(minPly + 2, Math.floor(puzzlePly * 0.90));
  const targetPly = minPly + Math.floor(Math.random() * (maxPly - minPly));

  const g = new Chess();
  for (let i = 0; i < Math.min(targetPly, tokens.length); i++) {
    try { g.move(tokens[i]); } catch (_) { break; }
  }
  if (g.isGameOver()) throw new Error('Position already over');

  const fen         = g.fen();
  const orientation = g.turn() === 'w' ? 'white' : 'black';

  const analysis = await axios.post('https://chess-api.com/v1', { fen, depth: 14, variants: 3 });
  if (analysis.data.error) throw new Error(analysis.data.text || 'Engine error');

  const topMoves = Array.isArray(analysis.data)
    ? analysis.data.map(m => m.move).filter(Boolean)
    : [analysis.data.move].filter(Boolean);
  if (!topMoves.length) throw new Error('No moves from engine');

  const white = lichessGame.players?.find(p => p.color === 'white')?.name || '?';
  const black = lichessGame.players?.find(p => p.color === 'black')?.name || '?';

  return { fen, orientation, topMoves, bestMoveSan: analysis.data.san || analysis.data.text || topMoves[0], evalScore: analysis.data.eval, username: `${white} vs ${black}` };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BestMoveTrainer() {
  const [mode, setMode]         = useState('normal'); // 'normal' | 'practice'
  const [position, setPosition] = useState(null);
  const [game, setGame]         = useState(null);
  const [fen, setFen]           = useState('start');
  const [status, setStatus]     = useState('loading');
  const [hintUsed, setHintUsed] = useState(false);
  const [wrongAttempts, setWrongAttempts]   = useState(0); // per-position wrong count
  const [sessionRecorded, setSessionRecorded] = useState(false); // only record once per position
  const [stats, setStats]       = useState(loadStats);
  const [failures, setFailures] = useState(loadFailures);
  const [showStats, setShowStats] = useState(false);
  const [arrows, setArrows]     = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [wrongSquares, setWrongSquares]     = useState({});
  const [correctSquares, setCorrectSquares] = useState({});
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveHighlights, setMoveHighlights] = useState({});

  // Refs for drag/click coordination
  // onPieceDragBegin fires on mousedown; onSquareClick fires on mouseup for the same gesture.
  // We use refs (not state) so we can read the value synchronously in the same event loop.
  const dragBeginSquare      = React.useRef(null);
  const dragBeginWasSelected = React.useRef(false);

  const [playMove]    = useSound(moveSound,    { volume: 0.7 });
  const [playCapture] = useSound(captureSound, { volume: 0.7 });

  // ── Load ──────────────────────────────────────────────────────────────────
  const resetBoard = () => {
    setFeedback(null); setHintUsed(false); setWrongAttempts(0); setSessionRecorded(false);
    setArrows([]); setWrongSquares({}); setCorrectSquares({});
    setSelectedSquare(null); setMoveHighlights({});
  };

  const loadNewPosition = useCallback(async (currentMode) => {
    const m = currentMode ?? mode;
    setStatus('loading');
    setPosition(null);
    resetBoard();
    try {
      let p;
      if (m === 'practice') {
        const fl = loadFailures();
        const sorted = sortedFailures(fl);
        if (!sorted.length) { setMode('normal'); setStatus('loading'); return loadNewPosition('normal'); }
        // Pick from top 3 hardest (add slight randomness)
        const topN   = Math.min(3, sorted.length);
        const picked = sorted[Math.floor(Math.random() * topN)];
        p = {
          fen:          picked.fen,
          orientation:  picked.orientation,
          topMoves:     [picked.bestMove],
          bestMoveSan:  picked.bestMoveSan,
          evalScore:    picked.evalScore,
          username:     picked.username,
          practiceStats: { fails: picked.fails, successes: picked.successes },
        };
      } else {
        p = await fetchRandomPosition();
      }
      setPosition(p);
      setGame(new Chess(p.fen));
      setFen(p.fen);
      setStatus('playing');
    } catch (err) {
      console.error(err);
      try {
        const p = await fetchRandomPosition();
        setPosition(p); setGame(new Chess(p.fen)); setFen(p.fen); setStatus('playing');
      } catch (_) { setStatus('loading'); }
    }
  }, [mode]); // eslint-disable-line

  useEffect(() => { loadNewPosition(mode); }, []); // eslint-disable-line

  // ── Overall stats ─────────────────────────────────────────────────────────
  const recordResult = useCallback((correct) => {
    setStats(prev => {
      const today   = todayKey();
      const daily   = prev.dailyHistory[today] || { attempts: 0, correct: 0 };
      const newStr  = correct ? prev.streak + 1 : 0;
      const updated = {
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        totalCorrect:  prev.totalCorrect + (correct ? 1 : 0),
        dailyHistory:  { ...prev.dailyHistory, [today]: { attempts: daily.attempts + 1, correct: daily.correct + (correct ? 1 : 0) } },
        lastPlayed:    new Date().toISOString(),
        streak:        newStr,
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
    if (!game || !position || status !== 'playing') return false;

    const gameCopy = new Chess(game.fen());
    let moveResult;
    try {
      const moving = gameCopy.get(src);
      const promo  = moving?.type === 'p' &&
        ((moving.color === 'w' && tgt[1] === '8') || (moving.color === 'b' && tgt[1] === '1'))
        ? 'q' : undefined;
      moveResult = gameCopy.move({ from: src, to: tgt, promotion: promo });
    } catch (_) { return false; }
    if (!moveResult) return false;

    const playedUci = `${src}${tgt}`;
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
      // Record overall result only once per position
      if (!sessionRecorded) { recordResult(true); setSessionRecorded(true); }
      recordSuccess(position);
    } else {
      // Wrong: flash briefly, then return to 'playing' — let them retry
      setWrongSquares({ [src]: { background: 'rgba(239,68,68,0.4)' }, [tgt]: { background: 'rgba(239,68,68,0.3)' } });
      setCorrectSquares({});
      setFeedback({ type: 'retry', attempts: wrongAttempts + 1 });
      setWrongAttempts(w => w + 1);
      recordFailure(position); // track per-position failure
      setTimeout(() => {
        setWrongSquares({});
        // Keep feedback as 'retry' so they can see attempt count
      }, 700);
      // Don't change status — stays 'playing'
    }
    return isCorrect;
  }, [game, position, status, wrongAttempts, sessionRecorded, playMove, playCapture, recordResult, recordSuccess, recordFailure, clearSelection]);

  // ── Drag/click ────────────────────────────────────────────────────────────
  // React-DnD's dragBegin only fires after moving the mouse past a threshold.
  // We use pointer down on the container to get an IMMEDIATE highlight when parsing.
  const handlePointerDown = useCallback((e) => {
    if (!game || status !== 'playing') return;
    
    // Instead of doing bounding box math which can be thrown off by browser scaling
    // or borders, we just ask the DOM what square react-chessboard rendered here:
    const squareEl = e.target.closest('[data-square]');
    if (!squareEl) return;
    
    const square = squareEl.getAttribute('data-square');
    if (!square) return;
    
    const playerColor = position?.orientation === 'white' ? 'w' : 'b';
    const piece = game.get(square);
    
    if (piece && piece.color === playerColor) {
      dragBeginWasSelected.current = selectedSquare === square;
      dragBeginSquare.current      = square;
      setSelectedSquare(square);
      setMoveHighlights(getMoveHighlights(square));
      setWrongSquares({}); setCorrectSquares({});
    }
  }, [game, position, status, selectedSquare, getMoveHighlights]);

  const onPieceDrop = useCallback((src, tgt) => {
    dragBeginSquare.current      = null;
    dragBeginWasSelected.current = false;
    clearSelection();
    return executeMoveAttempt(src, tgt);
  }, [executeMoveAttempt, clearSelection]);

  const onSquareClick = useCallback((square) => {
    if (!game) { clearSelection(); return; }
    const playerColor = position?.orientation === 'white' ? 'w' : 'b';
    const piece = game.get(square);

    // Move execution (click-to-move second click)
    if (status === 'playing' && selectedSquare && moveHighlights[square] && square !== selectedSquare) {
      dragBeginSquare.current = null;
      executeMoveAttempt(selectedSquare, square);
      return;
    }

    // Own piece clicked
    if (piece && piece.color === playerColor) {
      // If this mouseup is the tail of an onPieceDragBegin for the SAME square:
      if (dragBeginSquare.current === square) {
        const wasAlreadySelected = dragBeginWasSelected.current;
        dragBeginSquare.current      = null;
        dragBeginWasSelected.current = false;
        if (wasAlreadySelected) {
          // Second click on the already-selected piece → deselect
          clearSelection();
        }
        // First click: dragBegin already set highlights, just return
        return;
      }
      // Clicked a different own piece (no dragBegin preceded this)
      setSelectedSquare(square);
      setMoveHighlights(getMoveHighlights(square));
      setWrongSquares({}); setCorrectSquares({});
      return;
    }

    clearSelection();
  }, [game, position, status, selectedSquare, moveHighlights, getMoveHighlights, executeMoveAttempt, clearSelection]);


  // ── Hint ──────────────────────────────────────────────────────────────────
  const showHint = useCallback(() => {
    if (!position || status !== 'playing') return;
    setHintUsed(true); clearSelection();
    const best = position.topMoves[0];
    if (best) setArrows([[best.slice(0,2), best.slice(2,4), THEME_COLOR]]);
  }, [position, status, clearSelection]);

  // ── Reveal ────────────────────────────────────────────────────────────────
  const revealAnswer = useCallback(() => {
    if (!position) return;
    const best = position.topMoves[0];
    if (best) setArrows([[best.slice(0,2), best.slice(2,4), '#EF4444']]);
    setFeedback({ type: 'revealed', best: position.bestMoveSan });
    setStatus('revealed'); clearSelection();
    // Record this position attempt as a loss if not yet recorded
    if (!sessionRecorded) { recordResult(false); setSessionRecorded(true); }
    recordFailure(position);
  }, [position, sessionRecorded, recordResult, recordFailure, clearSelection]);

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
  const isDark       = position?.orientation === 'black';
  const T            = isDark ? DARK : LIGHT;
  const accuracy     = stats.totalAttempts > 0 ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : 0;
  const todayStats   = stats.dailyHistory[todayKey()] || { attempts: 0, correct: 0 };
  const todayAcc     = todayStats.attempts > 0 ? Math.round((todayStats.correct / todayStats.attempts) * 100) : 0;
  const evalDisp     = position?.evalScore != null ? (position.evalScore > 0 ? `+${position.evalScore.toFixed(1)}` : position.evalScore.toFixed(1)) : null;
  const failureCount = Object.keys(failures).filter(k => failures[k].fails > 0).length;
  const posStats     = position ? failures[fenKey(position.fen)] : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', background: T.bg, transition: 'background 0.5s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: { xs: 2, md: 3 }, pb: 6, px: 2 }}>

      {/* ── Header ── */}
      <Box sx={{ width: '100%', maxWidth: 1100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: `linear-gradient(135deg, ${THEME_COLOR}, #9F67FA)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${THEME_COLOR}40` }}>
            <EmojiEventsIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: T.textPrimary, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Best Move Trainer
            </Typography>
            <Typography variant="caption" sx={{ color: T.textSecondary }}>
              {mode === 'practice' ? '🔁 Practice mode — your hardest positions' : 'Real games · Stockfish analysis'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {stats.streak > 1 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Chip icon={<TrendingUpIcon sx={{ fontSize: 14 }} />} label={`${stats.streak} streak`} size="small"
                sx={{ background: 'linear-gradient(90deg, #F59E0B, #EF4444)', color: '#fff', fontWeight: 600, fontSize: '0.75rem', '& .MuiChip-icon': { color: '#fff' } }} />
            </motion.div>
          )}

          {/* Mode toggle */}
          <Tooltip title={mode === 'normal' ? `Practice failures (${failureCount})` : 'Back to normal mode'}>
            <span>
              <IconButton
                onClick={() => switchMode(mode === 'normal' ? 'practice' : 'normal')}
                disabled={mode === 'normal' && failureCount === 0}
                sx={{
                  color: mode === 'practice' ? '#F59E0B' : T.iconColor,
                  border: `1.5px solid ${mode === 'practice' ? '#F59E0B' : T.iconBorder}`,
                  borderRadius: '10px', p: '6px', transition: 'all 0.2s',
                  '&.Mui-disabled': { opacity: 0.3 },
                }}
              >
                <Badge badgeContent={failureCount > 0 ? failureCount : null} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}>
                  {mode === 'practice' ? <FlashOnIcon fontSize="small" /> : <SchoolIcon fontSize="small" />}
                </Badge>
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Stats">
            <IconButton onClick={() => setShowStats(v => !v)}
              sx={{ color: showStats ? THEME_COLOR : T.iconColor, border: `1.5px solid ${showStats ? THEME_COLOR : T.iconBorder}`, borderRadius: '10px', p: '6px', transition: 'all 0.2s' }}>
              <BarChartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Main ── */}
      <Box sx={{ width: '100%', maxWidth: 1100, display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' } }}>

        {/* ── Board column ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '0 0 auto' }}>

          {/* meta row */}
          {position && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: isDark ? '#1E293B' : '#e2e8f0', border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}` }} />
                <Typography variant="body2" sx={{ color: T.textSecondary, fontWeight: 500 }}>
                  {position.orientation === 'white' ? 'White' : 'Black'} to move
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {evalDisp && <Chip label={evalDisp} size="small" sx={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', color: THEME_COLOR, fontWeight: 600, fontSize: '0.75rem' }} />}
                <Typography variant="caption" sx={{ color: T.textTertiary, fontSize: '0.7rem' }}>{position.username}</Typography>
              </Box>
            </Box>
          )}

          {/* Board */}
          <Box 
            onPointerDown={handlePointerDown}
            sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: T.boardShadow, border: `1px solid ${T.boardBorder}`, position: 'relative', transition: 'box-shadow 0.5s ease', touchAction: 'none' }}
          >
            {status === 'loading' ? (
              <Box sx={{ width: 440, height: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.loadingBg, borderRadius: '16px' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress size={32} sx={{ color: THEME_COLOR, mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: T.textTertiary }}>Loading position…</Typography>
                </Box>
              </Box>
            ) : (
              <Chessboard
                position={fen}
                onPieceDrop={onPieceDrop}
                onSquareClick={onSquareClick}
                boardOrientation={position?.orientation || 'white'}
                areDraggablePieces={status === 'playing'}
                customBoardStyle={{ borderRadius: '16px' }}
                customDarkSquareStyle={{ backgroundColor: '#769656' }}
                customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
                customArrows={arrows}
                customSquareStyles={{ ...moveHighlights, ...wrongSquares, ...correctSquares }}
                boardWidth={440}
              />
            )}
          </Box>

          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
            {[
              { label: 'Hint',   icon: <LightbulbIcon fontSize="small" />, color: '#D97706', action: showHint,    disabled: status !== 'playing' || hintUsed },
              { label: 'Reveal', icon: <CancelIcon fontSize="small" />,    color: '#DC2626', action: revealAnswer, disabled: status !== 'playing' },
              { label: 'Skip',   icon: <SkipNextIcon fontSize="small" />,  color: '#64748B', action: skipPosition, disabled: false },
              { label: 'New',    icon: <RefreshIcon fontSize="small" />,   color: THEME_COLOR, action: () => loadNewPosition(mode), disabled: false },
            ].map(({ label, icon, color, action, disabled }) => (
              <Tooltip title={label} key={label}>
                <span>
                  <IconButton onClick={action} disabled={disabled}
                    sx={{ color, border: `1.5px solid ${color}40`, borderRadius: '10px', p: '8px', '&:hover': { background: `${color}12`, borderColor: color }, '&.Mui-disabled': { opacity: 0.3 } }}>
                    {icon}
                  </IconButton>
                </span>
              </Tooltip>
            ))}
          </Box>
        </Box>

        {/* ── Right column ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, width: { xs: '100%', md: 'auto' } }}>

          {/* Feedback card */}
          <AnimatePresence mode="wait">
            {status === 'loading' ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box sx={{ p: 3, borderRadius: '16px', background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                  <Typography variant="body1" sx={{ color: T.textTertiary, fontWeight: 600 }}>Analyzing position…</Typography>
                  <Typography variant="body2" sx={{ color: T.textTertiary, mt: 0.5, opacity: 0.7 }}>
                    {mode === 'practice' ? 'Loading your hardest position' : 'Fetching a real game from Lichess'}
                  </Typography>
                </Box>
              </motion.div>

            ) : status === 'correct' ? (
              <motion.div key="correct" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Box sx={{ p: 3, borderRadius: '16px', background: T.correctBg, border: `1px solid ${T.correctBorder}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <CheckCircleIcon sx={{ color: isDark ? '#22C55E' : '#16A34A', fontSize: 26 }} />
                    <Typography variant="h6" sx={{ color: T.correctTitle, fontWeight: 700 }}>
                      {wrongAttempts > 0 ? `Found it! (${wrongAttempts} wrong attempt${wrongAttempts > 1 ? 's' : ''})` : hintUsed ? 'Correct (hint used)' : 'Best move! ✓'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: T.correctSub, mb: 2 }}>
                    <strong>{feedback?.san}</strong> matches the engine's top choice.
                  </Typography>
                  <NextBtn onClick={() => loadNewPosition(mode)} />
                </Box>
              </motion.div>

            ) : status === 'revealed' ? (
              <motion.div key="revealed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Box sx={{ p: 3, borderRadius: '16px', background: T.wrongBg, border: `1px solid ${T.wrongBorder}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <LightbulbIcon sx={{ color: isDark ? '#EF4444' : '#DC2626', fontSize: 26 }} />
                    <Typography variant="h6" sx={{ color: T.wrongTitle, fontWeight: 700 }}>Answer Revealed</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: T.wrongSub, mb: 2 }}>
                    Best move: <strong>{feedback?.best}</strong> (shown by arrow). Position saved to practice list.
                  </Typography>
                  <NextBtn onClick={() => loadNewPosition(mode)} />
                </Box>
              </motion.div>

            ) : (
              /* playing — show hint/retry feedback */
              <motion.div key="playing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AnimatePresence mode="wait">
                  {feedback?.type === 'retry' ? (
                    <motion.div key="retry" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <Box sx={{ p: 3, borderRadius: '16px', background: T.retryBg, border: `1px solid ${T.retryBorder}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                          <CancelIcon sx={{ color: isDark ? '#FBBF24' : '#D97706', fontSize: 24 }} />
                          <Typography variant="h6" sx={{ color: T.retryTitle, fontWeight: 700 }}>
                            Not quite — keep trying!
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: T.retrySub }}>
                          Attempt #{feedback.attempts} · Use a hint if you're stuck.
                        </Typography>
                      </Box>
                    </motion.div>
                  ) : (
                    <motion.div key="prompt" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Box sx={{ p: 3, borderRadius: '16px', background: T.playBg, border: `1px solid ${T.playBorder}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <Typography variant="body1" sx={{ color: T.playTitle, fontWeight: 600, mb: 0.5 }}>
                          {mode === 'practice' && posStats
                            ? `Practice — ${posStats.fails}✗ / ${posStats.successes}✓`
                            : 'Find the best move'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: T.playSub }}>
                          {position?.orientation === 'white' ? 'White' : 'Black'} to play — find the move Stockfish considers best.
                          {mode === 'practice' && ' This is one of your previously missed positions.'}
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <Divider sx={{ borderColor: T.divider }} />

          {/* Stat cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <StatCard label="Today's accuracy" value={`${todayAcc}%`} sub={`${todayStats.correct}/${todayStats.attempts}`} color="#22C55E" dark={isDark} />
            <StatCard label="All-time accuracy" value={`${accuracy}%`} sub={`${stats.totalCorrect}/${stats.totalAttempts}`} color={THEME_COLOR} dark={isDark} />
            <StatCard label="Current streak"   value={stats.streak}        sub="in a row"  color="#F59E0B" dark={isDark} />
            <StatCard label="Failed positions" value={failureCount}         sub="saved for review" color="#EF4444" dark={isDark} />
          </Box>

          {/* Full stats panel */}
          <AnimatePresence>
            {showStats && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <StatsPanel stats={stats} onReset={() => { const f = initStats(); setStats(f); saveStats(f); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, dark }) {
  return (
    <Box sx={{ p: 2, borderRadius: '12px', background: dark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`, boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)', transition: 'background 0.4s, border-color 0.4s' }}>
      <Typography variant="caption" sx={{ color: dark ? '#64748B' : '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>{label}</Typography>
      <Typography variant="h5" sx={{ color, fontWeight: 800, letterSpacing: '-0.03em', mt: 0.25, lineHeight: 1 }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: dark ? '#64748B' : '#94A3B8', fontSize: '0.7rem' }}>{sub}</Typography>
    </Box>
  );
}

function NextBtn({ onClick, label = 'Next Position →' }) {
  return (
    <Box component="button" onClick={onClick} sx={{ display: 'block', width: '100%', py: 1.5, px: 3, border: 'none', borderRadius: '10px', background: 'linear-gradient(90deg, #7C3AED, #9F67FA)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', letterSpacing: '-0.01em', boxShadow: '0 4px 14px rgba(124,58,237,0.25)', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' } }}>
      {label}
    </Box>
  );
}
