import { HandLandmarker, PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let handLandmarker = null;
let poseLandmarker = null;
let lastVideoTime = -1;
let currentResults = { hands: [], pose: null };

export async function initTracker(videoElement) {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numHands: 2
  });

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO'
  });
}

export function detectFrame(videoElement) {
  if (!handLandmarker || !poseLandmarker || videoElement.currentTime === lastVideoTime) {
    return currentResults;
  }
  lastVideoTime = videoElement.currentTime;
  const startTimeMs = performance.now();

  const handRes = handLandmarker.detectForVideo(videoElement, startTimeMs);
  const poseRes = poseLandmarker.detectForVideo(videoElement, startTimeMs);

  currentResults = {
    hands: handRes.landmarks || [],
    pose: (poseRes.landmarks && poseRes.landmarks.length > 0) ? poseRes.landmarks[0] : null
  };
  return currentResults;
}
