# Odds & Coins — backend

Zero-dependency Node (stdlib `http`) server for the Even Realities
hackathon entry "Odds & Coins" (Track 02, `com.yass.oddscoins`).
Serves live CoinGecko prices + Polymarket odds to the Even Hub app.

## Run locally

```bash
cd server
npm start            # listens on http://localhost:3001 (PORT env overrides)
```

No build step, no dependencies. Node >= 20 required.

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | `{"ok":true}` |
| GET | `/api/prices` | 8 coins: BTC, ETH, SOL, BNB, XRP, DOGE, ADA, TRX — `{id, symbol, name, price_usd, change_24h_pct}`. CoinGecko `/simple/price`, 60 s server cache. |
| GET | `/api/markets` | Top 8 open Polymarket crypto markets — `{event_title, question, yes_pct, no_pct, volume, liquidity}`. Gamma `/events?tag_slug=crypto`, 120 s server cache. |

CORS: `Access-Control-Allow-Origin: *` on all responses (the Even Hub
WebView fetch needs it). Preflight `OPTIONS` returns 204.

**Stale fallback:** if an upstream call fails, the endpoint returns the last
cached payload as `{"stale":true,"data":[...]}` (HTTP 200). With no cache at
all it returns HTTP 502 `{"error":"<endpoint> upstream unavailable"}`.
No API keys ever appear in responses or error messages.

## CoinGecko key — how it works

The key is **server-side only** and never shipped in the app/`.ehpk`.

- **Production (Render etc.):** set `COINGECKO_API_KEY` in the host
  dashboard to a free CoinGecko Demo API key
  (https://www.coingecko.com/en/api — free Demo plan, no credit card).
- **Local dev:** if the env var is unset, the server fetches a
  dynamic-credential surrogate for `custom.coingecko` from the local authd
  Unix socket (3 attempts with backoff — authd occasionally returns an
  empty response) and sends it as the `x-cg-demo-api-key` header; the egress
  proxy resolves the surrogate to the real Demo key. The real key is never
  visible to this process. If even that is unavailable, the server tries a
  keyless fetch, then falls back to spawning the `coingecko.py` connector
  helper as a subprocess (last resort; the helper omits 24h change).

Polymarket Gamma is public and needs no key.

## Polymarket notes (verified live 2026-11-24)

- `/events` defaults oldest-first → we request `order=startDate&ascending=false`.
- `active=true` does NOT exclude closed markets → we filter client-side
  (`closed == false` and `endDate` in the future).
- `outcomePrices` is a JSON string → parsed per market.
- `/events` carries **no volume field**; `/markets` ignores both `tag_slug`
  and `conditionId` query params. True traded volume comes from
  `GET /markets/{numericId}` (`volumeNum`), which is `null` for fresh
  micro-markets (no trades yet). Ranking uses market `liquidityNum`;
  `volume` = `volumeNum` when Gamma has one, else the liquidity value
  (also exposed as `liquidity` so the app can tell them apart).
- The newest-first crypto feed is dominated by BTC/ETH 5–60 min
  "Up or Down" markets with real seeded liquidity and live Yes/No odds.

## Deploy

See [DEPLOY.md](./DEPLOY.md). TL;DR: Render free web service, root
directory `server`, start command `npm start`, env var `COINGECKO_API_KEY`.
After deploy, add the Render domain to the `network` whitelist in
`app/app.json` (Even Hub requirement).
