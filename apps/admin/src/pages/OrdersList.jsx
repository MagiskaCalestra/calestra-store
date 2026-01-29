// D:\WebProjects\Calestra\apps\admin\src\pages\OrdersList.jsx
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

function toCSV(rows) {
  const esc = (v) => `"${String(v ?? "").replaceAll(`"`, `""`)}"`;
  const header = ["createdAt", "id", "email", "mode", "totalSEK", "currency", "itemsCount"].map(esc).join(",");
  const lines = rows.map((o) => {
    const total = Number(o.totalSEK ?? o.totalsSEK?.grand ?? 0);
    const itemsCount = Array.isArray(o.raw?.items) ? o.raw.items.reduce((a, it) => a + Number(it?.qty || 1), 0) : "";
    return [
      o.createdAt || o.raw?.createdAt || "",
      o.id || "",
      o.email || o.raw?.customer?.email || "",
      o.mode || o.raw?.mode || "",
      total,
      o.currency || o.raw?.currency || "SEK",
      itemsCount,
    ].map(esc).join(",");
  });
  return [header, ...lines].join("\n");
}

function download(name, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function OrdersList() {
  const [state, setState] = React.useState({
    loading: true,
    err: "",
    orders: [],
    q: "",
    mode: "all",
    selected: null,
  });

  async function load() {
    setState((s) => ({ ...s, loading: true, err: "" }));
    try {
      const orders = await fetchOrders();
      setState((s) => ({ ...s, loading: false, err: "", orders }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, err: String(e?.message || e), orders: [] }));
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const filtered = React.useMemo(() => {
    const q = (state.q || "").trim().toLowerCase();
    const mode = state.mode;
    const list = Array.isArray(state.orders) ? state.orders : [];

    return list
      .filter((o) => {
        const m = String(o.mode || o.raw?.mode || "").toLowerCase();
        if (mode !== "all" && m !== mode) return false;

        if (!q) return true;
        const hay = [
          o.id,
          o.email,
          o.currency,
          o.mode,
          o.createdAt,
          o.raw?.customer?.name,
          o.raw?.customer?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [state.orders, state.q, state.mode]);

  const kpi = React.useMemo(() => {
    const total = filtered.reduce((a, o) => a + Number(o.totalSEK ?? o.totalsSEK?.grand ?? 0), 0);
    const live = filtered.filter((o) => String(o.mode || "").toLowerCase() === "live").length;
    const preview = filtered.filter((o) => String(o.mode || "").toLowerCase() === "preview").length;
    return { count: filtered.length, total, live, preview };
  }, [filtered]);

  return (
    <div>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <div style={{ minWidth: 260 }}>
              <div className="label">Sök</div>
              <input
                className="input"
                value={state.q}
                onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))}
                placeholder="id, e-post, mode…"
              />
            </div>

            <div style={{ width: 200 }}>
              <div className="label">Mode</div>
              <select
                className="select"
                value={state.mode}
                onChange={(e) => setState((s) => ({ ...s, mode: e.target.value }))}
              >
                <option value="all">All</option>
                <option value="preview">Preview</option>
                <option value="live">Live</option>
              </select>
            </div>

            <div className="row" style={{ alignItems: "flex-end" }}>
              <button className="btn" onClick={load} disabled={state.loading}>
                Refresh
              </button>
              <button
                className="btn btnAccent"
                onClick={() => download(`orders-${Date.now()}.csv`, toCSV(filtered), "text/csv")}
                disabled={filtered.length === 0}
              >
                Export CSV
              </button>
              <button
                className="btn"
                onClick={() => download(`orders-${Date.now()}.json`, JSON.stringify(filtered, null, 2), "application/json")}
                disabled={filtered.length === 0}
              >
                Export JSON
              </button>
              <a className="btn" href="/svc/orders/api/orders" target="_blank" rel="noreferrer">
                Open API
              </a>
            </div>
          </div>

          <div className="row" style={{ gap: 12 }}>
            <span className="badge">{kpi.count} orders</span>
            <span className="badge">{moneySEK(kpi.total)}</span>
            <span className="badge badgeLive">Live {kpi.live}</span>
            <span className="badge badgePreview">Preview {kpi.preview}</span>
          </div>
        </div>

        {state.err ? (
          <div style={{ marginTop: 10, color: "rgba(248,113,113,.92)", fontWeight: 900 }}>
            Fel: {state.err}
          </div>
        ) : null}
      </div>

      <div className="hr" />

      <div className="card">
        <div className="cardTitle">Orders</div>

        <div className="tableWrap" style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>ID</th>
                <th>Email</th>
                <th>Mode</th>
                <th>Total (SEK)</th>
                <th>Currency</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const mode = String(o.mode || "").toLowerCase();
                const total = Number(o.totalSEK ?? o.totalsSEK?.grand ?? 0);
                const itemsCount = Array.isArray(o.raw?.items)
                  ? o.raw.items.reduce((a, it) => a + Number(it?.qty || 1), 0)
                  : 0;

                return (
                  <tr
                    key={o.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setState((s) => ({ ...s, selected: o }))}
                    title="Klicka för att se detaljer"
                  >
                    <td className="mono">{String(o.createdAt || "").replace("T", " ").slice(0, 19)}</td>
                    <td className="mono">{o.id}</td>
                    <td>{o.email}</td>
                    <td>
                      <span className={`badge ${mode === "live" ? "badgeLive" : "badgePreview"}`}>
                        {mode || "?"}
                      </span>
                    </td>
                    <td>{moneySEK(total)}</td>
                    <td className="mono">{o.currency || "SEK"}</td>
                    <td className="mono">{itemsCount}</td>
                  </tr>
                );
              })}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: "rgba(255,255,255,.62)" }}>
                    Inga orders än. Lägg en testorder i Store → den dyker upp här.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {state.selected ? (
        <>
          <div className="hr" />
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <div className="cardTitle">Order details</div>
                <div className="cardBody">
                  <span className="mono">{state.selected.id}</span>
                </div>
              </div>

              <div className="row">
                <button
                  className="btn"
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(JSON.stringify(state.selected, null, 2));
                    } catch {}
                  }}
                >
                  Copy JSON
                </button>
                <button className="btn btnDanger" onClick={() => setState((s) => ({ ...s, selected: null }))}>
                  Close
                </button>
              </div>
            </div>

            <div className="hr" />

            <div className="grid2">
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardTitle">Summary</div>
                <div className="cardBody">
                  <div><b>Email:</b> {state.selected.email}</div>
                  <div><b>Mode:</b> {state.selected.mode}</div>
                  <div><b>Total:</b> {moneySEK(Number(state.selected.totalSEK ?? state.selected.totalsSEK?.grand ?? 0))}</div>
                  <div><b>Created:</b> <span className="mono">{state.selected.createdAt}</span></div>
                </div>
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardTitle">Raw</div>
                <textarea readOnly value={JSON.stringify(state.selected.raw || {}, null, 2)} />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
