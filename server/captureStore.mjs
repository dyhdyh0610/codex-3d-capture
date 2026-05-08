import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

export function sanitizeCaptureFilename(value) {
  return String(value ?? "")
    .replace(/[/\\]+/g, "_")
    .replace(/^\.+/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 96) || `capture_${Date.now()}`;
}

export async function writeCapturePayload(payload, captureDir) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Capture payload must be an object.");
  }

  await mkdir(captureDir, { recursive: true });
  const safeName = sanitizeCaptureFilename(payload.sessionId);
  const filename = `${safeName}.json`;
  const absolutePath = join(captureDir, filename);

  await writeFile(absolutePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return {
    filename,
    absolutePath,
    relativePath: `captures/${filename}`
  };
}

export async function readLatestCapturePayload(captureDir) {
  let entries;
  try {
    entries = await readdir(captureDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const jsonFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"));
  if (jsonFiles.length === 0) {
    return null;
  }

  const candidates = await Promise.all(
    jsonFiles.map(async (entry) => {
      const absolutePath = join(captureDir, entry.name);
      const fileStat = await stat(absolutePath);
      return {
        filename: entry.name,
        absolutePath,
        modifiedMs: fileStat.mtimeMs
      };
    })
  );

  candidates.sort((a, b) => b.modifiedMs - a.modifiedMs || b.filename.localeCompare(a.filename));
  const latest = candidates[0];
  const capture = JSON.parse(await readFile(latest.absolutePath, "utf8"));

  return {
    filename: latest.filename,
    absolutePath: latest.absolutePath,
    relativePath: `captures/${latest.filename}`,
    modifiedAt: new Date(latest.modifiedMs).toISOString(),
    capture
  };
}
