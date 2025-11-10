import React from "react";

export default function AdminSettings(){
  const [cfg, setCfg] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("cw.settings")||"{}"); } catch { return {}; }
  });

  function set(key, val){
    const next = { ...cfg, [key]: val };
    setCfg(next);
    try { localStorage.setItem("cw.settings", JSON.stringify(next)); } catch {}
  }

  return (
    <div className="container section-lg">
      <div className="h2">Admin – Inställningar</div>
      <div className="card" style={{marginTop:12}}>
        <div className="card-pad-lg">
          <div className="row" style={{gap:12, flexWrap:"wrap"}}>
            <label className="stack">
              <span className="small">Global % till affiliates (default)</span>
              <input className="input" type="number" value={cfg.defaultCommissionPct||10}
                     onChange={e=>set("defaultCommissionPct", Number(e.target.value||0))}/>
            </label>
            <label className="stack">
              <span className="small">FX: tillåt TRY</span>
              <select className="select" value={cfg.allowTRY? "1":"0"} onChange={e=>set("allowTRY", e.target.value==="1")}>
                <option value="1">Ja</option><option value="0">Nej</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
