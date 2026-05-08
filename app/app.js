import { analyzeCapture, getReplayFrames } from "./captureAnalysis.js";
import { MotionReplay } from "./replay.js";

const state = {
  capture: null,
  latestMeta: null,
  report: analyzeCapture(),
  frames: [],
  replay: null,
  playing: false,
  timer: null,
  frameIndex: 0
};

const els = {
  screens: document.querySelectorAll(".screen"),
  tabs: document.querySelectorAll(".tabbar button"),
  dataBanner: document.querySelector("#dataBanner"),
  partGrid: document.querySelector("#partGrid"),
  homeScoreLabel: document.querySelector("#homeScoreLabel"),
  durationMetric: document.querySelector("#durationMetric"),
  validMetric: document.querySelector("#validMetric"),
  scoreMetric: document.querySelector("#scoreMetric"),
  sessionBadge: document.querySelector("#sessionBadge"),
  viewReportButton: document.querySelector("#viewReportButton"),
  trendScore: document.querySelector("#trendScore"),
  reportTime: document.querySelector("#reportTime"),
  reportScore: document.querySelector("#reportScore"),
  reportTitle: document.querySelector("#reportTitle"),
  reportSummary: document.querySelector("#reportSummary"),
  feedbackList: document.querySelector("#feedbackList"),
  replayCanvas: document.querySelector("#replayCanvas"),
  playButton: document.querySelector("#playButton"),
  timelineInput: document.querySelector("#timelineInput"),
  frameLabel: document.querySelector("#frameLabel"),
  nodeMetric: document.querySelector("#nodeMetric"),
  elapsedMetric: document.querySelector("#elapsedMetric"),
  historyList: document.querySelector("#historyList"),
  courseList: document.querySelector("#courseList"),
  profileConnection: document.querySelector("#profileConnection"),
  deviceStatus: document.querySelector("#deviceStatus")
};

const partLabels = {
  shoulder: "肩部",
  elbow: "肘部",
  wrist: "腕部",
  hand: "手部"
};

const courses = [
  ["肩关节活动度训练", "8分钟 · 视频", "改善肩关节灵活性与稳定性"],
  ["肩部肌力强化", "10分钟 · 视频", "增强肩部力量与控制"],
  ["腕部灵活练习", "7分钟 · 视频", "提高腕部活动范围"],
  ["手部抓握指导", "9分钟 · 图文", "提升手部抓握力量与协调"]
];

init();

async function init() {
  bindTabs();
  bindReplay();
  renderStaticContent();
  state.replay = new MotionReplay(els.replayCanvas);
  await loadLatestCapture();
}

function bindTabs() {
  els.tabs.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });
  els.viewReportButton.addEventListener("click", () => activateTab("records"));
}

function activateTab(tab) {
  els.tabs.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
  els.screens.forEach((screen) => screen.classList.toggle("is-active", screen.dataset.screen === tab));
  if (tab === "records") {
    state.replay.draw(state.frameIndex);
  }
}

