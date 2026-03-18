import React, { useState } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Avatar, Chip, Fade } from '@mui/material';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import useSound from 'use-sound';
import moveSound from '../sounds/move.mp3';
import captureSound from '../sounds/capture.mp3';
import { Piece } from '@chessire/pieces';

const ChessBoard = ({ fen, onMove, arrows, onNewGame, capturedPieces }) => {
  const [playMove] = useSound(moveSound, { volume: 1 });
  const [playCapture] = useSound(captureSound, { volume: 1 });
  const [checkmate, setCheckmate] = useState(false);
  const [isBoardDisabled, setIsBoardDisabled] = useState(false);

  const game = new Chess(fen);

  const onDrop = (sourceSquare, targetSquare) => {
    if (isBoardDisabled) return false;

    const gameCopy = new Chess(fen);
    
    try {
      const move = {
        from: sourceSquare,
        to: targetSquare
      };
      
      onMove(move);
      
      // Play appropriate sound based on whether it's a capture
      const moveResult = gameCopy.move(move);
      if (moveResult.captured) {
        playCapture();
      } else {
        playMove();
      }

      // Check for checkmate
      if (gameCopy.isCheckmate()) {
        setCheckmate(true);
      }
      
      return true;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  };

  const handleClose = () => {
    setCheckmate(false);
    setIsBoardDisabled(true);
  };

  const handleNewGame = () => {
    setCheckmate(false);
    setIsBoardDisabled(false);
    onNewGame();
  };

  const renderCapturedPieces = (pieces, color) => (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      p: 1,
      minHeight: '40px',
      alignItems: 'center',
      justifyContent: 'flex-end',
      position: 'relative'
    }}>
      {[...pieces].reverse().map((piece, index) => (
        <Box
          key={`${piece}-${index}`}
          sx={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
            position: 'absolute',
            right: (pieces.length - index - 1) * 16, // Half of the width (24/2) to create overlap
            zIndex: pieces.length - index
          }}
        >
          <Piece
            piece={piece.toUpperCase()}
            color={color}
            width={20}
            height={20}
          />
        </Box>
      ))}
    </Box>
  );

  const renderPlayerBar = (color, pieces, pieceColor) => {
    const isPlaying = game.turn() === (color === 'black' ? 'b' : 'w');
    
    return (
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 0,
        mr: -1,
        backgroundColor: color === 'black' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.5)',
        minHeight: '40px'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar 
            sx={{ 
              width: 28, 
              height: 28, 
              bgcolor: color === 'black' ? 'black' : 'white',
              boxShadow: 'none'
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: color === 'black' ? 'white' : 'black',
                fontWeight: 'bold'
              }}
            >
              {color === 'black' ? 'B' : 'W'}
            </Typography>
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {color === 'black' ? 'Black' : 'White'}
          </Typography>
          <Fade in={isPlaying}>
            <Chip
              label="Playing"
              size="small"
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem',
                  fontWeight: 500
                }
              }}
            />
          </Fade>
        </Box>
        {renderCapturedPieces(pieces, pieceColor)}
      </Box>
    );
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 0.5,
      width: '400px'
    }}>
      {renderPlayerBar('black', capturedPieces.black, 'white')}

      <Box sx={{ height: '400px' }}>
        <Chessboard 
          position={fen}
          onPieceDrop={onDrop}
          boardOrientation="white"
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            opacity: isBoardDisabled ? 0.7 : 1
          }}
          customArrows={arrows}
        />
      </Box>

      {renderPlayerBar('white', capturedPieces.white, 'black')}

      <Dialog
        open={checkmate}
        onClose={handleClose}
        PaperProps={{
          sx: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            p: 2,
            borderRadius: 2,
            textAlign: 'center',
            minWidth: '180px'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold',
          color: 'primary.main',
          pb: 0
        }}>
          Checkmate!
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Box sx={{ 
            fontSize: '0.9rem',
            color: 'text.secondary'
          }}>
            {game.turn() === 'w' ? 'Black' : 'White'} wins
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'center', 
          px: 2,
          pb: 1
        }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleNewGame}
            size="small"
            sx={{ 
              minWidth: 100,
              borderRadius: 1
            }}
          >
            New Game
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChessBoard; 