# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # development mode (watch + auto-compile)
bun run build        # build admin panel untuk production
bun run start        # jalankan dalam production mode
```

> Package manager: **bun** (lokal). Server production pakai npm via nodevenv CloudLinux.

## Architecture

Strapi 5 headless CMS untuk InShan Media — platform edukasi islami untuk anak-anak. Diakses via REST API oleh frontend di `inshanmedia.com`.

### Content Types (`src/api/`)

| Collection | Relasi | Catatan |
|---|---|---|
| `article` | manyToOne → author, manyToMany ↔ category | `content` field pakai Blocks (rich text) |
| `product` | manyToMany ↔ category | `dimensions` & `tags` pakai JSON field |
| `author` | oneToMany → article | No draft/publish |
| `category` | manyToMany ↔ article, manyToMany ↔ product | No draft/publish, dipakai lintas collection |

### Seed Data (`src/index.ts`)

Bootstrap function menjalankan seed otomatis **hanya saat pertama kali** (cek `categoryCount > 0`). Berisi 3 kategori, 2 author, 3 artikel, dan 4 produk contoh.

### Config penting

- `config/middlewares.ts` — CORS dikonfigurasi untuk `inshanmedia.com`, `inshanmedia.netlify.app`, dan localhost dev ports
- `config/database.ts` — support MySQL, PostgreSQL, SQLite via `DATABASE_CLIENT` env var. Production pakai PostgreSQL
- `server.js` — Passenger entry point. Hanya panggil `app.start()`, **jangan** tambah `.register()` sebelumnya (menyebabkan double middleware)

### Deployment

CI/CD via GitHub Actions (`.github/workflows/deploy.yml`) ke DomaiNesia shared hosting:
- **Build di CI** — server RAM terbatas (1GB), tidak cukup untuk build
- **node_modules** — di-deploy ke `/home/inshanme/nodevenv/admin.inshanmedia.com/24/lib/node_modules/` (CloudLinux symlink, bukan folder di app root)
- **Env vars** — diset di cPanel, bukan via `.env` di server
- Panduan lengkap di `DEPLOYMENT.md`
