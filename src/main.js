import './style.css';
import { CameraManager } from './camera.js';
import { SoundEngine } from './sound.js';
import { HandTracker } from './tracker.js';
import { GameManager } from './game.js';

const videoEl = document.getElementById('video-feed');
const canvasEl = document.getElementById('game-canvas');
const statusMsgEl = document.getElementById('camera-status-msg');

const cameraMgr = new CameraManager(videoEl);
const soundEngine = new SoundEngine();
const handTracker = new HandTracker();

const gameManager = new GameManager(canvasEl, cameraMgr, handTracker, soundEngine);

// 1. Bind UI buttons immediately so user clicks NEVER freeze
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
  cameraMgr.switchCamera().catch(err => {
    alert("切换摄像头失败: " + err.message);
  });
});

document.getElementById('btn-fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// 2. Continuous 60 FPS Render Loop
function renderLoop(timestamp) {
  if (gameManager) {
    gameManager.updateAndRender(timestamp);
  }
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

// 3. Initialize Camera & AI Trackers asynchronously
async function initSensors() {
  try {
    statusMsgEl.className = 'status-msg';
    statusMsgEl.innerText = '📷 正在获取摄像头权限...';
    
    await cameraMgr.init();
    
    statusMsgEl.innerText = '🤖 正在加载手势识别 AI...';
    await handTracker.init();

    statusMsgEl.innerText = '✅ 摄像头与手势 AI 就绪，选择模式开始游戏！';
  } catch (err) {
    console.error("Camera/AI Init Error:", err);
    statusMsgEl.className = 'status-msg error';
    statusMsgEl.innerText = `⚠️ ${err.message || '摄像头开启失败'}`;
  }
}

initSensors();
