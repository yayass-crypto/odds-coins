import {
  waitForEvenAppBridge,
  TextContainerProperty,
  CreateStartUpPageContainer,
  TextContainerUpgrade,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'

// ---------------------------------------------------------------------------
// Odds & Coins — Ticker + Detail screens (Track 02, com.yass.oddscoins)
// ---------------------------------------------------------------------------
// NAVIGATION SCHEME (single text container, 576x288, one thing per screen):
//   Ticker screen:
//     tap (click)        -> cycle selection to the next of the top 8 coins
//     scroll down (ring) -> open Detail for the selected coin
//     scroll up (ring)   -> cycle selection to the previous coin
//   Detail screen:
//     scroll up (ring)   -> back to Ticker
//     tap (click)        -> show Detail for the next coin
//     scroll down (ring) -> show Detail for the next coin
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

type Screen = 'ticker' | 'detail'

const bridge = await waitForEvenAppBridge()

// --- state -----------------------------------------------------------------
let screen: Screen = 'ticker'
let coins: Coin[] = []
let markets: Market[] = []
let selected = 0
let loading = true
let loadError = false

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
  lines.push('Tap: next - Down: detail')
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
  lines.push('Up: back - Tap: next coin')
  return lines.join('\n')
}

function render(): void {
  const content = screen === 'ticker' ? tickerContent() : detailContent()
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
    }
    return
  }

  if (scroll === OsEventTypeList.SCROLL_TOP_EVENT) {
    if (screen === 'detail') {
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
void loadData()
// Refresh prices/odds every 60 s while the app is open.
setInterval(() => {
  void loadData()
}, 60_000)
