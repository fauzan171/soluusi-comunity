import Logo from "./Logo";

export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-md text-center">
      <div className="flex justify-center">
        <Logo className="h-9 w-auto" />
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-soluusi-green">Community Wellbeing</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-soluusi-ink">Cek Kesejahteraanmu</h1>
      <p className="mt-3 text-soluusi-muted">
        Isi data diri dan 5 pertanyaan singkat tentang perasaanmu selama
        2 minggu terakhir. Hasilnya akan dibahas bersama konsultan di
        sesi konsultasimu.
      </p>
      <ul className="mt-4 space-y-1 text-sm text-soluusi-muted">
        <li>⏱️ Kurang dari 3 menit</li>
        <li>🔒 Jawabanmu hanya dibaca oleh konsultan dan tim layanan</li>
      </ul>
      <button
        onClick={onStart}
        className="mt-8 w-full rounded-xl bg-soluusi-green py-4 text-lg font-semibold text-white shadow-md hover:bg-soluusi-green-dark focus:outline-none focus:ring-4 focus:ring-soluusi-green/30"
      >
        Mulai
      </button>
      <p className="mt-4 text-xs text-soluusi-muted/70">
        Temukan solusimu bersama para ahli — <a href="https://soluusi.com" target="_blank" rel="noopener noreferrer" className="font-medium text-soluusi-green hover:underline">soluusi.com</a>
      </p>
    </div>
  );
}