# Rehab App Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a decoupled mobile-style rehabilitation app prototype that reads the latest 3D Capture JSON and presents a report plus motion replay.

**Architecture:** Keep the existing `/` 3D Capture page unchanged. Add a read-only latest-capture boundary in the Node server, a separate `/app/` static app, and pure data-analysis modules that can be tested without DOM or Three.js.

**Tech Stack:** Native HTML, CSS, JavaScript ES modules, Node test runner, Three.js from the existing import map/CDN pattern.

---

### Task 1: Latest Capture Data Boundary

**Files:**
- Modify: `server/captureStore.mjs`
- Modify: `server/index.mjs`
- Modify: `test/captureStore.test.mjs`

- [ ] Add tests for reading no capture files and selecting the latest JSON file.
- [ ] Implement `readLatestCapturePayload(captureDir)`.
- [ ] Add `GET /api/captures/latest` without changing `POST /api/captures`.
- [ ] Run `npm test`.

### Task 2: Report Data Transformation

**Files:**
- Create: `app/captureAnalysis.js`
- Create: `test/rehabAnalysis.test.mjs`

- [ ] Add tests for duration, valid sample count, body-part coverage, and score bounds.
- [ ] Implement stable analysis helpers with no DOM dependency.
- [ ] Run `npm test`.

### Task 3: App Shell And Four Tabs

**Files:**
- Create: `app/index.html`
- Create: `app/styles.css`
- Create: `app/app.js`
- Modify: `server/index.mjs`

- [ ] Add a separate `/app/` static route.
- [ ] Build the iPhone-style shell with Home, Training Records, Rehab Content, and Profile tabs.
- [ ] Fetch `/api/captures/latest` on load and render empty/error states.

### Task 4: Report And Replay UI

**Files:**
- Create: `app/replay.js`
- Modify: `app/app.js`
- Modify: `app/styles.css`

- [ ] Render the latest training report from real capture data.
- [ ] Render the replay card with a canvas/Three.js skeleton, play/pause, and timeline.
- [ ] Keep all medical wording as training feedback, not diagnosis.

### Task 5: Verification

**Files:**
- No required file edits.

- [ ] Run `npm test`.
- [ ] Start `npm run dev`.
- [ ] Verify `/` still opens the original 3D Capture page.
- [ ] Verify `/app/` opens the rehab app, loads latest capture data, switches all four tabs, and shows report/replay content.
