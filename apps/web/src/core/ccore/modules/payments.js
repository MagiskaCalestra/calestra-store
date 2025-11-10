// apps/web/src/core/ccore/modules/payments.js
// PSP-hook (mock) – kan bytas mot Stripe/Adyen utan att påverka UI.
export async function initPayment({ amount, currency = "SEK", cartId }) {
  // Mock: returnera en fejkad token.
  await new Promise(r => setTimeout(r, 200));
  return { token: `mock_tok_${Math.random().toString(36).slice(2,10)}`, provider: "mock", amount, currency, cartId };
}
