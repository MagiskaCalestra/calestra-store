import Stripe from "stripe";

export function getStripe(mode, env) {
  const m = (mode || env.FINANCE_MODE_DEFAULT || "test").toLowerCase();
  const key =
    m === "live" ? env.STRIPE_LIVE_SECRET_KEY : env.STRIPE_TEST_SECRET_KEY;

  if (!key) {
    throw new Error(
      `Missing Stripe key for mode=${m}. Set STRIPE_${m.toUpperCase()}_SECRET_KEY in env.`
    );
  }

  return {
    mode: m,
    stripe: new Stripe(key, { apiVersion: "2024-06-20" })
  };
}
