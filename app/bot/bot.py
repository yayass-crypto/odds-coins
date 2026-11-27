#!/usr/bin/env python3
"""Odds & Coins Telegram bot — complete bot service for the Even Realities
hackathon app (Track 02 Crypto & DeFi).

The bot is the Telegram layer of the app: it answers price/odds questions,
takes paper-portfolio alert subscriptions, and delivers alerts from the app
backend. It talks to the outside world only through the verified connector
helpers (telegram.py, coingecko.py, groq.py), so no API key or bot token
ever appears in this file, argv, env or logs.

Commands (Indonesian):
  /start  register this chat and show the welcome message
  /help   list commands
  /price <coin>   live price from CoinGecko, e.g. /price bitcoin
  /odds   top Polymarket crypto markets with Yes prices
  /ask <question>   short Groq answer about crypto/markets
  /alerts list your stored price alerts (created in the glasses app)
  /ping   health check

The long-polling loop also checks stored price alerts against live
prices about once a minute (check_alerts) and sends a Telegram message
to the alert's chat when one triggers, then deletes it via the backend.

Usage:
  bot.py                 run the long-polling loop (foreground)
  bot.py --self-test     process synthetic updates, print replies, send nothing
  bot.py --send <chat_id> <text>   send one alert message and exit

State lives beside this file: state.json (last update offset + chats).
Logs go to stdout; run under nohup or a service and capture the output.
"""
import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.expanduser("~")
TG = os.path.join(HOME, "workspace/custom-connectors/custom.telegram/bin/telegram.py")
CG = os.path.join(HOME, "workspace/custom-connectors/custom.coingecko/bin/coingecko.py")
GQ = os.path.join(HOME, "workspace/custom-connectors/custom.groq/bin/groq.py")
STATE_FILE = os.path.join(HERE, "state.json")

# Local backend (alerts store + cached prices). Override with
# ODDS_COINS_BACKEND when the backend runs elsewhere.
BACKEND_URL = os.environ.get("ODDS_COINS_BACKEND", "http://localhost:3001")
ALERT_CHECK_INTERVAL = 60  # seconds between alert poll cycles

POLY_EVENTS = ("https://gamma-api.polymarket.com/events"
               "?tag_slug=crypto&order=startDate&ascending=false&limit=20")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

# Common symbols to CoinGecko ids.
SYMBOLS = {
    "btc": "bitcoin", "eth": "ethereum", "sol": "solana", "bnb": "binancecoin",
    "xrp": "ripple", "doge": "dogecoin", "ada": "cardano", "trx": "tron",
    "avax": "avalanche-2", "link": "chainlink", "dot": "polkadot",
    "matic": "matic-network", "ltc": "litecoin", "atom": "cosmos",
    "near": "near", "usdt": "tether", "usdc": "usd-coin",
}

WELCOME = (
    "Halo! Aku bot Odds & Coins.\n\n"
    "Aku kirim harga crypto live dan odds Polymarket, plus alert buat "
    "portofolio kertas $10.000 kamu.\n\n"
    "Perintah:\n"
    "/price <koin> - harga live, contoh: /price bitcoin\n"
    "/odds - odds Polymarket crypto teratas\n"
    "/ask <pertanyaan> - tanya soal crypto/pasar\n"
    "/alerts - daftar alert harga kamu\n"
    "/ping - cek bot hidup\n"
    "/help - daftar perintah"
)

HELP = (
    "Perintah Odds & Coins:\n"
    "/price <koin> - harga live dari CoinGecko\n"
    "/odds - odds Polymarket crypto teratas\n"
    "/ask <pertanyaan> - jawaban singkat soal crypto/pasar\n"
    "/alerts - daftar alert harga kamu\n"
    "/ping - cek bot hidup\n"
    "/start - pesan sambutan"
)

# CoinGecko id -> symbol (for alert messages).
ID_TO_SYMBOL = {
    "bitcoin": "BTC", "ethereum": "ETH", "solana": "SOL",
    "binancecoin": "BNB", "ripple": "XRP", "dogecoin": "DOGE",
    "cardano": "ADA", "tron": "TRX",
}


