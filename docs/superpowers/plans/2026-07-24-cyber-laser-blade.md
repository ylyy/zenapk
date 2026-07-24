# Cyber Laser Blade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace basic hand skeleton drawing with a 炫光能量光刃 (Cyber Laser Blade) visual effect that calculates hand orientation, renders multi-layer neon plasma blades from fingertips, draws motion light ribbons, and adds palm energy cores.

**Architecture:** Update `HandTracker` in `fruit/src/tracker.js` to manage a per-hand `trailHistory` buffer and implement `drawCyberBlade()` using canvas glow effects (`shadowBlur`), cubic Bezier light ribbon rendering, and glowing core shaders. Update `GameManager` in `fruit/src/game.js` to call `drawCyberBlade()`.

**Tech Stack:** Vanilla JavaScript ES6+, HTML5 2D Canvas API, `@mediapipe/tasks-vision` HandLandmarker.

## Global Constraints

- Preserve MediaPipe coordinate transformations (`transformCoords`) for rotated mobile video feeds and mirrored front camera streams.
- Maintain high performance (60 FPS rendering target without canvas state leaks).

---

### Task 1: Add Cyber Laser Blade & Ribbon Trail Renderer in `tracker.js`

**Files:**
- Modify: `fruit/src/tracker.js:100-154`

**Interfaces:**
- Consumes: Hand landmarks from `detectHands()`, video dimensions, and canvas context.
- Produces: `drawCyberBlade(ctx, landmarks, videoElement, canvasWidth, canvasHeight, isMirrored)` method on `HandTracker`.

- [ ] **Step 1: Inspect and update `tracker.js` constructor & trail state**

Add `this.trailHistories = [];` in constructor to track blade tips across frames.

- [ ] **Step 2: Implement `drawCyberBlade` in `tracker.js`**

Implement hand angle calculation ($\theta = \arctan2(y_8 - y_0, x_8 - x_0)$), blade tip position ($x_8 + 120 \cdot \cos\theta, y_8 + 120 \cdot \sin\theta$), multi-layer neon laser blade rendering, palm energy core, and ribbon motion trail.

```javascript
  drawCyberBlade(ctx, landmarks, videoElement, canvasWidth, canvasHeight, isMirrored = true) {
    if (!landmarks || landmarks.length === 0) {
      this.trailHistories = [];
      return;
    }

    ctx.save();

    landmarks.forEach((hand, handIdx) => {
      if (!this.trailHistories[handIdx]) {
        this.trailHistories[handIdx] = [];
      }
      const history = this.trailHistories[handIdx];

      const pWrist = this.transformCoords(hand[0], videoElement, canvasWidth, canvasHeight, isMirrored);
      const pIndexTip = this.transformCoords(hand[8], videoElement, canvasWidth, canvasHeight, isMirrored);
      const pPalm = this.transformCoords(hand[9], videoElement, canvasWidth, canvasHeight, isMirrored);
      const pMiddleTip = this.transformCoords(hand[12], videoElement, canvasWidth, canvasHeight, isMirrored);

      const dx = pIndexTip.x - pWrist.x;
      const dy = pIndexTip.y - pWrist.y;
      const angle = Math.atan2(dy, dx);

      const bladeLength = 110;
      const bladeTipX = pIndexTip.x + Math.cos(angle) * bladeLength;
      const bladeTipY = pIndexTip.y + Math.sin(angle) * bladeLength;

      // Update Trail History
      history.push({ x: bladeTipX, y: bladeTipY, indexX: pIndexTip.x, indexY: pIndexTip.y });
      if (history.length > 12) history.shift();

      // 1. Draw Motion Ribbon Trail
      if (history.length > 1) {
        ctx.save();
        for (let i = 1; i < history.length; i++) {
          const ratio = i / history.length;
          const prev = history[i - 1];
          const curr = history[i];

          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(curr.x, curr.y);
          ctx.strokeStyle = `rgba(0, 243, 255, ${ratio * 0.75})`;
          ctx.lineWidth = 14 * ratio;
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 15;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(prev.indexX, prev.indexY);
          ctx.lineTo(curr.indexX, curr.indexY);
          ctx.strokeStyle = `rgba(213, 0, 249, ${ratio * 0.5})`;
          ctx.lineWidth = 8 * ratio;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Draw Palm Energy Core
      ctx.save();
      ctx.beginPath();
      ctx.arc(pPalm.x, pPalm.y, 35, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pPalm.x, pPalm.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      // 3. Draw Cyber Laser Blade (From Index Tip to Blade Tip)
      ctx.save();
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 20;

      // Outer Neon Glow Line
      ctx.beginPath();
      ctx.moveTo(pIndexTip.x, pIndexTip.y);
      ctx.lineTo(bladeTipX, bladeTipY);
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner White Plasma Core
      ctx.beginPath();
      ctx.moveTo(pIndexTip.x, pIndexTip.y);
      ctx.lineTo(bladeTipX, bladeTipY);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Blade Tip Flare
      ctx.beginPath();
      ctx.arc(bladeTipX, bladeTipY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#d500f9';
      ctx.shadowBlur = 25;
      ctx.fill();

      // Fingertip Energy Nodes
      const tips = [4, 8, 12, 16, 20];
      for (const tipIdx of tips) {
        const pt = this.transformCoords(hand[tipIdx], videoElement, canvasWidth, canvasHeight, isMirrored);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#00f3ff';
        ctx.fill();
      }

      ctx.restore();
    });

    ctx.restore();
  }
```

- [ ] **Step 3: Test file changes for syntax correctness**

Verify syntax by loading or compiling `tracker.js`.

- [ ] **Step 4: Commit changes**

```bash
git add fruit/src/tracker.js
git commit -m "feat(fruit): add drawCyberBlade visual effect and motion trail to tracker"
```

---

### Task 2: Integrate `drawCyberBlade` in `game.js` Loop

**Files:**
- Modify: `fruit/src/game.js:179-186`

- [ ] **Step 1: Replace `drawSkeleton` call with `drawCyberBlade` in `game.js`**

Change `this.handTracker.drawSkeleton(...)` to `this.handTracker.drawCyberBlade(...)` in `updateAndRender()`.

- [ ] **Step 2: Commit changes**

```bash
git add fruit/src/game.js
git commit -m "feat(fruit): integrate Cyber Laser Blade renderer in game loop"
```
