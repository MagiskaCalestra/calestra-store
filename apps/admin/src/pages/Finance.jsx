// D:\WebProjects\Calestra\apps\admin\src\pages\Finance.jsx
import React from "react";
import {
  getFinanceHealth,
  getFinanceConfig,
  getFinanceSummary,
  formatSEK,
} from "../core/finance/financeClient.js";

function box() {
  return {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.12)",
    padding: 14,
  };
}

function mono() {
  return {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 12,
    whiteSpace: "pre-wrap",
  };
}

function pillStyle(kind) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
    fontWeight: 900,
    fontSize: 12,
    color: "rgba(255,255,255,.90)",
  };

  if (kind === "up") return { ...base, borderColor: "rgba(34,197,94,.35)", background: "rgba(34,197,94,.12)" };
  if (kind === "down") return { ...base, borderColor: "rgba(248,113,113,.35)", background: "rgba(248,113,113,.12)" };
  if (kind === "na") return { ...base, borderColor: "rgba(250,204,21,.35)", background: "rgba(250,204,21,.10)" };

  return base;
}

function classifyErr(errMsg) {
  const s = String(errMsg || "");
  // “Cannot GET ...” eller 404/405 => endpoint saknas => N/A (SKIP i test)
  if (s.includes("404") || s.includes("405") || s.toLowerCase().includes("cannot get")) return "na";
  // nät/cors/timeout => N/A under test (ska inte blocka admin)
  if (s.toLowerCase().includes("failed to fetch") || s.toLowerCase().includes("timeout") || s.includes("URL: /svc/finance")) return "na";
  return "down";
}

function pickNumber(obj, keys, fallback = 0) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return Number(v || 0);
  }
  return fallback;
}

function KPI({ label, value, hint }) {
  return (
    <div style={box()}>
      <div style={{ opacity: 0.75, fontWeight: 900, fontSize: 12 }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 950, fontSize: 20 }}>{value}</div>
      {hint ? <div style={{ marginTop: 6, opacity: 0.68, fontSize: 12 }}>{hint}</div> : null}
    </div>
  );
}

export default function Finance() {
  const [mode, setMode] = React.useState("test"); // test | live
  const [loading, setLoading] = React.useState(false);

  const [health, setHealth] = React.useState(null);
  const [cfg, setCfg] = React.useState(null);
  const [day, setDay] = React.useState(null);
  const [d7, setD7] = React.useState(null);

  const [err, setErr] = React.useState("");

  async function refresh() {
    setLoading(true);
    setErr("");

    try {
      // 1) Health (via proxy)
      const h = await getFinanceHealth();
      setHealth(h || null);

      // 2) Config (optional endpoint, fallbackar alltid)
      const c = await getFinanceConfig();
      setCfg(c || null);

      // 3) Summary (kan saknas -> vi visar N/A, inte crash)
      try {
        const a = await getFinanceSummary({ mode, range: "day" });
        setDay(a || null);
      } catch (e) {
        setDay(null);
        // behåll err men blockera inte hela sidan om summary saknas
        const msg = String(e?.message || e);
        setErr((prev) => (prev ? prev + "\n\n" + msg : msg));
      }

      try {
        const b = await getFinanceSummary({ mode, range: "7d" });
        setD7(b || null);
      } catch (e) {
        setD7(null);
        const msg = String(e?.message || e);
        setErr((prev) => (prev ? prev + "\n\n" + msg : msg));
      }
    } catch (e) {
      const msg = String(e?.message || e);
      setErr(msg);
      setHealth(null);
      setCfg(null);
      setDay(null);
      setD7(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const status = React.useMemo(() => {
    if (!err) return "up";
    return classifyErr(err);
  }, [err]);

  const dayGross = pickNumber(day, ["grossSEK", "gross", "revenueSEK", "revenue"]);
  const dayNet = pickNumber(day, ["netSEK", "net", "profitSEK", "profit"]);
  const dayOrders = pickNumber(day, ["ordersCount", "orders", "count"]);

  const d7Gross = pickNumber(d7, ["grossSEK", "gross", "revenueSEK", "revenue"]);
  const d7Net = pickNumber(d7, ["netSEK", "net", "profitSEK", "profit"]);
  const d7Orders = pickNumber(d7, ["ordersCount", "orders", "count"]);

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-end" }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 22, color: "rgba(255,255,255,0.92)" }}>Finance</div>
          <div style={{ opacity: 0.72, marginTop: 6 }}>
            Proxy-first mot <b>services/finance-service</b> via <span style={{ ...mono(), display: "inline" }}>/svc/finance</span>
          </div>
          <div style={{ opacity: 0.6, marginTop: 4, fontSize: 12 }}>
            Mode: <b>{mode}</b> • Health:{" "}
            <span style={pillStyle(status === "up" ? "up" : status === "na" ? "na" : "down")}>
              {status === "up" ? "UP" : status === "na" ? "N/A" : "DOWN"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn"
            onClick={() => setMode("test")}
            disabled={mode === "test"}
            style={{ height: 36 }}
          >
            Test
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setMode("live")}
            disabled={mode === "live"}
            style={{ height: 36 }}
          >
            Live
          </button>

          <button type="button" className="btn btnAccent" onClick={refresh} disabled={loading} style={{ height: 36 }}>
            {loading ? "…" : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <KPI label="Today • Gross" value={day ? formatSEK(dayGross) : "—"} hint="(summary endpoint kan vara N/A under test)" />
        <KPI label="Today • Net" value={day ? formatSEK(dayNet) : "—"} />
        <KPI label="Today • Orders" value={day ? String(dayOrders) : "—"} />
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <KPI label="7 days • Gross" value={d7 ? formatSEK(d7Gross) : "—"} />
        <KPI label="7 days • Net" value={d7 ? formatSEK(d7Net) : "—"} />
        <KPI label="7 days • Orders" value={d7 ? String(d7Orders) : "—"} />
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={box()}>
          <div style={{ fontWeight: 950, marginBottom: 8 }}>Health</div>
          <div style={{ ...mono(), opacity: 0.85 }}>
            {health ? JSON.stringify(health, null, 2) : "—"}
          </div>
          <div style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
            Endpoint: <span style={mono()}>/svc/finance/health</span>
          </div>
        </div>

        <div style={box()}>
          <div style={{ fontWeight: 950, marginBottom: 8 }}>Config</div>
          <div style={{ ...mono(), opacity: 0.85 }}>
            {cfg ? JSON.stringify(cfg, null, 2) : "—"}
          </div>
          <div style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
            Endpoint (om finns): <span style={mono()}>/svc/finance/api/finance/config</span>
          </div>
        </div>
      </div>

      {err ? (
        <div style={{ marginTop: 12, ...box(), borderColor: "rgba(250,204,21,.22)" }}>
          <div style={{ fontWeight: 950, marginBottom: 8 }}>Status / Error (tolerant)</div>
          <div style={{ ...mono(), color: "rgba(255,255,255,.88)" }}>{String(err)}</div>
          <div style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
            Under test är <b>N/A</b> OK för endpoints som inte finns ännu — Admin fortsätter fungera.
          </div>
        </div>
      ) : null}
    </div>
  );
}
