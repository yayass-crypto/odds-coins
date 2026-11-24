# Even Realities Hackathon — API Feasibility Research

- Research date: 2026-11-20
- Hackathon: "Heads Up: Even Realities Hackathon" by TVM Ventures & Daos Hub — build week Nov 23–29, 2026, online, open worldwide. Source: https://dorahacks.io/hackathon/even-realities/detail
- Prize pool: $10,000 USDT for 10 winners + up to 10 pairs of G2. Source: https://dorahacks.io/hackathon/even-realities/detail
- Grand prize $2,000 + 2 pairs of G2; 1st place per track $1,250 + 1–2 pairs of G2; 2nd place per track $500; Best Telegram integration $1,000. Source: https://dorahacks.io/hackathon/even-realities/detail
- Demo Day Dec 3, 14:00–18:00, Daos Hub, Dubai; finalists can demo remotely. Source: https://dorahacks.io/hackathon/even-realities/detail
- No glasses needed: build and test in the free Even Hub simulator. Source: https://dorahacks.io/hackathon/even-realities/detail
- Submission deadline Nov 29, 23:59 (Dubai time, GMT+4). Source: https://dorahacks.io/hackathon/even-realities/detail
- Read-only research only: no signups, accounts, API keys, or payments were made for this research. Source: (research method — no external source)

## Platform constraints (apply to all three concepts)

- Your app is a web app (HTML, CSS, JavaScript or TypeScript) running in a WebView inside the Even Realities App, talking to G2 over Bluetooth through the Even Hub SDK. Source: https://dorahacks.io/hackathon/even-realities/detail
- Display is monochrome green, 576 × 288 per eye. Source: https://dorahacks.io/hackathon/even-realities/detail
- Input is microphone, touch controls on the glasses, R1 ring. Source: https://dorahacks.io/hackathon/even-realities/detail
- No camera and no speaker on the glasses. Source: https://dorahacks.io/hackathon/even-realities/detail
- One app on screen at a time; when the user switches away, the app cannot show anything or pop up alerts. Source: https://dorahacks.io/hackathon/even-realities/detail
- No access to other apps' notifications — talk to the service directly through its API. Source: https://dorahacks.io/hackathon/even-realities/detail
- Bring your own speech-to-text; the SDK gives raw microphone audio, send it to your own server (e.g. Whisper). Source: https://dorahacks.io/hackathon/even-realities/detail
- Use a backend: external calls must be whitelisted in `app.json` and pass CORS; route API calls through your own server and never ship API keys inside the app. Source: https://dorahacks.io/hackathon/even-realities/detail
- Sign-in: Google sign-in does not work inside the WebView — use a separate login page or a pairing code. Source: https://dorahacks.io/hackathon/even-realities/detail
- Design for a glance: one thing on screen, a few words, one action by tap, ring or short phrase. Source: https://dorahacks.io/hackathon/even-realities/detail
- Money safety: demos use testnet, paper trading or read-only data; do not hold user funds; no financial advice; never commit API keys or secrets. Source: https://dorahacks.io/hackathon/even-realities/detail
- Judging: Usefulness on G2 30%; Read and write 25%; Technical execution 20%; UX for display and voice 15%; Business potential and safety 10%. Source: https://dorahacks.io/hackathon/even-realities/detail
- Judges look for apps that go beyond notifications: a great G2 app lets you read and write — see what matters, then reply, confirm or act in a few seconds. Source: https://dorahacks.io/hackathon/even-realities/detail
- Setup: `npm install -g @evenrealities/evenhub-cli` and `npm install -g @evenrealities/evenhub-simulator`, start from the official minimal template and point the simulator at a local dev server. Source: https://dorahacks.io/hackathon/even-realities/detail
- Even G2 Enterprise SDK (launched Nov 10, 2026) supports Flutter and native iOS/Android and connects over Bluetooth, but it is application-based alpha for enterprises — UNVERIFIED whether hackathon teams get it; the hackathon page itself prescribes the Even Hub web-app route above. Source: https://smartglasses.fyi/en/journal/even-g2-enterprise-sdk/

