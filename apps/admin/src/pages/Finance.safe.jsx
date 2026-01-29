// D:\WebProjects\Calestra\apps\admin\src\pages\Finance.jsx
import React from "react";
import { getFinanceSummary, getFinanceConfig, formatSek, pct } from "../core/finance/financeClient.js";

function pillClass(status) {
  return status === "up"
    ? "admin-pill-green"
    : status === "down"
    ? "admin-pill-red"
    : "admin-pill-soft";
}

export default function Finance() {
  const [mode, setMode] = React.useState("test");

  const [cfg, setCfg] = React.useState(null);
  const [day, setDay] = React.useState(null);
  const [d7, setD7] = React.useState(null);

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  async function load(nextMode = mode) {
    setLoading(true);
    setErr("");
    try {
      const [c, a, b] = await Promise.all([
        getFinanceConfig(),
        getFinanceSummary({ mode: nextMode, range: "day" }),
        getFinanceSummary({ mode: nextMode, range: "7d" }),
      ]);
      setCfg(c || null);
      setDay(a || null);
      setD7(b || null);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  // ✅ VIKTIGT: useEffect får bara returnera en cleanup-funktion (eller inget).
  React.useEffect(() => {
    let alive = true;
    (async () => {
      await load(mode);
    })();
    return () => {
      alive = false;
      void alive; // (tyst – bara för att undvika lint gnäll i vissa setup)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const status = err ? "down" : loading ? "unknown" : "up";

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2>Finance</h2>
          <p>Admin-view kopplad till <b>finance-service</b>. (Mode: test/live)</p>
        </div>

        <div className="admin-section-tag">
          <span className="admin-section-tag-dot" />
          <span>Finance</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span className={pillClass(status)}>{status === "up" ? "UP" : status === "down" ? "DOWN" : "…"}</span>

        <button
          type="button"
          className="admin-btn-soft"
          onClick={() => setMode("test")}
          disabled={mode === "test"}
        >
          Test
        </button>
        <button
          type="button"
          className="admin-btn-soft"
          onClick={() => setMode("live")}
          disabled={mode === "live"}
        >
          Live
        </button>

        <div style={{ flex: "1 1 auto" }} />

        <button type="button" className="admin-logout" onClick={() => load(mode)} disabled={loading}>
          Refresh
        </button>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ border: "1px solid rgba(255,255,255,.10)", background: "rgba(0,0,0,.12)", borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Config</div>
          {cfg ? (
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(cfg, null, 2)}
            </div>
          ) : (
            <div style={{ opacity: 0.8 }}>{loading ? "Laddar…" : "—"}</div>
          )}
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,.10)", background: "rgba(0,0,0,.12)", borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Status / Error</div>
          {err ? (
            <div style={{ color: "#fecaca", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
              {err}
            </div>
          ) : (
            <div style={{ opacity: 0.85 }}>{loading ? "Laddar…" : "OK"}</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ border: "1px solid rgba(255,255,255,.10)", background: "rgba(0,0,0,.12)", borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Today</div>
          <KPIBlock data={day} loading={loading} />
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,.10)", background: "rgba(0,0,0,.12)", borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>7 days</div>
          <KPIBlock data={d7} loading={loading} />
        </div>
      </div>

      <style>{`
        .admin-btn-soft{
          height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.06);
          color: #e6e7ea;
          font-weight: 900;
          cursor: pointer;
        }
        .admin-btn-soft:disabled{ opacity:.55; cursor:not-allowed; }
      `}</style>
    </div>
  );
}

function KPIBlock({ data, loading }) {
  if (loading) return <div style={{ opacity: 0.8 }}>Laddar…</div>;
  if (!data) return <div style={{ opacity: 0.8 }}>—</div>;

  // Vi försöker vara toleranta mot olika payloads.
  const gross = data.grossSEK ?? data.gross ?? data.revenueSEK ?? 0;
  const net = data.netSEK ?? data.net ?? data.profitSEK ?? 0;
  const orders = data.ordersCount ?? data.orders ?? data.count ?? 0;
  const margin = data.marginPct ?? (gross ? net / gross : 0);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Row label="Gross" value={formatSek(gross)} />
      <Row label="Net" value={formatSek(net)} />
      <Row label="Orders" value={String(orders)} />
      <Row label="Margin" value={pct(margin)} />
      <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", whiteSpace: "pre-wrap" }}>
        {JSON.stringify(data, null, 2)}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ opacity: 0.85 }}>{label}</div>
      <div style={{ fontWeight: 900 }}>{value}</div>
    </div>
  );
}
