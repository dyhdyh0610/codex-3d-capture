import { HAND_LANDMARK_NAMES, POSE_UPPER_BODY_POINTS } from "./capture/landmarks.js";

const POSE_CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16]
];

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17]
];

export function drawOverlay(canvas, video, poseLandmarks = [], handLandmarks = []) {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * pixelRatio));
  const height = Math.max(1, Math.floor(rect.height * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.scale(pixelRatio, pixelRatio);

  const viewWidth = rect.width;
  const viewHeight = rect.height;

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#86efac";
  drawConnections(ctx, poseLandmarks, POSE_CONNECTIONS, viewWidth, viewHeight);

  ctx.fillStyle = "#fbbf24";
  for (const point of POSE_UPPER_BODY_POINTS) {
    drawPoint(ctx, poseLandmarks[point.index], viewWidth, viewHeight, 4.5);
  }

  ctx.lineWidth = 2;
  handLandmarks.forEach((hand, index) => {
    ctx.strokeStyle = index === 0 ? "#67e8f9" : "#fb7185";
    ctx.fillStyle = index === 0 ? "#67e8f9" : "#fb7185";
    drawConnections(ctx, hand, HAND_CONNECTIONS, viewWidth, viewHeight);
    HAND_LANDMARK_NAMES.forEach((_, landmarkIndex) => {
      drawPoint(ctx, hand[landmarkIndex], viewWidth, viewHeight, 2.8);
    });
  });

  ctx.restore();
}

function drawConnections(ctx, landmarks, connections, width, height) {
  for (const [start, end] of connections) {
    const a = landmarks[start];
    const b = landmarks[end];
    if (!a || !b) {
      continue;
    }

    ctx.beginPath();
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
    ctx.stroke();
  }
}

function drawPoint(ctx, landmark, width, height, radius) {
  if (!landmark) {
    return;
  }

  ctx.beginPath();
  ctx.arc(landmark.x * width, landmark.y * height, radius, 0, Math.PI * 2);
  ctx.fill();
}
