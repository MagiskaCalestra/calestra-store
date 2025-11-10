// services/finance/src/stripe.js
import Stripe from "stripe";

const STRIPE_SECRET = process.env.STRIPE_SECRET;
if (!STRIPE_SECRET) {
  console.warn("[finance] STRIPE_SECRET saknas! Checkout kommer inte fungera.");
}
export const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET, { apiVersion: "2024-06-20" }) : null;
