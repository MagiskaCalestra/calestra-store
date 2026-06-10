// apps/store-classic/src/analytics/analytics.js
const KEY = "cw.analytics.events";

function nowISO() {
  return new Date().toISOString();
}

function safeLoad() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function safeSave(events) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch {}
}

export function track(event, payload = {}) {
  if (typeof window === "undefined") return;
  const events = safeLoad();
  events.push({ event, payload, ts: nowISO() });
  safeSave(events);
}

export function getAnalytics() {
  if (typeof window === "undefined") return [];
  return safeLoad();
}

export function clearAnalytics() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function summarize(events = safeLoad()) {
  const sum = {
    page_view: 0,
    product_view: 0,
    add_to_cart: 0,
    checkout_start: 0,
    order_created: 0,
    revenueSEK: 0,
  };

  for (const e of events) {
    if (!e || !e.event) continue;
    if (sum[e.event] !== undefined) sum[e.event]++;
    if (e.event === "order_created") {
      sum.revenueSEK += Number(e?.payload?.totalSEK || 0);
    }
  }

  const conversionPercent =
    sum.page_view > 0
      ? Math.round((sum.order_created / sum.page_view) * 100)
      : 0;

  const avgOrderSEK =
    sum.order_created > 0
      ? Math.round(sum.revenueSEK / sum.order_created)
      : 0;

  return { ...sum, conversionPercent, avgOrderSEK };
}
