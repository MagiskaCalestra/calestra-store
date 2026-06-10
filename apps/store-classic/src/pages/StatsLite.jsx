import React from "react";

function parseJSON(text) {
  try { return JSON.parse(text); } catch { return { ok: false, error: text }; }
}

async function getJSON(url) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  const t = await r.text();
  const j = parseJSON(t);
  if (!r.ok && j && typeof j === "object") return { ...j, httpStatus: r.status };
  return j;
}

function metric(n) {
  const x = Number(n || 0);
  return Number.isFinite(x) ? x.toLocaleString("sv-SE") : "0";
}

export default function StatsLite() {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [data, setData] = React.useState(null);

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const res = await getJSON("/api/analytics/stats");
      if (res?.ok === false) setErr(res?.error || "ok=false");
      setData(res);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { refresh(); }, []);

  return (
    <div style={{ maxWidth: 980, margin: "28px auto", padding: "0 18px", color: "#0f172a" }}>
      <h1 style={{ margin: 0, fontSize: 34 }}>Calestra · Stats (lite)</h1>
      <div style={{ marginTop: 8, color: "#475569", fontWeight: 700 }}>
        Källa: <code>/api/analytics/stats</code>
        {data?.generatedAt ? <> · Senast: {String(data.generatedAt)}</> : null}
      </div>

      <button
        onClick={refresh}
        disabled={loading}
        style={{
          marginTop: 12,
          borderRadius: 12,
          padding: "10px 14px",
          border: "1px solid rgba(15,23,42,.14)",
          background: "#0b1220",
          color: "#fff",
          fontWeight: 900,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? .7 : 1
        }}
      >
        {loading ? "Uppdaterar…" : "Uppdatera"}
      </button>

      {err ? (
        <div style={{
          marginTop: 14,
          border: "1px solid rgba(244,63,94,.35)",
          background: "rgba(244,63,94,.08)",
          padding: "12px 14px",
          borderRadius: 14,
          color: "#9f1239",
          fontWeight: 900
        }}>
          {err}
        </div>
      ) : null}

      <div style={{
        marginTop: 14,
        background: "#fff",
        border: "1px solid rgba(15,23,42,.10)",
        borderRadius: 18,
        boxShadow: "0 18px 45px rgba(2,6,23,.08)",
        padding: 16,
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12
      }}>
        <div style={{ border: "1px solid rgba(15,23,42,.10)", borderRadius: 14, padding: 14 }}>
          <div style={{ color: "#334155", fontWeight: 900 }}>Total events</div>
          <div style={{ fontSize: 34, fontWeight: 1000 }}>{metric(data?.total)}</div>
        </div>

        <div style={{ border: "1px solid rgba(15,23,42,.10)", borderRadius: 14, padding: 14 }}>
          <div style={{ color: "#334155", fontWeight: 900 }}>Senaste 24h</div>
          <div style={{ fontSize: 34, fontWeight: 1000 }}>{metric(data?.last24h)}</div>
        </div>

        <div style={{ border: "1px solid rgba(15,23,42,.10)", borderRadius: 14, padding: 14 }}>
          <div style={{ color: "#334155", fontWeight: 900 }}>Senaste 7 dagar</div>
          <div style={{ fontSize: 34, fontWeight: 1000 }}>{metric(data?.last7d)}</div>
        </div>
      </div>
    </div>
  );
}
