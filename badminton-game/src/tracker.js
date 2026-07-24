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

  transformCoords(lm, videoElement, canvasWidth, canvasHeight) {
    let vw = videoElement.videoWidth || 1280;
    let vh = videoElement.videoHeight || 720;

    const isCanvasPortrait = canvasHeight > canvasWidth;
    const isVideoPortrait = vh > vw;

    if (isCanvasPortrait !== isVideoPortrait && vw > 0 && vh > 0) {
      const temp = vw;
      vw = vh;
      vh = temp;
    }

    const scale = Math.max(canvasWidth / vw, canvasHeight / vh);
    const rw = vw * scale;
    const rh = vh * scale;
    const ox = (canvasWidth - rw) / 2;
    const oy = (canvasHeight - rh) / 2;

    const normX = 1.0 - lm.x;
    return {
      x: normX * vw * scale + ox,
      y: lm.y * vh * scale + oy
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
