import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';

export const payRouter = Router();

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.warn('[pay] STRIPE_SECRET_KEY missing in .env');
}
const stripe = stripeKey ? new Stripe(stripeKey) : null;

const PaySchema = z.object({
  amountSek: z.number().min(1),
  orderPreview: z.object({
    orderId: z.string().optional()
  }).optional(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional()
});

payRouter.post('/checkout', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ ok: false, error: 'stripe_not_configured' });
    }
    const { amountSek, orderPreview, successUrl, cancelUrl } = PaySchema.parse(req.body);

    const success = successUrl || `${process.env.PUBLIC_BASE_URL}/thanks/${encodeURIComponent(orderPreview?.orderId || 'ok')}`;
    const cancel = cancelUrl || `${process.env.PUBLIC_BASE_URL}/cart`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      currency: 'sek',
      line_items: [
        {
          price_data: {
            currency: 'sek',
            product_data: { name: 'Calestra Order' },
            unit_amount: Math.round(amountSek * 100),
          },
          quantity: 1
        }
      ],
      success_url: success,
      cancel_url: cancel,
      metadata: {
        orderId: orderPreview?.orderId || ''
      }
    });

    res.json({ ok: true, id: session.id, url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'stripe_error' });
  }
});
