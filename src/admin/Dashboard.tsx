import { useEffect, useState } from "react";

type Summary = {
  totalRespondents: number; completed: number; registeredOnly: number;
  averageScore: number | null;
  categories: Record<string, number>;
  domiciles: Record<string, number>;
  genders: Record<string, number>;
};
type Respondent = {
  id: number; createdAt: string; status: string; name: string; age: number;
  domicile: string; gender: string; complaintExcerpt: string;
  score: number | null; label: string | null; color: string | null;
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Wellbeing</h1>
        <div className="flex gap-2">
          <a href="/api/admin/export"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Export CSV
          </a>
          <button onClick={onLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Keluar
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total Responden" value={summary.totalRespondents} />
        <Stat label="Selesai WHO-5" value={summary.completed} />
        <Stat label="Form Saja" value={summary.registeredOnly} />
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

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">Responden</h2>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Waktu</th><th className="p-3">Nama</th><th className="p-3">Usia</th>
                <th className="p-3">Domisili</th><th className="p-3">Skor</th><th className="p-3">Keluhan</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {respondents.map(r => (
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
                  <td className="p-3">
                    <button onClick={() => openDetail(r.id)} className="text-sm font-medium text-indigo-600 hover:underline">Detail</button>
                  </td>
                </tr>
              ))}
              {!respondents.length && (
                <tr><td colSpan={7} className="p-6 text-center text-slate-400">Belum ada responden</td></tr>
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
