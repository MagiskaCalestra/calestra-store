// D:\WebProjects\Calestra\apps\store-classic\src\analytics\analyticsClient.js
// apps/store-classic/src/analytics/analyticsClient.js
//
// Calestra Signal Engine™
// Skickar anonym butikstatistik till same-origin Pages Function:
//   POST /api/analytics/events
//
// Den Pages Function du redan har skickar vidare till Analytics Worker med secret key.
// => Inga client-side secrets.
// => Ingen personspårning.
// => Analytics får aldrig krascha butiken.

const ENDPOINT = "/api/analytics/events";

const QUEUE_KEY = "cw.analytics.queue.v1";
const SESSION_KEY = "cw.analytics.session.v1";

const MAX_QUEUE_SIZE = 800;

function canUseBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function nowTs() {
  return Date.now();
}

function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function cleanNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function detectEnv() {
  if (!canUseBrowser()) return "prod";

  const p = String(window.location.port || "");
  const h = String(window.location.hostname || "").toLowerCase();

  if (p === "5175") return "green";
  if (p === "5176") return "blue";
  if (h === "localhost" || h === "127.0.0.1") return "local";

  return "prod";
}

function detectDevice() {
  if (!canUseBrowser()) return "unknown";

  const w = Number(window.innerWidth || 0);
  if (w > 0 && w < 768) return "mobile";
  if (w >= 768 && w < 1100) return "tablet";
  if (w >= 1100) return "desktop";

  return "unknown";
}

function getLanguage() {
  if (!canUseBrowser()) return "sv";

  return cleanString(
    document.documentElement?.lang ||
      window.navigator?.language ||
      "sv",
    20
  );
}

function getCurrencyFallback() {
  if (!canUseBrowser()) return "SEK";

  try {
    return cleanString(
      window.localStorage.getItem("cw.currency") ||
        window.localStorage.getItem("currency") ||
        "SEK",
      8
    );
  } catch {
    return "SEK";
  }
}

function safeJsonParse(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function loadQueue() {
  if (!canUseBrowser()) return [];

  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const arr = raw ? safeJsonParse(raw, []) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveQueue(items) {
  if (!canUseBrowser()) return;

  try {
    localStorage.setItem(
      QUEUE_KEY,
      JSON.stringify((Array.isArray(items) ? items : []).slice(-MAX_QUEUE_SIZE))
    );
  } catch {
    // noop
  }
}

function getSessionId() {
  if (!canUseBrowser()) return null;

  try {
    let sid = localStorage.getItem(SESSION_KEY);

    if (!sid) {
      sid =
        typeof crypto !== "undefined" && crypto?.randomUUID
          ? crypto.randomUUID()
          : `sid_${Math.random().toString(16).slice(2)}_${Date.now()}`;

      localStorage.setItem(SESSION_KEY, sid);
    }

    return cleanString(sid, 90);
  } catch {
    return null;
  }
}

function sanitizeMeta(meta) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined;

  const out = {};

  for (const [key, value] of Object.entries(meta)) {
    const safeKey = cleanString(key, 70).replace(/[^a-zA-Z0-9_:-]/g, "");
    if (!safeKey) continue;

    if (value == null) continue;

    if (typeof value === "number") {
      out[safeKey] = Number.isFinite(value) ? value : 0;
      continue;
    }

    if (typeof value === "boolean") {
      out[safeKey] = value;
      continue;
    }

    if (typeof value === "string") {
      out[safeKey] = cleanString(value, 300);
      continue;
    }

    if (Array.isArray(value)) {
      out[safeKey] = value.slice(0, 30).map((x) => cleanString(x, 160));
    }
  }

  return Object.keys(out).length ? out : undefined;
}

function getProductSlug(product) {
  return cleanString(
    product?.slug ||
      product?.productSlug ||
      product?.handle ||
      product?.product?.slug ||
      product?.product?.handle ||
      "",
    160
  );
}

function getProductTitle(product) {
  return cleanString(
    product?.title ||
      product?.name ||
      product?.productTitle ||
      product?.product?.title ||
      product?.product?.name ||
      "",
    220
  );
}

function getProductCategory(product) {
  const raw =
    product?.category ||
    product?.primaryCategory ||
    product?.product?.category ||
    "";

  if (Array.isArray(raw)) return cleanString(raw[0] || "", 120);
  return cleanString(raw, 120);
}

function getProductPrice(product) {
  return cleanNumber(
    product?.priceSEK ??
      product?.priceSek ??
      product?.price ??
      product?.product?.priceSEK ??
      product?.product?.priceSek ??
      product?.product?.price,
    null
  );
}

function getCurrentPage() {
  if (!canUseBrowser()) return "";

  return cleanString(
    `${window.location.pathname || "/"}${window.location.search || ""}`,
    512
  );
}

function normalizePayload(event) {
  const ts = Number(event?.ts || nowTs());
  const session_id = event?.session_id || getSessionId();

  const type = cleanString(event?.type || "event", 40);
  const name = cleanString(event?.name || "", 140);

  const event_name = name
    ? `${type}:${name}`.slice(0, 64)
    : type.slice(0, 64);

  const page = cleanString(
    event?.page || (canUseBrowser() ? window.location.pathname : "") || "",
    512
  );

  const referrer = cleanString(
    event?.referrer || (canUseBrowser() ? document.referrer : "") || "",
    512
  );

  const product_id = event?.product_id
    ? cleanString(event.product_id, 128)
    : null;

  const product_slug = event?.product_slug
    ? cleanString(event.product_slug, 160)
    : null;

  const product_title = event?.product_title
    ? cleanString(event.product_title, 220)
    : null;

  const category = event?.category
    ? cleanString(event.category, 120)
    : null;

  const price =
    cleanNumber(event?.price, null) ??
    cleanNumber(event?.value, null) ??
    null;

  const currency = cleanString(event?.currency || getCurrencyFallback(), 8);

  const cart_value = cleanNumber(event?.cart_value, null);
  const qty = cleanNumber(event?.qty, null);

  const meta = sanitizeMeta(event?.meta);

  return {
    event_name,
    ts,
    session_id,
    page,
    referrer,
    product_id,
    product_slug,
    product_title,
    category,
    price,
    currency,
    cart_value,
    qty,
    meta,
    env: detectEnv(),
    app: cleanString(event?.app || "store-classic", 60),
    device: detectDevice(),
    language: getLanguage(),
  };
}

async function postEvent(item) {
  if (!canUseBrowser()) return false;

  const payload = normalizePayload(item);
  const body = JSON.stringify(payload);

  try {
    const blob = new Blob([body], { type: "application/json" });

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(ENDPOINT, blob)
    ) {
      return true;
    }
  } catch {
    // fallback to fetch below
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": payload.session_id || "",
    },
    body,
    keepalive: true,
  });

  return res.ok;
}

