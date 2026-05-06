# Upper Body Motion Capture

Local browser app for upper-body motion capture. It tracks shoulders, elbows, wrists, and 21 landmarks on each detected hand, renders them in a 3D coordinate view, samples once per second, and saves the finished capture session as JSON under `captures/`.

## Run

```bash
npm run dev
```

Open `http://127.0.0.1:5173`.

## Notes

- The browser asks for camera permission when capture starts.
- MediaPipe and Three.js load from official/CDN-hosted browser assets, so the first run needs network access.
- Stop & Save writes `captures/<session-id>.json` through the local Node server.
- Generated capture JSON files are ignored by git by default because they can contain personal motion data.

## Test

```bash
npm test
```
