import React from 'react';
import { Chessboard } from 'react-chessboard';
import { 
  Paper, 
  IconButton, 
  Typography, 
  Box,
  Tooltip,
  Fade
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion, AnimatePresence } from 'framer-motion';

const ForkedBoards = ({ boards, onRemoveBoard, onMakeMove }) => {
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Visual connection lines */}
      {boards.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '2px',
            height: '100%',
            bgcolor: 'primary.main',
            opacity: 0.3,
            transform: 'translateX(-50%)',
            zIndex: 0
          }}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        <AnimatePresence>
          {boards.map((board, index) => (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  width: '100%',
                  maxWidth: 300,
                  position: 'relative',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'background.paper',
                    px: 1,
                    borderRadius: 1
                  }}
                >
                  <Typography variant="caption" color="primary">
                    Fork {index + 1}
                  </Typography>
                </Box>

                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'error.dark'
                    }
                  }}
                  onClick={() => onRemoveBoard(board.id)}
                >
                  <DeleteIcon />
                </IconButton>

                <Tooltip 
                  title="Click to make a move" 
                  TransitionComponent={Fade}
                  arrow
                >
                  <Box>
                    <Chessboard
                      position={board.game.fen()}
                      boardOrientation="white"
                      customBoardStyle={{
                        borderRadius: '4px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                      }}
                      onPieceDrop={(sourceSquare, targetSquare) => {
                        const move = `${sourceSquare}-${targetSquare}`;
                        onMakeMove(board.id, move);
                      }}
                    />
                  </Box>
                </Tooltip>

                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    Probability: {(board.probability * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Moves: {board.moves.length}
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default ForkedBoards; 