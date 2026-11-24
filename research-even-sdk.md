# Even Realities / Even Hub — SDK & Developer Platform Research

**Researched:** 2026-11-20 (read-only; no sign-up, sign-in, download, or account created)
**Hackathon:** Heads Up: Even Realities Hackathon — https://dorahacks.io/hackathon/even-realities/detail
**Docs home:** https://hub.evenrealities.com/docs

> Every fact below carries its source URL. Items marked **UNVERIFIED** could not be confirmed from an official source in this pass.

---

## 1. Docs, SDK, repos — what is public

| Item | Value | Source |
|---|---|---|
| Developer docs home | https://hub.evenrealities.com/docs | https://hub.evenrealities.com/docs |
| Developer portal / Hub | https://hub.evenrealities.com (login at https://hub.evenrealities.com/login) | https://hub.evenrealities.com/docs/test/beta-testing |
| SDK (npm, public) | `@evenrealities/even_hub_sdk`, current **0.0.14** (published 2026-08-20, Even App floor 2.2.9) | https://hub.evenrealities.com/docs/get-started/quickstart/install-tools |
| CLI (npm, public) | `@evenrealities/evenhub-cli`, current **0.2.0** (2026-10-20) | https://hub.evenrealities.com/docs/cli ; https://hub.evenrealities.com/docs/reference/changelog |
| Simulator (npm, public) | `@evenrealities/evenhub-simulator`, current **0.9.3** (tracks SDK 0.0.14) | https://hub.evenrealities.com/docs/test/simulator |
| Templates repo (GitHub, **Public, MIT**) | https://github.com/even-realities/evenhub-templates | https://github.com/even-realities/evenhub-templates |
| Official Claude Code plugin repo (GitHub, **Public**) | https://github.com/even-realities/everything-evenhub — contains SDK reference, build-and-deploy, test-with-simulator skills | https://github.com/even-realities/everything-evenhub/blob/main/plugins/everything-evenhub/skills/build-and-deploy/SKILL.md |
| SDK source repo on GitHub | **UNVERIFIED** — no public SDK source repository was found. The SDK is distributed as the npm package `@evenrealities/even_hub_sdk`; its README is bundled in the npm package. The official GitHub org (`even-realities`) hosts the templates and the `everything-evenhub` plugin repo, not an SDK source repo (as far as this pass could establish). | — |

**Cloneable without an account:** Yes for the templates repo — `git clone https://github.com/even-realities/evenhub-templates.git` (Visibility: Public, MIT, created 2026-04-17). The SDK, CLI and simulator are public npm packages installable without any account. An Even Realities account is only needed for `evenhub login` (upload/create/testers) and for the developer portal.

**Install (no account needed):**

```bash
npm install -g @evenrealities/evenhub-cli @evenrealities/evenhub-simulator
npm install @evenrealities/even_hub_sdk@latest   # per-project, not global
```

Source: https://hub.evenrealities.com/docs/get-started/quickstart/install-tools

Node requirement for the CLI: Node 20.17+ / 22.13+ / 23.5+. Source: https://hub.evenrealities.com/docs/cli

---

## 2. How to build an app for Even G2

**App model:** "Today, one surface is live: **plugins**. They are web apps, written in HTML, CSS, and JavaScript or TypeScript, glued to the glasses by the Even Hub SDK. Bring any stack — Vite, React, plain JS." Source: https://hub.evenrealities.com/docs

**Architecture:** "Your app is a standard HTML + TypeScript web page running inside a Flutter WebView hosted by the Even companion app." / "Web App (your code) <-> EvenAppBridge (SDK) <-> Even App (host) <-> G2 Glasses". Source: https://github.com/even-realities/everything-evenhub/blob/HEAD/plugins/everything-evenhub/skills/sdk-reference/SKILL.md

**Supported languages/frameworks:** Plain HTML/CSS/JS or TypeScript, any stack (Vite, React). There is no proprietary language or engine. Source: https://hub.evenrealities.com/docs (overview) and https://extentos.com/docs/ecosystem/platforms/even-realities

### Scaffold — two routes

Route A (by hand):

```bash
npm create vite@latest my-first-app -- --template vanilla-ts
cd my-first-app
npm install
npm install @evenrealities/even_hub_sdk@latest
evenhub init
```

