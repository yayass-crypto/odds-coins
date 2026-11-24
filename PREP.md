# Even Realities Hackathon — PREP report

**Prepared:** Fri 2026-11-20 (prep only — build window has NOT started)
**Event:** "Heads Up: Even Realities Hackathon by TVM Ventures & Daos Hub"
**Official page:** https://dorahacks.io/hackathon/even-realities/detail
**Status:** research + scaffold verified locally. No accounts created, no sign-ins, no submissions, no GitHub repo created yet (per rules, the project is built Nov 23–29).

## 1. Verified facts (each with source)

### Event & prizes
- 7-day online hackathon building apps for Even Realities G2 smart glasses. Organizers: Even Realities, TVM Ventures, Daos Hub. — https://dorahacks.io/hackathon/even-realities/detail
- Prize pool **$10,000 USDT for 10 winners + up to 10 pairs of G2**. Split: Grand $2,000 + 2× G2; 1st per track $1,250 + 1–2× G2 (×4 tracks = $5,000); 2nd per track $500 (×4 = $2,000); Best Telegram integration $1,000 (any track). One cash prize per project. — https://dorahacks.io/hackathon/even-realities/detail
- Every finalist also gets a VC fast-track pitch, a Demo Day slot, and merch. — https://dorahacks.io/hackathon/even-realities/detail
- Cash paid in **USDT within 7 days of Demo Day** (~by Dec 10). G2 units shipped worldwide after the event (refurbished, working, non-prescription lenses). — https://dorahacks.io/hackathon/even-realities/detail

### Schedule (all page times Dubai GMT+4; WIB = Dubai +3h, verified with `date -d`)
- Registration opened Nov 18. — https://dorahacks.io/hackathon/even-realities/detail
- Kickoff / build starts: **Mon Nov 23, 12:00 Dubai = 15:00 WIB**. — https://dorahacks.io/hackathon/even-realities/detail
- Build window: **Nov 23–29, 2026**. — https://dorahacks.io/hackathon/even-realities/detail
- **Submission deadline: Nov 29, 23:59 Dubai = Mon Nov 30, 02:59 WIB** (page metadata 2026-11-29T19:59:00Z). — https://dorahacks.io/hackathon/even-realities/detail
- Judging / finalists: Nov 30 – Dec 1. — https://dorahacks.io/hackathon/even-realities/detail
- **Demo Day: Thu Dec 3, 14:00–18:00 Dubai = 17:00–21:00 WIB**, Daos Hub Dubai; finalists may demo remotely. — https://dorahacks.io/hackathon/even-realities/detail

### Teams & submission
- Teams of **1–4, solo allowed**, one team per person, worldwide. — https://dorahacks.io/hackathon/even-realities/detail
- Submit on the DoraHacks page before the deadline: **public GitHub/GitLab repo + README explaining setup; demo video ≤3 min (simulator or real G2); short description (problem, audience, how it works, track)**. Optional: packaged `.ehpk` build. Screenshots, live demo link, pitch deck NOT listed as required. — https://dorahacks.io/hackathon/even-realities/detail
- **"Build during the hackathon. Open-source libraries and existing APIs are allowed; say in your README what existed before Nov 23."** Pre-built work is not banned but must be disclosed. No rule on the page addresses AI-generated code. — https://dorahacks.io/hackathon/even-realities/detail
- **"Use only the apps listed in your track."** — https://dorahacks.io/hackathon/even-realities/detail

