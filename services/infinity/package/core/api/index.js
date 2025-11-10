// packages/core/api/index.js

// Vite-läsning av env (måste börja med VITE_)
const USE_MOCK = (import.meta?.env?.VITE_FEATURE_USE_MOCK ?? "false") === "true";
const MOCK_URL  = import.meta?.env?.VITE_MOCK_URL  || "http://localhost:5399";
const CCORE_URL = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:15000";
const BASE = USE_MOCK ? MOCK_URL : CCORE_URL;

// Liten fetch-helper som kan ta både absoluta och relativa paths
export async function api(path, opts = {}) {
  const url = /^https?:\/\//.test(path) ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

// Små post/get helpers
export const get  = (p, opts = {}) => api(p, { method: "GET",  ...opts });
export const post = (p, body, opts = {}) =>
  api(p, { method: "POST", body: JSON.stringify(body ?? {}), ...opts });

// Samlade endpoints (håll dem här för enkelhet)
export const endpoints = {
  // c-core (15000) – ”verkliga” API:er
  progress:        "/v1/progress",
  membership: (id) => `/v1/membership/${id}`,

  // infinity (14500) – global progress-sammanfattning
  progressSummary: "http://localhost:14500/progress/summary",
};

export default { api, get, post, endpoints };
