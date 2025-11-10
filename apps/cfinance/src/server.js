// apps/cfinance/src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

const app = express();

// ---- Konfig ----
const PORT = Number(process.env.PORT || 14600);
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'http://localhost:5175').split(',').map(s => s.trim());

// Rot för publika företagsfiler (symlink eller mapp). Default: store-classic/public/corp
const DEFAULT_CORP_ROOT = path.resolve(process.cwd(), '../../apps/store-classic/public/corp');
const CORP_ROOT = path.resolve(process.env.CORP_ROOT || DEFAULT_CORP_ROOT);

// ---- Middleware ----
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'), false);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

// ---- Health & root ----
app.get('/', (_req, res) => res.json({ ok: true, service: 'cfinance' }));
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

/* =========================================================
   Företagsdokument (statisk + list)
   - Serverar filer under /corp/<fil>
   - Returnerar lista via /corp/list
========================================================= */

// statisk
if (fs.existsSync(CORP_ROOT)) {
  app.use('/corp', express.static(CORP_ROOT, { index: false, fallthrough: true }));
}

// lista
app.get('/corp/list', async (_req, res) => {
  try {
    if (!fs.existsSync(CORP_ROOT)) {
      return res.json({ ok: true, files: [], rootMissing: true });
    }
    const all = await fs.promises.readdir(CORP_ROOT, { withFileTypes: true });
    // Lista endast filer (du kan utöka med rekursiv läsning senare)
    const files = all
      .filter(d => d.isFile())
      .map(d => ({
        name: d.name,
        url: `/corp/${encodeURIComponent(d.name)}`
      }));
    res.json({ ok: true, files, root: CORP_ROOT });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'corp_list_failed' });
  }
});

/* =========================================================
   Progress
   - /progress/track  (POST)  { amountSEK, currency, orderId, affiliate }
   - /progress/summary (GET)  { totalSEK, goalSEK, pct, lastUpdate }
========================================================= */

let progressTotalSEK = 0;
let lastProgressAt = null;

app.post('/progress/track', async (req, res) => {
  try {
    const p = req.body || {};
    const amt = Number(p.amountSEK || 0);
    if (amt > 0) {
      progressTotalSEK += amt;
      lastProgressAt = new Date().toISOString();
    }
    // här kan du i v2 persistera till sqlite/fil
    res.json({ ok: true, totalSEK: progressTotalSEK, lastUpdate: lastProgressAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'progress_failed' });
  }
});

app.get('/progress/summary', (_req, res) => {
  const goalSEK = 25_000_000_000; // 25 miljarder – justerbar
  const total = progressTotalSEK;
  const pct = goalSEK > 0 ? Math.min(100, (total / goalSEK) * 100) : 0;
  res.json({
    ok: true,
    totalSEK: Math.round(total),
    goalSEK,
    pct,
    lastUpdate: lastProgressAt
  });
});

/* =========================================================
   Finance ingest  (best-effort logg)
========================================================= */
app.post('/ingest', async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('[finance/ingest]', JSON.stringify(payload).slice(0, 1000));
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'ingest_failed' });
  }
});

/* =========================================================
   Pay (Stripe – valfritt)
========================================================= */
app.post('/pay/checkout', async (req, res) => {
  try {
    const { amountSek, orderPreview } = req.body || {};
    if (!amountSek || Number(amountSek) <= 0) {
      return res.status(400).json({ error: 'amountSek required' });
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      // Stripe ej satt än – svara utan att krascha
      return res.json({ ok: true, message: 'Stripe not configured', preview: orderPreview || null });
    }

    const stripe = (await import('stripe')).default(key);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'sek',
          unit_amount: Math.round(Number(amountSek) * 100),
          product_data: { name: 'Calestra Order', description: orderPreview?.orderId || '' }
        }
      }],
      success_url: (process.env.PUBLIC_SUCCESS_URL || 'http://localhost:5175/thanks/{CHECKOUT_SESSION_ID}'),
      cancel_url: (process.env.PUBLIC_CANCEL_URL || 'http://localhost:5175/cart')
    });

    res.json({ ok: true, url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'checkout_failed' });
  }
});

/* ---- Start ---- */
app.listen(PORT, () => {
  console.log(`[cfinance] listening on http://localhost:${PORT}`);
  console.log(`[cfinance] CORP_ROOT: ${CORP_ROOT}`);
});
