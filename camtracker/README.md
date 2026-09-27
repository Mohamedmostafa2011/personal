# FaceCam — auto-framing virtual camera source

A single-file, high-performance face tracker that keeps you perfectly framed, then
feeds that framed video into **OBS → Virtual Camera** so Zoom, Meet, Discord, Teams
or any other app sees it as a normal webcam.

Think "Center Stage" / "Framing" for any laptop, in a browser tab, with no install.

![status](https://img.shields.io/badge/deps-zero-brightgreen) ![status](https://img.shields.io/badge/files-1%20html-blue) ![status](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Live demo

Enable GitHub Pages on this repo (see [Deploy](#deploy-to-github-pages)) and open:

```
https://<your-username>.github.io/<your-repo>/
```

Pages is served over HTTPS, which is required for camera access.

---

## Features

- **BlazeFace (MediaPipe Tasks-Vision)** short-range detector with **GPU delegate** — the
  same class of model used by Google Meet.
- **Auto-framing**: smooth pan + zoom that keeps your face locked in frame, with
  adjustable tightness, headroom and dead zone.
- **Tuned for performance** (see below) — typically **1–3 ms** detect time with
  rendering pinned to your camera's full frame rate.
- **Graceful fallbacks**: MediaPipe → native Chrome `FaceDetector` → a tiny
  skin-tone centroid tracker that works completely offline.
- **Clean mode** — hides all UI so OBS captures nothing but the framed canvas.
- **Built-in diagnostics** that enumerate and test-open every camera and report the
  exact failure reason.
- Output is exposed as a `MediaStream` on `window.faceCamStream`.

---

## Quick start

### Option A — GitHub Pages (recommended)
Just open your Pages URL. HTTPS, so cameras work immediately.

### Option B — run locally

> ⚠️ **Do not double-click `index.html`.** Chrome and Edge refuse real camera access on
> the `file://` scheme: you get one placeholder device with an empty `deviceId`, no
> label, and an `OverconstrainedError`. You must serve over `http://localhost`.

**Windows**
```bat
start-facecam.bat
```

**macOS / Linux**
```bash
./start-facecam.sh
```

**Or manually**
```bash
python -m http.server 8000
# then open http://localhost:8000
```

---

## Turning it into a real webcam

A web page **cannot** register an operating-system camera device — that is a hard
browser sandbox limit. OBS is the bridge:

1. Install [OBS Studio](https://obsproject.com/) (free).
2. **Sources → + → Browser**.
3. URL = your Pages URL (or `http://localhost:8000`).
4. Width `1280`, Height `720`, FPS `30`.
5. In the FaceCam sidebar, tick **Clean mode** so only the canvas renders.
6. **Start Virtual Camera** in OBS.
7. In Zoom / Meet / Discord / Teams, pick **OBS Virtual Camera**.

Alternatives to OBS: [Camo Studio](https://reincubate.com/camo/), Snap Camera, or
`v4l2loopback` on Linux.

---

## Controls

| Control | What it does |
|---|---|
| **Zoom / tightness** | How closely the crop hugs your face (multiple of face height) |
| **Vertical offset** | Headroom — negative puts your eyes on the upper third |
| **Smoothing** | Higher = slower, more cinematic follow |
| **Dead zone** | Ignore micro-movement so the frame feels locked, not floaty |
| **Max pan speed** | Caps how fast the crop can travel; prevents whip-pans |
| **Detect rate** | Inference frequency in Hz — the main CPU/GPU cost knob |
| **Detector input width** | Downscale size fed to the model; lower = much faster |
| **Output size** | 480p / 720p / 900p / 1080p canvas |
| **Mirror** | Selfie view |
| **GPU delegate** | Toggle WebGL inference vs CPU/WASM |
| **Show tracking box** | Debug overlay |
| **Clean mode** | Hide all UI for OBS capture |

---

## Performance design

| Technique | Why it matters |
|---|---|
| Detection runs on a **downscaled copy** (default 256 px wide) | ~6–10× cheaper inference than full-res |
| Detection **throttled to ~15 Hz**, rendering at 30–60 fps | Decouples the expensive path from the cheap one |
| `requestVideoFrameCallback` instead of `requestAnimationFrame` | Exactly one render per real camera frame, zero wasted work |
| Single `drawImage` blit for the crop | GPU-composited; no per-pixel JavaScript in the hot path |
| `desynchronized: true`, `alpha: false` canvas context | Lower presentation latency |
| Frame-rate-independent exponential smoothing + speed clamp | Identical feel at 30 fps and 144 fps |
| Dead zone before any motion is applied | Eliminates jitter without adding lag |

Tuning tips: for a weak CPU drop **detect rate** to 8–10 Hz and **detector width** to
160 px — tracking stays smooth because rendering and smoothing are independent of
detection. For fast head movement, raise detect rate and lower smoothing.

---

## Troubleshooting

**Only one camera listed / no label / `OverconstrainedError`**
You are on `file://`. Serve over `http://localhost` or HTTPS. Click **Run diagnostics** —
if `origin` reads `file://`, that is the cause.

**Camera list is empty until I click Start**
Expected. Browsers hide device labels and collapse the list until permission is granted.
The page primes permission on first Start, then re-enumerates.

**`NotReadableError`**
Another app owns the camera. Close OBS / Zoom / Teams / the Windows Camera app.

**My integrated camera is missing but a virtual one (Iriun, DroidCam, OBS) shows**
Quit the virtual camera app from the system tray, then reload. Also check
Windows → Privacy & security → Camera, Device Manager → Cameras, and any physical
privacy shutter or `Fn` camera key.

**Tracking falls back to "motion" engine**
MediaPipe is loaded from a CDN. With no network it falls back to the offline
skin-tone tracker. Vendor the model locally if you need full offline accuracy.

---

## Browser support

| Browser | Status |
|---|---|
| Chrome / Edge 90+ | Full support, GPU delegate, `requestVideoFrameCallback` |
| Opera / Brave / Arc | Full support |
| Firefox | Works; falls back to `requestAnimationFrame` |
| Safari 16+ | Works; GPU delegate may fall back to CPU |

---

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "FaceCam: auto-framing virtual camera source"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then: **Settings → Pages → Source: GitHub Actions**. The included workflow at
`.github/workflows/pages.yml` publishes the site on every push to `main`.

(Or simply **Settings → Pages → Source: Deploy from a branch → `main` / root**.)

---

## Privacy

Everything runs locally in your browser. No video ever leaves your machine — there is
no server, no upload, no analytics. The only network requests are to a CDN for the
MediaPipe model files.

---

## License

MIT — see [LICENSE](LICENSE).