def log(msg):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)


def run_helper(path, args, timeout=60):
    out = subprocess.run(
        [sys.executable, path, *args],
        capture_output=True, text=True, timeout=timeout,
    )
    if out.returncode != 0:
        raise RuntimeError(out.stderr.strip() or f"helper {path} failed")
    return json.loads(out.stdout)


# --- state ---------------------------------------------------------------

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"offset": 0, "chats": {}}


def save_state(state):
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    os.replace(tmp, STATE_FILE)


# --- telegram ------------------------------------------------------------

def send_message(chat_id, text):
    out = run_helper(TG, ["send", str(chat_id), text])
    if not out.get("ok"):
        raise RuntimeError(f"sendMessage failed: {out}")
    return out["result"]["message_id"]


def get_updates(offset, timeout=25):
    # Long-poll getUpdates through the telegram.py helper, which carries
    # the bot token via the connector (never in this file).
    out = run_helper(TG, ["updates", str(offset), str(timeout)])
    if not out.get("ok"):
        raise RuntimeError(f"getUpdates failed: {out}")
    return out["result"]


# --- data sources --------------------------------------------------------

def coin_price(coin):
    coin_id = SYMBOLS.get(coin.lower(), coin.lower())
    out = run_helper(CG, ["price", coin_id, "usd"])
    if coin_id not in out:
        return None
    return coin_id, out[coin_id]["usd"]


def top_odds():
    """Top 5 live crypto markets by volume, with Yes prices.

    Gamma /events defaults to oldest-first and its active flag does not
    exclude resolved markets. order=startDate&ascending=false brings the
    newest crypto events first; filter client-side to not-closed markets
    with endDate in the future, then sort by volume.
    """
    from datetime import datetime, timezone

    req = urllib.request.Request(POLY_EVENTS)
    req.add_header("User-Agent", UA)
    with urllib.request.urlopen(req, timeout=30) as resp:
        events = json.load(resp)
    now = datetime.now(timezone.utc)
    live = []
    for ev in events:
        for m in ev.get("markets") or []:
            if m.get("closed"):
                continue
            try:
                end = datetime.fromisoformat(
                    (m.get("endDate") or "").replace("Z", "+00:00"))
            except ValueError:
                continue
            if end <= now:
                continue
            prices = m.get("outcomePrices")
            if isinstance(prices, str):
                try:
                    prices = json.loads(prices)
                except ValueError:
                    prices = None
            try:
                yes = float((prices or ["?"])[0]) * 100
            except (TypeError, ValueError):
                continue
            live.append((float(m.get("volumeNum") or 0),
                         m.get("question") or ev.get("title") or "?", yes))
    live.sort(key=lambda row: row[0], reverse=True)
    return [f"- {q}: Ya {yes:.0f}%" for _, q, yes in live[:5]]


def ask_groq(question):
    prompt = (
        "Jawab singkat dalam Bahasa Indonesia, maksimal 3 kalimat, "
        "tentang crypto/pasar. Jangan memberi saran finansial, "
        "hanya fakta dan penjelasan.\n\nPertanyaan: " + question
    )
    out = run_helper(GQ, ["chat", "openai/gpt-oss-20b", prompt,
                          "--max-tokens", "300"])
    return out["choices"][0]["message"]["content"].strip()


# --- command handling ----------------------------------------------------

