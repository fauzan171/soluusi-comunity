# PRD: Community Wellbeing — Self-Assessment WHO-5

**Author**: Fauzan (PM: Claude)
**Date**: 2026-11-24
**Status**: Draft — menunggu konfirmasi Open Questions (OQ) sebelum dev
**Pattern acuan**: `mental-screening-kiosk-tvs` (React + Cloudflare Pages Functions + D1) — desain sistem sama, flow berbeda

---

## 1. Executive Summary

Web app di mana **user umum** (banyak, tanpa login) mengisi form biodata + keluhan, lalu mengerjakan **asesmen WHO-5 Well-Being Index** (5 pertanyaan kesejahteraan mental). **Admin** (PIN) melihat jumlah total responden, jawaban tiap responden, skor WHO-5, dan rekapnya di dashboard.

Beda dengan kiosk TVS: tidak ada multi-ahli/PIN per asesmen/handoff device — user mengisi sendiri dari perangkatnya masing-masing, sekali jalan (form → asesmen → selesai). Asesmen digunakan sebagai pra-konsultasi layanan mental health (konteks booking seperti Soluuusi/TVS).

## 2. Background & Context

Layanan konsultasi psikologi online saat ini menerima klien tanpa data kesejahteraan awal. Form booking yang ada (nama, domisili, jenis kelamin, telepon, tanggal lahir, keluhan) belum mengukur kondisi mental secara terstruktur. WHO-5 dipilih karena: singkat (5 item, <2 menit), valid secara klinis, gratis (public domain), dan skornya terstandar (0–100) sehingga bisa dipakai konsultan untuk triase.

## 3. Target Users & Roles

| Role | Siapa | Akses | Cara masuk |
|---|---|---|---|
| **User** | Calon klien konsultasi, awam, bisa banyak/bersamaan | Form biodata + asesmen WHO-5, 1x per kunjungan | Langsung buka `/` — tanpa login, tanpa akun |
| **Admin** | Penyelenggara (ops layanan) | Dashboard rekap + detail per responden + export | PIN di `/admin` (pattern sama kaya TVS: `ADMIN_PIN` env) |

### Non-Goals

1. Bukan sistem booking/jadwal/pembayaran — data konsultan & sesi di paste hanyalah konteks, bukan fitur.
2. Bukan multi-asesmen multi-ahli (beda dengan TVS) — hanya WHO-5.
3. Tidak ada akun user / login user / riwayat lintas kunjungan — satu user bisa isi ulang, tiap submit = responden baru (dibedakan per timestamp).
4. Bukan diagnostik klinis — WHO-5 = screening kesejahteraan; hasil interpretasi tetap dibaca konsultan.

## 4. End-to-End Flow

### 4.1 User (tanpa login)

```
IDLE/Landing (/)
  ├─ Intro singkat: apa ini, berapa lama (<2 menit), ke mana data pergi (privacy note)
  └─ Tombol "Mulai" besar
        ↓
STEP 1 — Form Biodata (semua wajib, validasi inline)
  - Nama lengkap (teks)
  - Email (format email)
  - Nomor Telepon (prefix +62, digit, min 9)
  - Domisili (dropdown: 5 kota administrasi DKI + "Luar DKI" — sesuai form asli; daftar final lihat OQ-1)
  - Tanggal Lahir (date picker; usia dihitung & tampil otomatis, tolak <13 tahun → OQ-3)
  - Jenis Kelamin (radio: Laki-laki / Perempuan)
  - Keluhan (textarea, min 20 karakter — label persis form asli:
    "Mohon jelaskan kondisi, kebutuhan utama, serta tujuan yang ingin kamu capai
     melalui layanan ini, termasuk konteks aktivitas harian atau situasi yang relevan")
        ↓ submit → POST /api/register (simpan biodata, status = registered)
STEP 2 — WHO-5 (5 pertanyaan, skala 0–5, wajib semua)
  - Satu pertanyaan per layar ATAU semua di satu layar (OQ-2)
  - Skala: 0 = Tidak pernah … 5 = Selalu (sepanjang 2 minggu terakhir)
  - Progress bar; bisa kembali mengubah jawaban sebelum submit
        ↓ submit → POST /api/assessment (simpan 5 jawaban + hitung skor server-side)
DONE — Layar terima kasih
  - Skor TIDAK ditampilkan ke user secara default (keputusan privasi — OQ-4)
  - Info: "Jawabanmu sudah tersimpan dan akan dibahas di sesi konsultasimu"
  - Tombol "Selesai" → kembali ke landing
```

