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

## 2. Status Pekerjaan yang SUDAH Selesai

Status saat ini: **65 tests passed across 5 test files**, repository git clean.

| Task | Status | Commit | File yang Dibuat / Diubah |
|---|---|---|---|
| **Task 1: Scaffolding React + Vite + Tailwind + Vitest** | ✅ Selesai & Review Approved | `f051e6c` | `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/index.css`, `src/main.jsx`, `src/App.jsx`, `src/App.test.jsx`, `src/setupTests.js` |
| **Task 2: Modul Kalkulasi Tabungan, Simulasi & Formatters (TDD)** | ✅ Selesai & Review Approved | `5320464` | `src/utils/formatters.js`, `src/utils/formatters.test.js`, `src/utils/calculations.js`, `src/utils/calculations.test.js` |
| **Task 3: Layanan Google Sheets Fetcher & Local Storage Service** | ✅ Selesai & Review Approved | `7f18feb` | `src/data/initialData.js`, `src/services/googleSheetService.js`, `src/services/storageService.js`, `src/services/googleSheetService.test.js` |
| **Task 4: Komponen Metric Cards, Progress Bar & Split Kontribusi** | ✅ Selesai (65 unit tests pass) | `3b02556` | `src/components/MetricCards.jsx`, `src/components/WeddingProgressBar.jsx`, `src/components/ContributionSplit.jsx`, `src/components/MetricCards.test.jsx` |

---

## 3. Status Pekerjaan yang PERLU Dikerjakan Selanjutnya

Berikut adalah 4 tugas yang tersisa berdasarkan rencana di [`docs/superpowers/plans/2026-10-04-wedding-saving-app.md`](file:///C:/duta/tools_duta/procect-cedut/docs/superpowers/plans/2026-10-04-wedding-saving-app.md):

### ⏳ Task 5: Komponen Simulator & Proyeksi Waktu Pernikahan
- **Files**:
  - `src/components/SavingsSimulator.jsx`
  - `src/components/SavingsSimulator.test.jsx`
- **Tugas**:
  - Buat komponen slider kemampuan menabung per bulan untuk Mas & Cece (default Mas Rp 2.500.000, Cece Rp 2.000.000).
  - Tampilkan hasil kalkulasi menggunakan `calculateSimulation`: Total/bulan, sisa bulan, dan perkiraan tanggal target Rp 100jt tercapai.
  - Tulis unit test untuk perubahan input slider dan verifikasi hasil proyeksi.

### ⏳ Task 6: Komponen Grafik Akumulasi & Riwayat Transaksi
- **Files**:
  - `src/components/MonthlyChart.jsx`
  - `src/components/TransactionHistory.jsx`
  - `src/components/AddTransactionModal.jsx`
  - `src/components/TransactionHistory.test.jsx`
- **Tugas**:
  - `MonthlyChart.jsx`: Visualisasi grafik batang/area kumulatif pertumbuhan tabungan per bulan.
  - `TransactionHistory.jsx`: Tabel transaksi dengan filter (`Semua`, `Mas`, `Cece`, `Pengeluaran`) dan fitur pencarian.
  - `AddTransactionModal.jsx`: Form modal untuk input manual transaksi baru (Tanggal, Bulan, Penabung, Tipe, Nominal, Catatan).
  - Tulis unit test untuk filter dan pencarian transaksi.

### ⏳ Task 7: Integrasi Layout Utama, Live Sync & Build Verifikasi
- **Files**:
  - `src/components/Header.jsx`
  - Modify `src/App.jsx`
  - Update `src/App.test.jsx`
- **Tugas**:
  - `Header.jsx`: Menampilkan judul pernikahan "Mas & Cece Wedding Saving", tombol sinkronisasi live Google Sheet, indikator status koneksi (Live / Offline Cache), dan tombol Export/Import JSON.
  - `App.jsx`: Menggabungkan semua komponen (Header, MetricCards, ProgressBar, ContributionSplit, SavingsSimulator, MonthlyChart, TransactionHistory).
  - Menghubungkan fungsi `fetchSheetTransactions` saat komponen pertama kali dibuka.
  - Verifikasi: Jalankan `npx vitest run` (pastikan 100% test pass) dan `npm run build` (pastikan folder `dist/` terbentuk tanpa error).

### ⏳ Task 8: Paket Konfigurasi VPS (WhatsApp Bot + n8n + AI Workflow)
- **Files**:
  - `vps/docker-compose.yml`
  - `vps/.env.example`
  - `vps/n8n-wedding-saving-workflow.json`
  - `vps/README.md`
- **Tugas**:
  - `docker-compose.yml`: Service `n8n` dan `evolution-api` (WhatsApp Gateway).
  - `n8n-wedding-saving-workflow.json`: Blueprint workflow n8n (Webhook WhatsApp -> AI Gemini Flash parser -> Append Google Sheets row -> Kirim balasan WhatsApp).
  - `vps/README.md`: Panduan lengkap langkah demi langkah untuk user deploy di VPS miliknya.

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
   - Mulai dari **Task 5**: Buat `src/components/SavingsSimulator.test.jsx` dan `src/components/SavingsSimulator.jsx`.
   - Gunakan fungsi `calculateSimulation(remainingAmount, masPerMonth, cecePerMonth)` dari `src/utils/calculations.js`.
   - Ikuti alur implementasi hingga **Task 8**.
