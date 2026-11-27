// Odds & Coins backend — Track 02, Even Realities hackathon (com.yass.oddscoins)
// Zero-dependency Node stdlib HTTP server.
//
// Endpoints:
//   GET /health       -> {"ok":true}
//   GET /api/prices  -> CoinGecko /simple/price (8 coins, 60 s cache)
//   GET /api/markets -> Polymarket Gamma /events?tag_slug=crypto (open only, top 8 by volume, 120 s cache)
//   GET /api/alerts  -> list stored price alerts (optional ?chatId= filter)
//   POST /api/alerts -> create one alert {coin, direction, price, chatId?}
//   DELETE /api/alerts/:id -> delete one alert (also used by the bot after firing)
//
// CoinGecko auth (server-side only, never shipped to the app):
//   1. COINGECKO_API_KEY env var if set (this is how Render/production runs).
//   2. Otherwise, locally: fetch a dynamic-credential surrogate for
//      "custom.coingecko" from the authd Unix socket (same mechanism as the
//      coingecko.py connector helper) and send it as the x-cg-demo-api-key
//      header. The egress proxy resolves the surrogate to the real Demo key;
//      the real key is never visible to this process.
//   3. Last resort (local dev only): spawn the coingecko.py helper as a
//      subprocess for the price call.
//
// On upstream failure the last cached payload is returned as
// {"stale":true,"data":[...]}; with no cache at all, HTTP 502.
// Polymarket Gamma is public and needs no key.

import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 3001);
const AUTHD_SOCK = process.env.JARVIS_AUTHD_SOCK || '/run/hatch/auth/authd.sock';
const COINGECKO_HELPER =
  '/home/hatch/workspace/custom-connectors/custom.coingecko/bin/coingecko.py';

const COIN_IDS = [
  'bitcoin',
  'ethereum',
  'solana',
  'binancecoin',
  'ripple',
  'dogecoin',
  'cardano',
  'tron',
];
const COIN_META = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin' },
  ethereum: { symbol: 'ETH', name: 'Ethereum' },
  solana: { symbol: 'SOL', name: 'Solana' },
  binancecoin: { symbol: 'BNB', name: 'BNB' },
  ripple: { symbol: 'XRP', name: 'XRP' },
  dogecoin: { symbol: 'DOGE', name: 'Dogecoin' },
  cardano: { symbol: 'ADA', name: 'Cardano' },
  tron: { symbol: 'TRX', name: 'TRON' },
};

const PRICES_TTL_MS = 60_000;
const MARKETS_TTL_MS = 120_000;
const UPSTREAM_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Small in-memory cache with stale fallback
// ---------------------------------------------------------------------------
const cache = {
  prices: { at: 0, data: null },
  markets: { at: 0, data: null },
};

function isFresh(entry, ttl) {
  return entry.data !== null && Date.now() - entry.at < ttl;
}

// ---------------------------------------------------------------------------
// Alerts (Day 3): persisted to server/alerts.json — NOT in git (see
// .gitignore). An alert is {id, coin, direction: 'above'|'below', price,
// chatId, createdAt}. The glasses app never sends a chatId (no keyboard),
// so POST defaults it to the first chat registered with the Telegram bot
// (app/bot/state.json) — the user who pressed Start.
// ---------------------------------------------------------------------------
const ALERTS_FILE = path.join(__dirname, 'alerts.json');
const BOT_STATE_FILE = path.join(__dirname, '..', 'app', 'bot', 'state.json');

let alerts = [];
try {
  const parsed = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8'));
  if (Array.isArray(parsed)) alerts = parsed;
} catch {
  alerts = [];
}

function saveAlerts() {
  const tmp = ALERTS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(alerts, null, 2));
  fs.renameSync(tmp, ALERTS_FILE);
}

function defaultChatId() {
  try {
    const state = JSON.parse(fs.readFileSync(BOT_STATE_FILE, 'utf8'));
    const chats = Object.keys(state.chats || {});
    return chats.length ? chats[0] : null;
  } catch {
    return null;
  }
}

// Accept a CoinGecko id or a symbol (case-insensitive); returns the id or null.
function normalizeCoin(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (COIN_IDS.includes(v)) return v;
  for (const id of COIN_IDS) {
    if (COIN_META[id].symbol.toLowerCase() === v) return id;
  }
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 10_000) {
        req.destroy();
        reject(new Error('body too large'));
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// CoinGecko credential: env var (production) or authd surrogate (local dev)
// ---------------------------------------------------------------------------
function fetchSurrogateOnce(credentialName) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ name: credentialName });
    const req =
      'POST /v1/credentials/surrogate HTTP/1.1\r\n' +
      'Host: authd.local\r\n' +
      'Content-Type: application/json\r\n' +
      `Content-Length: ${Buffer.byteLength(body)}\r\n` +
      'Connection: close\r\n\r\n' +
      body;
    const conn = net.connect(AUTHD_SOCK);
    let raw = '';
    let settled = false;
    const done = (err, value) => {
      if (settled) return;
      settled = true;
      try {
        conn.destroy();
      } catch {
        /* ignore */
      }
      err ? reject(err) : resolve(value);
    };
    conn.setTimeout(5000, () => done(new Error('authd socket timeout')));
    conn.on('connect', () => conn.end(req));
    conn.on('data', (chunk) => {
      raw += chunk.toString('utf8');
    });
    conn.on('end', () => {
      try {
        const sep = raw.indexOf('\r\n\r\n');
        if (sep === -1) throw new Error('authd returned an empty/malformed response');
        const payload = JSON.parse(raw.slice(sep + 4));
        const entry = (payload.credentials || []).find((c) => c.name === 'access_token');
        if (!entry || typeof entry.surrogate !== 'string' || !entry.surrogate.startsWith('hsurr:')) {
          done(new Error('authd returned no usable surrogate'));
          return;
        }
        done(null, entry.surrogate);
      } catch (e) {
        done(e);
      }
    });
    conn.on('error', done);
  });
}

