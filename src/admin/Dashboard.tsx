import { useEffect, useState } from "react";
import Logo from "../Logo";

type Summary = {
  totalRespondents: number; completed: number; registeredOnly: number; dropOffRate: number;
  averageScore: number | null;
  categories: Record<string, number>;
  provinces: Record<string, number>;
  domiciles: Record<string, number>;
  genders: Record<string, number>;
  questionAverages: (number | null)[];
};
type Respondent = {
  id: number; createdAt: string; status: string; name: string; age: number;
  province: string | null; domicile: string; gender: string; complaintExcerpt: string;
  score: number | null; label: string | null; color: string | null; category: string | null;
};
type Detail = {
  respondent: any; summary: { score: number; label: string; color: string } | null;
};

const COLOR_CLASS: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
};
const PSS10_LABELS = [
  "Merasa kesal karena sesuatu terjadi secara tak terduga",
  "Merasa tidak mampu mengendalikan hal-hal penting dalam hidup Anda",
  "Merasa gugup dan stres",
  "Merasa percaya diri terhadap kemampuan Anda dalam menangani masalah pribadi",
  "Merasa bahwa segala sesuatunya berjalan sesuai dengan keinginan Anda",
  "Merasa tidak mampu mengatasi semua hal yang harus Anda lakukan",
  "Mampu mengendalikan hal-hal yang membuat Anda jengkel dalam hidup",
  "Merasa mampu mengendalikan keadaan",
  "Merasa marah karena hal-hal yang terjadi di luar kendali Anda",
  "Merasa kesulitan menumpuk begitu tinggi hingga Anda tidak dapat mengatasinya",
];
const SCALE = ["Tidak pernah", "Hampir tidak pernah", "Kadang-kadang", "Cukup sering", "Sangat sering"];
const CATEGORY_ORDER: [string, string][] = [
  ["low", "Stres rendah 🟢"], ["medium", "Stres sedang 🟡"], ["high", "Stres tinggi 🔴"],
];

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [respondents, setRespondents] = useState<Respondent[] | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDomicile, setFilterDomicile] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function load() {
    const [s, r] = await Promise.all([
      fetch("/api/admin/summary").then(r => r.json() as Promise<Summary>),
      fetch("/api/admin/respondents").then(r => r.json() as Promise<{ respondents: Respondent[] }>),
    ]);
    setSummary(s); setRespondents(r.respondents);
  }

  useEffect(() => { load(); }, []);

  async function openDetail(id: number) {
    const r = await fetch(`/api/admin/respondents?id=${id}`).then(r => r.json() as Promise<Detail>);
    setDetail(r);
  }

  async function removeRespondent(id: number, name: string) {
    if (!confirm(`Hapus data responden "${name}"? Tindakan ini permanen.`)) return;
    const res = await fetch(`/api/admin/respondents?id=${id}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal menghapus data"); return; }
    setDetail(null);
    load();
  }

  if (!summary || !respondents) return <p className="text-soluusi-muted">Memuat…</p>;

  const filtered = respondents.filter(r =>
    (!filterCategory || r.category === filterCategory) &&
    (!filterDomicile || r.domicile === filterDomicile) &&
    (!filterFrom || r.createdAt >= filterFrom) &&
    (!filterTo || r.createdAt <= `${filterTo} 23:59:59`)
  );
  const exportQuery = () => {
    const q = new URLSearchParams();
    if (filterCategory) q.set("category", filterCategory);
    if (filterDomicile) q.set("domicile", filterDomicile);
    if (filterFrom) q.set("from", filterFrom);
    if (filterTo) q.set("to", filterTo);
    return q.toString();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Logo className="h-9 w-auto" /><div><h1 className="font-serif text-xl font-bold text-soluusi-ink">Dashboard Wellbeing</h1><p className="text-xs text-soluusi-muted">Community Wellbeing</p></div></div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/export?${exportQuery()}`}
            className="rounded-lg border border-soluusi-line bg-white px-4 py-2 text-sm font-medium text-soluusi-ink hover:bg-soluusi-surface">
            Export CSV
          </a>
          <a href={`/api/admin/export?format=xlsx&${exportQuery()}`}
            className="rounded-lg border border-soluusi-line bg-white px-4 py-2 text-sm font-medium text-soluusi-ink hover:bg-soluusi-surface">
            Export Excel
          </a>
          <a href={`/api/admin/export?format=pdf&${exportQuery()}`}
            className="rounded-lg border border-soluusi-line bg-white px-4 py-2 text-sm font-medium text-soluusi-ink hover:bg-soluusi-surface">
            Export PDF
          </a>
          <button onClick={onLogout}
            className="rounded-lg border border-soluusi-line bg-white px-4 py-2 text-sm font-medium text-soluusi-ink hover:bg-soluusi-surface">
            Keluar
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Total Responden" value={summary.totalRespondents} />
        <Stat label="Selesai Asesmen" value={summary.completed} />
        <Stat label="Form Saja" value={summary.registeredOnly} />
        <Stat label="Drop-off" value={`${summary.dropOffRate}%`} />
        <Stat label="Rata-rata Skor" value={summary.averageScore ?? "—"} />
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-soluusi-muted">Distribusi Kategori (responden selesai)</h2>
        <div className="mt-3 space-y-2">
          {CATEGORY_ORDER.map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-40 text-sm text-soluusi-ink">{label}</span>
              <div className="h-4 flex-1 rounded bg-soluusi-surface">
                <div className={`h-4 rounded ${key === "low" ? "bg-green-500" : key === "medium" ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${summary.completed ? (summary.categories[key] / summary.completed) * 100 : 0}%` }} />
              </div>
              <span className="w-8 text-right text-sm font-semibold text-soluusi-ink">{summary.categories[key]}</span>
            </div>
          ))}
        </div>
      </section>

      {summary.questionAverages.some(v => v != null) && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-soluusi-muted">Rata-rata Jawaban per Pertanyaan PSS-10 (responden selesai)</h2>
          <ol className="mt-3 space-y-2">
            {PSS10_LABELS.map((q, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-56 shrink-0 truncate text-sm text-soluusi-ink" title={q}>{q}</span>
                <div className="h-4 flex-1 rounded bg-soluusi-surface">
                  <div className="h-4 rounded bg-soluusi-green"
                    style={{ width: `${(summary.questionAverages[i] ?? 0) / 4 * 100}%` }} />
                </div>
                <span className="w-10 text-right text-sm font-semibold text-soluusi-ink">{summary.questionAverages[i] ?? "—"}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-soluusi-muted">Responden ({filtered.length})</h2>
          <div className="flex flex-wrap items-end gap-2">
            <Filter label="Kategori">
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="rounded-lg border border-soluusi-line bg-white p-2 text-sm">
                <option value="">Semua</option>
                {CATEGORY_ORDER.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Filter>
            <Filter label="Domisili">
              <select value={filterDomicile} onChange={e => setFilterDomicile(e.target.value)}
                className="rounded-lg border border-soluusi-line bg-white p-2 text-sm">
                <option value="">Semua</option>
                {Object.keys(summary.domiciles).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Filter>
            <Filter label="Dari">
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                className="rounded-lg border border-soluusi-line bg-white p-2 text-sm" />
            </Filter>
            <Filter label="Sampai">
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                className="rounded-lg border border-soluusi-line bg-white p-2 text-sm" />
            </Filter>
            {(filterCategory || filterDomicile || filterFrom || filterTo) && (
              <button onClick={() => { setFilterCategory(""); setFilterDomicile(""); setFilterFrom(""); setFilterTo(""); }}
                className="rounded-lg border border-soluusi-line bg-white p-2 text-sm text-soluusi-muted hover:bg-soluusi-surface">
                Reset
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-soluusi-line text-xs uppercase text-soluusi-muted">
              <tr>
                <th className="p-3">Waktu</th><th className="p-3">Nama</th><th className="p-3">Usia</th>
                <th className="p-3">Provinsi</th><th className="p-3">Skor</th><th className="p-3">Keluhan</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-soluusi-line/60 last:border-0 hover:bg-soluusi-surface">
                  <td className="p-3 whitespace-nowrap text-soluusi-muted">{r.createdAt}</td>
                  <td className="p-3 font-medium text-soluusi-ink">{r.name}</td>
                  <td className="p-3">{r.age}</td>
                  <td className="p-3 text-soluusi-muted">{r.province ?? '—'}</td>
                  <td className="p-3">
                    {r.score != null
                      ? <span className={`rounded-full px-2 py-1 text-xs font-semibold ${COLOR_CLASS[r.color!]}`}>{r.score} · {r.label}</span>
                      : <span className="text-xs text-soluusi-muted/70">belum selesai</span>}
                  </td>
                  <td className="p-3 max-w-xs truncate text-soluusi-muted">{r.complaintExcerpt}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => openDetail(r.id)} className="text-sm font-medium text-soluusi-green hover:underline">Detail</button>
                    {" "}
                    <a href={`/api/admin/export?format=pdf&id=${r.id}`}
                      className="text-sm font-medium text-soluusi-green hover:underline">PDF</a>
                    {" "}
                    <button onClick={() => removeRespondent(r.id, r.name)}
                      className="text-sm font-medium text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} className="p-6 text-center text-soluusi-muted/70">Tidak ada responden yang cocok filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detail && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-lg font-bold text-soluusi-ink">{detail.respondent.name}</h3>
              <button onClick={() => setDetail(null)} className="text-soluusi-muted hover:text-soluusi-ink">✕</button>
            </div>
            <dl className="mt-4 space-y-1 text-sm">
              <Row k="Waktu Submit" v={detail.respondent.created_at} />
              <Row k="Email" v={detail.respondent.email} />
              <Row k="Telepon" v={detail.respondent.phone} />
              <Row k="Provinsi" v={detail.respondent.province ?? "—"} />
              <Row k="Kota/Kabupaten" v={detail.respondent.domicile} />
              <Row k="Tanggal Lahir" v={detail.respondent.birth_date} />
              <Row k="Usia" v={`${detail.respondent.age} tahun`} />
              <Row k="Jenis Kelamin" v={detail.respondent.gender === "L" ? "Laki-laki" : "Perempuan"} />
              <Row k="Status" v={detail.respondent.status === "completed" ? "Selesai" : "Form saja"} />
              {detail.summary && (
                <div className="pt-2">
                  <Row k="Skor PSS-10" v={`${detail.summary.score}/40 · ${detail.summary.label}`} />
                </div>
              )}
            </dl>
            <h4 className="mt-4 text-sm font-semibold text-soluusi-ink">Keluhan</h4>
            <p className="mt-1 text-sm text-soluusi-muted">{detail.respondent.complaint}</p>
            {detail.respondent.status === "completed" && (
              <div className="mt-4 flex gap-2">
                <a href={`/api/admin/export?format=pdf&id=${detail.respondent.id}`}
                  className="rounded-lg border border-soluusi-line bg-white px-4 py-2 text-sm font-medium text-soluusi-ink hover:bg-soluusi-surface">
                  Unduh PDF
                </a>
                <a href={`/api/admin/export?format=xlsx&id=${detail.respondent.id}`}
                  className="rounded-lg border border-soluusi-line bg-white px-4 py-2 text-sm font-medium text-soluusi-ink hover:bg-soluusi-surface">
                  Unduh Excel
                </a>
              </div>
            )}
            <button onClick={() => removeRespondent(detail.respondent.id, detail.respondent.name)}
              className="mt-3 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
              Hapus Data Responden Ini
            </button>
            <h4 className="mt-4 text-sm font-semibold text-soluusi-ink">Jawaban PSS-10</h4>
            {detail.respondent.status === "completed" ? (
              <ol className="mt-2 space-y-2 text-sm">
                {PSS10_LABELS.map((q, i) => (
                  <li key={i} className="rounded-lg bg-soluusi-surface p-3">
                    <p className="text-soluusi-ink">{q}</p>
                    <p className="mt-1 font-medium text-soluusi-green-dark">{detail.respondent[`q${i + 1}`]} · {SCALE[detail.respondent[`q${i + 1}`]]}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-sm text-soluusi-muted/70">Belum mengisi asesmen</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-soluusi-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-soluusi-ink">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-32 shrink-0 text-soluusi-muted">{k}</dt>
      <dd className="font-medium text-soluusi-ink">{v}</dd>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col text-xs text-soluusi-muted">
      {label}
      {children}
    </label>
  );
}
