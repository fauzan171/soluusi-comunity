import { bad } from '../_lib/api';

export const PROMO_CODE = 'AKUPEDULIAKU1';

// GET /api/promo — sisa kuota kampanye (publik, untuk tampilan tiket)
export async function onRequestGet({ env }: any) {
  const row = await env.DB.prepare(
    'SELECT code, max_claims, claimed_count, discount_label, active FROM promo_campaigns WHERE code=?'
  ).bind(PROMO_CODE).first();
  if (!row) return bad('Kampanye tidak ditemukan', 404);
  return Response.json({
    code: row.code,
    maxClaims: row.max_claims,
    claimed: row.claimed_count,
    remaining: Math.max(0, row.max_claims - row.claimed_count),
    discountLabel: row.discount_label,
    active: !!row.active,
    soldOut: row.claimed_count >= row.max_claims,
  }, { headers: { 'Cache-Control': 'no-store' } });
}