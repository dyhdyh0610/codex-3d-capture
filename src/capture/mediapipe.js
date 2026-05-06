import { FilesetResolver, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";

const VISION_WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";

export async function createMotionDetectors() {
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM_ROOT);

  const [poseLandmarker, handLandmarker] = await Promise.all([
    PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: POSE_MODEL,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    }),
    HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: HAND_MODEL,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
  ]);

  return {
    poseLandmarker,
    handLandmarker,
    modelInfo: {
      poseModel: POSE_MODEL,
      handModel: HAND_MODEL,
      wasmRoot: VISION_WASM_ROOT
    },
    close() {
      poseLandmarker.close();
      handLandmarker.close();
    }
  };
}
