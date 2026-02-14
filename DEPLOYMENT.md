# Panduan Deploy ke DomaiNesia (Shared Hosting)

Strapi di-build di GitHub Actions (bukan di server) karena RAM shared hosting terbatas.
Setiap push ke branch `main` akan otomatis trigger deployment.

---

## Prasyarat

- Akses SSH ke shared hosting DomaiNesia
- cPanel dengan fitur **Setup Node.js App**
- Repository di GitHub

---

## Langkah 1 — Generate SSH Key di Server

SSH ke server DomaiNesia (port 64000), lalu jalankan:

```bash
ssh -p 64000 [username]@[SSH_HOST]
```

Setelah masuk, jalankan:

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

Setelah app dibuat, klik **"Edit"** lalu tambahkan environment variables berikut di bagian **"Environment variables"**:

```
APP_KEYS=<value dari .env lokal>
API_TOKEN_SALT=<value dari .env lokal>
ADMIN_JWT_SECRET=<value dari .env lokal>
JWT_SECRET=<value dari .env lokal>
DATABASE_CLIENT=postgres
DATABASE_HOST=<host database>
DATABASE_PORT=5432
DATABASE_NAME=<nama database>
DATABASE_USERNAME=<username database>
DATABASE_PASSWORD=<password database>
```

> **Catatan:** `NODE_ENV` dan `HOST` sudah otomatis diset oleh cPanel. `PORT` tidak perlu diset — Passenger mengelolanya via Unix socket.

---

## Langkah 4 — Setup GitHub Secrets

Di repository GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Tambahkan secrets berikut:

| Secret Name | Value |
|---|---|
| `SSH_PRIVATE_KEY` | Output dari `cat ~/.ssh/domainesia_deploy` di server (termasuk baris `-----BEGIN...` dan `-----END...`) |
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
GitHub Actions: npm ci (install semua deps)
    ↓
GitHub Actions: npm run build (build admin panel)
    ↓
GitHub Actions: rsync → kirim file ke ~/admin.inshanmedia.com/
    ↓
Server: npm install --omit=dev (install production deps)
    ↓
Server: touch tmp/restart.txt (restart Passenger)
    ↓
Selesai ✓
```

File yang **tidak** dikirim ke server:
- `node_modules/` — diinstall ulang di server
- `.env` — sudah diset via cPanel environment variables
- `public/uploads/` — konten upload tidak tertimpa
- `.git/`, `.github/` — tidak diperlukan di server

---

## Troubleshooting

### Deployment gagal di step "Install production dependencies"
Pastikan SSH key sudah terdaftar dengan benar di server dan secret `SSH_PRIVATE_KEY` sudah benar.

### App tidak jalan setelah deploy
Cek log di cPanel → **Errors** atau via SSH:
```bash
cat ~/admin.inshanmedia.com/tmp/restart.txt
# Pastikan file ini ada
```

### `strapi start` error: missing env variables
Pastikan semua environment variables sudah diisi di cPanel Node.js App → Edit → Environment variables.

### Port conflict
Gunakan PORT yang diberikan oleh cPanel, bukan 1337.
