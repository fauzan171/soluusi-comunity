import { bad } from '../../_lib/api';
import { who5Summary } from '../../_lib/scoring';
import { authed } from './auth';

// GET /api/admin/respondents — list + detail (PRD P0-8)
// ?id=N → detail 1 responden. Tanpa id → list ringkas.
export async function onRequestGet({ env, request }: any) {
  if (!authed(request, env)) return bad('Unauthorized', 401);
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id')) || null;

  if (id) {
    const row = await env.DB.prepare(
      'SELECT * FROM respondents WHERE id=?'
    ).bind(id).first();
    if (!row) return bad('Responden tidak ditemukan', 404);
    const summary = row.status === 'completed' ? who5Summary(row) : null;
    return Response.json({ respondent: row, summary }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const { results: rows } = await env.DB.prepare(
    'SELECT id, created_at, status, name, age, domicile, gender, complaint, q1, q2, q3, q4, q5 FROM respondents ORDER BY id DESC'
  ).all();
  const respondents = (rows ?? []).map((r: any) => {
    const summary = r.status === 'completed' ? who5Summary(r) : null;
    return {
      id: r.id, createdAt: r.created_at, status: r.status, name: r.name, age: r.age,
      domicile: r.domicile, gender: r.gender,
      complaintExcerpt: r.complaint.length > 80 ? r.complaint.slice(0, 80) + '…' : r.complaint,
      score: summary?.score ?? null, label: summary?.label ?? null, color: summary?.color ?? null,
    };
  });
  return Response.json({ respondents }, { headers: { 'Cache-Control': 'no-store' } });
}
