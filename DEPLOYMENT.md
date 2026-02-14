# Panduan Deploy ke DomaiNesia (Shared Hosting)

Strapi di-build di GitHub Actions (bukan di server) karena RAM shared hosting terbatas.
Setiap push ke branch `main` akan otomatis trigger deployment.

---

## Prasyarat

- Akses SSH ke shared hosting DomaiNesia (port **64000**)
- cPanel dengan fitur **Setup Node.js App** (CloudLinux)
- Repository di GitHub

---

## Langkah 1 — Generate SSH Key di Server

SSH ke server DomaiNesia:

```bash
ssh -p 64000 [username]@[SSH_HOST]
```

Setelah masuk, generate SSH key:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/domainesia_deploy -N ""
```

Ini menghasilkan 2 file di server:
- `~/.ssh/domainesia_deploy` → private key (akan di-copy ke GitHub Secret)
- `~/.ssh/domainesia_deploy.pub` → public key (didaftarkan ke authorized_keys)

---

## Langkah 2 — Daftarkan Public Key di Server

Masih di SSH server, jalankan:

```bash
cat ~/.ssh/domainesia_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Lalu tampilkan private key untuk di-copy ke GitHub Secret:

```bash
cat ~/.ssh/domainesia_deploy
```

Salin seluruh output (termasuk baris `-----BEGIN OPENSSH PRIVATE KEY-----` dan `-----END OPENSSH PRIVATE KEY-----`).

---

## Langkah 3 — Setup Node.js App di cPanel

1. Login ke **cPanel** → cari menu **"Setup Node.js App"**
2. Klik **"Create Application"**
3. Isi form:

   | Field | Value |
   |---|---|
   | Node.js version | `24.x` |
   | Application mode | `Production` |
   | Application root | `/home/[username]/admin.inshanmedia.com` |
   | Application URL | `admin.inshanmedia.com` |
   | Application startup file | `server.js` |

4. Klik **"Create"**

### Tambahkan Environment Variables

Setelah app dibuat, klik **"Edit"** lalu tambahkan environment variables berikut:

```
APP_KEYS=<value dari .env lokal>
API_TOKEN_SALT=<value dari .env lokal>
ADMIN_JWT_SECRET=<value dari .env lokal>
JWT_SECRET=<value dari .env lokal>
TRANSFER_TOKEN_SALT=<value dari .env lokal>
ENCRYPTION_KEY=<value dari .env lokal>
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=<nama database>
DATABASE_USERNAME=<username database>
DATABASE_PASSWORD=<password database>
```

> **Catatan:**
> - `NODE_ENV` dan `HOST` sudah otomatis diset oleh cPanel
> - `PORT` tidak perlu diset — Passenger mengelolanya via Unix socket
> - Kalau belum punya `TRANSFER_TOKEN_SALT` atau `ENCRYPTION_KEY`, generate dengan: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

---

## Langkah 4 — Setup GitHub Secrets

Di repository GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Tambahkan secrets berikut:

| Secret Name | Value |
|---|---|
| `SSH_PRIVATE_KEY` | Output dari `cat ~/.ssh/domainesia_deploy` di server |
| `SSH_HOST` | Hostname SSH server DomaiNesia (cek di cPanel → SSH Access) |
| `SSH_USER` | Username SSH (sama dengan username cPanel) |
| `DEPLOY_PATH` | `~/admin.inshanmedia.com` |
| `APP_KEYS` | Value dari `.env` lokal |
| `API_TOKEN_SALT` | Value dari `.env` lokal |
| `ADMIN_JWT_SECRET` | Value dari `.env` lokal |
| `JWT_SECRET` | Value dari `.env` lokal |

---

## Langkah 5 — Push ke GitHub

```bash
git add .github/workflows/deploy.yml server.js DEPLOYMENT.md
git commit -m "add CI/CD deployment to DomaiNesia"
git push origin main
```

Setelah push, buka tab **Actions** di GitHub untuk memantau progress deployment.

---

## Alur Deployment

Setiap push ke branch `main`:

```
Push ke main
    ↓
GitHub Actions: checkout kode
    ↓
GitHub Actions: bun install --frozen-lockfile (install semua deps)
    ↓
GitHub Actions: bun run build (build admin panel)
    ↓
GitHub Actions: rm node_modules && bun install --production (prune dev deps)
    ↓
GitHub Actions: rsync app files → ~/admin.inshanmedia.com/ (tanpa node_modules)
    ↓
GitHub Actions: rsync node_modules → ~/nodevenv/.../lib/node_modules/
    ↓
Server: touch tmp/restart.txt (restart Passenger)
    ↓
Selesai ✓
```

File yang **tidak** dikirim ke folder app:
- `node_modules/` — di-deploy langsung ke path nodevenv CloudLinux
- `.env` — diset via cPanel environment variables
- `.htaccess` — dikelola cPanel/Passenger, tidak boleh tertimpa
- `.strapi`, `.strapi-updater.json` — runtime files Strapi
- `.well-known` — SSL/domain verification dari cPanel
- `public/uploads/` — konten upload tidak tertimpa
- `passenger.log` — log file server

---

## Troubleshooting

### Error: `Cannot find module '@strapi/strapi'`
`node_modules` belum terinstall di nodevenv. Pastikan step "Deploy node_modules to nodevenv" di CI berhasil. Cek path nodevenv:
```bash
ls /home/[username]/nodevenv/admin.inshanmedia.com/24/lib/node_modules/@strapi/
```

### Error: `Middleware strapi::compression has already been registered`
Terjadi jika `.register()` dipanggil manual sebelum `.start()` di `server.js`. Pastikan `server.js` hanya memanggil `app.start()` tanpa `.register()` eksplisit.

### Error: `Failed to fetch dynamically imported module`
Browser menyimpan cache JS lama yang tidak cocok dengan build terbaru. Lakukan hard refresh:
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### App tidak jalan setelah deploy
Cek log Passenger via SSH:
```bash
tail -50 ~/admin.inshanmedia.com/passenger.log
```
Atau restart manual dari cPanel → Setup Node.js App → klik **Restart**.

### Env variables hilang setelah edit di cPanel
Jangan hapus semua env vars sekaligus di cPanel — edit satu per satu. Kalau sudah terlanjur kosong, isi ulang sesuai daftar di Langkah 3.

### `npm list` menunjukkan UNMET DEPENDENCY
Jalankan `npm list` dari direktori app, bukan dari direktori nodevenv:
```bash
cd ~/admin.inshanmedia.com && npm list
```