### Tracks
- **01 Messaging & News** — Telegram, Discord, Slack. Read: new messages, short digests of Telegram channels/crypto communities. Write: reply by voice, or approve an AI-drafted reply. — https://dorahacks.io/hackathon/even-realities/detail
- **02 Crypto & DeFi** — Polymarket, Kalshi, Hyperliquid, CoinGecko, Gram Wallet, Trust Wallet. Read: live odds, prices, positions, wallet balances. Write: place a testnet bet or order by voice, confirm with one tap. — https://dorahacks.io/hackathon/even-realities/detail
- **03 Exchanges & Stocks** — Binance, OKX, Bybit, Coinbase, Interactive Brokers, Alpaca. — https://dorahacks.io/hackathon/even-realities/detail
- **04 AI Assistants & Work** — ChatGPT, Claude, Gemini, Perplexity, Gmail, Google Calendar, Outlook, Notion. Read: inbox triage, pre-meeting brief, answers from notes. Write: reply to email, add a task, move a meeting by voice. — https://dorahacks.io/hackathon/even-realities/detail
- **Special prize: Best Telegram integration, $1,000, open to any track.** — https://dorahacks.io/hackathon/even-realities/detail

### Judging (weights published)
1. Usefulness on G2 — **30%** (solves a real moment, glanceable, hands-free)
2. Read and write — **25%** (users act, not just read; fast write: short phrase, one tap, ring, smart defaults/AI drafts)
3. Technical execution — **20%** (works end to end, reliable, clean code)
4. UX for display and voice — **15%** (clear on 576×288 monochrome, natural by voice)
5. Business potential & safety — **10%** (real users/demand, careful with data and money)
— all from https://dorahacks.io/hackathon/even-realities/detail
- Judges from Even Realities, TVM Ventures, partner VCs, sponsors, Daos Hub (no names published). — https://dorahacks.io/hackathon/even-realities/detail

### Demo & safety rules
- **Free simulator explicitly allowed** for building, testing, and the demo video ("No glasses needed"). — https://dorahacks.io/hackathon/even-realities/detail
- **Demos must use testnet, paper trading, or read-only data. Do not hold user funds. No financial advice. Never commit API keys or secrets.** — https://dorahacks.io/hackathon/even-realities/detail
- G2 is the display/voice/input layer; trading, custody, licensing stay with the underlying providers via their APIs. — https://dorahacks.io/hackathon/even-realities/detail

### Tech constraints (from the event page)
- App is a web app (HTML/CSS/JS/TS) in a WebView inside the Even Realities App, talking to G2 over Bluetooth via the Even Hub SDK. — https://dorahacks.io/hackathon/even-realities/detail
- Display: monochrome green, **576×288 per eye**; input: microphone, touch controls, R1 ring; no camera, no speaker. — https://dorahacks.io/hackathon/even-realities/detail
- One app on screen at a time; when the user switches away it cannot show anything or pop up alerts. No access to other apps' notifications — talk to the service directly through its API. — https://dorahacks.io/hackathon/even-realities/detail
- Bring your own speech-to-text (SDK gives raw mic audio; send to your own server, e.g. Whisper). — https://dorahacks.io/hackathon/even-realities/detail
- Use a backend — external calls must be whitelisted in `app.json` and pass CORS; route API calls through your own server and never ship API keys inside the app. — https://dorahacks.io/hackathon/even-realities/detail
- Google sign-in does not work inside the WebView — use a separate login page or a pairing code. — https://dorahacks.io/hackathon/even-realities/detail
- Design for a glance: one thing on screen, a few words, one action by tap, ring, or short phrase. — https://dorahacks.io/hackathon/even-realities/detail

