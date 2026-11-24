# Deploying the Odds & Coins backend (Render free tier)

No account has been created and nothing has been deployed yet — the steps
below are for the user (only the user can create the Render account and
paste the CoinGecko key). Free tier, no payment method required.

## Prerequisites

1. The `odds-coins` GitHub repo exists and contains this `server/` folder
   (the GitHub worker creates it).
2. A free CoinGecko **Demo API key**: sign up at
   https://www.coingecko.com/en/api (free Demo plan, email + password,
   no credit card) and copy the key from the dashboard. Keep it private —
   it goes only into Render's Environment tab, never into the repo.

## Option A — dashboard (recommended, ~5 minutes)

1. Go to https://dashboard.render.com and click **Sign up** (GitHub
   sign-up is easiest — it also makes repo access one click). No payment
   method is asked for on the free plan.
2. Click **New +** (top right) → **Web Service**.
3. Under "Source Code", pick **Build and deploy from a Git repository** →
   **Next**, connect/select the `odds-coins` GitHub repo.
4. Fill in:
   - **Name:** `odds-coins-server`
   - **Region:** Singapore (closest to WIB) — any region works.
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** **Free** ($0/month).
5. Click **Create Web Service** — the first deploy starts automatically.
6. While it builds, open the **Environment** tab (left sidebar) and add:
   - Key: `COINGECKO_API_KEY`, Value: `<your free CoinGecko Demo key>`
   - (Render sets `PORT` itself — do not set it.)
   Click **Save Changes** — Render redeploys with the key.
7. When the deploy shows **Live**, the URL is
   `https://odds-coins-server.onrender.com`. Verify in a browser or curl:
   - `https://odds-coins-server.onrender.com/health` → `{"ok":true}`
   - `https://odds-coins-server.onrender.com/api/prices` → 8 live coins
   - `https://odds-coins-server.onrender.com/api/markets` → 8 live markets

## Option B — Blueprint (same result, via `render.yaml`)

1. Copy `server/render.yaml` to the **repo root** as `render.yaml` and push.
2. In the Render dashboard: **New +** → **Blueprint** → connect the repo.
3. Give the Blueprint a name, click **Apply**. Render creates the same
   free web service.
4. Add `COINGECKO_API_KEY` in the service's **Environment** tab (step 6
   above) and redeploy if needed.

## After deploy — required app change

Add the Render domain to the Even Hub network whitelist in `app/app.json`
(`network` permissions) or the glasses app cannot fetch it. Example domain
to whitelist: `odds-coins-server.onrender.com`.

## Free-tier caveats (Render)

- **Cold starts:** free web services spin down after ~15 minutes of no
  traffic; the first request after idle takes ~30–60 s to wake. The
  server's 60 s / 120 s caches only help while it is awake. For the demo,
  hit `/health` once a few minutes before presenting.
- **750 free instance-hours/month** — one service running 24/7 fits.
- **No payment method** is required for the free plan; Render will never
  charge unless the plan is upgraded.

## Alternative free hosts (if Render is unavailable)

- **Fly.io** (free allowance, needs `fly launch` + a credit card on file
  for verification in some regions — NOT recommended under the no-payment
  rule) or **Railway** (trial credit, card required) — both need more
  setup than Render. Stick with Render unless it fails.
- The included `Dockerfile` (`node:24-alpine`, `CMD ["node", "server.js"]`)
  works on any Docker host; it reads `PORT` and `COINGECKO_API_KEY` from
  the environment.