---

## Concept A — Track 04 AI Assistants & Work: glanceable AI daily briefing (Gmail + Google Calendar + Notion, summarized by a free LLM)

Track 04 apps listed: ChatGPT, Claude, Gemini, Perplexity, Gmail, Google Calendar, Outlook, Notion. Source: https://dorahacks.io/hackathon/even-realities/detail
Track 04 read/write: inbox triage in 30 seconds, a brief before your next meeting, answers from your own notes; reply to an email, add a task or move a meeting by voice. Source: https://dorahacks.io/hackathon/even-realities/detail

### Gmail API

- Gmail API is a REST API at `https://gmail.googleapis.com/gmail/v1`, accessed by OAuth 2.0. Source: https://developers.google.com/workspace/gmail/api/reference/quota (endpoint implied by docs domain; auth model per https://developers.google.com/gmail/api/auth/scopes)
- All standard use of the Gmail API is available at no additional cost. Source: https://developers.google.com/workspace/gmail/api/reference/quota
- Quota: 1,200,000 quota units/min per project; 6,000 quota units/min per user per project. Source: https://developers.google.com/workspace/gmail/api/reference/quota
- Daily billing threshold: 80,000,000 quota units/day per project before charges apply; usage under it is not billed. Source: https://developers.google.com/workspace/gmail/api/reference/quota
- Per-method costs: `messages.list` 5 units, `messages.get` 20 units (60 when format is full/raw/html), `threads.get` 40 units, `messages.send` 100 units, `drafts.create` 10 units. Source: https://developers.google.com/workspace/gmail/api/reference/quota
- Reading message bodies needs the `gmail.readonly` scope ("View your email messages and settings"), which Google classifies as a RESTRICTED scope. Source: https://developers.google.com/gmail/api/auth/scopes
- `gmail.metadata` (headers/labels only, no body) is also a restricted scope. Source: https://developers.google.com/gmail/api/auth/scopes
- `gmail.send` ("Send email on your behalf") is a SENSITIVE scope. Source: https://developers.google.com/gmail/api/auth/scopes
- Restricted scopes require restricted-scope OAuth verification, and if restricted-scope data is stored on servers (or transmitted), a security assessment is required. Source: https://developers.google.com/gmail/api/auth/scopes
- Google sign-in does not work inside the Even Hub WebView, so Gmail OAuth would need a separate login page or pairing code. Source: https://dorahacks.io/hackathon/even-realities/detail
- UNVERIFIED (secondary source only, not confirmed on an official Google page in this research): an unverified OAuth app's refresh tokens expire after 7 days, and unverified apps requesting restricted scopes are capped at 100 users. Source: https://github.com/matgCodes/gmail-local/blob/main/docs/gmail_api_official_research.md

### Google Calendar API

- Google Calendar API v3 is a REST API at `https://www.googleapis.com/calendar/v3`, accessed by OAuth 2.0. Source: https://developers.google.cn/workspace/calendar/api/guides/quota?hl=en
- All standard use of the Google Calendar API is available at no additional cost. Source: https://developers.google.cn/workspace/calendar/api/guides/quota?hl=en
- Quota: 10,000 requests/min per project; 600 requests/min per user per project; 1,000,000 requests/day per project daily billing threshold. Source: https://developers.google.cn/workspace/calendar/api/guides/quota?hl=en
- Read-only scope is `https://www.googleapis.com/auth/calendar.readonly`. Source: https://www.anygen.io/showcase/google-calendar-api-documentation/index.html
- UNVERIFIED: whether `calendar.readonly` is classified sensitive or restricted by Google — not confirmed on an official page in this research. Source: (no official source found in this research)
- Same WebView Google sign-in blocker as Gmail applies. Source: https://dorahacks.io/hackathon/even-realities/detail

### Notion API

