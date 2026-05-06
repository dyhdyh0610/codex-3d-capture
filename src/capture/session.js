import { SAMPLE_INTERVAL_MS } from "./sampling.js";
import { HAND_LANDMARK_NAMES, POSE_UPPER_BODY_POINTS } from "./landmarks.js";

export function createSessionId(date = new Date()) {
  const pad = (value, length = 2) => String(value).padStart(length, "0");
  return [
    "cap",
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
    pad(date.getMilliseconds(), 3)
  ].join("_");
}

export function createCaptureSession({
  sessionId,
  startedAt,
  endedAt,
  videoWidth,
  videoHeight,
  samples,
  userAgent = "",
  modelInfo = {}
}) {
  return {
    schemaVersion: "upper-body-motion-capture/v1",
    sessionId,
    startedAt,
    endedAt,
    durationMs: Math.max(0, Date.parse(endedAt) - Date.parse(startedAt)),
    sampleIntervalMs: SAMPLE_INTERVAL_MS,
    coordinateSystem: {
      poseWorld: "x/y/z in meters from MediaPipe PoseLandmarker world landmarks.",
      handWorld: "x/y/z in meters from MediaPipe HandLandmarker world landmarks; hand landmarks are local to each detected hand.",
      normalizedFallback: "x/y normalized to the video frame, z relative to the model crop, used only when world landmarks are unavailable."
    },
    trackedNodes: createTrackedNodeList(),
    metadata: {
      videoWidth,
      videoHeight,
      userAgent,
      modelInfo
    },
    samples
  };
}

function createTrackedNodeList() {
  const poseNodes = POSE_UPPER_BODY_POINTS.map((point) => ({
    id: point.id,
    kind: "pose",
    label: point.label,
    side: point.side,
    joint: point.joint
  }));

  const handNodes = ["left", "right"].flatMap((side) =>
    HAND_LANDMARK_NAMES.map((point) => ({
      id: `hand.${side}.${point.id}`,
      kind: "hand",
      label: `${side} ${point.label}`,
      side,
      joint: point.id
    }))
  );

  return [...poseNodes, ...handNodes];
}
