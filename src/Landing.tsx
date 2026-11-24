export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-md text-center">
      <h1 className="text-3xl font-bold text-slate-900">Cek Kesejahteraanmu</h1>
      <p className="mt-3 text-slate-600">
        Isi data diri dan 5 pertanyaan singkat tentang perasaanmu selama
        2 minggu terakhir. Hasilnya akan dibahas bersama konsultan di
        sesi konsultasimu.
      </p>
      <ul className="mt-4 space-y-1 text-sm text-slate-500">
        <li>⏱️ Kurang dari 3 menit</li>
        <li>🔒 Jawabanmu hanya dibaca oleh konsultan dan tim layanan</li>
      </ul>
      <button
        onClick={onStart}
        className="mt-8 w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        Mulai
      </button>
    </div>
  );
}
