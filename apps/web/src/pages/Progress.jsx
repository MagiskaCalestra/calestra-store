// apps/web/src/pages/Progress.jsx
import React from "react";
import { getAllGoals } from "../api/infinity";

export default function ProgressPage() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const json = await getAllGoals();
        if (!alive) return;
        setData(json);
      } catch (e) {
        if (!alive) return;
        setErr("Kunde inte ladda progress.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <main className="container"><div className="sk" /></main>;
  if (err) return <main className="container"><p className="err">{err}</p></main>;
  if (!data) return null;

  return (
    <main className="container">
      <h1>Progress</h1>
      <p>Huvudmål och etapper. Vi visar procent och supporters – inga belopp.</p>

      {data.goals.map(g => (
        <section key={g.id} className="goal">
          <header>
            <h2>{g.title}</h2>
            {data.currentMain === g.id ? <span className="badge">Aktiv</span> : null}
          </header>

          <ul className="stages">
            {g.stages.map(s => (
              <li key={s.id}>
                <div className="row">
                  <div className="meta">
                    <strong>{s.id}</strong> <span>{s.title}</span>
                  </div>
                  <div className="bar">
                    <div className="fill" style={{width: `${Math.max(0, Math.min(100, s.percent || 0))}%`}} />
                  </div>
                  <div className="pct">{Math.max(0, Math.min(100, s.percent || 0)).toFixed(1)}%</div>
                </div>
                {s.reward ? <div className="sub">Belöning: {s.reward}</div> : null}
                {s.summary ? <div className="sub">{s.summary}</div> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <style>{`
        .container{ max-width:1000px; margin:0 auto; padding:24px; color:#e6ebf4; }
        .sk{ height:120px; border-radius:12px; background:linear-gradient(90deg,#121a27,#1b2537,#121a27); background-size:200% 100%; animation:sh 1.3s infinite; }
        @keyframes sh { 0%{background-position:0 0;} 100%{background-position:200% 0;} }
        .err{ color:#ffb4b4; background:#311a1a; padding:12px; border-radius:10px; }
        .goal{ margin:22px 0 28px; padding:16px; border:1px solid #1f2a3d; border-radius:14px; background:#0f1623; }
        .goal header{ display:flex; gap:10px; align-items:center; }
        .badge{ font-size:12px; padding:2px 8px; border-radius:999px; background:#123; color:#9ec5ff; border:1px solid #23405f; }
        .stages{ list-style:none; padding:0; margin:12px 0 0; display:grid; gap:10px; }
        .row{ display:grid; grid-template-columns: 1fr 4fr auto; gap:10px; align-items:center; }
        .bar{ height:10px; background:#1f2937; border-radius:999px; overflow:hidden; }
        .fill{ height:10px; background:linear-gradient(90deg, #9ec5ff, #19c37d); }
        .pct{ font-size:12px; color:#a3acb8; }
        .meta strong{ color:#9ec5ff; }
        .sub{ font-size:12px; color:#a3acb8; margin-left:4px; }
      `}</style>
    </main>
  );
}
