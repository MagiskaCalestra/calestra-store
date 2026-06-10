// apps/store-classic/src/utils/money.js

const BASE_CURRENCY = "SEK";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeStr(v) {
  return String(v ?? "").trim();
}

function round2(n) {
  return Math.round(safeNumber(n) * 100) / 100;
}

/* =========================================================
 *  Valuta-konvertering
 * ======================================================= */

/**
 * Konvertera från SEK till vald valuta.
 * rates är SEK->valuta (t.ex. EUR:0.089)
 */
export function convertFromSEK(amountSEK, currency = BASE_CURRENCY, rates = {}) {
  const amt = safeNumber(amountSEK);
  const cur = safeStr(currency).toUpperCase() || BASE_CURRENCY;

  if (cur === BASE_CURRENCY) return amt;

  const rate = safeNumber(rates[cur]);
  if (!rate) return amt; // om vi saknar kurs, visa SEK-beloppet

  return amt * rate;
}

/**
 * Konvertera till SEK från vald valuta.
 */
export function convertToSEK(amount, currency = BASE_CURRENCY, rates = {}) {
  const amt = safeNumber(amount);
  const cur = safeStr(currency).toUpperCase() || BASE_CURRENCY;

  if (cur === BASE_CURRENCY) return amt;

  const rate = safeNumber(rates[cur]);
  if (!rate) return amt;

  return amt / rate;
}

/**
 * Kompatibilitet: gammalt namn som användes i Product.jsx m.m.
 * Behandla SEK-priset som "baspris".
 */
export function convertBasePrice(sekPrice, currency = BASE_CURRENCY, rates = {}) {
  return convertFromSEK(sekPrice, currency, rates);
}

/**
 * Enkel psykologisk prissättning:
 *  - Lämna ifred om priset redan slutar på .95 eller .99
 *  - Annars => golv + 0.99
 */
export function applyPsychological(amount, currency = BASE_CURRENCY) {
  const n = safeNumber(amount);
  if (n <= 0) return n;

  const base = Math.floor(n);
  const cents = Math.round((n - base) * 100);

  if (cents === 95 || cents === 99) return n;

  return base + 0.99;
}

/**
 * Formatera pengar med Intl.NumberFormat.
 */
