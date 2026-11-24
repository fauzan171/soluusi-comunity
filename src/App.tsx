import { useEffect, useState } from "react";
import Landing from "./Landing";
import BiodataForm from "./BiodataForm";
import Who5Form from "./Who5Form";
import Thanks from "./Thanks";
import Admin from "./admin/Admin";

type Screen = "landing" | "form" | "who5" | "thanks";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [respondentId, setRespondentId] = useState<number | null>(null);

  // SPA routing sederhana: / → flow user, /admin → dashboard
  useEffect(() => {
    const onPop = () => {
      if (location.pathname === "/admin") return;
      setScreen("landing");
      setRespondentId(null);
      localStorage.removeItem("who5_answers");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (location.pathname === "/admin") return <Admin />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-soluusi-surface px-4">
      {screen === "landing" && (
        <Landing onStart={() => setScreen("form")} />
      )}
      {screen === "form" && (
        <BiodataForm
          onDone={(id) => {
            setRespondentId(id);
            setScreen("who5");
          }}
        />
      )}
      {screen === "who5" && respondentId != null && (
        <Who5Form
          respondentId={respondentId}
          onDone={() => setScreen("thanks")}
        />
      )}
      {screen === "thanks" && (
        <Thanks onReset={() => {
          setScreen("landing");
          setRespondentId(null);
          localStorage.removeItem("who5_answers");
        }} />
      )}
    </main>
  );
}
