import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class HandTracker {
  constructor() {
    this.landmarker = null;
    this.isReady = false;
    this.lastVideoTime = -1;
    this.trailHistories = [];
  }

  async init() {
    try {
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

  // Rotation-aware coordinate transformation for portrait and landscape mobile viewports
  transformCoords(lm, videoElement, canvasWidth, canvasHeight, isMirrored = true) {
    const vW = videoElement ? videoElement.videoWidth : 0;
    const vH = videoElement ? videoElement.videoHeight : 0;

    const isCanvasPortrait = canvasHeight > canvasWidth;
    const isVideoPortrait = vH > vW;

    if (vW > 0 && vH > 0 && isCanvasPortrait !== isVideoPortrait) {
      // Rotated mobile camera buffer (e.g. Portrait phone held vertically with 1280x720 camera stream)
      // Long axis (lm.x) maps to canvasHeight, short axis (lm.y) maps to canvasWidth
      const normX = isMirrored ? (1.0 - lm.y) : lm.y;
      const screenX = normX * canvasWidth;
      const screenY = lm.x * canvasHeight;
      return { x: screenX, y: screenY };
    }

    // Matching orientation (Landscape mode or matching video stream)
    const normX = isMirrored ? (1.0 - lm.x) : lm.x;
    const screenX = normX * canvasWidth;
    const screenY = lm.y * canvasHeight;
    return { x: screenX, y: screenY };
  }

  getHandPoints(landmarks, videoElement, canvasWidth, canvasHeight, isMirrored = true) {
    const points = [];
    const hitIndices = [0, 4, 8, 9, 12, 16, 20];

    for (const hand of landmarks) {
      for (const idx of hitIndices) {
        const lm = hand[idx];
        const pt = this.transformCoords(lm, videoElement, canvasWidth, canvasHeight, isMirrored);
        const radius = (idx === 9 || idx === 0) ? 60 : 35;
        points.push({ x: pt.x, y: pt.y, radius });
      }

      // Add extended blade tip collision points
      const pWrist = this.transformCoords(hand[0], videoElement, canvasWidth, canvasHeight, isMirrored);
      const pIndexTip = this.transformCoords(hand[8], videoElement, canvasWidth, canvasHeight, isMirrored);
      const dx = pIndexTip.x - pWrist.x;
      const dy = pIndexTip.y - pWrist.y;
      const angle = Math.atan2(dy, dx);
      const bladeLength = 110;
      const bladeTipX = pIndexTip.x + Math.cos(angle) * bladeLength;
      const bladeTipY = pIndexTip.y + Math.sin(angle) * bladeLength;
      points.push({ x: bladeTipX, y: bladeTipY, radius: 45 });
      points.push({ x: pIndexTip.x + Math.cos(angle) * 55, y: pIndexTip.y + Math.sin(angle) * 55, radius: 40 });
    }
    return points;
  }

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
}
