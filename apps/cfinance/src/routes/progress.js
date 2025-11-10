import { Router } from 'express';
import { z } from 'zod';

export const progressRouter = Router();

const ProgressSchema = z.object({
  source: z.string().default('store'),
  orderId: z.any().optional(),
  amountSEK: z.number().min(0),
  currency: z.string().default('SEK'),
  affiliate: z.any().optional(),
});

progressRouter.post('/track', async (req, res) => {
  try {
    const data = ProgressSchema.parse(req.body);
    // TODO: DB persist (v2). Nu loggar vi best-effort:
    console.log('[progress]', data.amountSEK, data.currency, data.orderId || null);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ ok: false });
  }
});
