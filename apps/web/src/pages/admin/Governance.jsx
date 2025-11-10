// apps/web/src/pages/admin/Governance.jsx
import React, { useState } from "react";
import { getGovernance, setConcerts, ConcertMode, AlcoholPolicy } from "../../core/governance";

export default function GovernancePage() {
  const [cfg, setCfg] = useState(getGovernance());

  const save = (patch) => {
    const next = setConcerts(patch);
    setCfg(next);
  };

  return (
    <section className="page">
      <div className="wrap">
        <h1>Styrelseläge</h1>
        <p className="lead">Här kan styrelsen (senare) besluta om läge för konserter. Just nu sparas valet lokalt för prototyp.</p>

        <div className="card">
          <h2>Konserter (C-Live)</h2>
          <label className="lbl">Läge</label>
          <div className="row">
            <Radio name="mode" value={ConcertMode.UNDECIDED} cur={cfg.concerts.mode} onChange={()=>save({ mode: ConcertMode.UNDECIDED })}>Ej beslutat</Radio>
            <Radio name="mode" value={ConcertMode.INCLUDED} cur={cfg.concerts.mode} onChange={()=>save({ mode: ConcertMode.INCLUDED })}>Ingår i park</Radio>
            <Radio name="mode" value={ConcertMode.NIGHT_TICKET} cur={cfg.concerts.mode} onChange={()=>save({ mode: ConcertMode.NIGHT_TICKET })}>Kvällsbiljett</Radio>
            <Radio name="mode" value={ConcertMode.BOTH} cur={cfg.concerts.mode} onChange={()=>save({ mode: ConcertMode.BOTH })}>Båda</Radio>
          </div>

          <label className="lbl">Alkoholpolicy</label>
          <div className="row">
            <Radio name="ap" value={AlcoholPolicy.NONE} cur={cfg.concerts.alcoholPolicy} onChange={()=>save({ alcoholPolicy: AlcoholPolicy.NONE })}>Alkoholfritt</Radio>
            <Radio name="ap" value={AlcoholPolicy.ZONED} cur={cfg.concerts.alcoholPolicy} onChange={()=>save({ alcoholPolicy: AlcoholPolicy.ZONED })}>Zonad servering</Radio>
            <Radio name="ap" value={AlcoholPolicy.LIMITED} cur={cfg.concerts.alcoholPolicy} onChange={()=>save({ alcoholPolicy: AlcoholPolicy.LIMITED })}>Begränsad servering</Radio>
          </div>

          <div className="row">
            <label className="chk"><input type="checkbox" checked={cfg.concerts.diningPackageEnabled} onChange={e=>save({ diningPackageEnabled: e.target.checked })} /> Dining-paket aktiverat</label>
            <label className="chk"><input type="checkbox" checked={cfg.concerts.dreamCirclePerks} onChange={e=>save({ dreamCirclePerks: e.target.checked })} /> DreamCircle-förmåner</label>
          </div>
        </div>
      </div>

      <style>{`
        .wrap { max-width:900px; margin:0 auto; padding:24px 16px; color:#e8ecff; }
        .lead { opacity:.95; margin-bottom:12px; }
        .card { border:1px solid #2b315e; border-radius:14px; background:#0f1430; padding:14px; }
        .lbl { display:block; margin:10px 0 6px; opacity:.9; }
        .row { display:flex; gap:10px; flex-wrap:wrap; }
        .radio { padding:6px 10px; border-radius:999px; border:1px solid #2b315e; background:#0b0f25; cursor:pointer; }
        .radio.sel { box-shadow: inset 0 0 0 1px #2c3aa0; }
        .chk { display:flex; align-items:center; gap:6px; background:#0b0f25; border:1px solid #2b315e; padding:6px 10px; border-radius:10px; }
      `}</style>
    </section>
  );
}

function Radio({ name, value, cur, onChange, children }) {
  const sel = cur === value;
  return (
    <label className={"radio "+(sel?"sel":"")}>
      <input type="radio" name={name} value={value} checked={sel} onChange={onChange} style={{ display:"none" }} />
      {children}
    </label>
  );
}