- Notion has a public REST API at `https://api.notion.com/v1`, versioned by a `Notion-Version` header. Source: https://developers.notion.com/docs/authorization
- Three auth routes: internal connection (static API token, workspace owner creates it, pages must be manually shared with it), personal access token (acts as the user, no OAuth flow), and OAuth integration / public integration (OAuth 2.0, user picks pages in a picker). Source: https://developers.notion.com/docs/authorization
- Internal connection token is sent as `Authorization: Bearer …` on every request. Source: https://developers.notion.com/docs/authorization
- For a single-user demo, a personal access token or internal connection token is far simpler than full OAuth — no consent screen, no verification. Source: https://developers.notion.com/docs/authorization
- Rate limits: 180 requests/min per connection on all plans except Business/Enterprise (600/min); data-source queries have a separate limit of ~3 requests/sec per connection; there is also a shared per-workspace limit. Source: https://developers.notion.com/reference/request-limits
- Over-limit responses are HTTP 429 with a `Retry-After` header; 529 means service overload, retry the same way. Source: https://developers.notion.com/reference/request-limits
- Size limits: max 1,000 block elements and 500 KB per request; rich-text `text.content` max 2,000 characters; arrays max 100 elements. Source: https://developers.notion.com/reference/request-limits
- No separate paid API tier was found — the API itself is free to call; limits scale with the workspace plan. Source: https://developers.notion.com/reference/request-limits
- UNVERIFIED: whether a free Notion workspace has a 1,000-lifetime-block limit on API writes (reported by secondary sources, and the official request-limits page links to a separate workspace-block-limits page that was not opened). Source: https://www.lilachbullock.com/does-notion-have-an-api/

### Demo without the user's real personal data — Concept A

- Feasible with mock data: the briefing UI can be fed by a static JSON fixture (fake emails, fake calendar events, fake Notion pages) with zero API calls, and the same code path can swap in live API responses. Source: (design judgement — no external source; mock fixtures are a standard technique, not a vendor fact)
- Feasible with a dedicated throwaway account: a fresh Gmail/Calendar/Notion workspace containing only synthetic demo content avoids exposing real mail. Source: (design judgement — no external source)
- NOT feasible to demo the real integration without any credentials: Gmail and Calendar both require per-user OAuth consent; Notion requires at least a personal token. Source: https://developers.google.com/gmail/api/auth/scopes and https://developers.notion.com/docs/authorization
- Risk: a mock-data demo proves the glasses UI but not the OAuth plumbing, which is the hardest part of this concept; judges score technical execution 20% and read-and-write 25%. Source: https://dorahacks.io/hackathon/even-realities/detail

### Key risks — Concept A

- Highest auth complexity of the three concepts: three separate auth systems (Google OAuth ×2 services, Notion token/OAuth) plus the WebView Google sign-in blocker. Source: https://dorahacks.io/hackathon/even-realities/detail and https://developers.google.com/gmail/api/auth/scopes
- Gmail `readonly` is a restricted scope, triggering verification + possible security assessment for any real-user deployment. Source: https://developers.google.com/gmail/api/auth/scopes
- Privacy/trust: judges and users will ask why a hackathon app wants to read their email; a mock demo sidesteps this but weakens the "real working integration" claim (the hackathon says all listed apps "have open APIs, so every team can build a real, working integration"). Source: https://dorahacks.io/hackathon/even-realities/detail
- Read-and-write scoring (25%) pushes toward reply-by-voice, which needs the sensitive `gmail.send` scope plus speech-to-text. Source: https://dorahacks.io/hackathon/even-realities/detail

---

## Concept B — Track 02 Crypto & DeFi: glanceable crypto ticker (Polymarket odds + CoinGecko prices, read-only)

Track 02 apps listed: Polymarket, Kalshi, Hyperliquid, CoinGecko, Gram Wallet, Trust Wallet. Source: https://dorahacks.io/hackathon/even-realities/detail
Track 02 read/write: live odds, prices, positions and wallet balances; place a testnet bet or order by voice, confirm with one tap. Source: https://dorahacks.io/hackathon/even-realities/detail
Money safety rule: demos use testnet, paper trading or read-only data; do not hold user funds; no financial advice. Source: https://dorahacks.io/hackathon/even-realities/detail

### Polymarket public API

