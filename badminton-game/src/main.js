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

document.getElementById('btn-start-match').addEventListener('click', () => {
  gameManager.startMatch();
});

document.getElementById('btn-restart').addEventListener('click', () => {
  gameManager.startMatch();
});

document.getElementById('btn-camera-flip').addEventListener('click', () => {
  cameraMgr.switchCamera().catch(err => alert("切换失败: " + err.message));
});

document.getElementById('btn-fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

function renderLoop() {
  gameManager.updateAndRender();
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

async function initSensors() {
  try {
    statusMsgEl.innerText = '📷 正在获取摄像头权限...';
    await cameraMgr.init();
    statusMsgEl.innerText = '🤖 正在加载双人手势 AI...';
    await handTracker.init();
    statusMsgEl.innerText = '✅ AI 就绪！站在左右两侧开始双人体感对战！';
  } catch (err) {
    statusMsgEl.className = 'status-msg error';
    statusMsgEl.innerText = `⚠️ ${err.message || '初始化失败'}`;
  }
}

initSensors();
