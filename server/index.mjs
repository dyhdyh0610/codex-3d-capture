import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { writeCapturePayload } from "./captureStore.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const captureDir = join(projectRoot, "captures");
const port = Number(process.env.PORT || 5173);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"]
]);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/captures") {
      const payload = await readJsonBody(req);
      validateCapturePayload(payload);
      const result = await writeCapturePayload(payload, captureDir);
      sendJson(res, 201, result);
      return;
    }

    if (req.method !== "GET") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (error) {
    const status = error.statusCode ?? 500;
    sendJson(res, status, { error: error.message ?? "Server error" });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Motion capture server running at http://127.0.0.1:${port}`);
});

async function serveStatic(pathname, res) {
  const relativePath = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
  const safeRelative = normalize(relativePath).replace(/^(\.\.[/\\])+/, "");

  if (!isPublicPath(safeRelative)) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const absolutePath = resolve(projectRoot, safeRelative);
  if (!absolutePath.startsWith(`${projectRoot}${sep}`) && absolutePath !== projectRoot) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const body = await readFile(absolutePath);
  const contentType = mimeTypes.get(extname(absolutePath)) ?? "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function isPublicPath(relativePath) {
  return relativePath === "index.html" || relativePath.startsWith(`src${sep}`) || relativePath.startsWith("src/");
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 50 * 1024 * 1024) {
      const error = new Error("Capture payload is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Invalid JSON payload.");
    error.statusCode = 400;
    throw error;
  }
}

function validateCapturePayload(payload) {
  if (!payload || typeof payload !== "object") {
    const error = new Error("Capture payload must be an object.");
    error.statusCode = 400;
    throw error;
  }

  if (typeof payload.sessionId !== "string" || !payload.sessionId.trim()) {
    const error = new Error("Capture payload requires a sessionId.");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(payload.samples)) {
    const error = new Error("Capture payload requires a samples array.");
    error.statusCode = 400;
    throw error;
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}