- Official docs at https://docs.polymarket.com — "Build on the world's largest prediction market. APIs, SDKs, and tools for prediction market developers." Source: https://docs.polymarket.com/
- Gamma API (market discovery/metadata) base URL `https://gamma-api.polymarket.com`; CLOB API (order books/prices) base URL `https://clob.polymarket.com`. Source: https://github.com/charliemarketplace/range-bot/blob/HEAD/polymarket-btc-research/API_GUIDE.md
- Public reads through the Gamma and CLOB APIs need no authentication and no API key; there is no subscription and no paid data tier. Source: https://onfinality.io/en/learn/is-polymarket-api-free
- Official docs confirm `"security": []` (no auth) for the `/events` and `/markets` endpoints. Source: https://github.com/forgequant/sentinel/blob/HEAD/docs/research/polymarket-gamma-api-research.md
- Trading endpoints use wallet-based authentication (EIP-712 wallet signature + API key derived from it), not a billing account — irrelevant for a read-only concept. Source: https://onfinality.io/en/learn/is-polymarket-api-free
- Key endpoints: `GET /events` (max 50 per request, paginate with `offset`), `GET /markets`, `GET /events?tag_slug=crypto`, `GET /public-search?q=…`. Source: https://dev.to/vesper_finch/how-to-access-polymarket-data-with-python-no-api-key-needed-5d06 and https://github.com/forgequant/sentinel/blob/HEAD/docs/research/polymarket-gamma-api-research.md
- Each event contains markets with `outcomePrices` (yes/no prices). Source: https://dev.to/vesper_finch/how-to-access-polymarket-data-with-python-no-api-key-needed-5d06
- UNVERIFIED: exact public rate limits. No `X-RateLimit-*` headers were observed in one independent test; responses carry `cache-control: public, max-age=120` (2-minute CDN cache). Source: https://github.com/forgequant/sentinel/blob/HEAD/docs/research/polymarket-gamma-api-research.md
- UNVERIFIED (conflicting secondary claim): one guide lists Gamma limits of 4,000 / 300 / 500 (overall / markets / events) per IP via Cloudflare, introduced in warning mode July 2026 — could not confirm against official docs in this research. Source: https://www.botforpolymarket.com/polymarket-api
- Polymarket has a US API at `https://gateway.polymarket.us` (public part, no key) separate from the international endpoints — relevant only if targeting US users. Source: https://www.botforpolymarket.com/polymarket-api

### CoinGecko free API

- CoinGecko API is a REST API for crypto prices, market data, trading pairs, metadata and NFT floor prices. Source: https://www.coingecko.com/en/api
- Demo (free) plan: $0/month, 10,000 call credits/month, 50+ market-data endpoints, 1 year of historical data, 1 API key, no credit card required. Source: https://www.coingecko.com/en/api/acquisition/entry-plans?locale=hi
- CONFLICTING rate limits on CoinGecko's own pages: the pricing page says the Demo plan is 30 calls/min; the API landing page says 100 calls/min. Source: https://www.coingecko.com/en/api/acquisition/entry-plans?locale=hi and https://www.coingecko.com/en/api
- UNVERIFIED: which of 30 vs 100 calls/min is currently enforced — CoinGecko's own pages disagree; treat 30/min as the safe planning number. Source: (conflict between the two CoinGecko pages above)
- Demo endpoints are free but require keyed authentication (free Demo API key, signup with email + password, ~2 minutes). Source: https://www.coingecko.com/learn/crypto-arbitrage-bot-python?cgAndroidWebView=true
- One secondary source says the free tier works keyless at 30 calls/min; CoinGecko's own tutorial says demo endpoints require the key. Source: https://github.com/jadegate/jadegate/blob/HEAD/skills/coingecko-api/SKILL.md and https://www.coingecko.com/learn/crypto-arbitrage-bot-python?cgAndroidWebView=true
- Paid plans start at $35/month. Source: https://www.coingecko.com/en/api/acquisition/entry-plans?locale=hi
- Free-tier data freshness is ~1 minute (vs real-time on paid plans). Source: https://www.coingecko.com/learn/crypto-arbitrage-bot-python?cgAndroidWebView=true
- `/simple/price` returns prices for 500+ coins in a single call, so one call can cover a whole ticker. Source: https://www.coingecko.com/learn/best-free-crypto-api

