// apps/store-classic/src/core/apiClient.js
// Enkel API-klient för Store Classic. All trafik går via VITE_API_URL.

const BASE =
  import.meta.env.VITE_API_URL ||
  (typeof process !== "undefined" && process.env?.VITE_API_URL) ||
  "http://localhost:14580";

export async function fetchJSON(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    ...opts,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `${res.status} ${res.statusText || ""} ${text}`.trim() || `HTTP ${res.status}`
    );
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return res.json();
  }
  return res.text();
}
