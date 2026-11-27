import {
  waitForEvenAppBridge,
  TextContainerProperty,
  CreateStartUpPageContainer,
  TextContainerUpgrade,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'

// ---------------------------------------------------------------------------
// Odds & Coins — Ticker + Detail + Trade + Alerts screens (Track 02)
// ---------------------------------------------------------------------------
// NAVIGATION SCHEME (single text container, 576x288, one thing per screen):
//   Ticker screen:
//     tap (click)        -> cycle selection to the next of the top 8 coins
//     scroll down (ring) -> open Detail for the selected coin
//     scroll up (ring)   -> cycle selection to the previous coin
//     long-press         -> open Trade for the selected coin
//   Detail screen:
//     scroll up (ring)   -> back to Ticker
//     tap (click)        -> show Detail for the next coin
//     scroll down (ring) -> show Detail for the next coin
//     long-press         -> open Digest
//   Trade screen (paper portfolio, $10,000 virtual, $100/trade):
//     tap (click)        -> BUY $100 of the selected coin
//     scroll down (ring) -> SELL $100 of the selected coin
//     scroll up (ring)   -> back to Ticker
//     long-press         -> open Alerts
//   Alerts screen (price alerts, delivered by the Telegram bot):
//     tap (click)        -> create alert: selected coin ABOVE +5%
//     scroll down (ring) -> create alert: selected coin BELOW -5%
//     scroll up (ring)   -> back to Ticker
//     long-press         -> delete the most recent alert
//   Digest screen (AI market summary, Groq, 10-min server cache):
//     tap (click)        -> open Trade (retry the fetch when offline)
//     scroll down (ring) -> open Trade
//     scroll up (ring)   -> back to Ticker
//     long-press         -> back to Ticker
//   Any screen:
//     double-tap         -> exit (system confirmation dialog, mode 1)
//   Offline state: tap retries the fetch.
// ---------------------------------------------------------------------------
// SDK rules honoured here:
//   * waitForEvenAppBridge() before any SDK call.
//   * createStartUpPageContainer exactly once at startup.
//   * Exactly ONE container has isEventCapture: 1.
//   * textContainerUpgrade content stays well under the 2000-char limit;
//     short lines only (full-screen text holds ~400-500 chars).
//   * CLICK_EVENT is 0 and protobuf omits zero fields, so a single tap
//     arrives with eventType undefined — check DOUBLE_CLICK_EVENT (3)
//     first, then treat a missing eventType as click. Taps/lifecycle
//     arrive via sysEvent, scrolls via textEvent — never mix them.
//   * No financial advice text anywhere; prices/odds are read-only data.
// ---------------------------------------------------------------------------

const BACKEND_URL = 'http://localhost:3001'

interface Coin {
  id: string
  symbol: string
  name: string
  price_usd: number
  change_24h_pct: number
}

interface Market {
  event_title: string
  question: string
  yes_pct: number
  no_pct: number
  volume: number
}

type Screen = 'ticker' | 'detail' | 'trade' | 'alerts' | 'digest'

interface Alert {
  id: string
  coin: string
  direction: 'above' | 'below'
  price: number
  chatId: string
  createdAt: string
}

interface Portfolio {
  cash: number
  holdings: Record<string, number>
}

const PORTFOLIO_KEY = 'oddscoins:portfolio:v1'
const START_CASH = 10_000
const TRADE_SIZE_USD = 100

const bridge = await waitForEvenAppBridge()

// --- state -----------------------------------------------------------------
let screen: Screen = 'ticker'
let coins: Coin[] = []
let markets: Market[] = []
let selected = 0
let loading = true
let loadError = false
let portfolio: Portfolio = { cash: START_CASH, holdings: {} }
let alerts: Alert[] = []
let tradeMsg = ''
let alertMsg = ''
// Day 4: AI market digest (Groq, 10-min server cache).
let digestText = ''
let digestLoading = false
let digestError = false

// --- formatting helpers ----------------------------------------------------
function fmtPrice(p: number): string {
  if (!Number.isFinite(p)) return 'n/a'
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (p >= 1) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return '$' + p.toFixed(4)
}

function fmtPct(p: number): string {
  if (!Number.isFinite(p)) return 'n/a'
  return (p >= 0 ? '+' : '') + p.toFixed(1) + '%'
}

function fmtVol(v: number): string {
  if (!Number.isFinite(v)) return 'n/a'
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return '$' + (v / 1_000).toFixed(1) + 'k'
  return '$' + Math.round(v)
}

/** Wrap text to lines of at most `width` chars (word-aware, hard-splits long words). */
function wrap(text: string, width: number): string[] {
  const lines: string[] = []
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (word.length > width) {
      for (let i = 0; i < word.length; i += width) lines.push(word.slice(i, i + width))
      continue
    }
    const last = lines[lines.length - 1]
    if (last === undefined || last.length + 1 + word.length > width) lines.push(word)
    else lines[lines.length - 1] = last + ' ' + word
  }
  return lines.length ? lines : ['']
}

