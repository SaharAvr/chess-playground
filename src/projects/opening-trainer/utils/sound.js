// Sound effects for chess moves
const moveSound = new Audio('https://lichess1.org/assets/sound/standard/Move.mp3');
const captureSound = new Audio('https://lichess1.org/assets/sound/standard/Capture.mp3');

export const playMoveSound = (isCapture = false) => {
  const sound = isCapture ? captureSound : moveSound;
  sound.currentTime = 0;
  sound.volume = 0.5;
  sound.play().catch(() => {
    // Ignore errors from browsers blocking autoplay
  });
};

export const preloadSounds = () => {
  // Preload sounds
  moveSound.load();
  captureSound.load();
}; 