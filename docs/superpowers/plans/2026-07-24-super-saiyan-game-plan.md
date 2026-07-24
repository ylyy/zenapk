# Super Saiyan AR Gesture Transformation & Kamehameha Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based AR game where players perform sequential hand & body gestures to transform into a Super Saiyan and unleash a Kamehameha wave blast with rich canvas visual effects, Web Audio FX, and real-time MediaPipe tracking.

**Architecture:** A Vite-powered sub-project in `saiyan/` using `@mediapipe/tasks-vision` for hand/pose landmarks, an isolated sequence state machine for gesture stages, dynamic Canvas 2D/WebGL particle renderers for Super Saiyan aura/hair/Kamehameha, and Web Audio API synthesizer for sound effects.

**Tech Stack:** JavaScript (ES modules), Vite, MediaPipe Tasks Vision (`@mediapipe/tasks-vision`), HTML5 Canvas 2D, Web Audio API, CSS3.

## Global Constraints

- Project path: `saiyan/`
- Zero binary or external MP3 asset dependency: use Web Audio API synthesis for reliable cross-browser audio.
- Compatible with desktop and mobile webcams.

---

### Task 1: Project Setup & Package Integration

**Files:**
- Create: `saiyan/package.json`
- Create: `saiyan/vite.config.js`
- Create: `saiyan/index.html`
- Create: `saiyan/src/style.css`
- Modify: `package.json` (root)
- Modify: `index.html` (root)

**Interfaces:**
- Consumes: npm workspace & MediaPipe tasks vision
- Produces: `saiyan` build scripts and UI frame container

- [ ] **Step 1: Create `saiyan/package.json`**

```json
{
  "name": "super-saiyan-ar",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@mediapipe/tasks-vision": "^0.10.14"
  },
  "devDependencies": {
    "@vitejs/plugin-basic-ssl": "^1.2.0",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create `saiyan/vite.config.js`**

```javascript
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()],
  base: './',
  build: {
    outDir: '../dist/saiyan',
    emptyOutDir: true
  },
  server: {
    host: true
  }
});
```

- [ ] **Step 3: Create `saiyan/index.html` and `saiyan/src/style.css`**

`saiyan/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>超级赛亚人 AR 变身与发波</title>
  <link rel="stylesheet" href="./src/style.css" />
</head>
<body>
  <div id="app">
    <video id="webcam" autoplay playsinline muted></video>
    <canvas id="canvas"></canvas>

    <!-- Glassmorphism HUD -->
    <div id="hud-overlay">
      <header class="hud-header">
        <a href="../index.html" class="back-btn">← 大厅</a>
        <h1 class="game-title">⚡ 赛亚人 AR 爆气 ⚡</h1>
        <div id="power-gauge" class="power-gauge">
          <span class="label">战斗力</span>
          <span id="power-value" class="value">5,000</span>
        </div>
      </header>

      <!-- Stage & Prompt Guidance Card -->
      <div id="prompt-card" class="prompt-card">
        <div id="stage-badge" class="stage-badge">阶段 1: 突破极限变身</div>
        <div id="gesture-title" class="gesture-title">步骤 1/3: 胸前交叉聚气</div>
        <div id="gesture-desc" class="gesture-desc">将双手在胸前交叉过重</div>
        <div id="progress-bar-container" class="progress-bar-container">
          <div id="progress-bar" class="progress-bar"></div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div id="controls">
        <button id="btn-photo" class="hud-btn hidden">📸 拍照保存</button>
        <button id="btn-reset" class="hud-btn">🔄 重新变身</button>
      </div>
    </div>
  </div>
  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Update root `package.json` and `index.html`**

Update `package.json`: Add `"dev:saiyan": "cd saiyan && npm run dev"` and `"build:saiyan": "cd saiyan && npm run build"`.
Update `index.html`: Add a card for "超级赛亚人 AR 变身与发波" pointing to `./saiyan/index.html`.

- [ ] **Step 5: Commit Setup**

```bash
git add saiyan/package.json saiyan/vite.config.js saiyan/index.html saiyan/src/style.css package.json index.html
git commit -m "feat(saiyan): setup super saiyan project structure and hub entry"
```

---

### Task 2: Gesture Tracker Engine (`saiyan/src/tracker.js`)

**Files:**
- Create: `saiyan/src/tracker.js`

**Interfaces:**
- Consumes: Webcam stream & `@mediapipe/tasks-vision`
- Produces: `initTracker(videoElement)`, `getLandmarks()` returning `{ hands: [...], pose: [...] }`

- [ ] **Step 1: Implement `saiyan/src/tracker.js`**

