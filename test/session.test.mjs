import assert from "node:assert/strict";
import test from "node:test";
import { createCaptureSession } from "../src/capture/session.js";

test("creates a stable JSON session payload for project file storage", () => {
  const session = createCaptureSession({
    sessionId: "cap_test",
    startedAt: "2026-05-06T00:00:00.000Z",
    endedAt: "2026-05-06T00:00:02.000Z",
    videoWidth: 1280,
    videoHeight: 720,
    samples: [
      {
        capturedAt: "2026-05-06T00:00:01.000Z",
        elapsedMs: 1000,
        nodes: {
          "pose.left_wrist": { x: 0.1, y: 0.2, z: 0.3, source: "poseWorld" }
        }
      }
    ]
  });

  assert.equal(session.schemaVersion, "upper-body-motion-capture/v1");
  assert.equal(session.sampleIntervalMs, 1000);
  assert.match(session.coordinateSystem.poseWorld, /meters/);
  assert.equal(session.samples[0].nodes["pose.left_wrist"].source, "poseWorld");
});