// authd can hiccup (empty response) — retry a few times before giving up.
async function fetchSurrogate(credentialName, attempts = 3) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchSurrogateOnce(credentialName);
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

async function coingeckoApiKey() {
  if (process.env.COINGECKO_API_KEY) return process.env.COINGECKO_API_KEY;
  try {
    return await fetchSurrogate('custom.coingecko');
  } catch (e) {
    console.error('[prices] surrogate unavailable:', e.message);
    return null;
  }
}

// Last-resort local fallback: run the connector helper as a subprocess.
// Returns the raw /simple/price JSON object, or throws.
function pricesViaHelper() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'python3',
      [COINGECKO_HELPER, 'price', COIN_IDS.join(','), 'usd'],
      { timeout: 20000 },
    );
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`coingecko.py exited ${code}: ${err.trim().slice(0, 200)}`));
        return;
      }
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error(`coingecko.py returned bad JSON: ${e.message}`));
      }
    });
  });
}

async function fetchPricesLive() {
  const url =
    'https://api.coingecko.com/api/v3/simple/price?' +
    new URLSearchParams({
      ids: COIN_IDS.join(','),
      vs_currencies: 'usd',
      include_24hr_change: 'true',
    });
  const apiKey = await coingeckoApiKey();
  let raw = null;
  if (apiKey) {
    const res = await fetch(url, {
      headers: { 'x-cg-demo-api-key': apiKey },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    raw = await res.json();
  } else {
    // No key mechanism available — try keyless first (the Demo endpoint
    // has answered keyless from this VM), then the helper subprocess
    // (local dev only; the helper omits 24h change, so it is last).
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`CoinGecko keyless HTTP ${res.status}`);
      raw = await res.json();
    } catch (e) {
      console.error('[prices] keyless fetch failed, trying helper:', e.message);
      raw = await pricesViaHelper();
    }
  }
  const rows = [];
  for (const id of COIN_IDS) {
    const entry = raw && raw[id];
    if (!entry || typeof entry.usd !== 'number') continue;
    rows.push({
      id,
      symbol: COIN_META[id].symbol,
      name: COIN_META[id].name,
      price_usd: entry.usd,
      change_24h_pct:
        typeof entry.usd_24h_change === 'number'
          ? Math.round(entry.usd_24h_change * 100) / 100
          : null,
    });
  }
  if (rows.length === 0) throw new Error('CoinGecko returned no usable prices');
  return rows;
}