let flushing = false;

export async function flushAnalyticsQueue({ max = 50 } = {}) {
  if (!canUseBrowser()) return;
  if (flushing) return;

  flushing = true;

  try {
    const q = loadQueue();
    if (!q.length) return;

    const batch = q.slice(0, max);
    let sent = 0;

    for (const item of batch) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await postEvent(item).catch(() => false);
      if (!ok) break;
      sent += 1;
    }

    if (sent > 0) {
      const rest = q.slice(sent);
      saveQueue(rest);
    }
  } finally {
    flushing = false;
  }
}

export function trackEvent(
  type,
  name,
  {
    value,
    meta,
    app,
    page,
    product_id,
    product_slug,
    product_title,
    category,
    price,
    currency,
    cart_value,
    qty,
  } = {}
) {
  if (!canUseBrowser()) return false;

  try {
    const payload = {
      ts: nowTs(),
      app: app || "store-classic",
      type: cleanString(type || "event", 40),
      name: cleanString(name || "", 140),
      value: Number.isFinite(value) ? value : undefined,

      page: page || getCurrentPage(),
      product_id,
      product_slug,
      product_title,
      category,
      price,
      currency,
      cart_value,
      qty,
      meta: sanitizeMeta(meta),

      session_id: getSessionId(),
      referrer: document.referrer || "",
    };

    const q = loadQueue();
    q.push(payload);
    saveQueue(q);

    flushAnalyticsQueue({ max: 30 }).catch(() => {});

    return true;
  } catch {
    return false;
  }
}

export function trackPageView(pathname, extraMeta = {}) {
  return trackEvent("page_view", pathname || getCurrentPage(), {
    meta: {
      ...extraMeta,
      title: canUseBrowser() ? document.title || "" : "",
    },
  });
}

export function trackShopView(extraMeta = {}) {
  return trackEvent("shop_view", "shop", {
    page: getCurrentPage(),
    meta: extraMeta,
  });
}

export function trackProductView(product = {}, extraMeta = {}) {
  return trackEvent("product_view", getProductSlug(product) || "product", {
    product_id: product?.id || getProductSlug(product),
    product_slug: getProductSlug(product),
    product_title: getProductTitle(product),
    category: getProductCategory(product),
    price: getProductPrice(product),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: {
      productSlug: getProductSlug(product),
      productTitle: getProductTitle(product),
      ...extraMeta,
    },
  });
}

