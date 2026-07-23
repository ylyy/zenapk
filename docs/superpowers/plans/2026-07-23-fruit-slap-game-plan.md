# Fruit Slap Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-friendly Web App for an AR hand-gesture fruit slap game using MediaPipe Hand Landmarker, falling fruit physics, Web Audio SFX, and TV-screen mirroring compatibility.

**Architecture:** A dual-layer web app with a `<video>` background layer for camera feed and a `<canvas>` overlay layer for hand skeleton rendering, physics-based fruit animation, particle effects, and HUD score elements. MediaPipe WASM runs on GPU to detect hand landmarks at 30+ FPS.

**Tech Stack:** Vite, Vanilla JavaScript (ES Modules), HTML5 Canvas 2D, `@mediapipe/tasks-vision`, Web Audio API, Modern Vanilla CSS.

## Global Constraints
- Target workspace: `/Users/test/zenapk`
- Mobile browser: Chrome on Android, mobile video constraints with front camera horizontal mirroring
- TV Projection: Clean, high-contrast visual HUD and canvas scaling
- Dependency: `@mediapipe/tasks-vision` for hand tracking
- Zero external audio files: Web Audio API synthesized sound effects

---

### Task 1: Project Scaffolding & Canvas/Video Layout

**Files:**
- Create: `/Users/test/zenapk/package.json`
- Create: `/Users/test/zenapk/index.html`
- Create: `/Users/test/zenapk/src/style.css`
- Create: `/Users/test/zenapk/src/main.js`

**Interfaces:**
- Produces: Base HTML layout containing `#video-feed` `<video>` element, `#game-canvas` `<canvas>` element, and `#ui-overlay` container.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "fruit-slap-game",
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
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Fruit Slap AR - 手势拍水果</title>
  <link rel="stylesheet" href="./src/style.css" />
</head>
<body>
  <div id="app">
    <video id="video-feed" playsinline autoplay muted></video>
    <canvas id="game-canvas"></canvas>
    
    <div id="ui-overlay">
      <div id="top-bar">
        <div class="stat-box"><span class="label">SCORE</span><span id="score-val">0</span></div>
        <div class="stat-box"><span class="label">COMBO</span><span id="combo-val">x1</span></div>
        <div class="stat-box"><span class="label">TIME</span><span id="time-val">60s</span></div>
      </div>
      
      <div id="controls-bar">
        <button id="btn-camera-flip" class="icon-btn">🔄 切换摄像头</button>
        <button id="btn-fullscreen" class="icon-btn">📺 全屏投屏</button>
      </div>

      <div id="menu-modal" class="modal active">
        <div class="modal-content">
          <h1>🍎 手势拍水果 🍉</h1>
          <p>张开双臂面对摄像头，用双掌拍击下落的水果！</p>
          <div class="mode-select">
            <button id="btn-start-classic" class="main-btn">限时挑战 (60秒)</button>
            <button id="btn-start-endless" class="main-btn secondary">无尽模式</button>
          </div>
          <div class="high-score-tag">最高分: <span id="high-score-val">0</span></div>
        </div>
      </div>

      <div id="gameover-modal" class="modal">
        <div class="modal-content">
          <h2>GAME OVER</h2>
          <div class="final-stats">
            <div>得分: <span id="final-score">0</span></div>
            <div>最高连击: <span id="final-combo">x1</span></div>
          </div>
          <button id="btn-restart" class="main-btn">再玩一次</button>
        </div>
      </div>
    </div>
  </div>
  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create src/style.css**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;
}

body, html {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;
  font-family: 'Segoe UI', Roboto, -apple-system, sans-serif;
}

#app {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

#video-feed {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  transform: scaleX(-1); /* Default front camera mirror */
}

#video-feed.no-mirror {
  transform: scaleX(1);
}

#game-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

#ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

#top-bar {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
}

.stat-box {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 8px 20px;
  text-align: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.stat-box .label {
  display: block;
  font-size: 12px;
  letter-spacing: 1px;
  color: #ffeb3b;
  font-weight: bold;
}

.stat-box span:not(.label) {
  font-size: 24px;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

#controls-bar {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  pointer-events: auto;
}

.icon-btn {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 10px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: blur(4px);
}

.modal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(10px);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 10;
  pointer-events: auto;
}

.modal.active {
  display: flex;
}

