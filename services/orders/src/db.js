import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR  = (process.env.DATA_DIR || path.resolve(__dirname, '../../.data')).trim();
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify({ orders: [] }, null, 2), 'utf8');
}
function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
}
function writeStore(data) {
  ensureStore();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// --- API-lager ---
export async function createOrder(items = [], totals = {}, meta = {}) {
  const store = readStore();
  const id = (meta.id || `ORD-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`);
  const now = new Date().toISOString();
  const order = {
    id, items, totals,
    status: meta.status || 'pending',
    customer: meta.customer || {},
    shippingAddress: meta.shippingAddress || {},
    billingAddress: meta.billingAddress || null,
    affiliate: meta.affiliate || null,
    createdAt: now, updatedAt: now,
  };
  store.orders.push(order);
  writeStore(store);
  return order;
}

export async function getOrder(id) {
  const store = readStore();
  return store.orders.find(o => String(o.id) === String(id)) || null;
}

export async function updateOrderStatus(id, status, patch = {}) {
  const store = readStore();
  const idx = store.orders.findIndex(o => String(o.id) === String(id));
  if (idx === -1) return null;
  store.orders[idx] = { ...store.orders[idx], status: status ?? store.orders[idx].status, ...patch, updatedAt: new Date().toISOString() };
  writeStore(store);
  return store.orders[idx];
}

export async function listOrders() {
  return readStore().orders.slice().sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}
