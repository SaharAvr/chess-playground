import React from 'react';
import { Paper, Typography, Box, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

const MotionPaper = motion.create(Paper);

const StatItem = ({ label, value, total, color }) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body1" sx={{ color: '#fff' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ color: '#fff' }}>
        {value}/{total}
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={(value / total) * 100}
      sx={{
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        '& .MuiLinearProgress-bar': {
          backgroundColor: color,
        },
      }}
    />
  </Box>
);

export default function Stats({ stats }) {
  const { total, correct, wrong, missed } = stats;
  
  return (
    <MotionPaper
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', duration: 0.5 }}
      sx={{
        p: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: '#fff', fontWeight: 600 }}>
        Statistics
      </Typography>

      <StatItem
        label="Total Turns"
        value={total}
        total={total}
        color="#4CAF50"
      />

      <StatItem
        label="Correct"
        value={correct}
        total={total}
        color="#2196F3"
      />

      <StatItem
        label="Wrong"
        value={wrong}
        total={total}
        color="#f44336"
      />

      <StatItem
        label="Missed"
        value={missed}
        total={total}
        color="#FFC107"
      />

      {total > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
            Accuracy Rate
          </Typography>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
            {((correct / (correct + wrong + missed)) * 100).toFixed(1)}%
          </Typography>
        </Box>
      )}
    </MotionPaper>
  );
} 