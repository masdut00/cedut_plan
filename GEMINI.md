# Project Handoff: Mas & Cece Wedding Saving App & WhatsApp AI Bot

Dokumen ini berisi rangkuman status pengerjaan, arsitektur, dan panduan transisi untuk agen berikutnya agar dapat langsung melanjutkan eksekusi proyek tanpa kehilangan konteks.

---

## 1. Ikhtisar & Tujuan Proyek

- **Tujuan**: Membangun sistem pencatatan dan dashboard tabungan pernikahan untuk pasangan ("Mas & Cece") dengan target awal **Rp 100.000.000,00**.
- **Komponen Utama**:
  1. **Frontend Web Dashboard** (React + Vite + Tailwind CSS): Dashboard interaktif yang memvisualisasikan progress tabungan, rasio kontribusi Mas vs Cece, simulasi sisa bulan & estimasi tanggal target tercapai, grafik pertumbuhan, dan riwayat transaksi.
  2. **Google Sheets** (`1OoXCrAtdNQDTbkrABS2FVLOQJLP5KDBUoXv4IkcOEEQ`): Sebagai basis data utama (*single source of truth*).
  3. **Automasi WhatsApp Bot (n8n + AI) di VPS**: Pasangan dapat mencatat setoran/pengeluaran via WhatsApp ("Cece setor 1.5jt"), dianalisis otomatis oleh Gemini AI via n8n, di-append ke Google Sheets, lalu mengirim balasan status tabungan.

### Dokumen Referensi Kunci:
- **Spec Desain**: [`docs/superpowers/specs/2026-10-04-wedding-saving-design.md`](file:///C:/duta/tools_duta/procect-cedut/docs/superpowers/specs/2026-10-04-wedding-saving-design.md)
- **Implementation Plan**: [`docs/superpowers/plans/2026-10-04-wedding-saving-app.md`](file:///C:/duta/tools_duta/procect-cedut/docs/superpowers/plans/2026-10-04-wedding-saving-app.md)
- **SDD Progress Ledger**: [`.superpowers/sdd/2026-10-04-wedding-saving-app/progress.md`](file:///C:/duta/tools_duta/procect-cedut/.superpowers/sdd/2026-10-04-wedding-saving-app/progress.md)

---

## 2. Status Pekerjaan

Status saat ini: **semua Task 1–8 selesai**. 92 tests passed across 7 test files, `npm run build` sukses. Branch `feat/dashboard-completion` (belum di-merge ke `master`).

| Task | Status | Commit |
|---|---|---|
| 1. Scaffolding React + Vite + Tailwind + Vitest | ✅ | `f051e6c` |
| 2. Kalkulasi, simulasi & formatters | ✅ | `5320464` |
| 3. Google Sheets fetcher & local storage | ✅ | `7f18feb` |
| 4. Metric cards, progress bar, split kontribusi | ✅ | `3b02556` |
| 5. `SavingsSimulator` | ✅ | `b7212f7` |
| 6. `MonthlyChart`, `TransactionHistory`, `AddTransactionModal` | ✅ | `b6dea45` |
| 7. `Header` + integrasi `App.jsx` + build | ✅ | `6106f81` |
| 8. Paket VPS (`vps/`: compose, .env.example, workflow n8n, README) | ✅ (belum diuji di VPS/n8n nyata) | `bf3f386` |
| Final review fixes | ✅ | `c82dfef` |

### Keputusan desain penting
- Google Sheet = single source of truth. Tambah/hapus dari web hanya tersimpan di localStorage dan **tertimpa saat sinkronisasi** (UI menampilkan peringatan). Input resmi lewat WhatsApp bot.
- Stack VPS menambah `postgres` (wajib untuk Evolution API v2). Port n8n/Evolution default bind `127.0.0.1`; akses UI via SSH tunnel.
- Model Gemini diatur via env `GEMINI_MODEL` (default `gemini-2.5-flash`).
- Bot mendukung intent `rekap` (balas ringkasan tanpa mencatat).

## 3. Sisa Pekerjaan / Deferred Minors

- Uji end-to-end di VPS: impor workflow ke n8n, scan QR, kirim pesan uji.
- Pin versi image `n8n` (sekarang `latest`) dan pertimbangkan `evoapicloud/evolution-api` v2.3.x (dukungan `remoteJidAlt` untuk JID `@lid`); log pengirim `@lid` yang terbuang.
- Fitur tulis-balik transaksi web ke Google Sheet (mis. via webhook n8n).
- `AddTransactionModal`: reset pesan error saat modal ditutup.
- `App.jsx`: abaikan respons sinkronisasi yang sudah usang (request counter); tunda `URL.revokeObjectURL` setelah export.
- `calculateSimulation`: safeguard `setDate(1)` untuk tanggal akhir bulan.
- Deduplikasi sanitizer nominal (`parseNominal` vs `cleanNominal`).
- Verifikasi `Hitung Rekap` saat Google Sheets read mengembalikan angka berformat en-US.

---

## 4. Panduan Eksekusi untuk Agen Berikutnya

1. **Menjalankan Test Suite**:
   ```bash
   npx vitest run
   ```
2. **Menjalankan Development Server (Preview UI)**:
   ```bash
   npm run dev
   ```
3. **Mengecek Riwayat Git**:
   ```bash
   git log --oneline
   ```
4. **Langkah Berikutnya**:
   - Merge `feat/dashboard-completion` ke `master`.
   - Deploy bot mengikuti [`vps/README.md`](vps/README.md), lalu kerjakan daftar di Bagian 3.
