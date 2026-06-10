// core/orderStorage.js
// Enkel beständighet så kvitto/receipt kan läsa samma data oavsett sidladdning.

const KEY_LAST_ORDER = "cw.lastOrder";
const KEY_ORDERS = "cw.orders";

export function saveOrder(order) {
  try {
    localStorage.setItem(KEY_LAST_ORDER, JSON.stringify(order));
    const all = getAllOrders();
    all[order.id] = order;
    localStorage.setItem(KEY_ORDERS, JSON.stringify(all));
  } catch {}
}

export function getOrder(id) {
  try {
    const all = getAllOrders();
    if (id && all[id]) return all[id];
    const raw = localStorage.getItem(KEY_LAST_ORDER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAllOrders() {
  try {
    return JSON.parse(localStorage.getItem(KEY_ORDERS) || "{}");
  } catch {
    return {};
  }
}
