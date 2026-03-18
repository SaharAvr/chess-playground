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

export default function StatsPanel({ stats, onReset }) {
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
        background: '#fafaf9',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        mt: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CalendarMonthIcon sx={{ color: THEME_COLOR, fontSize: 18 }} />
        <Typography
          variant="body2"
          sx={{ color: '#1E1B4B', fontWeight: 700, letterSpacing: '-0.01em' }}
        >
          Progress Over Time
        </Typography>
      </Box>

      {/* 7-day accuracy bar chart */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', mb: 2, height: 80 }}>
        {last7.map((day) => (
          <Box
            key={day.key}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              height: '100%',
              justifyContent: 'flex-end',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 30,
                height: `${(day.attempts / maxAttempts) * 70}px`,
                minHeight: day.attempts > 0 ? 8 : 2,
                borderRadius: '4px 4px 0 0',
                background:
                  day.attempts === 0
                    ? 'rgba(0,0,0,0.08)'
                    : day.accuracy >= 70
                    ? 'linear-gradient(180deg, #22C55E, #16A34A)'
                    : day.accuracy >= 40
                    ? 'linear-gradient(180deg, #F59E0B, #D97706)'
                    : 'linear-gradient(180deg, #EF4444, #DC2626)',
                position: 'relative',
                transition: 'height 0.4s ease',
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
                color: '#94A3B8',
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
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {[
          { color: '#22C55E', label: '≥70% accuracy' },
          { color: '#F59E0B', label: '40–69%' },
          { color: '#EF4444', label: '<40%' },
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: 1, background: color }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: 'rgba(0,0,0,0.08)', mb: 2 }} />

      {/* Summary row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, justifyContent: 'space-around' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: THEME_COLOR, fontWeight: 800, letterSpacing: '-0.03em' }}>
            {totalDaysPlayed}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
            days played
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: THEME_COLOR, fontWeight: 800, letterSpacing: '-0.03em' }}>
            {stats.totalAttempts}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
            total puzzles
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#22C55E', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {stats.totalAttempts > 0 ? `${Math.round((stats.totalCorrect / stats.totalAttempts) * 100)}%` : '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
            all-time accuracy
          </Typography>
        </Box>
      </Box>

      {/* Accuracy progress bar */}
      {stats.totalAttempts > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
              Overall progress
            </Typography>
            <Typography variant="caption" sx={{ color: THEME_COLOR, fontWeight: 600, fontSize: '0.7rem' }}>
              {stats.totalCorrect} / {stats.totalAttempts}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(stats.totalCorrect / stats.totalAttempts) * 100}
            sx={{
              height: 6,
              borderRadius: 6,
              background: 'rgba(124,58,237,0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #7C3AED, #22C55E)',
                borderRadius: 6,
              },
            }}
          />
        </Box>
      )}

      {/* Reset button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          size="small"
          startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
          onClick={onReset}
          sx={{
            color: '#EF4444',
            fontSize: '0.75rem',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { background: 'rgba(239,68,68,0.08)' },
          }}
        >
          Reset stats
        </Button>
      </Box>
    </Box>
  );
}
