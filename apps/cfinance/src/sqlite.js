import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_FILE = process.env.DB_FILE || "./data/finance.db";
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

export let db;

export function initDb() {
  db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");

  // ORDERS
  db.prepare(`
    CREATE TABLE IF NOT EXISTS finance_orders (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      country TEXT NOT NULL,
      subtotal_sek REAL NOT NULL DEFAULT 0,
      shipping_sek REAL NOT NULL DEFAULT 0,
      tax_sek REAL NOT NULL DEFAULT 0,
      total_sek REAL NOT NULL DEFAULT 0,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT
    );
  `).run();

  // LINE ITEMS
  db.prepare(`
    CREATE TABLE IF NOT EXISTS finance_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      title TEXT,
      qty INTEGER NOT NULL DEFAULT 1,
      price_sek REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES finance_orders(id) ON DELETE CASCADE
    );
  `).run();

  // RATES (enkel key/value)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS finance_rates (
      code TEXT PRIMARY KEY,
      value REAL NOT NULL
    );
  `).run();

  // seed bas-rates om tomt
  const cnt = db.prepare(`SELECT COUNT(*) AS c FROM finance_rates`).get().c;
  if (!cnt) {
    const ins = db.prepare(`INSERT INTO finance_rates(code,value) VALUES(?,?)`);
    ins.run("SEK", 1.0);
    ins.run("EUR", 11.0);
    ins.run("USD", 10.0);
    ins.run("TRY", 3.0);
  }
}

export function getRates() {
  const rows = db.prepare(`SELECT code, value FROM finance_rates`).all();
  return Object.fromEntries(rows.map(r => [r.code, r.value]));
}

export function insertOrder(order, items) {
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO finance_orders(
        id, created_at, country,
        subtotal_sek, shipping_sek, tax_sek, total_sek,
        customer_name, customer_email, customer_phone
      ) VALUES (@id, @created_at, @country, @subtotal_sek, @shipping_sek, @tax_sek, @total_sek, @customer_name, @customer_email, @customer_phone);
    `).run(order);

    const insItem = db.prepare(`
      INSERT INTO finance_items(order_id, sku, title, qty, price_sek)
      VALUES (@order_id, @sku, @title, @qty, @price_sek);
    `);

    for (const it of items) insItem.run(it);
  });
  tx();
}

export function getOrder(id) {
  const o = db.prepare(`SELECT * FROM finance_orders WHERE id = ?`).get(id);
  if (!o) return null;
  const lines = db.prepare(`SELECT * FROM finance_items WHERE order_id = ?`).all(id);
  return { order: o, items: lines };
}

export function listOrders({ limit = 50, offset = 0 } = {}) {
  const orders = db.prepare(`
    SELECT * FROM finance_orders
    ORDER BY datetime(created_at) DESC
    LIMIT ? OFFSET ?;
  `).all(limit, offset);
  return orders;
}

export function computePnl() {
  const row = db.prepare(`
    SELECT
      COUNT(*) as orders,
      SUM(subtotal_sek) as revenueSEK,
      SUM(shipping_sek) as shippingSEK,
      SUM(tax_sek) as taxSEK,
      SUM(total_sek) as grossSEK
    FROM finance_orders;
  `).get();
  return {
    orders: row.orders || 0,
    revenueSEK: row.revenueSEK || 0,
    shippingSEK: row.shippingSEK || 0,
    taxSEK: row.taxSEK || 0,
    grossSEK: row.grossSEK || 0
  };
}