### Demo without the user's real personal data — Concept B

- Fully feasible with 100% real data and zero personal data: Polymarket odds and CoinGecko prices are public market data; no user account, wallet, or personal information is involved. Source: https://onfinality.io/en/learn/is-polymarket-api-free and https://www.coingecko.com/en/api/acquisition/entry-plans?locale=hi
- No mock data needed at all — the demo is the real product. Source: (design judgement following from the public-data facts above)
- Read-only by design, so it satisfies the money-safety rule trivially (no funds, no trading). Source: https://dorahacks.io/hackathon/even-realities/detail

### Key risks — Concept B

- Weakest "read and write" score (25% of judging): a pure ticker is read-only, and the track's write action is placing a testnet bet/order — adding that reintroduces wallet auth and money-safety complexity. Source: https://dorahacks.io/hackathon/even-realities/detail
- Judging appeal: a price ticker is the most obvious G2 app and the easiest to clone; differentiation must come from curation (e.g. Polymarket odds vs price divergence, alerts) rather than the data feed itself. Source: (design judgement — no external source)
- CoinGecko rate-limit ambiguity (30 vs 100/min) and the 10,000 calls/month cap mean polling must be throttled/cached server-side; a 1-minute refresh is plenty for a glanceable ticker. Source: https://www.coingecko.com/en/api/acquisition/entry-plans?locale=hi
- Polymarket public rate limits are undocumented — aggressive polling could be throttled by Cloudflare. Source: https://github.com/forgequant/sentinel/blob/HEAD/docs/research/polymarket-gamma-api-research.md
- No financial advice rule: the app must present odds/prices without recommending trades. Source: https://dorahacks.io/hackathon/even-realities/detail

---

## Concept C — Track 01 Messaging & News: Telegram + AI-drafted replies on the glasses

Track 01 apps listed: Telegram (accounts, bots, channels, Mini Apps), Discord, Slack. Source: https://dorahacks.io/hackathon/even-realities/detail
Track 01 read/write: new messages, short digests of Telegram channels and crypto communities; reply by voice, or approve a reply drafted by an AI agent. Source: https://dorahacks.io/hackathon/even-realities/detail
Special prize: Best Telegram integration, $1,000, open to projects from any track. Source: https://dorahacks.io/hackathon/even-realities/detail

### Telegram Bot API

- The Bot API is an HTTP-based interface for building bots for Telegram; current version is Bot API 10.4 (Nov 9, 2026). Source: https://core.telegram.org/bots/api
- All Bot API queries are HTTPS in the form `https://api.telegram.org/bot<token>/METHOD_NAME`, GET or POST, JSON responses. Source: https://core.telegram.org/bots/api
- Each bot gets a unique authentication token when created via @BotFather; the token is the only credential. Source: https://core.telegram.org/bots/api
- The Bot API is free to use, with no paid tier for access and no per-call charge. Source: https://www.activepieces.com/blog/telegram-bot-api-rate-limits-file-sizes-errors
- Rate limits: about 1 message/second per chat, 20 messages/minute in a group, about 30 messages/second in bulk; paid broadcasts (0.1 Stars/message above 30/sec) need 100,000 Stars and 100,000 monthly active users. Source: https://www.anchorterminal.com/tools/telegram-bot
- A user must start the bot or add it to a group before it can message them. Source: https://www.anchorterminal.com/tools/telegram-bot
- A bot only sees chats it is a member of and only new updates; undelivered updates are kept at most 24 hours; a bot cannot see messages from other bots. Source: https://scrapeio.com/blog/is-the-telegram-api-free
- With privacy mode on, a bot in a group sees only commands, replies to it, and a few other cases; with privacy mode off or as admin it sees all messages except other bots'. Source: https://scrapeio.com/blog/is-the-telegram-api-free
- The Bot API has NO general history method — it cannot read messages posted before the bot joined. Source: https://www.mastros.online/blog/telegram-api-vs-browser-extension
- The Bot API server source is open (tdlib/telegram-bot-api) and can be self-hosted for larger files. Source: https://core.telegram.org/bots/api

