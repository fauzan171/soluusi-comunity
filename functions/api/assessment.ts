import { bad, readJSON } from '../_lib/api.ts';
import { rateLimited, clientIp } from '../_lib/rate-limit.ts';

// POST /api/assessment — jawaban WHO-5 (PRD P0-3, P0-5)
// Skor TIDAK dikirim ke FE — kategori dibahas konsultan (OQ-4: default off).
export async function onRequestPost({ env, request }: any) {
  if (rateLimited(clientIp(request), 10, 60_000)) {
    return bad('Terlalu banyak percobaan. Coba lagi dalam 1 menit.', 429);
  }
  const body = await readJSON<{ respondentId?: number; answers?: number[] }>(request);
  const id = Number(body.respondentId);
  const answers = Array.isArray(body.answers) ? body.answers.map(Number) : [];
  if (!id || !Number.isInteger(id)) return bad('respondentId tidak valid');
  if (answers.length !== 5 || answers.some(a => !Number.isInteger(a) || a < 0 || a > 5)) {
    return bad('Semua 5 jawaban wajib (nilai 0–5)');
  }
  const { meta } = await env.DB.prepare(
    'UPDATE respondents SET q1=?, q2=?, q3=?, q4=?, q5=?, status=? WHERE id=? AND status=?'
  ).bind(answers[0], answers[1], answers[2], answers[3], answers[4], 'completed', id, 'registered').run();
  if (!meta.changes) return bad('Responden tidak ditemukan atau asesmen sudah dikirim', 404);
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
