import { bad, readJSON } from '../../_lib/api';
import { authed } from '../admin/auth';
import { PROMO_CODE } from '../promo';

// Kode voucher: WB-XXXX-XXXX (kriptografis acak, mudah dibaca)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa I/O/0/1 (ambigu)

export function generateVoucherCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]);
  return `WB-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}`;
}

// POST /api/voucher — buat/tarik voucher untuk 1 responden (publik, idempotent)
// Body: { respondentId, consultantSlug }
// Voucher hanya untuk responden yang sudah menyelesaikan asesmen.
export async function onRequestPost({ env, request }: any) {
  const body = await readJSON<{ respondentId?: number; consultantSlug?: string }>(request);
  const respondentId = Number(body.respondentId);
  const consultantSlug = String(body.consultantSlug ?? '').trim();
  if (!respondentId || !Number.isInteger(respondentId)) return bad('respondentId tidak valid');
  if (!consultantSlug) return bad('Konsultan wajib dipilih');

  const respondent = await env.DB.prepare(
    'SELECT id, name, status FROM respondents WHERE id=?'
  ).bind(respondentId).first();
  if (!respondent) return bad('Responden tidak ditemukan', 404);
  if (respondent.status !== 'completed') return bad('Selesaikan asesmen dulu untuk mendapatkan voucher', 403);

  const existing = await env.DB.prepare(
    'SELECT code, consultant_slug, promo_code FROM vouchers WHERE respondent_id=?'
  ).bind(respondentId).first();

  if (existing) {
    if (existing.consultant_slug !== consultantSlug) {
      await env.DB.prepare('UPDATE vouchers SET consultant_slug=? WHERE respondent_id=?')
        .bind(consultantSlug, respondentId).run();
    }
    const promo = await promoStatus(env, existing.promo_code);
    return Response.json(
      { code: existing.code, consultantSlug, name: respondent.name, promo },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // Klaim kuota kampanye secara atomik: UPDATE bersyarat (satu statement,
  // tanpa read-then-write race). changes=0 berarti kuota habis/nonaktif.
  let promoCode: string | null = null;
  const claim = await env.DB.prepare(
    'UPDATE promo_campaigns SET claimed_count = claimed_count + 1 WHERE code=? AND active=1 AND claimed_count < max_claims'
  ).bind(PROMO_CODE).run();
  if (claim.meta.changes === 1) promoCode = PROMO_CODE;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateVoucherCode();
    try {
      await env.DB.prepare(
        'INSERT INTO vouchers (code, respondent_id, consultant_slug, promo_code) VALUES (?,?,?,?)'
      ).bind(code, respondentId, consultantSlug, promoCode).run();
      const promo = await promoStatus(env, promoCode);
      return Response.json({ code, consultantSlug, name: respondent.name, promo }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      // code collision — coba lagi
    }
  }
  // Insert gagal total: kembalikan kuota yang sempat diklaim supaya tidak bocor.
  if (promoCode) {
    await env.DB.prepare(
      'UPDATE promo_campaigns SET claimed_count = claimed_count - 1 WHERE code=? AND claimed_count > 0'
    ).bind(PROMO_CODE).run();
  }
  return bad('Gagal membuat kode voucher, coba lagi', 500);
}

async function promoStatus(env: any, promoCode: string | null) {
  if (!promoCode) return null;
  const row = await env.DB.prepare(
    'SELECT code, max_claims, claimed_count, discount_label FROM promo_campaigns WHERE code=?'
  ).bind(promoCode).first();
  if (!row) return null;
  return {
    code: row.code,
    discountLabel: row.discount_label,
    remaining: Math.max(0, row.max_claims - row.claimed_count),
    soldOut: row.claimed_count >= row.max_claims,
  };
}

// GET /api/voucher?id=N — detail voucher (admin atau pemilik via id)
export async function onRequestGet({ env, request }: any) {
  const url = new URL(request.url);
  const respondentId = Number(url.searchParams.get('id')) || null;
  if (!respondentId) return bad('id wajib');
  const row = await env.DB.prepare(
    `SELECT v.code, v.consultant_slug, v.created_at, r.name, r.status
     FROM vouchers v JOIN respondents r ON r.id = v.respondent_id
     WHERE v.respondent_id=?`
  ).bind(respondentId).first();
  if (!row) return bad('Voucher tidak ditemukan', 404);
  return Response.json(
    { code: row.code, consultantSlug: row.consultant_slug, createdAt: row.created_at, name: row.name },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

// PATCH admin: tandai voucher terpakai
export async function onRequestPatch({ env, request }: any) {
  if (!authed(request, env)) return bad('Unauthorized', 401);
  const body = await readJSON<{ code?: string }>(request);
  const code = String(body.code ?? '').trim().toUpperCase();
  if (!code) return bad('code wajib');
  const { meta } = await env.DB.prepare(
    "UPDATE vouchers SET redeemed_at=datetime('now') WHERE code=? AND redeemed_at IS NULL"
  ).bind(code).run();
  if (!meta.changes) return bad('Voucher tidak ditemukan atau sudah terpakai', 404);
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
