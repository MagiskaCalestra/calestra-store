import React from "react";
import { getRef } from "@core/AffiliateManager";
import { runNightlySync, getSnapshot, getLiveSales } from "@core/C-Core";
import { loadBankDirectory } from "@core/BankDirectory";
import { buildPayoutQueue, payoutQueueToCSV } from "@core/PayoutQueue";
import { downloadCSV } from "@utils/csv";
import { buildMonthlyReportHTML, downloadHTML } from "@utils/report";
import { ensureFreshFX, fxTo } from "@core/FX";

export default function MembersIndex() {
  const [loading, setLoading] = React.useState(true);
  const [snap, setSnap] = React.useState(getSnapshot());
  const [sales, setSales] = React.useState(getLiveSales());
  const [bankDir, setBankDir] = React.useState(loadBankDirectory());
  const myRef = getRef()?.code;

  const isAdmin =
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).get("admin") === "1" ||
     (localStorage.getItem("cw.admin") === "1"));

  async function syncNow() {
    setLoading(true);
    try { await ensureFreshFX(); } catch {}
    const s = await runNightlySync();
    setSnap(s);
    setSales(getLiveSales());
    setBankDir(loadBankDirectory());
    setLoading(false);
  }

  React.useEffect(() => {
    syncNow();
    if (isAdmin) {
      const key = "cw.autoExport." + new Date().toISOString().slice(0, 10);
      if (!localStorage.getItem(key)) {
        setTimeout(() => {
          exportMonthlyReport();
          exportCSV();
          localStorage.setItem(key, "1");
        }, 600);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myRow = snap?.earnings?.rows?.find((r) => r.ref === myRef);

  function exportCSV() {
    const queue = buildPayoutQueue({ bankDirectory: bankDir });
    const csv = payoutQueueToCSV(queue);
    downloadCSV(`calestra_payouts_${dateKey()}.csv`, csv);
  }

  function exportMonthlyReport() {
    const html = buildMonthlyReportHTML({
      title: `Calestra – Monthly Report ${dateKey()}`,
      snapshot: snap,
      bankDirectory: bankDir,
      myRef
    });
    downloadHTML(`calestra_report_${dateKey()}.html`, html);
  }

  // Totals i SEK
  const totApprovedSEK = snap?.earnings?.totals?.approvedSek || 0;
  const totPendingSEK  = snap?.earnings?.totals?.pendingSek  || 0;

  // FX-vy
  const fx = (amt, ccy) => { try { return fxTo(amt, "SEK", ccy); } catch { return null; } };
  const fxBlock = [
    { ccy: "EUR", appr: fx(totApprovedSEK, "EUR"), pend: fx(totPendingSEK, "EUR") },
    { ccy: "USD", appr: fx(totApprovedSEK, "USD"), pend: fx(totPendingSEK, "USD") },
    { ccy: "TRY", appr: fx(totApprovedSEK, "TRY"), pend: fx(totPendingSEK, "TRY") },
  ];

  const showBankWarning = myRef && !bankDir[myRef];

  return (
    <div className="container section-lg">
      {/* Header */}
      <div className="row" style={{ alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div className="h2">Min sida (Affiliates & Ambassadörer)</div>
          <div className="small">
            Ref: <b>{myRef || "–"}</b> • Senaste körning: {snap?.ts ? new Date(snap.ts).toLocaleString() : "–"}
          </div>
          {showBankWarning && (
            <div className="small" style={{ marginTop: 6, color: "#f5c84b" }}>
              ⚠️ Utbetalningsuppgifter saknas för <b>{myRef}</b>. Be admin lägga till på{" "}
              <a className="small" href="/admin/payouts" style={{ textDecoration: "underline" }}>Admin: Utbetalningar</a>.
            </div>
          )}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {isAdmin && <a className="btn" href="/admin/payouts">Admin: Utbetalningar</a>}
          <button className="btn" onClick={exportMonthlyReport}>Månadsrapport (HTML/PDF)</button>
          <button className="btn" onClick={exportCSV}>Utbetalningskö (CSV)</button>
          <button className="btn btn-acc" onClick={syncNow} disabled={loading}>
            {loading ? "Synkar…" : "Uppdatera nu"}
          </button>
        </div>
      </div>

      {/* KPI – SEK */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-pad-lg">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="h3">Översikt</div>
            <div className="small">Totalt {snap?.salesCount || 0} transaktioner</div>
          </div>
          <div className="row" style={{ marginTop: 12, flexWrap: "wrap", gap: 12 }}>
            <Kpi label="Godkänt (SEK)" value={totApprovedSEK} />
            <Kpi label="Väntande (SEK)" value={totPendingSEK} />
            <Kpi label="Din intjäning (SEK)" value={myRow ? myRow.earningsSek : 0} />
            <Kpi label="Orders (godkända)" value={snap?.earnings?.totals?.countApproved || 0} />
          </div>

          {/* KPI – FX */}
          {fxBlock.some(x => x.appr != null) && (
            <>
              <div className="h3" style={{ marginTop: 16 }}>Valutavy (beräknad från SEK)</div>
              <div className="row" style={{ marginTop: 10, flexWrap: "wrap", gap: 12 }}>
                {fxBlock.map(({ccy, appr, pend}) => (
                  <div key={ccy} className="glass" style={{ minWidth: 220 }}>
                    <div className="card-pad">
                      <div className="small" style={{ opacity: .85 }}>{ccy}</div>
                      <div className="row" style={{ gap: 14, marginTop: 4 }}>
                        <div>
                          <div className="small" style={{ opacity: .75 }}>Approved</div>
                          <div className="h2">{appr != null ? appr.toLocaleString("sv-SE") : "–"}</div>
                        </div>
                        <div>
                          <div className="small" style={{ opacity: .75 }}>Pending</div>
                          <div className="h2">{pend != null ? pend.toLocaleString("sv-SE") : "–"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dina siffror */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-pad-lg">
          <div className="h3">Dina siffror</div>
          {myRow ? (
            <div className="row" style={{ marginTop: 10, gap: 14 }}>
              <Pill>Tier: {myRow.tier}</Pill>
              <Pill>Kommission: {(myRow.commissionRate * 100).toFixed(0)}%</Pill>
              <Pill>Approved: {fmt(myRow.approvedSek)} SEK</Pill>
              <Pill>Pending: {fmt(myRow.pendingSek)} SEK</Pill>
              <Pill>Ordrar (godkända): {fmt(myRow.countApproved)}</Pill>
            </div>
          ) : (
            <div className="small" style={{ marginTop: 6, opacity: 0.8 }}>Ingen aktivitet ännu på din ref.</div>
          )}
        </div>
      </div>

      {/* Senaste försäljningar */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-pad-lg">
          <div className="h3">Senaste försäljningar (alla refs)</div>
          <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", opacity: 0.8 }}>
                  <th style={th}>Tid</th>
                  <th style={th}>Typ</th>
                  <th style={th}>Nätverk/Partner</th>
                  <th style={th}>Ref</th>
                  <th style={th}>Belopp</th>
                  <th style={th}>Valuta</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--ring)" }}>
                    <td style={td}>{new Date(s.ts).toLocaleString()}</td>
                    <td style={td}>{s.flow || "inbound"}</td>
                    <td style={td}>{s.network}</td>
                    <td style={td}>{s.ref}</td>
                    <td style={td}>{fmt(s.amount)}</td>
                    <td style={td}>{s.currency}</td>
                    <td style={td}>{s.status}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan="7" style={{ padding: "8px 6px", opacity: 0.8 }}>Inga poster ännu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="small" style={{ opacity:.75, marginTop:8 }}>
            <b>Typ:</b> <i>inbound</i> = vi betalar ut (de sålde våra varor). <i>outbound</i> = vi tjänar via partnertrafik (vi skickade kund till partner).
          </div>
        </div>
      </div>

      {/* ADMIN: CSV-normalisering & förhandsvisning */}
      {isAdmin && <AdminCsvPanel />}
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="glass" style={{ minWidth: 200 }}>
      <div className="card-pad">
        <div className="small" style={{ opacity: 0.85 }}>{label}</div>
        <div className="h2" style={{ marginTop: 4 }}>
          {typeof value === "number" ? value.toLocaleString("sv-SE") : value}
        </div>
      </div>
    </div>
  );
}
function Pill({ children }) { return <span className="pill">{children}</span>; }
function dateKey() { const d=new Date(); const m=String(d.getMonth()+1).padStart(2,"0"); return `${d.getFullYear()}-${m}`; }
function fmt(n){ return typeof n==="number" ? n.toLocaleString("sv-SE") : n; }
const th = { padding: "8px 6px", borderBottom: "1px solid var(--ring)" };
const td = { padding: "8px 6px" };

/* ---------- Admin CSV-panel ---------- */
function AdminCsvPanel() {
  const [rows, setRows] = React.useState([]);
  const [meta, setMeta] = React.useState({ network:"Awin", flow:"outbound" });

  async function onFile(ev){
    const file = ev.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = normalizeCSV(text, meta.network, meta.flow);
    setRows(parsed);
    ev.target.value = "";
  }

  function downloadNormalized(){
    const header = ["ts","flow","network","ref","amount","currency","status"];
    const lines = [header.join(",")].concat(
      rows.map(r => [r.ts,r.flow,r.network,r.ref,r.amount,r.currency,r.status].map(csvEsc).join(","))
    );
    const blob = new Blob([lines.join("\n")], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `normalized_${meta.network}_${dateKey()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="card-pad-lg">
        <div className="row" style={{justifyContent:"space-between", alignItems:"baseline"}}>
          <div className="h3">Admin: CSV-normalisering (förhandsvisning)</div>
          <div className="row" style={{gap:8}}>
            <select className="select" value={meta.network} onChange={e=>setMeta({...meta, network:e.target.value})}>
              <option>Awin</option>
              <option>CJ</option>
              <option>Impact</option>
              <option>Adtraction</option>
              <option>Custom</option>
            </select>
            <select className="select" value={meta.flow} onChange={e=>setMeta({...meta, flow:e.target.value})}>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
            <label className="btn">
              Ladda CSV
              <input type="file" accept=".csv,text/csv" onChange={onFile} style={{display:"none"}} />
            </label>
            <button className="btn btn-acc" onClick={downloadNormalized} disabled={!rows.length}>Ladda ned normaliserad CSV</button>
          </div>
        </div>

        <div className="small" style={{opacity:.8, marginTop:8}}>
          Normaliserade kolumner: <code>ts, flow, network, ref, amount, currency, status</code>.
          Nästa steg: koppla direkt till vår ingest så att raderna kan matas in i intäktsloggen automatiskt.
        </div>

        <div style={{overflowX:"auto", marginTop:10}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{opacity:.8, textAlign:"left"}}>
                {["ts","flow","network","ref","amount","currency","status"].map(h=>(
                  <th key={h} style={{padding:"8px 6px", borderBottom:"1px solid var(--ring)"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i} style={{borderBottom:"1px solid var(--ring)"}}>
                  <td style={td}>{r.ts}</td>
                  <td style={td}>{r.flow}</td>
                  <td style={td}>{r.network}</td>
                  <td style={td}>{r.ref}</td>
                  <td style={td}>{r.amount}</td>
                  <td style={td}>{r.currency}</td>
                  <td style={td}>{r.status}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan="7" style={{padding:"8px 6px", opacity:.8}}>Ingen fil vald.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function csvEsc(s=""){ const needs = /[",\n]/.test(String(s)); return needs ? `"${String(s).replace(/"/g,'""')}"` : String(s); }

// Minimal normalisering – mappar vanliga kolumner från olika nätverk.
// (Vi kan lätt utöka denna med fler nätverk eller specialfall.)
function normalizeCSV(text, network, flow){
  const lines = (text||"").split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(",").map(s => s.trim().toLowerCase());
  const idx = (k) => header.findIndex(h => h === k);

  // Vanliga kolumnnamn per nätverk (enkla heuristiker)
  const maps = {
    Awin:   { ts:["date","transaction date","time"], ref:["clickref","ref","subid"], amount:["amount","sale amount","commission amount"], currency:["currency"], status:["status"] },
    CJ:     { ts:["post date","action date"], ref:["sid","sub id","website id","link id"], amount:["commission amount","sale amount"], currency:["currency"], status:["action status","status"] },
    Impact: { ts:["event date","created at"], ref:["sub id","partner sub id","sid"], amount:["amount","payout"], currency:["currency"], status:["state","status"] },
    Adtraction: { ts:["date","transactiondate"], ref:["clickid","ref"], amount:["commission","amount"], currency:["currency"], status:["status"] },
    Custom: { ts:["ts","date"], ref:["ref"], amount:["amount"], currency:["currency"], status:["status"] }
  }[network] || {};

  function pick(cands, row){
    for (const c of (cands||[])){
      const i = idx(c);
      if (i >= 0) return row[i];
    }
    return "";
  }

  const out = [];
  for (let i=1;i<lines.length;i++){
    const row = lines[i].split(",");
    if (!row.length) continue;
    out.push({
      ts:      pick(maps.ts,row)      || new Date().toISOString(),
      flow:    flow || "outbound",
      network: network,
      ref:     pick(maps.ref,row)     || "",
      amount:  pick(maps.amount,row)  || "0",
      currency:pick(maps.currency,row)|| "SEK",
      status:  pick(maps.status,row)  || "pending",
    });
  }
  return out;
}