function bindReplay() {
  els.playButton.addEventListener("click", () => {
    if (state.playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });

  els.timelineInput.addEventListener("input", () => {
    state.frameIndex = Number(els.timelineInput.value);
    renderReplayFrame();
  });
}

async function loadLatestCapture() {
  setConnectionState("loading");
  try {
    const response = await fetch("/api/captures/latest", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (!payload.capture) {
      setConnectionState("empty");
      renderCapture(null, null);
      return;
    }
    setConnectionState("connected", payload);
    renderCapture(payload.capture, payload);
  } catch (error) {
    console.error(error);
    setConnectionState("error");
    renderCapture(null, null);
  }
}

function renderCapture(capture, latestMeta) {
  state.capture = capture;
  state.latestMeta = latestMeta;
  state.report = analyzeCapture(capture ?? {});
  state.frames = getReplayFrames(capture ?? {});
  state.frameIndex = 0;
  stopPlayback();

  renderHome();
  renderReport();
  renderReplay();
}

function renderHome() {
  const report = state.report;
  els.homeScoreLabel.textContent = report.activityLabel;
  els.durationMetric.textContent = report.durationLabel;
  els.validMetric.textContent = `${report.validSamples}帧`;
  els.scoreMetric.textContent = state.capture ? `${report.overallScore}%` : "--";
  els.sessionBadge.textContent = state.capture ? shortSession(report.sessionId) : "未连接";
  els.viewReportButton.disabled = !state.capture;

  els.partGrid.innerHTML = Object.entries(report.coverage)
    .map(([part, item]) => {
      const score = item.hasData ? Math.max(48, Math.round(item.rangeScore * 100)) : 0;
      return `<div><span>${partLabels[part]}</span><strong>${score || "--"}%</strong><small>${item.hasData ? rangeLabel(item.rangeScore) : "暂无"}</small></div>`;
    })
    .join("");
}

function renderReport() {
  const report = state.report;
  els.trendScore.textContent = state.capture ? `${report.overallScore}分` : "--";
  els.reportTime.textContent = state.capture ? formatDateTime(state.capture.endedAt ?? state.capture.startedAt) : "--";
  els.reportScore.textContent = String(report.overallScore);
  els.reportTitle.textContent = state.capture ? "本次训练表现" : "等待训练数据";
  els.reportSummary.textContent = state.capture ? report.feedback.summary : "完成一次 3D Capture 后，这里会自动生成报告。";
  els.feedbackList.innerHTML = Object.entries(partLabels)
    .map(([part, label]) => `<div><span>${label}</span><p>${report.feedback[part]}</p></div>`)
    .join("");

  els.historyList.innerHTML = createHistoryRows(report);
}

function renderReplay() {
  els.timelineInput.max = String(Math.max(0, state.frames.length - 1));
  els.timelineInput.value = "0";
  els.playButton.disabled = state.frames.length === 0;
  state.replay.setFrames(state.frames);
  renderReplayFrame();
}

function renderReplayFrame() {
  state.replay.draw(state.frameIndex);
  els.timelineInput.value = String(state.frameIndex);
  const frame = state.frames[state.frameIndex];
  els.frameLabel.textContent = state.frames.length ? `${state.frameIndex + 1} / ${state.frames.length}` : "0 / 0";
  els.nodeMetric.textContent = frame ? `关键点 ${Object.keys(frame.nodes ?? {}).length}` : "关键点 --";
  els.elapsedMetric.textContent = frame ? `时间 ${Math.round((frame.elapsedMs ?? 0) / 1000)}秒` : "时间 --";
}

function startPlayback() {
  if (state.frames.length === 0) return;
  state.playing = true;
  els.playButton.textContent = "暂停";
  state.timer = window.setInterval(() => {
    state.frameIndex = (state.frameIndex + 1) % state.frames.length;
    renderReplayFrame();
  }, 520);
}

function stopPlayback() {
  state.playing = false;
  els.playButton.textContent = "播放";
  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
}

function setConnectionState(status, payload = null) {
  const copy = {
    loading: ["正在读取训练数据", "连接本地 3D Capture"],
    connected: ["已连接最新训练数据", payload?.filename ?? "最新 capture 已导入"],
    empty: ["暂无训练数据", "请先完成一次 3D Capture"],
    error: ["训练数据读取失败", "请检查本地服务与 JSON 文件"]
  }[status];

  els.dataBanner.className = `data-banner data-banner--${status}`;
  els.dataBanner.querySelector("strong").textContent = copy[0];
  els.dataBanner.querySelector("p").textContent = copy[1];
  els.profileConnection.textContent = status === "connected" ? "本地 3D Capture 数据已连接" : copy[0];
  els.deviceStatus.textContent = status === "connected" ? "已连接" : status === "loading" ? "检测中" : "未连接";
}

function renderStaticContent() {
  els.courseList.innerHTML = courses
    .map(
      ([title, meta, desc], index) => `
        <article class="course-card">
          <div class="course-visual course-visual--${index + 1}"></div>
          <div>
            <h2>${title}</h2>
            <span>${meta}</span>
            <p>${desc}</p>
          </div>
          <button type="button" aria-label="查看课程">▶</button>
        </article>
      `
    )
    .join("");
}

function createHistoryRows(report) {
  const latest = state.capture
    ? `<div><span>最新训练</span><strong>${report.overallScore}分</strong><small>${report.durationLabel} · ${report.validSamples}帧</small></div>`
    : `<div><span>最新训练</span><strong>--</strong><small>暂无数据</small></div>`;
  return `${latest}
    <div><span>肩部活动练习</span><strong>82分</strong><small>18分钟 · 演示记录</small></div>
    <div><span>腕部灵活练习</span><strong>75分</strong><small>12分钟 · 演示记录</small></div>`;
}

function rangeLabel(score) {
  if (score >= 0.72) return "充分";
  if (score >= 0.32) return "稳定";
  return "较少";
}

function shortSession(value) {
  return String(value).replace(/^cap_/, "").slice(0, 15);
}

function formatDateTime(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
