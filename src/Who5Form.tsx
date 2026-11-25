import { useEffect, useState } from "react";

const QUESTIONS = [
  "Merasa kesal karena sesuatu terjadi secara tak terduga",
  "Merasa tidak mampu mengendalikan hal-hal penting dalam hidup Anda",
  "Merasa gugup dan stres",
  "Merasa percaya diri terhadap kemampuan Anda dalam menangani masalah pribadi",
  "Merasa bahwa segala sesuatunya berjalan sesuai dengan keinginan Anda",
  "Merasa tidak mampu mengatasi semua hal yang harus Anda lakukan",
  "Mampu mengendalikan hal-hal yang membuat Anda jengkel dalam hidup",
  "Merasa mampu mengendalikan keadaan",
  "Merasa marah karena hal-hal yang terjadi di luar kendali Anda",
  "Merasa kesulitan menumpuk begitu tinggi hingga Anda tidak dapat mengatasinya",
];
const SCALE = ["Tidak pernah", "Hampir tidak pernah", "Kadang-kadang", "Cukup sering", "Sangat sering"];
const STORE_KEY = "cw_pss10_answers";

export type PssResult = { score: number; maxScore: number; label: string; color: "low" | "medium" | "high" };

// Write-as-you-go: jawaban bertahan di localStorage (PRD P0-4)
export default function Who5Form({ respondentId, onDone }: { respondentId: number; onDone: (r: PssResult) => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
      return Array.isArray(saved) && saved.length === 10 && saved.every(n => typeof n === "number")
        ? saved : Array(10).fill(null);
    } catch { return Array(10).fill(null); }
  });
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(answers)); } catch {}
  }, [answers]);

  function answer(value: number) {
    const next = [...answers];
    next[idx] = value;
    setAnswers(next);
    if (idx < 9) setIdx(idx + 1);
  }

  async function submit() {
    if (answers.some(a => a == null)) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respondentId, answers: answers as number[] }),
      });
      const body: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Gagal mengirim");
        return;
      }
      localStorage.removeItem(STORE_KEY);
      onDone(body as PssResult);
    } finally {
      setSubmitting(false);
    }
  }

  const answered = answers.filter(a => a != null).length;
  const isLast = idx === 9;

  return (
    <div className="w-full max-w-lg">
      <div className="mb-7">
        <div className="flex items-center justify-between text-[13px] font-medium">
          <span className="text-soluusi-muted">Pertanyaan {idx + 1} dari 10</span>
          <span className="text-soluusi-green">{answered}/10 terjawab</span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-soluusi-line">
          <div className="h-full rounded-full bg-soluusi-green transition-all duration-300" style={{ width: `${(answered / 10) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border border-soluusi-line bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,.06)] sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-soluusi-orange">Dalam satu bulan terakhir…</p>
        <h1 className="mt-2 font-serif text-xl font-semibold leading-snug text-soluusi-ink">
          Seberapa sering Anda {QUESTIONS[idx].charAt(0).toLowerCase() + QUESTIONS[idx].slice(1)}?
        </h1>

        <div className="mt-6 space-y-2.5">
          {SCALE.map((label, value) => (
            <button key={value} onClick={() => answer(value)} type="button"
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                answers[idx] === value
                  ? "border-soluusi-green bg-soluusi-green-light text-soluusi-green-dark ring-1 ring-soluusi-green"
                  : "border-soluusi-line bg-white text-soluusi-ink hover:border-soluusi-green/50 hover:bg-soluusi-surface"
              }`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                answers[idx] === value ? "border-soluusi-green bg-soluusi-green" : "border-soluusi-line"
              }`}>
                {answers[idx] === value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex gap-3">
        {idx > 0 && (
          <button onClick={() => setIdx(idx - 1)} disabled={submitting} type="button"
            className="flex-1 rounded-xl border border-soluusi-line bg-white py-3 text-sm font-semibold text-soluusi-ink transition hover:bg-soluusi-surface disabled:opacity-50">
            Sebelumnya
          </button>
        )}
        {isLast && answered === 10 && (
          <button onClick={submit} disabled={submitting} type="button"
            className="flex-1 rounded-xl bg-soluusi-green py-3 text-sm font-semibold text-white shadow-md transition hover:bg-soluusi-green-dark disabled:opacity-50">
            {submitting ? "Mengirim…" : "Kirim Jawaban"}
          </button>
        )}
      </div>
    </div>
  );
}
