const FINANCE_BASE =
  (import.meta.env && import.meta.env.VITE_FINANCE_API) ||
  (typeof process !== "undefined" && process.env?.VITE_FINANCE_API) ||
  "http://localhost:14600";

export async function financeIngest({ orderId, clientId, customer, items, currency = "SEK", country = "SE", affiliate }) {
  try {
    // översätt items till SEK (dina base-prices är redan SEK)
    const payload = {
      orderId,
      clientId,
      customer,
      items: items.map(it => ({
        sku: it.id,
        title: it.title,
        qty: Number(it.qty || 1),
        priceSEK: Number(it.price || 0)
      })),
      currency,
      country,
      affiliate,
      createdAt: new Date().toISOString()
    };
    await fetch(`${FINANCE_BASE}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    /* best-effort */
  }
}
