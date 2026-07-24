# Design Spec: 2-Player Landscape Badminton Motion AR Game (双人羽毛球动作对战)

## 1. Overview
A 2-player motion-controlled AR badminton game designed for landscape (16:9) TV screen projection. Using a single camera (laptop/phone in landscape mode), the game tracks two players standing side-by-side (Left = Player 1, Right = Player 2). Players swing their hands in real-time to control virtual rackets, hit the shuttlecock back and forth, and view live 4D motion analytics (hand speed, hand position, swing velocity at impact, and counter-strike force).

## 2. Target Environment & Folder
- **Target Folder**: `/Users/test/zenapk/badminton-game`
- **Display Aspect Ratio**: 16:9 Landscape (TV fullscreen projection compatible).
- **Camera Setup**: Single camera capturing both players side-by-side.

## 3. Technology Stack
- **Build Tool**: Vite (Vanilla ES Modules + Canvas 2D + Custom CSS)
- **Computer Vision**: Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) - Hand Landmarker & Pose Landmarker WASM/GPU detection for multi-hand/body tracking.
- **Physics & Motion Analysis Engine**:
  - Real-time hand velocity $v_{\text{hand}} = \sqrt{\Delta x^2 + \Delta y^2} / \Delta t$
  - Impact frame peak velocity detection
  - Shuttlecock parabolic flight physics (gravity, air drag, net collision)
- **Audio Engine**: Web Audio API (Synthesized racket swish, hit whack, smash explosion, cheer, out-of-bounds whistle).

## 4. System Architecture & Components

```
+-------------------------------------------------------------------------+
|                         HUD & Analytics Overlay                         |
| P1 Stat Dashboard  | Scoreboard (11 Pts) | Timer | P2 Stat Dashboard   |
+-------------------------------------------------------------------------+
|                         2D Canvas Render Engine                         |
| 2D Court Net | Shuttlecock Parabola | P1/P2 Rackets | Speed Trails     |
+-------------------------------------------------------------------------+
|                       4D Hand Analytics Engine                          |
| P1/P2 Position Tracking | Velocity Calculation | Counter Power Metric   |
+-------------------------------------------------------------------------+
|                       MediaPipe Multi-Hand AI                           |
| Landscape 16:9 Feed | Left Half (x<0.5) P1 | Right Half (x>=0.5) P2  |
+-------------------------------------------------------------------------+
```

### Components Breakout
1. **CameraManager**: Manages landscape 16:9 video stream (`1280x720` or `1920x1080`).
2. **PoseTracker**: Multi-hand MediaPipe detector. Splits detections by screen mid-line ($x < 0.5$ for Player 1, $x \ge 0.5$ for Player 2).
3. **MotionAnalyzer**: Computes real-time hand speed, smooth coordinates, swing impact velocity, and counter force $F_{\text{power}} \in [0, 100]$.
4. **ShuttlecockPhysics**: Simulates shuttlecock 2D parabolic arc, gravity acceleration, net height check (bounce/fault), court bounds, and hit impulse.
5. **RacketRenderer**: Draws virtual badminton rackets anchored to each player's hand with speed-based glowing color trails (Green -> Yellow -> Flame Red) and hit impact ripples.
6. **SoundEngine**: Synthesizes racket swish, shuttlecock pop, smash sound, score ding, and match win audio via Web Audio API.
7. **GameManager**: Manages match rules (11-point badminton rules, service turn, out-of-bounds fault, match point) and UI modal states.

## 5. Motion Analysis Metrics
1. **Hand Position**: Normalized $(x, y)$ mapped to screen coordinates with `object-fit: cover` ratio compensation.
2. **Hand Speed**: Calculated over 5-frame rolling window:
   $$v = \frac{\sqrt{(x_t - x_{t-1})^2 + (y_t - y_{t-1})^2}}{\Delta t} \times \text{scale\_factor}$$
3. **Swing Velocity at Impact**: Peak velocity registered within 100ms before shuttlecock contact.
4. **Counter-Strike Force**:
   $$\text{Force} = \min\left(100, \frac{v_{\text{swing}}}{v_{\text{max}}} \times 100\right)$$
   - Force $< 35$: Short drop shot / net play
   - Force $35 - 75$: Clear / drive shot
   - Force $> 75$: Flame Smash 🔥 (high-speed downward spike with particle explosion)

## 6. Self-Review Checklist
- No placeholders or vague TODOs.
- Clear folder isolation under `badminton-game/`.
- Full alignment with user's landscape 2-player motion tracking requirements.

## 7. Verification Plan
- Build check: `npm run build` inside `badminton-game/` directory.
- Runtime check: Multi-hand detection on 16:9 canvas, real-time speed calculation, racket rendering, shuttlecock hit physics, and sound synthesis.