**Write-as-you-go**: tiap step tersimpan begitu submit step-nya; refresh di tengah WHO-5 tidak menghilangkan jawaban yang sudah di-tap (state di `localStorage` + sync saat submit — sama kaya pattern TVS).

### 4.2 Admin (PIN)

```
/admin → form PIN → cookie session (pattern expert-auth TVS)
  ├─ RINGKASAN (default)
  │   - Total responden (registered / completed WHO-5 / drop-off form)
  │   - Distribusi skor WHO-5 (rata-rata, min, max)
  │   - Distribusi kategori: ≥68 Baik / 51–67 Sedang / 29–50 Buruk / ≤28 Indikasi depresi
  │   - Distribusi domisili & jenis kelamin (chart)
  ├─ TABEL RESPONDEN
  │   - 1 baris per responden: waktu submit, nama, usia, domisili, skor WHO-5 (chip warna),
  │     potongan keluhan, tombol detail
  ├─ DETAIL RESPONDEN
  │   - Biodata lengkap + keluhan full
  │   - 5 jawaban WHO-5 per pertanyaan + skor + kategori
  └─ EXPORT: CSV (P0) — Excel/PDF (P1, pattern excel-report TVS)
```

## 5. Instrumen WHO-5 (spesifikasi eksak)

Frasa Indonesia (terjemahan standar WHO-5), periode: **"selama 2 minggu terakhir"**:

| # | Pertanyaan | Skala |
|---|---|---|
| 1 | Saya merasa ceria dan bersemangat | 0–5 |
| 2 | Saya merasa tenang dan santai | 0–5 |
| 3 | Saya merasa aktif dan penuh energi | 0–5 |
| 4 | Saya bangun tidur dengan perasaan segar dan cukup beristirahat | 0–5 |
| 5 | Hidup saya penuh hal-hal yang menarik | 0–5 |

Label titik: `0 = Tidak pernah`, `1 = Sangat jarang`, `2 = Jarang`, `3 = Kadang-kadang`, `4 = Sering`, `5 = Selalu`.

**Skoring (server-side, jangan di FE)**: raw = Σ5 item (0–25) → skor = raw × 4 (0–100).

**Interpretasi (tampil di admin)**:

| Skor | Kategori | Warna | Makna |
|---|---|---|---|
| ≥68 | Baik | 🟢 | Kesejahteraan baik |
| 51–67 | Sedang | 🟡 | Perlu perhatian |
| 29–50 | Buruk | 🟠 | Kesejahteraan rendah |
| ≤28 | Indikasi depresi | 🔴 | Disarankan lanjut ke skrining depresi lanjutan |

(Cut-off standar literatur WHO-5: ≤50 = kesejahteraan buruk; ≤28 = konsisten dengan gejala depresi. Batas atas tiap rentang disesuaikan agar tidak ada gap — final lihat OQ-5.)

## 6. Requirements

### P0 — Must Have

| # | Story | Acceptance Criteria |
|---|---|---|
| P0-1 | User mulai dari landing yang jelas | Landing menampilkan judul, durasi, privacy note, tombol "Mulai" |
| P0-2 | User isi biodata | 7 field sesuai §4.1, semua wajib, validasi per field, usia auto dari tgl lahir, submit tersimpan di DB (`respondents` row, `status=registered`) |
| P0-3 | User isi WHO-5 | 5 pertanyaan skala 0–5, wajib semua terjawab sebelum submit, bisa koreksi jawaban, submit → `status=completed` + skor server-side |
| P0-4 | Data tidak hilang saat refresh | Jawaban WHO-5 tersimpan lokal; setelah submit step, refresh tidak mengulang dari nol |
| P0-5 | Skor dihitung benar | Server menghitung raw×4; admin detail menampilkan skor & kategori sesuai §5 |
| P0-6 | Admin login PIN | `/admin` minta PIN (`ADMIN_PIN` env, default dev `1209`), cookie httpOnly, salah PIN → error |
| P0-7 | Admin lihat rekap | Dashboard: total responden, distribusi kategori (count + chart), rata-rata skor |
| P0-8 | Admin lihat detail per responden | Tabel + detail: biodata, keluhan, 5 jawaban, skor, kategori, timestamp |
| P0-9 | Export CSV | Semua responden (biodata + jawaban + skor + kategori), nama file `wellbeing-YYYYMMDD.csv` |
| P0-10 | Landing siap user berikutnya | Setelah "Selesai" → landing bersih |

### P1 — Should Have

| # | Story | Acceptance Criteria |
|---|---|---|
| P1-1 | Admin export Excel berwarna per kategori | Pattern `excel-report.ts` TVS |
| P1-2 | Admin filter tabel | Filter kategori skor, domisili, tanggal |
| P1-3 | Admin statistik drop-off | % user yang submit form tapi tidak selesai WHO-5 |
| P1-4 | Tampilkan hasil ke user (opsional) | Konfigurasi on/off — default off (OQ-4) |