### Even Hub SDK & tooling (verified against docs + installed locally)
- Docs home: https://hub.evenrealities.com/docs
- SDK `@evenrealities/even_hub_sdk` **0.0.14** (npm, public); CLI `@evenrealities/evenhub-cli` **0.2.0**; simulator `@evenrealities/evenhub-simulator` **0.9.3**. — https://hub.evenrealities.com/docs/get-started/quickstart/install-tools, https://hub.evenrealities.com/docs/cli, https://hub.evenrealities.com/docs/test/simulator
- Templates repo (Public, MIT): https://github.com/even-realities/evenhub-templates — `minimal`, `asr`, `image`, `text-heavy`. Clone: `npx degit even-realities/evenhub-templates/minimal my-app`. — https://github.com/even-realities/evenhub-templates
- Official Claude Code plugin repo (Public): https://github.com/even-realities/everything-evenhub
- app.json: `package_id` reverse-domain lowercase, `name` ≤20 chars and must NOT contain "Even", `edition` must be `"202601"`, `min_sdk_version` required, `entrypoint` must exist in build folder, `permissions` is an array of objects (`network`/`location`/`g2-microphone`/`phone-microphone`/`album`/`camera`), languages `en/de/fr/es/it/zh/ja/ko`. — https://hub.evenrealities.com/docs/ship/packaging
- Build: standard Vite + TypeScript; entry `src/main.ts`; init `await waitForEvenAppBridge()`, then `bridge.createStartUpPageContainer(...)` exactly once; text updates via `textContainerUpgrade`; `shutDownPageContainer(1)` required on root page. Glasses render only SDK containers (text/list/image) — no HTML/CSS on the lenses. — https://hub.evenrealities.com/docs/get-started/quickstart/first-app
- Simulator: free npm install, cross-platform incl. Linux, no account mentioned in official docs. Run: `npm run dev` + `evenhub-simulator http://localhost:5173`. PNG screenshot button + headless automation API (`--automation-port`, `/api/screenshot/glasses`, `/api/input`). No built-in video recording — demo video needs OS screen capture. — https://hub.evenrealities.com/docs/test/simulator
- .ehpk: `npm run build` then `evenhub pack app.json dist -o myapp.ehpk` (recommended `--sdk-ver 0.0.14`). Never bundle secrets/API keys in the .ehpk. — https://hub.evenrealities.com/docs/ship/packaging
- Display limits: text 1,000 chars at creation / 2,000 via upgrade (~400–500 visible fullscreen); lists max 20 items × 64 chars; images ≤288×144 px; max 4 image + 8 other containers/page; full image refresh ~800 ms. — https://hub.evenrealities.com/docs/build/display
- Network: `fetch()` works for public HTTP APIs only if the domain is in `app.json` network whitelist AND the API returns proper CORS headers; WebSocket allowed per FAQ with same whitelist. — https://hub.evenrealities.com/docs/get-started/architecture, https://hub.evenrealities.com/docs/reference/faq
- No notifications API in the SDK; no speaker/TTS/LLM/STT in the SDK. Audio in: 4-mic 16 kHz PCM. — https://hub.evenrealities.com/docs/build/device-apis

### APIs for the chosen concept (verified)
- **Polymarket** public reads (Gamma `https://gamma-api.polymarket.com`, CLOB `https://clob.polymarket.com`): **no key, no auth, no account, free**; official docs confirm `"security": []` for `/events` and `/markets`. Endpoints: `GET /events` (max 50/request), `GET /markets`, `GET /events?tag_slug=crypto`. — https://docs.polymarket.com, https://onfinality.io/en/learn/is-polymarket-api-free
- **CoinGecko** Demo (free) plan: $0/month, **10,000 call credits/month**, 1 API key, no credit card; `/simple/price` covers 500+ coins in one call; free-tier data freshness ~1 min. — https://www.coingecko.com/en/api/acquisition/entry-plans?locale=hi, https://www.coingecko.com/en/api, https://www.coingecko.com/learn/best-free-crypto-api
- **Telegram Bot API**: free, one token from @BotFather, HTTPS `https://api.telegram.org/bot<token>/…`, ~1 msg/s per chat. A bot only sees chats it is a member of; no general history method. — https://core.telegram.org/bots/api
- **Groq free tier** (secondary-sourced, verify against official page during build): Llama 3.1 8B Instant — 30 req/min, 14,400 req/day, 500k tokens/day; Llama 3.3 70B — 1,000 req/day; Whisper Large V3 — 2,000 req/day. No credit card. — https://ampm-aiops.com/en/guides/groq-special-2026/ (secondary; official page console.groq.com/docs/rate-limits NOT yet opened)
- **Ollama** (local fallback): free, no key, `http://localhost:11434`, OpenAI-compatible `/v1/`; only serves the demo if the backend runs on the same machine. — https://docs.warp.dev/guides/external-tools/how-to-set-up-ollama/

