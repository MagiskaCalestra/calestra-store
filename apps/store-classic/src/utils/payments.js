// apps/store-classic/src/utils/payments.js
export async function startHostedCheckout({ amountSek, orderPreview }) {
  const base =
    (import.meta.env && import.meta.env.VITE_FINANCE_API) ||
    (typeof process !== "undefined" && process.env?.VITE_FINANCE_API) ||
    "http://localhost:14600";

  const r = await fetch(`${base}/pay/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountSek, orderPreview }),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`checkout server error: ${r.status} ${txt}`);
  }
  return r.json(); // { id, url }
}
