import React from "react";
import AdminShell from "@components/admin/AdminShell";
import { getJobStatus, ensureIngestSchedule } from "@core/IngestScheduler";
import { getSnapshot } from "@core/C-Core";
import { getSettings } from "@core/Settings";

export default function AdminDashboard(){
  const [jobs, setJobs] = React.useState([]);
  const [snap, setSnap] = React.useState(getSnapshot());
  const s = getSettings();

  React.useEffect(() => {
    ensureIngestSchedule();
    const t = setInterval(() => {
      setJobs(getJobStatus());
      setSnap(getSnapshot());
    }, 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <AdminShell title="Calestra Admin – Dashboard">
      <div className="cards">
        <article className="card"><div className="card-pad">
          <div className="h3">Systemstatus</div>
          <ul className="small" style={{marginTop:6}}>
            <li>Autosync: var {s.autosyncMinutes} minut(er)</li>
            <li>Senaste snapshot: {snap?.ts ? new Date(snap.ts).toLocaleString() : "–"}</li>
            <li>Antal transaktioner i snapshot: {snap?.salesCount ?? 0}</li>
          </ul>
        </div></article>

        <article className="card"><div className="card-pad">
          <div className="h3">Schemalagda jobb</div>
          <div style={{overflowX:"auto", marginTop:8}}>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <thead><tr style={{textAlign:"left", opacity:.8}}>
                <th style={th}>Jobb</th><th style={th}>Intervall (ms)</th><th style={th}>Senast</th><th style={th}>Fel</th>
              </tr></thead>
              <tbody>
                {jobs.map((j,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid var(--ring)"}}>
                    <td style={td}>{j.name}</td>
                    <td style={td}>{j.intervalMs}</td>
                    <td style={td}>{j.lastRun ? new Date(j.lastRun).toLocaleString() : "–"}</td>
                    <td style={td}>{j.error ? <span style={{color:"#e86"}}>{j.error}</span> : "–"}</td>
                  </tr>
                ))}
                {!jobs.length && <tr><td colSpan="4" style={td}>Inga jobb ännu.</td></tr>}
              </tbody>
            </table>
          </div>
        </div></article>

        <article className="card"><div className="card-pad">
          <div className="h3">Snabbgenvägar</div>
          <div className="row" style={{gap:8, marginTop:8}}>
            <a className="btn" href="/admin/payouts">Öppna Payouts</a>
            <a className="btn" href="/admin/ingest">Öppna Ingest</a>
            <a className="btn" href="/admin/settings">Öppna Settings</a>
            <a className="btn btn-acc" href={import.meta.env.VITE_STORE_ADMIN_URL || "http://localhost:5175/admin"}>Store Admin</a>
          </div>
        </div></article>
      </div>
    </AdminShell>
  );
}
const th = { padding:"8px 6px", borderBottom:"1px solid var(--ring)" };
const td = { padding:"8px 6px" };
