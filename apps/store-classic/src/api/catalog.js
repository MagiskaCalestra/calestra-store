// apps/store-classic/src/api/catalog.js
const BASE = import.meta.env.VITE_STORE_API || "http://localhost:14000";

export async function fetchProducts({ q = "", page = 1, limit = 48 } = {}) {
  const url = new URL("/products", BASE);
  if (q) url.searchParams.set("q", q);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const r = await fetch(url.toString(), { headers: { "Accept": "application/json" } });
  if (!r.ok) throw new Error(`fetchProducts ${r.status}`);
  const data = await r.json();
  return { total: data.total || 0, items: data.items || [] };
}

export async function fetchProduct(idOrSlug) {
  const r = await fetch(`${BASE}/products/${encodeURIComponent(idOrSlug)}`, {
    headers: { "Accept": "application/json" },
  });
  if (!r.ok) throw new Error(`fetchProduct ${r.status}`);
  const data = await r.json();
  return data.item;
}
