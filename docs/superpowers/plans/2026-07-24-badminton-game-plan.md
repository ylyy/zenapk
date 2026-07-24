# 2-Player Badminton Motion AR Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 2-player landscape (16:9) motion-controlled AR badminton game in `badminton-game/` with single-camera dual-person detection, 4D hand analytics (hand speed, position, impact swing velocity, counter force), virtual glowing rackets, and Web Audio SFX.

**Architecture:** A dual-layer web app with a 16:9 `<video>` camera layer and a 16:9 `<canvas>` game layer. MediaPipe HandLandmarker detects both players simultaneously. Detections are spatially partitioned ($x < 0.5 \rightarrow \text{P1 (Left)}$, $x \ge 0.5 \rightarrow \text{P2 (Right)}$). Racket renderers track hand positions in real time with dynamic motion trails, while Shuttlecock physics handles parabolic trajectories and smash spikes.

**Tech Stack:** Vite, ES Modules, HTML5 Canvas 2D, `@mediapipe/tasks-vision`, Web Audio API, Modern Vanilla CSS.

## Global Constraints
- Directory: `/Users/test/zenapk/badminton-game`
- Screen Orientation: 16:9 Landscape Mode
- Dual Player Partition: $x < 0.5$ for Player 1 (Left), $x \ge 0.5$ for Player 2 (Right)
- Analytics: Hand speed (m/s), position (x, y), impact velocity, counter-strike force (0-100%)
- Sound: 100% Web Audio API synthesized SFX (swish, hit whack, smash explosion, match win)

---

### Task 1: Scaffolding `badminton-game/` Project Structure

**Files:**
- Create: `/Users/test/zenapk/badminton-game/package.json`
- Create: `/Users/test/zenapk/badminton-game/vite.config.js`
- Create: `/Users/test/zenapk/badminton-game/index.html`
- Create: `/Users/test/zenapk/badminton-game/src/style.css`
- Create: `/Users/test/zenapk/badminton-game/src/main.js`

**Interfaces:**
- Produces: Base HTML layout with `#video-feed`, `#game-canvas`, `#ui-overlay`, P1/P2 Motion Analytics HUDs, and Match Modals.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "badminton-motion-game",
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

- [ ] **Step 2: Create vite.config.js**