/** Best-matching Polymarket market for a coin: symbol/name in the question,
 *  otherwise the top-volume market. */
function marketFor(coin: Coin): Market | null {
  if (!markets.length) return null
  const sym = coin.symbol.toLowerCase()
  const name = coin.name.toLowerCase()
  const hit = markets.find(
    (m) =>
      m.question.toLowerCase().includes(sym) ||
      m.question.toLowerCase().includes(name),
  )
  if (hit) return hit
  return [...markets].sort((a, b) => b.volume - a.volume)[0] ?? null
}

// --- rendering ---------------------------------------------------------------
function tickerContent(): string {
  if (loading) return 'ODDS & COINS\n\nLoading prices...'
  if (loadError || !coins.length) {
    return 'ODDS & COINS\n\nOffline - tap to retry'
  }
  const lines = ['ODDS & COINS - TOP 8']
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i]
    const mark = i === selected ? '> ' : '  '
    lines.push(`${mark}${c.symbol} ${fmtPrice(c.price_usd)} ${fmtPct(c.change_24h_pct)}`)
  }
  lines.push('Tap: next - Down: detail - Hold: trade')
  return lines.join('\n')
}

function detailContent(): string {
  const coin = coins[selected]
  if (!coin) return 'ODDS & COINS\n\nNo coin selected'
  const market = marketFor(coin)
  const lines = [
    `${coin.name} (${coin.symbol})`,
    `${fmtPrice(coin.price_usd)}  ${fmtPct(coin.change_24h_pct)}`,
  ]
  if (!market) {
    lines.push('No market data yet')
  } else {
    lines.push('POLYMARKET:')
    lines.push(...wrap(market.question, 42).slice(0, 3))
    lines.push(`Yes ${market.yes_pct}% / No ${market.no_pct}%`)
    lines.push(`Vol ${fmtVol(market.volume)}`)
  }
  lines.push('Up: back - Tap: next - Hold: digest')
  return lines.join('\n')
}

function portfolioValue(): number {
  let total = portfolio.cash
  for (const [id, qty] of Object.entries(portfolio.holdings)) {
    const c = coins.find((x) => x.id === id)
    if (c) total += qty * c.price_usd
  }
  return total
}

function tradeContent(): string {
  const coin = coins[selected]
  if (!coin) return 'ODDS & COINS\n\nNo coin selected'
  const held = portfolio.holdings[coin.id] ?? 0
  const pnl = portfolioValue() - START_CASH
  const lines = [
    `TRADE - ${coin.symbol}  ${fmtPrice(coin.price_usd)}`,
    `Cash $${Math.round(portfolio.cash).toLocaleString('en-US')}  P&L ${pnl >= 0 ? '+' : ''}$${Math.round(pnl).toLocaleString('en-US')}`,
    `Hold ${held.toFixed(4)} ${coin.symbol} ($${Math.round(held * coin.price_usd).toLocaleString('en-US')})`,
  ]
  if (tradeMsg) lines.push(tradeMsg)
  lines.push('Tap: buy $100 - Down: sell $100')
  lines.push('Up: back - Hold: alerts')
  return lines.join('\n')
}

