import assert from "node:assert/strict";
import test from "node:test";
import { shouldRecordSample } from "../src/capture/sampling.js";

test("records immediately when there is no previous sample", () => {
  assert.equal(shouldRecordSample(null, 0, 1000), true);
});

test("waits until the configured interval has elapsed", () => {
  assert.equal(shouldRecordSample(1_000, 1_999, 1000), false);
  assert.equal(shouldRecordSample(1_000, 2_000, 1000), true);
});
