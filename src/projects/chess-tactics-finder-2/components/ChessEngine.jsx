import React, { useEffect, useRef, forwardRef } from 'react';
import { Chess } from 'chess.js';

const ChessEngine = forwardRef(({ onMove, onError }, ref) => {
  const engineRef = useRef(null);
  const chessRef = useRef(new Chess());
  const tacticSequenceRef = useRef([]);
  const isEngineReadyRef = useRef(false);
  const timeoutRef = useRef(null);
  const messageCallbackRef = useRef(null);

  const evaluatePosition = async (position, depth = 15) => {
    return new Promise(resolve => {
      let lastEval = null;
      messageCallbackRef.current = (event) => {
        // Handle readyok separately
        if (event.includes('readyok')) {
          return;
        }

        // Handle bestmove
        if (event.includes('bestmove')) {
          messageCallbackRef.current = null;
          resolve(lastEval || 0);
          return;
        }

        // Parse evaluation info
        if (event.includes('info') && event.includes('score')) {
          const match = event.match(/score (cp|mate) (-?\d+)/);
          if (match) {
            const [, type, score] = match;
            lastEval = type === 'mate'
              ? (parseInt(score) > 0 ? 100000 : -100000)
              : parseInt(score);
          }
        }
      };

      // Send commands with small delays to ensure proper sequencing
      engineRef.current.postMessage('stop');
      setTimeout(() => {
        engineRef.current.postMessage('isready');
        setTimeout(() => {
          engineRef.current.postMessage(`position fen ${position.fen()}`);
          setTimeout(() => {
            engineRef.current.postMessage(`go depth ${depth}`);
          }, 50);
        }, 50);
      }, 50);
    });
  };

  useEffect(() => {
    const initEngine = async () => {
      try {
        engineRef.current = new Worker(new URL('stockfish.js', import.meta.url));

        engineRef.current.onmessage = ({ data: event }) => {
          // Handle initialization messages
          if (event.includes('uciok')) {
            isEngineReadyRef.current = true;
          } else if (event.includes('readyok')) {
            isEngineReadyRef.current = true;
          }

          // Route evaluation messages to callback if one is set
          if (messageCallbackRef.current) {
            messageCallbackRef.current(event);
          }
        };

        engineRef.current.onerror = (error) => {
          console.error('Stockfish worker error:', error);
          onError?.(error);
        };

        // Initialize UCI mode
        engineRef.current.postMessage('uci');
        engineRef.current.postMessage('setoption name UCI_AnalyseMode value true');
        engineRef.current.postMessage('setoption name MultiPV value 1');
        engineRef.current.postMessage('isready');

      } catch (error) {
        console.error('Stockfish initialization error:', error);
        onError?.(error);
      }
    };

    initEngine();

    return () => {
      if (timeoutRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        clearTimeout(timeoutRef.current);
      }
      if (engineRef.current) {
        engineRef.current.terminate();
      }
    };
  }, [onError]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    findTactic: async (level, threshold = 50, maxDepth = 3) => {
      return new Promise((resolve, reject) => {
        console.log('\n=== Finding Tactics ===');
        console.log('Position:', chessRef.current.fen());

        if (!isEngineReadyRef.current) {
          reject(new Error('Engine not ready'));
          return;
        }

        tacticSequenceRef.current = [];
        let searchTimeout = null;
        let isSearchStopped = false;
        let pendingEvaluations = new Set();
        let analyzedPositions = new Set();
        const initialTurn = chessRef.current.turn();

        const stopSearch = () => {
          if (isSearchStopped) return;
          isSearchStopped = true;
          engineRef.current.postMessage('stop');
          messageCallbackRef.current = null;
          if (searchTimeout) {
            clearTimeout(searchTimeout);
            searchTimeout = null;
          }
          tacticSequenceRef.current = [];
          pendingEvaluations.forEach(reject => reject(new Error('Search stopped')));
          pendingEvaluations.clear();
        };

        searchTimeout = setTimeout(() => {
          if (isSearchStopped) return;
          console.error('Search timeout after 60 seconds');
          stopSearch();
          reject(new Error('Search timeout after 60 seconds'));
        }, 60000);

        const evaluatePositionWithTimeout = async (position, depth) => {
          if (isSearchStopped) {
            throw new Error('Search stopped');
          }
          return new Promise((resolve, reject) => {
            pendingEvaluations.add(reject);
            evaluatePosition(position, depth)
              .then(result => {
                pendingEvaluations.delete(reject);
                resolve(result);
              })
              .catch(error => {
                pendingEvaluations.delete(reject);
                reject(error);
              });
          });
        };

        // Analyze a single position and return all valid next positions
        const analyzePosition = async (position, depth, sequence) => {
          if (isSearchStopped) {
            return [];
          }

          const positionKey = position.fen().split(' ').slice(0, 4).join(' ');
          if (analyzedPositions.has(positionKey)) {
            return [];
          }
          analyzedPositions.add(positionKey);

          const isOurTurn = position.turn() === initialTurn;

          let moves = position.moves({ verbose: true }).filter(move => {
            if (isOurTurn) {
              // Acceptable self moves:
              // 1. Checks
              // 2. Captures
              const isCheck = (new Chess(move.after)).isCheck();
              const isCapture = move.captured;
              return (isCheck || isCapture);
            }

            // Acceptable opponent moves:
            // 1. Back captures
            // 2. Defending a newly threatened piece
            const lastSelfMove = sequence[sequence.length - 1];
            const isBackCapture = (move.captured && move.to === lastSelfMove?.from);
            return isBackCapture;
          });

          // For opponent's moves, keep only the highest value capture
          // if (!isOurTurn) {
          //   // Define piece values
          //   const pieceValues = {
          //     'q': 9,  // Queen
          //     'r': 5,  // Rook
          //     'b': 3,  // Bishop
          //     'n': 3,  // Knight
          //     'p': 1   // Pawn
          //   };

          //   // Find the highest value capture
          //   const maxValue = Math.max(...moves.map(move =>
          //     pieceValues[move.captured.toLowerCase()] || 0
          //   ));

          //   // Keep only moves that capture pieces of the highest value
          //   moves = moves.filter(move =>
          //     pieceValues[move.captured.toLowerCase()] === maxValue
          //   );
          // }

          const nextPositions = [];

          // Process each move
          for (let move of moves) {
            if (isSearchStopped) {
              return [];
            }

            // Create a fresh Chess instance with the current position's FEN
            const newPosition = new Chess(position.fen());
            newPosition.move(move);
            const newSequence = [...sequence, {
              san: `${move.from}${move.to}`,
              from: move.from,
              to: move.to
            }];

            // Check for checkmate
            if (newPosition.isCheckmate()) {
              console.log('\n✓ Checkmate found!');
              console.log('Winning sequence:', newSequence.map(m => m.san).join(' '));
              tacticSequenceRef.current = newSequence;
              stopSearch();
              resolve(newSequence);
              return [];
            }

            // If we've reached max depth (AND after opponent's turn), evaluate the position
            debugger;
            if (!isOurTurn && depth <= maxDepth) {
              try {
                const evalAfterMoves = await evaluatePositionWithTimeout(newPosition, maxDepth);
                console.log('Eval after moves:', evalAfterMoves);
                const multiplier = initialTurn === 'w' ? 1 : -1;
                const advantage = multiplier * evalAfterMoves;
                if (advantage >= threshold && !tacticSequenceRef.current.length) {
                  console.log('\n✓ Tactic found!', { advantage, evalAfterMoves });
                  console.log('Winning sequence:', newSequence.map(m => m.san).join(' '));
                  tacticSequenceRef.current = newSequence;
                  stopSearch();
                  resolve(newSequence);
                  return [];
                }
              } catch {
                continue;
              }
              continue;
            }

            nextPositions.push({
              position: newPosition,
              sequence: newSequence,
              move: `${move.from}${move.to}`  // Store the move for logging
            });
          }

          return nextPositions;
        };

        // Start the search using BFS
        const startSearch = async () => {
          try {
            const initialPosition = new Chess(chessRef.current.fen());
            let currentDepth = 0;
            let currentLevel = [{ position: initialPosition, sequence: [], move: 'initial' }];

            while (currentLevel.length > 0 && !isSearchStopped) {
              // Log the current depth
              const displayDepth = Math.floor(currentDepth / 2) + 1;
              const isOurTurn = currentDepth % 2 === 0;

              if (isSearchStopped) break;
              console.log(`\n=== Processing Depth ${displayDepth} (${isOurTurn ? 'our turn' : 'opponent turn'}) ===`);

              // Process all positions at the current depth
              const nextLevel = [];

              // First, collect all moves at this depth
              for (const { position, sequence } of currentLevel) {
                if (isSearchStopped) break;
                const nextPositions = await analyzePosition(position, currentDepth, sequence);

                // Log the moves being analyzed from this position
                if (nextPositions.length > 0) {
                  const sequenceStr = sequence.map(m => m.san).join(' ');
                  console.log(`${sequenceStr ? `After "${sequenceStr}": ` : ''}Found ${nextPositions.length} capture moves:`,
                    nextPositions.map(p => p.move).join(', '));
                }

                nextLevel.push(...nextPositions);
              }

              // Move to next depth
              currentDepth++;
              currentLevel = nextLevel;

              if (isSearchStopped) break;

              // Log completion of current depth
              if (nextLevel.length === 0) {
                console.log(`No more mvoes found at depth ${displayDepth}`);
                resolve(null);
              }
            }

            if (isSearchStopped) return;

            if (!tacticSequenceRef.current.length) {
              console.log('\nSearch complete - no tactics found');
            }
          } catch (error) {
            console.error('Search error:', error);
            reject(error);
          }
        };

        // Start the search process
        startSearch();
      });
    },
    makeMove: (move) => {
      try {
        const result = chessRef.current.move(move);
        if (result) {
          onMove?.(result);
        }
        return result;
      } catch {
        // Silently return false for invalid moves without showing error
        return null;
      }
    },
    turn: () => chessRef.current.turn(),
    isCheckmate: () => chessRef.current.isCheckmate(),
    getFen: () => chessRef.current.fen(),
    getHistory: () => chessRef.current.history(),
    getTacticSequence: () => tacticSequenceRef.current,
    reset: () => {
      chessRef.current.reset();
      tacticSequenceRef.current = [];
      onMove?.(null);
    }
  }));

  return null;
});

export default ChessEngine; 