// apps/web/src/pages/admin/Affiliates.jsx
import React, { useState } from "react";
import { CCoreSDK } from "../../core/ccore";

export default function AffiliatesAdmin() {
  const [cfg, setCfg] = useState(CCoreSDK.Affiliates.getConfig());
  const [providers, setProviders] = useState(cfg.providers || []);

  const saveProvider = (i, patch) => {
    const next = providers.slice();
    next[i] = { ...next[i], ...patch };
    setProviders(next);
    CCoreSDK.Affiliates.upsertProvider(next[i]);
    setCfg(CCoreSDK.Affiliates.getConfig());
  };

  const toggle = (i) => saveProvider(i, { enabled: !providers[i].enabled });

  const saveUtm = (k, v) => {
    const next = { ...cfg, utm: { ...cfg.utm, [k]: v } };
    CCoreSDK.Affiliates.setConfig(next);
    setCfg(next);
  };

  const setPolicy = (policy) => {
    const next = CCoreSDK.Affiliates.setPolicy(policy);
    setCfg(next);
  };

  return (
    <section className="page">
      <div className="wrap">
        <h1>Affiliates â€“ Partnerinställningar</h1>
        <p className="lead">Sätt partner-ID, aktivera/avaktivera leverantörer och välj compliance-läge (affiliate-only / operator).</p>

        <div className="card">
          <h2>Compliance-läge</h2>
          <div className="row">
            <Radio name="policy" value="affiliate-only" cur={cfg.policy} onChange={()=>setPolicy("affiliate-only")}>
              Affiliate-only (externa länkar, ingen paketering)
            </Radio>
            <Radio name="policy" value="operator" cur={cfg.policy} onChange={()=>setPolicy("operator")}>
              Operator (intern bokning, paket â€“ kräver resegaranti)
            </Radio>
          </div>
          <div className="hint">Aktuellt läge: <strong>{cfg.policy}</strong></div>
        </div>

        <div className="card">
          <h2>UTM-standard</h2>
          <div className="row">
            <label className="lbl">utm_source
              <input className="inp" value={cfg.utm.source} onChange={e=>saveUtm("source", e.target.value)} />
            </label>
            <label className="lbl">utm_medium
              <input className="inp" value={cfg.utm.medium} onChange={e=>saveUtm("medium", e.target.value)} />
            </label>
            <label className="lbl">utm_campaign
              <input className="inp" value={cfg.utm.campaign} onChange={e=>saveUtm("campaign", e.target.value)} />
            </label>
          </div>
        </div>

        <div className="grid">
          {providers.map((p, i) => (
            <div key={p.id} className="card">
              <h3>{p.name}</h3>
              <div className="row">
                <label className="lbl">Partner-ID
                  <input className="inp" value={p.partnerId} onChange={e=>saveProvider(i, { partnerId: e.target.value })} />
                </label>
                <label className="lbl">Base URL
                  <input className="inp" value={p.baseUrl} onChange={e=>saveProvider(i, { baseUrl: e.target.value })} />
                </label>
              </div>
              <div className="row">
                <button className={"btn "+(p.enabled?"on":"off")} onClick={()=>toggle(i)}>{p.enabled ? "Aktiv" : "Avstängd"}</button>
              </div>
              <div className="hint">Params: {p.params?.join(", ") || "â€”"} â€¢ {p.payoutHint}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .wrap { max-width:1100px; margin:0 auto; padding:24px 16px; color:#e8ecff; }
        .lead { opacity:.95; margin-bottom:12px; }
        .card { border:1px solid #2b315e; border-radius:14px; background:#0f1430; padding:14px; margin-bottom:12px; }
        .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap:12px; }
        .row { display:flex; gap:10px; flex-wrap:wrap; }
        .lbl { display:flex; flex-direction:column; gap:6px; min-width:220px; }
        .inp { padding:10px; border-radius:10px; border:1px solid #2b315e; background:#0b0f25; color:#e8ecff; }
        .btn { padding:8px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; cursor:pointer; }
        .btn.on { background:#0e1f18; border-color:#1d4d3b; }
        .btn.off { background:#2a1c12; border-color:#6a4a18; }
        .hint { opacity:.9; margin-top:8px; font-size:.9rem; }
        .radio { padding:6px 10px; border-radius:999px; border:1px solid #2b315e; background:#0b0f25; cursor:pointer; }
        .radio.sel { box-shadow: inset 0 0 0 1px #2c3aa0; }
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
