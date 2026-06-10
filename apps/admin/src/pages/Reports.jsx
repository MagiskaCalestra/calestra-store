// D:\WebProjects\Calestra\apps\admin\src\pages\Reports.jsx
import React from "react";

const API_BASE = import.meta?.env?.VITE_PUBLIC_API_BASE || "https://magiskacalestra.se";
const ADMIN_TOKEN_KEY = "cw.admin.token";

const EMPTY_SIGNALS = {
  loading: true,
  err: "",
  range: "7d",
  totals: {
    events: 0,
    sessions: 0,
    productViews: 0,
    cartSignals: 0,
    checkoutSignals: 0,
    notifySignals: 0,
    preorderSignals: 0,
    soldOutViews: 0,
  },
  productSignals: [],
  funnel: {},
  timeseries: [],
  recent: [],
};

function getAdminToken() {
  try {
    return String(localStorage.getItem(ADMIN_TOKEN_KEY) || "").trim();
  } catch {
    return "";
  }
}

function getAdminHeaders(extraHeaders = {}) {
  const token = getAdminToken();

  const headers = {
    Accept: "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["x-admin-token"] = token;
    headers["X-Admin-Token"] = token;
  }

  return headers;
}

function moneySEK(n) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(x);
}

function intFmt(n) {
  return new Intl.NumberFormat("sv-SE", {
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function pct(part, whole) {
  const p = Number(part || 0);
  const w = Number(whole || 0);
  if (!w || w <= 0) return "0%";
  return `${Math.round((p / w) * 100)}%`;
}

async function readJsonSafe(res) {
  const text = await res.text().catch(() => "");
  if (!text) return { json: null, text: "" };
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

function normalizeOrder(rawOrder) {
  const raw = rawOrder?.raw || rawOrder?.raw_json_parsed || {};

  return {
    ...rawOrder,
    id:
      rawOrder?.id ||
      rawOrder?.order_id ||
      rawOrder?.orderId ||
      raw?.id ||
      raw?.orderId ||
      "",
    order_id:
      rawOrder?.order_id ||
      rawOrder?.orderId ||
      rawOrder?.id ||
      raw?.orderId ||
      raw?.id ||
      "",
    email:
      rawOrder?.email ||
      raw?.customer?.email ||
      raw?.email ||
      "",
    currency:
      rawOrder?.currency ||
      raw?.currency ||
      "SEK",
    total_sek:
      Number(
        rawOrder?.total_sek ??
          rawOrder?.totalSEK ??
          raw?.totalsSEK?.grand ??
          raw?.totalsSEK?.total ??
          0
      ) || 0,
    status: rawOrder?.status || "created",
    receipt_sent_at: rawOrder?.receipt_sent_at || "",
    created_at:
      rawOrder?.created_at ||
      rawOrder?.createdAt ||
      raw?.createdAt ||
      "",
    mode:
      raw?.mode ||
      rawOrder?.mode ||
      "preview",
    raw,
  };
}

async function fetchOrders() {
  const primaryUrl = new URL("/api/orders/list", API_BASE).toString();

  try {
    const res = await fetch(primaryUrl, {
      headers: getAdminHeaders(),
    });
    const { json, text } = await readJsonSafe(res);

    if (res.ok && json?.ok) {
      const items = Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.orders)
          ? json.orders
          : [];
      return items.map(normalizeOrder);
    }

    if (res.status !== 404) {
      throw new Error(json?.detail || json?.error || text || "Failed to fetch reports data");
    }
  } catch (e) {
    if (!String(e?.message || "").includes("Failed to fetch")) {
      throw e;
    }
  }

  const fallbackRes = await fetch("/svc/orders/api/orders", {
    headers: { Accept: "application/json" },
  });

  if (!fallbackRes.ok) {
    throw new Error("Failed to fetch reports data");
  }

  const fallbackJson = await fallbackRes.json();
  const items = Array.isArray(fallbackJson?.orders)
    ? fallbackJson.orders
    : Array.isArray(fallbackJson?.items)
      ? fallbackJson.items
      : [];

  return items.map(normalizeOrder);
}

async function fetchSignals(range = "7d") {
  const url = new URL("/api/admin/analytics-summary", API_BASE);
  url.searchParams.set("range", range);
  url.searchParams.set("limit", "40");
  url.searchParams.set("recent", "40");

  const res = await fetch(url.toString(), {
    headers: getAdminHeaders(),
    cache: "no-store",
  });

  const { json, text } = await readJsonSafe(res);

  if (!res.ok || json?.ok === false) {
    throw new Error(
      json?.message ||
        json?.detail ||
        json?.error ||
        text ||
        `Signals API failed (${res.status})`
    );
  }

  return {
    range: json?.range || range,
    totals: {
      events: Number(json?.totals?.events || 0),
      sessions: Number(json?.totals?.sessions || 0),
      productViews: Number(json?.totals?.productViews || 0),
      cartSignals: Number(json?.totals?.cartSignals || 0),
      checkoutSignals: Number(json?.totals?.checkoutSignals || 0),
      notifySignals: Number(json?.totals?.notifySignals || 0),
      preorderSignals: Number(json?.totals?.preorderSignals || 0),
      soldOutViews: Number(json?.totals?.soldOutViews || 0),
    },
    productSignals: Array.isArray(json?.productSignals) ? json.productSignals : [],
    funnel: json?.funnel && typeof json.funnel === "object" ? json.funnel : {},
    timeseries: Array.isArray(json?.timeseries) ? json.timeseries : [],
    recent: Array.isArray(json?.recent) ? json.recent : [],
  };
}

function getDayKey(v) {
  const s = String(v || "");
  if (!s) return "";
  return s.slice(0, 10);
}

function getItemRows(order) {
  const rawItems = Array.isArray(order?.raw?.items)
    ? order.raw.items
    : Array.isArray(order?.items)
      ? order.items
      : [];

  return rawItems.map((it) => {
    const qty = Math.max(1, Number(it?.qty || 1));
    const title =
      String(
        it?.title ||
          it?.name ||
          it?.product?.title ||
          it?.product?.name ||
          it?.id ||
          "Unknown item"
      ).trim() || "Unknown item";

    return { title, qty };
  });
}

function signalBadge(signal) {
  const s = String(signal || "").toLowerCase();

  if (s === "stark" || s === "strong") {
    return <span className="pill ok">Stark</span>;
  }

  if (s === "medel" || s === "medium") {
    return <span className="pill warn">Medel</span>;
  }

  return <span className="pill">Svag</span>;
}

function eventLabel(name) {
  const n = String(name || "");

  const labels = {
    page_view: "Sidvisning",
    shop_view: "Butik",
    product_view: "Produktvisning",
    product_card_click: "Produktkort",
    product_open: "Produkt öppnad",
    add_to_cart_click: "Köpknapp",
    add_to_cart: "Kundvagn",
    cart_open: "Korg öppnad",
    begin_checkout: "Checkout-start",
    checkout_start: "Checkout",
    checkout_form_touch: "Formulär",
    purchase_attempt: "Köpförsök",
    purchase_success: "Köp klart",
    purchase_fail: "Köp fel",
    notify_click: "Notify-klick",
    notify_submit: "Notify-submit",
    preorder_click: "Förköp",
    sold_out_view: "Slutsålt-visning",
    language_change: "Språk",
    currency_change: "Valuta",
    filter_change: "Filter",
    search: "Sök",
    cta_click: "CTA",
  };

  return labels[n] || n || "Signal";
}

function exportCsv(filename, rows) {
  const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function KpiCard({ value, label, sub }) {
  return (
    <div className="card" style={{ minHeight: 0 }}>
      <div className="kpi">
        <div className="kpiNum">{value}</div>
        <div className="kpiLabel">{label}</div>
        {sub ? <div className="cardBody" style={{ marginTop: 6 }}>{sub}</div> : null}
      </div>
    </div>
  );
}

export default function Reports() {
  const [state, setState] = React.useState({
    loading: true,
    err: "",
    orders: [],
  });

  const [signals, setSignals] = React.useState(EMPTY_SIGNALS);
  const [signalsRange, setSignalsRange] = React.useState("7d");

  async function loadOrders() {
    setState((s) => ({ ...s, loading: true, err: "" }));

    try {
      const orders = await fetchOrders();
      setState({
        loading: false,
        err: "",
        orders,
      });
    } catch (e) {
      setState({
        loading: false,
        err: String(e?.message || e),
        orders: [],
      });
    }
  }

  async function loadSignals(nextRange = signalsRange) {
    setSignals((s) => ({
      ...s,
      loading: true,
      err: "",
      range: nextRange,
    }));

    try {
      const data = await fetchSignals(nextRange);
      setSignals({
        loading: false,
        err: "",
        ...data,
      });
    } catch (e) {
      setSignals({
        ...EMPTY_SIGNALS,
        loading: false,
        range: nextRange,
        err: String(e?.message || e),
      });
    }
  }

  async function loadAll() {
    await Promise.allSettled([loadOrders(), loadSignals(signalsRange)]);
  }

  React.useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    loadSignals(signalsRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalsRange]);

  const summary = React.useMemo(() => {
    const orders = Array.isArray(state.orders) ? state.orders : [];
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + Number(o.total_sek || 0), 0);
    const live = orders.filter((o) => String(o.mode || "").toLowerCase() === "live").length;
    const preview = orders.filter((o) => String(o.mode || "").toLowerCase() === "preview").length;
    const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;

    return {
      totalOrders,
      revenue,
      live,
      preview,
      avgOrder,
    };
  }, [state.orders]);

  const dailyTrend = React.useMemo(() => {
    const map = new Map();

    for (const order of state.orders || []) {
      const day = getDayKey(order.created_at);
      if (!day) continue;

      const prev = map.get(day) || {
        day,
        orders: 0,
        revenue: 0,
        live: 0,
        preview: 0,
      };

      prev.orders += 1;
      prev.revenue += Number(order.total_sek || 0);

      const mode = String(order.mode || "").toLowerCase();
      if (mode === "live") prev.live += 1;
      else prev.preview += 1;

      map.set(day, prev);
    }

    return [...map.values()]
      .sort((a, b) => String(b.day).localeCompare(String(a.day)))
      .slice(0, 14);
  }, [state.orders]);

  const topItems = React.useMemo(() => {
    const itemMap = new Map();

    for (const order of state.orders || []) {
      const items = getItemRows(order);
      for (const item of items) {
        const key = item.title;
        const prev = itemMap.get(key) || { title: key, qty: 0 };
        prev.qty += Number(item.qty || 0);
        itemMap.set(key, prev);
      }
    }

    return [...itemMap.values()]
      .sort((a, b) => b.qty - a.qty || a.title.localeCompare(b.title))
      .slice(0, 10);
  }, [state.orders]);

  const topDays = React.useMemo(() => {
    return [...dailyTrend]
      .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)
      .slice(0, 5);
  }, [dailyTrend]);

  const signalTotals = signals.totals || EMPTY_SIGNALS.totals;
  const productSignals = Array.isArray(signals.productSignals) ? signals.productSignals : [];
  const timeseries = Array.isArray(signals.timeseries) ? signals.timeseries : [];
  const recentSignals = Array.isArray(signals.recent) ? signals.recent : [];

  const strongestProduct = React.useMemo(() => {
    if (!productSignals.length) return null;
    return [...productSignals].sort((a, b) => {
      const scoreA =
        Number(a.cartSignals || 0) * 4 +
        Number(a.checkoutSignals || 0) * 6 +
        Number(a.notifySignals || 0) * 3 +
        Number(a.preorderSignals || 0) * 4 +
        Number(a.soldOutViews || 0) * 5 +
        Number(a.productViews || 0);

      const scoreB =
        Number(b.cartSignals || 0) * 4 +
        Number(b.checkoutSignals || 0) * 6 +
        Number(b.notifySignals || 0) * 3 +
        Number(b.preorderSignals || 0) * 4 +
        Number(b.soldOutViews || 0) * 5 +
        Number(b.productViews || 0);

      return scoreB - scoreA;
    })[0];
  }, [productSignals]);

  function exportTrendCsv() {
    const header = ["day", "orders", "revenue_sek", "live", "preview"].join(";");
    const body = dailyTrend.map((row) =>
      [row.day, row.orders, row.revenue, row.live, row.preview].join(";")
    );
    exportCsv(
      `calestra-reports-daily-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...body].join("\n")
    );
  }

  function exportItemsCsv() {
    const header = ["item", "qty"].join(";");
    const body = topItems.map((row) => [row.title, row.qty].join(";"));
    exportCsv(
      `calestra-reports-items-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...body].join("\n")
    );
  }

  function exportSignalsCsv() {
    const header = [
      "product_slug",
      "product_title",
      "product_views",
      "card_clicks",
      "cart_signals",
      "checkout_signals",
      "notify_signals",
      "preorder_signals",
      "sold_out_views",
      "signal",
    ].join(";");

    const body = productSignals.map((row) =>
      [
        row.productSlug || "",
        row.productTitle || "",
        Number(row.productViews || 0),
        Number(row.cardClicks || 0),
        Number(row.cartSignals || 0),
        Number(row.checkoutSignals || 0),
        Number(row.notifySignals || 0),
        Number(row.preorderSignals || 0),
        Number(row.soldOutViews || 0),
        row.signal || "",
      ].join(";")
    );

    exportCsv(
      `calestra-signals-products-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...body].join("\n")
    );
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="cardTitle">Executive Reports</div>
        <div className="cardBody">
          Riktig ledningsöversikt för testlansering: volym, omsättning, mix och produktdrag.
        </div>

        <div className="hr" />

        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            <div className="badge">{state.loading ? "…" : summary.totalOrders} orders</div>
            <div className="badge">{state.loading ? "…" : moneySEK(summary.revenue)}</div>
            <div className="badge">Live {state.loading ? "…" : summary.live}</div>
            <div className="badge">Preview {state.loading ? "…" : summary.preview}</div>
            <div className="badge">Snitt {state.loading ? "…" : moneySEK(summary.avgOrder)}</div>
          </div>

          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={loadAll} disabled={state.loading || signals.loading}>
              {state.loading || signals.loading ? "Laddar…" : "Refresh"}
            </button>
            <button className="btn btnAccent" onClick={exportTrendCsv} disabled={state.loading || dailyTrend.length === 0}>
              Export Daily CSV
            </button>
            <button className="btn" onClick={exportItemsCsv} disabled={state.loading || topItems.length === 0}>
              Export Items CSV
            </button>
          </div>
        </div>

        {state.err ? (
          <>
            <div className="hr" />
            <div className="cardBody" style={{ color: "rgba(248,113,113,.92)", fontWeight: 900 }}>
              Fel: {state.err}
            </div>
          </>
        ) : null}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="cardTitle">Calestra Signals™</div>
            <div className="cardBody">
              Anonym kundbeteende-statistik: produktintresse, köpvilja, checkout-signal och notify/förköp.
              Detta är radarn som senare kan mata Campaign Engine™ utan att blanda ihop den med kampanj-events.
            </div>
          </div>

          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <select
              value={signalsRange}
              onChange={(e) => setSignalsRange(e.target.value)}
              className="btn"
              style={{ minHeight: 38 }}
              disabled={signals.loading}
            >
              <option value="day">Idag</option>
              <option value="7d">7 dagar</option>
              <option value="30d">30 dagar</option>
              <option value="90d">90 dagar</option>
            </select>

            <button className="btn" onClick={() => loadSignals(signalsRange)} disabled={signals.loading}>
              {signals.loading ? "Laddar…" : "Refresh Signals"}
            </button>

            <button
              className="btn btnAccent"
              onClick={exportSignalsCsv}
              disabled={signals.loading || productSignals.length === 0}
            >
              Export Signals CSV
            </button>
          </div>
        </div>

        {signals.err ? (
          <>
            <div className="hr" />
            <div className="cardBody" style={{ color: "rgba(251,191,36,.96)", fontWeight: 900 }}>
              Signals är inte synliga ännu: {signals.err}
            </div>
            <div className="cardBody" style={{ marginTop: 8, opacity: 0.82 }}>
              Kontrollera att backend-filen finns: <b>/api/admin/analytics-summary</b>. Butiken kan fortfarande skicka
              signaler även om adminpanelen inte kan läsa dem ännu.
            </div>
          </>
        ) : null}

        <div className="hr" />

        <div className="grid3" style={{ marginBottom: 16 }}>
          <KpiCard
            value={signals.loading ? "…" : intFmt(signalTotals.sessions)}
            label="Sessions"
            sub="Ungefärliga anonyma besökssessioner"
          />

          <KpiCard
            value={signals.loading ? "…" : intFmt(signalTotals.productViews)}
            label="Produktvisningar"
            sub="Vilka produkter som väcker nyfikenhet"
          />

          <KpiCard
            value={signals.loading ? "…" : intFmt(signalTotals.cartSignals)}
            label="Kundvagnssignaler"
            sub={`Cart / views: ${pct(signalTotals.cartSignals, signalTotals.productViews)}`}
          />
        </div>

        <div className="grid3" style={{ marginBottom: 16 }}>
          <KpiCard
            value={signals.loading ? "…" : intFmt(signalTotals.checkoutSignals)}
            label="Checkout-start"
            sub={`Checkout / cart: ${pct(signalTotals.checkoutSignals, signalTotals.cartSignals)}`}
          />

          <KpiCard
            value={signals.loading ? "…" : intFmt(signalTotals.notifySignals)}
            label="Notify"
            sub="Intresse utan köp"
          />

          <KpiCard
            value={signals.loading ? "…" : intFmt(signalTotals.soldOutViews)}
            label="Slutsåld-visningar"
            sub="Signal för möjlig påfyllning"
          />
        </div>

        <div className="grid2" style={{ marginBottom: 16 }}>
          <div className="card" style={{ minHeight: 0 }}>
            <div className="cardTitle">Starkaste produkt</div>
            <div className="cardBody">
              Produkten som just nu har bäst kombination av visningar, kundvagn, checkout, notify och slutsåld-signal.
            </div>

            <div className="hr" />

            {signals.loading ? (
              <div className="cardBody">Laddar signaler…</div>
            ) : strongestProduct ? (
              <div>
                <div className="kpiNum" style={{ fontSize: 28 }}>
                  {strongestProduct.productTitle || strongestProduct.productSlug || "Produkt"}
                </div>
                <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {signalBadge(strongestProduct.signal)}
                  <span className="badge">{intFmt(strongestProduct.productViews)} visningar</span>
                  <span className="badge">{intFmt(strongestProduct.cartSignals)} cart</span>
                  <span className="badge">{intFmt(strongestProduct.checkoutSignals)} checkout</span>
                  <span className="badge">{intFmt(strongestProduct.notifySignals)} notify</span>
                </div>
              </div>
            ) : (
              <div className="cardBody">Ingen produktsignal ännu.</div>
            )}
          </div>

          <div className="card" style={{ minHeight: 0 }}>
            <div className="cardTitle">Campaign Engine Input</div>
            <div className="cardBody">
              Signals är mätning. Campaign Engine™ är styrning. Här får du beslutsunderlag innan du manuellt
              tvingar eller låter kampanjmotorn gå automatiskt.
            </div>

            <div className="hr" />

            <div className="summaryGrid">
              <div className="summaryRow">
                <span className="summaryKey">Köpsignal</span>
                <span className="summaryVal">{pct(signalTotals.cartSignals, signalTotals.productViews)}</span>
              </div>
              <div className="summaryRow">
                <span className="summaryKey">Checkout-signal</span>
                <span className="summaryVal">{pct(signalTotals.checkoutSignals, signalTotals.cartSignals)}</span>
              </div>
              <div className="summaryRow">
                <span className="summaryKey">Notify-signal</span>
                <span className="summaryVal">{intFmt(signalTotals.notifySignals)}</span>
              </div>
              <div className="summaryRow">
                <span className="summaryKey">Förköp-signal</span>
                <span className="summaryVal">{intFmt(signalTotals.preorderSignals)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="cw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Product</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Views</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Cards</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Cart</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Checkout</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Notify</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Preorder</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Sold-out</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Signal</th>
              </tr>
            </thead>
            <tbody>
              {signals.loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 14, opacity: 0.75 }}>
                    Laddar Calestra Signals…
                  </td>
                </tr>
              ) : productSignals.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 14, opacity: 0.75 }}>
                    Inga produktsignaler ännu. Öppna butik, klicka på produkt, lägg i kundvagn eller testa notify.
                  </td>
                </tr>
              ) : (
                productSignals.map((row) => (
                  <tr
                    key={row.productSlug || row.productTitle}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 900 }}>
                        {row.productTitle || row.productSlug || "Produkt"}
                      </div>
                      {row.productSlug ? (
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{row.productSlug}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{intFmt(row.productViews)}</td>
                    <td style={{ padding: "10px 12px" }}>{intFmt(row.cardClicks)}</td>
                    <td style={{ padding: "10px 12px" }}>{intFmt(row.cartSignals)}</td>
                    <td style={{ padding: "10px 12px" }}>{intFmt(row.checkoutSignals)}</td>
                    <td style={{ padding: "10px 12px" }}>{intFmt(row.notifySignals)}</td>
                    <td style={{ padding: "10px 12px" }}>{intFmt(row.preorderSignals)}</td>
                    <td style={{ padding: "10px 12px" }}>{intFmt(row.soldOutViews)}</td>
                    <td style={{ padding: "10px 12px" }}>{signalBadge(row.signal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {timeseries.length > 0 ? (
          <>
            <div className="hr" />
            <div className="cardTitle">Signaltrend</div>
            <div className="cardBody">
              Daglig trend för anonyma signaler.
            </div>

            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table className="cw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Day</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Events</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Views</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Cart</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Checkout</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Notify</th>
                  </tr>
                </thead>
                <tbody>
                  {timeseries.map((row) => (
                    <tr key={row.day} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td style={{ padding: "10px 12px" }}>{row.day}</td>
                      <td style={{ padding: "10px 12px" }}>{intFmt(row.events)}</td>
                      <td style={{ padding: "10px 12px" }}>{intFmt(row.productViews)}</td>
                      <td style={{ padding: "10px 12px" }}>{intFmt(row.cartSignals)}</td>
                      <td style={{ padding: "10px 12px" }}>{intFmt(row.checkoutSignals)}</td>
                      <td style={{ padding: "10px 12px" }}>{intFmt(row.notifySignals)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {recentSignals.length > 0 ? (
          <>
            <div className="hr" />
            <div className="cardTitle">Senaste signaler</div>
            <div className="cardBody">
              Bara anonym signalström — inte personspårning.
            </div>

            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table className="cw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Time</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Signal</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Product</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Device</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSignals.map((row, idx) => (
                    <tr
                      key={`${row.createdAt || ""}-${idx}`}
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        {row.createdAt ? new Date(row.createdAt).toLocaleString("sv-SE") : "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{eventLabel(row.name)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        {row.productTitle || row.productSlug || "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{row.device || "—"}</td>
                      <td style={{ padding: "10px 12px", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.path || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>

      <div className="grid3" style={{ marginBottom: 16 }}>
        <KpiCard
          value={state.loading ? "…" : summary.totalOrders}
          label="Total orders"
        />

        <KpiCard
          value={state.loading ? "…" : moneySEK(summary.revenue)}
          label="Omsättning (SEK)"
        />

        <KpiCard
          value={state.loading ? "…" : moneySEK(summary.avgOrder)}
          label="Snittorder"
        />
      </div>

      <div className="grid2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="cardTitle">Daglig trend</div>
          <div className="cardBody">
            Antal, omsättning och live/preview per dag.
          </div>

          <div className="hr" />

          <div style={{ overflowX: "auto" }}>
            <table className="cw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>Day</th>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>Orders</th>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>Omsättning</th>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>Live</th>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {state.loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 14, opacity: 0.75 }}>
                      Laddar trend…
                    </td>
                  </tr>
                ) : dailyTrend.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 14, opacity: 0.75 }}>
                      Ingen data ännu.
                    </td>
                  </tr>
                ) : (
                  dailyTrend.map((row) => (
                    <tr key={row.day} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td style={{ padding: "10px 12px" }}>{row.day}</td>
                      <td style={{ padding: "10px 12px" }}>{row.orders}</td>
                      <td style={{ padding: "10px 12px" }}>{moneySEK(row.revenue)}</td>
                      <td style={{ padding: "10px 12px" }}>{row.live}</td>
                      <td style={{ padding: "10px 12px" }}>{row.preview}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Bästa dagar</div>
          <div className="cardBody">
            De starkaste dagarna just nu sett till omsättning.
          </div>

          <div className="hr" />

          <div style={{ overflowX: "auto" }}>
            <table className="cw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>Day</th>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>Omsättning</th>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>Orders</th>
                </tr>
              </thead>
              <tbody>
                {state.loading ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 14, opacity: 0.75 }}>
                      Laddar…
                    </td>
                  </tr>
                ) : topDays.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 14, opacity: 0.75 }}>
                      Ingen data ännu.
                    </td>
                  </tr>
                ) : (
                  topDays.map((row) => (
                    <tr key={row.day} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td style={{ padding: "10px 12px" }}>{row.day}</td>
                      <td style={{ padding: "10px 12px" }}>{moneySEK(row.revenue)}</td>
                      <td style={{ padding: "10px 12px" }}>{row.orders}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">Top items</div>
        <div className="cardBody">
          Produkter som testas mest just nu baserat på skapade orders.
        </div>

        <div className="hr" />

        <div style={{ overflowX: "auto" }}>
          <table className="cw-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Item</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr>
                  <td colSpan={2} style={{ padding: 14, opacity: 0.75 }}>
                    Laddar topprodukter…
                  </td>
                </tr>
              ) : topItems.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: 14, opacity: 0.75 }}>
                    Inga produkter ännu.
                  </td>
                </tr>
              ) : (
                topItems.map((item) => (
                  <tr key={item.title} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "10px 12px" }}>{item.title}</td>
                    <td style={{ padding: "10px 12px" }}>{item.qty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}