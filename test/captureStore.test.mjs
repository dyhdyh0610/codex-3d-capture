import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { afterEach } from "node:test";
import { readLatestCapturePayload, sanitizeCaptureFilename, writeCapturePayload } from "../server/captureStore.mjs";

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

test("readLatestCapturePayload returns null when no capture JSON exists", async () => {
  const dir = await mkdtemp(join(tmpdir(), "capture-store-empty-"));
  tempDirs.push(dir);

  await writeFile(join(dir, ".gitkeep"), "\n", "utf8");

  const latest = await readLatestCapturePayload(dir);

  assert.equal(latest, null);
});

test("readLatestCapturePayload ignores non-json files and selects the newest capture", async () => {
  const dir = await mkdtemp(join(tmpdir(), "capture-store-latest-"));
  tempDirs.push(dir);

  const olderPath = join(dir, "cap_older.json");
  const newerPath = join(dir, "cap_newer.json");
  const ignoredPath = join(dir, "notes.txt");

  await writeFile(olderPath, JSON.stringify({ sessionId: "cap_older", samples: [] }), "utf8");
  await writeFile(newerPath, JSON.stringify({ sessionId: "cap_newer", samples: [{ nodes: {} }] }), "utf8");
  await writeFile(ignoredPath, "not a capture", "utf8");

  await utimes(olderPath, new Date("2026-05-07T00:00:00.000Z"), new Date("2026-05-07T00:00:00.000Z"));
  await utimes(newerPath, new Date("2026-05-07T00:10:00.000Z"), new Date("2026-05-07T00:10:00.000Z"));

  const latest = await readLatestCapturePayload(dir);

  assert.equal(latest.filename, "cap_newer.json");
  assert.equal(latest.relativePath, "captures/cap_newer.json");
  assert.equal(latest.capture.sessionId, "cap_newer");
});