def handle_update(update, state, dry_run=False):
    """Return the reply text for one update (and send it unless dry_run)."""
    msg = update.get("message") or {}
    chat = msg.get("chat") or {}
    chat_id = chat.get("id")
    text = (msg.get("text") or "").strip()
    if not chat_id or not text:
        return None

    # Remember every chat that talks to the bot (alert destination).
    chats = state.setdefault("chats", {})
    chats[str(chat_id)] = {
        "username": chat.get("username"),
        "first_name": chat.get("first_name"),
        "type": chat.get("type"),
    }

    parts = text.split(None, 1)
    cmd = parts[0].lower().split("@")[0]
    arg = parts[1].strip() if len(parts) > 1 else ""

    if cmd == "/start":
        reply = WELCOME
    elif cmd == "/help":
        reply = HELP
    elif cmd == "/ping":
        reply = "Bot hidup. Odds & Coins siap."
    elif cmd == "/price":
        if not arg:
            reply = "Pakai: /price <koin>, contoh: /price bitcoin"
        else:
            try:
                found = coin_price(arg.split()[0])
            except Exception as exc:
                log(f"price error for {arg}: {exc}")
                found = None
            if found is None:
                reply = f"Koin '{arg}' tidak ketemu. Coba /price bitcoin atau /price eth."
            else:
                coin_id, usd = found
                reply = f"{coin_id}: ${usd:,.2f} (CoinGecko, live)"
    elif cmd == "/odds":
        try:
            lines = top_odds()
        except Exception as exc:
            log(f"odds error: {exc}")
            lines = []
        if not lines:
            reply = "Odds Polymarket lagi tidak bisa diambil. Coba lagi sebentar."
        else:
            reply = "Odds Polymarket crypto teratas (Ya):\n" + "\n".join(lines)
    elif cmd == "/alerts":
        try:
            alerts = fetch_alerts(chat_id)
        except Exception as exc:
            log(f"alerts list error: {exc}")
            alerts = None
        if alerts is None:
            reply = "Daftar alert lagi tidak bisa diambil. Coba lagi sebentar."
        elif not alerts:
            reply = ("Belum ada alert.\nBuat dari aplikasi Odds & Coins di "
                     "kacamata (layar Alerts).")
        else:
            lines = []
            for a in alerts:
                sym = ID_TO_SYMBOL.get(a.get("coin"), (a.get("coin") or "?").upper())
                word = "di atas" if a.get("direction") == "above" else "di bawah"
                try:
                    price_txt = f"${a.get('price'):,.0f}"
                except (TypeError, ValueError):
                    price_txt = str(a.get("price"))
                lines.append(f"- {sym} {word} {price_txt}")
            reply = "Alert kamu:\n" + "\n".join(lines)
    elif cmd == "/ask":
        if not arg:
            reply = "Pakai: /ask <pertanyaan>, contoh: /ask apa itu Polymarket?"
        else:
            try:
                reply = ask_groq(arg)
            except Exception as exc:
                log(f"ask error: {exc}")
                reply = "Maaf, jawabannya lagi tidak bisa diambil. Coba lagi sebentar."
    else:
        reply = "Perintah tidak dikenal. Ketik /help untuk daftar perintah."

    if not dry_run:
        send_message(chat_id, reply)
    return reply


def send_alert(chat_id, text):
    """Send an alert to one chat. Used by the app backend."""
    return send_message(chat_id, text)


def send_alert_all(state, text):
    sent = []
    for chat_id in state.get("chats", {}):
        try:
            send_alert(chat_id, text)
            sent.append(chat_id)
        except Exception as exc:
            log(f"alert to {chat_id} failed: {exc}")
    return sent


# --- backend alerts --------------------------------------------------------
# The backend (server/server.js) stores alerts on disk. The bot polls them
# about once a minute, sends a Telegram message when one triggers, then
# deletes it. Backend calls bypass the proxy (localhost).

def backend_get(path, timeout=10):
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    req = urllib.request.Request(BACKEND_URL + path)
    req.add_header("User-Agent", UA)
    with opener.open(req, timeout=timeout) as resp:
        return json.load(resp)


def fetch_alerts(chat_id=None):
    path = "/api/alerts"
    if chat_id is not None:
        path += "?chatId=" + urllib.parse.quote(str(chat_id))
    out = backend_get(path)
    return out if isinstance(out, list) else []


def delete_alert(alert_id):
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    req = urllib.request.Request(
        BACKEND_URL + "/api/alerts/" + urllib.parse.quote(str(alert_id)),
        method="DELETE",
    )
    with opener.open(req, timeout=10) as resp:
        return json.load(resp)


