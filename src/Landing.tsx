import Logo from "./Logo";

export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-md text-center">
      <div className="flex items-center justify-center gap-3">
        <Logo className="h-8 w-auto" />
        <span className="text-xs font-medium text-soluusi-muted">×</span>
        <img src="/brand/gerakan-binar.png" alt="Gerakan Binar" className="h-10 w-10 object-contain" />
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-soluusi-green">Community Wellbeing</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-soluusi-ink">Cek Kesejahteraanmu</h1>
      <p className="mt-3 text-soluusi-muted">
        Isi data diri dan 10 pertanyaan singkat tentang bagaimana perasaanmu
        selama sebulan terakhir. Lengkapi asesmennya dan dapatkan diskon
        konsultasi untuk dibahas bersama konsultan.
      </p>
      <ul className="mt-4 space-y-1 text-sm text-soluusi-muted">
        <li>⏱️ Kurang dari 3 menit</li>
        <li>🎁 Diskon konsultasi Rp 20.000 setelah selesai</li>
        <li>🔒 Jawabanmu hanya dibaca oleh konsultan dan tim layanan</li>
      </ul>
      <button
        onClick={onStart}
        className="mt-8 w-full rounded-xl bg-soluusi-green py-4 text-lg font-semibold text-white shadow-md hover:bg-soluusi-green-dark focus:outline-none focus:ring-4 focus:ring-soluusi-green/30"
      >
        Mulai
      </button>
      <p className="mt-4 text-xs text-soluusi-muted/70">
        Soluusi × Gerakan Binar — <a href="https://soluusi.com" target="_blank" rel="noopener noreferrer" className="font-medium text-soluusi-green hover:underline">soluusi.com</a>
      </p>
    </div>
  );
}