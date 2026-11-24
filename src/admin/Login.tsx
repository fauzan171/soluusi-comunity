import { useState } from "react";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const body: any = await res.json().catch(() => ({}));
        setError(body.error ?? "PIN salah");
        return;
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xs space-y-4">
      <h1 className="text-center text-2xl font-bold text-slate-900">Admin</h1>
      <input type="password" value={pin} onChange={e => setPin(e.target.value)}
        placeholder="PIN" inputMode="numeric" autoFocus
        className="w-full rounded-lg border border-slate-300 p-3 text-center text-lg tracking-widest focus:border-indigo-500 focus:outline-none" />
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting || !pin}
        className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50">
        {submitting ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
