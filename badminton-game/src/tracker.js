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
