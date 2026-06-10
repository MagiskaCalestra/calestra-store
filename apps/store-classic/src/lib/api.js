const API = import.meta.env.VITE_API_URL || "http://localhost:14661"; // finance

export async function loadProducts() {
  const r = await fetch(`${API}/products`, { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to fetch products");
  return await r.json();
}

export async function getStatus() {
  const r = await fetch(`${API}/status`);
  return r.ok ? (await r.json()) : { ok: false };
}
