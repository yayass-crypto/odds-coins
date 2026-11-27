# Odds & Coins

Glanceable crypto companion for Even Realities G2 smart glasses — **Track 02
(Crypto & DeFi)**, Even Realities Hackathon, build week 23–29 Nov 2026.

One glance, one idea: **price vs crowd odds**. Live CoinGecko prices sit next to
live Polymarket Yes/No odds on the same 576×288 monochrome screen, so you can
see in a second whether the crowd agrees with the price. 100% paper — no funds,
no trades, no financial advice.

## Screens (Day 2 + Day 3 — done)

1. **Ticker** — top 8 coins, price + 24h%. Tap cycles selection, scroll-down
   opens Detail, long-press opens Trade.
2. **Detail** — selected coin: price + 24h% plus the best-matching Polymarket
   market with Yes/No odds.
3. **Trade** — paper portfolio ($10,000 virtual, stored on-device). Tap buys
   $100 of the selected coin, scroll-down sells $100, long-press opens Alerts.
4. **Alerts** — price alerts (Telegram delivery by the bot). Tap creates an
   "above +5%" alert, scroll-down a "below −5%" alert, long-press deletes
   the latest alert.

Coming Thu 26 Nov (now Fri 27 Nov): Groq one-line digest + Digest screen.

## Architecture

```
G2 (576x288 mono-green, tap/ring) → Even Hub SDK 0.0.14 → Vite+TS app (app/)
  → fetch() to ONE whitelisted backend domain (app.json network whitelist)
  → Backend (Node, server/ — stateless, free Render host)
     ├─ GET /api/prices  → CoinGecko /simple/price (Demo key server-side, 60s cache)
     ├─ GET /api/markets → Polymarket Gamma /events?tag_slug=crypto (no key, 120s cache)
     ├─ POST /api/alerts → Telegram Bot API sendMessage (token server-side) [Wed]
     └─ GET /api/digest  → Groq one-liner (key server-side, cached) [Thu]
Local storage (SDK): watchlist, paper portfolio, alerts
```

## Setup

```bash
# Backend (needs COINGECKO_API_KEY — free Demo key from coingecko.com/en/api)
cd server && npm install && COINGECKO_API_KEY=<key> npm start   # :3001

# App (Vite dev server + simulator, headless)
cd app && npm install && npm run dev            # :5173
xvfb-run -a node node_modules/@evenrealities/evenhub-simulator/bin/index.js \
  http://127.0.0.1:5173 --automation-port 9898
curl http://127.0.0.1:9898/api/screenshot/glasses -o shot.png   # 576x288 PNG

# Pack
cd app && npm run build && npx evenhub pack app.json dist -o odds-coins.ehpk --sdk-ver 0.0.14
```

See `server/DEPLOY.md` for the free Render deploy steps, and
`server/README.md` for endpoint details.

## Pre-existing work (disclosure, as required by the hackathon rules)

The scaffold in `app/` is the official Even Hub `minimal` template (MIT,
https://github.com/even-realities/evenhub-templates) with `app.json` adapted
(package_id `com.yass.oddscoins`, name "Odds & Coins", SDK 0.0.14) and the
toolchain validated (build + pack + simulator) on **20 Nov 2026**, before the
build window. All app features, the backend, the Telegram bot integration, and
the demo are written during the build week, **23–29 Nov 2026**.

## Safety

- API keys live server-side only — never in the app or the `.ehpk`.
- No user funds, no real trades, no financial advice. Paper portfolio only.
- Telegram bot only messages chats that pressed Start.
