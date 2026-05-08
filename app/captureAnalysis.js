const BODY_PARTS = {
  shoulder: ["pose.left_shoulder", "pose.right_shoulder"],
  elbow: ["pose.left_elbow", "pose.right_elbow"],
  wrist: ["pose.left_wrist", "pose.right_wrist"],
  hand: ["hand.left.wrist", "hand.right.wrist", "hand.left.index_tip", "hand.right.index_tip"]
};

const REQUIRED_SIDE_KEYS = [
  ["pose.left_shoulder", "pose.right_shoulder"],
  ["pose.left_elbow", "pose.right_elbow"],
  ["pose.left_wrist", "pose.right_wrist"]
];

export function analyzeCapture(capture = {}) {
  const samples = Array.isArray(capture.samples) ? capture.samples : [];
  const validSamples = samples.filter((sample) => Object.keys(sample.nodes ?? {}).length > 0);
  const totalSamples = samples.length;
  const dataCompleteness = totalSamples > 0 ? validSamples.length / totalSamples : 0;
  const coverage = createCoverage(samples);
  const motionScore = calculateMotionScore(samples, coverage);
  const sideParticipation = calculateSideParticipation(samples);
  const overallScore = clampScore(dataCompleteness * 35 + motionScore * 40 + sideParticipation * 25);

  return {
    sessionId: capture.sessionId ?? "unknown",
    startedAt: capture.startedAt ?? null,
    endedAt: capture.endedAt ?? null,
    durationMs: Number.isFinite(capture.durationMs) ? capture.durationMs : 0,
    durationLabel: formatDuration(capture.durationMs),
    sampleIntervalMs: Number.isFinite(capture.sampleIntervalMs) ? capture.sampleIntervalMs : 0,
    sampleIntervalLabel: formatSampleInterval(capture.sampleIntervalMs),
    totalSamples,
    validSamples: validSamples.length,
    dataCompleteness,
    motionScore: clampScore(motionScore * 100),
    sideParticipation: clampScore(sideParticipation * 100),
    overallScore,
    coverage,
    feedback: createFeedback(coverage, overallScore),
    activityLabel: createActivityLabel(overallScore)
  };
}

export function getReplayFrames(capture = {}) {
  const samples = Array.isArray(capture.samples) ? capture.samples : [];
  return samples.filter((sample) => Object.keys(sample.nodes ?? {}).length > 0);
}

function createCoverage(samples) {
  return Object.fromEntries(
    Object.entries(BODY_PARTS).map(([part, ids]) => {
      const values = collectNodes(samples, ids);
      const range = calculateRange(values);
      return [
        part,
        {
          hasData: values.length > 0,
          nodeCount: values.length,
          range,
          rangeScore: normalizeRange(range)
        }
      ];
    })
  );
}

function collectNodes(samples, ids) {
  const idSet = new Set(ids);
  const values = [];
  for (const sample of samples) {
    for (const [id, node] of Object.entries(sample.nodes ?? {})) {
      if (idSet.has(id) || (ids.some((part) => part.includes("hand.")) && id.startsWith("hand."))) {
        values.push(node);
      }
    }
  }
  return values;
}

function calculateRange(nodes) {
  if (nodes.length === 0) {
    return 0;
  }

  const axes = ["x", "y", "z"].map((axis) => nodes.map((node) => Number(node[axis] ?? 0)));
  const [xValues, yValues, zValues] = axes;
  const dx = Math.max(...xValues) - Math.min(...xValues);
  const dy = Math.max(...yValues) - Math.min(...yValues);
  const dz = Math.max(...zValues) - Math.min(...zValues);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function normalizeRange(range) {
  return Math.max(0, Math.min(1, range / 0.55));
}

function calculateMotionScore(samples, coverage) {
  const tracked = [coverage.shoulder, coverage.elbow, coverage.wrist].filter((part) => part.hasData);
  if (tracked.length === 0 || samples.length === 0) {
    return 0;
  }
  return tracked.reduce((sum, part) => sum + part.rangeScore, 0) / tracked.length;
}

function calculateSideParticipation(samples) {
  const seen = new Set();
  for (const sample of samples) {
    for (const key of Object.keys(sample.nodes ?? {})) {
      seen.add(key);
    }
  }

  const completePairs = REQUIRED_SIDE_KEYS.filter(([left, right]) => seen.has(left) && seen.has(right)).length;
  return completePairs / REQUIRED_SIDE_KEYS.length;
}

function createFeedback(coverage, overallScore) {
  return {
    shoulder: coverage.shoulder.hasData
      ? `肩部活动范围${rangeText(coverage.shoulder.rangeScore)}，训练状态可作为本次反馈参考。`
      : "肩部关键点不足，建议重新完成一次光线充足的捕捉。",
    elbow: coverage.elbow.hasData
      ? `肘部屈伸轨迹${rangeText(coverage.elbow.rangeScore)}，可继续保持当前训练节奏。`
      : "肘部关键点不足，本次报告无法形成完整肘部反馈。",
    wrist: coverage.wrist.hasData
      ? `腕部末端轨迹${rangeText(coverage.wrist.rangeScore)}，能够反映上肢末端参与情况。`
      : "腕部关键点不足，本次主要基于肩肘数据生成反馈。",
    hand: coverage.hand.hasData
      ? "手部关键点已接入，可辅助观察抓握和手腕末端活动。"
      : "本次未检测到完整手部关键点，已基于肩肘腕生成报告。",
    summary: overallScore >= 70 ? "本次训练数据较完整，整体表现良好。" : "本次训练数据可用于回看，建议保持稳定姿态后再次训练。"
  };
}

function createActivityLabel(score) {
  if (score >= 80) return "良好";
  if (score >= 60) return "稳定";
  if (score > 0) return "待提升";
  return "暂无数据";
}

function rangeText(score) {
  if (score >= 0.72) return "充分";
  if (score >= 0.32) return "稳定";
  return "较少";
}

function formatDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.round((Number(durationMs) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}分${String(seconds).padStart(2, "0")}秒`;
}

function formatSampleInterval(intervalMs) {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    return "未知";
  }
  if (intervalMs % 1000 === 0) {
    return `${intervalMs / 1000}秒/次`;
  }
  return `${intervalMs}毫秒/次`;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}
