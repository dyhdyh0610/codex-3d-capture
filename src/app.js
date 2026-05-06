import { extractTrackedNodes } from "./capture/landmarks.js";
import { createMotionDetectors } from "./capture/mediapipe.js";
import { shouldRecordSample, createSample, SAMPLE_INTERVAL_MS } from "./capture/sampling.js";
import { createCaptureSession, createSessionId } from "./capture/session.js";
import { drawOverlay } from "./overlay.js";
import { CaptureScene } from "./scene.js";

const els = {
  startButton: document.querySelector("#startButton"),
  stopButton: document.querySelector("#stopButton"),
  statusText: document.querySelector("#statusText"),
  sampleCount: document.querySelector("#sampleCount"),
  nodeCount: document.querySelector("#nodeCount"),
  savedFile: document.querySelector("#savedFile"),
  modelStatus: document.querySelector("#modelStatus"),
  lastSampleTime: document.querySelector("#lastSampleTime"),
  latestSample: document.querySelector("#latestSample"),
  video: document.querySelector("#cameraVideo"),
  overlay: document.querySelector("#overlayCanvas"),
  placeholder: document.querySelector("#cameraPlaceholder"),
  sceneRoot: document.querySelector("#sceneRoot")
};

const scene = new CaptureScene(els.sceneRoot);

let detectors = null;
let mediaStream = null;
let animationFrameId = null;
let running = false;
let sessionId = null;
let startedAt = null;
let startedAtMs = 0;
let lastSampleAtMs = null;
let samples = [];
let latestNodes = {};

els.startButton.addEventListener("click", () => startCapture());
els.stopButton.addEventListener("click", () => stopCapture());

setStatus("idle");

async function startCapture() {
  if (running) {
    return;
  }

  try {
    setStatus("loading models");
    els.startButton.disabled = true;
    els.savedFile.textContent = "none";
    els.modelStatus.textContent = "loading";

    detectors = detectors ?? (await createMotionDetectors());
    els.modelStatus.textContent = "ready";

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      },
      audio: false
    });

    els.video.srcObject = mediaStream;
    await els.video.play();
    els.placeholder.classList.add("hidden");

    sessionId = createSessionId();
    startedAt = new Date();
    startedAtMs = performance.now();
    lastSampleAtMs = null;
    samples = [];
    latestNodes = {};
    running = true;
    els.stopButton.disabled = false;
    setStatus("capturing");
    updateCounters();
    scene.clear();
    detectLoop();
  } catch (error) {
    console.error(error);
    cleanupCamera();
    els.startButton.disabled = false;
    els.stopButton.disabled = true;
    setStatus(error.message || "capture failed", true);
  }
}

async function stopCapture() {
  if (!running) {
    return;
  }

  running = false;
  cancelAnimationFrame(animationFrameId);
  cleanupCamera();
  els.stopButton.disabled = true;
  setStatus("saving");

  const endedAt = new Date();
  const payload = createCaptureSession({
    sessionId,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    videoWidth: els.video.videoWidth || null,
    videoHeight: els.video.videoHeight || null,
    userAgent: navigator.userAgent,
    modelInfo: detectors?.modelInfo ?? {},
    samples
  });

  try {
    const response = await fetch("/api/captures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.status}`);
    }

    const result = await response.json();
    els.savedFile.textContent = result.relativePath;
    setStatus("saved");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "save failed", true);
  } finally {
    els.startButton.disabled = false;
  }
}

function detectLoop() {
  if (!running) {
    return;
  }

  const nowMs = performance.now();

  if (els.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    const poseResult = detectors.poseLandmarker.detectForVideo(els.video, nowMs);
    const handResult = detectors.handLandmarker.detectForVideo(els.video, nowMs);
    latestNodes = extractTrackedNodes({
      poseLandmarks: poseResult.landmarks ?? [],
      poseWorldLandmarks: poseResult.worldLandmarks ?? [],
      handLandmarks: handResult.landmarks ?? [],
      handWorldLandmarks: handResult.worldLandmarks ?? [],
      handedness: handResult.handednesses ?? []
    });

    scene.update(latestNodes);
    drawOverlay(els.overlay, els.video, poseResult.landmarks?.[0] ?? [], handResult.landmarks ?? []);

    if (shouldRecordSample(lastSampleAtMs, nowMs, SAMPLE_INTERVAL_MS)) {
      const sample = createSample({
        capturedAt: new Date().toISOString(),
        elapsedMs: nowMs - startedAtMs,
        nodes: latestNodes
      });

      samples.push(sample);
      lastSampleAtMs = nowMs;
      els.lastSampleTime.textContent = sample.capturedAt;
      els.latestSample.textContent = JSON.stringify(sample, null, 2);
      updateCounters();
    }
  }

  animationFrameId = requestAnimationFrame(detectLoop);
}

function cleanupCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  els.video.srcObject = null;
  els.placeholder.classList.remove("hidden");
  const ctx = els.overlay.getContext("2d");
  ctx.clearRect(0, 0, els.overlay.width, els.overlay.height);
}

function updateCounters() {
  els.sampleCount.textContent = String(samples.length);
  els.nodeCount.textContent = String(Object.keys(latestNodes).length);
}

function setStatus(text, isError = false) {
  els.statusText.textContent = text;
  els.statusText.classList.toggle("is-error", isError);
}