(`evenhub init` creates `app.json`; it does not scaffold the Vite project.) Source: https://hub.evenrealities.com/docs/get-started/quickstart/first-app

Route B (template):

```bash
npx degit even-realities/evenhub-templates/minimal my-first-app
cd my-first-app
npm install
```

Source: https://hub.evenrealities.com/docs/get-started/quickstart/first-app

### Project structure (minimal app)

```
my-first-app/
├── src/
│   └── main.ts            ← your app's entry point
├── public/
│   └── icon.png           ← greyscale app icon (24×24)
├── index.html             ← Vite HTML entry - keep as-is
├── package.json
├── vite.config.ts         ← Vite config - keep as-is for now
├── tsconfig.json
└── app.json               ← Even Hub manifest (required for packaging)
```

"The only Even-specific file is `app.json` (the manifest). Everything else is standard Vite." Source: https://hub.evenrealities.com/docs/get-started/quickstart/first-app

### app.json — full format

Minimal example (from the quickstart):

```json
{
  "package_id": "com.exampleco.exampleapp",
  "name": "My First App",
  "version": "0.1.0",
  "edition": "202601",
  "min_sdk_version": "0.0.12",
  "entrypoint": "index.html",
  "permissions": [],
  "supported_languages": ["en"]
}
```

Source: https://hub.evenrealities.com/docs/get-started/quickstart/first-app

Full template from `evenhub init` (packaging docs):

```json
{
  "package_id": "com.example.g2demo",
  "edition": "202601",
  "name": "G2 Demo",
  "version": "0.1.0",
  "min_app_version": "2.2.6",
  "min_sdk_version": "0.0.7",
  "entrypoint": "index.html",
  "permissions": [
    {
      "name": "network",
      "desc": "This app needs to access the network in order to ...",
      "whitelist": ["https://example.com"]
    },
    {
      "name": "location",
      "desc": "This app needs to access the location in order to ..."
    }
  ],
  "supported_languages": ["en"]
}
```

Source: https://hub.evenrealities.com/docs/ship/packaging

