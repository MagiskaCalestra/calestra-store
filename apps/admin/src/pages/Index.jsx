// D:\WebProjects\Calestra\apps\admin\src\pages\Index.jsx
import React from "react";
import { Link } from "react-router-dom";
import { getOrdersBase } from "../config/orders.js";

async function fetchOrders() {
  const base = getOrdersBase(); // "" i prod/local (relative)
  const res = await fetch(`${base}/svc/orders/api/orders`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  const data = await res.json();
  const arr = Array.isArray(data?.orders) ? data.orders : [];
  return arr;
}

function moneySEK(n) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(x);
}

function fmtTime(iso) {
  const s = String(iso || "");
  if (!s) return "—";
  return s.replace("T", " ").slice(0, 19);
}

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function pillStyle(kind) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: ".2px",
    gap: 8,
  };

  if (kind === "ok")
    return {
      ...base,
      borderColor: "rgba(34,197,94,.35)",
      background: "rgba(34,197,94,.12)",
    };
  if (kind === "warn")
    return {
      ...base,
      borderColor: "rgba(250,204,21,.35)",
      background: "rgba(250,204,21,.10)",
    };
  if (kind === "bad")
    return {
      ...base,
      borderColor: "rgba(248,113,113,.35)",
      background: "rgba(248,113,113,.12)",
    };
  return base;
}

function dotStyle(kind) {
  const base = {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,.55)",
    boxShadow: "0 0 12px rgba(255,255,255,.15)",
  };
  if (kind === "ok")
    return { ...base, background: "rgba(34,197,94,.95)", boxShadow: "0 0 12px rgba(34,197,94,.25)" };
  if (kind === "warn")
    return { ...base, background: "rgba(250,204,21,.95)", boxShadow: "0 0 12px rgba(250,204,21,.25)" };
  if (kind === "bad")
    return { ...base, background: "rgba(248,113,113,.95)", boxShadow: "0 0 12px rgba(248,113,113,.25)" };
  return base;
}

