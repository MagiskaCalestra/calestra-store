export async function listProducts({ page = 1, limit = 20 } = {}) {
  const BASE = import.meta.env.VITE_PRODUCTS_BASE || "http://localhost:14500";
  const url = new URL("/products", BASE);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url.href);
  if (!res.ok) throw new Error(`Products ${res.status}`);
  return res.json();
}
