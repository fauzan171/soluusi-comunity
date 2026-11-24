import { useEffect, useState } from "react";
import Logo from "./Logo";
import { CONSULTANTS } from "./data/consultants";

type Promo = { code: string; discountLabel: string; remaining: number; soldOut: boolean } | null;
type Voucher = { code: string; consultantSlug: string; name?: string; promo?: Promo };

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

      {/* Tiket promo — desain bertakik dengan sobekan */}
      <div className="relative mt-6">
        {/* glow */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-soluusi-green via-emerald-400 to-soluusi-orange opacity-20 blur-lg" aria-hidden />

        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          {/* Header tiket */}
          <div className="relative overflow-hidden bg-gradient-to-br from-soluusi-green-dark via-soluusi-green to-emerald-600 px-5 py-5 text-white">
            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" aria-hidden />
            <div className="absolute -bottom-14 right-12 h-28 w-28 rounded-full bg-white/5" aria-hidden />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Tiket promo</p>
                <p className="mt-1 font-serif text-2xl font-bold leading-tight">
                  {voucher?.promo?.discountLabel ?? "Rp 50.000"}
                  <span className="ml-1.5 text-sm font-medium text-white/80">diskon</span>
                </p>
                <p className="mt-1 text-xs text-white/70">Konsultasi Mental Health · Soluusi × Gerakan Binar</p>
              </div>
              <img src="/brand/gerakan-binar.png" alt="" className="h-11 w-11 shrink-0 object-contain drop-shadow" />
            </div>
          </div>

          {/* Sobekan: garis perforasi + takik kiri/kanan */}
          <div className="relative h-0">
            <div className="absolute left-4 right-4 top-0 border-t-2 border-dashed border-soluusi-line" />
            <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-soluusi-surface ring-1 ring-black/5" />
            <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-soluusi-surface ring-1 ring-black/5" />
          </div>

          {/* Body tiket */}
          <div className="px-5 pb-5 pt-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-soluusi-muted">Atas nama</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-soluusi-ink">{name || "Peserta"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-soluusi-muted">Konsultan</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-soluusi-ink">{consultant.name}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-soluusi-muted">Kode voucher</p>

              {loading && (
                <div className="mt-1.5 h-12 w-48 animate-pulse rounded-lg bg-soluusi-surface" />
              )}
              {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}

              {voucher && !loading && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <code className="rounded-xl border-2 border-dashed border-soluusi-green bg-soluusi-green-light px-4 py-2.5 font-mono text-lg font-bold tracking-[0.15em] text-soluusi-green-dark">
                    {voucher.code}
                  </code>
                  <button type="button"
                    onClick={() => navigator.clipboard?.writeText(voucher.code)}
                    className="rounded-xl border border-soluusi-line bg-white px-3.5 py-2.5 text-xs font-semibold text-soluusi-ink transition hover:border-soluusi-green hover:bg-soluusi-green-light active:scale-95">
                    Salin
                  </button>
                </div>
              )}
            </div>

            {/* Sisa kuota */}
            {voucher?.promo && !voucher.promo.soldOut && (
              <div className="mt-4 rounded-xl bg-soluusi-orange/10 px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-soluusi-ink">
                    Kode <span className="font-mono text-soluusi-orange">{voucher.promo.code}</span>
                  </span>
                  <span className="font-semibold text-soluusi-orange">
                    Sisa {voucher.promo.remaining} klaim
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-soluusi-orange transition-all"
                    style={{ width: `${Math.min(100, (voucher.promo.remaining / 200) * 100)}%` }} />
                </div>
              </div>
            )}

            <p className="mt-4 text-xs leading-relaxed text-soluusi-muted">
              Tukarkan kode ini saat checkout di Soluusi. Berlaku 30 hari sejak diterbitkan.
            </p>
          </div>
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
