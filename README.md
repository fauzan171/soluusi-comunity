# Community Wellbeing — Self-Assessment WHO-5

User (tanpa login) mengisi form biodata + keluhan lalu mengerjakan asesmen
WHO-5 Well-Being Index (5 pertanyaan, skala 0–5). Admin (PIN) melihat rekap
responden, skor, kategori, dan export CSV. Lihat `prd.md` untuk spesifikasi
lengkap.

**Stack:** React 18 (Vite + Tailwind) + Cloudflare Pages Functions + Cloudflare D1.

## Dev

```bash
npm install
npx wrangler d1 migrations apply DB --local
npm run build
npx wrangler pages dev dist --port 8790 --binding ADMIN_PIN=1209
```

- `/` — flow user (landing → biodata → WHO-5 → selesai)
- `/admin` — dashboard admin (PIN local default `1209`)

## Deploy (sekali)

```bash
npx wrangler login
npx wrangler d1 create community-wellbeing-db
# salin database_id dari output ke wrangler.toml (ganti TODO_RUN_wrangler_d1_create)
npx wrangler d1 migrations apply community-wellbeing-db --remote
npm run deploy
```

Setelah deploy: set `ADMIN_PIN` di Cloudflare Pages → project →
Settings → Variables (default `1209` — WAJIB diganti di produksi).

## Struktur

- `src/` — React UI (flow user `src/App.tsx`, dashboard `src/admin/`)
- `functions/api/` — Pages Functions: `register`, `assessment`, `admin/*`
- `functions/_lib/` — shared: validasi, scoring WHO-5 (skor = Σ×4, kategori 🟢🟡🟠🔴)
- `migrations/` — skema D1 (satu tabel `respondents`)
- `prd.md` — Product Requirements Document

## Catatan desain

- Skor WHO-5 tidak disimpan di DB — dihitung on-the-fly dari `q1..q5`
  (single source of truth, dipakai summary/detail/export dari satu fungsi).
- Skor tidak ditampilkan ke user — dibahas konsultan (hindari self-diagnosis).
- Anti double-submit: `UPDATE ... WHERE status='registered'` (atomic).
