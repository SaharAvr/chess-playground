import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ThreatDetector from './components/ThreatDetector';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1a1a1a',
      paper: 'rgba(255, 255, 255, 0.05)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

export default function ChessThreatDetector() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThreatDetector />
    </ThemeProvider>
  );
} 