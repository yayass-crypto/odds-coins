# Odds & Coins — Telegram bot

Bot Telegram untuk aplikasi hackathon Even Realities "Odds & Coins"
(Track 02 Crypto & DeFi). Bot ini adalah lapisan Telegram aplikasi:
menjawab harga/odds, dan mengirim alert ke chat yang sudah `/start`.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `/start` | Daftar chat + pesan sambutan |
| `/help` | Daftar perintah |
| `/price <koin>` | Harga live dari CoinGecko (contoh: `/price bitcoin`, `/price eth`) |
| `/odds` | 5 pasar crypto Polymarket teratas berdasarkan volume, harga Ya |
| `/ask <pertanyaan>` | Jawaban singkat (Groq gpt-oss-20b, maks 3 kalimat, tanpa saran finansial) |
| `/ping` | Cek bot hidup |

## Menjalankan

```text
# sekali jalan (foreground, long polling)
python3 bot.py

# latar belakang
nohup python3 bot.py > bot.log 2>&1 &
```

State tersimpan di `state.json` di samping file ini: offset update
terakhir + daftar chat yang pernah bicara dengan bot (tujuan alert).
Jangan hapus `state.json` saat bot berjalan — offset akan terulang dan
bot membalas pesan lama dua kali.

Kirim satu alert dari backend aplikasi:

```text
python3 bot.py --send <chat_id> <teks>
```

Atau dari kode Python lain:

```python
from bot import send_alert_all, load_state
send_alert_all(load_state(), "BTC menembus $61.000")
```

## Cara kerja

- Bot hanya bicara ke dunia luar lewat helper konektor yang sudah
  terverifikasi — tidak ada API key atau token di file ini:
  - `telegram.py` (custom.telegram) — kirim pesan + getUpdates
  - `coingecko.py` (custom.coingecko) — harga live
  - `groq.py` (custom.groq) — jawaban singkat
  - Polymarket Gamma API — publik, tanpa key
- Token bot tinggal di koneksi `custom.telegram`; helper menukar
  surrogate mentah di path URL (`/bot<token>/...`). Jangan pakai
  helper `url_with_surrogate_path_segment` bawaan — ia meng-encode
  persen surrogate-nya dan Telegram menjawab 404.
- Long polling: `getUpdates` dengan timeout 25 detik + offset yang
  disimpan, jadi tiap update diproses tepat sekali.

## Hal yang ditemukan saat membangun (Polymarket Gamma API)

- `/events` tanpa `order` mengembalikan event dari yang paling lama;
  `order=startDate&ascending=false` membawa event terbaru dulu.
- Parameter `active=true` TIDAK menyaring pasar yang sudah tutup
  (`closed: true`) — saring sendiri: `closed == false` dan
  `endDate` di masa depan.
- `outcomePrices` adalah string JSON (`'["0.55", "0.45"]'`), bukan
  list — `json.loads` dulu sebelum dibaca.
- `/markets` mengabaikan `tag_slug=crypto` (mengembalikan pasar
  politik teratas berdasarkan volume) — pakai `/events` dengan
  `tag_slug` untuk pasar crypto.

## Batasan

- Bot hanya bisa mengirim pesan ke chat yang sudah menekan Start.
- Rate limit Bot API: sekitar 1 pesan/detik per chat.
- Proses polling mati kalau VM di-restart — jalankan ulang, atau
  pasang sebagai service saat kickoff.
