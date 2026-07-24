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

  // Direct normalized coordinate mapping to canvas view (100% aligned with user's real hand)
  transformCoords(lm, videoElement, canvasWidth, canvasHeight) {
    const normX = 1.0 - lm.x; // Mirrored for natural user reflection
    return {
      x: normX * canvasWidth,
      y: lm.y * canvasHeight
    };
  }

  detect(videoElement, canvasWidth, canvasHeight) {
    if (!this.isReady || !videoElement || videoElement.readyState < 2) {
      return { p1Hand: null, p2Hand: null, p1Pos: null, p2Pos: null };
    }

    try {
      if (videoElement.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = videoElement.currentTime;
        const results = this.landmarker.detectForVideo(videoElement, performance.now());
        const landmarks = results.landmarks || [];

        let p1Hand = null;
        let p2Hand = null;
        let p1Pos = null;
        let p2Pos = null;

        for (const hand of landmarks) {
          const pos = this.transformCoords(hand[9], videoElement, canvasWidth, canvasHeight);
          // Evaluate screen X position: Screen Left (< 0.5 cw) -> P1, Screen Right (>= 0.5 cw) -> P2
          if (pos.x < canvasWidth * 0.5 && !p1Hand) {
            p1Hand = hand;
            p1Pos = pos;
          } else if (pos.x >= canvasWidth * 0.5 && !p2Hand) {
            p2Hand = hand;
            p2Pos = pos;
          }
        }
        return { p1Hand, p2Hand, p1Pos, p2Pos };
      }
    } catch (err) {
      console.error("Tracking error:", err);
    }
    return { p1Hand: null, p2Hand: null, p1Pos: null, p2Pos: null };
  }
}
