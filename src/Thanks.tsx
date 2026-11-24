export default function Thanks({ onReset }: { onReset: () => void }) {
  return (
    <div className="max-w-md text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Terima Kasih!</h1>
      <p className="mt-3 text-slate-600">
        Jawabanmu sudah tersimpan dan akan dibahas di sesi konsultasimu
        bersama konsultan.
      </p>
      <button onClick={onReset}
        className="mt-8 w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white shadow hover:bg-indigo-700">
        Selesai
      </button>
    </div>
  );
}