.modal-content {
  background: rgba(30, 30, 40, 0.95);
  border: 2px solid #ff4081;
  border-radius: 24px;
  padding: 36px 28px;
  text-align: center;
  color: white;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 0 30px rgba(255, 64, 129, 0.4);
}

.modal-content h1 {
  font-size: 28px;
  margin-bottom: 12px;
  color: #ffeb3b;
}

.main-btn {
  background: linear-gradient(45deg, #ff4081, #ff9100);
  border: none;
  color: white;
  padding: 14px 28px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 30px;
  cursor: pointer;
  width: 100%;
  margin-top: 12px;
  box-shadow: 0 4px 15px rgba(255, 64, 129, 0.4);
}

.main-btn.secondary {
  background: linear-gradient(45deg, #00e676, #00b0ff);
}
```

- [ ] **Step 4: Create src/main.js entry point stub**

```javascript
import './style.css';

console.log("Fruit Slap Game Initialized");
```

- [ ] **Step 5: Install dependencies and build test**

Run: `npm install`
Run: `npm run build`
Expected: `dist/` directory created with no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json index.html src/style.css src/main.js
git commit -m "feat: setup project structure and HTML/CSS layout"
```

---

### Task 2: Camera Manager Module (`src/camera.js`)

**Files:**
- Create: `/Users/test/zenapk/src/camera.js`
- Modify: `/Users/test/zenapk/src/main.js`

**Interfaces:**
- Produces: `CameraManager` class with methods `init(videoElement)`, `switchCamera()`, `isMirrored()`.

- [ ] **Step 1: Write CameraManager class**

```javascript
// src/camera.js
export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.facingMode = 'user'; // 'user' for front, 'environment' for back
  }

  async init() {
    return this.startStream();
  }

  async startStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        facingMode: this.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      
      // Toggle mirror class based on camera facing mode
      if (this.facingMode === 'user') {
        this.video.classList.remove('no-mirror');
      } else {
        this.video.classList.add('no-mirror');
      }

      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve(this.video);
        };
      });
    } catch (err) {
      console.error("Camera access failed:", err);
      throw err;
    }
  }

  async switchCamera() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    return this.startStream();
  }

  isMirrored() {
    return this.facingMode === 'user';
  }
}
```

- [ ] **Step 2: Connect camera controls in src/main.js**

```javascript
import './style.css';
import { CameraManager } from './camera.js';

const videoEl = document.getElementById('video-feed');
const cameraMgr = new CameraManager(videoEl);

document.getElementById('btn-camera-flip').addEventListener('click', () => {
  cameraMgr.switchCamera().catch(err => alert("无法切换摄像头: " + err.message));
});

document.getElementById('btn-fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

cameraMgr.init().then(() => {
  console.log("Camera feed ready.");
}).catch(err => {
  console.error("Camera error:", err);
});
```

- [ ] **Step 3: Test build**

Run: `npm run build`
Expected: Passes without compilation error.

- [ ] **Step 4: Commit**

```bash
git add src/camera.js src/main.js
git commit -m "feat: implement CameraManager module and flip camera logic"
```

---

### Task 3: Web Audio Synthesizer Engine (`src/sound.js`)

**Files:**
- Create: `/Users/test/zenapk/src/sound.js`

**Interfaces:**
- Produces: `SoundEngine` class with methods `playSlap()`, `playSplat()`, `playCombo(comboCount)`, `playBomb()`.

- [ ] **Step 1: Write SoundEngine class**

```javascript
// src/sound.js
export class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Slap impact punch sound
  playSlap() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Fruit juice splat sound
  playSplat() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // Combo level-up chime chord
  playCombo(combo = 1) {
    if (!this.ctx) return;
    const baseFreq = 440; // A4
    const notes = [0, 4, 7, 12, 16]; // Major arpeggio steps
    const noteIdx = Math.min(combo, notes.length - 1);
    const freq = baseFreq * Math.pow(2, notes[noteIdx] / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Bomb explosion sound
  playBomb() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}
```

- [ ] **Step 2: Test build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add src/sound.js
git commit -m "feat: implement Web Audio sound synthesizer engine"
```

---

### Task 4: Fruit Physics Engine & Particle System (`src/fruit.js`, `src/particle.js`)

**Files:**
- Create: `/Users/test/zenapk/src/fruit.js`
- Create: `/Users/test/zenapk/src/particle.js`

**Interfaces:**
- Produces: `Fruit` class, `Particle` / `JuiceSplat` classes, `FruitEngine` manager.

- [ ] **Step 1: Write Particle System (`src/particle.js`)**

```javascript
// src/particle.js
export class JuiceParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 6 + 3;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.gravity = 0.3;
    this.alpha = 1.0;
    this.decay = Math.random() * 0.03 + 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ScoreText {
  constructor(x, y, text, color = '#ffeb3b') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.vy = -3;
    this.alpha = 1.0;
  }

  update() {
    this.y += this.vy;
    this.alpha -= 0.02;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
```

- [ ] **Step 2: Write Fruit Engine (`src/fruit.js`)**

```javascript
// src/fruit.js
import { JuiceParticle, ScoreText } from './particle.js';

export const FRUIT_TYPES = {
  APPLE: { emoji: '🍎', color: '#ff1744', radius: 40, pts: 10, isBomb: false },
  ORANGE: { emoji: '🍊', color: '#ff9100', radius: 38, pts: 10, isBomb: false },
  WATERMELON: { emoji: '🍉', color: '#00e676', radius: 55, pts: 20, isBomb: false },
  STRAWBERRY: { emoji: '🍓', color: '#f50057', radius: 32, pts: 15, isBomb: false },
  BANANA: { emoji: '🍌', color: '#ffea00', radius: 36, pts: 15, isBomb: false },
  BOMB: { emoji: '💣', color: '#333333', radius: 42, pts: -30, isBomb: true }
};

export class Fruit {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Choose random type (Bomb has 15% chance)
    const types = Object.values(FRUIT_TYPES);
    const rand = Math.random();
    if (rand < 0.15) {
      this.config = FRUIT_TYPES.BOMB;
    } else {
      const nonBombs = types.filter(t => !t.isBomb);
      this.config = nonBombs[Math.floor(Math.random() * nonBombs.length)];
    }

    this.radius = this.config.radius;
    this.x = Math.random() * (canvasWidth - 100) + 50;
    this.y = -60;
    
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = Math.random() * 3 + 2; // Initial downward speed
    this.gravity = 0.25;
    
    this.rotation = 0;
    this.vRot = (Math.random() - 0.5) * 0.1;
    this.isSliced = false;
    this.slicedHalves = null;
  }

  update() {
    if (this.isSliced) {
      if (this.slicedHalves) {
        this.slicedHalves.left.x += this.slicedHalves.left.vx;
        this.slicedHalves.left.y += this.slicedHalves.left.vy;
        this.slicedHalves.left.vy += 0.4;
        
        this.slicedHalves.right.x += this.slicedHalves.right.vx;
        this.slicedHalves.right.y += this.slicedHalves.right.vy;
        this.slicedHalves.right.vy += 0.4;
      }
      return;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.rotation += this.vRot;
  }

  draw(ctx) {
    ctx.save();
    if (this.isSliced && this.slicedHalves) {
      // Draw split halves
      ctx.font = `${this.radius * 1.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.translate(this.slicedHalves.left.x, this.slicedHalves.left.y);
      ctx.rotate(this.rotation - 0.3);
      ctx.fillText(this.config.emoji, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.translate(this.slicedHalves.right.x, this.slicedHalves.right.y);
      ctx.rotate(this.rotation + 0.3);
      ctx.fillText(this.config.emoji, 0, 0);
      ctx.restore();
    } else {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.font = `${this.radius * 1.8}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.config.emoji, 0, 0);
    }
    ctx.restore();
  }

  slice() {
    if (this.isSliced) return [];
    this.isSliced = true;

    this.slicedHalves = {
      left: { x: this.x - 10, y: this.y, vx: -4, vy: -3 },
      right: { x: this.x + 10, y: this.y, vx: 4, vy: -3 }
    };

    // Create juice particles
    const particles = [];
    for (let i = 0; i < 15; i++) {
      particles.push(new JuiceParticle(this.x, this.y, this.config.color));
    }
    return particles;
  }

  isOutOfBounds() {
    return this.y > this.canvasHeight + 100;
  }
}
```

- [ ] **Step 3: Test build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/particle.js src/fruit.js
git commit -m "feat: implement Fruit physics engine and JuiceParticle system"
```

---

### Task 5: Hand Tracker AI & Collision Detector (`src/tracker.js`)

**Files:**
- Create: `/Users/test/zenapk/src/tracker.js`

**Interfaces:**
- Produces: `HandTracker` class to load MediaPipe WASM and process canvas frames, returning hand landmarks and collision results against fruit objects.

- [ ] **Step 1: Write HandTracker class**

```javascript
// src/tracker.js
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class HandTracker {
  constructor() {
    this.landmarker = null;
    this.isReady = false;
  }

  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 2
    });

    this.isReady = true;
    console.log("MediaPipe HandLandmarker Ready");
  }

  detectHands(videoElement, timestamp) {
    if (!this.isReady || !videoElement || videoElement.readyState < 2) {
      return [];
    }

    const results = this.landmarker.detectForVideo(videoElement, timestamp);
    return results.landmarks || [];
  }

  // Convert normalized landmark (0..1) to canvas coordinates
  getHandPoints(landmarks, canvasWidth, canvasHeight, isMirrored = true) {
    const points = [];
    // Key landmarks for slap collision: Palm (9), Index tip (8), Thumb tip (4), Middle tip (12), Pinky tip (20)
    const hitIndices = [0, 4, 8, 9, 12, 16, 20];

    for (const hand of landmarks) {
      for (const idx of hitIndices) {
        const lm = hand[idx];
        let x = lm.x * canvasWidth;
        if (isMirrored) {
          x = canvasWidth - x; // Flip X coordinate to match video mirror
        }
        const y = lm.y * canvasHeight;
        points.push({ x, y, radius: 25 });
      }
    }
    return points;
  }

  drawSkeleton(ctx, landmarks, canvasWidth, canvasHeight, isMirrored = true) {
    ctx.save();
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#ff4081';

    for (const hand of landmarks) {
      // Draw key joints
      for (const lm of hand) {
        let x = lm.x * canvasWidth;
        if (isMirrored) x = canvasWidth - x;
        const y = lm.y * canvasHeight;

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
```

- [ ] **Step 2: Test build**

Run: `npm run build`
Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/tracker.js
git commit -m "feat: integrate MediaPipe HandLandmarker and skeleton rendering"
```

---

### Task 6: Game Manager & Complete Main Loop Integration (`src/game.js`, `src/main.js`)

**Files:**
- Create: `/Users/test/zenapk/src/game.js`
- Modify: `/Users/test/zenapk/src/main.js`

**Interfaces:**
- Produces: `GameManager` class running 60 FPS animation loop, connecting `CameraManager`, `HandTracker`, `FruitEngine`, `SoundEngine`, and HUD state updates.

- [ ] **Step 1: Write GameManager (`src/game.js`)**

```javascript
// src/game.js
import { Fruit } from './fruit.js';
import { ScoreText } from './particle.js';

export class GameManager {
  constructor(canvas, cameraMgr, handTracker, soundEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cameraMgr = cameraMgr;
    this.handTracker = handTracker;
    this.sound = soundEngine;

    this.state = 'MENU'; // MENU, PLAYING, GAMEOVER
    this.mode = 'CLASSIC'; // CLASSIC (60s), ENDLESS

    this.score = 0;
    this.combo = 1;
    this.lastHitTime = 0;
    this.timeLeft = 60;
    this.lives = 3;

    this.fruits = [];
    this.particles = [];
    this.scores = [];

    this.spawnTimer = 0;
    this.gameTimerInterval = null;

    this.highScore = parseInt(localStorage.getItem('fruit_slap_highscore') || '0');
    document.getElementById('high-score-val').innerText = this.highScore;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  startGame(mode = 'CLASSIC') {
    this.mode = mode;
    this.state = 'PLAYING';
    this.score = 0;
    this.combo = 1;
    this.timeLeft = 60;
    this.lives = 3;
    this.fruits = [];
    this.particles = [];
    this.scores = [];
    
    this.updateHUD();

    document.getElementById('menu-modal').classList.remove('active');
    document.getElementById('gameover-modal').classList.remove('active');

    this.sound.init();

    if (this.gameTimerInterval) clearInterval(this.gameTimerInterval);
    
    if (this.mode === 'CLASSIC') {
      this.gameTimerInterval = setInterval(() => {
        this.timeLeft--;
        document.getElementById('time-val').innerText = `${this.timeLeft}s`;
        if (this.timeLeft <= 0) {
          this.endGame();
        }
      }, 1000);
    } else {
      document.getElementById('time-val').innerText = '∞';
    }
  }

  endGame() {
    this.state = 'GAMEOVER';
    if (this.gameTimerInterval) clearInterval(this.gameTimerInterval);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('fruit_slap_highscore', this.highScore.toString());
      document.getElementById('high-score-val').innerText = this.highScore;
    }

    document.getElementById('final-score').innerText = this.score;
    document.getElementById('final-combo').innerText = `x${this.combo}`;
    document.getElementById('gameover-modal').classList.add('active');
  }

  updateHUD() {
    document.getElementById('score-val').innerText = this.score;
    document.getElementById('combo-val').innerText = `x${this.combo}`;
  }

  updateAndRender(timestamp) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state !== 'PLAYING') return;

    // 1. Spawn Fruits
    this.spawnTimer++;
    if (this.spawnTimer > 45) { // Spawn every ~0.75s
      this.fruits.push(new Fruit(this.canvas.width, this.canvas.height));
      this.spawnTimer = 0;
    }

    // 2. Track Hands
    const landmarks = this.handTracker.detectHands(this.cameraMgr.video, timestamp);
    const handPoints = this.handTracker.getHandPoints(
      landmarks,
      this.canvas.width,
      this.canvas.height,
      this.cameraMgr.isMirrored()
    );

    // Draw hand skeleton
    this.handTracker.drawSkeleton(
      this.ctx,
      landmarks,
      this.canvas.width,
      this.canvas.height,
      this.cameraMgr.isMirrored()
    );

    // 3. Process Collisions & Fruits
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      fruit.update();
      fruit.draw(this.ctx);

      if (!fruit.isSliced) {
        // Check collision against hand points
        for (const hp of handPoints) {
          const dist = Math.hypot(hp.x - fruit.x, hp.y - fruit.y);
          if (dist < fruit.radius + hp.radius) {
            // Hit!
            const newParticles = fruit.slice();
            this.particles.push(...newParticles);

            const now = performance.now();
            if (now - this.lastHitTime < 1200) {
              this.combo++;
            } else {
              this.combo = 1;
            }
            this.lastHitTime = now;

            if (fruit.config.isBomb) {
              this.sound.playBomb();
              this.score = Math.max(0, this.score + fruit.config.pts);
              this.combo = 1;
              this.scores.push(new ScoreText(fruit.x, fruit.y, `${fruit.config.pts}`, '#ff1744'));
              if (this.mode === 'ENDLESS') {
                this.lives--;
                if (this.lives <= 0) this.endGame();
              }
            } else {
              this.sound.playSlap();
              this.sound.playSplat();
              if (this.combo > 1) this.sound.playCombo(this.combo);

              const pointsEarned = fruit.config.pts * this.combo;
              this.score += pointsEarned;
              this.scores.push(
                new ScoreText(fruit.x, fruit.y, `+${pointsEarned} (x${this.combo})`)
              );
            }

            this.updateHUD();
            break;
          }
        }
      }

      if (fruit.isOutOfBounds()) {
        this.fruits.splice(i, 1);
      }
    }

    // 4. Update Particles & Score Texts
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      p.draw(this.ctx);
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.scores.length - 1; i >= 0; i--) {
      const st = this.scores[i];
      st.update();
      st.draw(this.ctx);
      if (st.alpha <= 0) this.scores.splice(i, 1);
    }
  }
}
```

- [ ] **Step 2: Connect main.js entry point**

```javascript
// src/main.js
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
```

- [ ] **Step 3: Build verification**

Run: `npm run build`
Expected: `dist/` created cleanly without errors.

- [ ] **Step 4: Commit**

```bash
git add src/game.js src/main.js
git commit -m "feat: complete game manager loop, UI modals and main entry integration"
```

---

### Task 7: Final Polish & Self-Review

**Files:**
- Modify: `docs/superpowers/plans/2026-07-23-fruit-slap-game-plan.md` (check off steps)

- [ ] **Step 1: Run production build check**
Run: `npm run build`
Expected: Clean build.

- [ ] **Step 2: Commit final status**
```bash
git add .
git commit -m "chore: complete fruit slap game implementation plan"
```
