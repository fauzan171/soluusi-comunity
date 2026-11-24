import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

// PDF laporan wellbeing — pattern pdf-report TVS, disederhanakan untuk 1 instrumen WHO-5.
export type ReportRespondent = {
  id: number; name: string; email: string; phone: string; domicile: string; birth_date: string;
  age: number; gender: string; complaint: string; status: string; created_at: string;
  q1: number | null; q2: number | null; q3: number | null; q4: number | null; q5: number | null;
  score: number | null; label: string | null;
};

const QUESTIONS = [
  'Saya merasa ceria dan bersemangat',
  'Saya merasa tenang dan santai',
  'Saya merasa aktif dan penuh energi',
  'Saya bangun tidur dengan perasaan segar dan cukup beristirahat',
  'Hidup saya penuh hal-hal yang menarik',
];
const SCALE = ['Tidak pernah', 'Sangat jarang', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu'];

const PAGE = { width: 595.28, height: 841.89, margin: 44 };
const COLORS = {
  ink: rgb(0.07, 0.16, 0.15), muted: rgb(0.38, 0.46, 0.44), teal: rgb(0.03, 0.49, 0.45),
  line: rgb(0.86, 0.9, 0.89), paper: rgb(0.97, 0.98, 0.97), white: rgb(1, 1, 1),
  green: rgb(0.13, 0.55, 0.32), yellow: rgb(0.78, 0.53, 0.06), orange: rgb(0.9, 0.45, 0.05), red: rgb(0.78, 0.2, 0.18),
};
const LABEL_COLOR: Record<string, 'green' | 'yellow' | 'orange' | 'red'> = {
  'Baik': 'green', 'Sedang': 'yellow', 'Buruk': 'orange', 'Indikasi depresi': 'red',
};

function safeText(value: unknown) {
  return String(value ?? '-').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E\n]/g, '?');
}
function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of safeText(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
      else { if (line) lines.push(line); line = word; }
    }
    lines.push(line || ' ');
  }
  return lines;
}

