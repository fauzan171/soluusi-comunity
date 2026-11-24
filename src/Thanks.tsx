import Logo from "./Logo";

export default function Thanks({ onReset }: { onReset: () => void }) {
  return (
    <div className="w-full max-w-md">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-soluusi-green-light text-3xl">✓</div>
        <h1 className="mt-6 font-serif text-2xl font-bold text-soluusi-ink">Terima Kasih!</h1>
        <p className="mt-3 text-soluusi-muted">
          Jawabanmu sudah tersimpan dan akan dibahas di sesi konsultasimu
          bersama konsultan.
        </p>
      </div>

      {/* Promo voucher soluusi.com */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-soluusi-green/20 bg-white shadow-lg">
        <div className="bg-soluusi-green px-6 py-5 text-center">
          <div className="flex justify-center">
            <Logo variant="white" className="h-7 w-auto" />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/80">Langkah selanjutnya</p>
          <p className="mt-1 text-lg font-bold text-white">Konsultasi lanjutan dengan ahli</p>
        </div>
        <div className="relative px-6 py-5">
          {/* notch kiri-kanan ala voucher */}
          <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-soluusi-surface" />
          <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-soluusi-surface" />
          <p className="text-sm leading-relaxed text-soluusi-ink">
            Keluhannya sudah kamu sampaikan — sekarang saatnya <strong>dibahas bersama ahlinya</strong>.
            Konsultasi online 100% privat, hanya kamu dan konsultan.
          </p>
          <p className="mt-3 text-sm text-soluusi-muted">
            Tukarkan hasil asesmenmu jadi <strong className="text-soluusi-orange">voucher konsultasi</strong> di
            Soluusi — pilih konsultan psikologi yang paling cocok untukmu.
          </p>
          <a
            href="https://soluusi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block rounded-xl bg-soluusi-orange py-3.5 text-center font-semibold text-white shadow-md hover:bg-[#e65c00]"
          >
            Ambil Vouchermu di Soluusi.com →
          </a>
          <p className="mt-3 text-center text-xs text-soluusi-muted/70">
            300+ konsultan profesional · Sesi rahasia · 100% online
          </p>
        </div>
      </div>

      <button onClick={onReset}
        className="mt-6 w-full rounded-xl border border-soluusi-line bg-white py-3 font-semibold text-soluusi-ink hover:bg-soluusi-surface">
        Selesai
      </button>
    </div>
  );
}