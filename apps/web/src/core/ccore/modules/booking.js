// apps/web/src/core/ccore/modules/booking.js
// Booking SDK â€“ availability + hold + cart + order, nu med Rule Engine-stöd + betalningsmetadata.
import { emit } from "../eventBus";
import { addDays, dayOfWeek, endOfMonth, fmtDateISO, startOfMonth } from "../date";
import { getRules } from "./rules";

const LS_CART = "ccore_cart";
const LS_HOLD = "ccore_hold";
const LS_ORDERS = "ccore_orders";

// Grundpriser (kan senare flyttas till Pricing-modul)
const basePrice = { adult: 699, child: 499 };

function uid() { return Math.random().toString(36).slice(2, 10); }

/* ---------------- CART ---------------- */
export function getCart() {
  const raw = localStorage.getItem(LS_CART);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function createCart() {
  const cart = { id: `c_book_cart_${uid()}`, items: [], totals: { subtotal: 0, currency: "SEK" } };
  localStorage.setItem(LS_CART, JSON.stringify(cart));
  emit("booking.cart.updated", { cart });
  return cart;
}

export function setTickets({ date, parkId = "main", adults = 1, children = 0 }) {
  if (!date) throw new Error("Datum krävs");
  const rules = getRules();

  let cart = getCart() || createCart();
  const others = cart.items.filter(i => i.kind !== "TICKET");
  const item = { kind: "TICKET", date, parkId, guests: { adults, children } };
  cart.items = [...others, item];

  // Prissättning med gruppregel från Rule Engine
  const subtotal = adults * basePrice.adult + children * basePrice.child;
  const qualifies = (adults + children) >= (rules.groupDiscount?.threshold ?? 4);
  const pct = qualifies ? Number(rules.groupDiscount?.pct ?? 5) : 0;
  const discount = Math.round(subtotal * (pct / 100));
  cart.totals = { subtotal: subtotal - discount, currency: "SEK" };

  localStorage.setItem(LS_CART, JSON.stringify(cart));
  emit("booking.cart.updated", { cart });
  return cart;
}

export function clearCart() {
  localStorage.removeItem(LS_CART);
  emit("booking.cart.updated", { cart: null });
}

/* ---------------- AVAILABILITY (mock + rules) ---------------- */
export function getMonthAvailability(year, month /* 0-11 */) {
  const rules = getRules();
  const start = startOfMonth(new Date(year, month, 1));
  const end = endOfMonth(start);
  const out = {};
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const dow = dayOfWeek(d);
    const iso = fmtDateISO(d);

    // RULE: Blackout från admin
    if (rules.blackoutDates?.includes(iso)) {
      out[iso] = { date: iso, status: "blackout", capacityLeft: 0 };
      continue;
    }

    // Baslogik (helger gröna, vardagar varians; blackout styrs via admin-regler)
    let cap;
    if (dow === 6 || dow === 0) cap = 600;           // lör/sön
    else if (dow === 4 || dow === 5) cap = 350;      // tor/fre
    else if (dow === 2) cap = 180;                   // tis
    else cap = 220;                                  // mån/ons

    const jitter = (d.getDate() * 73) % 80;
    cap = Math.max(0, cap - jitter);

    let status = "green";
    if (cap < 120) status = "red";
    else if (cap < 260) status = "yellow";

    out[iso] = { date: iso, status, capacityLeft: cap };
  }
  return out;
}

/* ---------------- HOLD (tickets) ---------------- */
export function placeHold({ seconds = 600 } = {}) {
  const cart = getCart();
  if (!cart) throw new Error("Ingen varukorg");
  const item = cart.items.find(i => i.kind === "TICKET");
  if (!item) throw new Error("Inget biljettval i varukorgen");

  const hold = { id: `c_book_hold_${uid()}`, date: item.date, guests: item.guests, expiresAt: Date.now() + seconds * 1000 };
  localStorage.setItem(LS_HOLD, JSON.stringify(hold));
  emit("booking.hold.created", { hold });
  return hold;
}

export function getHold() {
  const raw = localStorage.getItem(LS_HOLD);
  if (!raw) return null;
  try {
    const h = JSON.parse(raw);
    if (Date.now() > h.expiresAt) {
      localStorage.removeItem(LS_HOLD);
      emit("booking.hold.expired", { hold: h });
      return null;
    }
    return h;
  } catch { return null; }
}

export function releaseHold() {
  const h = getHold();
  localStorage.removeItem(LS_HOLD);
  emit("booking.hold.released", { hold: h });
}

/* ---------------- ORDER (mock) ---------------- */
function loadOrders() {
  try { return JSON.parse(localStorage.getItem(LS_ORDERS) || "[]"); } catch { return []; }
}
function saveOrders(list) { localStorage.setItem(LS_ORDERS, JSON.stringify(list)); }

/**
 * confirmOrder â€“ skapar en mock-order.
 * @param {{contact: object, payment?: {token:string, provider:string}}} param0
 */
export function confirmOrder({ contact, payment } = {}) {
  const cart = getCart();
  if (!cart || !cart.items.length) throw new Error("Varukorgen är tom.");
  const order = {
    id: `c_book_order_${uid()}`,
    cartId: cart.id,
    amount: cart.totals.subtotal,
    currency: cart.totals.currency || "SEK",
    status: "PAID",
    contact: contact || {},
    payment: payment || null, // sparar token/provider om skickas in
    createdAt: new Date().toISOString(),
  };
  const list = loadOrders();
  list.push(order);
  saveOrders(list);
  emit("booking.order.created", { order });
  return order;
}

export function getOrderById(id) {
  const list = loadOrders();
  return list.find(o => o.id === id) || null;
}

export function getLastOrder() {
  const list = loadOrders();
  return list[list.length - 1] || null;
}

// Lista alla ordrar (senaste först)
export function getAllOrders() {
  const list = loadOrders();
  return list.slice().reverse();
}