export async function buildWellbeingPdf(respondents: ReportRespondent[], scopeLabel: string) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page!: PDFPage;
  let y = 0;

  function addPage(title?: string) {
    page = doc.addPage([PAGE.width, PAGE.height]);
    page.drawRectangle({ x: 0, y: PAGE.height - 92, width: PAGE.width, height: 92, color: rgb(0.04, 0.19, 0.17) });
    page.drawText('COMMUNITY WELLBEING', { x: PAGE.margin, y: PAGE.height - 42, font: bold, size: 10, color: COLORS.white });
    page.drawText(title ?? 'Laporan Wellbeing', { x: PAGE.margin, y: PAGE.height - 68, font: regular, size: 9, color: rgb(0.69, 0.82, 0.79) });
    y = PAGE.height - 120;
  }
  function ensureSpace(height: number, title?: string) { if (y - height < 64) addPage(title); }
  function text(value: unknown, x: number, size = 9, color = COLORS.ink, font = regular, maxWidth = PAGE.width - PAGE.margin * 2) {
    const lines = wrap(String(value), font, size, maxWidth);
    for (const line of lines) { page.drawText(line, { x, y, font, size, color }); y -= size * 1.42; }
  }
  function labelValue(label: string, value: unknown, x: number, width: number) {
    page.drawText(label.toUpperCase(), { x, y, font: bold, size: 6.7, color: COLORS.muted });
    const lines = wrap(safeText(value), regular, 8.5, width);
    let ly = y - 13;
    for (const line of lines.slice(0, 2)) { page.drawText(line, { x, y: ly, font: regular, size: 8.5, color: COLORS.ink }); ly -= 11; }
  }

  addPage('Laporan self-assessment WHO-5');
  y -= 28;
  text('LAPORAN SELF-ASSESSMENT', PAGE.margin, 10, COLORS.teal, bold);
  y -= 10;
  text('WHO-5 Well-Being Index', PAGE.margin, 28, COLORS.ink, bold);
  y -= 8;
  text(scopeLabel, PAGE.margin, 13, COLORS.muted, regular);
  y -= 26;
  page.drawRectangle({ x: PAGE.margin, y: y - 72, width: PAGE.width - PAGE.margin * 2, height: 72, color: COLORS.paper, borderColor: COLORS.line, borderWidth: 1 });
  const coverY = y - 22;
  page.drawText('JUMLAH RESPONDEN', { x: PAGE.margin + 18, y: coverY, font: bold, size: 7, color: COLORS.muted });
  page.drawText(String(respondents.length), { x: PAGE.margin + 18, y: coverY - 27, font: bold, size: 24, color: COLORS.teal });
  page.drawText('DIBUAT PADA', { x: PAGE.margin + 185, y: coverY, font: bold, size: 7, color: COLORS.muted });
  page.drawText(new Date().toLocaleString('id-ID'), { x: PAGE.margin + 185, y: coverY - 23, font: regular, size: 9, color: COLORS.ink });
  y -= 108;
  text('Dokumen ini memuat data diri, keluhan, dan jawaban WHO-5 responden. Kategori skor adalah kategori operasional untuk prioritas tindak lanjut, bukan diagnosis klinis.', PAGE.margin, 9, COLORS.muted, regular);

  for (let i = 0; i < respondents.length; i++) {
    const r = respondents[i];
    addPage(`Hasil individu ${i + 1} dari ${respondents.length}`);
    text(r.name, PAGE.margin, 22, COLORS.ink, bold);
    y -= 4;
    const col = (PAGE.width - PAGE.margin * 2) / 2;
    const infoY = y;
    labelValue('Email', r.email, PAGE.margin, col - 18);
    labelValue('Telepon', r.phone, PAGE.margin + col, col - 18);
    y = infoY - 42;
    labelValue('Domisili', r.domicile, PAGE.margin, col - 18);
    labelValue('Jenis kelamin', r.gender === 'L' ? 'Laki-laki' : 'Perempuan', PAGE.margin + col, col - 18);
    y -= 48;

    page.drawRectangle({ x: PAGE.margin, y: y - 50, width: PAGE.width - PAGE.margin * 2, height: 50, color: COLORS.paper, borderColor: COLORS.line, borderWidth: 1 });
    page.drawText('HASIL WHO-5', { x: PAGE.margin + 15, y: y - 17, font: bold, size: 7, color: COLORS.muted });
    const status = r.status === 'completed' && r.score != null ? `${r.score}/100` : 'BELUM SELESAI';
    const colorKey = r.label ? LABEL_COLOR[r.label] : undefined;
    page.drawText(status, { x: PAGE.margin + 15, y: y - 36, font: bold, size: 13, color: colorKey ? COLORS[colorKey] : COLORS.muted });
    if (r.label) page.drawText(r.label, { x: PAGE.margin + 290, y: y - 31, font: bold, size: 9, color: colorKey ? COLORS[colorKey] : COLORS.ink });
    y -= 76;

    ensureSpace(90);
    text('KELUHAN', PAGE.margin, 7, COLORS.teal, bold);
    text(r.complaint, PAGE.margin, 8.5, COLORS.ink, regular);
    y -= 12;

    text('JAWABAN WHO-5', PAGE.margin, 7, COLORS.teal, bold);
    y -= 4;
    for (let q = 0; q < 5; q++) {
      const value = (r as any)[`q${q + 1}`];
      const qLines = wrap(QUESTIONS[q], regular, 7.6, PAGE.width - PAGE.margin * 2 - 20);
      const aText = value == null ? '-' : `${value} - ${SCALE[value]}`;
      const aLines = wrap(aText, bold, 8.4, PAGE.width - PAGE.margin * 2 - 20);
      const height = qLines.length * 10 + aLines.length * 11 + 15;
      ensureSpace(height);
      for (const line of qLines) { page.drawText(line, { x: PAGE.margin + 9, y, font: regular, size: 7.6, color: COLORS.muted }); y -= 10; }
      for (const line of aLines) { page.drawText(line, { x: PAGE.margin + 9, y, font: bold, size: 8.4, color: COLORS.ink }); y -= 11; }
      page.drawLine({ start: { x: PAGE.margin, y: y - 2 }, end: { x: PAGE.width - PAGE.margin, y: y - 2 }, thickness: .5, color: COLORS.line });
      y -= 10;
    }
    y -= 4;
    text(`Submit: ${r.created_at}`, PAGE.margin, 7, COLORS.muted, regular);
    y -= 16;
  }

  const pages = doc.getPages();
  pages.forEach((item, index) => {
    item.drawLine({ start: { x: PAGE.margin, y: 34 }, end: { x: PAGE.width - PAGE.margin, y: 34 }, thickness: .5, color: COLORS.line });
    item.drawText(`Rahasia - Data kesejahteraan | Halaman ${index + 1} dari ${pages.length}`, { x: PAGE.margin, y: 20, font: regular, size: 6.8, color: COLORS.muted });
  });
  doc.setTitle('Laporan WHO-5 Community Wellbeing');
  doc.setCreationDate(new Date());
  return doc.save();
}

export function safeFilename(name: string): string {
  const slug = String(name).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'responden';
}
