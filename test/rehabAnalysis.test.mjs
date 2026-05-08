import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCapture } from "../app/captureAnalysis.js";

const sampleCapture = {
  sessionId: "cap_report_test",
  startedAt: "2026-05-07T00:00:00.000Z",
  endedAt: "2026-05-07T00:00:04.000Z",
  durationMs: 4_000,
  sampleIntervalMs: 1_000,
  samples: [
    { elapsedMs: 0, nodes: {} },
    {
      elapsedMs: 1_000,
      nodes: {
        "pose.left_shoulder": { x: 0, y: 0, z: 0 },
        "pose.left_elbow": { x: 0.2, y: -0.2, z: 0.1 },
        "pose.left_wrist": { x: 0.4, y: -0.4, z: 0.2 },
        "pose.right_shoulder": { x: 0.1, y: 0, z: 0 },
        "pose.right_elbow": { x: 0.3, y: -0.2, z: 0.1 },
        "pose.right_wrist": { x: 0.5, y: -0.4, z: 0.2 }
      }
    },
    {
      elapsedMs: 2_000,
      nodes: {
        "pose.left_shoulder": { x: 0, y: 0.05, z: 0 },
        "pose.left_elbow": { x: 0.24, y: -0.24, z: 0.12 },
        "pose.left_wrist": { x: 0.55, y: -0.52, z: 0.28 },
        "pose.right_shoulder": { x: 0.12, y: 0.04, z: 0.01 },
        "pose.right_elbow": { x: 0.34, y: -0.28, z: 0.12 },
        "pose.right_wrist": { x: 0.62, y: -0.48, z: 0.22 },
        "hand.right.wrist": { x: 0.64, y: -0.49, z: 0.22 }
      }
    }
  ]
};

test("analyzeCapture summarizes duration, valid frames, body coverage, and score", () => {
  const report = analyzeCapture(sampleCapture);

  assert.equal(report.sessionId, "cap_report_test");
  assert.equal(report.durationLabel, "0分04秒");
  assert.equal(report.totalSamples, 3);
  assert.equal(report.validSamples, 2);
  assert.equal(report.sampleIntervalLabel, "1秒/次");
  assert.equal(report.coverage.shoulder.hasData, true);
  assert.equal(report.coverage.elbow.hasData, true);
  assert.equal(report.coverage.wrist.hasData, true);
  assert.equal(report.coverage.hand.hasData, true);
  assert.ok(report.overallScore >= 0 && report.overallScore <= 100);
  assert.match(report.feedback.wrist, /腕部/);
});

test("analyzeCapture handles an empty capture without throwing", () => {
  const report = analyzeCapture({ sessionId: "empty", durationMs: 0, sampleIntervalMs: 1_000, samples: [] });

  assert.equal(report.totalSamples, 0);
  assert.equal(report.validSamples, 0);
  assert.equal(report.overallScore, 0);
  assert.equal(report.coverage.hand.hasData, false);
});