export function formatMoney(amount, currency = BASE_CURRENCY, locale = "sv-SE") {
  const n = safeNumber(amount);
  const cur = safeStr(currency).toUpperCase() || BASE_CURRENCY;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${cur}`;
  }
}

/* =========================================================
 *  Digital / fysisk logik
 * ======================================================= */

function tagsSayDigital(tags) {
  if (!Array.isArray(tags)) return false;

  const t = tags.map((x) => String(x || "").toLowerCase());

  return (
    t.includes("digital") ||
    t.includes("download") ||
    t.includes("pdf") ||
    t.includes("midi")
  );
}

/**
 * Robust digital-detektion:
 * - item.isDigital / product.isDigital
 * - requiresShipping === false (digital)
 * - shipping.mode === "digital"
 * - type === "digital"/"download"/"pdf"
 * - tags innehåller digital/download/pdf
 */
export function itemIsDigital(item) {
  if (!item) return false;

  const p = item.product || {};

  if (typeof item.isDigital === "boolean") return item.isDigital;
  if (typeof p.isDigital === "boolean") return p.isDigital;

  if (typeof item.requiresShipping === "boolean" && item.requiresShipping === false) {
    return true;
  }

  if (typeof p.requiresShipping === "boolean" && p.requiresShipping === false) {
    return true;
  }

  const mode = safeStr(item?.shipping?.mode || p?.shipping?.mode).toLowerCase();
  if (mode === "digital" || mode === "download") return true;

  const type = safeStr(item.type || p.type).toLowerCase();
  if (type === "digital" || type === "download" || type === "pdf" || type === "midi") {
    return true;
  }

  if (tagsSayDigital(item.tags)) return true;
  if (tagsSayDigital(p.tags)) return true;

  return false;
}

export function hasPhysicalItems(items) {
  if (!Array.isArray(items)) return false;

  return items.some((it) => !itemIsDigital(it));
}

/* =========================================================
 *  Fraktregler (SEK) – SINGLE SOURCE OF TRUTH
 * ======================================================= */

export const SHIPPING_TABLE = {
  SE: { threshold: 500, fee: 49 },
  NO: { threshold: 700, fee: 89 },
  FI: { threshold: 700, fee: 89 },
  DK: { threshold: 600, fee: 69 },
  DE: { threshold: 700, fee: 89 },
  NL: { threshold: 700, fee: 89 },
  GB: { threshold: 800, fee: 99 },
  US: { threshold: 120, fee: 132 }, // obs: detta är SEK-tröskel i nuvarande modell
  TR: { threshold: 2000, fee: 149 },
  FR: { threshold: 700, fee: 89 },
  ES: { threshold: 700, fee: 89 },
};

export function shippingRulesSEK(subSEK, country = "SE") {
  const c = safeStr(country || "SE").toUpperCase();
  const r = SHIPPING_TABLE[c] || SHIPPING_TABLE.SE;
  const thresholdSEK = safeNumber(r.threshold);
  const feeSEK = safeNumber(r.fee);
  const isFree = safeNumber(subSEK) >= thresholdSEK;

  return {
    isFree,
    feeSEK: isFree ? 0 : feeSEK,
    thresholdSEK,
  };
}

/* =========================================================
 *  Rabattmotor – SINGLE SOURCE OF TRUTH
 * ======================================================= */

function normalizeDiscountType(value) {
  const s = safeStr(value).toLowerCase();

  if (["fixed", "amount", "sek", "cash", "fast"].includes(s)) return "fixed";
  if (["shipping", "free_shipping", "free-shipping", "frakt"].includes(s)) {
    return "shipping";
  }
  if (["percent", "percentage", "%", "procent"].includes(s)) return "percent";

  return s || "";
}

function getDiscountNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }

  return 0;
}

function hasOwnNumber(obj, keys = []) {
  if (!obj || typeof obj !== "object") return false;

  return keys.some((key) => {
    if (!(key in obj)) return false;
    const n = Number(obj[key]);
    return Number.isFinite(n);
  });
}

/**
 * Viktigt:
 * - itemDiscountSek = rabatt på produkter
 * - shippingDiscountSek = rabatt på frakt
 * - totalDiscountSek = produkt-rabatt + fraktrabatt
 *
 * Fri frakt får aldrig räknas som produkt-rabatt.
 */
export function normalizeDiscountMeta(discountMeta = {}) {
  const d = discountMeta && typeof discountMeta === "object" ? discountMeta : {};

  const manualCode = safeStr(d.manualCode || "");
  const manualValid = !!d.manualCodeValid;
  const manualApplied = !!d.manualDiscountApplied || (!!manualCode && manualValid);

  const discountCode = safeStr(
    d.discountCode ||
      d.code ||
      d.manualCode ||
      d.campaignCode ||
      d.promoCode ||
      ""
  );

  const discountType = normalizeDiscountType(
    d.discountType ||
      d.type ||
      d.manualDiscountType ||
      d.campaignDiscountType ||
      ""
  );

  const percent = Math.max(
    0,
    getDiscountNumber(
      d.discountPercent,
      d.percent,
      d.manualDiscountPercent,
      d.campaignDiscountPercent
    )
  );

  const fixedSek = Math.max(
    0,
    getDiscountNumber(
      d.discountFixedSek,
      d.fixedSek,
      d.manualDiscountFixedSek,
      d.campaignDiscountFixedSek
    )
  );

  const itemDiscountSek = Math.max(
    0,
    getDiscountNumber(
      d.itemDiscountSek,
      d.itemDiscountSEK,
      d.productDiscountSek,
      d.productDiscountSEK,
      d.manualItemDiscountSek,
      d.campaignItemDiscountSek
    )
  );

  const explicitDiscountSek = Math.max(
    0,
    getDiscountNumber(
      d.discountSek,
      d.discountSEK,
      d.discountAmountSEK,
      d.discountAmountSek,
      d.manualDiscountAmountSek,
      d.campaignDiscountAmountSek
    )
  );

  const totalDiscountSek = Math.max(
    0,
    getDiscountNumber(
      d.totalDiscountSek,
      d.totalDiscountSEK,
      d.totalDiscountAmountSek,
      d.totalDiscountAmountSEK
    )
  );

  const explicitShippingDiscountSek = Math.max(
    0,
    getDiscountNumber(
      d.shippingDiscountSek,
      d.shippingDiscountSEK,
      d.manualShippingDiscountSek,
      d.campaignShippingDiscountSek,
      d.freeShippingDiscountSek
    )
  );

  const freeShipping = !!(
    d.freeShipping ||
    d.manualFreeShipping ||
    d.campaignFreeShipping ||
    d.freeShippingApplied ||
    discountType === "shipping"
  );

  return {
    ...d,
    discountCode,
    discountType,
    discountPercent: percent,
    discountFixedSek: fixedSek,

    itemDiscountSek,
    itemDiscountSEK: itemDiscountSek,

    discountSek: explicitDiscountSek,
    discountSEK: explicitDiscountSek,
    discountAmountSek: explicitDiscountSek,
    discountAmountSEK: explicitDiscountSek,

    totalDiscountSek,
    totalDiscountSEK: totalDiscountSek,

    shippingDiscountSek: explicitShippingDiscountSek,
    shippingDiscountSEK: explicitShippingDiscountSek,

    freeShipping,
    hasManualDiscount: !!d.hasManualDiscount || !!manualCode,
    manualDiscountApplied: manualApplied,

    hasPendingDiscount:
      !!d.hasPendingDiscount ||
      !!discountCode ||
      percent > 0 ||
      fixedSek > 0 ||
      itemDiscountSek > 0 ||
      explicitDiscountSek > 0 ||
      totalDiscountSek > 0 ||
      explicitShippingDiscountSek > 0 ||
      freeShipping,
  };
}

export function calculateDiscountBreakdownSEK({
  subtotalSek = 0,
  shippingSek = 0,
  discountMeta = {},
} = {}) {
  const subtotal = round2(Math.max(0, safeNumber(subtotalSek)));
  const shipping = round2(Math.max(0, safeNumber(shippingSek)));
  const meta = normalizeDiscountMeta(discountMeta);

  const hasExplicitItemDiscount = hasOwnNumber(discountMeta, [
    "itemDiscountSek",
    "itemDiscountSEK",
    "productDiscountSek",
    "productDiscountSEK",
    "manualItemDiscountSek",
    "campaignItemDiscountSek",
  ]);

  const hasExplicitTotalDiscount = hasOwnNumber(discountMeta, [
    "totalDiscountSek",
    "totalDiscountSEK",
    "totalDiscountAmountSek",
    "totalDiscountAmountSEK",
  ]);

  const hasGenericDiscountAmount = hasOwnNumber(discountMeta, [
    "discountSek",
    "discountSEK",
    "discountAmountSek",
    "discountAmountSEK",
    "manualDiscountAmountSek",
    "campaignDiscountAmountSek",
  ]);

  const hasExplicitShippingDiscount = hasOwnNumber(discountMeta, [
    "shippingDiscountSek",
    "shippingDiscountSEK",
    "manualShippingDiscountSek",
    "campaignShippingDiscountSek",
    "freeShippingDiscountSek",
  ]);

  let itemDiscountSek = 0;
  let shippingDiscountSek = 0;

  if (meta.discountType === "percent" && meta.discountPercent > 0) {
    itemDiscountSek = subtotal * (meta.discountPercent / 100);
  }

  if (meta.discountType === "fixed" && meta.discountFixedSek > 0) {
    itemDiscountSek = Math.max(itemDiscountSek, meta.discountFixedSek);
  }

  if (hasExplicitItemDiscount && meta.itemDiscountSek > 0) {
    itemDiscountSek = Math.max(itemDiscountSek, meta.itemDiscountSek);
  }

  if (meta.freeShipping) {
    shippingDiscountSek = shipping;
  }

  if (hasExplicitShippingDiscount && meta.shippingDiscountSek > 0) {
    shippingDiscountSek = Math.max(shippingDiscountSek, meta.shippingDiscountSek);
  }

  /**
   * Skydd mot dubbelräkning:
   *
   * Exempel:
   * Produkt: 299
   * Frakt: 49
   * Kod: FREESHIPVIP
   *
   * Servern kan skicka:
   * discountAmountSek: 49
   * freeShipping: true
   *
   * Det ska betyda:
   * - 49 kr fraktrabatt
   * - 0 kr produkt-rabatt
   * - total = 299 kr
   *
   * Inte:
   * - fri frakt
   * - plus -49 kr på produkten
   * - total = 250 kr
   */
  if (hasExplicitTotalDiscount && meta.totalDiscountSek > 0) {
    const totalExplicit = Math.min(subtotal + shipping, meta.totalDiscountSek);
    const shippingPart = Math.min(shipping, shippingDiscountSek || 0);
    const itemPart = Math.max(0, totalExplicit - shippingPart);

    itemDiscountSek = Math.max(itemDiscountSek, itemPart);
  } else if (hasGenericDiscountAmount && meta.discountSek > 0) {
    if (meta.freeShipping || shippingDiscountSek > 0 || meta.discountType === "shipping") {
      const shippingPart = Math.min(shipping, shippingDiscountSek || 0);
      const itemPart = Math.max(0, meta.discountSek - shippingPart);

      itemDiscountSek = Math.max(itemDiscountSek, itemPart);
    } else {
      itemDiscountSek = Math.max(itemDiscountSek, meta.discountSek);
    }
  }

  itemDiscountSek = round2(Math.min(subtotal, Math.max(0, itemDiscountSek)));
  shippingDiscountSek = round2(Math.min(shipping, Math.max(0, shippingDiscountSek)));

  const totalDiscountSek = round2(itemDiscountSek + shippingDiscountSek);
  const beforeTotalSek = round2(subtotal + shipping);
  const afterTotalSek = round2(Math.max(0, beforeTotalSek - totalDiscountSek));

  return {
    subtotalSek: subtotal,
    shippingBeforeDiscountSek: shipping,

    itemDiscountSek,
    itemDiscountSEK: itemDiscountSek,

    discountSek: itemDiscountSek,
    discountSEK: itemDiscountSek,

    shippingDiscountSek,
    shippingDiscountSEK: shippingDiscountSek,

    totalDiscountSek,
    totalDiscountSEK: totalDiscountSek,

    totalBeforeDiscountSEK: beforeTotalSek,
    totalBeforeDiscountSek: beforeTotalSek,

    totalAfterDiscountSEK: afterTotalSek,
    totalAfterDiscountSek: afterTotalSek,

    grandSEK: afterTotalSek,
    grandSek: afterTotalSek,

    freeShippingApplied: shipping > 0 && shippingDiscountSek >= shipping,
    discountCode: meta.discountCode || "",
    discountType: meta.discountType || "",
    discountPercent: meta.discountPercent || 0,
  };
}

export function applyDiscountToTotalsSEK(totalsSEK = {}, discountMeta = {}) {
  const base = totalsSEK && typeof totalsSEK === "object" ? totalsSEK : {};

  const subtotalSek = getDiscountNumber(
    base.sub,
    base.subtotal,
    base.items,
    base.itemsTotal,
    base.subtotalSEK,
    base.subtotalSek
  );

  const shippingSek = getDiscountNumber(
    base.ship,
    base.shipping,
    base.shippingSek,
    base.shippingSEK,
    base.freight,
    base.freightSek,
    base.delivery,
    base.deliverySek
  );

  const taxBefore = getDiscountNumber(base.tax, base.vat);

  const b = calculateDiscountBreakdownSEK({
    subtotalSek,
    shippingSek,
    discountMeta,
  });

  const shippingAfter = round2(Math.max(0, b.shippingBeforeDiscountSek - b.shippingDiscountSek));

  // Enkel momsmodell 25% på slutbeloppet för visning/kvittounderlag.
  const VAT_RATE = 0.25;
  const extractVat = (gross) => round2(gross - gross / (1 + VAT_RATE));
  const taxAfter = extractVat(b.grandSEK);

  return {
    ...base,

    sub: round2(subtotalSek),
    subtotal: round2(subtotalSek),
    subtotalSEK: round2(subtotalSek),
    subtotalSek: round2(subtotalSek),

    shipBeforeDiscount: round2(shippingSek),
    shippingBeforeDiscount: round2(shippingSek),
    shippingBeforeDiscountSEK: round2(shippingSek),
    shippingBeforeDiscountSek: round2(shippingSek),

    ship: shippingAfter,
    shipping: shippingAfter,
    shippingSek: shippingAfter,
    shippingSEK: shippingAfter,
    freight: shippingAfter,
    freightSek: shippingAfter,

    taxBeforeDiscount: round2(taxBefore),
    tax: taxAfter,
    vat: taxAfter,

    itemDiscountSek: b.itemDiscountSek,
    itemDiscountSEK: b.itemDiscountSEK,

    // Viktigt: discount/discountAmount = bara produkt-rabatt.
    // Fraktrabatt ligger separat i shippingDiscountSek.
    discount: b.itemDiscountSek,
    discountSek: b.itemDiscountSek,
    discountSEK: b.itemDiscountSek,
    discountAmountSek: b.itemDiscountSek,
    discountAmountSEK: b.itemDiscountSek,

    shippingDiscountSek: b.shippingDiscountSek,
    shippingDiscountSEK: b.shippingDiscountSEK,

    totalDiscountSek: b.totalDiscountSek,
    totalDiscountSEK: b.totalDiscountSEK,

    totalBeforeDiscountSEK: b.totalBeforeDiscountSEK,
    totalBeforeDiscountSek: b.totalBeforeDiscountSEK,

    grand: b.grandSEK,
    total: b.grandSEK,
    totalSek: b.grandSEK,
    totalSEK: b.grandSEK,

    freeShippingApplied: b.freeShippingApplied,
    discountCode: b.discountCode,
    discountType: b.discountType,
    discountPercent: b.discountPercent,
  };
}

export function applyDiscountToDisplayTotals(
  displayTotals = {},
  totalsSEK = {},
  discountMeta = {},
  currency = BASE_CURRENCY,
  rates = {}
) {
  const base = displayTotals && typeof displayTotals === "object" ? displayTotals : {};
  const discountedSek = applyDiscountToTotalsSEK(totalsSEK, discountMeta);
  const cur = safeStr(currency).toUpperCase() || BASE_CURRENCY;

  return {
    ...base,

    totalBeforeDiscount: convertFromSEK(
      discountedSek.totalBeforeDiscountSEK || 0,
      cur,
      rates
    ),

    // Viktigt: discount = bara produktrabatt i UI.
    discount: convertFromSEK(discountedSek.itemDiscountSek || 0, cur, rates),
    discountSEK: discountedSek.itemDiscountSek || 0,
    discountAmountSEK: discountedSek.itemDiscountSek || 0,

    itemDiscount: convertFromSEK(discountedSek.itemDiscountSek || 0, cur, rates),
    itemDiscountSEK: discountedSek.itemDiscountSek || 0,

    shippingDiscount: convertFromSEK(discountedSek.shippingDiscountSek || 0, cur, rates),
    shippingDiscountSEK: discountedSek.shippingDiscountSek || 0,

    totalDiscount: convertFromSEK(discountedSek.totalDiscountSek || 0, cur, rates),
    totalDiscountSEK: discountedSek.totalDiscountSek || 0,

    shipping: convertFromSEK(discountedSek.shippingSEK ?? discountedSek.ship ?? 0, cur, rates),
    shippingSEK: discountedSek.shippingSEK ?? discountedSek.ship ?? 0,

    total: convertFromSEK(discountedSek.grand || 0, cur, rates),
    totalSEK: discountedSek.grand || 0,

    discountCode: discountedSek.discountCode || "",
    discountType: discountedSek.discountType || "",
    discountPercent: discountedSek.discountPercent || 0,
    freeShippingApplied: !!discountedSek.freeShippingApplied,
  };
}

/* =========================================================
 *  Totals för UI (valfri valuta) – används i Cart/Checkout
 * ======================================================= */

/**
 * items: [{ price eller product.price (SEK), qty, ... }]
 */
export function computeTotals(items, currency = BASE_CURRENCY, rates = {}, country = "SE") {
  const safe = Array.isArray(items) ? items : [];

  const subtotalSEK = safe.reduce((sum, it) => {
    const unit = safeNumber(it?.price ?? it?.product?.price ?? 0);
    const qty = Math.max(1, safeNumber(it?.qty || it?.quantity || 1));
    return sum + unit * qty;
  }, 0);

  const physical = hasPhysicalItems(safe);
  const { feeSEK } = physical ? shippingRulesSEK(subtotalSEK, country) : { feeSEK: 0 };

  const totalSEK = subtotalSEK + feeSEK;
  const cur = safeStr(currency).toUpperCase() || BASE_CURRENCY;

  const subtotal = convertFromSEK(subtotalSEK, cur, rates);
  const shipping = convertFromSEK(feeSEK, cur, rates);
  const total = convertFromSEK(totalSEK, cur, rates);

  return {
    subtotal,
    shipping,
    total,
    subtotalSEK,
    shippingSEK: feeSEK,
    totalSEK,
  };
}

/**
 * Fraktprogress till fri frakt – används i topbar/checkout.
 */
export function computeFreeShippingProgress(
  subtotalSEK,
  currency = BASE_CURRENCY,
  rates = {},
  country = "SE",
  items = []
) {
  const physical = hasPhysicalItems(items);

  if (!physical) {
    return {
      isFree: true,
      remainingSEK: 0,
      remainingActive: 0,
      thresholdSEK: 0,
    };
  }

  const sub = safeNumber(subtotalSEK);
  const { thresholdSEK } = shippingRulesSEK(sub, country);

  const threshold = Math.max(1, safeNumber(thresholdSEK));
  const remainingSEK = Math.max(0, threshold - sub);

  const cur = safeStr(currency).toUpperCase() || BASE_CURRENCY;
  const remainingActive = convertFromSEK(remainingSEK, cur, rates);

  return {
    isFree: remainingSEK <= 0,
    remainingSEK,
    remainingActive,
    thresholdSEK: threshold,
  };
}

/* =========================================================
 *  Totals i SEK för kvitto/order (inkl. moms i priser)
 *  Checkout ska använda detta, inte egen kopia
 * ======================================================= */

export function computeTotalsSEKFromCart(items, country = "SE") {
  const safe = Array.isArray(items) ? items : [];

  const subIncl = safe.reduce((acc, it) => {
    const unit = safeNumber(it?.price ?? it?.product?.price ?? 0);
    const qty = Math.max(1, safeNumber(it?.qty || it?.quantity || 1));
    return acc + unit * qty;
  }, 0);

  const physical = hasPhysicalItems(safe);
  const { feeSEK } = physical ? shippingRulesSEK(subIncl, country) : { feeSEK: 0 };

  const VAT_RATE = 0.25;
  const extractVat = (gross) => round2(gross - gross / (1 + VAT_RATE));
  const tax = round2(extractVat(subIncl) + extractVat(feeSEK));
  const grand = round2(subIncl + feeSEK);

  return {
    sub: round2(subIncl),
    subtotal: round2(subIncl),
    subtotalSEK: round2(subIncl),
    subtotalSek: round2(subIncl),

    tax,
    vat: tax,

    ship: round2(feeSEK),
    shipping: round2(feeSEK),
    shippingSek: round2(feeSEK),
    shippingSEK: round2(feeSEK),

    grand,
    total: grand,
    totalSek: grand,
    totalSEK: grand,
  };
}