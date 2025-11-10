import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Skapar en Stripe Checkout-session för ett totalbelopp i SEK
export async function createCheckout({ amountSek, orderPreview }) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "sek",
    line_items: [
      {
        price_data: {
          currency: "sek",
          product_data: { name: "Calestra Order" },
          unit_amount: Math.round(Number(amountSek) * 100),
        },
        quantity: 1,
      },
    ],
    success_url: process.env.CHECKOUT_SUCCESS + "?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: process.env.CHECKOUT_CANCEL,
    metadata: {
      preview: orderPreview ? JSON.stringify(orderPreview).slice(0, 500) : "",
    },
  });
  return { id: session.id, url: session.url };
}
