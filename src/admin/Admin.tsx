import { useEffect, useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then(r => r.json() as Promise<{ authenticated: boolean }>)
      .then(({ authenticated }) => setAuthed(authenticated))
      .catch(() => setAuthed(false));
  }, []);

  if (authed == null) return <p className="text-slate-500">Memuat…</p>;
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {authed
          ? <Dashboard onLogout={() => setAuthed(false)} />
          : <Login onSuccess={() => setAuthed(true)} />}
      </div>
    </div>
  );
}
