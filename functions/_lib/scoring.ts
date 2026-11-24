// WHO-5 Well-Being Index — scoring & interpretation
// Skor = (Σ5 item) × 4 → 0–100. Interpretasi standar literatur.

export const WHO5_QUESTIONS = [
  'Saya merasa ceria dan bersemangat',
  'Saya merasa tenang dan santai',
  'Saya merasa aktif dan penuh energi',
  'Saya bangun tidur dengan perasaan segar dan cukup beristirahat',
  'Hidup saya penuh hal-hal yang menarik',
] as const;

export const SCALE_LABELS = [
  'Tidak pernah', 'Sangat jarang', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu',
] as const;

export function scoreWHO5(answers: number[]): number {
  return answers.reduce((a, b) => a + b, 0) * 4;
}

export type Category = 'good' | 'fair' | 'poor' | 'depression';

export function categoryFor(score: number): Category {
  if (score >= 68) return 'good';
  if (score >= 51) return 'fair';
  if (score >= 29) return 'poor';
  return 'depression';
}

export const CATEGORY_LABEL: Record<Category, string> = {
  good: 'Baik',
  fair: 'Sedang',
  poor: 'Buruk',
  depression: 'Indikasi depresi',
};

export const CATEGORY_COLOR: Record<Category, string> = {
  good: 'green',
  fair: 'yellow',
  poor: 'orange',
  depression: 'red',
};

export function who5Summary(answers: { q1: number; q2: number; q3: number; q4: number; q5: number }) {
  const list = [answers.q1, answers.q2, answers.q3, answers.q4, answers.q5];
  const score = scoreWHO5(list);
  return { score, category: categoryFor(score), label: CATEGORY_LABEL[categoryFor(score)], color: CATEGORY_COLOR[categoryFor(score)] };
}

// Self-check: reference values from WHO-5 literature
console.assert(who5Summary({ q1: 5, q2: 5, q3: 5, q4: 5, q5: 5 }).score === 100);
console.assert(who5Summary({ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 }).score === 0);
console.assert(who5Summary({ q1: 3, q2: 3, q3: 3, q4: 3, q5: 3 }).score === 60);
console.assert(who5Summary({ q1: 4, q2: 4, q3: 4, q4: 4, q5: 4 }).category === 'good'); // 80
console.assert(who5Summary({ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 }).category === 'depression'); // 0
