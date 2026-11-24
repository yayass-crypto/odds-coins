# Even Realities kickoff — readiness check (Mon 23 Nov 2026, ~13:10 WIB)

Kickoff TODAY 15:00 WIB. Checked by subagent; no registrations, no submissions, no keys in this file.

## 1. Telegram bot — ALIVE, now on systemd

- **Found dead:** the nohup process from 08:26 had died ~10:08 WIB (last log line a
  transient egress-proxy `RemoteDisconnected` during a poll; the loop catches poll
  errors, so the death itself was external — most likely a VM restart).
  Bot was down ~3 h; no user messages were missed in that window
  (getUpdates offset 436160004, no pending updates on restart).
- **Service installed:** `/etc/systemd/system/odds-coins-bot.service`
  (`odds-coins-bot`, enabled, `Restart=always`, `RestartSec=5`).
  Logs still append to `app/bot/bot.log`.
- **Two fixes needed to make it start cleanly:**
  1. `HOME` — systemd runs as root (`~` = `/root`), but the connector helpers
     live under `/home/hatch/workspace/...`. Fixed via env file (below).
  2. **Egress proxy vars** — the service environment had no `*_proxy` vars, so
     urllib went direct and failed `SSL WRONG_VERSION_NUMBER`. Fixed via
     `/etc/odds-coins-bot.env` (mode 600, root-only), generated from the live
     shell env — values never printed. Caveat: if the proxy credential rotates,
     regenerate that file and `systemctl restart odds-coins-bot`.
- **Verified live (~13:10 WIB):**
  - `systemctl is-active` → active; `NRestarts=0`; PID alive, helper child
    long-polling (`telegram.py updates 436160004 25`).
  - `telegram.py getme` → ok, id 9027875448, @oddsandcoins_bot.
  - `telegram.py updates 436160004 5` → ok, `[]` (no pending updates).
  - `bot.py --self-test` → 7/7 handlers, exit 0, sent nothing:
    /start, /help, /ping, `/price bitcoin` → **$61,655.00 live**,
    `/odds` → 5 live Polymarket crypto markets (Ya 50%),
    `/ask` → Groq Indonesian answer, unknown command fallback OK.
- Alert destination registered: chat 1348989048 (@akuyass). A second chat
  (8114088975, kyoo12345) is also registered in state.json.

## 2. G2 toolchain — ready

- `app/node_modules/.bin/`: evenhub, vite, tsc present.
- SDK `@evenrealities/even_hub_sdk` 0.0.14, CLI 0.2.0, simulator 0.9.3.
- `app.json`: `com.yass.oddscoins`, "Odds & Coins", edition 202601,
  min_sdk_version 0.0.14, entrypoint index.html, permissions [] (add `network`
  whitelist on Day 1 once the backend host is chosen).
- `app/odds-coins-0.1.0.ehpk` (39,557 B, Nov 20 pack) still present.
- `templates/` NOT touched (execution-risk block from 23 Nov 08:24 respected).

## 3. Build plan (from PREP.md + research files)

**Concept:** Track 02 "Odds & Coins" (`com.yass.oddscoins`) — glanceable crypto
companion: CoinGecko prices + Polymarket odds side by side ("price vs crowd
odds"), $10,000 paper portfolio (one-tap buy/sell, P&L in local storage),
price alerts delivered via this Telegram bot (also a shot at the $1,000 Best
Telegram Integration prize — one cash prize per project, so alternate path),
Groq one-line digest as stretch. 100% paper, no funds, no financial advice.

**Architecture:**
```
G2 (576x288 mono-green, tap/ring/mic) → Even Hub SDK 0.0.14 → Vite+TS app (app/)
  → fetch() to ONE whitelisted backend domain (app.json network whitelist)
  → Backend (Node, server/ — build Nov 23–29, free host TBD Day 1)
     ├─ GET /api/prices  → CoinGecko /simple/price (Demo key server-side, 60 s cache)
     ├─ GET /api/markets → Polymarket Gamma /events?tag_slug=crypto (no key, 120 s cache)
     ├─ POST /api/alerts → Telegram Bot API sendMessage (token server-side)
     ├─ GET /api/digest  → Groq Llama 3.1 8B one-liner (key server-side, cached)
     └─ POST /api/stt    → Groq Whisper (STRETCH — voice commands)
Local storage (SDK): watchlist, paper portfolio, alerts
```

**Screens (one thing per screen, tap cycles, ring scrolls, double-tap back):**
1. Ticker — top 8 coins, price + 24h% (list container, max 20 items × 64 chars).
2. Detail — coin price/24h + related Polymarket market with Yes/No odds.
3. Paper — $10,000 virtual balance, holdings, P&L; tap = buy preset slice.
4. Alerts — set price alert (preset thresholds via ring); Telegram delivery status.
5. Digest (stretch) — AI one-liner, tap to refresh.

**Day-by-day (Nov 23–29):**
- Mon 23 (Day 1, kickoff 15:00) — user: DoraHacks signup/registration (done
  23 Nov morning per parent context); agent: create public GitHub repo
  `odds-coins`, backend skeleton (`/api/prices` + 60 s cache), app screens
  skeleton, pick free backend host (Render/Fly/Railway) + set app.json whitelist.
- Tue 24 — Polymarket `/api/markets` + Ticker/Detail screens in simulator;
  verify live odds/prices end-to-end; screenshot script via simulator automation API.
- Wed 25 — paper portfolio + Alerts UI; Telegram `/api/alerts` end-to-end.
- Thu 26 — Groq digest + Digest screen; Whisper STT if time (cut if it slips —
  tap/ring is primary; simulator audio does not work).
- Fri 27 — UX polish for 576×288, simulator test matrix, verify `.ehpk` pack,
  backend deployed on free host.
- Sat 28 — record ≤3 min demo video (ffmpeg screen capture of simulator under
  xvfb — verify tooling Day 5), README (setup + pre-existing-work disclosure),
  final `.ehpk`, dry run of DoraHacks submission form.
- Sun 29 — buffer; submit in the evening, well before Mon 30 Nov 02:59 WIB.

**Key constraints / risks:**
- README must disclose pre-Nov-23 work (official `minimal` template scaffold).
- Keys server-side only, never in the app/`.ehpk`; CoinGecko plan 30 calls/min,
  10k/month cap → server-side caching mandatory.
- No G2 hardware; simulator only (audio/STT untestable — stretch only).
- Demo video needs OS screen capture (simulator has PNG screenshots only).
- Judging: Usefulness 30%, Read+Write 25%, Technical 20%, UX 15%, Business/safety 10%.
- Prizes: Track 02 1st $1,250 + G2; 2nd $500; Grand $2,000; Best Telegram $1,000.
- Submission: public repo + README + ≤3 min demo video + short description;
  deadline Mon 30 Nov 02:59 WIB; Demo Day Thu 3 Dec 17:00–21:00 WIB.