export function trackProductCardClick(product = {}, extraMeta = {}) {
  return trackEvent("product_card_click", getProductSlug(product) || "product", {
    product_id: product?.id || getProductSlug(product),
    product_slug: getProductSlug(product),
    product_title: getProductTitle(product),
    category: getProductCategory(product),
    price: getProductPrice(product),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: {
      productSlug: getProductSlug(product),
      productTitle: getProductTitle(product),
      ...extraMeta,
    },
  });
}

export function trackProductOpen(product = {}, extraMeta = {}) {
  return trackEvent("product_open", getProductSlug(product) || "product", {
    product_id: product?.id || getProductSlug(product),
    product_slug: getProductSlug(product),
    product_title: getProductTitle(product),
    category: getProductCategory(product),
    price: getProductPrice(product),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: {
      productSlug: getProductSlug(product),
      productTitle: getProductTitle(product),
      ...extraMeta,
    },
  });
}

export function trackAddToCartClick(product = {}, extraMeta = {}) {
  return trackEvent("add_to_cart_click", getProductSlug(product) || "product", {
    product_id: product?.id || getProductSlug(product),
    product_slug: getProductSlug(product),
    product_title: getProductTitle(product),
    category: getProductCategory(product),
    price: getProductPrice(product),
    currency: extraMeta?.currency || getCurrencyFallback(),
    qty: cleanNumber(extraMeta?.qty, null),
    meta: {
      productSlug: getProductSlug(product),
      productTitle: getProductTitle(product),
      ...extraMeta,
    },
  });
}

export function trackAddToCart(product = {}, extraMeta = {}) {
  return trackEvent("add_to_cart", getProductSlug(product) || "product", {
    product_id: product?.id || getProductSlug(product),
    product_slug: getProductSlug(product),
    product_title: getProductTitle(product),
    category: getProductCategory(product),
    price: getProductPrice(product),
    currency: extraMeta?.currency || getCurrencyFallback(),
    qty: cleanNumber(extraMeta?.qty ?? product?.qty, 1),
    meta: {
      productSlug: getProductSlug(product),
      productTitle: getProductTitle(product),
      ...extraMeta,
    },
  });
}

export function trackCartOpen(extraMeta = {}) {
  return trackEvent("cart_open", "cart", {
    page: getCurrentPage(),
    cart_value: cleanNumber(extraMeta?.cartValue ?? extraMeta?.cart_value, null),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: extraMeta,
  });
}

export function trackCartItemInc(item = {}, extraMeta = {}) {
  return trackEvent("cart_item_inc", getProductSlug(item) || "item", {
    product_id: item?.id || getProductSlug(item),
    product_slug: getProductSlug(item),
    product_title: getProductTitle(item),
    price: getProductPrice(item),
    qty: cleanNumber(extraMeta?.qty ?? item?.qty, 1),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: extraMeta,
  });
}

export function trackCartItemDec(item = {}, extraMeta = {}) {
  return trackEvent("cart_item_dec", getProductSlug(item) || "item", {
    product_id: item?.id || getProductSlug(item),
    product_slug: getProductSlug(item),
    product_title: getProductTitle(item),
    price: getProductPrice(item),
    qty: cleanNumber(extraMeta?.qty ?? item?.qty, 1),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: extraMeta,
  });
}

export function trackCartItemRemove(item = {}, extraMeta = {}) {
  return trackEvent("cart_item_remove", getProductSlug(item) || "item", {
    product_id: item?.id || getProductSlug(item),
    product_slug: getProductSlug(item),
    product_title: getProductTitle(item),
    price: getProductPrice(item),
    qty: cleanNumber(extraMeta?.qty ?? item?.qty, 1),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: extraMeta,
  });
}

export function trackBeginCheckout(extraMeta = {}) {
  return trackEvent("begin_checkout", "checkout", {
    cart_value: cleanNumber(extraMeta?.cartValue ?? extraMeta?.cart_value, null),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: extraMeta,
  });
}

export function trackCheckoutStart(extraMeta = {}) {
  return trackEvent("checkout_start", "checkout", {
    cart_value: cleanNumber(extraMeta?.cartValue ?? extraMeta?.cart_value, null),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: extraMeta,
  });
}

export function trackCheckoutFormTouch(extraMeta = {}) {
  return trackEvent("checkout_form_touch", cleanString(extraMeta?.field || "field", 80), {
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: extraMeta,
  });
}

export function trackPurchaseAttempt(extraMeta = {}) {
  return trackEvent("purchase_attempt", "purchase", {
    cart_value: cleanNumber(extraMeta?.cartValue ?? extraMeta?.cart_value ?? extraMeta?.total, null),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: extraMeta,
  });
}

