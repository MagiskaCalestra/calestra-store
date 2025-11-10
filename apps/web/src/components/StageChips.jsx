// apps/web/src/components/StageChips.jsx
import React from "react";
import { getAllGoals } from "../api/infinity";
import Modal from "./Modal";

export default function StageChips({ className = "" }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [goal, setGoal] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [focus, setFocus] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { currentMain, goals } = await getAllGoals();
        if (!alive) return;
        const g = goals.find(x => x.id === currentMain) || goals[0];
        setGoal(g || null);
      } catch (e) {
        if (!alive) return;
        setErr("Kunde inte hämta etapper.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className={className} />;
  if (err || !goal) return null;

  const onOpen = (s) => { setFocus(s); setOpen(true); };

  return (
    <div className={`sc ${className}`}>
      <div className="sc-head">
        <span className="sc-title">{goal.title}</span>
        <a className="sc-link" href="/progress">Läs mer</a>
      </div>
      <div className="sc-row" role="list">
        {goal.stages.map(s => {
          const pct = Math.max(0, Math.min(100, Number(s.percent || 0)));
          return (
            <button key={s.id} className="chip" role="listitem" onClick={() => onOpen(s)} title={s.title}>
              <span>{s.id}</span>
              <em>{s.title}</em>
              <i>{pct.toFixed(0)}%</i>
            </button>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={focus?.title || "Delmål"}
        footer={<a className="btn" href="/progress">Till progress-sidan</a>}
      >
        <div style={{display:"grid", gap:8}}>
          <div><strong>Etapp:</strong> {focus?.id}</div>
          {focus?.summary ? <div>{focus.summary}</div> : null}
          {focus?.reward ? <div><strong>Belöning:</strong> {focus.reward}</div> : null}
          {typeof focus?.percent === "number" ? (
            <div style={{fontSize:12, color:"#a3acb8"}}>Status: {Math.max(0, Math.min(100, focus.percent)).toFixed(1)}%</div>
          ) : null}
        </div>
      </Modal>

      <style>{`
        .sc{ display:grid; gap:10px; }
        .sc-head{ display:flex; align-items:center; gap:10px; }
        .sc-title{ font-weight:700; color:#e6e7ea; }
        .sc-link{ font-size:12px; color:#9dc2ff; text-decoration:none; }
        .sc-row{ display:flex; flex-wrap:wrap; gap:8px; }
        .chip{ display:flex; align-items:center; gap:8px; background:#101826; color:#cfd7e6; border:1px solid #243249;
               padding:8px 10px; border-radius:999px; cursor:pointer; }
        .chip span{ font-weight:700; color:#9ec5ff; }
        .chip em{ font-style:normal; opacity:.9; }
        .chip i{ font-style:normal; font-size:12px; color:#9ddcc7; }
        .btn{ display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:10px; background:#182235; color:#cfe6ff; text-decoration:none; }
      `}</style>
    </div>
  );
}
