// D:\WebProjects\Calestra\apps\admin\src\pages\Settings.jsx
import React from "react";

async function fetchHealth() {
  const res = await fetch("/svc/orders/health", { headers: { accept: "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Health check failed");
  return data;
}

export default function Settings() {
  const [health, setHealth] = React.useState(null);
  const [err, setErr] = React.useState("");

  async function ping() {
    setErr("");
    try {
      const h = await fetchHealth();
      setHealth(h);
    } catch (e) {
      setErr(String(e?.message || e));
      setHealth(null);
    }
  }

  React.useEffect(() => {
    ping();
  }, []);

  return (
    <div className="grid2">
      <div className="card">
        <div className="cardTitle">System status</div>
        <div className="cardBody">
          Admin kör via Vite proxy: <b>/svc/orders → http://127.0.0.1:14202</b>
        </div>

        <div className="hr" />

        <button className="btn btnAccent" onClick={ping}>
          Ping orders-service
        </button>

        <div className="hr" />

        {err ? (
          <div style={{ color: "rgba(248,113,113,.92)", fontWeight: 900 }}>Fel: {err}</div>
        ) : null}

        {health ? (
          <div className="cardBody">
            <div><b>ok:</b> {String(health.ok)}</div>
            <div><b>count:</b> {health.count}</div>
            <div><b>file:</b> <span className="mono">{health.file}</span></div>
          </div>
        ) : (
          <div className="cardBody" style={{ color: "rgba(255,255,255,.62)" }}>
            Ingen health-data ännu.
          </div>
        )}
      </div>

      <div className="card">
        <div className="cardTitle">Quick links</div>
        <div className="cardBody">Öppna API:er direkt i browsern när du felsöker.</div>

        <div className="hr" />

        <div className="row" style={{ flexWrap: "wrap" }}>
          <a className="btn" href="/svc/orders/health" target="_blank" rel="noreferrer">/svc/orders/health</a>
          <a className="btn" href="/svc/orders/api/orders" target="_blank" rel="noreferrer">/svc/orders/api/orders</a>
        </div>

        <div className="hr" />

        <div className="cardBody" style={{ color: "rgba(255,255,255,.70)" }}>
          Unlock code i login: <b>1</b> eller <b>calestra</b> (tillfälligt).
        </div>
      </div>
    </div>
  );
}
