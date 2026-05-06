export const SAMPLE_INTERVAL_MS = 1000;

export function shouldRecordSample(lastSampleAtMs, nowMs, intervalMs = SAMPLE_INTERVAL_MS) {
  if (lastSampleAtMs === null || lastSampleAtMs === undefined) {
    return true;
  }

  return nowMs - lastSampleAtMs >= intervalMs;
}

export function createSample({ capturedAt, elapsedMs, nodes }) {
  return {
    capturedAt,
    elapsedMs: Math.round(elapsedMs),
    nodes: structuredClone(nodes)
  };
}
