const BONES = [
  ["pose.left_shoulder", "pose.left_elbow"],
  ["pose.left_elbow", "pose.left_wrist"],
  ["pose.right_shoulder", "pose.right_elbow"],
  ["pose.right_elbow", "pose.right_wrist"],
  ["pose.left_shoulder", "pose.right_shoulder"]
];

const TRAIL_IDS = ["pose.left_wrist", "pose.right_wrist"];

export class MotionReplay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.frames = [];
    this.frameIndex = 0;
  }

  setFrames(frames) {
    this.frames = frames;
    this.frameIndex = 0;
    this.draw(0);
  }

  draw(frameIndex = this.frameIndex) {
    this.frameIndex = Math.max(0, Math.min(frameIndex, Math.max(0, this.frames.length - 1)));
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.clearRect(0, 0, width, height);
    drawBackdrop(ctx, width, height);

    if (this.frames.length === 0) {
      drawEmpty(ctx, width, height);
      return;
    }

    const frame = this.frames[this.frameIndex];
    const projection = createProjection(this.frames, width, height);
    drawTrails(ctx, this.frames.slice(0, this.frameIndex + 1), projection);
    drawBones(ctx, frame.nodes ?? {}, projection);
    drawJoints(ctx, frame.nodes ?? {}, projection);
  }
}

function drawBackdrop(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#fff7f1");
  gradient.addColorStop(1, "#ffffff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 106, 24, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 40; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 40; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawEmpty(ctx, width, height) {
  ctx.fillStyle = "#8a8a8e";
  ctx.font = "26px 'Microsoft YaHei', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("暂无可回放轨迹", width / 2, height / 2);
}

function createProjection(frames, width, height) {
  const points = frames.flatMap((frame) =>
    Object.entries(frame.nodes ?? {})
      .filter(([id]) => id.startsWith("pose."))
      .map(([, node]) => node)
  );
  const xs = points.map((point) => Number(point.x ?? 0));
  const ys = points.map((point) => Number(point.y ?? 0));
  const minX = Math.min(...xs, -0.6);
  const maxX = Math.max(...xs, 0.6);
  const minY = Math.min(...ys, -0.7);
  const maxY = Math.max(...ys, 0.25);
  const pad = 58;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return (node) => ({
    x: pad + ((Number(node.x ?? 0) - minX) / rangeX) * (width - pad * 2),
    y: pad + ((Number(node.y ?? 0) - minY) / rangeY) * (height - pad * 2)
  });
}

function drawTrails(ctx, frames, project) {
  for (const id of TRAIL_IDS) {
    ctx.beginPath();
    frames.forEach((frame, index) => {
      const node = frame.nodes?.[id];
      if (!node) return;
      const point = project(node);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = id.includes("left") ? "rgba(255, 106, 24, 0.62)" : "rgba(255, 155, 86, 0.62)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

function drawBones(ctx, nodes, project) {
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255, 106, 24, 0.22)";
  for (const [from, to] of BONES) {
    if (!nodes[from] || !nodes[to]) continue;
    const start = project(nodes[from]);
    const end = project(nodes[to]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
}

function drawJoints(ctx, nodes, project) {
  for (const [id, node] of Object.entries(nodes)) {
    if (!id.startsWith("pose.")) continue;
    const point = project(node);
    ctx.beginPath();
    ctx.arc(point.x, point.y, id.includes("wrist") ? 11 : 9, 0, Math.PI * 2);
    ctx.fillStyle = "#ff6a18";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#fff4ec";
    ctx.stroke();
  }
}
