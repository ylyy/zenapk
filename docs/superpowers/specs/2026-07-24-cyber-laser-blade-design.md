# Design Spec: Cyber Laser Blade Visual Effect (炫光能量光刃特效)

## 1. Overview
Upgrade the fruit slicing hand interaction visual effect in the Fruit Slap AR game from basic neon dots and lines to an immersive **Cyber Laser Blade (炫光能量光刃)** effect. The feature calculates hand direction vectors, anchors a glowing plasma energy blade extending from fingertips, renders dynamic multi-layer neon glow, and draws motion ribbon trails with energy spark particles as hands swing across the screen.

## 2. Visual & Architectural Design

### 2.1 Hand Vector & Blade Anchor
- **Base Landmarks**: Wrist (Landmark 0) and Index Finger Tip (Landmark 8) / Palm Center (Landmark 9).
- **Orientation Angle**: $\theta = \arctan2(y_8 - y_0, x_8 - x_0)$
- **Blade Extension**: 
  - Origin: Index Finger Tip ($x_8, y_8$).
  - Tip: Extended $100\text{px} - 140\text{px}$ along direction $\theta$.
  - Secondary Anchors: Subtle energy blade edges extending towards middle finger tip (Landmark 12).

### 2.2 Core Rendering Elements
1. **Multi-layer Laser Blade Core (炫彩能量刀刃)**
   - **Inner Core**: High intensity pure white (`#FFFFFF`) with $6\text{px}$ line width.
   - **Outer Glow**: Dual-tone gradient transitioning from Cyan (`#00F3FF`) to Neon Magenta (`#D500F9`).
   - **Canvas Glow Filter**: Set `ctx.shadowBlur = 18` with `ctx.shadowColor = '#00f3ff'` for dynamic plasma ambient glow.

2. **Motion Ribbon Trail (挥砍光轨尾迹)**
   - Maintain a rolling buffer `trailHistory` of the last 12 frames of blade tip coordinates ($x_{\text{blade}}, y_{\text{blade}}$).
   - Render a smooth tapered light ribbon using cubic Bezier splines.
   - Dynamic Alpha & Width: Tail fades out smoothly ($\alpha: 1.0 \to 0.0$), ribbon width scales with hand movement speed.

3. **Palm Energy Core (手掌能量星核)**
   - Replace the legacy static pink circle with a pulsating tech energy ring around Palm Center (Landmark 9).
   - Outer rotating dashed aura ring with a glowing core point.

4. **Energy Sparkles & Particles (离子火花特效)**
   - Emit miniature energy spark particles along the blade edge during rapid hand gestures.

## 3. Code Modifications

- **`fruit/src/tracker.js`**:
  - Add `this.trailHistory = []` per hand.
  - Implement `drawCyberBlade(ctx, landmarks, videoElement, canvasWidth, canvasHeight, isMirrored)` method to replace basic skeleton drawing.
  - Compute rotation vectors, render hand energy core, blade tip, laser body, and glowing light ribbons.

- **`fruit/src/game.js`**:
  - Update `updateAndRender()` to pass timestamp and frame info to `drawCyberBlade()`.
  - Ensure collision detection points remain tightly aligned with the laser blade coverage area.

## 4. Verification Plan
- Launch Vite dev server for `fruit/`.
- Test hand tracking and camera mirror logic on mobile browser / desktop web.
- Verify blade orientation rotates seamlessly as hand pivots 360 degrees.
- Verify light ribbon trails fade naturally with hand velocity.
- Check collision responsiveness on falling fruits when sliced with the energy blade.
