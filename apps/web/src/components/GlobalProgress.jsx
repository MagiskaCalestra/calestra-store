// apps/web/src/components/GlobalProgress.jsx
import React from "react";
import { getProgressSummary } from "../api/infinity";

export default function GlobalProgress({ className = "", showSupporters = true }) {
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const json = await getProgressSummary();
        if (!alive) return;
        setData(json || null);
      } catch (e) {
        if (!alive) return;
        setErr("Kunde inte hämta status just nu.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  function Bar({ valuePct = 0, label, right }) {
    const pct = Math.max(0, Math.min(100, Number(valuePct) || 0));
    return (
      <div className="row">
        <div className="row-head"><span>{label}</span>{right ? <strong>{right}</strong> : null}</div>
        <div className="track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="row-foot">{pct.toFixed(2)}%</div>
      </div>
    );
  }

  if (loading) return <div className={`gp ${className}`}><div className="skeleton" /></div>;
  if (err) return <div className={`gp ${className}`}><div className="error">{err}</div></div>;
  if (!data) return null;

  const percent = Number(data.percent || 0);
  const storePercent = Number(data.storePercent || 0);
  const supporters = Number(data.supporters || 0);

  return (
    <div className={`gp ${className}`}>
      <Bar label="Mål" valuePct={100} right="100%" />
      <Bar label="Totalt" valuePct={percent} right={`${percent.toFixed(2)}%`} />
      <Bar label="Butikens andel" valuePct={storePercent} right={`${storePercent.toFixed(2)}%`} />
      {showSupporters && <div className="meta">Supporters: <strong>{supporters.toLocaleString("sv-SE")}</strong></div>}
      <style>{`
        .gp { display:grid; gap:12px; }
        .row { display:grid; gap:6px; }
        .row-head{ display:flex; justify-content:space-between; font-weight:600; color:#e6e7ea; }
        .track{ height:10px; border-radius:999px; background:#1f2937; overflow:hidden; }
        .fill{ height:10px; background:linear-gradient(90deg, var(--mood,#9ec5ff), #19c37d); }
        .row-foot{ font-size:12px; color:#a3acb8; }
        .skeleton{ height:64px; border-radius:12px; background:linear-gradient(90deg,#1c2432,#222c3f,#1c2432); background-size:200% 100%; animation:sh 1.3s infinite; }
        @keyframes sh { 0%{background-position:0 0;} 100%{background-position:200% 0;} }
        .error{ padding:12px; border-radius:10px; background:#311a1a; color:#ffb4b4; }
        .meta{ font-size:12px; color:#a3acb8; }
      `}</style>
    </div>
  );
}
