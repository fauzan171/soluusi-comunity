import { useState } from "react";

const DOMICILES = [
  "KOTA JAKARTA SELATAN", "KOTA JAKARTA TIMUR", "KOTA JAKARTA BARAT",
  "KOTA JAKARTA PUSAT", "KOTA JAKARTA UTARA", "KAB. ADM. KEP. SERIBU", "LUAR DKI",
];

function calcAge(birth: string): number | null {
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function BiodataForm({ onDone }: { onDone: (id: number) => void }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", domicile: "", birth_date: "", gender: "", complaint: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const age = form.birth_date ? calcAge(form.birth_date) : null;

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

  const err = (k: string) => errors[k] && <p className="mt-1 text-sm text-red-600">{errors[k]}</p>;

  return (
    <form onSubmit={submit} className="w-full max-w-md space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Data Diri</h1>
      {errors._ && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{errors._}</p>}

      <div>
        <label className="block text-sm font-medium text-slate-700">Nama Lengkap *</label>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none" />
        {err("name")}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Email *</label>
        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none" />
        {err("email")}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Nomor Telepon *</label>
        <div className="mt-1 flex">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-3 text-slate-600">+62</span>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="8123456789" inputMode="tel"
            className="w-full rounded-r-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none" />
        </div>
        {err("phone")}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Domisili *</label>
        <select value={form.domicile} onChange={e => setForm({ ...form, domicile: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 focus:border-indigo-500 focus:outline-none">
          <option value="">Pilih domisili</option>
          {DOMICILES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {err("domicile")}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Tanggal Lahir *</label>
        <input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none" />
        {age != null && age >= 0 && <p className="mt-1 text-sm text-slate-500">Usia: {age} tahun</p>}
        {err("birth_date")}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Jenis Kelamin *</label>
        <div className="mt-2 flex gap-4">
          {[["L", "Laki-laki"], ["P", "Perempuan"]].map(([v, label]) => (
            <label key={v} className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 p-3 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
              <input type="radio" name="gender" value={v} checked={form.gender === v}
                onChange={() => setForm({ ...form, gender: v })} className="accent-indigo-600" />
              {label}
            </label>
          ))}
        </div>
        {err("gender")}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Mohon jelaskan kondisi, kebutuhan utama, serta tujuan yang ingin kamu capai
          melalui layanan ini, termasuk konteks aktivitas harian atau situasi yang relevan *
        </label>
        <textarea value={form.complaint} onChange={e => setForm({ ...form, complaint: e.target.value })}
          rows={4} className="mt-1 w-full rounded-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none" />
        <p className="mt-1 text-sm text-slate-500">{form.complaint.trim().length}/20 karakter minimum</p>
        {err("complaint")}
      </div>

      <button type="submit" disabled={submitting}
        className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50">
        {submitting ? "Menyimpan…" : "Lanjut ke Asesmen"}
      </button>
    </form>
  );
}