export function trackPurchaseSuccess({ orderId, total, currency, items } = {}) {
  return trackEvent("purchase_success", String(orderId || "order"), {
    value: Number.isFinite(total) ? total : undefined,
    currency: currency || getCurrencyFallback(),
    cart_value: Number.isFinite(total) ? total : undefined,
    meta: {
      orderId,
      total,
      currency: currency || getCurrencyFallback(),
      items,
    },
  });
}

export function trackPurchaseFail({ reason, step } = {}) {
  return trackEvent("purchase_fail", String(step || "checkout"), {
    meta: { reason, step },
  });
}

export function trackNotifyClick(product = {}, extraMeta = {}) {
  return trackEvent("notify_click", getProductSlug(product) || "product", {
    product_id: product?.id || getProductSlug(product),
    product_slug: getProductSlug(product),
    product_title: getProductTitle(product),
    category: getProductCategory(product),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: {
      productSlug: getProductSlug(product),
      productTitle: getProductTitle(product),
      ...extraMeta,
    },
  });
}

export function trackNotifySubmit(product = {}, extraMeta = {}) {
  return trackEvent("notify_submit", getProductSlug(product) || "product", {
    product_id: product?.id || getProductSlug(product),
    product_slug: getProductSlug(product),
    product_title: getProductTitle(product),
    category: getProductCategory(product),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: {
      productSlug: getProductSlug(product),
      productTitle: getProductTitle(product),
      ...extraMeta,
    },
  });
}

export function trackPreorderClick(product = {}, extraMeta = {}) {
  return trackEvent("preorder_click", getProductSlug(product) || "product", {
    product_id: product?.id || getProductSlug(product),
    product_slug: getProductSlug(product),
    product_title: getProductTitle(product),
    category: getProductCategory(product),
    price: getProductPrice(product),
    currency: extraMeta?.currency || getCurrencyFallback(),
    qty: cleanNumber(extraMeta?.qty, null),
    meta: {
      productSlug: getProductSlug(product),
      productTitle: getProductTitle(product),
      ...extraMeta,
    },
  });
}

export function trackSoldOutView(product = {}, extraMeta = {}) {
  return trackEvent("sold_out_view", getProductSlug(product) || "product", {
    product_id: product?.id || getProductSlug(product),
    product_slug: getProductSlug(product),
    product_title: getProductTitle(product),
    category: getProductCategory(product),
    currency: extraMeta?.currency || getCurrencyFallback(),
    meta: {
      productSlug: getProductSlug(product),
      productTitle: getProductTitle(product),
      ...extraMeta,
    },
  });
}

export function trackLanguageChange(language, extraMeta = {}) {
  return trackEvent("language_change", cleanString(language || "unknown", 40), {
    meta: {
      language,
      ...extraMeta,
    },
  });
}

export function trackCurrencyChange(currency, extraMeta = {}) {
  return trackEvent("currency_change", cleanString(currency || "unknown", 20), {
    currency: currency || getCurrencyFallback(),
    meta: {
      currency,
      ...extraMeta,
    },
  });
}

export function trackFilterChange(filterName, extraMeta = {}) {
  return trackEvent("filter_change", cleanString(filterName || "filter", 80), {
    meta: extraMeta,
  });
}

export function trackSearch(query, extraMeta = {}) {
  return trackEvent("search", "shop_search", {
    meta: {
      query: cleanString(query, 180),
      ...extraMeta,
    },
  });
}

export function trackCtaClick(name, extraMeta = {}) {
  return trackEvent("cta_click", cleanString(name || "cta", 100), {
    meta: extraMeta,
  });
}

try {
  if (canUseBrowser()) {
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushAnalyticsQueue({ max: 80 }).catch(() => {});
      }
    });

    window.addEventListener("pagehide", () => {
      flushAnalyticsQueue({ max: 80 }).catch(() => {});
    });
  }
} catch {
  // noop
}

export default {
  trackEvent,
  trackPageView,
  trackShopView,
  trackProductView,
  trackProductCardClick,
  trackProductOpen,
  trackAddToCartClick,
  trackAddToCart,
  trackCartOpen,
  trackCartItemInc,
  trackCartItemDec,
  trackCartItemRemove,
  trackBeginCheckout,
  trackCheckoutStart,
  trackCheckoutFormTouch,
  trackPurchaseAttempt,
  trackPurchaseSuccess,
  trackPurchaseFail,
  trackNotifyClick,
  trackNotifySubmit,
  trackPreorderClick,
  trackSoldOutView,
  trackLanguageChange,
  trackCurrencyChange,
  trackFilterChange,
  trackSearch,
  trackCtaClick,
  flushAnalyticsQueue,
};