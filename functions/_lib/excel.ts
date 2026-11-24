import * as XLSX from 'xlsx-js-style';
import type { ReportRespondent } from './report';

// Excel laporan wellbeing — baris diberi warna sesuai kategori skor (pattern MHI TVS).
const QUESTIONS = [
  'Saya merasa ceria dan bersemangat',
  'Saya merasa tenang dan santai',
  'Saya merasa aktif dan penuh energi',
  'Saya bangun tidur dengan perasaan segar dan cukup beristirahat',
  'Hidup saya penuh hal-hal yang menarik',
];
const SCALE = ['Tidak pernah', 'Sangat jarang', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu'];

const CATEGORY_FILL: Record<string, string> = {
  'Baik': 'C6EFCE', 'Sedang': 'FFEB9C', 'Buruk': 'FFD8A8', 'Indikasi depresi': 'FFC7CE',
};
const HEADER_FILL = { pattern: 'solid', fgColor: { rgb: '0A302B' } };

function border() {
  return { style: 'thin', color: { rgb: 'D0D7DE' } };
}

export function buildWellbeingWorkbook(respondents: ReportRespondent[], opts: { single: boolean }) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan
  const header = ['ID', 'Waktu Submit', 'Status', 'Nama', 'Email', 'Telepon', 'Domisili',
    'Tanggal Lahir', 'Usia', 'Jenis Kelamin', 'Keluhan',
    ...QUESTIONS, 'Skor WHO-5', 'Kategori'];
  const rows = respondents.map(r => [
    r.id, r.created_at, r.status === 'completed' ? 'Selesai' : 'Form saja', r.name, r.email, r.phone,
    r.domicile, r.birth_date, r.age, r.gender === 'L' ? 'Laki-laki' : 'Perempuan', r.complaint,
    ...[1, 2, 3, 4, 5].map(i => (r as any)[`q${i}`] == null ? '' : `${(r as any)[`q${i}`]} - ${SCALE[(r as any)[`q${i}`]]}`),
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
    ['METODOLOGI WHO-5 WELL-BEING INDEX'],
    [],
    ['Instrumen', 'WHO-5 Well-Being Index (5 item, public domain WHO)'],
    ['Periode pengukuran', 'Selama 2 minggu terakhir'],
    ['Skala jawaban', '0 = Tidak pernah s.d. 5 = Selalu'],
    ['Perhitungan skor', 'Skor = (jumlah 5 jawaban) x 4, rentang 0-100'],
    ['Kategori', '>=68 Baik (hijau), 51-67 Sedang (kuning), 29-50 Buruk (oranye), <=28 Indikasi depresi (merah)'],
    ['Interpretasi', 'Kategori operasional untuk prioritas tindak lanjut, bukan diagnosis klinis'],
    ['Dibuat pada', new Date().toISOString()],
  ];
  const wsMeta = XLSX.utils.aoa_to_sheet(meta);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Metodologi');

  // ponytail: sheets terpisah Jawaban Lengkap tidak dibuat — Ringkasan sudah memuat semua jawaban; tambah saat butuh agregat per pertanyaan.
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
}
