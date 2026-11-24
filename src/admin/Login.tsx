import { useState } from "react";
import Logo from "../Logo";

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
      <div className="flex justify-center"><Logo className="h-10 w-auto" /></div>
      <h1 className="text-center font-serif text-xl font-bold text-soluusi-ink">Admin Wellbeing</h1>
      <input type="password" value={pin} onChange={e => setPin(e.target.value)}
        placeholder="PIN" inputMode="numeric" autoFocus
        className="w-full rounded-lg border border-soluusi-line p-3 text-center text-lg tracking-widest focus:border-soluusi-green focus:outline-none" />
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting || !pin}
        className="w-full rounded-xl bg-soluusi-green py-3 font-semibold text-white shadow hover:bg-soluusi-green-dark disabled:opacity-50">
        {submitting ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