**Field reference** (source: https://hub.evenrealities.com/docs/ship/packaging):

| Field | Type | Required | Rules |
|---|---|---|---|
| `package_id` | string | Yes | Reverse-domain (e.g. `com.yourname.appname`). Each segment must start with a lowercase letter, only lowercase letters or numbers. Minimum two segments. No hyphens. |
| `edition` | string | Yes | Must be `"202601"` (current edition). |
| `name` | string | Yes | **20 characters or fewer.** Must not contain "Even" (case-insensitive) — auto-rejected as first-party impersonation. |
| `version` | string | Yes | Semver `x.y.z` (e.g. `"1.0.0"`). No `v` prefix, no pre-release suffix. |
| `min_app_version` | string | No | Minimum Even Realities App version. **Derived at pack time from your SDK version** — you don't set it by hand; declare only to pin a stricter floor. CLI stamps the higher of your value and the SDK floor. |
| `min_sdk_version` | string | Yes | Minimum SDK version required (e.g. `"0.0.14"`). |
| `entrypoint` | string | Yes | Path to your HTML entry file relative to the build folder (e.g. `"index.html"`). Must exist inside the build folder or packing fails. |
| `permissions` | array | Yes | Array of permission objects (see below). Can be empty `[]`. |
| `supported_languages` | array | Yes | Language codes. Valid: `en`, `de`, `fr`, `es`, `it`, `zh`, `ja`, `ko`. |

**Permissions format** — an **array of objects**, not a key-value map (source: https://hub.evenrealities.com/docs/ship/packaging):

| Key | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | One of: `network`, `location`, `g2-microphone`, `phone-microphone`, `album`, `camera` |
| `desc` | string | Yes | Human-readable reason, **1–300 characters** |
| `whitelist` | string[] | `network` only | List of allowed domains. Optional, defaults to `[]`. |

Example with every permission name (source: https://hub.evenrealities.com/docs/ship/packaging):

```json
"permissions": [
  { "name": "network", "desc": "Fetches weather data from the API.", "whitelist": ["https://api.weather.com"] },
  { "name": "location", "desc": "Shows nearby points of interest on the display." },
  { "name": "g2-microphone", "desc": "Enables voice commands for hands-free control." },
  { "name": "phone-microphone", "desc": "Captures a voice note when the user taps record." },
  { "name": "album", "desc": "Lets the user pick a photo to send to the glasses." },
  { "name": "camera", "desc": "Lets the user capture a photo to send to the glasses." }
]
```

"Declare only the permissions you actually use — unused entries are flagged at review." Source: https://hub.evenrealities.com/docs/ship/packaging

### Main entry file & minimal SDK init code

Entry point is `src/main.ts` (Vite entry `index.html` loads it). Minimal working example, verbatim from the docs (source: https://hub.evenrealities.com/docs/get-started/quickstart/first-app):

```typescript
import {
  waitForEvenAppBridge,
  TextContainerProperty,
  TextContainerUpgrade,
  CreateStartUpPageContainer,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'

// Wait for the bridge to be ready before doing anything else.
// In the simulator this resolves immediately; on hardware it waits
// for the WebView to initialize the SDK bridge.
const bridge = await waitForEvenAppBridge()

// Build a single text container that fills the visible canvas (576×288).
const mainText = new TextContainerProperty({
  xPosition: 0,
  yPosition: 0,
  width: 576,
  height: 288,
  borderWidth: 0,
  borderColor: 5,
  paddingLength: 4,
  containerID: 1,
  containerName: 'main',
  content: 'Hello from G2!\n\nTap to count: 0\nDouble-tap to exit',
  isEventCapture: 1,           // ← receive click events on this container
})

// Render the page. `result` is 0 on success.
const result = await bridge.createStartUpPageContainer(
  new CreateStartUpPageContainer({
    containerTotalNum: 1,
    textObject: [mainText],
  }),
)

if (result !== 0) {
  console.error('createStartUpPageContainer failed:', result)
  // 1 = invalid params, 2 = oversize, 3 = out of memory
}

// Single event subscription - all OS events arrive through onEvenHubEvent.
let count = 0
bridge.onEvenHubEvent((event) => {
  const textEvent = event.textEvent
  if (!textEvent || textEvent.containerID !== 1) return

  switch (textEvent.eventType) {
    case OsEventTypeList.CLICK_EVENT:
    case undefined: // SDK normalizes 0 to undefined in some cases
      count += 1
      bridge.textContainerUpgrade(new TextContainerUpgrade({
        containerID: 1,
        containerName: 'main',
        content: `Hello from G2!\n\nTap to count: ${count}\nDouble-tap to exit`,
      }))
      break

    case OsEventTypeList.DOUBLE_CLICK_EVENT:
      // Mode 1 shows the system exit-confirmation dialog -
      // required on the root page; silent exit (mode 0) is rejected in QA.
      bridge.shutDownPageContainer(1)
      break
  }
})
```

Key rules (source: https://hub.evenrealities.com/docs/get-started/quickstart/first-app):
- **`waitForEvenAppBridge()`** — always await before calling any other SDK method. Calling SDK methods before the bridge is ready silently no-ops.
- **`isEventCapture: 1`** — required if a container is to receive input events. Default is 0 (display-only).
- **`createStartUpPageContainer`** — call **exactly once** at startup (required for glasses-mic audio and IMU). Source: https://github.com/even-realities/everything-evenhub/blob/HEAD/plugins/everything-evenhub/skills/sdk-reference/SKILL.md
- **`shutDownPageContainer(1)`** — mode `1` shows the system exit-confirmation dialog and is **required on the root page**. Apps that exit silently with mode `0` get rejected in QA.
- `textContainerUpgrade` is the flicker-free way to update text; reserve `rebuildPageContainer` for layout changes.

**Event-type gotcha:** `OsEventTypeList.CLICK_EVENT` is `0`, and protobuf omits zero-value fields — a single tap arrives with **no `eventType` field at all** (`eventType` is `undefined`). Check explicit ids first (double-click 3, scroll-top 1, scroll-bottom 2); treat missing `eventType` as click, last. Source: https://github.com/even-realities/evenhub-templates (README, "Handling input").

---

## 3. The simulator

**What it is:** "The simulator (`v0.9.3`) lets you preview layouts and exercise logic without touching hardware." "A Node + LVGL window that mimics how containers, text, and events *look* on the glasses. It is **not** a hardware emulator. Performance, frame pacing, BLE timing, and real-device quirks are not reproduced." Source: https://hub.evenrealities.com/docs/test/simulator

**Where to get it / cost / account:** Free npm package, no account mentioned in the official docs for install or use:

```bash
npm install -g @evenrealities/evenhub-simulator
evenhub-simulator --version   # check version; upgrade with npm install -g @evenrealities/evenhub-simulator@latest
```

Source: https://hub.evenrealities.com/docs/test/simulator

**OS support — Linux: YES.** "cross-platform (macOS, Linux, Windows)". Default config paths: Linux `$XDG_CONFIG_HOME` or `$HOME/.config`; macOS `$HOME/Library/Application Support`; Windows `{FOLDERID_RoamingAppData}`. Source: https://hub.evenrealities.com/docs/test/simulator

**Account needed for the simulator?** **UNVERIFIED / conflicting.** Official simulator docs describe install and use with no login step. One community doc claims `evenhub login` is "needed for official sim & device QR", but that is not stated in the official docs. The official CLI docs say login is for creating/uploading apps; `evenhub qr` "generates QR codes locally and does not require authentication" per a community README. Treat as: simulator use itself appears account-free; login is definitely required only for upload/create/testers.

**How to run a local app in it:**

```bash
# Terminal 1 - Vite dev server
npm run dev
# Terminal 2 - Simulator (point it at the dev URL)
evenhub-simulator http://localhost:5173
```

Source: https://hub.evenrealities.com/docs/get-started/quickstart/first-app

Options include `-g/--glow`, `-b/--bounce default|spring`, `--automation-port <port>`, `--aid <device>` (audio input), `--print-config-path`, `--completions <shell>`. Source: https://hub.evenrealities.com/docs/test/simulator

**Headless automation (v0.7.0+):** HTTP control plane via `--automation-port 9898` — `GET /api/ping`, `GET /api/screenshot/glasses` (576×288 RGBA PNG), `GET /api/screenshot/webview`, `GET /api/console`, `POST /api/input` with actions `up|down|click|double_click|long_press|long_press_release|context_menu`. Source: https://hub.evenrealities.com/docs/test/simulator

**Screenshots:** "Clicking the screenshot button exports the glasses display as an RGBA PNG to your current working directory, with a timestamp in the filename." Source: https://hub.evenrealities.com/docs/test/simulator

**Can a demo video be recorded from it?** **UNVERIFIED — no built-in video recording found in the official simulator docs.** The simulator offers PNG screenshots (button + automation API) but no documented video-recording feature. A demo video would need OS-level screen capture (e.g. OBS / ffmpeg screen grab) of the simulator window — that workflow is not documented by Even. Note the hackathon explicitly accepts "a demo video of up to 3 minutes, running in the simulator or on G2" (source: https://dorahacks.io/hackathon/even-realities/detail), so screen-capturing the simulator is an accepted demo path.

**Simulator caveats** (source: https://hub.evenrealities.com/docs/test/simulator): display rendering isn't pixel-perfect with hardware; list scrolling focus can differ; image processing faster than hardware and doesn't enforce on-device size limits; LZ4 compression path not validated; status events aren't emitted (user/device profiles hardcoded); audio recording does not work in the simulator (the `EvenAppBridge` audio API is only available inside the Even Realities App's WebView on real hardware — per https://github.com/kingkomolafe28-gif/g2-caduceus/blob/HEAD/app/README.md).

---

## 4. .ehpk packaging

**What it is:** An `.ehpk` is the packaged build bundle: "Bundles the `app.json` metadata and the entire built project folder; format is opaque (WASM-packed, no documented internal structure)." Produced by the CLI's internal WASM packer. Source: https://github.com/p-kjdeprow/ai_scaffolding/blob/HEAD/skills/g2-dev-toolchain/SKILL.md

**Exact steps** (source: https://hub.evenrealities.com/docs/ship/packaging):

```bash
# Step 1: Build your web app (produces dist/ or build/)
npm run build

# Step 2: Pack into .ehpk
evenhub pack app.json dist -o myapp.ehpk
```

| Argument | Description |
|---|---|
| `app.json` | Path to your manifest file |
| `dist` | Path to your **built** output folder |
| `-o myapp.ehpk` | Output filename (defaults to `out.ehpk`) |
| `--no-ignore` | Include hidden files (dotfiles) — excluded by default |
| `-c`, `--check` | Check if your `package_id` is available on Even Hub (requires login) |
| `--sdk-ver <version>` | SDK version built against; CLI reads its `minAppVersion` from npm and stamps it as the `.ehpk` floor. Omit to use latest published SDK. Recommended: `evenhub pack app.json dist --sdk-ver 0.0.14` |
| `--enforce-manual-version` | Stamp `min_app_version` from `app.json` as-is, even below the SDK floor. Local testing only; not submittable. |

"The `entrypoint` in your `app.json` must point to a file that **exists inside the build folder**." Pack exit 0 = success; exit 9 = local validation failed, nothing written. Source: https://hub.evenrealities.com/docs/ship/packaging and https://github.com/even-realities/everything-evenhub/blob/main/plugins/everything-evenhub/skills/build-and-deploy/SKILL.md

**Security warning from the docs:** "Never bundle secrets or API keys into the `.ehpk`. Once a build is published, anyone can extract its contents. Move third-party keys behind a server-side proxy you control." Source: https://hub.evenrealities.com/docs/ship/packaging

**~10 MB size cap:** mentioned in a community submission checklist as a reviewer rule — **UNVERIFIED** against official docs in this pass. Source (community, not official): https://github.com/oggunderscore/even-development/blob/HEAD/CLAUDE.md

---

## 5. Sample / template app

- **Repo (Public, MIT):** https://github.com/even-realities/evenhub-templates
- **Clone commands:**

```bash
# Recommended — single template, no git history:
npx degit even-realities/evenhub-templates/minimal my-app
cd my-app
npm install
npm run dev

# Or clone the whole repo:
git clone https://github.com/even-realities/evenhub-templates.git
cp -r evenhub-templates/asr my-app
cd my-app && npm install
```

Source: https://github.com/even-realities/evenhub-templates

**What the templates contain** (source: https://github.com/even-realities/evenhub-templates):

| Template | What it shows |
|---|---|
| `minimal/` | Bare base: Vite + TypeScript + Even Hub SDK + simulator. Tap counts, double-tap exits. |
| `asr/` | Live mic → speech-to-text pipeline with companion UI. Tap pauses capture, double-tap exits. STT provider is a blank stub — plug in your own. |
| `image/` | Image container rendering, tap to reload. Preprocessing/dithering optional; SDK handles grayscale conversion. |
| `text-heavy/` | Long-form text with tap-to-advance pagination. Demonstrates the 2000-char `textContainerUpgrade` path. |

Each template is a Vite + TypeScript project with the SDK pre-installed, `app.json`, `public/icon.png` (24×24 greyscale), `src/main.ts`, and a Vite config with `host: true` (LAN reachable, default port 5173).

---

## 6. Available APIs on the glasses

Hardware baseline (source: https://hub.evenrealities.com/docs): display 576×288 px per eye, monochrome green 16 levels; Bluetooth LE 5.2; 4-mic array, single stream, 16 kHz PCM; touchpads on both temples (press, double press, swipe up/down, long press and release); optional R1 ring same gestures; **no camera, no speaker**.

### Display / text
- Container-based model only: text, list, image containers placed by absolute pixel coordinates. "The glasses don't render arbitrary HTML… No CSS, no flexbox, no DOM." Source: https://hub.evenrealities.com/docs/build/display
- Canvas 576×288 per eye, 4-bit greyscale (16 green levels), origin top-left. Source: https://hub.evenrealities.com/docs/build/display
- Per page: max **4 image + 8 other containers** (12 total); exactly **one** container has `isEventCapture: 1`. Source: https://hub.evenrealities.com/docs/build/display
- Text limits: `createStartUpPageContainer` **1,000 chars**; `textContainerUpgrade` **2,000 chars**; `rebuildPageContainer` **1,000 chars**. Full-screen text container holds roughly **400–500 characters**. Plain text, left/top aligned, no font-size/bold/italic control; `textColor` 0–4 = five brightness levels (SDK 0.0.14+). Source: https://hub.evenrealities.com/docs/build/display
- Lists: max **20 items**, max **64 chars per item**, no in-place updates (rebuild whole page). Source: https://hub.evenrealities.com/docs/build/display
- Images: max **288×144 px** per container, 4-bit greyscale; cannot send during `createStartUpPageContainer` — create placeholder, then `updateImageRawData`; no concurrent image sends; LZ4-compressed in transit (SDK 0.0.12+); image sends paced at **100 ms**; full-screen image refresh ≈ **800 ms** in testing. Source: https://hub.evenrealities.com/docs/build/display
- Refresh rate: **UNVERIFIED from official docs.** Secondary source states G2 display is 60 Hz (source: https://extentos.com/docs/ecosystem/platforms/even-realities). What the official docs do establish: text updates via `textContainerUpgrade` are flicker-free; full image refresh ~800 ms — so no animation on the glasses display in practice.

### Notifications
- **No notifications API in the SDK.** There is no push/notification method in the SDK reference; the bridge exposes inputs, mic, location, photo picker/camera, device/user info, local storage. Source: https://hub.evenrealities.com/docs/build/device-apis
- **No access to other apps' notifications:** "No access to other apps' notifications. Talk to the service directly through its API." and "One app on screen at a time. While your app is open, it can show live data and take input. When the user switches away, it cannot show anything or pop up alerts." Source: https://dorahacks.io/hackathon/even-realities/detail
- An app can show its own live data while open (polled/fetched by the app itself).

### Audio
- Capture from glasses 4-mic array or phone mic: `bridge.audioControl(true, AudioInputSource.Glasses)`. PCM delivered as `audioEvent` in `onEvenHubEvent`, `event.audioEvent.audioPcm` (Uint8Array), 16 kHz mono, 10 ms frames. Simulator audio: 16,000 Hz, signed 16-bit LE PCM, 100 ms per event (3,200 bytes / 1,600 samples). Source: https://hub.evenrealities.com/docs/build/device-apis and https://hub.evenrealities.com/docs/test/simulator
- **No audio output / speaker / TTS on the glasses** (no speaker hardware). No Even AI / LLM / STT / TTS API in the public SDK — "Bring your own speech-to-text. The SDK gives you raw microphone audio: send it to your own server (e.g. Whisper)." Source: https://dorahacks.io/hackathon/even-realities/detail ; also https://github.com/hmmhmmhm/sandevistan/blob/HEAD/docs/research/2026-07-25-even-hub-development-research.md

### Sensors / inputs
- G2 temple touchpads + optional R1 ring: press, double press, swipe up/down, long press + release (long press needs SDK 0.0.14+ / Even App 2.2.9+). Events: `CLICK_EVENT` 0, `SCROLL_TOP_EVENT` 1, `SCROLL_BOTTOM_EVENT` 2, `DOUBLE_CLICK_EVENT` 3, `LONG_PRESS_EVENT` 9, `LONG_PRESS_RELEASE_EVENT` 10. Source: https://hub.evenrealities.com/docs/build/device-apis
- IMU: exposed via SDK (`ImuReportPace` P100–P1000 pacing codes); exposes x/y/z only, no official coordinate system/units/accuracy spec. Source: https://hub.evenrealities.com/docs/build/device-apis and https://github.com/hmmhmmhm/sandevistan/blob/HEAD/docs/research/2026-07-25-even-hub-development-research.md
- Location: one-shot `getAppLocation` and continuous `startAppLocationUpdates` + `onAppLocationChanged`. Source: https://hub.evenrealities.com/docs/build/device-apis
- Photo: `pickImageFromAlbum()` (needs `album` permission), `captureImageFromCamera()` (needs `camera` permission). Source: https://hub.evenrealities.com/docs/build/device-apis
- Device/user info: `getDeviceInfo()` (glasses model, serial, status; null if no device), `getUserInfo()` (uid, name, avatar URL, country). Local storage: `setLocalStorage(key, value)` / `getLocalStorage(key)`. Source: https://github.com/even-realities/everything-evenhub/blob/HEAD/plugins/everything-evenhub/skills/sdk-reference/SKILL.md

### Network — can the app call public HTTP APIs?
**Yes, with two conditions:**
1. The domain must be listed in the `app.json` `network` permission `whitelist` (one origin each, no wildcards, HTTPS for production).
2. The remote API must return correct CORS headers (`Access-Control-Allow-Origin`, etc.) — "The `app.json` `network` whitelist is an **Even-side permission check**… It does **not** bypass CORS." Source: https://hub.evenrealities.com/docs/get-started/architecture
- FAQ: "Can I `fetch()` arbitrary URLs? **No.** The domain must be in your `app.json` `network` whitelist." "Can I open a WebSocket? **Yes** — same whitelist rules. Expect drops when the WebView backgrounds." Source: https://hub.evenrealities.com/docs/reference/faq
- Hackathon guidance: "External calls must be whitelisted in `app.json` and pass CORS. Route API calls through your own server and never ship API keys inside the app." "Sign-in: Google sign-in does not work inside the WebView. Use a separate login page or a pairing code." Source: https://dorahacks.io/hackathon/even-realities/detail
- Note: community reports that WebSocket handshakes can fail opaquely inside the EvenHub WebView even when the same URL works from Node/desktop browsers; chunked HTTP POST via `fetch()` is the verified workaround — **UNVERIFIED** against official docs (community only). Source: https://github.com/tntpsu/cue/blob/HEAD/KNOWN_QUIRKS.md

---

## 7. Submission / publishing path

### Even Hub store path (general)
Workflow (source: https://hub.evenrealities.com/docs):

```
1. Write code         Standard web app (Vite + SDK)
2. Preview locally    evenhub-simulator http://localhost:5173
3. Preview on device  evenhub qr --url <your-dev-server-url>
4. Package and test   pack → create (first build) or upload → beta testing
5. Submit and publish Complete the listing and review in the developer portal
```

CLI distribution commands (source: https://hub.evenrealities.com/docs/cli):

```bash
evenhub login                                            # interactive sign-in (account required)
evenhub init                                             # create app.json
npm run build
evenhub pack app.json dist -o my-app.ehpk
evenhub create my-app.ehpk --name "My App" --tagline "One line about it"   # first build: registers app + uploads
evenhub upload my-app.ehpk -m "Describe what changed"   # later versions
evenhub promote 1.0.0 --to beta                         # beta channel
evenhub testers add tester@example.com
```

Build state machine (source: https://hub.evenrealities.com/docs/ship/app-submission): `Private` (only you) → `Beta` (Active testers, one beta slot per app) → submit for review in portal → `In Review` → `Approved`/`Rejected` → `Published` (immutable; fix-forward only, publish a higher version). Submitting for review, publishing, cancelling review and editing a published listing happen **in the portal only**; upload/promote/delist run from CLI or portal. Beta testing is the only mode identical to a published app (survives locked phone); QR sideload dies when the WebView backgrounds.

### Hackathon submission path (Heads Up, DoraHacks)
**An `.ehpk` is NOT required for the hackathon submission — it is optional.** What to submit (source: https://dorahacks.io/hackathon/even-realities/detail):

- ✅ A public GitHub/GitLab repository with a README that explains setup
- ✅ A demo video of up to 3 minutes, running in the simulator or on G2
- ✅ A short description: the problem, who it is for, how it works, and the track
- ➕ Optional: a packaged `.ehpk` build

Deadline: **Nov 29, 2026, 23:59 Dubai time (GMT+4)**. Build week Nov 23–29, 2026. Demo Day Dec 3, 14:00–18:00, Daos Hub, Dubai (finalists can demo remotely). Prizes: $10,000 USDT for 10 winners + up to 10 pairs of G2. Source: https://dorahacks.io/hackathon/even-realities/detail

Rules of note: teams of 1–4; build during the hackathon (open-source libraries and existing APIs allowed; README must say what existed before Nov 23); use only the apps listed in your track; demos use testnet/paper trading/read-only data, no user funds, no financial advice, never commit API keys. Source: https://dorahacks.io/hackathon/even-realities/detail

---

## UNVERIFIED items (could not be confirmed from official sources)

1. **SDK source repository on GitHub** — no public SDK source repo found; SDK is distributed via npm only (as far as established).
2. **Simulator requiring an Even account** — official docs show no login for the simulator; one community doc claims login is needed for the official sim. Unresolved conflict.
3. **Built-in video recording from the simulator** — no such feature in official docs; only PNG screenshots (button + automation API). Demo video presumably via OS screen capture; that workflow is undocumented by Even.
4. **G2 display refresh rate (60 Hz)** — stated only by a secondary source (Extentos); not in the official docs pages read. Official docs establish only ~800 ms full-screen image refresh and flicker-free text updates.
5. **~10 MB .ehpk size cap** — mentioned only in a community submission checklist, not verified against official docs.
6. **WebSocket unreliability inside the EvenHub WebView** — community-reported (Cue project); official FAQ says WebSocket is allowed with the same whitelist rules.
7. **npm pages** for the three packages could not be fetched in this pass (npmjs.com returned HTTP 403 to the fetcher); versions above come from the official docs pages, not npm directly.
