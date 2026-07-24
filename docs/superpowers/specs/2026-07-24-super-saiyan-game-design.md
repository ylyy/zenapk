# Super Saiyan AR Gesture Transformation & Kamehameha Game Design Spec

## Overview
An interactive AR web game where players perform sequential hand & body gestures in front of the camera to transform into a Super Saiyan and release a Kamehameha wave blast. The application features real-time hand/pose tracking using MediaPipe, a sequence gesture state machine, particle visual effects (golden hair aura, body aura, lightning sparks, energy beam blast), dynamic audio feedback, and power-level gauges.

## Design Goals & User Journey
1. **Interactive Guidance**: Clear 3D/2D visual prompts showing the required sequential gestures.
2. **Phase 1: Super Saiyan Transformation (超级赛亚人变身)**
   - Step 1: Hands crossed at chest (聚气 - Energy Gathering)
   - Step 2: Fists pulled down to hips (蓄力 - Energy Storing)
   - Step 3: Arms raised high overhead (爆气 - Power Explosion)
   - *Reward Effect*: Flame Hair Aura around head, golden body aura particles, lightning sparks, screen shaking, golden flash, and Power Level gauge soaring over 9,000,000!
3. **Phase 2: Kamehameha Wave Blast (龟派气功发波)**
   - Step 1: Hands together at hip (腰侧聚能 - Energy Ball Charging between hands)
   - Step 2: Push palms forward to screen (双手前推 - Energy Beam Release)
   - *Reward Effect*: Massive Kamehameha beam blast firing forward with lens flare, screen distortion, impact destruction text ("KAMEHAMEHA IMPACT!"), and explosion sounds.
4. **Photo / Victory Stage**: Free pose mode with Super Saiyan visual effects persistent on camera and screenshot capture functionality.

## System Architecture

```
saiyan/
├── index.html                  # Game HTML layout & canvas overlay
├── package.json                # Project dependencies and Vite setup
├── vite.config.js              # Vite configuration (HTTPS / basicSSL if needed)
└── src/
    ├── main.js                 # App entry point & state management
    ├── tracker.js              # MediaPipe Gesture / Landmark Tracking Engine
    ├── gestureEngine.js        # Sequential Gesture Recognition State Machine
    ├── audio.js                # Web Audio API sound & synth FX generator
    ├── effects/
    │   ├── auraEffect.js       # Super Saiyan Hair, Body Aura & Lightning Particles
    │   ├── kamehameha.js       # Energy sphere charging & beam blast particles
    │   └── uiOverlay.js        # Prompt cards, Power Level Counter & screen shake
    └── style.css               # Styling and glassmorphism UI theme
```

## Gesture Sequence State Machine
The `gestureEngine.js` tracks raw landmark points from MediaPipe Hand & Pose detectors:
- **Phase 1 (Transformation)**:
  - `IDLE` -> `STEP1_CHEST_CROSS`: Left and right wrists/hands cross near chest center.
  - `STEP1_CHEST_CROSS` -> `STEP2_HIPS_FISTS`: Hands moved down to waist left/right sides.
  - `STEP2_HIPS_FISTS` -> `STEP3_TRANSFORMED`: Hands raised above eye level with arms opened.
- **Phase 2 (Kamehameha Blast)**:
  - `TRANSFORMED` -> `KAME_CHARGE`: Hands together near hip side (distance between hands < threshold).
  - `KAME_CHARGE` -> `KAME_BLAST`: Hands pushed forward towards camera with palms facing screen (palm area increases & moves forward).

## Visual Effects & Audio Design
- **Hair & Body Aura**: Drawn onto canvas anchored to head landmark (nose/forehead) and shoulder landmarks.
- **Power Level Gauge**: Animated numbers counting rapidly from 5,000 up to 9,000,000+.
- **Audio Synthesizer**: Uses Web Audio API oscillator nodes & buffer noise for sci-fi charging hums, explosive thunders, and beam blasts (no external asset loading failures).

## Hub Integration & CI/CD
- Root `package.json` updated with `"dev:saiyan"` and `"build:saiyan"`.
- Root `index.html` updated with a card for "超级赛亚人 AR 变身与发波".
- CI/CD build scripts include `saiyan` module.

## Verification Plan
1. Test gesture recognition with webcam / mock video input.
2. Verify visual particle rendering performance at 60 FPS.
3. Test progression flow: Step 1 -> Step 2 -> Step 3 -> Transformation -> Kamehameha Charge -> Kamehameha Blast -> Photo Capture.
