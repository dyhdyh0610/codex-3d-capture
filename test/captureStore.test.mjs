import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { afterEach } from "node:test";
import { sanitizeCaptureFilename, writeCapturePayload } from "../server/captureStore.mjs";

const tempDirs = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

test("sanitizeCaptureFilename keeps capture filenames filesystem safe", () => {
  assert.equal(sanitizeCaptureFilename("../cap:bad/name"), "cap_bad_name");
});

test("writeCapturePayload writes the capture JSON into the provided directory", async () => {
  const dir = await mkdtemp(join(tmpdir(), "capture-store-"));
  tempDirs.push(dir);

  const result = await writeCapturePayload(
    {
      sessionId: "cap_test",
      startedAt: "2026-05-06T00:00:00.000Z",
      endedAt: "2026-05-06T00:00:01.000Z",
      samples: []
    },
    dir
  );

  const saved = JSON.parse(await readFile(result.absolutePath, "utf8"));
  assert.equal(result.filename, "cap_test.json");
  assert.equal(saved.sessionId, "cap_test");
});
