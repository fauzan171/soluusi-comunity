import * as XLSX from 'xlsx-js-style';
import type { ReportRespondent } from './report';

// Excel laporan wellbeing — baris diberi warna sesuai kategori skor (pattern MHI TVS).
const QUESTIONS = [
  'Q5 Merasa kesal', 'Q6 Tidak mampu mengendalikan hal penting', 'Q7 Gugup dan stres',
  'Q8 Percaya diri (R)', 'Q9 Sesuai keinginan (R)', 'Q10 Tidak mampu mengatasi',
  'Q11 Mampu mengendalikan jengkel (R)', 'Q12 Mampu mengendalikan keadaan (R)',
  'Q13 Marah di luar kendali', 'Q14 Kesulitan menumpuk',
];
const SCALE = ['Tidak pernah', 'Hampir tidak pernah', 'Kadang-kadang', 'Cukup sering', 'Sangat sering'];

const CATEGORY_FILL: Record<string, string> = {
  'Stres rendah': 'C6EFCE', 'Stres sedang': 'FFEB9C', 'Stres tinggi': 'FFC7CE',
};
const HEADER_FILL = { pattern: 'solid', fgColor: { rgb: '0A302B' } };

function border() {
  return { style: 'thin', color: { rgb: 'D0D7DE' } };
}

export function buildWellbeingWorkbook(respondents: ReportRespondent[], opts: { single: boolean }) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan
  const header = ['ID', 'Waktu Submit', 'Status', 'Nama', 'Email', 'Telepon', 'Provinsi', 'Kota/Kabupaten',
    'Tanggal Lahir', 'Usia', 'Jenis Kelamin', 'Keluhan',
    ...QUESTIONS, 'Skor PSS-10 (0-40)', 'Kategori'];
  const rows = respondents.map(r => [
    r.id, r.created_at, r.status === 'completed' ? 'Selesai' : 'Form saja', r.name, r.email, r.phone,
    r.province ?? '', r.domicile, r.birth_date, r.age, r.gender === 'L' ? 'Laki-laki' : 'Perempuan', r.complaint,
    ...Array.from({length:10},(_,i)=>i+1).map(i => (r as any)[`q${i}`] == null ? '' : `${(r as any)[`q${i}`]} - ${SCALE[(r as any)[`q${i}`]]}`),
    r.score ?? '', r.label ?? '',
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [...header.map(() => ({ wch: 14 })), { wch: 40 }];
  for (let c = 0; c < header.length; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: HEADER_FILL, alignment: { vertical: 'center' } };
  }
  for (let ri = 0; ri < rows.length; ri++) {
    const label = respondents[ri].label;
    const fill = label ? CATEGORY_FILL[label] : 'F3F4F6';
    for (let c = 0; c < header.length; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: ri + 1, c })];
      if (cell) cell.s = { fill: { pattern: 'solid', fgColor: { rgb: fill } }, border: { top: border(), bottom: border(), left: border(), right: border() } };
    }
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Ringkasan');

  // Sheet 2: Metodologi
  const meta: string[][] = [
    ['METODOLOGI PSS-10 (PERCEIVED STRESS SCALE)'],
    [],
    ['Instrumen', 'PSS-10 Perceived Stress Scale (10 item)'],
    ['Periode pengukuran', 'Dalam satu bulan terakhir'],
    ['Skala jawaban', '0 = Tidak pernah s.d. 4 = Sangat sering'],
    ['Perhitungan skor', '4 item reverse (Q8,Q9,Q11,Q12): skor = 4 - jawaban. Total 10 item = 0-40'],
    ['Kategori', '0-13 Stres rendah (hijau), 14-26 Stres sedang (kuning), 27-40 Stres tinggi (merah)'],
    ['Interpretasi', 'Kategori operasional untuk prioritas tindak lanjut, bukan diagnosis klinis'],
    ['Dibuat pada', new Date().toISOString()],
  ];
  const wsMeta = XLSX.utils.aoa_to_sheet(meta);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Metodologi');

  // ponytail: sheets terpisah Jawaban Lengkap tidak dibuat — Ringkasan sudah memuat semua jawaban; tambah saat butuh agregat per pertanyaan.
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
}
