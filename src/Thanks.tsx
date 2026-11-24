import { useEffect, useState } from "react";
import Logo from "./Logo";
import { CONSULTANTS } from "./data/consultants";

type Voucher = { code: string; consultantSlug: string; name?: string };

export default function Thanks({ respondentId, onReset }: { respondentId: number; onReset: () => void }) {
  const [selected, setSelected] = useState<string>(CONSULTANTS[0].slug);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState<string>("");


  const consultant = CONSULTANTS.find(c => c.slug === (voucher?.consultantSlug ?? selected))!;

  // Ambil/buat voucher saat pilihan berubah
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetch("/api/voucher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respondentId, consultantSlug: selected }),
    })
      .then(async r => {
        const body: any = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error ?? "Gagal membuat voucher");
        return body as Voucher;
      })
      .then(v => { if (alive) { setVoucher(v); if (v.name) setName(v.name); } })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [respondentId, selected]);

  return (
    <div className="w-full max-w-2xl">
      {/* Terima kasih */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-soluusi-green-light text-2xl">✓</div>
        <h1 className="mt-5 font-serif text-2xl font-bold text-soluusi-ink">Terima Kasih!</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-soluusi-muted">
          Jawabanmu sudah tersimpan. Pilih konsultan yang paling cocok, lalu tukarkan voucher
          konsultasimu di Soluusi.
        </p>
      </div>

      {/* Co-brand */}
      <div className="mt-7 flex items-center justify-center gap-3 rounded-2xl border border-soluusi-line bg-white px-4 py-3">
        <Logo className="h-6 w-auto" />
        <span className="text-xs font-medium text-soluusi-muted">×</span>
        <div className="flex items-center gap-2">
          <img src="/brand/gerakan-binar.png" alt="Gerakan Binar" className="h-8 w-8 object-contain" />
          <span className="text-xs font-bold tracking-wide text-soluusi-ink">GERAKAN BINAR</span>
        </div>
      </div>

      {/* Pilih konsultan */}
      <div className="mt-5">
        <h2 className="text-[13px] font-semibold text-soluusi-ink">Pilih konsultanmu</h2>
        <div className="mt-2.5 space-y-2.5">
          {CONSULTANTS.map(c => (
            <button key={c.slug} onClick={() => setSelected(c.slug)} type="button"
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                selected === c.slug
                  ? "border-soluusi-green bg-soluusi-green-light ring-1 ring-soluusi-green"
                  : "border-soluusi-line bg-white hover:border-soluusi-green/50"
              }`}>
              <img src={c.photo} alt={c.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-soluusi-ink">{c.name}</p>
                <p className="mt-0.5 text-xs text-soluusi-muted">{c.title} · {c.city}</p>
              </div>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selected === c.slug ? "border-soluusi-green bg-soluusi-green" : "border-soluusi-line"
              }`}>
                {selected === c.slug && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Voucher */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-soluusi-green/20 bg-white shadow-lg">
        <div className="flex items-center justify-between bg-soluusi-green px-5 py-3.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Voucher konsultasi</p>
            <p className="text-base font-bold text-white">Potongan Rp 50.000</p>
          </div>
          <img src="/brand/gerakan-binar.png" alt="" className="h-9 w-9 object-contain opacity-90" />
        </div>

        <div className="relative px-5 py-5">
          <div className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-soluusi-surface" />
          <div className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-soluusi-surface" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-soluusi-muted">Atas nama</p>
              <p className="text-sm font-semibold leading-snug text-soluusi-ink">{name || "Peserta"}</p>
            </div>
            <div>
              <p className="text-xs text-soluusi-muted">Konsultan</p>
              <p className="text-sm font-semibold leading-snug text-soluusi-ink">{consultant.name}</p>
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-soluusi-line" />

          <p className="text-xs text-soluusi-muted">Kode voucher</p>
          {loading && <p className="mt-1 text-sm text-soluusi-muted">Menyiapkan kode…</p>}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          {voucher && !loading && (
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <code className="rounded-lg border-2 border-dashed border-soluusi-green bg-soluusi-green-light px-4 py-2 font-mono text-lg font-bold tracking-wider text-soluusi-green-dark">
                {voucher.code}
              </code>
              <button type="button"
                onClick={() => navigator.clipboard?.writeText(voucher.code)}
                className="rounded-lg border border-soluusi-line px-3 py-2 text-xs font-semibold text-soluusi-ink hover:bg-soluusi-surface">
                Salin
              </button>
            </div>
          )}

          <p className="mt-4 text-xs leading-relaxed text-soluusi-muted">
            Tukarkan kode ini saat checkout di Soluusi. Berlaku 30 hari sejak diterbitkan.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <a href={`https://soluusi.com/mentalhealth/${consultant.slug}`}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 rounded-xl bg-soluusi-orange py-3 text-center text-sm font-semibold text-white shadow-md hover:bg-[#e65c00]">
          Kunjungi Profil Konsultan →
        </a>
        {voucher && (
          <a href={`/api/voucher/pdf?id=${respondentId}`}
            className="flex-1 rounded-xl border border-soluusi-green bg-white py-3 text-center text-sm font-semibold text-soluusi-green hover:bg-soluusi-green-light">
            Unduh Voucher (PDF)
          </a>
        )}
      </div>

      <button onClick={onReset}
        className="mt-3 w-full rounded-xl border border-soluusi-line bg-white py-3 text-sm font-semibold text-soluusi-ink hover:bg-soluusi-surface">
        Selesai
      </button>
    </div>
  );
}
