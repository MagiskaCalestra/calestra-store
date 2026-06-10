// src/utils/orders.js

const STORAGE_KEY = "cw.orders.v1";

// Spara order lokalt (fake backend)
export function saveOrder(order) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];

    const id = order.id || order.orderId || order.order_id;
    const normalized = { ...order, id };

    list.push(normalized);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("saveOrder failed", err);
  }
}

// Hämta order
export function loadOrder(id) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const list = JSON.parse(raw);
    return (
      list.find(
        (o) => o.id === id || o.orderId === id || o.order_id === id
      ) || null
    );
  } catch (err) {
    console.warn("loadOrder failed", err);
    return null;
  }
}
