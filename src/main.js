import './style.css';
import { CameraManager } from './camera.js';
import { SoundEngine } from './sound.js';
import { HandTracker } from './tracker.js';
import { GameManager } from './game.js';

const videoEl = document.getElementById('video-feed');
const canvasEl = document.getElementById('game-canvas');

const cameraMgr = new CameraManager(videoEl);
const soundEngine = new SoundEngine();
const handTracker = new HandTracker();

let gameManager = null;

async function initApp() {
  await cameraMgr.init();
  await handTracker.init();

  gameManager = new GameManager(canvasEl, cameraMgr, handTracker, soundEngine);

  document.getElementById('btn-start-classic').addEventListener('click', () => {
    gameManager.startGame('CLASSIC');
  });

  document.getElementById('btn-start-endless').addEventListener('click', () => {
    gameManager.startGame('ENDLESS');
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    gameManager.startGame(gameManager.mode);
  });

  document.getElementById('btn-camera-flip').addEventListener('click', () => {
    cameraMgr.switchCamera();
  });

  document.getElementById('btn-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  function renderLoop(timestamp) {
    if (gameManager) {
      gameManager.updateAndRender(timestamp);
    }
    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);
}

initApp().catch(err => {
  console.error("Initialization error:", err);
});
