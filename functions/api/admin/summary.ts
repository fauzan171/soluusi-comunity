import { bad } from '../../_lib/api';
import { who5Summary } from '../../_lib/scoring';
import { authed } from './auth';

// GET /api/admin/summary — rekap ringkas (PRD P0-7)
export async function onRequestGet({ env, request }: any) {
  if (!authed(request, env)) return bad('Unauthorized', 401);
  const { results: rows } = await env.DB.prepare(
    'SELECT id, status, created_at, domicile, gender, age, q1, q2, q3, q4, q5 FROM respondents ORDER BY id DESC'
  ).all();

  const completed = (rows ?? []).filter((r: any) => r.status === 'completed');
  const categories = { good: 0, fair: 0, poor: 0, depression: 0 };
  let total = 0;
  const domiciles: Record<string, number> = {};
  const genders = { L: 0, P: 0 };
  for (const r of completed) {
    const s = who5Summary(r);
    categories[s.category as keyof typeof categories]++;
    total += s.score;
    domiciles[r.domicile] = (domiciles[r.domicile] ?? 0) + 1;
    genders[r.gender as 'L' | 'P']++;
  }
  return Response.json({
    totalRespondents: rows?.length ?? 0,
    completed: completed.length,
    registeredOnly: (rows?.length ?? 0) - completed.length,
    averageScore: completed.length ? Math.round((total / completed.length) * 10) / 10 : null,
    categories,
    domiciles,
    genders,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