```javascript
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    https: true
  }
});
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Badminton Motion AR - 双人体感羽毛球对战</title>
  <link rel="stylesheet" href="./src/style.css" />
</head>
<body>
  <div id="app">
    <video id="video-feed" playsinline autoplay muted></video>
    <canvas id="game-canvas"></canvas>
    
    <div id="ui-overlay">
      <div id="top-hud">
        <!-- P1 Analytics Card -->
        <div class="player-card p1-card">
          <div class="player-title">🔴 PLAYER 1 (左侧)</div>
          <div class="stat-row">手移动速度: <span id="p1-speed">0.0 m/s</span></div>
          <div class="stat-row">挥拍速报: <span id="p1-swing">0 km/h</span></div>
          <div class="power-bar-bg"><div id="p1-power-bar" class="power-bar-fill"></div></div>
        </div>

        <!-- Center Scoreboard -->
        <div id="scoreboard">
          <div class="score-display">
            <span id="p1-score" class="score-num p1-color">0</span>
            <span class="score-divider">:</span>
            <span id="p2-score" class="score-num p2-color">0</span>
          </div>
          <div id="serve-indicator">🔴 P1 发球</div>
        </div>

        <!-- P2 Analytics Card -->
        <div class="player-card p2-card">
          <div class="player-title">🔵 PLAYER 2 (右侧)</div>
          <div class="stat-row">手移动速度: <span id="p2-speed">0.0 m/s</span></div>
          <div class="stat-row">挥拍速报: <span id="p2-swing">0 km/h</span></div>
          <div class="power-bar-bg"><div id="p2-power-bar" class="power-bar-fill"></div></div>
        </div>
      </div>

      <div id="controls-bar">
        <button id="btn-camera-flip" class="icon-btn">🔄 切换摄像头</button>
        <button id="btn-fullscreen" class="icon-btn">📺 全屏投屏</button>
      </div>

      <div id="menu-modal" class="modal active">
        <div class="modal-content">
          <h1>🏸 双人羽毛球动作对战 🏸</h1>
          <p>横屏面对摄像头，站在左右两侧挥手当作羽毛球拍对战！</p>
          <div id="camera-status-msg" class="status-msg">📷 正在初始化摄像头与 AI...</div>
          <button id="btn-start-match" class="main-btn">开始双人对战 (11分制)</button>
        </div>
      </div>

      <div id="gameover-modal" class="modal">
        <div class="modal-content">
          <h2 id="winner-title">🏆 PLAYER 1 获胜！</h2>
          <div class="match-stats">
            <div>最高挥拍时速: <span id="max-swing-speed">0 km/h</span></div>
            <div>最大扣杀力度: <span id="max-smash-power">0%</span></div>
          </div>
          <button id="btn-restart" class="main-btn">再次对战</button>
        </div>
      </div>
    </div>
  </div>
  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create src/style.css**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
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
}

#video-feed {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  transform: scaleX(-1);
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

#top-hud {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 24px;
  background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
}

.player-card {
  background: rgba(20, 20, 30, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 12px 18px;
  color: white;
  width: 240px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.p1-card { border-left: 4px solid #ff4081; }
.p2-card { border-right: 4px solid #00e676; }

.player-title {
  font-weight: 800;
  font-size: 15px;
  margin-bottom: 6px;
}

.stat-row {
  font-size: 13px;
  color: #cfd8dc;
  margin-bottom: 4px;
}

.stat-row span {
  font-weight: bold;
  color: #ffeb3b;
}

.power-bar-bg {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 6px;
}

.power-bar-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #ffea00, #ff1744);
  transition: width 0.15s ease-out;
}

#scoreboard {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 10px 28px;
  text-align: center;
  color: white;
}

.score-display {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 2px;
}

.p1-color { color: #ff4081; }
.p2-color { color: #00e676; }
.score-divider { color: #888; margin: 0 8px; }

#serve-indicator {
  font-size: 12px;
  color: #ffeb3b;
  font-weight: bold;
  margin-top: 2px;
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
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 10;
  pointer-events: auto;
}

.modal.active { display: flex; }

.modal-content {
  background: rgba(20, 25, 35, 0.95);
  border: 2px solid #00e676;
  border-radius: 24px;
  padding: 36px 30px;
  text-align: center;
  color: white;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 0 35px rgba(0, 230, 118, 0.3);
}

.modal-content h1 { font-size: 26px; color: #ffeb3b; margin-bottom: 12px; }

.status-msg {
  margin: 14px 0;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  background: rgba(0, 230, 118, 0.15);
  border: 1px solid rgba(0, 230, 118, 0.4);
  color: #69f0ae;
  text-align: left;
}

.main-btn {
  background: linear-gradient(45deg, #00e676, #00b0ff);
  border: none;
  color: white;
  padding: 14px 28px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 30px;
  cursor: pointer;
  width: 100%;
  margin-top: 14px;
  box-shadow: 0 4px 15px rgba(0, 230, 118, 0.4);
}
```

- [ ] **Step 5: Create src/main.js stub**

```javascript
import './style.css';
console.log("Badminton Motion AR Initialized");
```

---

### Task 2: Camera Manager (`badminton-game/src/camera.js`)

**Files:**
- Create: `/Users/test/zenapk/badminton-game/src/camera.js`

- [ ] **Step 1: Write CameraManager for 16:9 Landscape**