### UNVERIFIED (could not be confirmed — verify during build week)
- DoraHacks signup method for this event (email vs GitHub vs wallet) and any KYC for entry or USDT payout — not stated on the event page; DoraHacks Terms of Use (Oct 2023) contains no KYC clause. — https://cdn.dorahacks.io/policy/dorahacks-terms-of-use-agreement-20231009.pdf
- Event-specific age limit; country exclusions ("Excluded Jurisdictions" mentioned in Terms without a list for this event).
- Tax on USDT prizes, payout fees, which chain USDT is paid on; whether the event uses DoraHacks Prize Safe (5% fee if so).
- Whether the sign-in-gated BUIDL submission form asks for more than the page lists (screenshots, live demo link, deck).
- Number of finalists, per-demo time limit, remote-demo format; Luma RSVP URL for Demo Day.
- CoinGecko Demo rate limit: CoinGecko's own pages disagree (30 vs 100 calls/min) — plan for 30. — https://www.coingecko.com/en/api/acquisition/entry-plans?locale=hi vs https://www.coingecko.com/en/api
- Polymarket public rate limits (undocumented; one secondary guide claims per-IP Cloudflare limits).
- Groq free-tier numbers vs official console.groq.com/docs/rate-limits page.
- Simulator needing an Even account: official docs show no login; one community doc claims login is needed (conflict — but see §5: local headless run worked with NO account).
- ~10 MB .ehpk size cap (community checklist only); 60 Hz display refresh (secondary source only); WebSocket reliability inside the EvenHub WebView (community-reported; official FAQ says allowed).
- SDK source repo on GitHub (not found; npm only).

## 2. Registration steps (to do Nov 23, at/after kickoff 15:00 WIB)

1. Create a DoraHacks account at dorahacks.io (signup method unverified — email, GitHub, or wallet; pick email + GitHub if offered). — https://dorahacks.io/hackathon/even-realities/detail
2. Open the event page and register for the hackathon; create/join the team (solo = team of 1). — https://dorahacks.io/hackathon/even-realities/detail
3. Create the public GitHub repo (see §3 disclosure note) and link it in the DoraHacks submission form.
4. Before submitting, re-check the event page for any new sponsor prizes or rule updates ("More sponsor prizes may be announced during registration"). — https://dorahacks.io/hackathon/even-realities/detail

### ONLY the user can do (agent cannot)
- **DoraHacks account signup + event registration** — needs the user's own email/GitHub/wallet and their consent. The agent must never create accounts in the user's name.
- **CoinGecko Demo API key signup** — needs an email + password (~2 min); the key lives server-side only. User signs up, then passes the key via the Secure Vault (never in chat).
- **Groq API key signup** — needs an email; free tier, no card. Same handling: key via Secure Vault only.
- **Telegram bot via @BotFather** — needs the user's Telegram account to create the bot and get its token; token via Secure Vault only. Also the user must start the bot / add it to a chat so it can deliver alerts.
- **USDT payout wallet** — when/if we win, the user provides the USDT receiving address (chain TBD — the event page does not state it; confirm at payout time).
- **Demo Day live presentation (if finalist, Thu Dec 3, 17:00–21:00 WIB)** — only the user can present live; the agent prepares the script/slides/demo flow.
- **Any KYC, if it turns out to be required** — only the user can complete identity verification (none is stated anywhere so far).

## 3. Chosen track + concept

### PICK: Track 02 — Crypto & DeFi
### App: "Odds & Coins" — `com.yass.oddscoins`

