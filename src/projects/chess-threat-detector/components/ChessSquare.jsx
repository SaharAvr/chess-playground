import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import ChessPiece from './ChessPiece';

const MotionBox = motion.create(Box);

const LIGHT_SQUARE_COLOR = '#f0d9b5';
const DARK_SQUARE_COLOR = '#b58863';
const SELECTED_COLOR = 'rgba(255, 255, 0, 0.5)';
const CORRECT_COLOR = 'rgba(0, 255, 0, 0.5)';
const WRONG_COLOR = 'rgba(255, 0, 0, 0.5)';
const MISSED_COLOR = 'rgba(0, 255, 0, 0.2)';

export default function ChessSquare({
  square,
  piece,
  isLight,
  isSelected,
  isThreatened,
  onClick,
  isGameOver,
  position,
  threatenedPieces,
}) {
  const getBackgroundColor = () => {
    if (isGameOver) {
      if (isThreatened) {
        if (isSelected) {
          return CORRECT_COLOR;
        }
        return MISSED_COLOR;
      }
      if (isSelected) {
        return WRONG_COLOR;
      }
      return isLight ? LIGHT_SQUARE_COLOR : DARK_SQUARE_COLOR;
    }
    return isSelected ? SELECTED_COLOR : isLight ? LIGHT_SQUARE_COLOR : DARK_SQUARE_COLOR;
  };

  const getTooltipText = () => {
    if (isGameOver || isSelected || isThreatened) return null;

    const threatInfo = threatenedPieces.threatInfo[position];
    if (!threatInfo) return null;

    if (!threatInfo.isThreatened) {
      if (threatInfo.attackers.length === 0) {
        return "This piece is not threatened because no black pieces can reach this square.";
      }
      return "This piece is not threatened because all potential attackers are blocked or pinned.";
    }

    const attackers = threatInfo.attackers;
    if (attackers.length === 0) {
      return "This piece is not threatened because no black pieces can reach this square.";
    }

    return `This piece is threatened by:\n${attackers.map(attacker => 
      `${attacker.piece.toUpperCase()} from ${attacker.from}`
    ).join('\n')}`;
  };

  const squareContent = (
    <MotionBox
      whileHover={!isGameOver ? { scale: 1.05 } : {}}
      whileTap={!isGameOver ? { scale: 0.95 } : {}}
      onClick={!isGameOver ? onClick : undefined}
      sx={{
        width: '100%',
        aspectRatio: '1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: getBackgroundColor(),
        cursor: isGameOver ? 'default' : 'pointer',
        position: 'relative',
        transition: 'background-color 0.2s ease',
      }}
    >
      {piece && (
        <ChessPiece
          piece={piece}
          square={square}
        />
      )}
    </MotionBox>
  );

  if (isGameOver && isSelected && !isThreatened) {
    return (
      <Tooltip title={getTooltipText()} arrow>
        {squareContent}
      </Tooltip>
    );
  }

  return squareContent;
} 