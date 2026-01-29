// D:\WebProjects\Calestra\apps\admin\src\core\analyticsClient.js

function isLocalhost() {
  try {
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1";
  } catch {
    return false;
  }
}

function baseUrl() {
  // DEV: proxy
  if (typeof window !== "undefined" && isLocalhost()) return "/svc/analytics";

  // PROD/future: direct base (om du senare vill)
  try {
    const v = String(import.meta?.env?.VITE_ANALYTICS_URL || "http://127.0.0.1:14090");
    return v.replace(/\/$/, "");
  } catch {
    return "http://127.0.0.1:14090";
  }
}

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const txt = await res.text().catch(() => "");
  try {
    return JSON.parse(txt);
  } catch {
    return { message: txt };
  }
}

async function get(url) {
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || data?.message || `Request failed (${res.status})\nURL: ${url}`);
  return data;
}

// Optional: health helper (bra för QA-panel)
export async function getAnalyticsHealth() {
  const BASE = baseUrl();
  return get(`${BASE}/health`);
}

export async function getAnalyticsSummary({ env = "green", range = "day" } = {}) {
  const BASE = baseUrl();
  const url = `${BASE}/api/analytics/stats/summary?env=${encodeURIComponent(env)}&range=${encodeURIComponent(range)}`;
  return get(url);
}

export async function getAnalyticsFunnel({ env = "green", range = "day" } = {}) {
  const BASE = baseUrl();
  const url = `${BASE}/api/analytics/stats/funnel?env=${encodeURIComponent(env)}&range=${encodeURIComponent(range)}`;
  return get(url);
}

export async function getAnalyticsTimeseries({
  env = "green",
  range = "7d",
  bucket = "day",
  name = "order_success",
} = {}) {
  const BASE = baseUrl();
  const url =
    `${BASE}/api/analytics/stats/timeseries?env=${encodeURIComponent(env)}` +
    `&range=${encodeURIComponent(range)}&bucket=${encodeURIComponent(bucket)}&name=${encodeURIComponent(name)}`;
  return get(url);
}

export async function getAnalyticsErrors({ env = "green", limit = 30 } = {}) {
  const BASE = baseUrl();
  const url = `${BASE}/api/analytics/stats/errors?env=${encodeURIComponent(env)}&limit=${encodeURIComponent(String(limit))}`;
  return get(url);
}
