import { bad } from '../../_lib/api';
import { pss10Summary } from '../../_lib/scoring';
import { authed } from './auth';

// GET /api/admin/summary — rekap ringkas (PRD P0-7)
export async function onRequestGet({ env, request }: any) {
  if (!authed(request, env)) return bad('Unauthorized', 401);
  const { results: rows } = await env.DB.prepare(
    'SELECT id, status, created_at, province, domicile, gender, age, q1,q2,q3,q4,q5,q6,q7,q8,q9,q10 FROM respondents ORDER BY id DESC'
  ).all();

  const completed = (rows ?? []).filter((r: any) => r.status === 'completed');
  const bands = { low: 0, medium: 0, high: 0 };
  let total = 0;
  const domiciles: Record<string, number> = {};
  const provinces: Record<string, number> = {};
  const genders = { L: 0, P: 0 };
  for (const r of completed) {
    const s = pss10Summary([r.q1, r.q2, r.q3, r.q4, r.q5, r.q6, r.q7, r.q8, r.q9, r.q10]);
    bands[s.color as keyof typeof bands]++;
    total += s.score;
    if (r.province) provinces[r.province] = (provinces[r.province] ?? 0) + 1;
    domiciles[r.domicile] = (domiciles[r.domicile] ?? 0) + 1;
    genders[r.gender as 'L' | 'P']++;
  }

  const questionAverages = Array.from({ length: 10 }, (_, i) => {
    const values = completed.map((r: any) => r[`q${i + 1}`]).filter((v: any) => v != null);
    return values.length ? Math.round((values.reduce((a: number, b: number) => a + b, 0) / values.length) * 100) / 100 : null;
  });

  return Response.json({
    totalRespondents: rows?.length ?? 0,
    completed: completed.length,
    registeredOnly: (rows?.length ?? 0) - completed.length,
    dropOffRate: rows?.length ? Math.round(((rows.length - completed.length) / rows.length) * 100) : 0,
    averageScore: completed.length ? Math.round((total / completed.length) * 10) / 10 : null,
    categories: bands,
    provinces,
    domiciles,
    genders,
    questionAverages,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
