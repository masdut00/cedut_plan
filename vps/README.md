# WhatsApp AI Bot — Mas & Cece Wedding Saving

Paket ini menjalankan bot WhatsApp di VPS. Mas atau Cece cukup chat seperti **"Cece setor 1.5jt"**, lalu:

```
WhatsApp ──> Evolution API ──> n8n Webhook ──> Gemini (parsing) ──> Google Sheets (append)
                                                                       │
WhatsApp <── Evolution API <── n8n (rekap tabungan) <──────────────────┘
```

Dashboard web otomatis menampilkan transaksi baru saat tombol **Sinkronkan Google Sheets** ditekan.

## Isi folder

| File | Fungsi |
|---|---|
| `docker-compose.yml` | Service `n8n` (port 5678), `evolution-api` (port 8080), dan `postgres` (database Evolution API v2) |
| `.env.example` | Template konfigurasi (API key, nomor WhatsApp, ID Sheet) |
| `n8n-wedding-saving-workflow.json` | Workflow n8n siap impor |

## Prasyarat

- VPS Linux (Ubuntu 22.04+ disarankan), minimal 1 vCPU / 2 GB RAM.
- Docker & Docker Compose plugin terpasang:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER   # logout & login lagi
  ```
- Satu nomor WhatsApp khusus untuk bot (disarankan bukan nomor pribadi).
- Gemini API key gratis dari [Google AI Studio](https://aistudio.google.com/app/apikey).
- Akun Google pemilik Google Sheet tabungan.

## 1. Siapkan Google Sheet

1. Buka Sheet `1OoXCrAtdNQDTbkrABS2FVLOQJLP5KDBUoXv4IkcOEEQ`.
2. Pastikan tab **pertama** bernama `Transactions` (dashboard web membaca tab pertama / `gid=0`).
3. Baris 1 berisi header persis:
   ```
   id | tanggal | bulan | penabung | tipe | kategori | nominal | catatan | created_at
   ```
4. Agar dashboard bisa membaca data: **Share → General access → Anyone with the link → Viewer**.

## 2. Konfigurasi & jalankan stack

```bash
# di VPS
git clone <repo-anda> wedding-saving && cd wedding-saving/vps
cp .env.example .env
nano .env        # isi semua nilai "ganti-..." / "isi-..."
```

Buat nilai acak untuk secret:

```bash
openssl rand -hex 32   # N8N_ENCRYPTION_KEY
openssl rand -hex 24   # EVOLUTION_API_KEY
openssl rand -hex 16   # POSTGRES_PASSWORD
```

Isi `MAS_NUMBER` dan `CECE_NUMBER` dengan format internasional tanpa `+` (contoh `6281234567890`). Hanya dua nomor ini yang dilayani bot.

Jalankan:

```bash
docker compose up -d
docker compose ps          # ketiga service harus "running"
docker compose logs -f evolution-api   # Ctrl+C untuk keluar
```

Secara default port 5678 (n8n) dan 8080 (Evolution) hanya terbuka di `127.0.0.1` VPS — **jangan** buka port ini di firewall. Evolution mengirim webhook ke n8n lewat jaringan internal docker, jadi webhook tidak perlu publik. Akses UI dari laptop lewat SSH tunnel:

```bash
# jalankan di laptop, biarkan terminal terbuka
ssh -L 5678:localhost:5678 -L 8080:localhost:8080 user@IP-VPS
```

Lalu buka `http://localhost:5678` (n8n) dan `http://localhost:8080/manager` (Evolution) di browser laptop. Jika ingin akses permanen via domain, pasang reverse proxy HTTPS (Caddy/Nginx) — lihat bagian Keamanan.

## 3. Hubungkan WhatsApp (scan QR)

1. Buka `http://localhost:8080/manager` (via SSH tunnel) dan login memakai `EVOLUTION_API_KEY`.
2. **Create Instance** → nama **harus sama** dengan `EVOLUTION_INSTANCE` (default `wedding-bot`), channel *Baileys*.
3. Klik instance → **Get QR Code**.
4. Di HP nomor bot: WhatsApp → **Perangkat tertaut** → **Tautkan perangkat** → scan QR.
5. Status instance berubah menjadi **open / connected**.

Alternatif via API:

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: $EVOLUTION_API_KEY" -H "Content-Type: application/json" \
  -d '{"instanceName":"wedding-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}'
```

Webhook ke n8n sudah diset global lewat `docker-compose.yml` (`WEBHOOK_GLOBAL_URL=http://n8n:5678/webhook/wedding-saving`), jadi tidak perlu diatur per instance.

