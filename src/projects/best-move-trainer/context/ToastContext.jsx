import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const getIcon = (severity) => {
    switch (severity) {
      case 'success': return <CheckCircleIcon sx={{ color: '#22C55E' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#EF4444' }} />;
      default: return <InfoIcon sx={{ color: '#3B82F6' }} />;
    }
  };

  const getBorderColor = (severity) => {
    switch (severity) {
      case 'success': return '#22C55E30';
      case 'error': return '#EF444430';
      default: return '#3B82F630';
    }
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 80, md: 40 } }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            background: 'rgba(15, 12, 26, 0.92)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${getBorderColor(toast.severity)}`,
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            minWidth: 280,
            maxWidth: '90vw'
          }}
        >
          {getIcon(toast.severity)}
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, flex: 1 }}>
            {toast.message}
          </Typography>
          <IconButton size="small" onClick={hideToast} sx={{ color: 'rgba(255,255,255,0.4)', p: 0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
};
