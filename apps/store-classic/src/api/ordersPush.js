// Pushar order till orders-service via Vite proxy (/svc/orders/*).
// Får ALDRIG krascha checkout – därför swallow errors.

export async function pushOrderToOrdersService(order) {
  try {
    if (!order || !order.id) return { ok: false };

    const payload = {
      id: order.id,
      mode: order.mode,
      createdAt: order.createdAt,
      currency: order.currency,
      totalsSEK: order.totalsSEK,
      customer: order.customer,
      anyPhysical: order.anyPhysical,
      items: order.items,
    };

    const res = await fetch("/svc/orders/ingest", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
    });

    // även om den failar ska vi inte stoppa checkout
    if (!res.ok) return { ok: false, status: res.status };
    return await res.json().catch(() => ({ ok: true }));
  } catch {
    return { ok: false };
  }
}
