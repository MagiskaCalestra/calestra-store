import React from "react";
import { Link } from "react-router-dom";

async function fetchOrders() {
  const res = await fetch("/svc/orders/api/orders", { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch /svc/orders/api/orders");
  const data = await res.json();
  return Array.isArray(data?.orders) ? data.orders : [];
}

async function fetchHealth() {
  const res = await fetch("/svc/orders/health", { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch /svc/orders/health");
  return await res.json();
}

function moneySEK(n) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(x);
}

function toDayKey(iso) {
  const t = Date.parse(iso || "");
  if (!t) return null;
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Dashboard() {
  const [state, setState] = React.useState({
    loading: true,
    err: "",
    orders: [],
    health: null,
  });

  async function load() {
    setState((s) => ({ ...s, loading: true, err: "" }));
    try {
      const [orders, health] = await Promise.all([fetchOrders(), fetchHealth()]);
      setState({ loading: false, err: "", orders, health });
    } catch (e) {
      setState({ loading: false, err: String(e?.message || e), orders: [], health: null });
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

    const todayKey = toDayKey(new Date().toISOString());
    const todayOrders = orders.filter((o) => toDayKey(o.createdAt) === todayKey);
    const todayTotal = todayOrders.reduce((a, o) => a + Number(o.totalSEK ?? 0), 0);

    return { count: orders.length, total, live, preview, todayCount: todayOrders.length, todayTotal };
  }, [state.orders]);

  return (
    <div>
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

      <div className="grid2">
        <div className="card">
          <div className="cardTitle">Testlansering – status</div>
          <div className="cardBody">
            Store pushar automatiskt till <b>orders-service</b> vid checkout. Admin läser direkt från server.
            <br />
            {state.err ? (
              <span style={{ color: "rgba(248,113,113,.92)", fontWeight: 900 }}>Fel: {state.err}</span>
            ) : (
              <span style={{ color: "rgba(226,232,240,.65)" }}>
                Källa: <b>/svc/orders/api/orders</b> • Health:{" "}
                <b>{state.health?.ok ? "OK" : "—"}</b> • Count: <b>{state.health?.count ?? "—"}</b>
              </span>
            )}
          </div>

          <div className="hr" />

          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row">
              <button className="btn" onClick={load}>
                Refresh
              </button>
              <Link className="btn btnAccent" to="/orders">
                Öppna Orders
              </Link>
            </div>

            <div className="row" style={{ opacity: 0.85 }}>
              <a className="btn" href="http://localhost:5175" target="_blank" rel="noreferrer">
                Open Store
              </a>
              <a className="btn" href="http://localhost:5288" target="_blank" rel="noreferrer">
                Open Web
              </a>
              <a className="btn" href="/svc/orders/health" target="_blank" rel="noreferrer">
                Orders health
              </a>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Today</div>
          <div className="cardBody">Snabb koll för din fru (och för dig): vad som hände idag.</div>

          <div className="hr" />

          <div className="grid3">
            <div className="card" style={{ minHeight: 0 }}>
              <div className="kpi">
                <div className="kpiNum">{state.loading ? "…" : kpi.todayCount}</div>
                <div className="kpiLabel">Orders idag</div>
              </div>
            </div>
            <div className="card" style={{ minHeight: 0 }}>
              <div className="kpi">
                <div className="kpiNum">{state.loading ? "…" : moneySEK(kpi.todayTotal)}</div>
                <div className="kpiLabel">SEK idag</div>
              </div>
            </div>
            <div className="card" style={{ minHeight: 0 }}>
              <div className="kpi">
                <div className="kpiNum">{state.loading ? "…" : (state.health?.file ? "OK" : "—")}</div>
                <div className="kpiLabel">Loggfil (server)</div>
              </div>
            </div>
          </div>

          {state.health?.file ? (
            <div className="cardBody" style={{ marginTop: 10, opacity: 0.85 }}>
              <span style={{ color: "rgba(226,232,240,.55)" }}>Datafil:</span>
              <div className="mono" style={{ marginTop: 6 }}>
                {state.health.file}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
