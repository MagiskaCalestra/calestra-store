// apps/store-classic/src/config/orders.js
export function getOrdersBase() {
  // Production: VITE_ORDERS_URL i Cloudflare Pages
  // Dev: fallback till lokal orders-service
  return (import.meta?.env?.VITE_ORDERS_URL || "http://127.0.0.1:14202").replace(/\/+$/, "");
}