```javascript
// badminton-game/src/camera.js
export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.facingMode = 'user';
  }

  async init() {
    return this.startStream();
  }

  async startStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("移动端浏览器需在 HTTPS 协议（如 https://IP:5174）或 localhost 下开启摄像头权限！");
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        facingMode: this.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: { ideal: 1.7777777778 } // 16:9 Landscape
      },
      audio: false
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = this.stream;

    return new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.video.play();
        resolve(this.video);
      };
    });
  }

  async switchCamera() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    return this.startStream();
  }
}
```

---

### Task 3: Web Audio Synthesizer Engine (`badminton-game/src/sound.js`)

**Files:**
- Create: `/Users/test/zenapk/badminton-game/src/sound.js`

- [ ] **Step 1: Write SoundEngine class**

```javascript
// badminton-game/src/sound.js
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

  // Racket air swish sound
  playSwish() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  // Shuttlecock hit pop / whack
  playHit(isSmash = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isSmash ? 'sawtooth' : 'sine';
    const startFreq = isSmash ? 400 : 260;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + (isSmash ? 0.2 : 0.08));

    gain.gain.setValueAtTime(isSmash ? 1.0 : 0.7, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (isSmash ? 0.2 : 0.08));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + (isSmash ? 0.2 : 0.08));
  }

  // Score point cheer
  playScore() {
    if (!this.ctx) return;
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.06);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.06);
      osc.stop(this.ctx.currentTime + i * 0.06 + 0.2);
    });
  }
}
```

---

### Task 4: MediaPipe Multi-Hand Tracker & Spatial Partitioning (`badminton-game/src/tracker.js`)

**Files:**
- Create: `/Users/test/zenapk/badminton-game/src/tracker.js`

- [ ] **Step 1: Write HandTracker for Dual-Player Spatial Partitioning**

```javascript
// badminton-game/src/tracker.js
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class HandTracker {
  constructor() {
    this.landmarker = null;
    this.isReady = false;
    this.lastVideoTime = -1;
  }

  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );

    try {
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 4
      });
    } catch {
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'CPU'
        },
        runningMode: 'VIDEO',
        numHands: 4
      });
    }
    this.isReady = true;
  }

  detect(videoElement) {
    if (!this.isReady || !videoElement || videoElement.readyState < 2) {
      return { p1Hand: null, p2Hand: null };
    }

    try {
      if (videoElement.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = videoElement.currentTime;
        const results = this.landmarker.detectForVideo(videoElement, performance.now());
        const landmarks = results.landmarks || [];

        let p1Hand = null;
        let p2Hand = null;

        for (const hand of landmarks) {
          // Palm center landmark #9
          const palmX = hand[9].x;
          // In mirrored mode, normalized X < 0.5 is Player 1 (Left), X >= 0.5 is Player 2 (Right)
          if (palmX > 0.5 && !p1Hand) { // Mirrored: 1 - palmX < 0.5 => palmX > 0.5
            p1Hand = hand;
          } else if (palmX <= 0.5 && !p2Hand) {
            p2Hand = hand;
          }
        }
        return { p1Hand, p2Hand };
      }
    } catch (err) {
      console.error("Tracking error:", err);
    }
    return { p1Hand: null, p2Hand: null };
  }

  transformCoords(lm, videoElement, canvasWidth, canvasHeight) {
    const vw = videoElement.videoWidth || 1280;
    const vh = videoElement.videoHeight || 720;
    const scale = Math.max(canvasWidth / vw, canvasHeight / vh);
    const rw = vw * scale;
    const rh = vh * scale;
    const ox = (canvasWidth - rw) / 2;
    const oy = (canvasHeight - rh) / 2;

    const normX = 1.0 - lm.x; // Mirrored
    return {
      x: normX * vw * scale + ox,
      y: lm.y * vh * scale + oy
    };
  }
}
```

---

### Task 5: 4D Motion Analytics Engine (`badminton-game/src/motion.js`)

**Files:**
- Create: `/Users/test/zenapk/badminton-game/src/motion.js`

- [ ] **Step 1: Write MotionAnalyzer class**

