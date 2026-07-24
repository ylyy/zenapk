import { initTracker, detectFrame } from './tracker.js';
import { GestureEngine, GESTURE_STAGES } from './gestureEngine.js';
import { drawSuperSaiyanAura } from './effects/auraEffect.js';
import { drawKamehameha } from './effects/kamehameha.js';
import {
  playGatherEnergy,
  playTransformationBlast,
  playKamehamehaCharge,
  playKamehamehaBeam
} from './audio.js';

const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const powerValueEl = document.getElementById('power-value');
const stageBadgeEl = document.getElementById('stage-badge');
const gestureTitleEl = document.getElementById('gesture-title');
const gestureDescEl = document.getElementById('gesture-desc');
const progressBarEl = document.getElementById('progress-bar');
const btnPhoto = document.getElementById('btn-photo');
const btnReset = document.getElementById('btn-reset');

const engine = new GestureEngine();
let isTransformed = false;
let currentPower = 5000;
let targetPower = 5000;

async function setup() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' }
    });
    video.srcObject = stream;
    await video.play();

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    await initTracker(video);
    requestAnimationFrame(loop);
  } catch (err) {
    console.error('Camera initialization failed', err);
    gestureTitleEl.textContent = '无法获取摄像头权限';
    gestureDescEl.textContent = '请在浏览器设置中开启摄像头权限以进行 AR 手势识别。';
  }
}

let lastStage = GESTURE_STAGES.STAGE1_STEP1_CHEST_CROSS;

function loop() {
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width, 0);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  const landmarks = detectFrame(video);
  const status = engine.update(landmarks);

  if (status.stage !== lastStage) {
    onStageChange(status.stage);
    lastStage = status.stage;
  }

  updateHUD(status);

  // Render Visual Effects
  drawSuperSaiyanAura(ctx, landmarks.pose, isTransformed);
  drawKamehameha(ctx, landmarks.hands, status.stage);

  // Update Power Level Counter
  if (currentPower < targetPower) {
    currentPower += Math.ceil((targetPower - currentPower) * 0.1);
    powerValueEl.textContent = currentPower.toLocaleString();
  }

  requestAnimationFrame(loop);
}

function onStageChange(stage) {
  switch (stage) {
    case GESTURE_STAGES.STAGE1_STEP1_CHEST_CROSS:
      playGatherEnergy();
      break;
    case GESTURE_STAGES.STAGE1_STEP2_HIPS_FISTS:
      playGatherEnergy();
      targetPower = 250000;
      break;
    case GESTURE_STAGES.STAGE1_STEP3_POWER_RAISE:
      playGatherEnergy();
      targetPower = 9500000;
      break;
    case GESTURE_STAGES.TRANSFORMED:
    case GESTURE_STAGES.STAGE2_STEP1_KAME_CHARGE:
      isTransformed = true;
      targetPower = 950000000;
      playTransformationBlast();
      playKamehamehaCharge();
      break;
    case GESTURE_STAGES.STAGE2_STEP2_KAME_BLAST:
    case GESTURE_STAGES.VICTORY:
      playKamehamehaBeam();
      btnPhoto.classList.remove('hidden');
      break;
  }
}

function updateHUD(status) {
  progressBarEl.style.width = `${status.progress * 100}%`;

  switch (status.stage) {
    case GESTURE_STAGES.STAGE1_STEP1_CHEST_CROSS:
      stageBadgeEl.textContent = '阶段 1: 突破极限变身';
      gestureTitleEl.textContent = '步骤 1/3: 胸前交叉聚气';
      gestureDescEl.textContent = '将双手在胸前交叉';
      break;
    case GESTURE_STAGES.STAGE1_STEP2_HIPS_FISTS:
      gestureTitleEl.textContent = '步骤 2/3: 腰侧握拳蓄力';
      gestureDescEl.textContent = '双手握拳下拉至腰部两侧';
      break;
    case GESTURE_STAGES.STAGE1_STEP3_POWER_RAISE:
      gestureTitleEl.textContent = '步骤 3/3: 高举双手爆气';
      gestureDescEl.textContent = '向头顶上方高举双手爆发变身！';
      break;
    case GESTURE_STAGES.STAGE2_STEP1_KAME_CHARGE:
      stageBadgeEl.textContent = '阶段 2: 龟派气功发波';
      gestureTitleEl.textContent = '步骤 1/2: 腰侧合拢聚能';
      gestureDescEl.textContent = '双手在腰间合拢聚集巨型能量球';
      break;
    case GESTURE_STAGES.STAGE2_STEP2_KAME_BLAST:
    case GESTURE_STAGES.VICTORY:
      stageBadgeEl.textContent = '阶段 2: 龟派气功发波';
      gestureTitleEl.textContent = '步骤 2/2: 双手猛力前推';
      gestureDescEl.textContent = '终极龟派气功波已贯穿全屏！';
      break;
  }
}

btnReset.addEventListener('click', () => {
  engine.reset();
  isTransformed = false;
  currentPower = 5000;
  targetPower = 5000;
  powerValueEl.textContent = '5,000';
  btnPhoto.classList.add('hidden');
});

btnPhoto.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `super-saiyan-${Date.now()}.png`;
  link.href = canvas.toDataURL();
  link.click();
});

setup();