**Concept:** a glanceable crypto companion on the G2 glasses.
- **Home / Ticker:** top coins with live price + 24h change (CoinGecko), and the top Polymarket crypto markets with live Yes/No odds side by side — the glanceable moment is "price vs crowd odds" (e.g. BTC $97,400 +1.8% · Polymarket 68% "BTC above $100k by Dec").
- **Paper portfolio (the write action):** virtual $10,000 paper balance. One tap buys/sells a fixed slice, ring scrolls the amount; holdings + P&L tracked against live prices in local storage. 100% paper — explicitly allowed by the money-safety rule, zero user funds.
- **Price alerts (second write action + Telegram prize shot):** set an alert on the glasses ("alert me if BTC > $100k"); when it triggers, the backend sends it via a Telegram bot the user started. Genuine Telegram integration, competing for the $1,000 Best Telegram Integration prize as an alternate prize path.
- **AI digest (stretch):** one-line morning digest from Groq (Llama 3.1 8B, free tier) — e.g. "BTC leads, ETH lags; Polymarket odds up 4 pts". One request per digest; far inside free limits.

**Why this wins the judging mix:**
- Usefulness 30% — checking prices/odds hands-free is the canonical glasses moment; price-vs-odds is a genuinely useful glance, not a notification mirror.
- Read-and-write 25% — paper buy/sell + alert setting are fast, one-tap writes with smart defaults (fixed slices, preset thresholds), exactly what the criteria ask for.
- Technical 20% — real end-to-end: backend proxy with server-side caching (CoinGecko 10k calls/month cap, 30/min planning number; Polymarket 120s cache), whitelisted domain, no keys in the app, works in the free simulator.
- UX 15% — one thing per screen, a few words, tap/ring navigation, designed for 576×288 monochrome from the start.
- Business/safety 10% — no funds, no advice (odds/prices presented without recommendations), no personal data at all.

### Why the other concepts lose
- **Track 04 — AI daily briefing (Gmail + Calendar + Notion):** highest upside if it worked, but three separate auth systems, Gmail `gmail.readonly` is a Google RESTRICTED scope (verification + possible security assessment), Google sign-in is blocked inside the EvenHub WebView (needs a separate login page/pairing code), and the demo either exposes the user's real private email or is mock data that proves nothing about the OAuth plumbing — the hardest part. Highest risk of spending the week on auth instead of glasses UX.
- **Track 01 — Telegram + AI-drafted replies:** the Bot API cannot read the user's real inbox or history (only chats the bot was added to, only new updates); the MTProto route that could read the inbox needs a phone-number login and carries flood-wait/ban risk plus ToS questions (Telegram API terms 1.5 bars using Telegram data to train AI). The honest scope (bot chats + channel digests) is a weaker usefulness story than the crypto companion. The $1,000 Telegram prize cannot stack with a track win ("one cash prize per project"), so it is an alternate path, not additive — and the crypto concept already takes a shot at it via alerts.

## 4. Architecture sketch

```
G2 glasses (576x288 mono-green, tap / ring / mic)
   │  Even Hub SDK 0.0.14 (bridge, containers)
   ▼
Even companion app WebView  ──  Vite + TS app (app/)
   │  fetch() to ONE whitelisted backend domain (app.json network whitelist)
   ▼
Backend (Node, server/ — built Nov 23–29, free host TBD Day 1)
   ├─ GET /api/prices   → CoinGecko /simple/price (Demo key server-side, 60s cache)
   ├─ GET /api/markets  → Polymarket Gamma /events?tag_slug=crypto (no key, 120s cache)
   ├─ POST /api/alerts  → Telegram Bot API sendMessage (token server-side)
   ├─ GET /api/digest   → Groq Llama 3.1 8B one-line digest (key server-side, cached)
   └─ POST /api/stt     → Groq Whisper (STRETCH — voice commands)
Local storage (SDK setLocalStorage/getLocalStorage): watchlist, paper portfolio, alerts
```

**App screens (one thing per screen, tap cycles, ring scrolls, double-tap back):**
1. Ticker — top 8 coins, price + 24h% (list container, 20 items max, 64 chars/item).
2. Detail — selected coin: price, 24h change, related Polymarket market + Yes/No odds.
3. Paper — virtual $10,000 balance, holdings, P&L; tap = buy preset slice, ring = adjust, confirm one tap.
4. Alerts — set price alert (preset thresholds via ring); list active alerts; Telegram delivery status.
5. Digest (stretch) — AI one-liner, tap to refresh.