```javascript
// badminton-game/src/motion.js
export class MotionAnalyzer {
  constructor() {
    this.history = { p1: [], p2: [] };
    this.stats = {
      p1: { currentSpeed: 0, lastSwingSpeed: 0, power: 0, pos: { x: 0, y: 0 } },
      p2: { currentSpeed: 0, lastSwingSpeed: 0, power: 0, pos: { x: 0, y: 0 } }
    };
  }

  updatePlayer(playerKey, handCoords, now) {
    if (!handCoords) return;

    const playerStats = this.stats[playerKey];
    playerStats.pos = handCoords;

    const hist = this.history[playerKey];
    hist.push({ x: handCoords.x, y: handCoords.y, t: now });
    if (hist.length > 6) hist.shift();

    if (hist.length >= 2) {
      const pFirst = hist[0];
      const pLast = hist[hist.length - 1];
      const dt = (pLast.t - pFirst.t) / 1000;
      if (dt > 0) {
        const dist = Math.hypot(pLast.x - pFirst.x, pLast.y - pFirst.y);
        const speedPx = dist / dt; // px / sec
        // Scale to simulated m/s
        playerStats.currentSpeed = Math.min(25.0, (speedPx / 150)).toFixed(1);
      }
    }
  }

  registerSwingImpact(playerKey) {
    const hist = this.history[playerKey];
    if (hist.length < 2) return { swingKmH: 40, powerPct: 40 };

    let maxSpeed = 0;
    for (let i = 1; i < hist.length; i++) {
      const dt = (hist[i].t - hist[i - 1].t) / 1000;
      if (dt > 0) {
        const dist = Math.hypot(hist[i].x - hist[i - 1].x, hist[i].y - hist[i - 1].y);
        const speed = dist / dt;
        if (speed > maxSpeed) maxSpeed = speed;
      }
    }

    const swingKmH = Math.min(160, Math.round(maxSpeed / 8));
    const powerPct = Math.min(100, Math.round((swingKmH / 140) * 100));

    this.stats[playerKey].lastSwingSpeed = swingKmH;
    this.stats[playerKey].power = powerPct;

    return { swingKmH, powerPct };
  }
}
```

---

### Task 6: Shuttlecock Physics & Virtual Racket Renderer (`badminton-game/src/shuttlecock.js`, `badminton-game/src/racket.js`)

**Files:**
- Create: `/Users/test/zenapk/badminton-game/src/shuttlecock.js`
- Create: `/Users/test/zenapk/badminton-game/src/racket.js`

- [ ] **Step 1: Write Racket Renderer (`src/racket.js`)**

```javascript
// badminton-game/src/racket.js
export class RacketRenderer {
  drawRacket(ctx, pos, color, speed, label) {
    if (!pos) return;
    ctx.save();
    
    // Dynamic glow based on speed
    const speedVal = parseFloat(speed || 0);
    let glowColor = color;
    let radius = 45;
    if (speedVal > 8) {
      glowColor = '#ffea00';
      radius = 55;
    }
    if (speedVal > 15) {
      glowColor = '#ff1744';
      radius = 65;
    }

    // Outer Aura
    ctx.fillStyle = glowColor;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Racket Head Ring
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
    ctx.stroke();

    // Handle string cross
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(pos.x - 25, pos.y); ctx.lineTo(pos.x + 25, pos.y);
    ctx.moveTo(pos.x, pos.y - 25); ctx.lineTo(pos.x, pos.y + 25);
    ctx.stroke();

    // Player Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, pos.x, pos.y + 55);

    ctx.restore();
  }
}
```

- [ ] **Step 2: Write Shuttlecock Physics (`src/shuttlecock.js`)**

