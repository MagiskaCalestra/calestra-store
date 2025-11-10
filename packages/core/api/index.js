// Minimal web-safe API helper. INGA process.env – bara import.meta.env
const FEATURE_USE_MOCK = import.meta?.env?.VITE_FEATURE_USE_MOCK ?? false;

const MOCK_URL  = import.meta?.env?.VITE_MOCK_URL      ?? "http://localhost:5399";
const CORE_URL  = import.meta?.env?.VITE_API_BASE_URL  ?? "http://localhost:15000";
const INFY_URL  = import.meta?.env?.VITE_INFY_URL      ?? "http://localhost:14500";
const NEXUS_URL = import.meta?.env?.VITE_NEXUS_URL     ?? "http://localhost:14000";

const BASE = FEATURE_USE_MOCK ? MOCK_URL : CORE_URL;

export async function api(path, opts = {}) {
  const url = path?.startsWith?.("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || url}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const endpoints = {
  // Infinity KPI (global progress)
  progress: {
    summary: () => `${INFY_URL}/progress/summary`,
    post:    () => `${INFY_URL}/progress`,
  },

  // Produkter (c-core)
  products: {
    list: ({ q = "", category = "", page = 1, limit = 24 } = {}) => {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (category) sp.set("category", category);
      sp.set("page", page);
      sp.set("limit", limit);
      return `${CORE_URL}/products?${sp.toString()}`;
    },
    byId:       (id) => `${CORE_URL}/products/${id}`,
    images:     (id) => `${CORE_URL}/products/${id}/images`,
    categories: ()  => `${CORE_URL}/categories`,
  },

  // Health (debug)
  health: {
    mock:  () => `${MOCK_URL}/health`,
    nexus: () => `${NEXUS_URL}/health`,
    ccore: () => `${CORE_URL}/health`,
    inf:   () => `${INFY_URL}/health`,
  },
};

export default { api, endpoints };
export { api as client };
