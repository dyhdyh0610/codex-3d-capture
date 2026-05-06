import { mkdir, writeFile } from "node:fs/promises";
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