```javascript
// badminton-game/src/shuttlecock.js
export class Shuttlecock {
  constructor(canvasWidth, canvasHeight) {
    this.cw = canvasWidth;
    this.ch = canvasHeight;
    this.reset('p1');
  }

  reset(server = 'p1') {
    this.x = server === 'p1' ? this.cw * 0.2 : this.cw * 0.8;
    this.y = this.ch * 0.4;
    this.vx = server === 'p1' ? 6 : -6;
    this.vy = -8;
    this.gravity = 0.35;
    this.radius = 16;
    this.lastHitter = server;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;

    // Air drag
    this.vx *= 0.99;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏸', this.x, this.y);
    ctx.restore();
  }

  hit(hitterKey, powerPct) {
    this.lastHitter = hitterKey;
    const speedMult = 0.5 + (powerPct / 100) * 1.2;

    if (hitterKey === 'p1') {
      this.vx = (10 + powerPct * 0.1) * speedMult;
      this.vy = powerPct > 75 ? 12 : -12; // Spike vs High Clear
    } else {
      this.vx = -(10 + powerPct * 0.1) * speedMult;
      this.vy = powerPct > 75 ? 12 : -12;
    }
  }

  isOutOfBounds() {
    return this.y > this.ch - 30 || this.x < 0 || this.x > this.cw;
  }
}
```

---

### Task 7: Game Loop, 11-Point Rules & Main Entry Integration (`src/game.js`, `src/main.js`)

**Files:**
- Create: `/Users/test/zenapk/badminton-game/src/game.js`
- Modify: `/Users/test/zenapk/badminton-game/src/main.js`

- [ ] **Step 1: Write GameManager (`src/game.js`)**

