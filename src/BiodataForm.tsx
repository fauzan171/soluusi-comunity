import { useMemo, useState } from "react";
import Logo from "./Logo";
import { PROVINCES, citiesOf } from "./data/regions";

function calcAge(birth: string): number | null {
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

type FormState = {
  name: string; email: string; phone: string; province: string; domicile: string;
  birth_date: string; gender: string; complaint: string;
};

export default function BiodataForm({ onDone }: { onDone: (id: number) => void }) {
  const [form, setForm] = useState<FormState>({
    name: "", email: "", phone: "", province: "", domicile: "", birth_date: "", gender: "", complaint: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const age = form.birth_date ? calcAge(form.birth_date) : null;
  const cities = useMemo(() => (form.province ? citiesOf(form.province) : []), [form.province]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value, ...(key === "province" ? { domicile: "" } : {}) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        try { setErrors(JSON.parse(body.error)); } catch { setErrors({ _: body.error ?? "Gagal menyimpan" }); }
        return;
      }
      onDone(body.respondentId);
    } finally {
      setSubmitting(false);
    }
  }

  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>;
  const inputCls = "mt-1.5 w-full rounded-xl border border-soluusi-line bg-white px-4 py-3 text-[15px] text-soluusi-ink outline-none transition placeholder:text-soluusi-muted/50 focus:border-soluusi-green focus:ring-4 focus:ring-soluusi-green/10";
  const labelCls = "block text-[13px] font-semibold text-soluusi-ink";

  return (
    <form onSubmit={submit} className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <div className="flex justify-center"><Logo className="h-8 w-auto" /></div>
        <h1 className="mt-4 font-serif text-2xl font-bold text-soluusi-ink">Ceritakan Tentang Dirimu</h1>
        <p className="mt-1.5 text-sm text-soluusi-muted">Data ini membantu konsultan memahami kondisimu sebelum sesi dimulai.</p>
      </div>

      <div className="rounded-2xl border border-soluusi-line bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,.06)] sm:p-7">
        {errors._ && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors._}</p>}

        <div className="space-y-5">
          <div>
            <label className={labelCls}>Nama Lengkap <span className="text-soluusi-orange">*</span></label>
            <input value={form.name} onChange={set("name")} placeholder="Sesuai KTP" className={inputCls} />
            {err("name")}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Email <span className="text-soluusi-orange">*</span></label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="nama@email.com" className={inputCls} />
              {err("email")}
            </div>
            <div>
              <label className={labelCls}>Nomor Telepon <span className="text-soluusi-orange">*</span></label>
              <div className="mt-1.5 flex">
                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-soluusi-line bg-soluusi-surface px-3.5 text-sm font-medium text-soluusi-muted">+62</span>
                <input value={form.phone} onChange={set("phone")} placeholder="812 3456 7890" inputMode="tel"
                  className="w-full rounded-r-xl border border-soluusi-line bg-white px-4 py-3 text-[15px] text-soluusi-ink outline-none transition placeholder:text-soluusi-muted/50 focus:border-soluusi-green focus:ring-4 focus:ring-soluusi-green/10" />
              </div>
              {err("phone")}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Provinsi <span className="text-soluusi-orange">*</span></label>
              <select value={form.province} onChange={set("province")} className={inputCls}>
                <option value="">Pilih provinsi</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {err("province")}
            </div>
            <div>
              <label className={labelCls}>Kota / Kabupaten <span className="text-soluusi-orange">*</span></label>
              <select value={form.domicile} onChange={set("domicile")} disabled={!form.province}
                className={`${inputCls} disabled:cursor-not-allowed disabled:bg-soluusi-surface disabled:text-soluusi-muted/60`}>
                <option value="">{form.province ? "Pilih kota/kabupaten" : "Pilih provinsi dulu"}</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {err("domicile")}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Tanggal Lahir <span className="text-soluusi-orange">*</span></label>
              <input type="date" value={form.birth_date} onChange={set("birth_date")} className={inputCls} />
              {age != null && age >= 0 && age < 120 && <p className="mt-1 text-xs text-soluusi-muted">Usia: {age} tahun</p>}
              {err("birth_date")}
            </div>
            <div>
              <label className={labelCls}>Jenis Kelamin <span className="text-soluusi-orange">*</span></label>
              <div className="mt-1.5 flex gap-3">
                {[["L", "Laki-laki"], ["P", "Perempuan"]].map(([v, label]) => (
                  <label key={v} className={`flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium transition ${
                    form.gender === v
                      ? "border-soluusi-green bg-soluusi-green-light text-soluusi-green-dark"
                      : "border-soluusi-line bg-white text-soluusi-ink hover:border-soluusi-green/50"
                  }`}>
                    <input type="radio" name="gender" value={v} checked={form.gender === v}
                      onChange={() => setForm(f => ({ ...f, gender: v }))} className="accent-soluusi-green" />
                    {label}
                  </label>
                ))}
              </div>
              {err("gender")}
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Apa yang ingin kamu diskusikan dengan konsultan? <span className="text-soluusi-orange">*</span>
            </label>
            <p className="mt-0.5 text-xs text-soluusi-muted">
              Ceritakan kondisi atau keluhan yang kamu rasakan, apa yang ingin kamu capai, dan bagaimana
              aktivitas harianmu ikut memengaruhinya.
            </p>
            <textarea value={form.complaint} onChange={set("complaint")} rows={4}
              placeholder="Contoh: Belakangan saya sulit tidur dan cemas menjelang deadline. Saya ingin belajar mengelola stres supaya lebih tenang saat bekerja."
              className={`${inputCls} resize-none leading-relaxed`} />
            <p className="mt-1 text-xs text-soluusi-muted">{form.complaint.trim().length}/20 karakter minimum</p>
            {err("complaint")}
          </div>
        </div>
      </div>

      <button type="submit" disabled={submitting}
        className="mt-6 w-full rounded-xl bg-soluusi-green py-3.5 text-[15px] font-semibold text-white shadow-md transition hover:bg-soluusi-green-dark disabled:opacity-50">
        {submitting ? "Menyimpan…" : "Lanjutkan ke Asesmen"}
      </button>
      <p className="mt-3 text-center text-xs text-soluusi-muted">
        Datamu bersifat rahasia dan hanya dibaca konsultan serta tim layanan.
      </p>
    </form>
  );
}
