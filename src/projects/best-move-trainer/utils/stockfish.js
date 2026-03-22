/**
 * Local Stockfish Engine Integration
 * Uses the WebWorker in the public directory to analyze a position.
 */
export async function analyzeLocal(fen, depth = 12) {
  return new Promise((resolve, reject) => {
    // Check if we are in a browser environment
    if (typeof Worker === 'undefined') {
      return reject(new Error('Web Workers not supported'));
    }

    const engine = new Worker('/stockfish.js');
    let bestMove = null;
    let evalScore = 0;
    let continuation = [];

    // Safety timeout: if it takes more than 15s, something is wrong
    const timeout = setTimeout(() => {
      engine.terminate();
      reject(new Error('Local analysis timed out'));
    }, 15000);

    engine.onmessage = (event) => {
      const line = event.data;
      // console.log('SF:', line);

      if (line === 'uciok') {
        engine.postMessage('isready');
      } else if (line === 'readyok') {
        engine.postMessage('ucinewgame');
        engine.postMessage(`position fen ${fen}`);
        engine.postMessage(`go depth ${depth}`);
      } else if (line.startsWith('info depth')) {
        // Parse eval and PV (continuation)
        const scoreMatch = line.match(/score cp (-?\d+)/);
        if (scoreMatch) {
          evalScore = parseInt(scoreMatch[1]) / 100;
        } else if (line.match(/score mate (-?\d+)/)) {
          evalScore = 15; // Rough estimate for mate
        }

        const pvMatch = line.match(/ pv (.+)/);
        if (pvMatch) {
          continuation = pvMatch[1].split(' ');
        }
      } else if (line.startsWith('bestmove')) {
        clearTimeout(timeout);
        const parts = line.split(' ');
        bestMove = parts[1];
        
        engine.terminate();
        resolve({
          move: bestMove,
          eval: evalScore,
          continuationArr: continuation,
          source: 'local'
        });
      }
    };

    engine.onerror = (err) => {
      clearTimeout(timeout);
      engine.terminate();
      reject(err);
    };

    engine.postMessage('uci');
  });
}
