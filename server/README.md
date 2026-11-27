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
| GET | `/api/digest` | AI market digest — `{digest, generatedAt, model}`. Groq `openai/gpt-oss-20b`, 10 min server cache. |
| GET | `/api/alerts` | Stored price alerts — `{id, coin, direction, price, chatId, createdAt}`. Optional `?chatId=` filter. |
| POST | `/api/alerts` | Create one alert — body `{coin, direction: "above"\|"below", price, chatId?}`. `chatId` defaults to the first chat registered with the Telegram bot. Returns 201 with the alert. |
| DELETE | `/api/alerts/:id` | Delete one alert. Returns 200 with the deleted alert, 404 when unknown. |

CORS: `Access-Control-Allow-Origin: *` on all responses (the Even Hub
WebView fetch needs it). Preflight `OPTIONS` returns 204.

## Digest (Day 4)

`GET /api/digest` asks Groq (`openai/gpt-oss-20b` ONLY — `llama-3.1-8b-instant`
is gone, 404) for a 2–3 sentence market digest from the live prices + top
Polymarket market, cached 10 minutes. The prompt covers BTC/ETH only and
asks for under 300 characters so it fits the 576×288 screen. Response:
`{digest, generatedAt, model}`.

**gpt-oss reasoning trap (verified live 27 Nov 2026):** the model spends its
whole token budget on chain-of-thought reasoning unless `reasoning_effort`
is `"low"` — without it the response is empty content with
`finish_reason: "length"` (1022/1024 reasoning tokens at max_tokens 1024).
With `"low"` it answers in ~94 tokens. Both the direct call and the
`server/groq-digest.py` fallback pass `reasoning_effort: "low"`.

## Alerts (Day 3)

Alerts are stored on disk in `server/alerts.json` (gitignored — never
committed; it holds Telegram chat ids). The glasses app creates them from
the Alerts screen; the Telegram bot polls `GET /api/alerts` about once a
minute, sends a message to the alert's chat when the price crosses the
target, then deletes the alert via `DELETE /api/alerts/:id`. The bot also
answers `/alerts` in Telegram with the chat's current alerts.

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

## Groq key — how it works

Same pattern as CoinGecko: the key is **server-side only** and never shipped
in the app/`.ehpk`. **Production (Render etc.):** set `GROQ_API_KEY` in the
host dashboard. **Local dev:** the server fetches a dynamic-credential
surrogate for `custom.groq` from the local authd Unix socket and sends it as
the `Authorization: Bearer` header; the egress proxy resolves it. If the
direct call fails, the server falls back to spawning
`server/groq-digest.py` (same surrogate mechanism, prints
`{"digest": "..."}`). The real key is never visible to this process.

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
