import { bad } from '../../_lib/api';
import { pss10Summary } from '../../_lib/scoring';
import { authed } from './auth';

// GET /api/admin/respondents — list + detail (PRD P0-8)
// ?id=N → detail 1 responden. Tanpa id → list ringkas.
export async function onRequestGet({ env, request }: any) {
  if (!authed(request, env)) return bad('Unauthorized', 401);
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id')) || null;

  if (id) {
    const row = await env.DB.prepare('SELECT * FROM respondents WHERE id=?').bind(id).first();
    if (!row) return bad('Responden tidak ditemukan', 404);
    const summary = row.status === 'completed'
      ? pss10Summary([row.q1, row.q2, row.q3, row.q4, row.q5, row.q6, row.q7, row.q8, row.q9, row.q10])
      : null;
    return Response.json({ respondent: row, summary }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const { results: rows } = await env.DB.prepare(
    'SELECT id, created_at, status, name, age, province, domicile, gender, complaint, q1,q2,q3,q4,q5,q6,q7,q8,q9,q10 FROM respondents ORDER BY id DESC'
  ).all();
  const respondents = (rows ?? []).map((r: any) => {
    const summary = r.status === 'completed'
      ? pss10Summary([r.q1, r.q2, r.q3, r.q4, r.q5, r.q6, r.q7, r.q8, r.q9, r.q10])
      : null;
    return {
      id: r.id, createdAt: r.created_at, status: r.status, name: r.name, age: r.age,
      province: r.province, domicile: r.domicile, gender: r.gender,
      complaintExcerpt: r.complaint.length > 80 ? r.complaint.slice(0, 80) + '…' : r.complaint,
      score: summary?.score ?? null, label: summary?.label ?? null, color: summary?.color ?? null,
      category: summary?.color ?? null,
    };
  });
  return Response.json({ respondents }, { headers: { 'Cache-Control': 'no-store' } });
}

// DELETE /api/admin/respondents?id=N — hapus 1 responden (fitur admin)
export async function onRequestDelete({ env, request }: any) {
  if (!authed(request, env)) return bad('Unauthorized', 401);
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id')) || null;
  if (!id) return bad('id wajib', 400);
  const { meta } = await env.DB.prepare('DELETE FROM respondents WHERE id=?').bind(id).run();
  if (!meta.changes) return bad('Responden tidak ditemukan', 404);
  return Response.json({ ok: true, deleted: id }, { headers: { 'Cache-Control': 'no-store' } });
}
