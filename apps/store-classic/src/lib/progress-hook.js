// src/lib/progress-hook.js
export async function sendPurchaseToInfinity(amountSEK, orderId) {
  // försök posta till Infinity (/progress) robust
  const url = (window && window.__INFINITY_URL__) || "http://localhost:14500/progress";
  const payload = {
    amount: Number(amountSEK || 0),
    orderId: orderId || null,
    source: "store",
    timestamp: new Date().toISOString()
  };

  // enkel timeout för fetch (abortcontroller)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!r.ok) {
      // icke-blockerande: logga men kasta inte fel uppåt
      console.warn("[progress] post failed", r.status);
      return false;
    }
    return true;
  } catch (err) {
    clearTimeout(timeout);
    // nätverksfel eller timeout â€” logga men låt UX fortsätta
    console.warn("[progress] send failed", err?.message || err);
    return false;
  }
}
