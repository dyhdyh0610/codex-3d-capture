export const POSE_UPPER_BODY_POINTS = [
  { id: "pose.left_shoulder", label: "Left Shoulder", index: 11, side: "left", joint: "shoulder" },
  { id: "pose.right_shoulder", label: "Right Shoulder", index: 12, side: "right", joint: "shoulder" },
  { id: "pose.left_elbow", label: "Left Elbow", index: 13, side: "left", joint: "elbow" },
  { id: "pose.right_elbow", label: "Right Elbow", index: 14, side: "right", joint: "elbow" },
  { id: "pose.left_wrist", label: "Left Wrist", index: 15, side: "left", joint: "wrist" },
  { id: "pose.right_wrist", label: "Right Wrist", index: 16, side: "right", joint: "wrist" }
];

export const HAND_LANDMARK_NAMES = [
  { id: "wrist", label: "Wrist" },
  { id: "thumb_cmc", label: "Thumb CMC" },
  { id: "thumb_mcp", label: "Thumb MCP" },
  { id: "thumb_ip", label: "Thumb IP" },
  { id: "thumb_tip", label: "Thumb Tip" },
  { id: "index_mcp", label: "Index MCP" },
  { id: "index_pip", label: "Index PIP" },
  { id: "index_dip", label: "Index DIP" },
  { id: "index_tip", label: "Index Tip" },
  { id: "middle_mcp", label: "Middle MCP" },
  { id: "middle_pip", label: "Middle PIP" },
  { id: "middle_dip", label: "Middle DIP" },
  { id: "middle_tip", label: "Middle Tip" },
  { id: "ring_mcp", label: "Ring MCP" },
  { id: "ring_pip", label: "Ring PIP" },
  { id: "ring_dip", label: "Ring DIP" },
  { id: "ring_tip", label: "Ring Tip" },
  { id: "pinky_mcp", label: "Pinky MCP" },
  { id: "pinky_pip", label: "Pinky PIP" },
  { id: "pinky_dip", label: "Pinky DIP" },
  { id: "pinky_tip", label: "Pinky Tip" }
];

const HAND_FALLBACK_SIDES = ["left", "right"];

export function extractTrackedNodes({
  poseLandmarks = [],
  poseWorldLandmarks = [],
  handLandmarks = [],
  handWorldLandmarks = [],
  handedness = []
}) {
  const nodes = {};
  const poseFrame = poseLandmarks[0] ?? [];
  const poseWorldFrame = poseWorldLandmarks[0] ?? [];

  for (const point of POSE_UPPER_BODY_POINTS) {
    const landmark = poseWorldFrame[point.index] ?? poseFrame[point.index];
    if (!landmark) {
      continue;
    }

    const source = poseWorldFrame[point.index] ? "poseWorld" : "poseNormalized";
    nodes[point.id] = createNode(landmark, source, {
      kind: "pose",
      label: point.label,
      side: point.side,
      joint: point.joint,
      index: point.index
    });
  }

  handLandmarks.forEach((hand, handIndex) => {
    const handWorld = handWorldLandmarks[handIndex] ?? [];
    const handInfo = handedness[handIndex]?.[0] ?? {};
    const side = normalizeHandSide(handInfo.categoryName, handIndex);
    const handednessScore = typeof handInfo.score === "number" ? handInfo.score : null;

    HAND_LANDMARK_NAMES.forEach((point, pointIndex) => {
      const landmark = handWorld[pointIndex] ?? hand[pointIndex];
      if (!landmark) {
        return;
      }

      const source = handWorld[pointIndex] ? "handWorld" : "handNormalized";
      const id = `hand.${side}.${point.id}`;
      nodes[id] = createNode(landmark, source, {
        kind: "hand",
        label: `${titleCase(side)} ${point.label}`,
        side,
        joint: point.id,
        index: pointIndex,
        handednessScore
      });
    });
  });

  return nodes;
}

function normalizeHandSide(categoryName, handIndex) {
  if (typeof categoryName === "string" && categoryName.trim()) {
    return categoryName.trim().toLowerCase();
  }

  return HAND_FALLBACK_SIDES[handIndex] ?? `hand_${handIndex + 1}`;
}

function createNode(landmark, source, metadata) {
  return {
    ...metadata,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z ?? 0,
    visibility: typeof landmark.visibility === "number" ? landmark.visibility : null,
    presence: typeof landmark.presence === "number" ? landmark.presence : null,
    source
  };
}

function titleCase(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
