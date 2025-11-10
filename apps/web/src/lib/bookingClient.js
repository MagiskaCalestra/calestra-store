// Minimal mock av C-Core Booking tills backend finns.
// Lagrar en cart i localStorage och räknar fram ett pris.

const LS_CART = "ccore_cart";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function createCart() {
  const cart = { id: uid(), items: [], totals: { subtotal: 0, currency: "SEK" } };
  localStorage.setItem(LS_CART, JSON.stringify(cart));
  return cart;
}

export function getCart() {
  const raw = localStorage.getItem(LS_CART);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setTicketSelection({ date, parkId = "main", adults = 1, children = 0 }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Ogiltigt datum");
  if (adults < 0 || children < 0) throw new Error("Ogiltigt antal gäster");

  let cart = getCart() || createCart();
  // ersätt/uppdatera TICKET-item
  const item = { kind: "TICKET", date, parkId, guests: { adults, children } };
  const others = cart.items.filter(i => i.kind !== "TICKET");
  cart.items = [...others, item];

  // enkel pricingregel: vuxen 699, barn 499 (exempel), volymrabatt 5%
  const adultPrice = 699, childPrice = 499;
  const subtotal = adults * adultPrice + children * childPrice;
  const discount = (adults + children) >= 4 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal - discount;

  cart.totals = { subtotal: total, currency: "SEK" };

  localStorage.setItem(LS_CART, JSON.stringify(cart));
  return cart;
}

export function clearCart() {
  localStorage.removeItem(LS_CART);
}
