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
