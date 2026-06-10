// apps/store-classic/src/api/orders.js
// Enkel lokal beställningshantering (localStorage) + stubbar för server

const KEY = "calestra.orders.v1";

function loadAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(arr) {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch (e) {
    console.error("orders.persist failed", e);
  }
}

function makeId() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `ORD-${t}-${r}`.toUpperCase();
}

/**
 * createOrder(items, totalsSEK, meta)
 * - items: [{id,title,qty,price,image}]
 * - totalsSEK: { sub,tax,ship,grand } (SEK låsning)
 * - meta: { name,email,phone,affiliate,shippingAddress,billingAddress }
 */
export async function createOrder(items = [], totalsSEK = {}, meta = {}) {
  const all = loadAll();
  const id = makeId();

  const order = {
    id,
    items: items.map(it => ({
      id: it.id,
      title: it.title,
      qty: Number(it.qty || 1),
      priceSEK: Number(it.price || 0),
      image: it.image || null,
    })),
    totalsSEK: {
      sub: Number(totalsSEK.sub || 0),
      tax: Number(totalsSEK.tax || 0),
      ship: Number(totalsSEK.ship || 0),
      grand: Number(totalsSEK.grand || 0),
    },
    customer: {
      name: meta?.name || "",
      email: meta?.email || "",
      phone: meta?.phone || "",
    },
    affiliate: meta?.affiliate || null,
    shippingAddress: meta?.shippingAddress || null,
    billingAddress: meta?.billingAddress || null,
    status: "CREATED",
    createdAt: new Date().toISOString(),
  };

  all.unshift(order);
  persist(all);

  // Returnera samma form som en server normalt skulle göra
  return { id: order.id, ok: true };
}

export async function readOrder(id) {
  const all = loadAll();
  return all.find(o => o.id === id) || null;
}

export async function listOrders({ limit = 200 } = {}) {
  const all = loadAll();
  return all.slice(0, limit);
}

export async function updateOrderStatus(id, status = "CREATED") {
  const all = loadAll();
  const i = all.findIndex(o => o.id === id);
  if (i === -1) return { ok: false };
  all[i].status = status;
  persist(all);
  return { ok: true };
}

export async function clearOrders() {
  persist([]);
  return { ok: true };
}