### Telegram MTProto API (Telegram API / user client)

- MTProto is the protocol the official apps use; it acts as a user account tied to a phone number. Source: https://www.upload-post.com/telegram-api/
- Credentials are `api_id` + `api_hash` from my.telegram.org, plus a phone-number login (code, possibly 2FA). Source: https://www.upload-post.com/telegram-api/
- MTProto is free. Source: https://scrapeio.com/blog/is-the-telegram-api-free
- An MTProto user client can read full history of chats/channels the user can see, list dialogs, and search server-side — capabilities the Bot API lacks. Source: https://socialift.uz/en/blog/telegram-bot-api-vs-mtproto
- One api_id per phone number; flood waits apply; accounts using unofficial clients are placed under observation, and flooding, spam or faking metrics can get the account permanently banned. Source: https://scrapeio.com/blog/is-the-telegram-api-free
- Telegram API terms section 1.5 prohibits using data from Telegram to train or develop AI and machine-learning models. Source: https://scrapeio.com/blog/is-the-telegram-api-free
- UNVERIFIED (secondary source): whether AI-drafting replies from message content violates the ToS beyond the training prohibition — the terms text was not opened in this research. Source: (no official source opened in this research)

### Demo without the user's real personal data — Concept C

- Fully feasible with a dedicated test bot + test group/channel: create a throwaway bot via @BotFather, add it to a test group with only the team, and demo live send/receive/draft-approve flows with synthetic messages. Source: https://core.telegram.org/bots/api and https://www.anchorterminal.com/tools/telegram-bot
- NOT feasible to demo "your real Telegram inbox on glasses" with the Bot API — a bot cannot read the user's existing DMs or chats it was never added to. Source: https://scrapeio.com/blog/is-the-telegram-api-free
- Feasible but risky with MTProto: a throwaway Telegram account (separate phone number) could demo full inbox reading, but the account faces flood-wait/ban risk and the demo would need a real phone login during judging. Source: https://socialift.uz/en/blog/telegram-bot-api-vs-mtproto
- Channel digests are the cleanest demo: the bot joins public channels as a member and summarizes new posts — no personal chats involved. Source: https://scrapeio.com/blog/is-the-telegram-api-free

### Key risks — Concept C

- The concept as pitched ("Telegram + AI-drafted replies") splits in two: the Bot API version can only reply inside chats the bot was added to (narrow, but safe and demo-able); the "read my inbox" version needs MTProto with a personal phone login, ban risk, and ToS questions. Source: https://scrapeio.com/blog/is-the-telegram-api-free and https://socialift.uz/en/blog/telegram-bot-api-vs-mtproto
- Judges may expect the inbox version; delivering only the bot version risks a usefulness-score (30%) shortfall. Source: https://dorahacks.io/hackathon/even-realities/detail
- Privacy: showing real personal messages on a demo video or on stage is a privacy risk — the hackathon rules say to respect the privacy of the people whose messages you show. Source: https://dorahacks.io/hackathon/even-realities/detail
- Upside: the $1,000 Best Telegram integration special prize is open to any track, so a strong Telegram entry has two prize shots. Source: https://dorahacks.io/hackathon/even-realities/detail
- Speech-to-text is bring-your-own (raw mic audio from the SDK), so voice replies need a Whisper-class service on the backend. Source: https://dorahacks.io/hackathon/even-realities/detail

---

## Free LLM options for summarization / drafting (shared across concepts)

### Option 1 — Groq (hosted, free tier, recommended for the hackathon)

