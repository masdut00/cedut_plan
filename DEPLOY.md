# Deploy Dashboard Tabungan Mas & Cece ke VPS

Satu-satunya panduan yang perlu diikuti untuk memasang dan meng-update dashboard di VPS.

- VPS: `103.127.99.234`
- Folder project di VPS: `~/projects/cedut_plan`
- Dashboard: `http://103.127.99.234:8081` (nanti `https://tabungan.domainmu.com`)

---

## A. Update (dipakai setiap ada perubahan)

Di laptop:

```bash
git add . && git commit -m "pesan perubahan" && git push
```

Di VPS:

```bash
cd ~/projects/cedut_plan && ./deploy.sh
```

`deploy.sh` menarik commit terbaru dari GitHub, build ulang dashboard, menjalankan ulang container, dan membersihkan image lama. Jangan edit file langsung di VPS (kecuali `vps/.env`), karena `git pull` akan gagal.

---

## B. Pasang pertama kali

```bash
cd ~/projects
git clone https://github.com/masdut00/cedut_plan.git && cd cedut_plan
cp vps/.env.example vps/.env
./deploy.sh
```

Buka port dashboard di firewall:

```bash
sudo ufw allow 8081/tcp
```

Cek:

```bash
docker ps --filter name=wedding-web      # STATUS harus "Up"
curl -sI http://127.0.0.1:8081 | head -1 # harus "HTTP/1.1 200 OK"
```

Lalu buka **http://103.127.99.234:8081** di browser.

> Sudah pernah pasang dengan `.env` lama? Samakan nilainya:
> ```bash
> sed -i 's/^WEB_BIND_ADDRESS=.*/WEB_BIND_ADDRESS=0.0.0.0/; s/^WEB_PORT=.*/WEB_PORT=8081/' vps/.env
> ./deploy.sh --no-pull
> ```

---

## C. Pindah ke domain (Rumahweb + Nginx Proxy Manager)

### 1. Record DNS di Rumahweb

Clientzone → Domain → **Kelola DNS** → Tambah Record:

| Kolom | Isi |
|---|---|
| Nama / Domain | `tabungan.domainmu.com` |
| TTL | `3600` (atau biarkan default) |
| Tipe | `A` |
| Value / Alamat | `103.127.99.234` |

Tunggu propagasi (biasanya beberapa menit, maksimal ~24 jam). Cek dari laptop:

```bash
nslookup tabungan.domainmu.com   # harus menampilkan 103.127.99.234
```

### 2. Proxy Host di Nginx Proxy Manager

Buka `http://103.127.99.234:81` → **Hosts → Proxy Hosts → Add Proxy Host**:

| Tab | Kolom | Isi |
|---|---|---|
| Details | Domain Names | `tabungan.domainmu.com` |
| Details | Scheme | `http` |
| Details | Forward Hostname / IP | `103.127.99.234` |
| Details | Forward Port | `8081` |
| Details | Block Common Exploits | ✔ |
| SSL | SSL Certificate | *Request a new SSL Certificate* |
| SSL | Force SSL, HTTP/2 Support | ✔ |

Save, lalu buka **https://tabungan.domainmu.com**.

Agar dashboard butuh password: **Access Lists → Add Access List** → tab *Authorization* isi username/password → pilih access list itu di tab *Details* proxy host.

### 3. (Opsional) Tutup akses via IP

Setelah domain jalan, agar dashboard hanya bisa dibuka lewat domain (dengan HTTPS & password):

1. Cari network docker NPM: `docker inspect <container-npm> -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'`
2. Di `vps/.env`: `PROXY_NETWORK=<nama-network>` dan `WEB_BIND_ADDRESS=127.0.0.1`, lalu `./deploy.sh --no-pull`.
3. Di NPM ubah proxy host: Forward Hostname `wedding-web`, Forward Port `80`.
4. `sudo ufw delete allow 8081/tcp`

---

## D. Bot WhatsApp (nanti, setelah AI siap)