// ---------------------------------------------------------------------------
// Polymarket Gamma (public, no key)
// ---------------------------------------------------------------------------
async function fetchMarketsLive() {
  // Gamma quirks (verified live 2026-11-24):
  // - /events carries NO volume field; /markets ignores tag_slug AND
  //   conditionId query params. /markets/{numericId} DOES return the market
  //   with volumeNum — but it is null for fresh micro-markets (no trades yet).
  // - The newest-first crypto feed is dominated by BTC/ETH 5-60 min
  //   "Up or Down" markets with real seeded liquidity and live Yes/No odds.
  // So: rank candidates by market liquidityNum, enrich the top 8 with true
  // traded volume via /markets/{id}, and report volume = volumeNum when
  // Gamma has one, else the liquidity value (kept visible as `liquidity`).
  const url =
    'https://gamma-api.polymarket.com/events?' +
    new URLSearchParams({
      tag_slug: 'crypto',
      order: 'startDate',
      ascending: 'false',
      limit: '50',
    });
  const res = await fetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Polymarket Gamma HTTP ${res.status}`);
  const events = await res.json();
  if (!Array.isArray(events)) throw new Error('Gamma returned non-array events');

  const now = Date.now();
  const candidates = [];
  for (const ev of events) {
    const markets = Array.isArray(ev.markets) ? ev.markets : [];
    for (const m of markets) {
      if (m.closed) continue;
      if (m.endDate && new Date(m.endDate).getTime() <= now) continue;
      let prices = null;
      try {
        prices = JSON.parse(m.outcomePrices || 'null');
      } catch {
        prices = null;
      }
      if (!Array.isArray(prices) || prices.length < 2) continue;
      const yes = Number(prices[0]);
      const no = Number(prices[1]);
      if (!Number.isFinite(yes) || !Number.isFinite(no)) continue;
      candidates.push({
        event_title: ev.title || m.groupItemTitle || '',
        question: m.question || '',
        yes_pct: Math.round(yes * 1000) / 10,
        no_pct: Math.round(no * 1000) / 10,
        marketId: m.id ?? null,
        liquidity: Number(m.liquidityNum) || 0,
        volume: 0,
      });
    }
  }
  candidates.sort((a, b) => b.liquidity - a.liquidity);
  const top = candidates.slice(0, 8);
  if (top.length === 0) throw new Error('Gamma returned no open crypto markets');

  // True traded volume per market (public, no key). Null for fresh markets.
  const enriched = await Promise.all(
    top.map(async (row) => {
      if (row.marketId == null) return { ...row, volume: row.liquidity };
      try {
        const r = await fetch(`https://gamma-api.polymarket.com/markets/${row.marketId}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) return { ...row, volume: row.liquidity };
        const m = await r.json();
        const vol = Number(m && m.volumeNum);
        return {
          ...row,
          volume: Number.isFinite(vol) ? Math.round(vol * 100) / 100 : row.liquidity,
        };
      } catch {
        return { ...row, volume: row.liquidity };
      }
    }),
  );
  enriched.sort((a, b) => b.volume - a.volume);
  return enriched.map(({ event_title, question, yes_pct, no_pct, volume, liquidity }) => ({
    event_title,
    question,
    yes_pct,
    no_pct,
    volume,
    liquidity: Math.round(liquidity * 100) / 100,
  }));
}
// ---------------------------------------------------------------------------
// HTTP plumbing
// ---------------------------------------------------------------------------
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function handleCached(req, res, entry, ttl, fetcher, label) {
  if (isFresh(entry, ttl)) {
    sendJson(res, 200, entry.data);
    return;
  }
  try {
    const data = await fetcher();
    entry.data = data;
    entry.at = Date.now();
    sendJson(res, 200, data);
  } catch (e) {
    console.error(`[${label}] upstream failed:`, e.message);
    if (entry.data !== null) {
      sendJson(res, 200, { stale: true, data: entry.data });
    } else {
      sendJson(res, 502, { error: `${label} upstream unavailable` });
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }
  if (url.pathname === '/health' && req.method === 'GET') {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (url.pathname === '/api/prices' && req.method === 'GET') {
    handleCached(req, res, cache.prices, PRICES_TTL_MS, fetchPricesLive, 'prices');
    return;
  }
  if (url.pathname === '/api/markets' && req.method === 'GET') {
    handleCached(req, res, cache.markets, MARKETS_TTL_MS, fetchMarketsLive, 'markets');
    return;
  }
  if (url.pathname === '/api/alerts' && req.method === 'GET') {
    const chatId = url.searchParams.get('chatId');
    sendJson(res, 200, chatId ? alerts.filter((a) => a.chatId === chatId) : alerts);
    return;
  }
  if (url.pathname === '/api/alerts' && req.method === 'POST') {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      sendJson(res, 400, { error: 'invalid JSON body' });
      return;
    }
    const coinId = normalizeCoin(body && body.coin);
    if (!coinId) {
      sendJson(res, 400, { error: 'unknown coin' });
      return;
    }
    if (body.direction !== 'above' && body.direction !== 'below') {
      sendJson(res, 400, { error: "direction must be 'above' or 'below'" });
      return;
    }
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      sendJson(res, 400, { error: 'price must be a positive number' });
      return;
    }
    const chatId = body.chatId != null ? String(body.chatId) : defaultChatId();
    if (!chatId) {
      sendJson(res, 400, { error: 'no chat registered — start the Telegram bot first' });
      return;
    }
    const alert = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      coin: coinId,
      direction: body.direction,
      price,
      chatId,
      createdAt: new Date().toISOString(),
    };
    alerts.push(alert);
    saveAlerts();
    sendJson(res, 201, alert);
    return;
  }
  if (url.pathname.startsWith('/api/alerts/') && req.method === 'DELETE') {
    const id = decodeURIComponent(url.pathname.slice('/api/alerts/'.length));
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx === -1) {
      sendJson(res, 404, { error: 'alert not found' });
      return;
    }
    const [deleted] = alerts.splice(idx, 1);
    saveAlerts();
    sendJson(res, 200, { deleted });
    return;
  }
  sendJson(res, req.method === 'GET' ? 404 : 405, {
    error: req.method === 'GET' ? 'not found' : 'method not allowed',
  });
});

server.listen(PORT, () => {
  console.log(`[odds-coins] listening on http://localhost:${PORT}`);
  console.log(
    `[odds-coins] CoinGecko key source: ${
      process.env.COINGECKO_API_KEY ? 'COINGECKO_API_KEY env var' : 'authd surrogate (custom.coingecko)'
    }`,
  );
});
