# Design Specification: Wedding Saving App & WhatsApp AI Bot System

## 1. Overview & Goal
Sistem pengelolaan dan pemantauan tabungan pernikahan untuk pasangan ("Mas and Cece") dengan target awal Rp 100.000.000. Sistem mengintegrasikan:
1. **Frontend Web Dashboard** (React + Vite + Tailwind CSS): Dashboard interaktif yang memvisualisasikan capaian tabungan, sisa target, pembagian kontribusi Mas vs Cece, simulasi estimasi waktu target tercapai, dan riwayat transaksi.
2. **Google Sheets** (`1OoXCrAtdNQDTbkrABS2FVLOQJLP5KDBUoXv4IkcOEEQ`): Sebagai basis data utama (*single source of truth*).
3. **Automasi WhatsApp Bot (n8n + AI) di VPS**: Memungkinkan pasangan mencatat setoran/pengeluaran secara natural melalui chat WhatsApp ("Cece nabung 1.5jt bulan Oktober"), yang kemudian dianalisis oleh AI (Gemini Flash) dan dicatat otomatis ke Google Sheets, lalu mengirim balasan rekapitulasi status tabungan.

---

## 2. Arsitektur & Alur Data

```
[Pengguna via WhatsApp] ──> [Evolution API Gateway di VPS]
                                    │
                                    ▼ Webhook
                            [n8n Workflow Engine di VPS]
                                    │
                                    ▼ Prompt AI
                            [Google Gemini 2.0 Flash]
                                    │
                                    ▼ Parse Entity JSON
                            [n8n Google Sheets Node]
                                    │
                                    ▼ Append Row
                      [Google Sheet: Mas and Cece Saving]
                                    │
                                    ▼ Fetch Live JSON (gviz / CSV)
                        [React + Vite Web Dashboard]
                                    │
                                    ▼
                          [Tampilan Pasangan di Browser]
```

---

## 3. Skema Google Sheet

### Tab 1: `Transactions`
| Kolom | Tipe | Contoh Nilai | Deskripsi |
|---|---|---|---|
| `id` | String | `TX-1728080000000` | ID unik transaksi |
| `tanggal` | String (YYYY-MM-DD) | `2026-10-05` | Tanggal transaksi |
| `bulan` | String | `Oktober 2026` | Periode bulan tabungan |
| `penabung` | String | `Mas` / `Cece` / `Bersama` | Pihak yang menyetor atau mengeluarkan |
| `tipe` | String | `Setoran` / `Pengeluaran` | Jenis transaksi |
| `kategori` | String | `Tabungan Rutin` / `DP Gedung` | Kategori transaksi |
| `nominal` | Number | `2500000` | Nilai transaksi dalam Rupiah |
| `catatan` | String | `Transfer BCA gajian` | Keterangan tambahan |
| `created_at` | String (ISO) | `2026-10-05T10:15:00.000Z` | Waktu pencatatan |

### Tab 2: `Config`
| Key | Value | Keterangan |
|---|---|---|
| `target_amount` | `100000000` | Target total tabungan (Rp 100 juta) |
| `start_date` | `2026-10-01` | Tanggal mulai menabung |
| `target_date` | `2027-12-31` | Estimasi target tanggal pernikahan |

---

## 4. Spesifikasi Frontend Web Dashboard (React + Vite + Tailwind)

### A. Fitur Antarmuka
1. **Header & Status Target**:
   - Judul: "Mas & Cece Wedding Saving"
   - Ringkasan 4 Kartu Metrik:
     - **Target Tabungan**: Rp 100.000.000 (dapat diubah di pengaturan lokal).
     - **Total Terkumpul**: Jumlah kumulatif dari semua setoran dikurangi pengeluaran.
     - **Sisa Dibutuhkan (*Remainings*)**: Target - Total Terkumpul.
     - **Progress Capaian**: Persentase (%) dengan visual bar interaktif bertema pernikahan (aksen rose gold / sage green / soft navy).
2. **Kalkulator & Simulator Proyeksi Waktu**:
   - Input/Slider: Kemampuan menabung bulanan Mas (default Rp 2.500.000) dan Cece (default Rp 2.000.000).
   - Total Tabungan/Bulan = Tabungan Mas + Tabungan Cece.
   - Sisa Bulan = Sisa Target / Total Tabungan per Bulan.
   - Perkiraan Tanggal Target Tercapai (format: Bulan Tahun).
3. **Analisis Kontribusi Mas vs Cece**:
   - Perbandingan total nominal yang disetor Mas vs Cece.
   - Split persentase kontribusi (misal: Mas 55%, Cece 45%).
4. **Grafik Akumulasi Bulanan**:
   - Grafik garis atau batang kumulatif per bulan menuju garis target Rp 100 juta.
5. **Riwayat Transaksi & Filter**:
   - Filter tab: `Semua`, `Mas`, `Cece`, `Pengeluaran`.
   - Pencarian berdasarkan catatan atau bulan.
   - Tombol manual "Tambah Transaksi" (tersedia opsi input lokal / sinkronisasi).
   - Indikator Status Koneksi Google Sheet (Live Synced / Offline Mode).
6. **Data Resilience**:
   - Membaca live data Google Sheet melalui URL Google Visualization API (`/gviz/tq?tqx=out:json`).
   - Menyimpan salinan (*cache*) di `localStorage` peramban jika koneksi offline/gagal.
   - Fitur Backup/Restore: Export data ke JSON & Import JSON.

---

## 5. Spesifikasi WhatsApp Bot (n8n + AI di VPS)

### A. Komponen VPS
- **Docker Compose**:
  - Service `n8n`: Port 5678, persistent volume `n8n_data`.
  - Service `evolution-api`: Port 8080, persistent volume `evolution_instances`.
- **Model AI**: Google Gemini Flash API key (gratis dari Google AI Studio).

### B. n8n Workflow Blueprint
1. **Webhook Node**: Menerima payload pesan masuk dari Evolution API (`event: messages.upsert`).
2. **Filter Node**: Memastikan pesan berasal dari nomor yang diizinkan (Nomor WhatsApp Mas atau Cece).
3. **AI Agent / LLM Node**:
   - System Prompt bertugas mengekstrak entitas JSON:
     ```json
     {
       "penabung": "Mas" | "Cece" | "Bersama",
       "tipe": "Setoran" | "Pengeluaran",
       "kategori": "Tabungan Rutin" | "Katering" | "Venue" | "Lainnya",
       "nominal": 1500000,
       "catatan": "Keterangan",
       "bulan": "Oktober 2026"
     }
     ```
4. **Google Sheets Append Node**: Menambahkan data ke baris terakhir tab `Transactions`.
5. **WhatsApp Send Message Node**: Mengirim rekapitulasi balasan ke pengirim.

---

## 6. Rencana Pengujian
1. **Unit Testing (Frontend)**:
   - Kalkulasi sisa target dan persentase progress.
   - Logika simulasi sisa bulan berdasarkan komitmen bulanan.
   - Parser respons Google Sheets GViz JSON.
2. **Integrasi Testing**:
   - Pengujian koneksi fetch Google Sheets live.
   - Pengujian fallback offline ke `localStorage`.
   - Pengujian parsing prompt AI di n8n terhadap berbagai variasi format pesan chat WhatsApp.
