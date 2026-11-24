// PSS-10 (Perceived Stress Scale) — sama dengan instrumen "Mental Health"
// di repo mental-screening-kiosk-tvs (Q5–Q14, skala freq 0–4, skor native 0–40).
// 4 item reverse (Q8, Q9, Q11, Q12) — positif, skor dibalik (4 - v).

export const PSS10_QUESTIONS = [
  { code: 'Q5', text: 'Merasa kesal karena sesuatu terjadi secara tak terduga', reverse: false },
  { code: 'Q6', text: 'Merasa tidak mampu mengendalikan hal-hal penting dalam hidup Anda', reverse: false },
  { code: 'Q7', text: 'Merasa gugup dan stres', reverse: false },
  { code: 'Q8', text: 'Merasa percaya diri terhadap kemampuan Anda dalam menangani masalah pribadi', reverse: true },
  { code: 'Q9', text: 'Merasa bahwa segala sesuatunya berjalan sesuai dengan keinginan Anda', reverse: true },
  { code: 'Q10', text: 'Merasa tidak mampu mengatasi semua hal yang harus Anda lakukan', reverse: false },
  { code: 'Q11', text: 'Mampu mengendalikan hal-hal yang membuat Anda jengkel dalam hidup', reverse: true },
  { code: 'Q12', text: 'Merasa mampu mengendalikan keadaan', reverse: true },
  { code: 'Q13', text: 'Merasa marah karena hal-hal yang terjadi di luar kendali Anda', reverse: false },
  { code: 'Q14', text: 'Merasa kesulitan menumpuk begitu tinggi hingga Anda tidak dapat mengatasinya', reverse: false },
] as const;

export const PSS10_LEAD_IN = 'Dalam satu bulan terakhir, seberapa sering Anda…';

export const FREQ_LABELS = ['Tidak pernah', 'Hampir tidak pernah', 'Kadang-kadang', 'Cukup sering', 'Sangat sering'] as const;

export type Band = { color: 'low' | 'medium' | 'high'; label: string };

// Band PSS-10 native 0–40 (sama dengan TVS 0005_pss10_scoring.sql).
// Deskriptif untuk pelaporan, bukan cut-off diagnostik.
const BANDS: { max: number; band: Band }[] = [
  { max: 13, band: { color: 'low', label: 'Stres rendah' } },
  { max: 26, band: { color: 'medium', label: 'Stres sedang' } },
  { max: 40, band: { color: 'high', label: 'Stres tinggi' } },
];

export function scorePSS10(answers: (number | null)[]): number {
  return PSS10_QUESTIONS.reduce((sum, q, i) => {
    const raw = answers[i] ?? 0;
    return sum + (q.reverse ? 4 - raw : raw);
  }, 0);
}

export function bandFor(score: number): Band {
  return (BANDS.find(b => score <= b.max) ?? BANDS[BANDS.length - 1]).band;
}

export function pss10Summary(q: (number | null)[]) {
  const score = scorePSS10(q);
  const band = bandFor(score);
  return { score, maxScore: 40, color: band.color, label: band.label };
}

// Self-check (PSS-10 native scale 0-40, 4 reverse items)
console.assert(scorePSS10([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) === 16, 'all 0 -> reverse items give 4 each = 16');
console.assert(scorePSS10([4, 4, 4, 4, 4, 4, 4, 4, 4, 4]) === 24, 'all 4 -> positives 0 each, negatives 4 each = 24');
console.assert(scorePSS10([4, 4, 4, 0, 0, 4, 0, 0, 4, 4]) === 40, 'max stress');
console.assert(scorePSS10([0, 0, 0, 4, 4, 0, 4, 4, 0, 0]) === 0, 'min stress');
console.assert(bandFor(0).color === 'low' && bandFor(13).color === 'low');
console.assert(bandFor(14).color === 'medium' && bandFor(26).color === 'medium');
console.assert(bandFor(27).color === 'high' && bandFor(40).color === 'high');