```javascript
import { HandLandmarker, PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let handLandmarker = null;
let poseLandmarker = null;
let lastVideoTime = -1;
let currentResults = { hands: [], pose: null };

export async function initTracker(videoElement) {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numHands: 2
  });

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO'
  });
}

export function detectFrame(videoElement) {
  if (!handLandmarker || !poseLandmarker || videoElement.currentTime === lastVideoTime) {
    return currentResults;
  }
  lastVideoTime = videoElement.currentTime;
  const startTimeMs = performance.now();

  const handRes = handLandmarker.detectForVideo(videoElement, startTimeMs);
  const poseRes = poseLandmarker.detectForVideo(videoElement, startTimeMs);

  currentResults = {
    hands: handRes.landmarks || [],
    pose: (poseRes.landmarks && poseRes.landmarks.length > 0) ? poseRes.landmarks[0] : null
  };
  return currentResults;
}
```

- [ ] **Step 2: Commit Tracker**

```bash
git add saiyan/src/tracker.js
git commit -m "feat(saiyan): implement tracker engine using MediaPipe Hand and Pose landmarker"
```

---

### Task 3: Sequential Gesture Recognition State Machine (`saiyan/src/gestureEngine.js`)

**Files:**
- Create: `saiyan/src/gestureEngine.js`
- Create: `saiyan/src/gestureEngine.test.js`

**Interfaces:**
- Consumes: `landmarks` `{ hands, pose }`
- Produces: `GestureEngine` class with state enum, `update(landmarks)`, `getState()`, `getProgress()`

- [ ] **Step 1: Create `saiyan/src/gestureEngine.js`**

```javascript
export const GESTURE_STAGES = {
  STAGE1_STEP1_CHEST_CROSS: 'STAGE1_STEP1_CHEST_CROSS',
  STAGE1_STEP2_HIPS_FISTS: 'STAGE1_STEP2_HIPS_FISTS',
  STAGE1_STEP3_POWER_RAISE: 'STAGE1_STEP3_POWER_RAISE',
  TRANSFORMED: 'TRANSFORMED',
  STAGE2_STEP1_KAME_CHARGE: 'STAGE2_STEP1_KAME_CHARGE',
  STAGE2_STEP2_KAME_BLAST: 'STAGE2_STEP2_KAME_BLAST',
  VICTORY: 'VICTORY'
};

export class GestureEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.stage = GESTURE_STAGES.STAGE1_STEP1_CHEST_CROSS;
    this.progress = 0; // 0 to 1 hold timer
    this.holdFrames = 0;
    this.requiredFrames = 10; // ~0.3s hold
  }

  update({ hands, pose }) {
    if (!hands || hands.length === 0) return this.getStatus();

    const hand1 = hands[0];
    const hand2 = hands[1] || null;

    switch (this.stage) {
      case GESTURE_STAGES.STAGE1_STEP1_CHEST_CROSS: {
        // Hands crossed near chest center
        if (hand1 && hand2) {
          const dist = Math.hypot(hand1[0].x - hand2[0].x, hand1[0].y - hand2[0].y);
          if (dist < 0.25 && hand1[0].y > 0.3 && hand1[0].y < 0.7) {
            this.incrementHold(() => {
              this.stage = GESTURE_STAGES.STAGE1_STEP2_HIPS_FISTS;
            });
          } else {
            this.decayHold();
          }
        }
        break;
      }
      case GESTURE_STAGES.STAGE1_STEP2_HIPS_FISTS: {
        // Hands down near hips/waist
        if (hand1 && hand1[0].y > 0.55) {
          this.incrementHold(() => {
            this.stage = GESTURE_STAGES.STAGE1_STEP3_POWER_RAISE;
          });
        } else {
          this.decayHold();
        }
        break;
      }
      case GESTURE_STAGES.STAGE1_STEP3_POWER_RAISE: {
        // Hands raised above head
        if (hand1 && hand1[0].y < 0.3) {
          this.incrementHold(() => {
            this.stage = GESTURE_STAGES.TRANSFORMED;
          });
        } else {
          this.decayHold();
        }
        break;
      }
      case GESTURE_STAGES.TRANSFORMED: {
        // Transition to Kamehameha stage
        this.stage = GESTURE_STAGES.STAGE2_STEP1_KAME_CHARGE;
        this.holdFrames = 0;
        break;
      }
      case GESTURE_STAGES.STAGE2_STEP1_KAME_CHARGE: {
        // Two hands together at hip side
        if (hand1 && hand2) {
          const handDist = Math.hypot(hand1[0].x - hand2[0].x, hand1[0].y - hand2[0].y);
          if (handDist < 0.18) {
            this.incrementHold(() => {
              this.stage = GESTURE_STAGES.STAGE2_STEP2_KAME_BLAST;
            });
          } else {
            this.decayHold();
          }
        }
        break;
      }
      case GESTURE_STAGES.STAGE2_STEP2_KAME_BLAST: {
        // Push palms forward towards camera (hand bounding box enlarged / palms pushed)
        if (hand1) {
          const wrist = hand1[0];
          const index = hand1[8];
          const size = Math.hypot(wrist.x - index.x, wrist.y - index.y);
          if (size > 0.15) {
            this.incrementHold(() => {
              this.stage = GESTURE_STAGES.VICTORY;
            });
          }
        }
        break;
      }
    }

    return this.getStatus();
  }

  incrementHold(onComplete) {
    this.holdFrames++;
    this.progress = Math.min(1, this.holdFrames / this.requiredFrames);
    if (this.holdFrames >= this.requiredFrames) {
      this.holdFrames = 0;
      this.progress = 0;
      onComplete();
    }
  }

  decayHold() {
    if (this.holdFrames > 0) {
      this.holdFrames--;
      this.progress = Math.max(0, this.holdFrames / this.requiredFrames);
    }
  }

  getStatus() {
    return {
      stage: this.stage,
      progress: this.progress
    };
  }
}
```

