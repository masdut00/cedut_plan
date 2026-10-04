# Wedding Saving App & WhatsApp AI Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi web dashboard interaktif "Mas & Cece Wedding Saving" (React + Vite + Tailwind CSS) yang membaca data live dari Google Sheets, memvisualisasikan progress target Rp 100.000.000, mensimulasikan waktu tercapai, dan menyediakan paket deployment n8n + WhatsApp Bot di VPS.

**Architecture:** Frontend React mandiri berbasis komponen yang mengambil data langsung dari Google Sheet publik via Google Visualization API (`/gviz/tq`), didukung penyimpanan cadangan `localStorage`. Dilengkapi paket konfigurasi Docker Compose dan workflow n8n bertenaga AI untuk input otomatis via chat WhatsApp di server VPS.

**Tech Stack:** React 18 / 19, Vite, Tailwind CSS, Lucide React, Vitest, Node.js, Docker, n8n.

**Spec:** `docs/superpowers/specs/2026-10-04-wedding-saving-design.md`

## Global Constraints
- Target Tabungan Pernikahan Default: `Rp 100.000.000`.
- ID Google Sheet Sumber: `1OoXCrAtdNQDTbkrABS2FVLOQJLP5KDBUoXv4IkcOEEQ`.
- Tema Warna Desain: Hangat, romantis, modern (*rose gold*, *sage green*, *warm slate*).
- Bahasa UI: Bahasa Indonesia yang bersahabat dan rapi.
- Harus dapat berjalan *offline-first* dengan *mock data* jika akses Google Sheets terkendala.

---

### Task 1: Scaffolding Proyek React + Vite + Tailwind CSS & Test Runner

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/index.css`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Test: `src/App.test.jsx`

**Interfaces:**
- Produces: Running Vite React environment with Tailwind CSS and Vitest test suite.

- [ ] **Step 1: Inisialisasi konfigurasi package.json dan Vite**
Tulis file `package.json` dengan dependencies `react`, `react-dom`, `lucide-react`, dan devDependencies `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `@testing-library/react`, `jsdom`.

- [ ] **Step 2: Pasang dependencies dengan npm install**
Jalankan: `npm install`
Pastikan instalasi sukses tanpa error.

- [ ] **Step 3: Buat vite.config.js, tailwind.config.js, dan postcss.config.js**
Konfigurasi Tailwind dengan palet warna wedding (`wedding-rose`, `wedding-gold`, `wedding-slate`).

- [ ] **Step 4: Buat test verifikasi awal App.test.jsx**
Tulis test sederhana untuk memastikan lingkungan pengujian Vitest + JSDOM berjalan.

- [ ] **Step 5: Jalankan npm test untuk memastikan test awal pass**
Jalankan: `npx vitest run`
Pastikan hasil: PASS.

- [ ] **Step 6: Commit hasil scaffolding**
Jalankan: `git add . && git commit -m "feat: scaffold react vite tailwind and test setup"`

---

### Task 2: Modul Kalkulasi Tabungan, Simulasi & Formatters (TDD)

**Files:**
- Create: `src/utils/calculations.js`
- Create: `src/utils/formatters.js`
- Test: `src/utils/calculations.test.js`
- Test: `src/utils/formatters.test.js`

**Interfaces:**
- Produces:
  - `formatRupiah(amount: number): string`
  - `calculateSummary(transactions: Array, targetAmount: number): { totalSavings, totalExpense, netSavings, remaining, percentComplete, masTotal, ceceTotal, masPercent, cecePercent }`
  - `calculateSimulation(remainingAmount: number, masPerMonth: number, cecePerMonth: number): { totalPerMonth, monthsNeeded, estimatedDate }`
  - `calculateMonthlyTrends(transactions: Array): Array<{ month, mas, cece, expense, net, cumulative }>`

- [ ] **Step 1: Tulis failing tests untuk formatters**
Test format mata uang Rupiah: `formatRupiah(100000000)` -> `"Rp 100.000.000"`, `formatRupiah(0)` -> `"Rp 0"`.

- [ ] **Step 2: Jalankan test formatters (pastikan fail)**
Jalankan: `npx vitest run src/utils/formatters.test.js`

- [ ] **Step 3: Implementasikan formatters di src/utils/formatters.js**
Tulis fungsi `formatRupiah` dan `formatShortRupiah` (misal 100jt -> "100 Jt").

- [ ] **Step 4: Tulis failing tests untuk kalkulasi tabungan dan simulasi**
Test skenario perhitungan transaksi: setoran Mas, setoran Cece, pengeluaran, sisa target, dan proyeksi sisa bulan.