## 4. Impor workflow n8n

1. Buka `http://localhost:5678` (via SSH tunnel), buat akun owner n8n.
2. **Workflows → Import from File** → pilih `n8n-wedding-saving-workflow.json`.
3. Buat credential Google Sheets:
   - Buka node **Append ke Google Sheets** → *Credential* → **Create new** → *Google Sheets OAuth2 API*.
   - Ikuti panduan n8n untuk membuat OAuth Client di Google Cloud Console (aktifkan *Google Sheets API*, tambahkan redirect URL yang ditampilkan n8n).
   - Pilih credential yang sama di node **Baca Semua Transaksi**.
4. Klik **Save**, lalu aktifkan toggle **Active** (kanan atas). Webhook produksi hanya berjalan saat workflow aktif.

> Catatan: Google OAuth menerima redirect `http://localhost:5678/...`, jadi membuat credential lewat SSH tunnel berfungsi tanpa domain. Isi `N8N_HOST=localhost` dan `N8N_WEBHOOK_URL=http://localhost:5678/` di `.env` bila tidak memakai domain.

## 5. Uji coba

Kirim dari nomor Mas/Cece ke nomor bot:

| Pesan | Hasil |
|---|---|
| `Cece setor 1.5jt` | Setoran Cece Rp 1.500.000 dicatat |
| `nabung 2 juta bonus freelance` | Setoran pengirim, kategori Bonus & Freelance |
| `Bayar DP katering 5jt` | Pengeluaran Rp 5.000.000 kategori Katering |
| `rekap` | Balasan rekap tanpa mencatat |

Contoh balasan:

```
✅ Tercatat! Cece setoran Rp 1.500.000
🏷️ Tabungan Rutin · 📅 Oktober 2026

💍 Rekap Tabungan Mas & Cece
Terkumpul: Rp 56.500.000
Target: Rp 100.000.000
Sisa: Rp 43.500.000
Progress: ██████░░░░ 56%
Mas: Rp 40.000.000 | Cece: Rp 21.500.000
```

## Alur workflow

| Node | Tugas |
|---|---|
| Webhook WhatsApp | Menerima event `messages.upsert` dari Evolution API |
| Normalisasi Pesan | Ambil teks, abaikan grup & pesan sendiri, filter nomor Mas/Cece, siapkan prompt |
| Gemini Parser | Ekstrak JSON `{intent, penabung, tipe, kategori, nominal, catatan, bulan}` |
| Validasi Hasil AI | Tentukan aksi `append` / `rekap` / `error`, bangun baris sheet |
| Append ke Google Sheets | Tambah baris ke tab `Transactions` |
| Baca Semua Transaksi → Hitung Rekap | Hitung total, sisa, progress |
| Balas WhatsApp | Kirim balasan via Evolution API `sendText` |

## Troubleshooting

- **Bot tidak membalas** → cek tab *Executions* di n8n. Tidak ada eksekusi = webhook tidak sampai: pastikan workflow **Active** dan `docker compose logs evolution-api` tidak menampilkan error webhook.
- **Eksekusi berhenti di "Normalisasi Pesan"** → nomor pengirim tidak cocok dengan `MAS_NUMBER`/`CECE_NUMBER` (cek format `62...`). Setelah mengubah `.env`, jalankan `docker compose up -d` lagi.
- **Error `$env` access denied** → pastikan `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` ada di service n8n.
- **Gemini 404 / model not found** → ganti `GEMINI_MODEL` ke model Flash yang tersedia di AI Studio.
- **QR tidak muncul / instance disconnect** → `docker compose restart evolution-api`, lalu hubungkan ulang.

## Keamanan

- Jangan commit `.env`. Simpan API key hanya di VPS.
- Biarkan `BIND_ADDRESS=127.0.0.1`. Dengan `0.0.0.0`, siapa pun bisa memanggil webhook n8n dan memalsukan setoran, serta mencegat API key Evolution yang lewat HTTP polos.
- Butuh akses via domain? Pasang reverse proxy HTTPS (Caddy/Nginx) di depan n8n & Evolution dan tetap `BIND_ADDRESS=127.0.0.1`. Jangan proxy-kan path `/webhook/` n8n ke publik.
- Workflow juga menolak payload yang `instance`-nya bukan `EVOLUTION_INSTANCE` (lapisan tambahan, bukan pengganti).
- Gunakan password/API key acak yang panjang.
- Backup volume secara berkala: `docker run --rm -v vps_n8n_data:/data -v $PWD:/backup alpine tar czf /backup/n8n-backup.tgz /data`.
