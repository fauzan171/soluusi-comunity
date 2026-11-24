import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import { safeFilename } from './report';

// Voucher konsultasi — PDF landscape, co-brand Soluusi x Gerakan Binar.
export type VoucherInput = {
  name: string;
  code: string;
  consultantName: string;
  consultantTitle: string;
  consultantCity: string;
  consultantUrl: string;
  issuedAt: string;
};

const W = 720, H = 420, M = 40;
const BRAND = rgb(0x00 / 255, 0x76 / 255, 0x48 / 255);
const BRAND_DARK = rgb(0x00 / 255, 0x57 / 255, 0x3a / 255);
const ORANGE = rgb(0xf1 / 255, 0x5a / 255, 0x23 / 255);
const BINAR = rgb(0xf7 / 255, 0xb5 / 255, 0x00 / 255);
const INK = rgb(0x3f / 255, 0x42 / 255, 0x54 / 255);
const MUTED = rgb(0x5e / 255, 0x62 / 255, 0x78 / 255);
const PAPER = rgb(0xf5 / 255, 0xf8 / 255, 0xfa / 255);
const WHITE = rgb(1, 1, 1);

function ascii(s: string) {
  return String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '');
}
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of ascii(text).split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
    else { if (line) out.push(line); line = word; }
  }
  if (line) out.push(line);
  return out;
}

export async function buildVoucherPdf(v: VoucherInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const mono = await doc.embedFont(StandardFonts.CourierBold);

  // Background
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });

  // Header band (Soluusi green) + Gerakan Binar accent stripe
  page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: BRAND });
  page.drawRectangle({ x: 0, y: H - 104, width: W, height: 8, color: BINAR });

  // Co-brand lockup (text-based, font-safe)
  page.drawText('SOLUUSI.', { x: M, y: H - 48, font: bold, size: 22, color: WHITE });
  page.drawText('x', { x: M + 122, y: H - 46, font: italic, size: 15, color: rgb(0.75, 0.87, 0.82) });
  page.drawText('GERAKAN BINAR', { x: M + 142, y: H - 46, font: bold, size: 16, color: BINAR });
  page.drawText('VOUCHER KONSULTASI MENTAL HEALTH', { x: M, y: H - 72, font: regular, size: 9, color: rgb(0.78, 0.88, 0.84) });

  // Nominal badge
  const badgeX = W - M - 118;
  page.drawRectangle({ x: badgeX, y: H - 76, width: 118, height: 52, color: WHITE });
  page.drawText('POTONGAN', { x: badgeX + 30, y: H - 40, font: bold, size: 7, color: MUTED });
  page.drawText('Rp 50.000', { x: badgeX + 18, y: H - 64, font: bold, size: 17, color: ORANGE });

  let y = H - 128;

  // Greeting + name
  page.drawText('Diberikan kepada', { x: M, y, font: regular, size: 9, color: MUTED });
  y -= 24;
  page.drawText(ascii(v.name), { x: M, y, font: bold, size: 22, color: INK });
  y -= 18;
  const desc = 'Sebagai bentuk apresiasi telah menyelesaikan asesmen kesejahteraan mental.';
  for (const line of wrap(desc, regular, 9, W - M * 2)) {
    page.drawText(line, { x: M, y, font: regular, size: 9, color: MUTED });
    y -= 13;
  }

  // Consultant box
  y -= 10;
  const boxH = 82;
  page.drawRectangle({ x: M, y: y - boxH, width: W - M * 2, height: boxH, color: WHITE, borderColor: rgb(0.91, 0.93, 0.94), borderWidth: 1 });
  const bx = M + 16;
  let by = y - 22;
  page.drawText('KONSULTAN PILIHAN ANDA', { x: bx, y: by, font: bold, size: 7, color: BRAND });
  by -= 18;
  page.drawText(ascii(v.consultantName), { x: bx, y: by, font: bold, size: 12, color: INK });
  by -= 14;
  page.drawText(ascii(`${v.consultantTitle} - ${v.consultantCity}`), { x: bx, y: by, font: regular, size: 9, color: MUTED });
  by -= 13;
  page.drawText(ascii(v.consultantUrl), { x: bx, y: by, font: regular, size: 7.5, color: BRAND });

  // Voucher code (dashed ticket)
  y -= boxH + 18;
  page.drawText('KODE VOUCHER', { x: M, y, font: bold, size: 7, color: MUTED });
  y -= 6;
  const codeY = y - 30;
  page.drawRectangle({ x: M, y: codeY, width: 232, height: 34, color: rgb(0.90, 0.95, 0.93), borderColor: BRAND, borderWidth: 1.5, borderDashArray: [5, 3] });
  const codeWidth = mono.widthOfTextAtSize(v.code, 17);
  page.drawText(v.code, { x: M + (232 - codeWidth) / 2, y: codeY + 10, font: mono, size: 17, color: BRAND_DARK });

  // How to redeem
  const rx = M + 262;
  let ry = y - 6;
  page.drawText('CARA MENUKARKAN', { x: rx, y: ry, font: bold, size: 7, color: MUTED });
  const steps = [
    '1. Buka soluusi.com dan pilih konsultan di atas.',
    '2. Jadwalkan sesi, lalu masukkan kode voucher saat checkout.',
    '3. Potongan Rp 50.000 otomatis diterapkan.',
  ];
  for (const step of steps) {
    ry -= 13;
    page.drawText(ascii(step), { x: rx, y: ry, font: regular, size: 8, color: INK });
  }

  // Footer
  const fy = 34;
  page.drawLine({ start: { x: M, y: fy + 16 }, end: { x: W - M, y: fy + 16 }, thickness: 0.7, color: rgb(0.86, 0.89, 0.90) });
  page.drawText(ascii(`Diterbitkan ${v.issuedAt} - Berlaku 90 hari`), { x: M, y: fy, font: regular, size: 7.5, color: MUTED });
  page.drawText('Soluusi.com  |  Gerakan Binar', { x: W - M - 150, y: fy, font: regular, size: 7.5, color: MUTED });

  doc.setTitle(`Voucher Konsultasi - ${v.name}`);
  doc.setAuthor('Soluusi x Gerakan Binar');
  doc.setCreationDate(new Date());
  return doc.save();
}

export function voucherFilename(name: string, code: string): string {
  return `voucher-${safeFilename(name)}-${code}.pdf`;
}
