import assert from "node:assert/strict";
import test from "node:test";
import {
  HAND_LANDMARK_NAMES,
  POSE_UPPER_BODY_POINTS,
  extractTrackedNodes
} from "../src/capture/landmarks.js";

const makeLandmarks = (count, offset = 0) =>
  Array.from({ length: count }, (_, index) => ({
    x: offset + index,
    y: offset + index + 0.1,
    z: offset + index + 0.2,
    visibility: 0.9,
    presence: 0.8
  }));

test("keeps only shoulders, elbows, wrists from pose results", () => {
  const nodes = extractTrackedNodes({
    poseLandmarks: [makeLandmarks(33, 100)],
    poseWorldLandmarks: [makeLandmarks(33, 200)],
    handLandmarks: [],
    handWorldLandmarks: [],
    handedness: []
  });

  assert.deepEqual(
    Object.keys(nodes),
    POSE_UPPER_BODY_POINTS.map((point) => point.id)
  );
  assert.deepEqual(
    {
      x: nodes["pose.left_shoulder"].x,
      y: nodes["pose.left_shoulder"].y,
      z: nodes["pose.left_shoulder"].z,
      source: nodes["pose.left_shoulder"].source
    },
    { x: 211, y: 211.1, z: 211.2, source: "poseWorld" }
  );
});

test("adds 21 finger and palm nodes per detected hand with handedness labels", () => {
  const nodes = extractTrackedNodes({
    poseLandmarks: [],
    poseWorldLandmarks: [],
    handLandmarks: [makeLandmarks(21, 10), makeLandmarks(21, 40)],
    handWorldLandmarks: [makeLandmarks(21, 20), makeLandmarks(21, 60)],
    handedness: [[{ categoryName: "Left", score: 0.98 }], [{ categoryName: "Right", score: 0.97 }]]
  });

  assert.equal(Object.keys(nodes).length, HAND_LANDMARK_NAMES.length * 2);
  assert.equal(nodes["hand.left.index_tip"].x, 28);
  assert.equal(nodes["hand.left.index_tip"].source, "handWorld");
  assert.equal(nodes["hand.right.wrist"].x, 60);
  assert.equal(nodes["hand.right.wrist"].handednessScore, 0.97);
});
