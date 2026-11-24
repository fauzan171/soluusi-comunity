import { bad } from '../../_lib/api';
import { who5Summary, WHO5_QUESTIONS } from '../../_lib/scoring';
import { authed } from './auth';

// GET /api/admin/export — CSV seluruh responden (PRD P0-9)
export async function onRequestGet({ env, request }: any) {
  if (!authed(request, env)) return bad('Unauthorized', 401);
  const { results: rows } = await env.DB.prepare(
    'SELECT * FROM respondents ORDER BY id DESC'
  ).all();

  const header = ['ID', 'Waktu Submit', 'Status', 'Nama', 'Email', 'Telepon', 'Domisili',
    'Tanggal Lahir', 'Usia', 'Jenis Kelamin', 'Keluhan',
    ...WHO5_QUESTIONS, 'Skor WHO-5', 'Kategori'];
  const data = (rows ?? []).map((r: any) => {
    const s = r.status === 'completed' ? who5Summary(r) : null;
    return [r.id, r.created_at, r.status === 'completed' ? 'Selesai' : 'Form saja', r.name, r.email, r.phone,
      r.domicile, r.birth_date, r.age, r.gender === 'L' ? 'Laki-laki' : 'Perempuan', r.complaint,
      r.q1 ?? '', r.q2 ?? '', r.q3 ?? '', r.q4 ?? '', r.q5 ?? '',
      s?.score ?? '', s?.label ?? ''];
  });
  const csv = [header, ...data]
    .map((row: any[]) => row.map((c: any) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return new Response(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="wellbeing-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