## 7. Data Model (D1)

```sql
-- 0001_init.sql
CREATE TABLE respondents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'registered',   -- registered | completed
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  domicile TEXT NOT NULL,                      -- nama kota dari dropdown
  birth_date TEXT NOT NULL,                    -- YYYY-MM-DD
  age INTEGER NOT NULL,                        -- dihitung saat submit
  gender TEXT NOT NULL CHECK (gender IN ('L','P')),
  complaint TEXT NOT NULL,                     -- textarea keluhan
  -- WHO-5: dijawab setelah biodata; NULL = belum
  q1 INTEGER, q2 INTEGER, q3 INTEGER, q4 INTEGER, q5 INTEGER,
  CHECK (q1 IS NULL OR (q1 BETWEEN 0 AND 5)),
  CHECK (q2 IS NULL OR (q2 BETWEEN 0 AND 5)),
  CHECK (q3 IS NULL OR (q3 BETWEEN 0 AND 5)),
  CHECK (q4 IS NULL OR (q4 BETWEEN 0 AND 5)),
  CHECK (q5 IS NULL OR (q5 BETWEEN 0 AND 5))
);
-- skor TIDAK disimpan kolom — dihitung on-the-fly (0 kolom, 0 drift: q1..q5 adalah single source of truth)
CREATE INDEX idx_respondents_status ON respondents(status);
```

Satu tabel cukup (YAGNI: 1 responden = 1 asesmen WHO-5 = 1:1, tidak perlu tabel `answers` terpisah).

## 8. API (Pages Functions)

| Endpoint | Method | Auth | Fungsi |
|---|---|---|---|
| `/api/register` | POST | publik | Validasi + insert biodata → `{respondentId}` |
| `/api/assessment` | POST | publik + `respondentId` | Validasi 5 jawaban, update row, hitung & return skor |
| `/api/admin/login` | POST | publik | PIN → cookie httpOnly |
| `/api/admin/summary` | GET | admin | Total, distribusi kategori, rata-rata skor |
| `/api/admin/respondents` | GET | admin | List (paginated, kolom ringkas) |
| `/api/admin/respondent` | GET `?id=` | admin | Detail 1 responden |
| `/api/admin/export` | GET | admin | CSV stream |

Skor & kategori dihitung di shared `_lib/scoring.ts` (dipakai summary + detail + export — 1 sumber perhitungan).

## 9. Success Metrics

| Metric | Target |
|---|---|
| Completion rate (form → WHO-5 selesai) | ≥85% |
| Durasi total user (form + 5 pertanyaan) | ≤3 menit median |
| Admin membuka dashboard & temukan 1 responden | ≤30 detik |
| Skor benar 100% | Hitung manual sampel 10 responden cocok |

## 10. Privacy & Keamanan

- Data kesehatan mental = sensitif: tampilkan privacy note di landing sebelum user isi apa pun.
- Admin session: cookie `httpOnly` + `SameSite=Strict`, expiry 8 jam.
- Rate-limit kasar di `/api/register` & `/api/assessment` (per-IP, KV/Durable Object — P1).
- PII di log dilarang (log hanya id + status, konsisten aturan global).
- CSV export hanya via admin auth.

## 11. Open Questions (blokir sebelum dev)

1. **OQ-1 — Daftar domisili**: form asli pakai dropdown kota DKI (Jakarta Selatan, dll). Cukup 6 opsi, atau perlu kab/kota lain? 
2. **OQ-2 — Layout WHO-5**: satu pertanyaan per layar (lebih fokus, pattern TVS) vs semua 5 di satu layar (lebih cepat)? Gw rekomendasi per layar.
3. **OQ-3 — Usia minimum**: tolak <13 tahun? (WHO-5 dirancang dewasa; versi remaja ada tapi beda wording).
4. **OQ-4 — Tampilkan skor ke user?**: default OFF (skrining dibahas konsultan, hindari self-diagnosis). Setuju?
5. **OQ-5 — Batas kategori**: tabel §5 pakai ≥68/51–67/29–50/≤28 tanpa gap. Konfirmasi atau cukup 2 level standar (≤50 / >50)?

## 12. Struktur Delivery

Fase 1 (core, P0): migrations + register + WHO-5 flow + admin login/summary/detail + CSV.
Fase 2 (P1): Excel berwarna, filter, drop-off, rate-limit.
Deploy target: `community-wellbeing.pages.dev` (repo `~/community-wellbeing`, skeleton sudah berdiri).
