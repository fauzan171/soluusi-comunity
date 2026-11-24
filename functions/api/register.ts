import { bad, readJSON } from '../_lib/api';

// POST /api/register — biodata responden (PRD P0-2)
const DOMICILES = [
  'KOTA JAKARTA SELATAN', 'KOTA JAKARTA TIMUR', 'KOTA JAKARTA BARAT',
  'KOTA JAKARTA PUSAT', 'KOTA JAKARTA UTARA', 'KAB. ADM. KEP. SERIBU', 'LUAR DKI',
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(body: any): { errors: Record<string, string> } | { data: {
  name: string; email: string; phone: string; domicile: string; birth_date: string; age: number; gender: string; complaint: string;
} } {
  const errors: Record<string, string> = {};
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const domicile = String(body.domicile ?? '').trim();
  const birth_date = String(body.birth_date ?? '').trim();
  const gender = String(body.gender ?? '').trim();
  const complaint = String(body.complaint ?? '').trim();

  if (!name) errors.name = 'Nama wajib diisi';
  if (!email || !EMAIL_RE.test(email)) errors.email = 'Email tidak valid';
  if (!phone || !/^\+?\d{9,15}$/.test(phone.replace(/[\s-]/g, ''))) errors.phone = 'Nomor telepon tidak valid';
  if (!DOMICILES.includes(domicile)) errors.domicile = 'Domisili tidak valid';
  if (gender !== 'L' && gender !== 'P') errors.gender = 'Jenis kelamin wajib dipilih';
  if (complaint.length < 20) errors.complaint = 'Ceritakan keluhan minimal 20 karakter';

  const birth = new Date(birth_date);
  if (!birth_date || Number.isNaN(birth.getTime())) {
    errors.birth_date = 'Tanggal lahir wajib diisi';
  } else {
    const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age < 13) errors.birth_date = 'Layanan ini untuk usia 13 tahun ke atas';
    if (age > 120) errors.birth_date = 'Tanggal lahir tidak valid';
    if (!errors.birth_date) return { data: { name, email, phone, domicile, birth_date, age, gender: gender as 'L' | 'P', complaint } };
  }
  return { errors };
}

export async function onRequestPost({ env, request }: any) {
  const body = await readJSON(request);
  const result = validateRegistration(body);
  if ('errors' in result) return bad(JSON.stringify(result.errors), 400);
  const d = result.data;
  const { meta } = await env.DB.prepare(
    'INSERT INTO respondents (name, email, phone, domicile, birth_date, age, gender, complaint, status) VALUES (?,?,?,?,?,?,?,?,?)'
  ).bind(d.name, d.email, d.phone, d.domicile, d.birth_date, d.age, d.gender, d.complaint, 'registered').run();
  return Response.json({ respondentId: meta.last_row_id }, { headers: { 'Cache-Control': 'no-store' } });
}
