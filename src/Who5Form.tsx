import { useEffect, useState } from "react";

const QUESTIONS = [
  "Saya merasa ceria dan bersemangat",
  "Saya merasa tenang dan santai",
  "Saya merasa aktif dan penuh energi",
  "Saya bangun tidur dengan perasaan segar dan cukup beristirahat",
  "Hidup saya penuh hal-hal yang menarik",
];
const SCALE = ["Tidak pernah", "Sangat jarang", "Jarang", "Kadang-kadang", "Sering", "Selalu"];
const STORE_KEY = "who5_answers";

// Write-as-you-go: jawaban bertahan di localStorage (PRD P0-4)
export default function Who5Form({ respondentId, onDone }: { respondentId: number; onDone: () => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
      return Array.isArray(saved) && saved.length === 5 && saved.every(n => typeof n === "number") ? saved : [null, null, null, null, null];
    } catch { return [null, null, null, null, null]; }
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
    if (idx < 4) setIdx(idx + 1);
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
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  const answered = answers.filter(a => a != null).length;
  const isLast = idx === 4;

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Pertanyaan {idx + 1} dari 5</span>
          <span>{answered}/5 terjawab</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${(answered / 5) * 100}%` }} />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-slate-500">Selama 2 minggu terakhir…</p>
        <h1 className="mt-2 text-xl font-semibold leading-relaxed text-slate-900">{QUESTIONS[idx]}</h1>
      </div>

      <div className="space-y-2">
        {SCALE.map((label, value) => (
          <button key={value} onClick={() => answer(value)}
            className={`w-full rounded-xl border p-4 text-left font-medium transition
              ${answers[idx] === value ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400"}`}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex gap-3">
        {idx > 0 && (
          <button onClick={() => setIdx(idx - 1)} disabled={submitting}
            className="flex-1 rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Kembali
          </button>
        )}
        {isLast && answered === 5 && (
          <button onClick={submit} disabled={submitting}
            className="flex-1 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50">
            {submitting ? "Mengirim…" : "Kirim Jawaban"}
          </button>
        )}
      </div>
    </div>
  );
}