**app.json (already set in scaffold):** `package_id com.yass.oddscoins`, `name "Odds & Coins"` (12 chars, no "Even"), `edition "202601"`, `min_sdk_version "0.0.14"`, `entrypoint "index.html"`, `permissions []` — add the `network` permission with the backend domain whitelist on Day 1 once the host is chosen. `min_app_version` is stamped by the CLI at pack time (2.2.9 for SDK 0.0.14).

**Pre-existing-work disclosure (README must state):** the scaffold in `app/` is the official Even Hub `minimal` template (MIT, https://github.com/even-realities/evenhub-templates) with `app.json` adapted (package_id/name/SDK 0.0.14) and toolchain validated (build + pack + simulator) on Nov 20. All app features, backend, and demo are written Nov 23–29.

## 5. Day-by-day build plan (Nov 23–29, 2026)

- **Mon Nov 23 (Day 1) — Kickoff 15:00 WIB.** User: DoraHacks signup + registration; CoinGecko + Groq signups; Telegram bot via @BotFather (keys via Secure Vault). Agent: create public GitHub repo `odds-coins` (after kickoff), backend skeleton (Node, `/api/prices` with CoinGecko + 60s cache), app screens skeleton from the scaffold, choose free backend host (Render/Fly/Railway free tier) + set `app.json` network whitelist to its domain.
- **Tue Nov 24 (Day 2) — Data.** Polymarket `/api/markets` + Ticker + Detail screens in the simulator; verify live odds/prices end-to-end; screenshot script via simulator automation API (`/api/screenshot/glasses`).
- **Wed Nov 25 (Day 3) — Write actions.** Paper portfolio (local storage, buy/sell one-tap, P&L) + Alerts UI; Telegram `/api/alerts` delivery working end-to-end with the user's test bot.
- **Thu Nov 26 (Day 4) — AI + voice (stretch).** Groq digest endpoint + Digest screen; Whisper STT for voice commands if time ("buy 0.1 BTC paper", "alert BTC above 100k"). If STT slips, cut it — tap/ring is the primary input (see Risks: simulator audio does not work).
- **Fri Nov 27 (Day 5) — Polish + test.** UX pass for 576×288 (short text, one action/screen), simulator test matrix (all screens, tap/ring/double-tap), fix flicker/layout issues, verify `.ehpk` pack, backend deployed on the free host.
- **Sat Nov 28 (Day 6) — Demo + docs.** Record the ≤3 min demo video (simulator screen capture via ffmpeg under xvfb — verify tooling Day 5), README (setup + pre-existing-work disclosure), final `.ehpk` pack, end-to-end dry run of the DoraHacks submission form fields.
- **Sun Nov 29 (Day 7) — Submit.** Buffer for fixes; submit in the evening (well before the Mon Nov 30, 02:59 WIB deadline). Verify the submission is listed on the event page after submitting.

## 6. Risks

1. **KYC for payout UNVERIFIED.** Nothing on the event page or in DoraHacks Terms mentions KYC, but the payout flow (chain, wallet collection, any verification) is unstated. Mitigation: check at registration; if KYC appears, user decides (standing no-KYC rule).
2. **"One cash prize per project."** The Telegram $1,000 cannot stack with a Track 02 win — it is an alternate prize path, not additive. The concept stands on Track 02 alone.
3. **Voice/STT cannot be tested in the simulator** (audio recording does not work in the simulator; the audio API only works inside the Even App WebView on real hardware — no G2 available). Mitigation: tap/ring is the primary input; voice is a stretch feature, demoed only if hardware appears. Do not let voice block the core.
4. **CoinGecko rate limit conflict (30 vs 100/min) + 10,000 calls/month cap.** Mitigation: server-side 60s cache, one `/simple/price` call for all coins, plan for 30/min.
5. **Polymarket public rate limits undocumented.** Mitigation: 120s server-side cache (matches its 2-min CDN cache), gentle polling, no aggressive refresh.
6. **Groq free-tier numbers are secondary-sourced.** Mitigation: verify against console.groq.com/docs/rate-limits on Day 1; Ollama local is the fallback for dev (not for the hosted demo).
7. **Backend needs public hosting for judges / Demo Day remote demo** (localhost is enough for the video). Mitigation: pick a free host Day 1 (Render/Fly/Railway); keep the backend stateless so it can move hosts.
8. **Demo video has no built-in recorder** (simulator offers PNG screenshots only). Mitigation: ffmpeg screen capture of the simulator window under xvfb; verify on Day 5, record on Day 6.
9. **Template pins old SDK versions** (SDK ^0.0.10, CLI ^0.1.12, simulator ^0.7.2). Already upgraded in the scaffold to 0.0.14 / 0.2.0 / 0.9.3 (see §7); re-verify latest versions on Day 1.
10. **Simulator needed system libraries** (`libwebkit2gtk-4.1-0`, `libsoup-3.0-0`, `libjavascriptcoregtk-4.1-0` via apt) + a virtual display (`xvfb-run`) on headless Linux. Installed and verified on this VM (see §7) — but a fresh machine needs the same setup; the exact commands are in §7.
11. **Pre-existing-work rule.** The scaffold predates Nov 23 — must be disclosed in the README. All feature code is written Nov 23–29.

## 7. What is ready (verified locally Nov 20)

Scaffold location: `~/workspace/hackathons-2026-11-20/even-realities/`
- `templates/` — full official templates repo clone (Public, MIT, https://github.com/even-realities/evenhub-templates)
- `app/` — official `minimal` template, adapted: `app.json` set to `com.yass.oddscoins` / "Odds & Coins" / SDK 0.0.14; deps upgraded (SDK 0.0.14, CLI 0.2.0, simulator 0.9.3); `npm install` + `npm run build` succeed (tsc + vite, 5 modules)
- `app/odds-coins-0.1.0.ehpk` — pack verified: 39,557 bytes, `evenhub pack app.json dist -o odds-coins-0.1.0.ehpk --sdk-ver 0.0.14`, min_app_version stamped 2.2.9. (Contains template demo code only — rebuild during Nov 23–29 with the real app.)
- `simulator-proof.png` — 576×288 RGBA screenshot from the simulator automation API, proving the headless flow works
- `research-dorahacks.md`, `research-even-sdk.md`, `research-apis.md` — full research with source URLs

**Simulator headless runbook (verified on this VM):**
```bash
# System libs (one-time; needs sudo apt)
sudo apt-get update && sudo apt-get install -y libwebkit2gtk-4.1-0 libsoup-3.0-0 libjavascriptcoregtk-4.1-0
# Tools (global, no account)
npm install -g @evenrealities/evenhub-cli@0.2.0 @evenrealities/evenhub-simulator@0.9.3
# Dev server + simulator under a virtual display
cd app && npm run dev -- --host 127.0.0.1 --port 5173
xvfb-run -a evenhub-simulator http://127.0.0.1:5173 --automation-port 9898
curl http://127.0.0.1:9898/api/ping            # -> pong
curl -o shot.png http://127.0.0.1:9898/api/screenshot/glasses   # 576x288 RGBA PNG
curl -X POST http://127.0.0.1:9898/api/input -H 'Content-Type: application/json' -d '{"action":"click"}'
```
Verified Nov 20: ping `pong`, screenshot 576×288 RGBA, click input `{"ok":true}`, console shows `[EvenAppBridge] Bridge initialized`.

**Not yet done (build week):** GitHub repo creation, backend (`server/`), all app features, demo video, README, submission. No accounts exist yet for DoraHacks / CoinGecko / Groq / Telegram bot — all user-side (see §2).