/** Liten “Admin Lite”-översikt: read-only, snabb, noll risk */
function AdminLiteOverview({ loading, err, orders, onRefresh }) {
  const latest = React.useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const sorted = [...list].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return sorted[0] || null;
  }, [orders]);

  const last5 = React.useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const sorted = [...list].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return sorted.slice(0, 5);
  }, [orders]);

  const kpi = React.useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const total = list.reduce((a, o) => a + safeNum(o.totalSEK ?? o.totalsSEK?.grand ?? 0), 0);
    const live = list.filter((o) => String(o.mode || "").toLowerCase() === "live").length;
    const preview = list.filter((o) => String(o.mode || "").toLowerCase() === "preview").length;
    return { count: list.length, total, live, preview };
  }, [orders]);

  const healthPill = React.useMemo(() => {
    if (loading) return { kind: "soft", text: "Laddar…" };
    if (err) return { kind: "bad", text: "Orders: FAIL" };
    return { kind: "ok", text: "Orders: OK" };
  }, [loading, err]);

  function open(url) {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {}
  }

  function copy(text) {
    try {
      navigator.clipboard.writeText(String(text));
    } catch {}
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="cardTitle" style={{ marginBottom: 6 }}>
            Admin Overview (snabb)
          </div>
          <div className="cardBody" style={{ color: "rgba(255,255,255,.68)" }}>
            Read-only status för testlansering. Inga writes här — Orders/Reports är säkra.
          </div>
        </div>

        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <span style={pillStyle(healthPill.kind)}>
            <span style={dotStyle(healthPill.kind)} />
            {healthPill.text}
          </span>

          <span style={pillStyle("soft")}>{loading ? "—" : `${kpi.count} orders`}</span>
          <span style={pillStyle("soft")}>{loading ? "—" : moneySEK(kpi.total)}</span>

          <span style={pillStyle("ok")}>{loading ? "Live —" : `Live ${kpi.live}`}</span>
          <span style={pillStyle("warn")}>{loading ? "Preview —" : `Preview ${kpi.preview}`}</span>

          <button className="btn" onClick={onRefresh} disabled={loading}>
            {loading ? "…" : "Refresh"}
          </button>
        </div>
      </div>

      {err ? (
        <div style={{ marginTop: 10, color: "rgba(248,113,113,.92)", fontWeight: 950 }}>
          Fel: {String(err)}
        </div>
      ) : null}

      <div className="hr" />

      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card" style={{ boxShadow: "none" }}>
          <div className="cardTitle">Senaste order</div>
          {latest ? (
            <div className="cardBody" style={{ lineHeight: 1.65 }}>
              <div>
                <b>ID:</b> <span className="mono">{latest.id}</span>
              </div>
              <div>
                <b>Tid:</b> <span className="mono">{fmtTime(latest.createdAt)}</span>
              </div>
              <div>
                <b>Email:</b> {latest.email || latest.raw?.customer?.email || "—"}
              </div>
              <div>
                <b>Mode:</b>{" "}
                <span style={pillStyle(String(latest.mode || "").toLowerCase() === "live" ? "ok" : "warn")}>
                  {String(latest.mode || "—")}
                </span>
              </div>
              <div>
                <b>Total:</b> {moneySEK(latest.totalSEK ?? latest.totalsSEK?.grand ?? 0)}
              </div>
            </div>
          ) : (
            <div className="cardBody" style={{ color: "rgba(255,255,255,.62)" }}>
              Inga orders ännu.
            </div>
          )}

          <div className="hr" />

          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn" onClick={() => open("/svc/orders/api/orders")}>
              Open API
            </button>
            <button className="btn" onClick={() => open("/svc/orders/health")}>
              Open /health
            </button>
            <button
              className="btn"
              onClick={() => copy(JSON.stringify({ latest, kpi }, null, 2))}
              disabled={!latest}
              title="Kopierar senaste order + KPI"
            >
              Copy JSON
            </button>
          </div>
        </div>

        <div className="card" style={{ boxShadow: "none" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div className="cardTitle">Senaste 5</div>
              <div className="cardBody" style={{ color: "rgba(255,255,255,.68)" }}>
                Snabb kontroll att orderflödet tickar.
              </div>
            </div>

            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <Link className="btn btnAccent" to="/orders">
                Öppna Orders
              </Link>
              <Link className="btn" to="/system">
                Öppna System
              </Link>
            </div>
          </div>

          <div className="hr" />

          <div className="tableWrap">
            <table style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Mode</th>
                  <th>Total (SEK)</th>
                </tr>
              </thead>
              <tbody>
                {last5.map((o) => {
                  const mode = String(o.mode || "").toLowerCase();
                  return (
                    <tr key={o.id}>
                      <td className="mono">{fmtTime(o.createdAt)}</td>
                      <td className="mono">{o.id}</td>
                      <td>{o.email || o.raw?.customer?.email || "—"}</td>
                      <td>
                        <span style={pillStyle(mode === "live" ? "ok" : "warn")}>{mode || "—"}</span>
                      </td>
                      <td>{moneySEK(o.totalSEK ?? o.totalsSEK?.grand ?? 0)}</td>
                    </tr>
                  );
                })}

                {!loading && last5.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ color: "rgba(255,255,255,.62)" }}>
                      Inga orders än. Lägg en testorder i Store → den dyker upp här.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="hr" />

          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn" onClick={() => open("/svc/finance/health")}>
              Finance /health
            </button>
            <button className="btn" onClick={() => open("/svc/analytics/health")}>
              Analytics /health
            </button>
            <button className="btn" onClick={() => open("/svc/status/health")}>
              Status /health
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
      `}</style>
    </div>
  );
}

export default function Index() {
  const [state, setState] = React.useState({ loading: true, err: "", orders: [] });

  async function load() {
    setState((s) => ({ ...s, loading: true, err: "" }));
    try {
      const orders = await fetchOrders();
      setState({ loading: false, err: "", orders });
    } catch (e) {
      setState({ loading: false, err: String(e?.message || e), orders: [] });
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const kpi = React.useMemo(() => {
    const orders = state.orders || [];
    const total = orders.reduce((a, o) => a + Number(o.totalSEK ?? o.totalsSEK?.grand ?? 0), 0);
    const live = orders.filter((o) => String(o.mode || "").toLowerCase().includes("live")).length;
    const preview = orders.filter((o) => String(o.mode || "").toLowerCase().includes("preview")).length;
    return { count: orders.length, total, live, preview };
  }, [state.orders]);

  return (
    <div>
      {/* Admin Lite fusion: snabb, read-only overview först */}
      <AdminLiteOverview loading={state.loading} err={state.err} orders={state.orders} onRefresh={load} />

      <div className="grid3">
        <div className="card" style={{ minHeight: 0 }}>
          <div className="kpi">
            <div className="kpiNum">{state.loading ? "…" : kpi.count}</div>
            <div className="kpiLabel">Orders (server)</div>
          </div>
        </div>

        <div className="card" style={{ minHeight: 0 }}>
          <div className="kpi">
            <div className="kpiNum">{state.loading ? "…" : moneySEK(kpi.total)}</div>
            <div className="kpiLabel">Omsättning (SEK)</div>
          </div>
        </div>

        <div className="card" style={{ minHeight: 0 }}>
          <div className="kpi">
            <div className="kpiNum">
              <span style={{ color: "rgba(34,197,94,.92)" }}>{state.loading ? "…" : kpi.live}</span>
              <span style={{ opacity: 0.45 }}> / </span>
              <span style={{ color: "rgba(250,204,21,.92)" }}>{state.loading ? "…" : kpi.preview}</span>
            </div>
            <div className="kpiLabel">Live / Preview</div>
          </div>
        </div>
      </div>

      <div className="hr" />

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="cardTitle">Testlansering – status</div>
            <div className="cardBody">
              Store pushar automatiskt till orders-service vid checkout. Admin läser direkt från server.
              <br />
              {state.err ? (
                <span style={{ color: "rgba(248,113,113,.92)", fontWeight: 900 }}>Fel: {state.err}</span>
              ) : (
                <span style={{ color: "rgba(226,232,240,.65)" }}>
                  Källa: <b>/svc/orders/api/orders</b>
                </span>
              )}
            </div>
          </div>

          <div className="row">
            <button className="btn" onClick={load}>
              Refresh
            </button>
            <Link className="btn btnAccent" to="/orders">
              Öppna Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
