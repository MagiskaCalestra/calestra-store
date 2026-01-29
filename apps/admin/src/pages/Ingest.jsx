// D:\WebProjects\Calestra\apps\admin\src\pages\Ingest.jsx
import React from "react";

async function ingestOne(obj) {
  const res = await fetch("/svc/orders/api/ingest", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(obj),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Ingest failed");
  return data;
}

export default function Ingest() {
  const [jsonText, setJsonText] = React.useState("");
  const [log, setLog] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function run() {
    setBusy(true);
    setLog("");
    try {
      const parsed = JSON.parse(jsonText || "{}");
      const list = Array.isArray(parsed) ? parsed : [parsed];

      let ok = 0;
      for (const item of list) {
        const r = await ingestOne(item);
        ok += 1;
        setLog((s) => s + `OK: ${r.id} (count=${r.count})\n`);
      }
      setLog((s) => s + `\nDone. Ingested ${ok} order(s).\n`);
    } catch (e) {
      setLog(`ERROR: ${String(e?.message || e)}\n`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="cardTitle">Manual ingest</div>
      <div className="cardBody">
        Klistra in ett order-objekt (eller en array av orders). Skickas till <b>/svc/orders/api/ingest</b>.
      </div>

      <div className="hr" />

      <div className="label">JSON</div>
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder='Ex: {"id":"CW-123","mode":"preview","createdAt":"...","totalsSEK":{"grand":999}}'
      />

      <div className="row" style={{ marginTop: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
        <button className="btn btnAccent" onClick={run} disabled={busy}>
          {busy ? "Ingest…" : "Ingest"}
        </button>

        <a className="btn" href="/svc/orders/health" target="_blank" rel="noreferrer">
          Open /health
        </a>
      </div>

      <div className="hr" />

      <div className="label">Log</div>
      <textarea readOnly value={log} style={{ minHeight: 180 }} />
    </div>
  );
}
