import { Router } from 'express';
import {
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from './db.js';

const r = Router();

// Skapa order
r.post('/orders', async (req, res) => {
  try {
    const { items = [], totals = {}, customer = {}, shippingAddress = {}, billingAddress = null, affiliate = null } = req.body || {};
    const o = await createOrder(items, totals, { customer, shippingAddress, billingAddress, affiliate });
    res.status(201).json({ ok: true, order: o, id: o.id });
  } catch (e) {
    console.error('[orders] create error:', e);
    res.status(500).json({ ok: false, error: 'create_failed' });
  }
});

// Hämta order
r.get('/orders/:id', async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, order: o });
});

// Lista order
r.get('/orders', async (_req, res) => {
  const list = await listOrders();
  res.json({ ok: true, orders: list });
});

// Uppdatera status (t.ex. paid, refunded, cancelled)
r.patch('/orders/:id', async (req, res) => {
  try {
    const { status, patch = {} } = req.body || {};
    const o = await updateOrderStatus(req.params.id, status, patch);
    if (!o) return res.status(404).json({ ok: false, error: 'not_found' });
    res.json({ ok: true, order: o });
  } catch (e) {
    console.error('[orders] patch error:', e);
    res.status(500).json({ ok: false, error: 'update_failed' });
  }
});

export default r;
