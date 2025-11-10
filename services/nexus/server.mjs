import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { v4 as uuid } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 14800;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5288';
const STORE_BASE_URL = process.env.STORE_BASE_URL || 'http://localhost:5288';

const app = express();
app.use(cors({ origin: ORIGIN, credentials: false }));
app.use(express.json({ limit: '1mb' }));

// --- data directory (JSON-lagring) ---
const dataDir = path.join(__dirname, 'data');
const ordersPath = path.join(dataDir, 'orders.json');
const abandonedPath = path.join(dataDir, 'abandoned.json');

async function ensureData() {
  await fs.mkdir(dataDir, { recursive: true });
  for (const p of [ordersPath, abandonedPath]) {
    try { await fs.access(p); }
    catch { await fs.writeFile(p, '[]', 'utf8'); }
  }
}
await ensureData();

async function readJson(file) {
  const buf = await fs.readFile(file, 'utf8');
  return JSON.parse(buf || '[]');
}
async function writeJson(file, obj) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2), 'utf8');
}

// --- mail transporter ---
let transporter;
if ((process.env.MAIL_TRANSPORT || 'mock') === 'smtp') {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: /^true$/i.test(process.env.SMTP_SECURE || 'false'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // MOCK – loggar mejlet till konsolen
  transporter = {
    sendMail: async (opts) => {
      console.log('\n--- MOCK MAIL ---');
      console.log('FROM:', opts.from);
      console.log('TO:', opts.to);
      console.log('SUBJECT:', opts.subject);
      console.log('TEXT:', opts.text);
      console.log('HTML:', opts.html);
      console.log('-----------------\n');
      return { messageId: `mock-${Date.now()}` };
    }
  };
}

const MAIL_FROM = process.env.MAIL_FROM || 'Calestra <no-reply@calestra.test>';

// --- helpers ---
function currency(amount, currency = 'SEK') {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency }).format(amount);
}

function orderEmailHtml({ order, total, subtotal, shipping }) {
  const itemsHtml = order.items.map(
    i => `<li>${i.title} × ${i.qty} – ${currency(i.price * i.qty, order.currency)}</li>`
  ).join('');

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;">
    <h2>Tack för din beställning, ${order.customer?.name || ''}!</h2>
    <p>Ordernummer: <strong>${order.id}</strong></p>
    <p>Du kan se ditt kvitto här: <a href="${order.receiptUrl}">${order.receiptUrl}</a></p>
    <h3>Produkter</h3>
    <ul>${itemsHtml}</ul>
    <p>Delsumma: <strong>${currency(subtotal, order.currency)}</strong></p>
    <p>Frakt: <strong>${currency(shipping, order.currency)}</strong></p>
    <p>Totalt: <strong>${currency(total, order.currency)}</strong></p>
    <hr/>
    <p>Leveransadress:<br/>${order.customer?.address || ''}</p>
    <p>Hälsningar,<br/>Calestra</p>
  </div>`;
}

function abandonedEmailHtml({ email, returnUrl, items }) {
  const list = (items || []).slice(0, 5).map(i => `<li>${i.title} × ${i.qty}</li>`).join('');
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;">
    <h2>Du glömde något i kundvagnen</h2>
    <p>Hej ${email || ''}! Dina varor väntar fortfarande på dig.</p>
    <ul>${list}</ul>
    <p><a href="${returnUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;">Fortsätt till kassan</a></p>
    <p>Som tack får du 10% rabatt med koden <strong>WELCOME10</strong> (gäller i 48 timmar).</p>
    <p>Hälsningar,<br/>Calestra</p>
  </div>`;
}

// --- endpoints ---

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

/**
 * POST /orders
 * body: { items:[{id,title,price,qty,image,slug}], currency, customer:{name,email,address}, totals?:{shipping,subtotal,total} }
 */
app.post('/orders', async (req, res) => {
  try {
    const body = req.body || {};
    const id = uuid();
    const createdAt = new Date().toISOString();

    const items = Array.isArray(body.items) ? body.items : [];
    const currencyCode = body.currency || 'SEK';

    const subtotal = items.reduce((s, p) => s + Number(p.price || 0) * Number(p.qty || 0), 0);
    const shipping = body?.totals?.shipping ?? (items.length ? 49.95 : 0);
    const total = body?.totals?.total ?? (subtotal + shipping);

    const receiptUrl = `${STORE_BASE_URL}/thank-you?orderId=${id}`;

    const order = {
      id,
      createdAt,
      currency: currencyCode,
      items,
      subtotal,
      shipping,
      total,
      customer: {
        name: body?.customer?.name || '',
        email: body?.customer?.email || '',
        address: body?.customer?.address || '',
        country: body?.customer?.country || '',
      },
      receiptUrl,
      status: 'created'
    };

    const orders = await readJson(ordersPath);
    orders.push(order);
    await writeJson(ordersPath, orders);

    // Mail kvitto
    if (order.customer.email) {
      await transporter.sendMail({
        from: MAIL_FROM,
        to: order.customer.email,
        subject: `Calestra – Orderbekräftelse ${order.id}`,
        text: `Tack för din beställning!\nOrder: ${order.id}\nKvitto: ${receiptUrl}`,
        html: orderEmailHtml({ order, total, subtotal, shipping }),
      });
    }

    res.json({ ok: true, orderId: id, receiptUrl, total, subtotal, shipping });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'ORDER_CREATE_FAILED' });
  }
});

/**
 * GET /orders/:id
 * returnerar ordern
 */
app.get('/orders/:id', async (req, res) => {
  const orders = await readJson(ordersPath);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, order });
});

/**
 * GET /orders?email=…
 * hämtar senaste ordern för en e-post
 */
app.get('/orders', async (req, res) => {
  const email = (req.query.email || '').toString().toLowerCase();
  const orders = await readJson(ordersPath);
  const found = orders.filter(o => (o.customer?.email || '').toLowerCase() === email)
                     .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  res.json({ ok: true, orders: found });
});

/**
 * POST /abandoned
 * body: { email?, items:[…], currency?, cartTotal?, returnUrl? }
 */
app.post('/abandoned', async (req, res) => {
  try {
    const body = req.body || {};
    const id = uuid();
    const createdAt = new Date().toISOString();

    const record = {
      id,
      createdAt,
      email: body.email || '',
      currency: body.currency || 'SEK',
      cartTotal: Number(body.cartTotal || 0),
      items: Array.isArray(body.items) ? body.items : [],
      returnUrl: body.returnUrl || `${STORE_BASE_URL}/checkout`,
      sent: false
    };

    const list = await readJson(abandonedPath);
    list.push(record);
    await writeJson(abandonedPath, list);

    // Skicka lockande mejl om vi har e-post
    if (record.email) {
      await transporter.sendMail({
        from: MAIL_FROM,
        to: record.email,
        subject: 'Glömde du något i kundvagnen?',
        text: `Hej! Dina varor väntar på dig.\nFortsätt till kassan: ${record.returnUrl}`,
        html: abandonedEmailHtml(record),
      });
      record.sent = true;
      await writeJson(abandonedPath, list);
    }

    res.json({ ok: true, id: record.id, sent: record.sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'ABANDONED_FAILED' });
  }
});

app.listen(PORT, () => {
  console.log(`Nexus listening on http://localhost:${PORT}`);
});
