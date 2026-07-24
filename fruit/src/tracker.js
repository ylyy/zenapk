import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class HandTracker {
  constructor() {
    this.landmarker = null;
    this.isReady = false;
    this.lastVideoTime = -1;
  }

  async init() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      // Try GPU delegate first, fallback to CPU if GPU delegate fails
      try {
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2
        });
      } catch (gpuErr) {
        console.warn("GPU delegate failed, falling back to CPU:", gpuErr);
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 2
        });
      }

      this.isReady = true;
      console.log("MediaPipe HandLandmarker Ready");
    } catch (err) {
      console.error("HandLandmarker Init Error:", err);
      throw err;
    }
  }

  detectHands(videoElement, timestamp) {
    if (!this.isReady || !videoElement || videoElement.readyState < 2) {
      return [];
    }

    try {
      if (videoElement.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = videoElement.currentTime;
        const results = this.landmarker.detectForVideo(videoElement, performance.now());
        return results.landmarks || [];
      }
    } catch (err) {
      console.error("Hand detection error:", err);
    }
    return [];
  }

  // Direct normalized coordinate mapping to canvas view (100% aligned with user's real hand)
  transformCoords(lm, videoElement, canvasWidth, canvasHeight, isMirrored = true) {
    let normX = lm.x;
    if (isMirrored) {
      normX = 1.0 - normX;
    }

    return {
      x: normX * canvasWidth,
      y: lm.y * canvasHeight
    };
  }

  // Get collision points for hands
  getHandPoints(landmarks, videoElement, canvasWidth, canvasHeight, isMirrored = true) {
    const points = [];
    const hitIndices = [0, 4, 8, 9, 12, 16, 20]; // Wrist, Thumb, Index, Palm, Middle, Ring, Pinky

    for (const hand of landmarks) {
      for (const idx of hitIndices) {
        const lm = hand[idx];
        const pt = this.transformCoords(lm, videoElement, canvasWidth, canvasHeight, isMirrored);
        const radius = (idx === 9 || idx === 0) ? 60 : 35;
        points.push({ x: pt.x, y: pt.y, radius });
      }
    }
    return points;
  }

  // Render high-visibility glowing hand skeleton and palm slap aura
  drawSkeleton(ctx, landmarks, videoElement, canvasWidth, canvasHeight, isMirrored = true) {
    if (!landmarks || landmarks.length === 0) return;

    ctx.save();

    // Hand connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [0, 17]                               // Palm base
    ];

    for (const hand of landmarks) {
      // 1. Draw skeleton bone lines
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.85)';
      ctx.lineWidth = 4;
      for (const [i, j] of connections) {
        const p1 = this.transformCoords(hand[i], videoElement, canvasWidth, canvasHeight, isMirrored);
        const p2 = this.transformCoords(hand[j], videoElement, canvasWidth, canvasHeight, isMirrored);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // 2. Draw glowing palm slap circle
      const palm = this.transformCoords(hand[9], videoElement, canvasWidth, canvasHeight, isMirrored);
      ctx.fillStyle = 'rgba(255, 64, 129, 0.4)';
      ctx.strokeStyle = '#ff4081';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(palm.x, palm.y, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Palm center core dot
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(palm.x, palm.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw finger tip hit circles
      const fingerTips = [4, 8, 12, 16, 20];
      ctx.fillStyle = '#00e676';
      for (const tipIdx of fingerTips) {
        const pt = this.transformCoords(hand[tipIdx], videoElement, canvasWidth, canvasHeight, isMirrored);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