- Groq free tier requires no credit card; an API key is issued on signup. Source: https://ampm-aiops.com/en/guides/groq-special-2026/
- Per-model free limits: Llama 3.1 8B Instant — 30 req/min, 14,400 req/day, 6,000 tokens/min, 500,000 tokens/day. Source: https://ampm-aiops.com/en/guides/groq-special-2026/
- Llama 3.3 70B Versatile — 30 req/min, 1,000 req/day, 12,000 tokens/min, 100,000 tokens/day. Source: https://ampm-aiops.com/en/guides/groq-special-2026/
- GPT OSS 120B / 20B — 30 req/min, 1,000 req/day, 8,000 tokens/min, 200,000 tokens/day. Source: https://ampm-aiops.com/en/guides/groq-special-2026/
- Groq Compound — 30 req/min, 250 req/day, 70,000 tokens/min. Source: https://ampm-aiops.com/en/guides/groq-special-2026/
- Exceeding a limit returns HTTP 429. Source: https://ampm-aiops.com/en/guides/groq-special-2026/
- UNVERIFIED: these numbers come from secondary sources citing Groq's rate-limits doc (console.groq.com/docs/rate-limits); the official Groq page was not opened in this research, and limits are per-model, not one pool. Source: https://ampm-aiops.com/en/guides/groq-special-2026/
- Practical fit: one morning brief = 1 request; even the 70B's 1,000 req/day is far above hackathon demo needs. Source: (design judgement from the limits above)

### Option 2 — Google Gemini API (hosted, free tier)

- Gemini API has a free tier in Google AI Studio with no credit card. Source: https://publicapis.io/blog/is-gemini-api-free-lwle
- UNVERIFIED / conflicting: reported free-tier limits vary widely by source and date — e.g. Gemini 3.8 Flash at 5 req/min and 20 req/day in one Oct 2026 reading, vs older tables showing 10–15 req/min and 250–1,500 req/day for 2.x Flash models. Source: https://imisofts.com/blog/gemini-api-free-tier-limits/ and https://docs.orchable.app/guides/gemini-api-guide
- Google does not publish free-tier RPM/TPM/RPD numbers per model; its rate-limit page points to AI Studio for per-project limits and says specified limits are not guaranteed. Source: https://www.aifreeapi.com/en/posts/google-gemini-api-free-tier
- Free-tier prompts/responses may be used by Google to improve its models; opting out needs a paid tier. Source: https://www.linos.ai/technology/how-to-use-gemini-free-2026/
- Verdict: usable, but the 20 req/day figure (if current) is tight for a demo-heavy day; Groq is the safer primary. Source: (design judgement from the conflicting figures above)

### Option 3 — Ollama (local, no key, no cloud)

- Ollama runs LLMs locally: no API keys, no cloud costs, no data leaving the device; after the one-time model download it works offline. Source: https://www.guvi.in/blog/run-llms-with-ollama-and-python/
- Install with `curl -fsSL https://ollama.com/install.sh | sh`, then `ollama pull llama3.2` / `ollama run llama3.2`; server on `http://localhost:11434`, with an OpenAI-compatible endpoint at `/v1/`. Source: https://docs.warp.dev/guides/external-tools/how-to-set-up-ollama/
- No account required — Ollama is free and open source. Source: https://docs.warp.dev/guides/external-tools/how-to-set-up-ollama/
- Llama 3 8B fits on a machine with ~8 GB RAM (4-bit quantisation); 3B models need ~4 GB. Source: https://www.guvi.in/blog/run-llms-with-ollama-and-python/ and https://docs.warp.dev/guides/external-tools/how-to-set-up-ollama/
- Limitation for this hackathon: the app needs a backend server anyway (Even Hub requires API calls routed through your own server), so a local Ollama instance can only serve the demo if the backend runs on the same machine as the demo — it cannot be reached from a judge's phone/simulator remotely unless the backend is publicly hosted. Source: https://dorahacks.io/hackathon/even-realities/detail and https://docs.warp.dev/guides/external-tools/how-to-set-up-ollama/
- Best role: zero-cost fallback / offline dev summarizer; Groq as primary for the hosted demo. Source: (design judgement — no external source)

### Option 4 — Speech-to-text (needed for voice replies in A and C)

