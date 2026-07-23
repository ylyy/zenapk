# Design Spec: Fruit Slap Web Game (手势拍水果)

## 1. Overview
A web-based interactive AR game where players use hand gestures (captured via phone camera) to slap falling fruits on screen. Designed to run smoothly on modern mobile browsers (specifically Android Chrome) and mirror seamlessly to an Android TV screen without complex hardware setups.

## 2. Target Hardware & Environment
- **Development & Testing**: macOS with Vite local dev server (`http://<mac-ip>:5173`) + Android Phone on local Wi-Fi.
- **Display Target**: Phone screen mirrored to Android TV via built-in system Wireless Display / Cast (Miracast / AirPlay / Chromecast).
- **Camera Input**: Phone Front or Rear camera. Front camera is mirrored horizontally by default for intuitive left/right interaction.

## 3. Technology Stack
- **Build Tool**: Vite (Vanilla JavaScript + CSS3 + HTML5 Canvas)
- **Computer Vision / AI**: Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) - Hand Landmarker module running via WebAssembly (WASM) & GPU.
- **Rendering Engine**: Dual-layer system:
  1. `<video>` background layer displaying live camera feed.
  2. `<canvas>` foreground layer rendered at 60 FPS for hand skeletons, falling fruits, particle explosions, floating scores, and HUD.
- **Audio Engine**: Web Audio API (Synthesized SFX for slap hits, splat sounds, combo rewards, and bombs, requiring 0 external asset downloads).

## 4. Architecture & Components

```
+-------------------------------------------------------------+
|                      User Interface (HUD)                   |
| Score | Combo Multiplier | Timer/Mode | Camera Switch | FS  |
+-------------------------------------------------------------+
|                      HTML5 Canvas Layer                     |
| Hand Skeleton Overlay | Falling Fruits | Splash Particles   |
+-------------------------------------------------------------+
|                   MediaPipe AI Engine                       |
| Hand Landmark Detection (21 points per hand, GPU WASM)      |
+-------------------------------------------------------------+
|                      Camera Video Feed                      |
| Mobile Front / Rear Camera Feed (Mirrored Front Camera)     |
+-------------------------------------------------------------+
```

### Components Breakout
1. **CameraManager**: Manages `getUserMedia` constraints, stream resolution (e.g. 720p/1080p), facing mode (`user` or `environment`), and video element binding.
2. **HandTracker**: Initializes `@mediapipe/tasks-vision` HandLandmarker, processes video frames continuously, returns left and right hand keypoints (21 3D landmarks per hand).
3. **FruitEngine**: Spawns fruits (watermelon, apple, orange, banana, strawberry, bomb) with random initial X position, downward velocity, gravity acceleration, and rotational torque.
4. **CollisionDetector**: Calculates distance between hand keypoints (palm center index #9, finger tips #4, #8, #12, #16, #20) and fruit bounding circles. Triggers hit events when distance < threshold.
5. **ParticleSystem**: Generates juice splats, sliced fruit halves, floating `+10` text, and impact shockwaves upon collision.
6. **SoundEngine**: Uses Web Audio API synthesizers to produce punch/slap sounds, wet splash sounds, combo level-up chords, and bomb explosions.
7. **GameLoop & UI Manager**: Controls state transitions (`MENU` -> `PLAYING` -> `GAMEOVER`), countdown timers, combo multipliers, high score persistence in `localStorage`, and fullscreen toggles.

## 5. Game Mechanics & Rules
- **Game Modes**:
  1. **Classic Mode**: 60-second countdown. Goal is maximum score.
  2. **Endless Mode**: Play continuously until 3 bombs are accidentally hit.
- **Fruits & Scores**:
  - 🍎 Apple: +10 pts
  - 🍊 Orange: +10 pts
  - 🍉 Watermelon: +20 pts (larger size)
  - 🍓 Strawberry: +15 pts (smaller, faster)
  - 🍌 Banana: +15 pts
  - 💣 Bomb: -30 pts & breaks current Combo chain (or loses a life in Endless Mode).
- **Combo System**: Hitting fruits within 1.0 second of each other increments the Combo count (`x2`, `x3`, etc.), multiplying points earned.
- **Slap Interaction**:
  - Hand landmarks drawn with glowing neon hand skeletal lines.
  - When palm or finger tips intersect a fruit, a visual "Impact Burst" radiates from the hit point.
  - Fruit splits into two halves falling with physics velocity + juice particles splatter.

## 6. Self-Review Checklist
1. **Placeholder Scan**: Verified no TBD or TODO left in spec.
2. **Consistency Check**: Camera mirror mode matches TV projection expectations.
3. **Scope Check**: Clear web app boundary, runnable entirely on Vite dev server.

## 7. Verification Plan
- **Build Verification**: `npm run build` succeeds without syntax or bundle errors.
- **Runtime Verification**: Test in desktop/mobile browser to confirm camera access, 30+ FPS hand tracking, collision detection, and audio synthesis.