Bot (n8n + Evolution API + Postgres) dimatikan secara default. Untuk menyalakan: isi bagian n8n/Evolution/AI di `vps/.env`, set `COMPOSE_PROFILES=bot`, lalu `./deploy.sh --no-pull`. Panduan lengkap: [`vps/README.md`](vps/README.md).

---

## E. Simpan transaksi dari dashboard ke Google Sheet

Tanpa langkah ini, tambah/hapus transaksi di dashboard hanya tersimpan di browser dan hilang saat sinkronisasi. Jembatannya adalah Google Apps Script (`apps-script/Code.gs`) yang menulis ke Sheet atas nama akun Google kamu.

1. **Buat token rahasia** (di VPS): `openssl rand -hex 24` → simpan hasilnya.
2. **Pasang script**: buka Google Sheet → **Extensions → Apps Script**. Hapus isi `Code.gs` bawaan, tempel seluruh isi [`apps-script/Code.gs`](apps-script/Code.gs), klik **Save** (ikon disket).
3. **Simpan token**: ikon ⚙️ **Project Settings** → *Script Properties* → **Add script property**: Property `WRITE_TOKEN`, Value = token dari langkah 1 → **Save script properties**.
4. **Deploy**: **Deploy → New deployment** → ikon ⚙️ *Select type* → **Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Klik **Deploy** → **Authorize access** → pilih akun Google → *Advanced* → *Go to … (unsafe)* → **Allow**.
   - Salin **Web app URL** (berakhiran `/exec`).
5. **Cek**: buka URL itu di browser → harus tampil `{"ok":true,"message":"Wedding Saving write API aktif."}`.
6. **Isi `vps/.env`** lalu deploy ulang:
   ```bash
   nano vps/.env
   # SHEET_WRITE_URL=https://script.google.com/macros/s/xxxx/exec
   # SHEET_WRITE_TOKEN=<token dari langkah 1>
   ./deploy.sh --no-pull
   ```
7. **Uji**: tambah transaksi di dashboard → muncul *"Transaksi tersimpan ke Google Sheet."* dan baris baru ada di Sheet. Hapus transaksi akan meminta konfirmasi lalu menghapus barisnya di Sheet.

Jika `Code.gs` di repo berubah: tempel ulang di Apps Script → **Deploy → Manage deployments** → ✏️ → *Version*: **New version** → **Deploy** (URL tetap sama).

> **Keamanan:** token ikut tertanam di kode dashboard, jadi siapa pun yang bisa membuka dashboard bisa melihatnya. Lindungi dashboard dengan password (Access List di NPM, bagian C). Jika token bocor: buat token baru, ganti `WRITE_TOKEN` di Script Properties dan `SHEET_WRITE_TOKEN` di `vps/.env`, lalu `./deploy.sh --no-pull`.

---

## Troubleshooting

| Masalah | Cek |
|---|---|
| `deploy.sh` gagal `git pull` | `git status` — ada file yang diubah di VPS. Buang dengan `git checkout -- .` |
| Dashboard tidak terbuka via IP | `docker ps -a --filter name=wedding-web`, `docker logs wedding-web`, `sudo ufw status` |
| Port 8081 sudah dipakai | Ganti `WEB_PORT` di `vps/.env` (mis. `8082`), `./deploy.sh --no-pull`, sesuaikan di NPM |
| NPM "502 Bad Gateway" | Pastikan `curl -sI http://103.127.99.234:8081` dari VPS menjawab 200 |
| "Token tidak valid." saat simpan | `SHEET_WRITE_TOKEN` di `vps/.env` harus sama persis dengan `WRITE_TOKEN` di Script Properties; lalu `./deploy.sh --no-pull` |
| "Kolom ... tidak ada di baris 1" | Header baris 1 Sheet harus: `id, tanggal, bulan, penabung, tipe, kategori, nominal, catatan, created_at` |
| Simpan gagal "Failed to fetch" | Deployment Apps Script harus *Who has access: Anyone*; cek URL berakhiran `/exec` (bukan `/dev`) |
| Data tidak muncul | Google Sheet harus *Share → Anyone with the link → Viewer*, tab pertama bernama `Transactions` |