- [ ] **Step 5: Jalankan test calculations (pastikan fail)**
Jalankan: `npx vitest run src/utils/calculations.test.js`

- [ ] **Step 6: Implementasikan logika di src/utils/calculations.js**
Implementasikan fungsi `calculateSummary`, `calculateSimulation`, dan `calculateMonthlyTrends`.

- [ ] **Step 7: Jalankan seluruh test utilitas dan pastikan lolos**
Jalankan: `npx vitest run src/utils/`
Pastikan semua test pass.

- [ ] **Step 8: Commit perubahan**
Jalankan: `git add src/utils/ && git commit -m "feat: implement calculations and formatters with unit tests"`

---

### Task 3: Layanan Google Sheets Fetcher & Local Storage Service

**Files:**
- Create: `src/services/googleSheetService.js`
- Create: `src/services/storageService.js`
- Create: `src/data/initialData.js`
- Test: `src/services/googleSheetService.test.js`

**Interfaces:**
- Produces:
  - `fetchSheetTransactions(sheetId: string): Promise<Array<Transaction>>`
  - `parseGVizResponse(responseText: string): Array<Transaction>`
  - `loadStoredTransactions(): Array<Transaction>`
  - `saveStoredTransactions(transactions: Array<Transaction>): void`

- [ ] **Step 1: Siapkan mock data awal (initialData.js)**
Data transaksi awal sesuai profil Mas & Cece sebagai *fallback* jika offline atau Google Sheet masih kosong.

- [ ] **Step 2: Tulis failing test untuk parser respons GViz Google Sheets**
Test parsing respons format `google.visualization.Query.setResponse({...})` menjadi array transaksi terstruktur.

- [ ] **Step 3: Implementasikan parseGVizResponse dan fetchSheetTransactions**
Tambahkan *fallback* elegan jika fetch gagal (koneksi terputus atau sheet diproteksi).

- [ ] **Step 4: Implementasikan storageService.js untuk persistensi lokal dan Export/Import**
Fungsi simpan, ambil dari `localStorage`, serta utilitas export JSON.

- [ ] **Step 5: Jalankan test layanan Google Sheets**
Jalankan: `npx vitest run src/services/`
Pastikan lolos.

- [ ] **Step 6: Commit perubahan**
Jalankan: `git add src/services/ src/data/ && git commit -m "feat: add google sheets fetcher and local storage service"`

---

### Task 4: Komponen Metric Cards, Progress Bar & Split Kontribusi

**Files:**
- Create: `src/components/MetricCards.jsx`
- Create: `src/components/WeddingProgressBar.jsx`
- Create: `src/components/ContributionSplit.jsx`
- Test: `src/components/MetricCards.test.jsx`

**Interfaces:**
- Consumes: `calculateSummary`, `formatRupiah` dari `src/utils/`
- Produces: Visual komponen kartu target, progres pencapaian dengan icon cincin/hati, dan rasio Mas vs Cece.

- [ ] **Step 1: Tulis test render untuk MetricCards**
Verifikasi kartu menampilkan nilai target, terkumpul, sisa kebutuhan, dan persentase dengan benar.

- [ ] **Step 2: Implementasikan MetricCards.jsx**
Desain 4 kartu metrik responsif dengan ikon Lucide (`Target`, `Wallet`, `HeartHandshake`, `Sparkles`).

- [ ] **Step 3: Implementasikan WeddingProgressBar.jsx**
Progress bar dengan milestone markers (25 Juta, 50 Juta, 75 Juta, 100 Juta).

- [ ] **Step 4: Implementasikan ContributionSplit.jsx**
Bar kontribusi Mas (biru/navy pastel) vs Cece (rose pink pastel) dengan nominal dan persentase.

- [ ] **Step 5: Jalankan test komponen metrik**
Jalankan: `npx vitest run src/components/MetricCards.test.jsx`

- [ ] **Step 6: Commit komponen**
Jalankan: `git add src/components/ && git commit -m "feat: add metric cards, wedding progress bar and contribution split"`

---

### Task 5: Komponen Simulator & Proyeksi Waktu Pernikahan

**Files:**
- Create: `src/components/SavingsSimulator.jsx`
- Test: `src/components/SavingsSimulator.test.jsx`

**Interfaces:**
- Consumes: `calculateSimulation`, `formatRupiah`
- Produces: Interactive simulator card with dual range sliders and projection outcome.

- [ ] **Step 1: Tulis test interaksi simulator**
Test perubahan slider nominal komitmen bulanan mengupdate estimasi sisa bulan dan tanggal target tercapai.

- [ ] **Step 2: Implementasikan SavingsSimulator.jsx**
Input/slider komitmen menabung Mas & Cece per bulan, kalkulasi otomatis total per bulan, sisa bulan, dan tanggal perkiraan.

