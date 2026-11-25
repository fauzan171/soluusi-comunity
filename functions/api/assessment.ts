import { bad, readJSON } from '../_lib/api.ts';
import { rateLimited, clientIp } from '../_lib/rate-limit.ts';
import { pss10Summary } from '../_lib/scoring.ts';

// POST /api/assessment — jawaban PSS-10 (10 item, skala 0–4)
// Balikan menyertakan skor + band agar peserta bisa melihat hasilnya sendiri.
export async function onRequestPost({ env, request }: any) {
  if (rateLimited(clientIp(request), 10, 60_000)) {
    return bad('Terlalu banyak percobaan. Coba lagi dalam 1 menit.', 429);
  }
  const body = await readJSON<{ respondentId?: number; answers?: number[] }>(request);
  const id = Number(body.respondentId);
  const answers = Array.isArray(body.answers) ? body.answers.map(Number) : [];
  if (!id || !Number.isInteger(id)) return bad('respondentId tidak valid');
  if (answers.length !== 10 || answers.some(a => !Number.isInteger(a) || a < 0 || a > 4)) {
    return bad('Semua 10 jawaban wajib (nilai 0–4)');
  }
  const { meta } = await env.DB.prepare(
    `UPDATE respondents SET q1=?,q2=?,q3=?,q4=?,q5=?,q6=?,q7=?,q8=?,q9=?,q10=?,status=?
     WHERE id=? AND status=?`
  ).bind(answers[0], answers[1], answers[2], answers[3], answers[4],
    answers[5], answers[6], answers[7], answers[8], answers[9],
    'completed', id, 'registered').run();
  if (!meta.changes) return bad('Responden tidak ditemukan atau asesmen sudah dikirim', 404);
  const result = pss10Summary(answers);
  return Response.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
}
