import { db } from "./db.js";

const insertStmt = db.prepare(`
  INSERT INTO events (
    ts, env, app, name, path, sessionId, userId, ref, currency, value, metaJson, ip, ua
  ) VALUES (
    @ts, @env, @app, @name, @path, @sessionId, @userId, @ref, @currency, @value, @metaJson, @ip, @ua
  )
`);

export function insertEvent(e) {
  insertStmt.run(e);
}

export function querySummary({ env, fromTs, toTs }) {
  const totalEvents = db
    .prepare(`SELECT COUNT(*) as n FROM events WHERE env=@env AND ts BETWEEN @fromTs AND @toTs`)
    .get({ env, fromTs, toTs })?.n ?? 0;

  const sessions = db
    .prepare(
      `SELECT COUNT(DISTINCT sessionId) as n 
       FROM events 
       WHERE env=@env AND ts BETWEEN @fromTs AND @toTs AND sessionId != ''`
    )
    .get({ env, fromTs, toTs })?.n ?? 0;

  const orders = db
    .prepare(
      `SELECT COUNT(*) as n 
       FROM events 
       WHERE env=@env AND ts BETWEEN @fromTs AND @toTs AND name='order_success'`
    )
    .get({ env, fromTs, toTs })?.n ?? 0;

  const revenue = db
    .prepare(
      `SELECT COALESCE(SUM(value),0) as n 
       FROM events 
       WHERE env=@env AND ts BETWEEN @fromTs AND @toTs AND name='order_success'`
    )
    .get({ env, fromTs, toTs })?.n ?? 0;

  const errors = db
    .prepare(
      `SELECT COUNT(*) as n 
       FROM events 
       WHERE env=@env AND ts BETWEEN @fromTs AND @toTs AND name='ui_error'`
    )
    .get({ env, fromTs, toTs })?.n ?? 0;

  return { totalEvents, sessions, orders, revenue, errors };
}

export function queryFunnel({ env, fromTs, toTs }) {
  // Funnel-steg
  const steps = [
    "page_view",
    "product_view",
    "add_to_cart",
    "checkout_start",
    "payment_initiated",
    "order_success",
  ];

  const rows = db
    .prepare(
      `SELECT name, COUNT(*) as n
       FROM events
       WHERE env=@env AND ts BETWEEN @fromTs AND @toTs AND name IN (${steps.map(() => "?").join(",")})
       GROUP BY name`
    )
    .all(env, fromTs, toTs, ...steps);

  const map = Object.fromEntries(rows.map((r) => [r.name, r.n]));
  const out = steps.map((name) => ({ name, n: map[name] || 0 }));
  return out;
}

export function queryTimeseries({ env, fromTs, toTs, bucketMs = 3600000, nameFilter = null }) {
  // bucketMs default 1h
  const whereName = nameFilter ? `AND name = @nameFilter` : "";
  const rows = db
    .prepare(
      `SELECT (ts / @bucketMs) * @bucketMs as t, COUNT(*) as n
       FROM events
       WHERE env=@env AND ts BETWEEN @fromTs AND @toTs
       ${whereName}
       GROUP BY t
       ORDER BY t ASC`
    )
    .all({ env, fromTs, toTs, bucketMs, nameFilter });

  return rows.map((r) => ({ t: r.t, n: r.n }));
}

export function queryRecentErrors({ env, limit = 30 }) {
  const rows = db
    .prepare(
      `SELECT ts, app, path, metaJson
       FROM events
       WHERE env=@env AND name='ui_error'
       ORDER BY ts DESC
       LIMIT @limit`
    )
    .all({ env, limit });

  return rows.map((r) => {
    let meta = {};
    try {
      meta = JSON.parse(r.metaJson || "{}");
    } catch {}
    return { ts: r.ts, app: r.app, path: r.path, meta };
  });
}
