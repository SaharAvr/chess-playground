import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { usePreventMobileBackNavigation } from '../hooks/usePreventMobileBackNavigation';

/**
 * A beautiful, shared modal component that includes back-to-close logic
 * and sleek animation.
 */
const SharedModal = ({ open, onClose, title, children, actions, maxWidth = 'sm', paperSx = {}, showX = true, isDark = false, T = {} }) => {
  // Mobile/PWA specific hardware back button protection
  usePreventMobileBackNavigation(open, onClose);
  
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Logic to get the text color based on T or isDark
  const titleColor = T.textPrimary || (isDark ? '#f8fafc' : '#1e293b');
  const iconColor = T.iconColor || (isDark ? '#94a3b8' : '#64748b');

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={maxWidth} 
      fullWidth 
      fullScreen={fullScreen}
      PaperProps={{ 
        sx: { 
          borderRadius: fullScreen ? 0 : '20px', 
          ...paperSx,
          // Smooth fade-in uses default Transition
        } 
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1, pt: 1 }}>
        <DialogTitle sx={{ fontWeight: 800, p: 2, color: titleColor, letterSpacing: '-0.02em' }}>{title}</DialogTitle>
        {showX && (
          <IconButton onClick={onClose} sx={{ color: iconColor, mr: 1 }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <DialogContent sx={{ p: fullScreen ? 2 : 3, pt: 0 }}>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default SharedModal;
