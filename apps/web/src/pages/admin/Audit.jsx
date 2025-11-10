// apps/web/src/pages/admin/Audit.jsx
import React, { useEffect, useState } from "react";
import AdminShell from "../../components/admin/AdminShell";
import { CCoreSDK } from "../../core/ccore";

export default function Audit() {
  const [logs, setLogs] = useState(CCoreSDK.System.getAudit());

  useEffect(() => {
    const onNew = () => setLogs(CCoreSDK.System.getAudit());
    const off1 = CCoreSDK.events.on("system.audit.new", onNew);
    const off2 = CCoreSDK.events.on("system.audit.cleared", onNew);
    return () => { off1(); off2(); };
  }, []);

  const clear = () => {
    if (confirm("Rensa audit-logg?")) CCoreSDK.System.clearAudit();
  };

  return (
    <AdminShell title="Audit-logg" minRole="manager">
      <div className="row">
        <button className="btn warn" onClick={clear}>Rensa logg</button>
      </div>

      <table className="tbl">
        <thead><tr><th>Tid</th><th>Händelse</th><th>Data</th><th>ID</th></tr></thead>
        <tbody>
          {logs.length===0 && <tr><td colSpan="4" style={{opacity:.8}}>Ingen logg än.</td></tr>}
          {logs.slice().reverse().map(x => (
            <tr key={x.id}>
              <td>{new Date(x.at).toLocaleString("sv-SE",{ dateStyle:"medium", timeStyle:"medium" })}</td>
              <td><code>{x.action}</code></td>
              <td><pre style={{margin:0,whiteSpace:"pre-wrap"}}>{JSON.stringify(x.meta,null,2)}</pre></td>
              <td className="mono">{x.id}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        .row { display:flex; justify-content:flex-end; margin-bottom:8px; }
        .btn { padding:8px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; cursor:pointer; }
        .btn.warn { background:#5a2330; border-color:#8a2b3f; }
        .tbl { width:100%; border-collapse: collapse; }
        .tbl th, .tbl td { border:1px solid #2b315e; padding:8px; text-align:left; vertical-align:top; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      `}</style>
    </AdminShell>
  );
}
