import React from 'react';
import { Chessboard } from 'react-chessboard';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const MotionDialog = motion(Dialog);
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

export const FloatingBoard = ({ 
  open, 
  onClose, 
  onConfirm, 
  position, 
  onMakeMove,
  isPlaying 
}) => {
  return (
    <AnimatePresence>
      {open && (
        <MotionDialog
          open={open}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          PaperComponent={MotionPaper}
          PaperProps={{
            initial: { scale: 0.9, opacity: 0, y: 20 },
            animate: { 
              scale: 1, 
              opacity: 1, 
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
              }
            },
            exit: { 
              scale: 0.9, 
              opacity: 0, 
              y: 20,
              transition: {
                duration: 0.2
              }
            }
          }}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            }
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Close Button */}
              <MotionBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
              >
                <IconButton
                  onClick={onClose}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 1)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </MotionBox>

              {/* Board */}
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                sx={{ 
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 1
                  }}
                >
                  New Board
                </Typography>
                <Box sx={{ 
                  width: '100%',
                  maxWidth: 600,
                  aspectRatio: '1',
                  position: 'relative'
                }}>
                  <Chessboard 
                    position={position}
                    boardOrientation="white"
                    customBoardStyle={{
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                      background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)'
                    }}
                    onPieceDrop={(sourceSquare, targetSquare) => {
                      if (isPlaying) {
                        onMakeMove({
                          from: sourceSquare,
                          to: targetSquare,
                          promotion: 'q'
                        });
                      }
                    }}
                  />
                </Box>
              </MotionBox>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 0 }}>
            <MotionBox
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="outlined"
                onClick={onClose}
                startIcon={<CloseIcon />}
                sx={{
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                  }
                }}
              >
                Cancel
              </Button>
            </MotionBox>
            <MotionBox
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="contained"
                onClick={onConfirm}
                startIcon={<CheckIcon />}
                sx={{
                  background: 'linear-gradient(45deg, #0EA5E9 30%, #0284C7 90%)',
                  boxShadow: '0 3px 12px rgba(14, 165, 233, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)',
                    background: 'linear-gradient(45deg, #0284C7 30%, #0EA5E9 90%)',
                  }
                }}
              >
                Confirm Board
              </Button>
            </MotionBox>
          </DialogActions>
        </MotionDialog>
      )}
    </AnimatePresence>
  );
}; 