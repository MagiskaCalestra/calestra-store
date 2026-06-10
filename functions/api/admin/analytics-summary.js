// D:\WebProjects\Calestra\functions\api\admin\analytics-summary.js

const ALLOWED_ORIGINS = new Set([
  "https://magiskacalestra.se",
  "https://www.magiskacalestra.se",
  "https://admin.magiskacalestra.se",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5179",
  "http://localhost:5180",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:5179",
  "http://127.0.0.1:5180",
]);

function getOrigin(request) {
  return request.headers.get("Origin") || "";
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;

  // För tillfällig admin-test via tunnel.
  if (origin.endsWith(".trycloudflare.com")) return true;
  if (origin.endsWith(".ngrok-free.app")) return true;
  if (origin.endsWith(".ngrok.app")) return true;

  return false;
}

function corsHeaders(request) {
  const origin = getOrigin(request);
  const allowOrigin = isAllowedOrigin(origin)
    ? origin || "https://magiskacalestra.se"
    : "https://magiskacalestra.se";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-admin-token, X-Admin-Token, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function readAdminToken(request) {
  const auth = request.headers.get("Authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";

  return (
    bearer ||
    request.headers.get("x-admin-token") ||
    request.headers.get("X-Admin-Token") ||
    ""
  ).trim();
}

function isAdminAuthorized(request, env) {
  const sent = readAdminToken(request);

  const expected =
    String(env.ADMIN_TOKEN || "").trim() ||
    String(env.CALESTRA_ADMIN_TOKEN || "").trim() ||
    String(env.ADMIN_API_TOKEN || "").trim();

  // Om projektet redan använder annan auth i andra endpoints kan du byta detta senare.
  // Men endpointen ska aldrig vara öppen om token finns satt i Cloudflare.
  if (!expected) return true;

  return sent && sent === expected;
}

function emptySummary(range = "7d") {
  return {
    ok: true,
    source: "empty",
    configured: false,
    range,
    totals: {
      events: 0,
      sessions: 0,
      productViews: 0,
      cardClicks: 0,
      cartSignals: 0,
      checkoutSignals: 0,
      notifySignals: 0,
      preorderSignals: 0,
      soldOutViews: 0,
    },
    productSignals: [],
    funnel: {},
    timeseries: [],
    recent: [],
  };
}

function normalizeRange(value) {
  const s = cleanString(value || "7d", 20).toLowerCase();

  if (["day", "today", "1d"].includes(s)) return "day";
  if (["7d", "week"].includes(s)) return "7d";
  if (["30d", "month"].includes(s)) return "30d";
  if (["90d", "quarter"].includes(s)) return "90d";

  return "7d";
}

function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function firstNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function getEventType(row) {
  const name = cleanString(
    row?.eventType ||
      row?.event_type ||
      row?.type ||
      row?.name ||
      row?.event_name ||
      row?.eventName ||
      "",
    120
  );

  if (!name) return "";

  return name.includes(":") ? name.split(":")[0] : name;
}

function getProductSlug(row) {
  return cleanString(
    row?.productSlug ||
      row?.product_slug ||
      row?.productId ||
      row?.product_id ||
      row?.meta?.productSlug ||
      row?.meta?.slug ||
      "",
    180
  );
}

function getProductTitle(row) {
  return cleanString(
    row?.productTitle ||
      row?.product_title ||
      row?.title ||
      row?.meta?.productTitle ||
      row?.meta?.title ||
      "",
    220
  );
}

function signalFromScore(row) {
  const views = firstNumber(row.productViews, row.views);
  const cart = firstNumber(row.cartSignals, row.cart);
  const checkout = firstNumber(row.checkoutSignals, row.checkout);
  const notify = firstNumber(row.notifySignals, row.notify);
  const preorder = firstNumber(row.preorderSignals, row.preorder);
  const soldOut = firstNumber(row.soldOutViews, row.soldOut);

  const score =
    views * 1 +
    cart * 4 +
    checkout * 6 +
    notify * 3 +
    preorder * 4 +
    soldOut * 5;

  if (score >= 25 || checkout >= 3 || cart >= 6) return "Stark";
  if (score >= 8 || cart >= 2 || notify >= 2) return "Medel";
  return "Svag";
}

function normalizeWorkerSummary(input, range) {
  const data = input && typeof input === "object" ? input : {};

  const totals = data.totals || {};

  const productSignals = Array.isArray(data.productSignals)
    ? data.productSignals
    : Array.isArray(data.products)
      ? data.products
      : [];

  const normalizedProducts = productSignals.map((row) => {
    const out = {
      productSlug: cleanString(row.productSlug || row.product_slug || row.slug || "", 180),
      productTitle: cleanString(row.productTitle || row.product_title || row.title || "", 220),
      productViews: firstNumber(row.productViews, row.views, row.product_view),
      cardClicks: firstNumber(row.cardClicks, row.productCardClicks, row.card_clicks),
      cartSignals: firstNumber(row.cartSignals, row.cart, row.addToCart),
      checkoutSignals: firstNumber(row.checkoutSignals, row.checkout, row.beginCheckout),
      notifySignals: firstNumber(row.notifySignals, row.notify),
      preorderSignals: firstNumber(row.preorderSignals, row.preorder),
      soldOutViews: firstNumber(row.soldOutViews, row.soldOut),
      signal: cleanString(row.signal || "", 40),
    };

    if (!out.signal) out.signal = signalFromScore(out);
    return out;
  });

  return {
    ok: true,
    source: data.source || "worker",
    configured: true,
    range: data.range || range,
    totals: {
      events: firstNumber(totals.events, totals.total, data.events),
      sessions: firstNumber(totals.sessions, data.sessions),
      productViews: firstNumber(totals.productViews, totals.product_view, data.productViews),
      cardClicks: firstNumber(totals.cardClicks, totals.productCardClicks, data.cardClicks),
      cartSignals: firstNumber(totals.cartSignals, totals.cart, totals.addToCart, data.cartSignals),
      checkoutSignals: firstNumber(
        totals.checkoutSignals,
        totals.checkout,
        totals.beginCheckout,
        data.checkoutSignals
      ),
      notifySignals: firstNumber(totals.notifySignals, totals.notify, data.notifySignals),
      preorderSignals: firstNumber(totals.preorderSignals, totals.preorder, data.preorderSignals),
      soldOutViews: firstNumber(totals.soldOutViews, totals.soldOut, data.soldOutViews),
    },
    productSignals: normalizedProducts,
    funnel: data.funnel && typeof data.funnel === "object" ? data.funnel : {},
    timeseries: Array.isArray(data.timeseries) ? data.timeseries : [],
    recent: Array.isArray(data.recent) ? data.recent : [],
  };
}

function normalizeRowsSummary(rows, range) {
  const list = Array.isArray(rows) ? rows : [];

  const sessionSet = new Set();
  const products = new Map();
  const funnel = {};
  const timeseries = new Map();
  const recent = [];

  let events = 0;
  let productViews = 0;
  let cardClicks = 0;
  let cartSignals = 0;
  let checkoutSignals = 0;
  let notifySignals = 0;
  let preorderSignals = 0;
  let soldOutViews = 0;

  for (const row of list) {
    events += 1;

    const type = getEventType(row);
    const session = cleanString(row?.sessionId || row?.session_id || "", 120);
    const day = cleanString(row?.day || row?.createdAt || row?.created_at || "", 30).slice(0, 10);
    const productSlug = getProductSlug(row);
    const productTitle = getProductTitle(row);

    if (session) sessionSet.add(session);

    funnel[type] = Number(funnel[type] || 0) + 1;

    const dayRow = timeseries.get(day || "unknown") || {
      day: day || "unknown",
      events: 0,
      productViews: 0,
      cartSignals: 0,
      checkoutSignals: 0,
      notifySignals: 0,
    };

    dayRow.events += 1;

    let p = null;

    if (productSlug || productTitle) {
      const key = productSlug || productTitle;
      p = products.get(key) || {
        productSlug,
        productTitle,
        productViews: 0,
        cardClicks: 0,
        cartSignals: 0,
        checkoutSignals: 0,
        notifySignals: 0,
        preorderSignals: 0,
        soldOutViews: 0,
        signal: "Svag",
      };
    }

    if (type === "product_view") {
      productViews += 1;
      dayRow.productViews += 1;
      if (p) p.productViews += 1;
    }

    if (type === "product_card_click" || type === "product_open") {
      cardClicks += 1;
      if (p) p.cardClicks += 1;
    }

    if (type === "add_to_cart" || type === "add_to_cart_click" || type === "cart_open") {
      cartSignals += 1;
      dayRow.cartSignals += 1;
      if (p) p.cartSignals += 1;
    }

    if (type === "begin_checkout" || type === "checkout_start") {
      checkoutSignals += 1;
      dayRow.checkoutSignals += 1;
      if (p) p.checkoutSignals += 1;
    }

    if (type === "notify_click" || type === "notify_submit") {
      notifySignals += 1;
      dayRow.notifySignals += 1;
      if (p) p.notifySignals += 1;
    }

    if (type === "preorder_click") {
      preorderSignals += 1;
      if (p) p.preorderSignals += 1;
    }

    if (type === "sold_out_view") {
      soldOutViews += 1;
      if (p) p.soldOutViews += 1;
    }

    if (p) {
      p.signal = signalFromScore(p);
      products.set(productSlug || productTitle, p);
    }

    timeseries.set(dayRow.day, dayRow);

    recent.push({
      createdAt: row?.createdAt || row?.created_at || row?.ts || "",
      name: type,
      productSlug,
      productTitle,
      device: row?.device || "",
      path: row?.page || row?.path || "",
    });
  }

  return {
    ok: true,
    source: "rows",
    configured: true,
    range,
    totals: {
      events,
      sessions: sessionSet.size,
      productViews,
      cardClicks,
      cartSignals,
      checkoutSignals,
      notifySignals,
      preorderSignals,
      soldOutViews,
    },
    productSignals: [...products.values()].sort((a, b) => {
      const sa =
        a.productViews +
        a.cardClicks * 2 +
        a.cartSignals * 4 +
        a.checkoutSignals * 6 +
        a.notifySignals * 3 +
        a.preorderSignals * 4 +
        a.soldOutViews * 5;

      const sb =
        b.productViews +
        b.cardClicks * 2 +
        b.cartSignals * 4 +
        b.checkoutSignals * 6 +
        b.notifySignals * 3 +
        b.preorderSignals * 4 +
        b.soldOutViews * 5;

      return sb - sa;
    }),
    funnel,
    timeseries: [...timeseries.values()].sort((a, b) => String(b.day).localeCompare(String(a.day))),
    recent: recent.slice(-40).reverse(),
  };
}

async function tryWorkerSummary(request, env, range, limit, recent) {
  const WORKER_URL = String(env.ANALYTICS_WORKER_URL || "").replace(/\/+$/, "");

  const READ_KEY =
    String(env.ANALYTICS_READ_KEY || "").trim() ||
    String(env.ANALYTICS_ADMIN_KEY || "").trim() ||
    String(env.ANALYTICS_WRITE_KEY || "").trim();

  if (!WORKER_URL || !READ_KEY) {
    return null;
  }

  const url = new URL(`${WORKER_URL}/summary`);
  url.searchParams.set("range", range);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("recent", String(recent));

  const upstream = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Analytics-Key": READ_KEY,
      "X-Admin-Token": READ_KEY,
    },
  });

  const text = await upstream.text().catch(() => "");

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!upstream.ok) {
    return {
      ok: false,
      status: upstream.status,
      error: data?.error || data?.message || text || "worker_summary_failed",
    };
  }

  if (Array.isArray(data)) {
    return normalizeRowsSummary(data, range);
  }

  if (Array.isArray(data?.items)) {
    return normalizeRowsSummary(data.items, range);
  }

  if (Array.isArray(data?.events)) {
    return normalizeRowsSummary(data.events, range);
  }

  return normalizeWorkerSummary(data, range);
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(context.request),
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isAllowedOrigin(getOrigin(request))) {
    return json(request, { ok: false, error: "origin_not_allowed" }, 403);
  }

  if (!isAdminAuthorized(request, env)) {
    return json(request, { ok: false, error: "unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const range = normalizeRange(url.searchParams.get("range"));
  const limit = clampInt(url.searchParams.get("limit"), 40, 1, 500);
  const recent = clampInt(url.searchParams.get("recent"), 40, 1, 200);

  try {
    const workerSummary = await tryWorkerSummary(request, env, range, limit, recent);

    if (workerSummary?.ok) {
      return json(request, workerSummary, 200);
    }

    if (workerSummary && workerSummary.ok === false) {
      return json(
        request,
        {
          ok: false,
          error: workerSummary.error || "analytics_worker_summary_failed",
          status: workerSummary.status || 500,
        },
        502
      );
    }

    return json(request, emptySummary(range), 200);
  } catch (err) {
    return json(
      request,
      {
        ok: false,
        error: "analytics_summary_failed",
        message: String(err?.message || err),
      },
      500
    );
  }
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return onRequestOptions(context);
  if (context.request.method === "GET") return onRequestGet(context);

  return json(
    context.request,
    {
      ok: false,
      error: "method_not_allowed",
      allowed: ["GET", "OPTIONS"],
    },
    405
  );
}