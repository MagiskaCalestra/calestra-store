// D:\WebProjects\Calestra\apps\admin\src\pages\Reports.jsx
import React from "react";

async function fetchOrders() {
  const res = await fetch("/svc/orders/api/orders", { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch orders");
  const data = await res.json();
  return Array.isArray(data?.orders) ? data.orders : [];
}

function moneySEK(n) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(x);
}

export default function Reports() {
  const [state, setState] = React.useState({ loading: true, err: "", orders: [] });

  async function load() {
    setState({ loading: true, err: "", orders: [] });
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

  const byDay = React.useMemo(() => {
    const map = new Map();
    for (const o of state.orders || []) {
      const day = String(o.createdAt || "").slice(0, 10) || "unknown";
      const total = Number(o.totalSEK ?? o.totalsSEK?.grand ?? 0);
      const mode = String(o.mode || "").toLowerCase();
      const cur = map.get(day) || { day, count: 0, total: 0, live: 0, preview: 0 };
      cur.count += 1;
      cur.total += total;
      if (mode === "live") cur.live += 1;
      if (mode === "preview") cur.preview += 1;
      map.set(day, cur);
    }
    return Array.from(map.values()).sort((a, b) => String(b.day).localeCompare(String(a.day)));
  }, [state.orders]);

  const topItems = React.useMemo(() => {
    const freq = new Map();
    for (const o of state.orders || []) {
      const items = o.raw?.items;
      if (!Array.isArray(items)) continue;
      for (const it of items) {
        const title = it?.title || it?.product?.title || "Unknown";
        const qty = Math.max(1, Number(it?.qty || 1));
        freq.set(title, (freq.get(title) || 0) + qty);
      }
    }
    return Array.from(freq.entries())
      .map(([title, qty]) => ({ title, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [state.orders]);

  const totals = React.useMemo(() => {
    const sum = (state.orders || []).reduce((a, o) => a + Number(o.totalSEK ?? o.totalsSEK?.grand ?? 0), 0);
    return { count: (state.orders || []).length, sum };
  }, [state.orders]);

  return (
    <div>
      <div className="grid3">
        <div className="card" style={{ minHeight: 0 }}>
          <div className="kpi">
            <div className="kpiNum">{state.loading ? "…" : totals.count}</div>
            <div className="kpiLabel">Total orders</div>
          </div>
        </div>

        <div className="card" style={{ minHeight: 0 }}>
          <div className="kpi">
            <div className="kpiNum">{state.loading ? "…" : moneySEK(totals.sum)}</div>
            <div className="kpiLabel">Omsättning (SEK)</div>
          </div>
        </div>

        <div className="card" style={{ minHeight: 0 }}>
          <div className="kpi">
            <div className="kpiNum">✓</div>
            <div className="kpiLabel">Store → Orders-service → Admin</div>
          </div>
        </div>
      </div>

      <div className="hr" />

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <div className="cardTitle">Daglig trend</div>
            <div className="cardBody">Enkel rapport för testlansering: antal, total, live/preview per dag.</div>
          </div>

          <button className="btn" onClick={load} disabled={state.loading}>
            Refresh
          </button>
        </div>

        {state.err ? (
          <div style={{ marginTop: 10, color: "rgba(248,113,113,.92)", fontWeight: 900 }}>
            Fel: {state.err}
          </div>
        ) : null}

        <div className="hr" />

        <div className="tableWrap">
          <table style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Orders</th>
                <th>Omsättning</th>
                <th>Live</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {byDay.map((d) => (
                <tr key={d.day}>
                  <td className="mono">{d.day}</td>
                  <td className="mono">{d.count}</td>
                  <td>{moneySEK(d.total)}</td>
                  <td className="mono">{d.live}</td>
                  <td className="mono">{d.preview}</td>
                </tr>
              ))}
              {byDay.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "rgba(255,255,255,.62)" }}>
                    Ingen data ännu.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="hr" />

      <div className="card">
        <div className="cardTitle">Top items</div>
        <div className="cardBody">Snabb check: vilka produkter som testas mest.</div>

        <div className="hr" />

        <div className="tableWrap">
          <table style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((x) => (
                <tr key={x.title}>
                  <td>{x.title}</td>
                  <td className="mono">{x.qty}</td>
                </tr>
              ))}
              {topItems.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ color: "rgba(255,255,255,.62)" }}>
                    Inga items ännu.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