- [ ] **Step 2: Commit Gesture Engine**

```bash
git add saiyan/src/gestureEngine.js
git commit -m "feat(saiyan): add gesture sequence state machine"
```

---

### Task 4: Web Audio Synth Sound FX Generator (`saiyan/src/audio.js`)

**Files:**
- Create: `saiyan/src/audio.js`

**Interfaces:**
- Consumes: AudioContext
- Produces: `playGatherEnergy()`, `playTransformationBlast()`, `playKamehamehaCharge()`, `playKamehamehaBeam()`, `playPowerupUp()`

- [ ] **Step 1: Create `saiyan/src/audio.js`**

```javascript
let ctx = null;

function getAudioContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

export function playGatherEnergy() {
  const c = getAudioContext();
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.5);

  gain.gain.setValueAtTime(0.2, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start();
  osc.stop(c.currentTime + 0.5);
}

export function playTransformationBlast() {
  const c = getAudioContext();
  // Low hum + explosion noise
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(80, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 1.2);

  gain.gain.setValueAtTime(0.5, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 1.2);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start();
  osc.stop(c.currentTime + 1.2);
}

export function playKamehamehaCharge() {
  const c = getAudioContext();
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, c.currentTime);
  osc.frequency.linearRampToValueAtTime(1200, c.currentTime + 1.0);

  gain.gain.setValueAtTime(0.3, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 1.0);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start();
  osc.stop(c.currentTime + 1.0);
}

export function playKamehamehaBeam() {
  const c = getAudioContext();
  const bufferSize = c.sampleRate * 1.5;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = c.createBufferSource();
  noise.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, c.currentTime);
  filter.frequency.linearRampToValueAtTime(300, c.currentTime + 1.5);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.6, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 1.5);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  noise.start();
}
```

- [ ] **Step 2: Commit Audio Engine**

```bash
git add saiyan/src/audio.js
git commit -m "feat(saiyan): add Web Audio API synthesizer for Saiyan energy and Kamehameha sound FX"
```

---

### Task 5: Visual Effects Engine (`auraEffect.js`, `kamehameha.js`)

**Files:**
- Create: `saiyan/src/effects/auraEffect.js`
- Create: `saiyan/src/effects/kamehameha.js`

**Interfaces:**
- Consumes: Canvas 2D Context, pose/hand landmarks, delta time
- Produces: `drawSuperSaiyanAura(ctx, poseLandmarks, isTransformed)`, `drawKamehameha(ctx, handLandmarks, stage)`

- [ ] **Step 1: Create `saiyan/src/effects/auraEffect.js`**

Implement golden hair flame, body aura particles, and electric sparks anchored to head (nose/ears) and shoulders.