function alertsContent(): string {
  const coin = coins[selected]
  if (!coin) return 'ODDS & COINS\n\nNo coin selected'
  const lines = [`ALERTS - ${coin.symbol}  ${fmtPrice(coin.price_usd)}`]
  const mine = alerts.filter((a) => a.coin === coin.id)
  const others = alerts.length - mine.length
  if (!mine.length) {
    lines.push('No alerts for this coin yet')
  } else {
    for (const a of mine.slice(0, 4)) {
      lines.push(`${a.direction === 'above' ? 'Above' : 'Below'} ${fmtPrice(a.price)}`)
    }
    if (mine.length > 4) lines.push(`... +${mine.length - 4} more for ${coin.symbol}`)
  }
  if (others > 0) lines.push(`+${others} alert(s) on other coins`)
  if (alertMsg) lines.push(alertMsg)
  lines.push('Tap: +above 5% - Down: +below 5%')
  lines.push('Up: back - Hold: del latest')
  return lines.join('\n')
}

function digestContent(): string {
  const lines = ['MARKET DIGEST']
  if (digestLoading) {
    lines.push('Loading digest...')
  } else if (digestError || !digestText) {
    lines.push('Digest offline')
    lines.push('Tap: retry - Up: back')
  } else {
    lines.push(...wrap(digestText, 42).slice(0, 6))
    lines.push('Tap: trade - Up: back')
  }
  return lines.join('\n')
}

function render(): void {
  let content: string
  if (screen === 'ticker') content = tickerContent()
  else if (screen === 'detail') content = detailContent()
  else if (screen === 'trade') content = tradeContent()
  else if (screen === 'alerts') content = alertsContent()
  else content = digestContent()
  bridge.textContainerUpgrade(
    new TextContainerUpgrade({
      containerID: 1,
      containerName: 'main',
      content,
    }),
  )
}

// --- data --------------------------------------------------------------------
async function loadData(): Promise<void> {
  loading = true
  loadError = false
  render()
  try {
    const [pricesRes, marketsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/prices`),
      fetch(`${BACKEND_URL}/api/markets`),
    ])
    if (!pricesRes.ok) throw new Error(`prices HTTP ${pricesRes.status}`)
    const prices = (await pricesRes.json()) as Coin[]
    if (!Array.isArray(prices) || !prices.length) throw new Error('empty prices')
    coins = prices.slice(0, 8)
    if (selected >= coins.length) selected = 0
    if (marketsRes.ok) {
      const m = (await marketsRes.json()) as Market[]
      if (Array.isArray(m)) markets = m
    }
    loading = false
  } catch (err) {
    console.error('Odds & Coins: backend fetch failed:', err)
    loading = false
    loadError = true
  }
  render()
}

// --- paper portfolio (local storage, $10,000 virtual) ----------------------
async function loadPortfolio(): Promise<void> {
  try {
    const raw = await bridge.getLocalStorage(PORTFOLIO_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Portfolio
      if (
        typeof parsed.cash === 'number' &&
        parsed.holdings &&
        typeof parsed.holdings === 'object'
      ) {
        portfolio = parsed
      }
    }
  } catch {
    portfolio = { cash: START_CASH, holdings: {} }
  }
}

async function savePortfolio(): Promise<void> {
  try {
    const ok = await bridge.setLocalStorage(PORTFOLIO_KEY, JSON.stringify(portfolio))
    if (!ok) {
      // The simulator's storage backend can refuse the write (in-memory
      // only); on real G2 hardware this persists. Log so it is visible.
      console.error('Odds & Coins: setLocalStorage returned false for portfolio')
    }
  } catch (err) {
    console.error('Odds & Coins: portfolio save failed:', err)
  }
}

function buySelected(): void {
  const coin = coins[selected]
  if (!coin) return
  if (portfolio.cash < TRADE_SIZE_USD) {
    tradeMsg = 'Cash under $100 - cannot buy'
    render()
    return
  }
  const qty = TRADE_SIZE_USD / coin.price_usd
  portfolio.cash -= TRADE_SIZE_USD
  portfolio.holdings[coin.id] = (portfolio.holdings[coin.id] ?? 0) + qty
  tradeMsg = `Bought ${qty.toFixed(4)} ${coin.symbol} for $100`
  void savePortfolio()
  render()
}

function sellSelected(): void {
  const coin = coins[selected]
  if (!coin) return
  const held = portfolio.holdings[coin.id] ?? 0
  if (held <= 0) {
    tradeMsg = `No ${coin.symbol} held - nothing to sell`
    render()
    return
  }
  const qty = Math.min(held, TRADE_SIZE_USD / coin.price_usd)
  const proceeds = qty * coin.price_usd
  portfolio.cash += proceeds
  const rest = held - qty
  if (rest <= 1e-9) delete portfolio.holdings[coin.id]
  else portfolio.holdings[coin.id] = rest
  tradeMsg = `Sold ${qty.toFixed(4)} ${coin.symbol} for $${proceeds.toFixed(0)}`
  void savePortfolio()
  render()
}

// --- alerts (server-side store, delivered by the Telegram bot) --------------
async function loadAlerts(): Promise<void> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/alerts`)
    if (res.ok) {
      const data = (await res.json()) as Alert[]
      if (Array.isArray(data)) alerts = data
    }
  } catch {
    // Offline: keep the last list (possibly empty) and carry on.
  }
}