```javascript
// badminton-game/src/game.js
import { MotionAnalyzer } from './motion.js';
import { RacketRenderer } from './racket.js';
import { Shuttlecock } from './shuttlecock.js';

export class GameManager {
  constructor(canvas, cameraMgr, tracker, sound) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cameraMgr = cameraMgr;
    this.tracker = tracker;
    this.sound = sound;

    this.analyzer = new MotionAnalyzer();
    this.racketRenderer = new RacketRenderer();
    this.shuttle = new Shuttlecock(canvas.width, canvas.height);

    this.p1Score = 0;
    this.p2Score = 0;
    this.state = 'MENU';
    this.maxSwing = 0;
    this.maxSmash = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.shuttle.cw = window.innerWidth;
    this.shuttle.ch = window.innerHeight;
  }

  startMatch() {
    this.p1Score = 0;
    this.p2Score = 0;
    this.maxSwing = 0;
    this.maxSmash = 0;
    this.state = 'PLAYING';
    this.updateHUD();
    this.shuttle.reset('p1');
    document.getElementById('menu-modal').classList.remove('active');
    document.getElementById('gameover-modal').classList.remove('active');
    this.sound.init();
  }

  updateHUD() {
    document.getElementById('p1-score').innerText = this.p1Score;
    document.getElementById('p2-score').innerText = this.p2Score;
  }

  updateAndRender() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw 2D Court Net & Center Line
    this.drawCourt();

    if (this.state !== 'PLAYING') return;

    const now = performance.now();
    const { p1Hand, p2Hand } = this.tracker.detect(this.cameraMgr.video);

    let p1Pos = null;
    let p2Pos = null;

    if (p1Hand) {
      const lm = p1Hand[9];
      p1Pos = this.tracker.transformCoords(lm, this.cameraMgr.video, this.canvas.width, this.canvas.height);
      this.analyzer.updatePlayer('p1', p1Pos, now);
    }
    if (p2Hand) {
      const lm = p2Hand[9];
      p2Pos = this.tracker.transformCoords(lm, this.cameraMgr.video, this.canvas.width, this.canvas.height);
      this.analyzer.updatePlayer('p2', p2Pos, now);
    }

    // Update Analytics UI Card
    document.getElementById('p1-speed').innerText = `${this.analyzer.stats.p1.currentSpeed} m/s`;
    document.getElementById('p1-swing').innerText = `${this.analyzer.stats.p1.lastSwingSpeed} km/h`;
    document.getElementById('p1-power-bar').style.width = `${this.analyzer.stats.p1.power}%`;

    document.getElementById('p2-speed').innerText = `${this.analyzer.stats.p2.currentSpeed} m/s`;
    document.getElementById('p2-swing').innerText = `${this.analyzer.stats.p2.lastSwingSpeed} km/h`;
    document.getElementById('p2-power-bar').style.width = `${this.analyzer.stats.p2.power}%`;

    // Render Virtual Rackets
    this.racketRenderer.drawRacket(this.ctx, p1Pos, '#ff4081', this.analyzer.stats.p1.currentSpeed, 'P1 RACKET');
    this.racketRenderer.drawRacket(this.ctx, p2Pos, '#00e676', this.analyzer.stats.p2.currentSpeed, 'P2 RACKET');

    // Update Shuttlecock Physics
    this.shuttle.update();
    this.shuttle.draw(this.ctx);

    // Collision Check: Shuttlecock vs P1/P2 Rackets
    if (p1Pos && Math.hypot(p1Pos.x - this.shuttle.x, p1Pos.y - this.shuttle.y) < 65 && this.shuttle.lastHitter !== 'p1') {
      const { swingKmH, powerPct } = this.analyzer.registerSwingImpact('p1');
      this.shuttle.hit('p1', powerPct);
      this.sound.playHit(powerPct > 75);
      if (swingKmH > this.maxSwing) this.maxSwing = swingKmH;
      if (powerPct > this.maxSmash) this.maxSmash = powerPct;
    }

    if (p2Pos && Math.hypot(p2Pos.x - this.shuttle.x, p2Pos.y - this.shuttle.y) < 65 && this.shuttle.lastHitter !== 'p2') {
      const { swingKmH, powerPct } = this.analyzer.registerSwingImpact('p2');
      this.shuttle.hit('p2', powerPct);
      this.sound.playHit(powerPct > 75);
      if (swingKmH > this.maxSwing) this.maxSwing = swingKmH;
      if (powerPct > this.maxSmash) this.maxSmash = powerPct;
    }

    // Out of bounds / Floor landing scoring
    if (this.shuttle.isOutOfBounds()) {
      if (this.shuttle.x < this.canvas.width * 0.5) {
        this.p2Score++;
        this.sound.playScore();
        this.shuttle.reset('p2');
      } else {
        this.p1Score++;
        this.sound.playScore();
        this.shuttle.reset('p1');
      }
      this.updateHUD();

      if (this.p1Score >= 11 || this.p2Score >= 11) {
        this.endMatch(this.p1Score >= 11 ? 'PLAYER 1' : 'PLAYER 2');
      }
    }
  }

  drawCourt() {
    this.ctx.save();
    // Center Net Line
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();

    // Net post icon in middle
    this.ctx.fillStyle = '#ffeb3b';
    this.ctx.font = '24px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🏸 NET', this.canvas.width / 2, this.canvas.height - 40);
    this.ctx.restore();
  }

  endMatch(winner) {
    this.state = 'GAMEOVER';
    document.getElementById('winner-title').innerText = `🏆 ${winner} 获胜！`;
    document.getElementById('max-swing-speed').innerText = `${this.maxSwing} km/h`;
    document.getElementById('max-smash-power').innerText = `${this.maxSmash}%`;
    document.getElementById('gameover-modal').classList.add('active');
  }
}
```

- [ ] **Step 2: Connect main.js entry point**

```javascript
// badminton-game/src/main.js
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
```

---

### Task 8: Verification & Build Test

- [ ] **Step 1: Install dependencies inside `badminton-game/`**
Run: `cd badminton-game && npm install`

- [ ] **Step 2: Test production build**
Run: `cd badminton-game && npm run build`
Expected: Passes with 0 errors.

- [ ] **Step 3: Commit all badminton-game files**
Run: `git add badminton-game && git commit -m "feat: complete 2-player badminton motion AR game implementation"`