- [ ] **Step 3: Jalankan test simulator**
Jalankan: `npx vitest run src/components/SavingsSimulator.test.jsx`

- [ ] **Step 4: Commit perubahan**
Jalankan: `git add src/components/SavingsSimulator.* && git commit -m "feat: add interactive savings simulator component"`

---

### Task 6: Komponen Grafik Akumulasi & Riwayat Transaksi

**Files:**
- Create: `src/components/MonthlyChart.jsx`
- Create: `src/components/TransactionHistory.jsx`
- Create: `src/components/AddTransactionModal.jsx`
- Test: `src/components/TransactionHistory.test.jsx`

**Interfaces:**
- Consumes: `calculateMonthlyTrends`, `formatRupiah`
- Produces: Monthly cumulative bar/area chart, searchable/filterable transaction table, modal input transaksi baru.

- [ ] **Step 1: Tulis test untuk TransactionHistory**
Test filter kategori (Semua / Mas / Cece / Pengeluaran) dan pencarian catatan.

- [ ] **Step 2: Implementasikan MonthlyChart.jsx**
Grafik visual pertumbuhan tabungan bulanan yang responsif tanpa dependensi berat yang memperlambat browser.

- [ ] **Step 3: Implementasikan TransactionHistory.jsx**
Tabel riwayat dengan badge penabung (Mas/Cece), tipe (Setoran/Pengeluaran), nominal berformat, dan tombol hapus.

- [ ] **Step 4: Implementasikan AddTransactionModal.jsx**
Modal form input cepat untuk menambah setoran/pengeluaran baru secara langsung dari web.

- [ ] **Step 5: Jalankan test transaksi**
Jalankan: `npx vitest run src/components/TransactionHistory.test.jsx`

- [ ] **Step 6: Commit komponen**
Jalankan: `git add src/components/ && git commit -m "feat: add monthly chart, transaction history and add modal"`

---

### Task 7: Integrasi Layout Utama, Live Sync & Build Verifikasi

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/Header.jsx`
- Test: `src/App.test.jsx`

**Interfaces:**
- Produces: Complete working application with live Google Sheet sync button, error/loading states, and responsive layout.

- [ ] **Step 1: Implementasikan Header.jsx**
Header dengan logo cincin/cinta, judul "Mas & Cece Wedding Saving", tombol "Sinkronkan Google Sheets", status indikator (Live / Cached), dan tombol backup data.

- [ ] **Step 2: Integrasikan semua komponen di src/App.jsx**
Gabungkan Header, MetricCards, ProgressBar, ContributionSplit, SavingsSimulator, MonthlyChart, dan TransactionHistory. Hubungkan dengan `fetchSheetTransactions`.

- [ ] **Step 3: Jalankan seluruh rangkaian test Vitest**
Jalankan: `npx vitest run`
Pastikan 100% test lulus.

- [ ] **Step 4: Jalankan build produksi Vite**
Jalankan: `npm run build`
Pastikan build direktori `dist/` berhasil tanpa error linter ataupun bundling.

- [ ] **Step 5: Commit integrasi final frontend**
Jalankan: `git add . && git commit -m "feat: integrate complete wedding saving dashboard and verify build"`

---

### Task 8: Paket Konfigurasi VPS (n8n + Evolution API + AI Workflow)

**Files:**
- Create: `vps/docker-compose.yml`
- Create: `vps/n8n-wedding-saving-workflow.json`
- Create: `vps/README.md`
- Create: `vps/.env.example`

**Interfaces:**
- Produces: Ready-to-deploy Docker Compose file for user's VPS, importable n8n workflow JSON, and step-by-step setup documentation.

- [ ] **Step 1: Buat vps/docker-compose.yml**
Definisi service `n8n` dan `evolution-api` beserta volume persistensi dan jaringan docker.

- [ ] **Step 2: Buat vps/.env.example**
Template variabel lingkungan untuk token Evolution API, n8n webhook URL, dan Gemini API key.

- [ ] **Step 3: Buat vps/n8n-wedding-saving-workflow.json**
Exportable blueprint n8n workflow yang berisi: Webhook WhatsApp -> Gemini AI Parser -> Google Sheet Append -> WhatsApp Reply.

- [ ] **Step 4: Buat vps/README.md panduan setup VPS**
Petunjuk langkah demi langkah menjalankan Docker Compose di VPS, menghubungkan nomor WhatsApp via QR code, dan mengimpor workflow ke n8n.

- [ ] **Step 5: Commit paket automasi VPS**
Jalankan: `git add vps/ && git commit -m "feat: add vps docker-compose, n8n ai workflow and setup documentation"`