```javascript
let particles = [];
let sparks = [];

export function drawSuperSaiyanAura(ctx, pose, isTransformed) {
  if (!isTransformed) return;

  const headX = pose ? pose[0].x * ctx.canvas.width : ctx.canvas.width / 2;
  const headY = pose ? pose[0].y * ctx.canvas.height : ctx.canvas.height / 3;

  // 1. Draw Golden Flame Hair Crown
  ctx.save();
  ctx.fillStyle = '#ffeb3b';
  ctx.shadowColor = '#ff9800';
  ctx.shadowBlur = 25;

  ctx.beginPath();
  ctx.moveTo(headX - 60, headY - 10);
  ctx.lineTo(headX - 40, headY - 110);
  ctx.lineTo(headX - 10, headY - 60);
  ctx.lineTo(headX, headY - 140); // Center high spike
  ctx.lineTo(headX + 10, headY - 60);
  ctx.lineTo(headX + 40, headY - 110);
  ctx.lineTo(headX + 60, headY - 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Body Aura Flame Particles
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: headX + (Math.random() - 0.5) * 200,
      y: headY + 100 + Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 8 - 4,
      size: Math.random() * 20 + 10,
      alpha: 1,
      color: Math.random() > 0.3 ? 'rgba(255, 235, 59, ' : 'rgba(255, 152, 0, '
    });
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.03;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = p.color + p.alpha + ')';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Blue Lightning Sparks
  if (Math.random() < 0.4) {
    sparks.push({
      x: headX + (Math.random() - 0.5) * 250,
      y: headY + (Math.random() - 0.5) * 250,
      life: 5
    });
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life--;
    if (s.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00b0ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + (Math.random() - 0.5) * 40, s.y + (Math.random() - 0.5) * 40);
    ctx.stroke();
    ctx.restore();
  }
}
```

- [ ] **Step 2: Create `saiyan/src/effects/kamehameha.js`**

Implement charging sphere between hands and energy beam blast firing across screen.

```javascript
let kameBeamProgress = 0;

export function drawKamehameha(ctx, hands, stage) {
  if (!hands || hands.length === 0) return;

  const hand1 = hands[0];
  const hand2 = hands[1] || hands[0];

  const cx = ((hand1[0].x + hand2[0].x) / 2) * ctx.canvas.width;
  const cy = ((hand1[0].y + hand2[0].y) / 2) * ctx.canvas.height;

  if (stage === 'STAGE2_STEP1_KAME_CHARGE') {
    // Charging Energy Sphere
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 60);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#00e5ff');
    grad.addColorStop(1, 'rgba(0, 176, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 60 + Math.random() * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (stage === 'STAGE2_STEP2_KAME_BLAST' || stage === 'VICTORY') {
    // Firing Giant Beam Blast
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    kameBeamProgress = Math.min(1, kameBeamProgress + 0.1);
    const beamWidth = 200 * kameBeamProgress;

    const grad = ctx.createLinearGradient(0, cy - beamWidth / 2, 0, cy + beamWidth / 2);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.2)');
    grad.addColorStop(0.3, '#00e5ff');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(0.7, '#00e5ff');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0.2)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, cy - beamWidth / 2, ctx.canvas.width, beamWidth);

    // KAMEHAMEHA IMPACT Text
    ctx.font = '900 48px sans-serif';
    ctx.fillStyle = '#ffeb3b';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff3d00';
    ctx.shadowBlur = 20;
    ctx.fillText('⚡ KAMEHAMEHA IMPACT! ⚡', ctx.canvas.width / 2, ctx.canvas.height / 2);

    ctx.restore();
  }
}
```

- [ ] **Step 3: Commit Visual Effects Engine**

```bash
git add saiyan/src/effects/
git commit -m "feat(saiyan): implement Super Saiyan hair, aura, and Kamehameha blast visual effects"
```

---

### Task 6: Main Game Controller & Integration (`saiyan/src/main.js`)

**Files:**
- Create: `saiyan/src/main.js`

**Interfaces:**
- Connects webcam feed, tracker engine, gesture engine, audio synth, visual effects, and UI HUD cards.

- [ ] **Step 1: Implement `saiyan/src/main.js`**

```javascript
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
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720, facingMode: 'user' }
  });
  video.srcObject = stream;
  await video.play();

  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;

  await initTracker(video);
  requestAnimationFrame(loop);
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
```

- [ ] **Step 2: Commit Controller & Main Logic**

```bash
git add saiyan/src/main.js
git commit -m "feat(saiyan): wire main game controller, gesture engine, audio synth, and HUD"
```

---

### Task 7: Build & Integration Verification

**Files:**
- Modify: `scripts/build-all.js` (if needed)

- [ ] **Step 1: Test Build Output**

Run: `npm run build:saiyan` or `npm run build:all`
Expected: Clean compilation with output in `dist/saiyan`.

- [ ] **Step 2: Final Verification & Commit**

```bash
git add .
git commit -m "chore(saiyan): complete Super Saiyan AR game implementation and integration"
```