def check_alerts(state):
    """One alert poll cycle. Returns how many alerts fired."""
    try:
        alerts = fetch_alerts()
    except Exception as exc:
        log(f"alert check skipped (backend unreachable): {exc}")
        return 0
    if not alerts:
        return 0
    try:
        prices = backend_get("/api/prices")
    except Exception as exc:
        log(f"alert check skipped (prices unreachable): {exc}")
        return 0
    if isinstance(prices, dict):
        prices = prices.get("data") or []
    by_id = {row.get("id"): row for row in prices if isinstance(row, dict)}
    fired = 0
    for alert in alerts:
        row = by_id.get(alert.get("coin"))
        if not row or not isinstance(row.get("price_usd"), (int, float)):
            continue
        price = row["price_usd"]
        target = alert.get("price")
        direction = alert.get("direction")
        if not isinstance(target, (int, float)):
            continue
        hit = (direction == "above" and price >= target) or (
            direction == "below" and price <= target
        )
        if not hit:
            continue
        sym = ID_TO_SYMBOL.get(alert.get("coin"), (alert.get("coin") or "?").upper())
        word = "di atas" if direction == "above" else "di bawah"
        text = (
            f"Alert Odds & Coins: {sym} {word} ${target:,.0f} — "
            f"harga sekarang ${price:,.2f}."
        )
        try:
            send_message(alert["chatId"], text)
        except Exception as exc:
            log(f"alert {alert.get('id')} send failed: {exc}")
            continue
        try:
            delete_alert(alert["id"])
        except Exception as exc:
            log(f"alert {alert.get('id')} delete failed: {exc}")
        fired += 1
        log(f"alert fired: {sym} {word} ${target:,.0f} (now ${price:,.2f})")
    return fired


# --- polling loop --------------------------------------------------------

def poll_once(state):
    updates = get_updates(state.get("offset", 0))
    for update in updates:
        state["offset"] = update["update_id"] + 1
        try:
            reply = handle_update(update, state)
            if reply:
                log(f"update {update['update_id']}: replied")
        except Exception as exc:
            log(f"update {update['update_id']} error: {exc}")
    save_state(state)
    return len(updates)


def main(argv):
    if len(argv) >= 2 and argv[1] == "--self-test":
        state = {"offset": 0, "chats": {}}
        tests = [
            {"update_id": 1, "message": {"message_id": 1, "chat": {"id": 1, "type": "private", "username": "tester"}, "text": "/start"}},
            {"update_id": 2, "message": {"message_id": 2, "chat": {"id": 1, "type": "private", "username": "tester"}, "text": "/help"}},
            {"update_id": 3, "message": {"message_id": 3, "chat": {"id": 1, "type": "private", "username": "tester"}, "text": "/ping"}},
            {"update_id": 4, "message": {"message_id": 4, "chat": {"id": 1, "type": "private", "username": "tester"}, "text": "/price bitcoin"}},
            {"update_id": 5, "message": {"message_id": 5, "chat": {"id": 1, "type": "private", "username": "tester"}, "text": "/odds"}},
            {"update_id": 6, "message": {"message_id": 6, "chat": {"id": 1, "type": "private", "username": "tester"}, "text": "/ask apa itu Polymarket?"}},
            {"update_id": 7, "message": {"message_id": 7, "chat": {"id": 1, "type": "private", "username": "tester"}, "text": "/ngaco"}},
        ]
        for upd in tests:
            reply = handle_update(upd, state, dry_run=True)
            print(f"--- {upd['message']['text']!r} ---")
            print(reply)
        print("chats registered:", state["chats"])
        return 0

    if len(argv) >= 3 and argv[1] == "--send":
        mid = send_message(argv[2], argv[3])
        print(f"sent message_id={mid}")
        return 0

    log("Odds & Coins bot starting (long polling)")
    state = load_state()
    last_alert_check = 0
    while True:
        try:
            n = poll_once(state)
            if n:
                log(f"processed {n} update(s)")
        except Exception as exc:
            log(f"poll error: {exc}")
            time.sleep(5)
        # Price-alert poll (~once a minute, best effort, never blocks polling).
        if time.time() - last_alert_check >= ALERT_CHECK_INTERVAL:
            last_alert_check = time.time()
            try:
                fired = check_alerts(state)
                if fired:
                    log(f"alert check: {fired} fired")
            except Exception as exc:
                log(f"alert check error: {exc}")


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
