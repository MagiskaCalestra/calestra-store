// apps/store-classic/src/core/ordersPush.js
export async function pushOrderToOrdersService(order) {
  try {
    const payload = { order };

    // Försök först via relative path (om du senare lägger Vite-proxy i store)
    // annars faller vi tillbaka på direkt port 14202.
    const urls = [
      "/svc/orders/ingest/order",
      "http://127.0.0.1:14202/ingest/order",
    ];

    let lastErr = null;

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) return await res.json().catch(() => ({ ok: true }));
        lastErr = new Error(`status ${res.status}`);
      } catch (e) {
        lastErr = e;
      }
    }

    // tyst fail i test, men vi kan logga
    console.warn("[store] pushOrderToOrdersService failed:", lastErr?.message || lastErr);
    return null;
  } catch (e) {
    console.warn("[store] pushOrderToOrdersService crashed:", e?.message || e);
    return null;
  }
}
