// packages/core/api/index.js

const FEATURE_USE_MOCK = (import.meta?.env?.FEATURE_USE_MOCK ?? "false") === "true";
const MOCK_URL  = import.meta?.env?.MOCK_URL  ?? "http://localhost:5399";
const CCORE_URL = import.meta?.env?.API_BASE_URL ?? "http://localhost:15000";
const INFY_URL  = import.meta?.env?.INFY_URL  ?? "http://localhost:14500";
const NEXUS_URL = import.meta?.env?.NEXUS_URL ?? "http://localhost:14000";

const BASE = FEATURE_USE_MOCK ? MOCK_URL : CCORE_URL;

export async function api(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const endpoints = {
  progress: "/v1/progress",
  membership: (id) => `/v1/membership/${id}`,
  progressSummary: `${INFY_URL}/progress/summary`,
};

export async function healthAll() {
  const services = {
    mock:   `${MOCK_URL}/health`,
    nexus:  `${NEXUS_URL}/health`,
    ccore:  `${CCORE_URL}/health`,
    inf:    `${INFY_URL}/health`,
  };
  const entries = await Promise.all(
    Object.entries(services).map(async ([key, url]) => {
      try {
        const data = await api(url, {});
        return [key, { ok: !!data?.ok, data }];
      } catch (e) {
        return [key, { ok: false, error: String(e) }];
      }
    })
  );
  return Object.fromEntries(entries);
}

export default { api, endpoints, healthAll };