/** Round a trigger price to a tidy step so the alert reads well. */
function alertPrice(raw: number, direction: 'above' | 'below'): number {
  const step = raw >= 1000 ? 100 : raw >= 1 ? 0.1 : 0.001
  return direction === 'above'
    ? Math.ceil(raw / step) * step
    : Math.floor(raw / step) * step
}

async function createAlert(direction: 'above' | 'below'): Promise<void> {
  const coin = coins[selected]
  if (!coin) return
  const price = alertPrice(
    coin.price_usd * (direction === 'above' ? 1.05 : 0.95),
    direction,
  )
  try {
    const res = await fetch(`${BACKEND_URL}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coin: coin.id, direction, price }),
    })
    if (!res.ok) {
      alertMsg = 'Could not create alert'
    } else {
      alertMsg = `Alert: ${coin.symbol} ${direction} ${fmtPrice(price)}`
    }
  } catch {
    alertMsg = 'Alert offline - try again'
  }
  await loadAlerts()
  render()
}

async function deleteLatestAlert(): Promise<void> {
  if (!alerts.length) {
    alertMsg = 'No alerts to delete'
    render()
    return
  }
  const last = alerts[alerts.length - 1]
  try {
    await fetch(`${BACKEND_URL}/api/alerts/${last.id}`, { method: 'DELETE' })
    alertMsg = 'Latest alert deleted'
  } catch {
    alertMsg = 'Delete failed - offline?'
  }
  await loadAlerts()
  render()
}

// --- AI digest (server-side Groq call, 10-min cache) ------------------------
async function loadDigest(): Promise<void> {
  digestLoading = true
  digestError = false
  render()
  try {
    const res = await fetch(`${BACKEND_URL}/api/digest`)
    if (!res.ok) throw new Error(`digest HTTP ${res.status}`)
    const data = (await res.json()) as unknown
    // Stale-cache responses arrive wrapped as {stale, data}; fresh ones bare.
    const payload =
      data && typeof data === 'object' && 'data' in data
        ? (data as { data: unknown }).data
        : data
    const text =
      payload && typeof payload === 'object' && 'digest' in payload
        ? String((payload as { digest: unknown }).digest || '').trim()
        : ''
    if (!text) throw new Error('empty digest')
    digestText = text
    digestLoading = false
  } catch (err) {
    console.error('Odds & Coins: digest fetch failed:', err)
    digestLoading = false
    digestError = true
  }
  render()
}

// --- startup: exactly one container, created exactly once --------------------
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
  content: 'ODDS & COINS\n\nLoading prices...',
  isEventCapture: 1,
})

const result = await bridge.createStartUpPageContainer(
  new CreateStartUpPageContainer({
    containerTotalNum: 1,
    textObject: [mainText],
  }),
)

console.log('Odds & Coins: page created:', result === 0 ? 'success' : `failed (${result})`)

// --- events ------------------------------------------------------------------
// CLICK_EVENT is 0 and protobuf omits zero-value fields, so a single tap
// arrives with eventType undefined. Resolve the default INSIDE the envelope
// check: `envelope.eventType ?? CLICK_EVENT` on a missing envelope would
// misread every scroll/exit/audio event as a tap.
function eventTypeOf(envelope?: { eventType?: OsEventTypeList }): OsEventTypeList | null {
  if (!envelope) return null
  return envelope.eventType ?? OsEventTypeList.CLICK_EVENT
}

function nextCoin(): void {
  if (!coins.length) return
  selected = (selected + 1) % coins.length
  render()
}

function prevCoin(): void {
  if (!coins.length) return
  selected = (selected - 1 + coins.length) % coins.length
  render()
}

const unsubscribe = bridge.onEvenHubEvent((event) => {
  const sysType = eventTypeOf(event.sysEvent)
  const textType = eventTypeOf(event.textEvent)

  // Double-tap exits from anywhere — check it first, in either envelope.
  if (
    sysType === OsEventTypeList.DOUBLE_CLICK_EVENT ||
    textType === OsEventTypeList.DOUBLE_CLICK_EVENT
  ) {
    bridge.shutDownPageContainer(1)
    return
  }

  // Long-press: menu navigation (and delete on the Alerts screen).
  // The release event carries no action — ignore it.
  if (
    sysType === OsEventTypeList.LONG_PRESS_EVENT ||
    textType === OsEventTypeList.LONG_PRESS_EVENT
  ) {
    if (screen === 'ticker') {
      screen = 'trade'
      tradeMsg = ''
      render()
    } else if (screen === 'detail') {
      screen = 'digest'
      render()
      void loadDigest()
    } else if (screen === 'trade') {
      screen = 'alerts'
      alertMsg = ''
      render()
      void loadAlerts().then(render)
    } else if (screen === 'alerts') {
      void deleteLatestAlert()
    } else if (screen === 'digest') {
      screen = 'ticker'
      render()
    }
    return
  }
  if (
    sysType === OsEventTypeList.LONG_PRESS_RELEASE_EVENT ||
    textType === OsEventTypeList.LONG_PRESS_RELEASE_EVENT
  ) {
    return
  }

  // Scrolls arrive via textEvent (ring swipe); also accept sysEvent.
  const scroll =
    textType === OsEventTypeList.SCROLL_TOP_EVENT ||
    textType === OsEventTypeList.SCROLL_BOTTOM_EVENT
      ? textType
      : sysType === OsEventTypeList.SCROLL_TOP_EVENT ||
          sysType === OsEventTypeList.SCROLL_BOTTOM_EVENT
        ? sysType
        : null

  if (scroll === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
    if (screen === 'ticker' && coins.length) {
      screen = 'detail'
      render()
    } else if (screen === 'detail') {
      nextCoin() // detail for the next coin
    } else if (screen === 'trade') {
      sellSelected()
    } else if (screen === 'alerts') {
      void createAlert('below')
    } else if (screen === 'digest') {
      screen = 'trade'
      render()
    }
    return
  }

  if (scroll === OsEventTypeList.SCROLL_TOP_EVENT) {
    if (screen === 'detail' || screen === 'trade' || screen === 'alerts' || screen === 'digest') {
      screen = 'ticker'
      render()
    } else {
      prevCoin()
    }
    return
  }

  // Single tap (missing eventType == CLICK_EVENT).
  if (
    sysType === OsEventTypeList.CLICK_EVENT ||
    textType === OsEventTypeList.CLICK_EVENT
  ) {
    if (loading) return
    if (loadError || !coins.length) {
      void loadData() // offline: tap retries
      return
    }
    if (screen === 'trade') {
      buySelected()
      return
    }
    if (screen === 'alerts') {
      void createAlert('above')
      return
    }
    if (screen === 'digest') {
      if (digestError) {
        void loadDigest() // offline: tap retries
      } else {
        screen = 'trade'
        render()
      }
      return
    }
    nextCoin()
    return
  }

  if (
    sysType === OsEventTypeList.SYSTEM_EXIT_EVENT ||
    sysType === OsEventTypeList.ABNORMAL_EXIT_EVENT
  ) {
    unsubscribe()
  }
})

// --- go ------------------------------------------------------------------------
// Load the paper portfolio first (local storage), then live prices/odds.
void loadPortfolio().then(() => loadData())
// Refresh prices/odds every 60 s while the app is open.
setInterval(() => {
  void loadData()
}, 60_000)
