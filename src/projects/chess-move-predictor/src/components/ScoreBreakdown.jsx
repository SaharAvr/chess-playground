import React from 'react';
import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  Chip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  Extension as MoveIcon,
  Star as StarIcon,
  Psychology as TacticsIcon,
  Timeline as MomentumIcon,
  CheckCircle as PerfectIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ScoreBreakdown = ({ boards, score }) => {
  const achievements = [
    {
      id: 'first-move',
      title: 'First Move',
      description: 'Make your first move',
      icon: <MoveIcon />,
      condition: (boards) => boards.some(board => board.moves.length > 0),
      points: 5
    },
    {
      id: 'quick-thinker',
      title: 'Quick Thinker',
      description: 'Make 3 moves in under 10 seconds',
      icon: <SpeedIcon />,
      condition: (boards) => boards.some(board => board.moves.length >= 3),
      points: 10
    },
    {
      id: 'master-predictor',
      title: 'Master Predictor',
      description: 'Score above 80 points',
      icon: <TrophyIcon />,
      condition: (score) => score >= 80,
      points: 20
    },
    {
      id: 'multi-tasker',
      title: 'Multi-tasker',
      description: 'Use all 3 board forks',
      icon: <StarIcon />,
      condition: (boards) => boards.length === 3,
      points: 15
    },
    {
      id: 'tactical-master',
      title: 'Tactical Master',
      description: 'Make a capture in each board',
      icon: <TacticsIcon />,
      condition: (boards) => boards.every(board => 
        board.moves.some(move => board.game.move(move).captured)
      ),
      points: 25
    },
    {
      id: 'momentum',
      title: 'Momentum',
      description: 'Make 5 moves in a single board',
      icon: <MomentumIcon />,
      condition: (boards) => boards.some(board => board.moves.length >= 5),
      points: 20
    },
    {
      id: 'perfect-game',
      title: 'Perfect Game',
      description: 'Score 100 points',
      icon: <PerfectIcon />,
      condition: (score) => score >= 100,
      points: 30
    },
    {
      id: 'under-pressure',
      title: 'Under Pressure',
      description: 'Make a move with less than 5 seconds left',
      icon: <WarningIcon />,
      condition: (boards) => boards.some(board => board.moves.length > 0),
      points: 15
    }
  ];

  const getAchieved = () => {
    return achievements.filter(achievement => 
      achievement.condition(achievement.id === 'master-predictor' || achievement.id === 'perfect-game' ? score : boards)
    );
  };

  const getTotalAchievementPoints = () => {
    return getAchieved().reduce((acc, achievement) => acc + achievement.points, 0);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        width: '100%',
        maxWidth: 400,
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Score Breakdown
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Total Score</Typography>
          <Typography variant="body2" color="primary">{score}</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(score, 100)} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            '& .MuiLinearProgress-bar': {
              transition: 'width 0.5s ease-in-out'
            }
          }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Achievements
        </Typography>
        <Chip 
          label={`${getTotalAchievementPoints()} pts`} 
          color="primary" 
          size="small"
          sx={{ ml: 1 }}
        />
      </Box>

      <List>
        <AnimatePresence>
          {getAchieved().map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Tooltip title={`+${achievement.points} points`} arrow>
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    {achievement.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={achievement.title}
                    secondary={achievement.description}
                  />
                  <Chip 
                    label={`+${achievement.points}`} 
                    color="primary" 
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </ListItem>
              </Tooltip>
            </motion.div>
          ))}
        </AnimatePresence>
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Board Statistics
      </Typography>

      <List>
        {boards.map((board, index) => (
          <ListItem key={board.id}>
            <ListItemText
              primary={`Board ${index + 1}`}
              secondary={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2">
                    Moves: {board.moves.length}
                  </Typography>
                  <Typography variant="body2">
                    Probability: {(board.probability * 100).toFixed(1)}%
                  </Typography>
                  {board.moves.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Last move: {board.moves[board.moves.length - 1]}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ScoreBreakdown; 