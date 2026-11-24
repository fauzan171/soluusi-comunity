import { useEffect, useState } from "react";

type Summary = {
  totalRespondents: number; completed: number; registeredOnly: number; dropOffRate: number;
  averageScore: number | null;
  categories: Record<string, number>;
  domiciles: Record<string, number>;
  genders: Record<string, number>;
  questionAverages: (number | null)[];
};
type Respondent = {
  id: number; createdAt: string; status: string; name: string; age: number;
  domicile: string; gender: string; complaintExcerpt: string;
  score: number | null; label: string | null; color: string | null; category: string | null;
};
type Detail = {
  respondent: any; summary: { score: number; label: string; color: string } | null;
};

const COLOR_CLASS: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
};
const WHO5_LABELS = [
  "Saya merasa ceria dan bersemangat",
  "Saya merasa tenang dan santai",
  "Saya merasa aktif dan penuh energi",
  "Saya bangun tidur dengan perasaan segar dan cukup beristirahat",
  "Hidup saya penuh hal-hal yang menarik",
];
const SCALE = ["Tidak pernah", "Sangat jarang", "Jarang", "Kadang-kadang", "Sering", "Selalu"];
const CATEGORY_ORDER: [string, string][] = [
  ["good", "Baik 🟢"], ["fair", "Sedang 🟡"], ["poor", "Buruk 🟠"], ["depression", "Indikasi depresi 🔴"],
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

  if (!summary || !respondents) return <p className="text-slate-500">Memuat…</p>;

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
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Wellbeing</h1>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/export?${exportQuery()}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Export CSV
          </a>
          <a href={`/api/admin/export?format=xlsx&${exportQuery()}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Export Excel
          </a>
          <a href={`/api/admin/export?format=pdf&${exportQuery()}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Export PDF
          </a>
          <button onClick={onLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Keluar
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Total Responden" value={summary.totalRespondents} />
        <Stat label="Selesai WHO-5" value={summary.completed} />
        <Stat label="Form Saja" value={summary.registeredOnly} />
        <Stat label="Drop-off" value={`${summary.dropOffRate}%`} />
        <Stat label="Rata-rata Skor" value={summary.averageScore ?? "—"} />
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-500">Distribusi Kategori (responden selesai)</h2>
        <div className="mt-3 space-y-2">
          {CATEGORY_ORDER.map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-40 text-sm text-slate-700">{label}</span>
              <div className="h-4 flex-1 rounded bg-slate-100">
                <div className={`h-4 rounded ${key === "good" ? "bg-green-500" : key === "fair" ? "bg-yellow-500" : key === "poor" ? "bg-orange-500" : "bg-red-500"}`}
                  style={{ width: `${summary.completed ? (summary.categories[key] / summary.completed) * 100 : 0}%` }} />
              </div>
              <span className="w-8 text-right text-sm font-semibold text-slate-900">{summary.categories[key]}</span>
            </div>
          ))}
        </div>
      </section>

      {summary.questionAverages.some(v => v != null) && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500">Rata-rata Jawaban per Pertanyaan (responden selesai)</h2>
          <ol className="mt-3 space-y-2">
            {WHO5_LABELS.map((q, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-56 shrink-0 truncate text-sm text-slate-700" title={q}>{q}</span>
                <div className="h-4 flex-1 rounded bg-slate-100">
                  <div className="h-4 rounded bg-indigo-500"
                    style={{ width: `${(summary.questionAverages[i] ?? 0) / 5 * 100}%` }} />
                </div>
                <span className="w-10 text-right text-sm font-semibold text-slate-900">{summary.questionAverages[i] ?? "—"}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-500">Responden ({filtered.length})</h2>
          <div className="flex flex-wrap items-end gap-2">
            <Filter label="Kategori">
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white p-2 text-sm">
                <option value="">Semua</option>
                {CATEGORY_ORDER.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Filter>
            <Filter label="Domisili">
              <select value={filterDomicile} onChange={e => setFilterDomicile(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white p-2 text-sm">
                <option value="">Semua</option>
                {Object.keys(summary.domiciles).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Filter>
            <Filter label="Dari">
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white p-2 text-sm" />
            </Filter>
            <Filter label="Sampai">
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white p-2 text-sm" />
            </Filter>
            {(filterCategory || filterDomicile || filterFrom || filterTo) && (
              <button onClick={() => { setFilterCategory(""); setFilterDomicile(""); setFilterFrom(""); setFilterTo(""); }}
                className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-500 hover:bg-slate-50">
                Reset
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Waktu</th><th className="p-3">Nama</th><th className="p-3">Usia</th>
                <th className="p-3">Domisili</th><th className="p-3">Skor</th><th className="p-3">Keluhan</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="p-3 whitespace-nowrap text-slate-500">{r.createdAt}</td>
                  <td className="p-3 font-medium text-slate-900">{r.name}</td>
                  <td className="p-3">{r.age}</td>
                  <td className="p-3 text-slate-600">{r.domicile}</td>
                  <td className="p-3">
                    {r.score != null
                      ? <span className={`rounded-full px-2 py-1 text-xs font-semibold ${COLOR_CLASS[r.color!]}`}>{r.score} · {r.label}</span>
                      : <span className="text-xs text-slate-400">belum selesai</span>}
                  </td>
                  <td className="p-3 max-w-xs truncate text-slate-600">{r.complaintExcerpt}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => openDetail(r.id)} className="text-sm font-medium text-indigo-600 hover:underline">Detail</button>
                    {" "}
                    <a href={`/api/admin/export?format=pdf&id=${r.id}`}
                      className="text-sm font-medium text-indigo-600 hover:underline">PDF</a>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} className="p-6 text-center text-slate-400">Tidak ada responden yang cocok filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detail && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900">{detail.respondent.name}</h3>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <dl className="mt-4 space-y-1 text-sm">
              <Row k="Waktu" v={detail.respondent.created_at} />
              <Row k="Email" v={detail.respondent.email} />
              <Row k="Telepon" v={detail.respondent.phone} />
              <Row k="Domisili" v={detail.respondent.domicile} />
              <Row k="Tanggal Lahir" v={detail.respondent.birth_date} />
              <Row k="Usia" v={`${detail.respondent.age} tahun`} />
              <Row k="Jenis Kelamin" v={detail.respondent.gender === "L" ? "Laki-laki" : "Perempuan"} />
              <Row k="Status" v={detail.respondent.status === "completed" ? "Selesai" : "Form saja"} />
              {detail.summary && (
                <div className="pt-2">
                  <Row k="Skor WHO-5" v={`${detail.summary.score}/100 · ${detail.summary.label}`} />
                </div>
              )}
            </dl>
            <h4 className="mt-4 text-sm font-semibold text-slate-700">Keluhan</h4>
            <p className="mt-1 text-sm text-slate-600">{detail.respondent.complaint}</p>
            {detail.respondent.status === "completed" && (
              <div className="mt-4 flex gap-2">
                <a href={`/api/admin/export?format=pdf&id=${detail.respondent.id}`}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Unduh PDF
                </a>
                <a href={`/api/admin/export?format=xlsx&id=${detail.respondent.id}`}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Unduh Excel
                </a>
              </div>
            )}
            <h4 className="mt-4 text-sm font-semibold text-slate-700">Jawaban WHO-5</h4>
            {detail.respondent.status === "completed" ? (
              <ol className="mt-2 space-y-2 text-sm">
                {WHO5_LABELS.map((q, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-slate-700">{q}</p>
                    <p className="mt-1 font-medium text-slate-900">{SCALE[detail.respondent[`q${i + 1}`]]}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-sm text-slate-400">Belum mengisi asesmen</p>
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
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-32 shrink-0 text-slate-500">{k}</dt>
      <dd className="text-slate-900">{v}</dd>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col text-xs text-slate-500">
      {label}
      {children}
    </label>
  );
}
