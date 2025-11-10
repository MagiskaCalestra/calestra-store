// apps/web/src/pages/admin/Rules.jsx
import React, { useEffect, useState } from "react";
import { CCoreSDK } from "../../core/ccore";

export default function AdminRules() {
  const [rules, setRules] = useState(CCoreSDK?.Rules?.getRules() || {
    blackoutDates: [],
    groupDiscount: { threshold: 4, pct: 5 }
  });
  const [newDate, setNewDate] = useState("");
  const [importText, setImportText] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const off = CCoreSDK.events.on("rules.updated", ({ rules }) => setRules(rules));
    return () => off();
  }, []);

  const addBlackout = () => {
    if (!newDate) return;
    const list = Array.from(new Set([...(rules.blackoutDates || []), newDate])).sort();
    const next = CCoreSDK.Rules.setRules({ ...rules, blackoutDates: list });
    setRules(next);
    setNewDate("");
  };

  const removeBlackout = (d) => {
    const list = (rules.blackoutDates || []).filter(x => x !== d);
    const next = CCoreSDK.Rules.setRules({ ...rules, blackoutDates: list });
    setRules(next);
  };

  const saveGroup = (k, v) => {
    const gd = { ...rules.groupDiscount, [k]: Number(v) || 0 };
    const next = CCoreSDK.Rules.setRules({ ...rules, groupDiscount: gd });
    setRules(next);
  };

  const onExport = () => {
    const json = CCoreSDK.Rules.exportRules();
    // litet quality-of-life: kopiera till clipboard om möjligt
    try { navigator.clipboard.writeText(json); } catch {}
    setImportText(json);
  };

  const onImport = () => {
    setErr("");
    try {
      const next = CCoreSDK.Rules.importRules(importText);
      setRules(next);
    } catch (e) {
      setErr(e.message || "Importfel.");
    }
  };

  return (
    <section className="page admin rules">
      <div className="wrap">
        <h1>Rule Engine (mock)</h1>
        <p className="lead">Styr blackout-datum samt grupprabatt. Effekterna syns direkt i kalendern & prissättningen.</p>

        <div className="grid">
          <div className="card">
            <h2>Blackout-datum</h2>
            <div className="row">
              <input type="date" className="inp" value={newDate} onChange={(e)=>setNewDate(e.target.value)} />
              <button className="btn" onClick={addBlackout}>Lägg till</button>
            </div>

            <ul className="list">
              {(rules.blackoutDates || []).length === 0 && <li className="muted">Inga satta datum.</li>}
              {(rules.blackoutDates || []).map(d => (
                <li key={d}>
                  <span>{d}</span>
                  <button className="btn ghost" onClick={()=>removeBlackout(d)}>Ta bort</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Grupprabatt biljetter</h2>
            <label className="lbl">
              Tröskel (antal gäster)
              <input type="number" min="0" className="inp"
                value={rules.groupDiscount?.threshold ?? 4}
                onChange={(e)=>saveGroup("threshold", e.target.value)} />
            </label>
            <label className="lbl">
              Rabatt (%)
              <input type="number" min="0" max="100" className="inp"
                value={rules.groupDiscount?.pct ?? 5}
                onChange={(e)=>saveGroup("pct", e.target.value)} />
            </label>
            <p className="hint">Gäller på summan av vuxen + barn. Ersätter hårdkodad standardregel.</p>
          </div>

          <div className="card">
            <h2>Export/Import</h2>
            <div className="row">
              <button className="btn" onClick={onExport}>Exportera till JSON</button>
              <button className="btn ghost" onClick={onImport}>Importera från JSON</button>
            </div>
            {err && <div className="error" role="alert">{err}</div>}
            <textarea
              className="ta"
              rows={10}
              placeholder='{"blackoutDates": ["2025-12-24"], "groupDiscount": {"threshold": 4, "pct": 5}}'
              value={importText}
              onChange={(e)=>setImportText(e.target.value)}
            />
            <p className="hint">Export kopieras även till urklipp (om webbläsaren tillåter).</p>
          </div>
        </div>
      </div>

      <style>{`
        .wrap { max-width:1100px; margin:0 auto; padding:24px 16px; color:#e8ecff; }
        .lead { opacity:.9; margin-bottom:14px; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:18px; }
        @media (max-width: 980px){ .grid { grid-template-columns: 1fr; } }

        .card { border:1px solid #2b315e; border-radius:14px; padding:14px; background:#0f1430; }
        .row { display:flex; gap:10px; align-items:center; margin:8px 0; }
        .list { display:flex; flex-direction:column; gap:8px; margin-top:10px; }
        .list li { display:flex; justify-content:space-between; align-items:center; border:1px solid #2b315e; border-radius:10px; padding:8px 10px; background:#0b0f25; }
        .muted { opacity:.85; }

        .lbl { display:flex; flex-direction:column; gap:6px; margin-top:8px; }
        .inp { padding:10px; border-radius:10px; border:1px solid #2b315e; background:#0b0f25; color:#e8ecff; }
        .btn { padding:8px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; cursor:pointer; }
        .btn.ghost { background:transparent; }
        .hint { opacity:.85; margin-top:8px; }
        .error { background:#3a1020; border:1px solid #6a1040; color:#ffd6e6; padding:10px; border-radius:10px; }

        .ta { width:100%; margin-top:10px; border-radius:10px; border:1px solid #2b315e; background:#0b0f25; color:#e8ecff; padding:10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      `}</style>
    </section>
  );
}
