import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import fs from "node:fs";
import path from "node:path";

const DB_FILE = process.env.DB_FILE || "./data/finance.json";
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

const adapter = new JSONFile(DB_FILE);
export const db = new Low(adapter, {
  orders: [],   // { id, createdAt, customer, totals, country }
  items: [],    // { id, orderId, sku, title, qty, priceSEK }
  rates: { SEK: 1.0, EUR: 11.0, USD: 10.0, TRY: 3.0 }
});

export async function initDb() {
  await db.read();
  if (!db.data) {
    db.data = { orders: [], items: [], rates: { SEK:1, EUR:11, USD:10, TRY:3 }};
  }
  await db.write();
}

export async function insertOrder(order, items) {
  db.data.orders.push(order);
  for (const it of items) db.data.items.push(it);
  await db.write();
}

export function sum(selector) {
  return (db.data.orders?.reduce((a, o) => a + (Number(selector(o)) || 0), 0)) || 0;
}