- The Even Hub SDK gives raw microphone audio; bring your own STT, e.g. Whisper. Source: https://dorahacks.io/hackathon/even-realities/detail
- Groq's Whisper Large V3 free tier: 20 req/min, 2,000 req/day, 7,200 audio-seconds/hour, 28,800 audio-seconds/day. Source: https://ampm-aiops.com/en/guides/groq-special-2026/
- UNVERIFIED: Whisper figures are from the same secondary source as the Groq text limits above. Source: https://ampm-aiops.com/en/guides/groq-special-2026/

---

## Ranking by buildability (7-day AI-agent build, free APIs only, simulator demo)

### 1. Concept B — Crypto ticker (Polymarket + CoinGecko) — easiest

- Zero auth for the core data (Polymarket public reads need no key). Source: https://onfinality.io/en/learn/is-polymarket-api-free
- CoinGecko needs only a free Demo key. Source: https://www.coingecko.com/learn/crypto-arbitrage-bot-python?cgAndroidWebView=true
- Demo uses 100% real public data with zero personal data. Source: (follows from the two facts above)
- Main weakness is judging: read-only scores weakly on "read and write" (25%), so add a write action that stays safe — e.g. one-tap paper-trade / watchlist add, or a voice-set price alert. Source: https://dorahacks.io/hackathon/even-realities/detail

### 2. Concept C — Telegram + AI-drafted replies — middle

- Bot API is free, trivial auth (one token), and a test bot + test group gives a fully live demo with no personal data. Source: https://core.telegram.org/bots/api
- Extra prize shot: $1,000 Best Telegram integration. Source: https://dorahacks.io/hackathon/even-realities/detail
- Main weakness is scope honesty: the Bot API cannot read the user's real inbox; the MTProto route that could is high-friction and ban/ToS-risky, so the concept must be scoped to bot chats + channel digests. Source: https://scrapeio.com/blog/is-the-telegram-api-free

### 3. Concept A — AI daily briefing (Gmail + Calendar + Notion) — hardest

- Three auth systems, Gmail restricted scope, Google sign-in blocked in the WebView, and the demo either exposes real private email or is mock data that doesn't prove the integration. Source: https://developers.google.com/gmail/api/auth/scopes and https://dorahacks.io/hackathon/even-realities/detail
- Highest judging upside if it works end-to-end (genuinely useful, strong read-and-write story), but the highest risk of spending the week on OAuth plumbing instead of the glasses UX. Source: (design judgement — no external source)

## Recommended LLM stack

- Primary: Groq free tier, Llama 3.1 8B Instant for short summaries/drafts (14,400 req/day) with Llama 3.3 70B as the quality option (1,000 req/day). Source: https://ampm-aiops.com/en/guides/groq-special-2026/
- Fallback: Ollama locally for offline dev. Source: https://docs.warp.dev/guides/external-tools/how-to-set-up-ollama/
- STT: Groq Whisper Large V3 free tier. Source: https://ampm-aiops.com/en/guides/groq-special-2026/

## Open items to verify before building (all UNVERIFIED)

- CoinGecko Demo rate limit: 30 vs 100 calls/min (own pages disagree). Source: https://www.coingecko.com/en/api/acquisition/entry-plans?locale=hi vs https://www.coingecko.com/en/api
- Polymarket public rate limits (undocumented; one secondary guide claims per-IP Cloudflare limits). Source: https://www.botforpolymarket.com/polymarket-api
- Groq free-tier numbers against the official console.groq.com/docs/rate-limits page. Source: https://ampm-aiops.com/en/guides/groq-special-2026/
- Gemini free-tier limits for the exact model to be used (Google publishes no per-model table). Source: https://www.aifreeapi.com/en/posts/google-gemini-api-free-tier
- Whether the Even Hub simulator + docs are accessible without registration (hackathon page says "free Even Hub simulator"; the docs URL was not opened). Source: https://dorahacks.io/hackathon/even-realities/detail
- Whether `calendar.readonly` is a sensitive/restricted scope. Source: (no official source found in this research)
- Notion free-workspace 1,000-block API-write limit. Source: https://www.lilachbullock.com/does-notion-have-an-api/
