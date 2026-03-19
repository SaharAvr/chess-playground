import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Divider,
  Button,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const THEME_COLOR = '#7C3AED';

export default function StatsPanel({ stats, onReset, isDark, T }) {
  // Build last-7-days chart data
  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const day = stats.dailyHistory[key] || { attempts: 0, correct: 0 };
      days.push({
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        key,
        attempts: day.attempts,
        correct: day.correct,
        accuracy: day.attempts > 0 ? Math.round((day.correct / day.attempts) * 100) : 0,
      });
    }
    return days;
  }, [stats.dailyHistory]);

  const maxAttempts = Math.max(...last7.map((d) => d.attempts), 1);
  const totalDaysPlayed = Object.values(stats.dailyHistory).filter((d) => d.attempts > 0).length;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '16px',
        background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
        mt: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <CalendarMonthIcon sx={{ color: THEME_COLOR, fontSize: 18 }} />
        <Typography
          variant="body2"
          sx={{ color: T.textPrimary, fontWeight: 700, letterSpacing: '-0.01em' }}
        >
          Daily Progress
        </Typography>
      </Box>

      {/* 7-day accuracy bar chart */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mb: 3, height: 90 }}>
        {last7.map((day) => (
          <Box
            key={day.key}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              height: '100%',
              justifyContent: 'flex-end',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 28,
                height: `${(day.attempts / maxAttempts) * 70}px`,
                minHeight: day.attempts > 0 ? 8 : 4,
                borderRadius: '6px 6px 0 0',
                background:
                  day.attempts === 0
                    ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
                    : day.accuracy >= 70
                    ? 'linear-gradient(180deg, #22C55E, #16A34A)'
                    : day.accuracy >= 40
                    ? 'linear-gradient(180deg, #F59E0B, #D97706)'
                    : 'linear-gradient(180deg, #EF4444, #DC2626)',
                position: 'relative',
                transition: 'height 0.4s ease',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              title={
                day.attempts > 0
                  ? `${day.accuracy}% accuracy (${day.correct}/${day.attempts})`
                  : 'No puzzles'
              }
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              {day.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { color: '#22C55E', label: 'Good' },
          { color: '#F59E0B', label: 'Average' },
          { color: '#EF4444', label: 'Low' },
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: 1, background: color }} />
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#64748B', fontSize: '0.65rem', fontWeight: 600 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', mb: 3 }} />

      {/* Summary row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'space-around' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: T.textPrimary, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {totalDaysPlayed}
          </Typography>
          <Typography variant="caption" sx={{ color: T.textTertiary, fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', mt: 0.5, display: 'block' }}>
            days active
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: T.textPrimary, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {stats.totalAttempts}
          </Typography>
          <Typography variant="caption" sx={{ color: T.textTertiary, fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', mt: 0.5, display: 'block' }}>
            solved
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#22C55E', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {stats.totalAttempts > 0 ? `${Math.round((stats.totalCorrect / stats.totalAttempts) * 100)}%` : '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: T.textTertiary, fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', mt: 0.5, display: 'block' }}>
            accuracy
          </Typography>
        </Box>
      </Box>

      {/* Accuracy progress bar */}
      {stats.totalAttempts > 0 && (
        <Box sx={{ mb: 3, px: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="caption" sx={{ color: T.textSecondary, fontSize: '0.7rem', fontWeight: 600 }}>
              Total Progress
            </Typography>
            <Typography variant="caption" sx={{ color: THEME_COLOR, fontWeight: 700, fontSize: '0.7rem' }}>
              {stats.totalCorrect} / {stats.totalAttempts}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(stats.totalCorrect / stats.totalAttempts) * 100}
            sx={{
              height: 10,
              borderRadius: 10,
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.08)',
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${THEME_COLOR}, #22C55E)`,
                borderRadius: 10,
              },
            }}
          />
        </Box>
      )}

      {/* Reset button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <Button
          size="small"
          variant="text"
          startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
          onClick={onReset}
          sx={{
            color: '#EF4444',
            fontSize: '0.75rem',
            textTransform: 'none',
            fontWeight: 600,
            opacity: 0.7,
            '&:hover': { background: 'rgba(239,68,68,0.08)', opacity: 1 },
          }}
        >
          Reset Statistics
        </Button>
      </Box>
    </Box>
  );
}
