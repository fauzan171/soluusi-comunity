import { bad } from '../../_lib/api';
import { buildVoucherPdf, voucherFilename } from '../../_lib/voucher-pdf';
import { CONSULTANT_MAP } from '../../_lib/consultants';

// GET /api/voucher/pdf?id=N — unduh voucher PDF atas nama responden
export async function onRequestGet({ env, request }: any) {
  const url = new URL(request.url);
  const respondentId = Number(url.searchParams.get('id')) || null;
  if (!respondentId) return bad('id wajib');

  const row = await env.DB.prepare(
    `SELECT v.code, v.consultant_slug, v.created_at, r.name
     FROM vouchers v JOIN respondents r ON r.id = v.respondent_id
     WHERE v.respondent_id=?`
  ).bind(respondentId).first();
  if (!row) return bad('Voucher belum dibuat', 404);

  const consultant = CONSULTANT_MAP[row.consultant_slug];
  if (!consultant) return bad('Konsultan tidak dikenal', 400);

  const issued = String(row.created_at ?? '').slice(0, 10);
  const bytes = await buildVoucherPdf({
    name: row.name,
    code: row.code,
    consultantName: consultant.name,
    consultantTitle: consultant.title,
    consultantCity: consultant.city,
    consultantUrl: consultant.url.replace(/^https?:\/\//, ''),
    issuedAt: issued,
  });

  return new Response(bytes as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${voucherFilename(row.name, row.code)}"`,
      'Cache-Control': 'no-store',
    },
  });
}
