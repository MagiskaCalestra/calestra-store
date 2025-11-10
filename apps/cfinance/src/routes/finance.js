import { Router } from 'express';
import { z } from 'zod';

export const financeRouter = Router();

const Item = z.object({
  sku: z.any(),
  title: z.string(),
  qty: z.number().min(1),
  priceSEK: z.number().min(0),
});

const IngestSchema = z.object({
  orderId: z.any(),
  clientId: z.any().optional(),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  items: z.array(Item).min(1),
  currency: z.string().default('SEK'),
  country: z.string().default('SE'),
  affiliate: z.any().optional(),
  createdAt: z.string().optional()
});

financeRouter.post('/', async (req, res) => {
  try {
    const payload = IngestSchema.parse(req.body);
    // TODO: skriv till DB (better-sqlite3) – v2
    // just nu: best-effort logg
    console.log('[ingest]', payload.orderId, payload.customer?.email, payload.items?.length);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, error: 'invalid_payload' });
  }
});
