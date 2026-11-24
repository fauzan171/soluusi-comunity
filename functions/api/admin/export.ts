import { bad } from '../../_lib/api';
import { who5Summary, WHO5_QUESTIONS } from '../../_lib/scoring';
import { buildWellbeingPdf, safeFilename, type ReportRespondent } from '../../_lib/report';
import { buildWellbeingWorkbook } from '../../_lib/excel';
import { authed } from './auth';

// GET /api/admin/export — CSV / PDF / XLSX (PRD P0-9, P1-1)
// ?format=csv|pdf|xlsx  &id=N (export per responden)  &category= &domicile= &from= &to= (filter)
export async function onRequestGet({ env, request }: any) {
  if (!authed(request, env)) return bad('Unauthorized', 401);
  const url = new URL(request.url);
  const format = url.searchParams.get('format') ?? 'csv';
  const respondentId = Number(url.searchParams.get('id')) || null;
  const db = env.DB;

  const query = respondentId
    ? db.prepare('SELECT * FROM respondents WHERE id=?').bind(respondentId)
    : db.prepare('SELECT * FROM respondents ORDER BY id DESC');
  const { results: rows } = await query.all();
  if (respondentId && !(rows ?? []).length) return bad('Responden tidak ditemukan', 404);

  // Filter server-side (kategori skor / domisili / rentang tanggal) — pattern TVS export
  const category = url.searchParams.get('category');
  const domicile = url.searchParams.get('domicile');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const respondents: ReportRespondent[] = [];
  for (const r of rows ?? []) {
    const s = r.status === 'completed' ? who5Summary(r) : null;
    if (category && s?.category !== category) continue;
    if (domicile && r.domicile !== domicile) continue;
    if (from && r.created_at < from) continue;
    if (to && r.created_at > `${to} 23:59:59`) continue;
    respondents.push({ ...r, score: s?.score ?? null, label: s?.label ?? null });
  }

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  if (format === 'csv') {
    const header = ['ID', 'Waktu Submit', 'Status', 'Nama', 'Email', 'Telepon', 'Domisili',
      'Tanggal Lahir', 'Usia', 'Jenis Kelamin', 'Keluhan',
      ...WHO5_QUESTIONS, 'Skor WHO-5', 'Kategori'];
    const data = respondents.map(r => [
      r.id, r.created_at, r.status === 'completed' ? 'Selesai' : 'Form saja', r.name, r.email, r.phone,
      r.domicile, r.birth_date, r.age, r.gender === 'L' ? 'Laki-laki' : 'Perempuan', r.complaint,
      r.q1 ?? '', r.q2 ?? '', r.q3 ?? '', r.q4 ?? '', r.q5 ?? '',
      r.score ?? '', r.label ?? '',
    ]);
    const csv = [header, ...data]
      .map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    return new Response(`﻿${csv}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="wellbeing-${date}${filterSuffix(category, domicile)}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (format === 'pdf') {
    const scope = respondentId
      ? `Laporan individu - ${respondents[0].name}`
      : `Laporan seluruh responden - ${respondents.length} orang${category || domicile || from ? ' (terfilter)' : ''}`;
    const bytes = await buildWellbeingPdf(respondents, scope);
    const filename = respondentId
      ? `wellbeing-${safeFilename(respondents[0].name)}.pdf`
      : `wellbeing-${date}${filterSuffix(category, domicile)}.pdf`;
    return new Response(bytes as BodyInit, {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' },
    });
  }

  if (format === 'xlsx') {
    const bytes = buildWellbeingWorkbook(respondents, { single: !!respondentId });
    const filename = respondentId
      ? `wellbeing-${safeFilename(respondents[0].name)}.xlsx`
      : `wellbeing-${date}${filterSuffix(category, domicile)}.xlsx`;
    return new Response(bytes as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  return bad('format=csv|xlsx|pdf');
}

function filterSuffix(category?: string | null, domicile?: string | null): string {
  const parts: string[] = [];
  if (category) parts.push(category);
  if (domicile) parts.push(domicile.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  return parts.length ? `-${parts.join('-')}` : '';
}
