// D:\WebProjects\Calestra\apps\store-classic\src\pages\Thanks.jsx
// apps/store-classic/src/pages/Thanks.jsx

import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { reportOrderToProgress } from "../api/progress.js";
import { trackPurchaseSuccess } from "../analytics/analyticsClient.js";
import { useDreamPoints } from "../context/DreamPointsContext.jsx";
import { TT } from "../i18n/tt.js";

const ORDER_REGISTER_URL =
  import.meta?.env?.VITE_ORDER_REGISTER_URL || "https://magiskacalestra.se/api/orders/register";

const CHECKOUT_DRAFT_URL =
  import.meta?.env?.VITE_CHECKOUT_DRAFT_URL || "https://magiskacalestra.se/api/checkout-draft";

const PROGRESS_REPORTING_ENABLED = import.meta?.env?.VITE_PROGRESS_REPORTING || "0";

const CHECKOUT_DRAFT_ID_KEY = "cw.checkoutDraftId";
const ORDER_LIST_KEY = "cw.orders";
const ORDER_LAST_KEY = "cw.order.last";
const ORDER_CURRENT_KEY = "cw.order.current";
const ORDER_THANKS_SEEN_KEY = "cw.order.thanksSeen";
const ORDER_REGISTERED_KEY = "cw.order.registered";
const PURCHASE_TRACKED_KEY = "cw.analytics.purchaseSuccessReported";
const DRAFT_CONVERTED_KEY = "cw.draftConverted";
const PROGRESS_REPORTED_KEY = "cw.progressReported";
const DREAM_AWARDED_KEY = "cw.dreampoints.awarded.orders";
const ORDER_FINALIZED_KEY = "cw.order.finalized";

function safeJsonParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function readStorage(key, mode = "local") {
  if (typeof window === "undefined") return null;
  try {
    const api = mode === "session" ? window.sessionStorage : window.localStorage;
    return api.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value, mode = "local") {
  if (typeof window === "undefined") return;
  try {
    const api = mode === "session" ? window.sessionStorage : window.localStorage;
    api.setItem(key, value);
  } catch {
    // noop
  }
}

function removeStorage(key, mode = "local") {
  if (typeof window === "undefined") return;
  try {
    const api = mode === "session" ? window.sessionStorage : window.localStorage;
    api.removeItem(key);
  } catch {
    // noop
  }
}

function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function normalizeText(v) {
  return String(v ?? "").trim();
}

function normalizeOrderId(order) {
  return normalizeText(order?.id || order?.orderId || order?.order_id || "");
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_/]+/g, " ")
    .replace(/[^a-z0-9\u00C0-\u024F -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truthyFlag(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;

  const s = normalizeSearchText(value);
  return [
    "1",
    "true",
    "yes",
    "y",
    "on",
    "active",
    "enabled",
    "preorder",
    "pre-order",
    "pre_order",
    "pre order",
    "reserve",
    "reservation",
    "coming_soon",
    "coming-soon",
    "coming soon",
    "launch_only",
    "launch-only",
    "launch only",
    "notify",
    "notify_me",
    "notify-me",
    "notify me",
    "notify only",
    "back_in_stock",
    "back-in-stock",
    "back in stock",
    "watch_only",
    "watch-only",
    "watch only",
  ].includes(s);
}

function getNested(obj, path) {
  try {
    return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  } catch {
    return undefined;
  }
}

function arrayFromMaybe(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function readOrderList() {
  const parsed = safeJsonParse(readStorage(ORDER_LIST_KEY, "local"), []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeOrderList(list) {
  writeStorage(ORDER_LIST_KEY, JSON.stringify(Array.isArray(list) ? list : []), "local");
}

function upsertLocalOrder(order) {
  if (typeof window === "undefined" || !order) return;

  const orderId = normalizeOrderId(order);
  if (!orderId) return;

  const list = readOrderList();
  const idx = list.findIndex((o) => normalizeOrderId(o) === orderId);

  if (idx === -1) {
    list.unshift(order);
  } else {
    list[idx] = {
      ...list[idx],
      ...order,
      items: Array.isArray(order.items) ? order.items : list[idx]?.items || [],
    };
  }

  writeOrderList(list);
  writeStorage(ORDER_LAST_KEY, JSON.stringify(order), "local");
  writeStorage(ORDER_CURRENT_KEY, JSON.stringify(order), "session");
}

function loadLocalOrder(id) {
  if (typeof window === "undefined") return null;

  const wanted = normalizeText(id);
  if (!wanted) return null;

  const current = safeJsonParse(readStorage(ORDER_CURRENT_KEY, "session"), null);
  if (current && normalizeOrderId(current) === wanted) return current;

  const last = safeJsonParse(readStorage(ORDER_LAST_KEY, "local"), null);
  if (last && normalizeOrderId(last) === wanted) return last;

  return readOrderList().find((o) => normalizeOrderId(o) === wanted) || null;
}

function readFlagMap(key) {
  const parsed = safeJsonParse(readStorage(key, "local"), {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function writeFlagMap(key, map) {
  writeStorage(key, JSON.stringify(map || {}), "local");
}

function itemQty(item) {
  const n = Number(item?.qty ?? item?.quantity ?? 1);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function itemPriceSEK(item) {
  const n = Number(item?.priceSEK ?? item?.price ?? item?.product?.price ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function extractLineTexts(item) {
  const values = [
    item?.lineMode,
    item?.orderType,
    item?.ctaMode,
    item?.fulfillmentType,
    item?.fulfilmentType,
    item?.availabilityType,
    item?.availabilityLabel,
    item?.availabilityText,
    item?.fulfillmentStatus,
    item?.status,
    item?.badge,
    item?.title,
    item?.name,
    item?.slug,
    item?.handle,
    item?.sku,
    item?.category,
    item?.type,

    item?.meta?.lineMode,
    item?.meta?.orderType,
    item?.meta?.ctaMode,
    item?.meta?.fulfillmentType,
    item?.meta?.availabilityType,
    item?.meta?.availabilityLabel,
    item?.meta?.availabilityText,
    item?.meta?.fulfillmentStatus,
    item?.meta?.status,
    item?.meta?.badge,
    item?.meta?.label,
    item?.meta?.statusLabel,
    item?.meta?.category,
    item?.meta?.type,

    item?.product?.lineMode,
    item?.product?.orderType,
    item?.product?.ctaMode,
    item?.product?.fulfillmentType,
    item?.product?.availabilityType,
    item?.product?.availabilityLabel,
    item?.product?.availabilityText,
    item?.product?.fulfillmentStatus,
    item?.product?.status,
    item?.product?.badge,
    item?.product?.title,
    item?.product?.name,
    item?.product?.subtitle,
    item?.product?.description,
    item?.product?.slug,
    item?.product?.category,
    item?.product?.type,

    getNested(item, "product.meta.lineMode"),
    getNested(item, "product.meta.orderType"),
    getNested(item, "product.meta.ctaMode"),
    getNested(item, "product.meta.fulfillmentType"),
    getNested(item, "product.meta.availabilityType"),
    getNested(item, "product.meta.availabilityLabel"),
    getNested(item, "product.meta.availabilityText"),
    getNested(item, "product.meta.status"),
    getNested(item, "product.meta.badge"),
    getNested(item, "product.meta.category"),
    getNested(item, "product.meta.type"),
  ];

  const tags = [
    ...arrayFromMaybe(item?.tags),
    ...arrayFromMaybe(item?.product?.tags),
    ...arrayFromMaybe(item?.meta?.tags),
    ...arrayFromMaybe(getNested(item, "product.meta.tags")),
    ...arrayFromMaybe(getNested(item, "product.flags.tags")),
  ];

  const categories = [
    ...arrayFromMaybe(item?.categories),
    ...arrayFromMaybe(item?.product?.categories),
    ...arrayFromMaybe(item?.meta?.categories),
    ...arrayFromMaybe(getNested(item, "product.meta.categories")),
  ];

  return [...values, ...tags, ...categories]
    .filter(Boolean)
    .map(normalizeSearchText)
    .filter(Boolean);
}

function hasNotifyKeyword(text) {
  const s = normalizeSearchText(text);
  if (!s) return false;

  return (
    s.includes("notify") ||
    s.includes("notify me") ||
    s.includes("notify-me") ||
    s.includes("notify_me") ||
    s.includes("notify only") ||
    s.includes("back in stock") ||
    s.includes("back-in-stock") ||
    s.includes("back_in_stock") ||
    s.includes("restock alert") ||
    s.includes("mail me") ||
    s.includes("watch only") ||
    s.includes("bevaka") ||
    s.includes("meddela mig")
  );
}

function hasPreorderKeyword(text) {
  const s = normalizeSearchText(text);
  if (!s) return false;

  return (
    s.includes("preorder") ||
    s.includes("pre order") ||
    s.includes("pre-order") ||
    s.includes("pre_order") ||
    s.includes("forbestall") ||
    s.includes("for bestall") ||
    s.includes("förbeställ") ||
    s.includes("forhandsbok") ||
    s.includes("förhandsbok") ||
    s.includes("forhandsreservation") ||
    s.includes("förhandsreservation") ||
    s.includes("reservation") ||
    s.includes("reserve") ||
    s.includes("on siparis") ||
    s.includes("ön sipariş")
  );
}

function detectNotifyLine(item) {
  if (!item || typeof item !== "object") return false;

  const explicit = normalizeSearchText(
    item.lineMode ||
      item.orderType ||
      item.ctaMode ||
      item.fulfillmentType ||
      item.fulfilmentType ||
      item.availabilityType ||
      item.meta?.lineMode ||
      item.meta?.orderType ||
      item.meta?.ctaMode ||
      item.meta?.fulfillmentType ||
      item.meta?.availabilityType ||
      item.product?.lineMode ||
      item.product?.orderType ||
      item.product?.ctaMode ||
      item.product?.fulfillmentType ||
      item.product?.availabilityType ||
      getNested(item, "product.meta.lineMode") ||
      getNested(item, "product.meta.orderType") ||
      getNested(item, "product.meta.ctaMode") ||
      getNested(item, "product.meta.fulfillmentType") ||
      getNested(item, "product.meta.availabilityType") ||
      ""
  );

  if (
    explicit === "notify" ||
    explicit === "notify me" ||
    explicit === "notify-me" ||
    explicit === "notify_me" ||
    explicit === "notify only" ||
    explicit === "notify-only" ||
    explicit === "notify_only" ||
    explicit === "back in stock" ||
    explicit === "back-in-stock" ||
    explicit === "back_in_stock"
  ) {
    return true;
  }

  if (
    explicit === "buy" ||
    explicit === "standard" ||
    explicit === "ready for fulfillment" ||
    explicit === "ready_for_fulfillment" ||
    explicit === "preorder" ||
    explicit === "pre order" ||
    explicit === "pre-order" ||
    explicit === "pre_order" ||
    explicit === "waiting preorder" ||
    explicit === "waiting_preorder"
  ) {
    return false;
  }

  const flags = [
    item.notifyOnly,
    item.notifyMe,
    item.notify_me,
    item.backInStockOnly,
    item.watchOnly,
    item.meta?.notifyOnly,
    item.meta?.notifyMe,
    item.meta?.notify_me,
    item.meta?.backInStockOnly,
    item.meta?.watchOnly,
    item.product?.notifyOnly,
    item.product?.notifyMe,
    item.product?.notify_me,
    item.product?.backInStockOnly,
    item.product?.watchOnly,
    getNested(item, "product.meta.notifyOnly"),
    getNested(item, "product.meta.notifyMe"),
    getNested(item, "product.meta.backInStockOnly"),
    getNested(item, "product.flags.notifyOnly"),
    getNested(item, "product.flags.notifyMe"),
    getNested(item, "product.flags.backInStockOnly"),
  ];

  if (flags.some(truthyFlag)) return true;

  return extractLineTexts(item).some(hasNotifyKeyword);
}

function detectPreorderLine(item) {
  if (!item || typeof item !== "object") return false;

  const explicit = normalizeSearchText(
    item.lineMode ||
      item.orderType ||
      item.ctaMode ||
      item.fulfillmentType ||
      item.fulfilmentType ||
      item.availabilityType ||
      item.meta?.lineMode ||
      item.meta?.orderType ||
      item.meta?.ctaMode ||
      item.meta?.fulfillmentType ||
      item.meta?.availabilityType ||
      item.product?.lineMode ||
      item.product?.orderType ||
      item.product?.ctaMode ||
      item.product?.fulfillmentType ||
      item.product?.availabilityType ||
      getNested(item, "product.meta.lineMode") ||
      getNested(item, "product.meta.orderType") ||
      getNested(item, "product.meta.ctaMode") ||
      getNested(item, "product.meta.fulfillmentType") ||
      getNested(item, "product.meta.availabilityType") ||
      ""
  );

  if (
    explicit === "preorder" ||
    explicit === "pre order" ||
    explicit === "pre-order" ||
    explicit === "pre_order" ||
    explicit === "waiting preorder" ||
    explicit === "waiting_preorder"
  ) {
    return true;
  }

  if (
    explicit === "buy" ||
    explicit === "standard" ||
    explicit === "ready for fulfillment" ||
    explicit === "ready_for_fulfillment" ||
    explicit === "notify" ||
    explicit === "notify me" ||
    explicit === "notify-me" ||
    explicit === "notify_me"
  ) {
    return false;
  }

  const flags = [
    item.preorder,
    item.preOrder,
    item.isPreorder,
    item.preorderOnly,
    item.preorderActive,
    item.comingSoon,
    item.launchOnly,
    item.meta?.preorder,
    item.meta?.preOrder,
    item.meta?.isPreorder,
    item.meta?.preorderOnly,
    item.meta?.preorderActive,
    item.product?.preorder,
    item.product?.preOrder,
    item.product?.isPreorder,
    item.product?.preorderOnly,
    item.product?.preorderActive,
    getNested(item, "product.meta.preorder"),
    getNested(item, "product.meta.isPreorder"),
    getNested(item, "product.flags.preorder"),
  ];

  if (flags.some(truthyFlag)) return true;

  return extractLineTexts(item).some(hasPreorderKeyword);
}

function detectLineMode(item) {
  if (detectNotifyLine(item)) return "notify";
  if (detectPreorderLine(item)) return "preorder";
  return "buy";
}

function getOrderFlow(order, searchParams) {
  const flowQuery = normalizeSearchText(searchParams.get("flow") || "");
  const modeQuery = normalizeSearchText(searchParams.get("mode") || "");
  const syncQuery = normalizeSearchText(searchParams.get("sync") || "");

  const orderFlowType = normalizeSearchText(
    order?.orderFlowType || order?.uiMeta?.flowType || order?.preorderMeta?.flowType || ""
  );

  const status = normalizeSearchText(order?.status || "");
  const items = Array.isArray(order?.items) ? order.items : [];
  const lineModes = items.map(detectLineMode);

  const notifyLines = lineModes.filter((mode) => mode === "notify").length;
  const preorderLines = lineModes.filter((mode) => mode === "preorder").length;
  const buyLines = lineModes.filter((mode) => mode === "buy").length;

  const preorderSystemEnabled = !!order?.preorderSystem?.enabled;
  const metaHasPreorder = !!order?.preorderMeta?.hasPreorder;
  const metaHasNotifyOnly = !!order?.preorderMeta?.hasNotifyOnly;

  let flowType = "standard";

  if (
    flowQuery === "notify" ||
    flowQuery === "notify only" ||
    flowQuery === "notify_only" ||
    orderFlowType === "notify" ||
    orderFlowType === "notify only" ||
    orderFlowType === "notify_only" ||
    status === "notify only" ||
    status === "notify_only" ||
    metaHasNotifyOnly ||
    (notifyLines > 0 && buyLines === 0 && preorderLines === 0)
  ) {
    flowType = "notify_only";
  } else if (flowQuery === "mixed" || orderFlowType === "mixed") {
    flowType = "mixed";
  } else if (
    flowQuery === "preorder" ||
    orderFlowType === "preorder" ||
    status === "preorder reserved" ||
    status === "preorder_reserved" ||
    preorderSystemEnabled ||
    metaHasPreorder ||
    preorderLines > 0
  ) {
    flowType = preorderLines > 0 && buyLines > 0 ? "mixed" : "preorder";
  }

  const serverWrite =
    order?.serverWrite && typeof order.serverWrite === "object" ? order.serverWrite : {};
  const syncPending =
    syncQuery === "pending" ||
    !!serverWrite.pendingRetry ||
    status.endsWith("_local") ||
    status.includes("pending local");

  return {
    flowType,
    isPreorder: flowType === "preorder",
    isMixed: flowType === "mixed",
    isNotifyOnly: flowType === "notify_only",
    hasPreorder: flowType === "preorder" || flowType === "mixed",
    hasNotifyOnly: flowType === "notify_only",
    modeOverride: modeQuery,
    syncPending,
    notifyLines,
    preorderLines,
    buyLines,
  };
}

function normalizeItemsForTracking(order) {
  const src = Array.isArray(order?.items) ? order.items : [];
  return src.map((it, idx) => ({
    id: it?.id || it?.product?.id || it?.slug || String(idx),
    qty: itemQty(it),
    priceSEK: itemPriceSEK(it),
    isPreorder: detectLineMode(it) === "preorder",
    lineMode: detectLineMode(it),
  }));
}

function extractDiscount(order) {
  const discountMeta =
    order?.discountMeta ||
    order?.discount_meta ||
    order?.core?.discountMeta ||
    order?.coreMeta?.discountMeta ||
    {};

  const totals = order?.totalsSEK || {};
  const type = cleanString(
    discountMeta.discountType ||
      discountMeta.manualDiscountType ||
      discountMeta.type ||
      totals.discountType ||
      "",
    80
  ).toLowerCase();

  const freeShipping = !!(
    discountMeta.freeShipping ||
    discountMeta.manualFreeShipping ||
    discountMeta.hasFreeShipping ||
    discountMeta.shippingFree ||
    discountMeta.freeShippingApplied ||
    totals.freeShipping ||
    totals.shippingFree ||
    totals.freeShippingApplied ||
    type === "shipping" ||
    type === "free_shipping" ||
    type === "free-shipping"
  );

  const explicitItemAmountSEK = Number(
    discountMeta.itemDiscountSek ??
      discountMeta.itemDiscountSEK ??
      discountMeta.productDiscountSek ??
      discountMeta.productDiscountSEK ??
      discountMeta.manualItemDiscountSek ??
      discountMeta.campaignItemDiscountSek ??
      0
  );

  const genericAmountSEK = Number(
    discountMeta.manualDiscountAmountSek ??
      discountMeta.discountAmountSek ??
      discountMeta.discountAmountSEK ??
      discountMeta.discountSek ??
      discountMeta.discountSEK ??
      totals.discountSek ??
      totals.discountSEK ??
      totals.discountAmountSEK ??
      totals.discountAmountSek ??
      0
  );

  const totalDiscountSEK = Number(
    discountMeta.totalDiscountSek ??
      discountMeta.totalDiscountSEK ??
      totals.totalDiscountSek ??
      totals.totalDiscountSEK ??
      0
  );

  const shippingDiscountSEK = Number(
    discountMeta.shippingDiscountSek ??
      discountMeta.shippingDiscountSEK ??
      discountMeta.freeShippingDiscountSek ??
      totals.shippingDiscountSek ??
      totals.shippingDiscountSEK ??
      0
  );

  const percent = Number(discountMeta.discountPercent || discountMeta.manualDiscountPercent || 0);

  return {
    rawAmountSEK: Number.isFinite(genericAmountSEK) ? Math.max(0, genericAmountSEK) : 0,
    explicitItemAmountSEK: Number.isFinite(explicitItemAmountSEK)
      ? Math.max(0, explicitItemAmountSEK)
      : 0,
    totalDiscountSEK: Number.isFinite(totalDiscountSEK) ? Math.max(0, totalDiscountSEK) : 0,
    shippingDiscountSEK: Number.isFinite(shippingDiscountSEK)
      ? Math.max(0, shippingDiscountSEK)
      : 0,
    percent: Number.isFinite(percent) ? Math.max(0, percent) : 0,
    freeShipping,
  };
}

function shippingRulesSEK(subSEK, country = "SE") {
  const c = String(country || "SE").toUpperCase();

  const table = {
    SE: { threshold: 500, fee: 49 },
    NO: { threshold: 700, fee: 89 },
    FI: { threshold: 700, fee: 89 },
    DK: { threshold: 600, fee: 69 },
    DE: { threshold: 700, fee: 89 },
    NL: { threshold: 700, fee: 89 },
    GB: { threshold: 800, fee: 99 },
    US: { threshold: 120, fee: 132 },
    TR: { threshold: 2000, fee: 149 },
    FR: { threshold: 700, fee: 89 },
    ES: { threshold: 700, fee: 89 },
  };

  const rule = table[c] || table.SE;
  const isFree = Number(subSEK || 0) >= rule.threshold;

  return {
    isFree,
    feeSEK: isFree ? 0 : rule.fee,
    thresholdSEK: rule.threshold,
  };
}

function buildNormalizedTotalsSEK(order) {
  const src = order?.totalsSEK && typeof order.totalsSEK === "object" ? order.totalsSEK : {};
  const discount = extractDiscount(order);

  const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
  const extractVat = (gross) => round2(gross - gross / 1.25);

  const itemSubtotal = (Array.isArray(order?.items) ? order.items : []).reduce((sum, item) => {
    return sum + itemPriceSEK(item) * itemQty(item);
  }, 0);

  const sourceSubtotal = Number(src.sub ?? src.subtotal ?? src.items ?? src.itemsTotal ?? itemSubtotal);
  const subtotal = Number.isFinite(sourceSubtotal) && sourceSubtotal > 0 ? sourceSubtotal : itemSubtotal;

  const anyPhysical =
    typeof order?.anyPhysical === "boolean"
      ? order.anyPhysical
      : Array.isArray(order?.items) && order.items.length > 0;

  const country = order?.shipping?.country || order?.billing?.country || "SE";
  const fallbackShipping = anyPhysical ? shippingRulesSEK(subtotal, country).feeSEK : 0;

  const originalShipFromSource = Number(
    src.shippingBeforeDiscountSEK ??
      src.shippingBeforeDiscountSek ??
      src.shipBeforeDiscount ??
      src.originalShippingSEK ??
      src.originalShippingSek ??
      NaN
  );

  const sourceShipping = Number(
    src.ship ?? src.shipping ?? src.shippingSek ?? src.shippingSEK ?? src.freight ?? fallbackShipping
  );

  const originalShipping = anyPhysical
    ? Number.isFinite(originalShipFromSource)
      ? Math.max(0, originalShipFromSource)
      : Number.isFinite(sourceShipping)
        ? discount.freeShipping && sourceShipping === 0
          ? fallbackShipping
          : Math.max(0, sourceShipping)
        : fallbackShipping
    : 0;

  const shippingDiscount = anyPhysical
    ? discount.freeShipping
      ? originalShipping
      : Math.min(originalShipping, discount.shippingDiscountSEK)
    : 0;

  const shipping = round2(Math.max(0, originalShipping - shippingDiscount));

  let itemDiscount = 0;

  if (discount.explicitItemAmountSEK > 0) {
    itemDiscount = discount.explicitItemAmountSEK;
  } else if (discount.totalDiscountSEK > 0) {
    itemDiscount = Math.max(0, discount.totalDiscountSEK - shippingDiscount);
  } else if (discount.rawAmountSEK > 0) {
    itemDiscount = discount.freeShipping
      ? Math.max(0, discount.rawAmountSEK - shippingDiscount)
      : discount.rawAmountSEK;
  }

  if (discount.percent > 0 && itemDiscount <= 0 && !discount.freeShipping) {
    itemDiscount = subtotal * (discount.percent / 100);
  }

  itemDiscount = round2(Math.min(subtotal, Math.max(0, itemDiscount)));

  const grand = round2(Math.max(0, subtotal + shipping - itemDiscount));
  const tax = round2(extractVat(Math.max(0, subtotal - itemDiscount)) + extractVat(shipping));

  return {
    ...src,
    sub: round2(subtotal),
    subtotal: round2(subtotal),
    items: round2(subtotal),
    itemsTotal: round2(subtotal),

    shippingBeforeDiscountSEK: round2(originalShipping),
    shippingBeforeDiscountSek: round2(originalShipping),
    originalShippingSEK: round2(originalShipping),

    shipping: round2(shipping),
    shippingSek: round2(shipping),
    shippingSEK: round2(shipping),
    ship: round2(shipping),
    freight: round2(shipping),

    shippingDiscountSek: round2(shippingDiscount),
    shippingDiscountSEK: round2(shippingDiscount),

    discountSek: round2(itemDiscount),
    discountSEK: round2(itemDiscount),
    discountAmountSEK: round2(itemDiscount),
    discountAmountSek: round2(itemDiscount),

    totalDiscountSek: round2(itemDiscount + shippingDiscount),
    totalDiscountSEK: round2(itemDiscount + shippingDiscount),

    tax,
    vat: tax,

    freeShipping: discount.freeShipping || shipping === 0,
    freeShippingApplied: discount.freeShipping || shippingDiscount > 0,

    total: grand,
    grand,
    totalSek: grand,
    totalSEK: grand,
  };
}

function readAwardedOrderRecord(orderId) {
  if (typeof window === "undefined" || !orderId) return null;

  const map = safeJsonParse(readStorage(DREAM_AWARDED_KEY, "local") || "{}", {});
  const hit = map?.[orderId];
  if (!hit) return null;

  return {
    earned: Number(hit.earned || 0),
    awardedAt: hit.awardedAt || "",
    amountSek: Number(hit.amountSek || 0),
  };
}

function extractCore(order) {
  const core = order?.core || {};
  const coreMeta = order?.coreMeta || order?.core_meta || {};
  const attribution = coreMeta?.attribution || core?.attribution || {};

  return {
    userId: core.userId || coreMeta.userId || order?.userId || order?.user_id || "",
    memberId: core.memberId || coreMeta.memberId || order?.memberId || order?.member_id || "",
    memberTier:
      core.memberTier ||
      coreMeta.memberTier ||
      order?.memberTier ||
      order?.member_tier ||
      "guest",
    campaignId:
      core.campaignId || coreMeta.campaignId || order?.campaignId || order?.campaign_id || "",
    creatorId:
      core.creatorId || coreMeta.creatorId || order?.creatorId || order?.creator_id || "",
    creatorCode:
      core.creatorCode || coreMeta.creatorCode || order?.creatorCode || order?.creator_code || "",
    affiliateId:
      core.affiliateId ||
      coreMeta.affiliateId ||
      order?.affiliateId ||
      order?.affiliate_id ||
      order?.affiliate ||
      "",
    affiliateCode:
      core.affiliateCode ||
      coreMeta.affiliateCode ||
      order?.affiliateCode ||
      order?.affiliate_code ||
      "",
    associateId:
      core.associateId ||
      coreMeta.associateId ||
      order?.associateId ||
      order?.associate_id ||
      "",
    associateCode:
      core.associateCode ||
      coreMeta.associateCode ||
      order?.associateCode ||
      order?.associate_code ||
      "",
    ambassadorCode:
      core.ambassadorCode ||
      coreMeta.ambassadorCode ||
      order?.ambassadorCode ||
      order?.ambassador_code ||
      "",
    partnerCode:
      core.partnerCode || coreMeta.partnerCode || order?.partnerCode || order?.partner_code || "",
    referralCode:
      core.referralCode ||
      coreMeta.referralCode ||
      order?.referralCode ||
      order?.referral_code ||
      "",
    rewardCode:
      core.rewardCode || coreMeta.rewardCode || order?.rewardCode || order?.reward_code || "",
    attributionOwner:
      core.attributionOwner ||
      coreMeta.attributionOwner ||
      order?.attributionOwner ||
      order?.attribution_owner ||
      "calestra",
    thirdPartyType:
      core.thirdPartyType ||
      coreMeta.thirdPartyType ||
      order?.thirdPartyType ||
      order?.third_party_type ||
      "",
    sourceChannel:
      core.sourceChannel ||
      coreMeta.sourceChannel ||
      order?.sourceChannel ||
      order?.source_channel ||
      order?.source ||
      "store",
    trafficSource:
      core.trafficSource ||
      coreMeta.trafficSource ||
      order?.trafficSource ||
      order?.traffic_source ||
      attribution?.utmSource ||
      "",
    entryPoint:
      core.entryPoint ||
      coreMeta.entryPoint ||
      order?.entryPoint ||
      order?.entry_point ||
      "checkout",
  };
}

function extractDreamPoints(order, orderId) {
  const snap = order?.dreamPoints || {};
  const meta = order?.dreamPointsMeta || order?.dreampoints_meta || {};
  const awarded = readAwardedOrderRecord(orderId);

  const level =
    snap.level ||
    meta.level ||
    order?.dreamPointsLevel ||
    order?.dreampoints_level ||
    "starlight";

  const earned =
    awarded?.earned ??
    snap.earned ??
    snap.earnPreview ??
    meta.earned ??
    meta.earnPreview ??
    order?.dreamPointsEarned ??
    order?.dreampoints_earn_preview ??
    0;

  const maxRedeemSek =
    snap.maxRedeemSek ??
    meta.maxRedeemSek ??
    order?.dreamPointsMaxRedeemSek ??
    order?.dreampoints_max_redeem_sek ??
    0;

  return {
    level: String(level || "starlight"),
    earned: Math.max(0, Number(earned || 0)),
    maxRedeemSek: Math.max(0, Number(maxRedeemSek || 0)),
  };
}

async function tryRegisterOrder(order, id) {
  if (typeof window === "undefined" || !order || !id) return false;

  const email = String(
    order?.email ||
      order?.customer?.email ||
      order?.shipping?.email ||
      order?.billing?.email ||
      ""
  )
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) return false;

  const core = extractCore(order);
  const dreamPoints = extractDreamPoints(order, id);
  const normalizedTotalsSEK = buildNormalizedTotalsSEK(order);

  try {
    const res = await fetch(ORDER_REGISTER_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        id,
        orderId: id,
        createdAt: order?.createdAt || order?.created_at || new Date().toISOString(),
        email,
        customerName: order?.customer?.name || order?.shipping?.name || order?.billing?.name || "",
        customer: order?.customer || {},
        shipping: order?.shipping || {},
        billing: order?.billing || {},
        currency: order?.currency || "SEK",
        totalsSEK: normalizedTotalsSEK,
        items: Array.isArray(order?.items) ? order.items : [],
        mode: order?.mode || "preview",
        anyPhysical: typeof order?.anyPhysical === "boolean" ? order.anyPhysical : false,
        affiliate: order?.affiliate || null,
        draftId: order?.draftId || "",
        status: order?.status || "",
        orderFlowType: order?.orderFlowType || order?.preorderMeta?.flowType || "",
        preorderMeta: order?.preorderMeta || null,
        hasPreorder: !!order?.preorderMeta?.hasPreorder,

        userId: core.userId,
        memberId: core.memberId,
        memberTier: core.memberTier,
        campaignId: core.campaignId,
        creatorId: core.creatorId,
        creatorCode: core.creatorCode,
        affiliateId: core.affiliateId,
        affiliateCode: core.affiliateCode,
        associateId: core.associateId,
        associateCode: core.associateCode,
        ambassadorCode: core.ambassadorCode,
        partnerCode: core.partnerCode,
        referralCode: core.referralCode,
        rewardCode: core.rewardCode,
        attributionOwner: core.attributionOwner,
        thirdPartyType: core.thirdPartyType,
        sourceChannel: core.sourceChannel,
        trafficSource: core.trafficSource,
        entryPoint: core.entryPoint,

        dreamPointsLevel: dreamPoints.level,
        dreamPointsEarned: dreamPoints.earned,
        dreamPointsMaxRedeemSek: dreamPoints.maxRedeemSek,

        core,
        dreamPoints,
      }),
      keepalive: true,
    });

    return !!res?.ok;
  } catch {
    return false;
  }
}

async function tryConvertDraft(order, id) {
  if (typeof window === "undefined" || !order || !id) return false;

  const draftId = String(order?.draftId || "").trim();
  if (!draftId) return false;

  try {
    const res = await fetch(CHECKOUT_DRAFT_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        action: "convert",
        draftId,
        orderId: id,
      }),
      keepalive: true,
    });

    if (!res.ok) return false;

    const raw = readStorage(CHECKOUT_DRAFT_ID_KEY, "local") || "";
    if (raw && raw === draftId) removeStorage(CHECKOUT_DRAFT_ID_KEY, "local");

    return true;
  } catch {
    return false;
  }
}

function levelLabel(level, i18n, t) {
  const key = String(level || "starlight").toLowerCase();
  return TT(i18n, t, `thanks.dreamPoints.level.${key}`, {
    sv:
      key === "aurora"
        ? "Aurora"
        : key === "celestial"
          ? "Celestial"
          : key === "moonlight"
            ? "Moonlight"
            : "Starlight",
    en:
      key === "aurora"
        ? "Aurora"
        : key === "celestial"
          ? "Celestial"
          : key === "moonlight"
            ? "Moonlight"
            : "Starlight",
    tr:
      key === "aurora"
        ? "Aurora"
        : key === "celestial"
          ? "Celestial"
          : key === "moonlight"
            ? "Moonlight"
            : "Starlight",
  });
}

function buildReceiptQuery(flow, syncPending, reservationCode = "") {
  const params = new URLSearchParams();

  if (flow === "preorder") params.set("flow", "preorder");
  if (flow === "mixed") params.set("flow", "mixed");
  if (flow === "notify_only") params.set("flow", "notify");
  if (syncPending) params.set("sync", "pending");
  if (reservationCode) params.set("reservation", reservationCode);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function getReservationCode(order, searchParams) {
  return cleanString(
    order?.preorderSystem?.reservationCode ||
      order?.preorderMeta?.reservationCode ||
      searchParams.get("reservation") ||
      "",
    120
  );
}

function getTotalSek(order) {
  const normalized = buildNormalizedTotalsSEK(order);
  return Number(normalized.grand ?? normalized.total ?? normalized.totalSek ?? 0);
}

function getSyncStatusLabel(flow, finalizeState, i18n, t) {
  if (flow.syncPending) {
    return TT(i18n, t, "thanks.signal.syncPending", {
      sv: "Synk väntar",
      en: "Sync pending",
      tr: "Senkron bekliyor",
    });
  }

  if (finalizeState === "running") {
    return TT(i18n, t, "thanks.signal.syncing", {
      sv: "Synkar",
      en: "Syncing",
      tr: "Senkronize",
    });
  }

  return TT(i18n, t, "thanks.signal.receiptReady", {
    sv: "Kvitto klart",
    en: "Receipt ready",
    tr: "Fiş hazır",
  });
}

export default function Thanks() {
  const { t, i18n } = useTranslation();
  const { points, level, refresh } = useDreamPoints();
  const [searchParams] = useSearchParams();

  const params = useParams();
  const id = params.id || params.orderId || "";

  const [copied, setCopied] = React.useState(false);
  const [order, setOrder] = React.useState(() => (id ? loadLocalOrder(id) : null));
  const [finalizeState, setFinalizeState] = React.useState("idle");

  React.useEffect(() => {
    if (!id) return;
    const found = loadLocalOrder(id);
    if (found) setOrder(found);
  }, [id]);

  React.useEffect(() => {
    if (order) upsertLocalOrder(order);
  }, [order]);

  React.useEffect(() => {
    if (!id) return;
    const seenMap = readFlagMap(ORDER_THANKS_SEEN_KEY);
    if (!seenMap?.[id]) writeFlagMap(ORDER_THANKS_SEEN_KEY, { ...seenMap, [id]: true });
  }, [id]);

  const flow = React.useMemo(() => getOrderFlow(order || {}, searchParams), [order, searchParams]);

  const isPreview =
    flow.modeOverride === "live"
      ? false
      : flow.modeOverride === "preview"
        ? true
        : String(order?.mode || "preview").toLowerCase() !== "live";

  const reservationCode = getReservationCode(order || {}, searchParams);
  const receiptQuery = buildReceiptQuery(flow.flowType, flow.syncPending, reservationCode);

  const origin = (typeof window !== "undefined" && window.location?.origin) || "";
  const receiptUrl = `${origin}/receipt/${encodeURIComponent(id || "")}${receiptQuery}`;

  const dreamAward = React.useMemo(() => readAwardedOrderRecord(id), [id]);
  const core = React.useMemo(() => extractCore(order || {}), [order]);

  React.useEffect(() => {
    if (typeof refresh === "function") refresh();
  }, [refresh, id]);

  React.useEffect(() => {
    if (!id || typeof window === "undefined") return;

    const finalizedMap = readFlagMap(ORDER_FINALIZED_KEY);
    if (finalizedMap?.[id]) {
      setFinalizeState("done");
      return;
    }

    const local = loadLocalOrder(id);
    if (!local) return;

    let cancelled = false;

    async function finalize() {
      setFinalizeState("running");

      if (!isPreview && !flow.isNotifyOnly) {
        const trackedMap = readFlagMap(PURCHASE_TRACKED_KEY);
        if (!trackedMap?.[id]) {
          try {
            const trackedCore = extractCore(local);
            const trackedDream = extractDreamPoints(local, id);

            trackPurchaseSuccess({
              orderId: id,
              total: getTotalSek(local),
              currency: local?.currency || "SEK",
              affiliateId: trackedCore.affiliateId || "",
              affiliateCode: trackedCore.affiliateCode || "",
              creatorId: trackedCore.creatorId || "",
              creatorCode: trackedCore.creatorCode || "",
              associateId: trackedCore.associateId || "",
              associateCode: trackedCore.associateCode || "",
              ambassadorCode: trackedCore.ambassadorCode || "",
              partnerCode: trackedCore.partnerCode || "",
              referralCode: trackedCore.referralCode || "",
              rewardCode: trackedCore.rewardCode || "",
              attributionOwner: trackedCore.attributionOwner || "calestra",
              thirdPartyType: trackedCore.thirdPartyType || "",
              trafficSource: trackedCore.trafficSource || "",
              campaignId: trackedCore.campaignId || "",
              memberId: trackedCore.memberId || "",
              memberTier: trackedCore.memberTier || "",
              sourceChannel: trackedCore.sourceChannel || "",
              entryPoint: trackedCore.entryPoint || "checkout",
              dreamPointsEarned: Number(trackedDream.earned || 0),
              dreamPointsLevel: String(trackedDream.level || "starlight"),
              orderFlowType: local?.orderFlowType || flow.flowType || "",
              hasPreorder: !!local?.preorderMeta?.hasPreorder || flow.hasPreorder,
              mixedCart: flow.isMixed,
              reservationCode: getReservationCode(local, searchParams),
              items: normalizeItemsForTracking(local),
            });

            writeFlagMap(PURCHASE_TRACKED_KEY, {
              ...readFlagMap(PURCHASE_TRACKED_KEY),
              [id]: true,
            });
          } catch {
            // noop
          }
        }

        const registeredMap = readFlagMap(ORDER_REGISTERED_KEY);
        if (!registeredMap?.[id]) {
          const ok = await tryRegisterOrder(local, id);
          if (cancelled) return;
          if (ok) {
            writeFlagMap(ORDER_REGISTERED_KEY, {
              ...readFlagMap(ORDER_REGISTERED_KEY),
              [id]: true,
            });
          }
        }
      }

      const convertedMap = readFlagMap(DRAFT_CONVERTED_KEY);
      if (!convertedMap?.[id] && local?.draftId) {
        const ok = await tryConvertDraft(local, id);
        if (cancelled) return;
        if (ok) {
          writeFlagMap(DRAFT_CONVERTED_KEY, {
            ...readFlagMap(DRAFT_CONVERTED_KEY),
            [id]: true,
          });
        }
      }

      if (String(PROGRESS_REPORTING_ENABLED) === "1" && !isPreview && !flow.isNotifyOnly) {
        const progressMap = readFlagMap(PROGRESS_REPORTED_KEY);
        if (!progressMap?.[id] && getTotalSek(local) > 0) {
          try {
            await reportOrderToProgress({
              ...local,
              totalsSEK: buildNormalizedTotalsSEK(local),
            });
            if (cancelled) return;

            writeFlagMap(PROGRESS_REPORTED_KEY, {
              ...readFlagMap(PROGRESS_REPORTED_KEY),
              [id]: true,
            });
          } catch (err) {
            console.warn("progress reporting failed", err);
          }
        }
      }

      if (cancelled) return;

      if (!flow.syncPending) {
        writeFlagMap(ORDER_FINALIZED_KEY, {
          ...readFlagMap(ORDER_FINALIZED_KEY),
          [id]: true,
        });

        setFinalizeState("done");
      } else {
        setFinalizeState("pending");
      }
    }

    finalize();

    return () => {
      cancelled = true;
    };
  }, [
    id,
    isPreview,
    flow.flowType,
    flow.hasPreorder,
    flow.isMixed,
    flow.isNotifyOnly,
    flow.syncPending,
    searchParams,
  ]);

  async function copyReceiptLink() {
    try {
      await navigator.clipboard.writeText(receiptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt(
        TT(i18n, t, "thanks.copyPrompt", {
          sv: "Kopiera kvittolänken:",
          en: "Copy the receipt link:",
          tr: "Fiş bağlantısını kopyalayın:",
        }),
        receiptUrl
      );
    }
  }

  async function shareReceipt() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: TT(i18n, t, "thanks.shareTitle", {
            sv: "Calestra – kvitto",
            en: "Calestra – receipt",
            tr: "Calestra – fiş",
          }),
          text: TT(i18n, t, "thanks.shareText", {
            sv: "Här är mitt kvitto från Calestra.",
            en: "Here is my receipt from Calestra.",
            tr: "İşte Calestra fişim.",
          }),
          url: receiptUrl,
        });
      } catch {
        // noop
      }
    } else {
      await copyReceiptLink();
    }
  }

  function printReceipt() {
    const url = `${receiptUrl}${receiptUrl.includes("?") ? "&" : "?"}pdf=1`;
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) window.open(receiptUrl, "_blank", "noopener,noreferrer");
  }

  const L = {
    kicker: flow.isNotifyOnly
      ? TT(i18n, t, "thanks.kicker.notify", {
          sv: "Bevaka-läge",
          en: "Notify mode",
          tr: "Bildirim modu",
        })
      : flow.isMixed
        ? TT(i18n, t, "thanks.kicker.mixed", {
            sv: "Blandad checkout",
            en: "Mixed Checkout",
            tr: "Karma checkout",
          })
        : flow.hasPreorder
          ? TT(i18n, t, "thanks.kicker.reservation", {
              sv: "Reservation",
              en: "Reservation",
              tr: "Rezervasyon",
            })
          : TT(i18n, t, "thanks.kicker.default", {
              sv: "Harmonic Star",
              en: "Harmonic Star",
              tr: "Harmonic Star",
            }),
    celeste: flow.isNotifyOnly
      ? TT(i18n, t, "thanks.celeste.notify", {
          sv: "Ditt intresse är sparat. Vi behandlar det som bevakning – inte som ett köp.",
          en: "Your interest is saved. We treat it as a notification request — not as a purchase.",
          tr: "İlgin kaydedildi. Bunu satın alma değil, bildirim isteği olarak ele alıyoruz.",
        })
      : flow.syncPending
        ? TT(i18n, t, "thanks.celeste.syncPending", {
            sv: "Ordern är tryggt sparad lokalt. Server-synken väntar och kan följas upp senare.",
            en: "The order is safely saved locally. Server sync is pending and can be followed up later.",
            tr: "Sipariş yerel olarak güvenle kaydedildi. Sunucu senkronu bekliyor ve sonra takip edilebilir.",
          })
        : flow.isMixed
          ? TT(i18n, t, "thanks.celeste.mixed", {
              sv: "Din blandade order är sparad. Vi håller vanliga köp och förbeställning tydligt åtskilda.",
              en: "Your mixed order is saved. We keep regular items and pre-orders clearly separated.",
              tr: "Karma siparişin kaydedildi. Normal ürünleri ve ön siparişleri net şekilde ayırıyoruz.",
            })
          : flow.hasPreorder
            ? TT(i18n, t, "thanks.celeste.preorder", {
                sv: "Din förbeställning är nu sparad. Ljuset följer dig vidare.",
                en: "Your pre-order is now saved. The light follows you onward.",
                tr: "Ön siparişin artık kaydedildi. Işık seninle devam ediyor.",
              })
            : TT(i18n, t, "thanks.celeste", {
                sv: "Allt är klart nu. Ljuset följer dig vidare.",
                en: "It is complete now. The light follows you onward.",
                tr: "Artık tamam. Işık seninle devam ediyor.",
              }),
  };

  if (!id) {
    return (
      <div className="container" role="main">
        <div className="card thanks-card">
          <div className="thanks-kicker-row">
            <span className="thanks-live-dot" />
            <span className="thanks-kicker">{L.kicker}</span>
          </div>

          <h1 className="h1">
            {TT(i18n, t, "thanks.missingIdTitle", {
              sv: "Tack!",
              en: "Thanks!",
              tr: "Teşekkürler!",
            })}
          </h1>

          <p className="lead">
            {TT(i18n, t, "thanks.missingIdBody", {
              sv: "Vi saknar order-id i länken. Gå till butiken och testa igen.",
              en: "We are missing the order id in the link. Go to the shop and try again.",
              tr: "Bağlantıda sipariş kimliği eksik. Mağazaya gidip tekrar deneyin.",
            })}
          </p>

          <div className="actions">
            <Link className="btn" to="/shop">
              {TT(i18n, t, "thanks.continue", {
                sv: "Fortsätt handla",
                en: "Continue shopping",
                tr: "Alışverişe devam et",
              })}
            </Link>
          </div>
        </div>

        <style>{baseStyles}</style>
      </div>
    );
  }

  return (
    <div className="container thanks-page" role="main" aria-labelledby="thanks-title">
      <div
        className={`card thanks-card ${
          flow.isNotifyOnly ? "thanks-card--notify" : flow.hasPreorder ? "thanks-card--preorder" : ""
        } ${flow.syncPending ? "thanks-card--sync-pending" : ""}`}
      >
        <div className="thanks-star" aria-hidden="true" />

        <div className="thanks-kicker-row">
          <span className="thanks-live-dot" />
          <span className="thanks-kicker">{L.kicker}</span>
        </div>

        <h1 id="thanks-title" className="h1">
          {flow.isNotifyOnly
            ? TT(i18n, t, "thanks.notifyTitle", {
                sv: "Intresset är sparat!",
                en: "Interest saved!",
                tr: "İlgin kaydedildi!",
              })
            : flow.isMixed
              ? isPreview
                ? TT(i18n, t, "thanks.previewMixedTitle", {
                    sv: "Testorder skapad!",
                    en: "Test order created!",
                    tr: "Test siparişi oluşturuldu!",
                  })
                : TT(i18n, t, "thanks.mixedTitle", {
                    sv: "Order mottagen!",
                    en: "Order received!",
                    tr: "Sipariş alındı!",
                  })
              : flow.hasPreorder
                ? isPreview
                  ? TT(i18n, t, "thanks.previewPreorderTitle", {
                      sv: "Test-förbeställning skapad!",
                      en: "Test pre-order created!",
                      tr: "Test ön siparişi oluşturuldu!",
                    })
                  : TT(i18n, t, "thanks.preorderTitle", {
                      sv: "Förbeställning mottagen!",
                      en: "Pre-order received!",
                      tr: "Ön sipariş alındı!",
                    })
                : isPreview
                  ? TT(i18n, t, "thanks.previewTitle", {
                      sv: "Testorder skapad!",
                      en: "Test order created!",
                      tr: "Test siparişi oluşturuldu!",
                    })
                  : TT(i18n, t, "thanks.title", {
                      sv: "Tack för ditt köp!",
                      en: "Thank you for your purchase!",
                      tr: "Satın aldığınız için teşekkürler!",
                    })}
        </h1>

        <p className="lead">
          {flow.isNotifyOnly ? (
            <>
              {TT(i18n, t, "thanks.notifyLeadStart", {
                sv: "Din bevakning",
                en: "Your notification request",
                tr: "Bildirim isteğiniz",
              })}{" "}
              <span className="mono strong">{id}</span>{" "}
              {TT(i18n, t, "thanks.notifyLeadEnd", {
                sv: "är sparad. Detta är inte ett köp, utan ett intresse som hjälper oss förstå efterfrågan.",
                en: "is saved. This is not a purchase, but an interest signal that helps us understand demand.",
                tr: "kaydedildi. Bu bir satın alma değil; talebi anlamamıza yardımcı olan bir ilgi sinyalidir.",
              })}
            </>
          ) : (
            <>
              {TT(i18n, t, "thanks.leadStart", {
                sv: "Din order",
                en: "Your order",
                tr: "Siparişiniz",
              })}{" "}
              <span className="mono strong">{id}</span>{" "}
              {flow.isMixed
                ? TT(i18n, t, "thanks.mixedLeadEnd", {
                    sv: "är sparad som blandad order. Vanliga produkter och förbeställningar hålls tydligt markerade.",
                    en: "is saved as a mixed order. Regular items and pre-orders stay clearly marked.",
                    tr: "karma sipariş olarak kaydedildi. Normal ürünler ve ön siparişler net şekilde işaretlenir.",
                  })
                : flow.hasPreorder
                  ? TT(i18n, t, "thanks.preorderLeadEnd", {
                      sv: "är mottagen som förbeställning. Din reservation är sparad och syns tydligt i kvittot.",
                      en: "has been received as a pre-order. Your reservation is saved and clearly shown in the receipt.",
                      tr: "ön sipariş olarak alındı. Rezervasyonun kaydedildi ve fişte net şekilde görünür.",
                    })
                  : isPreview
                    ? TT(i18n, t, "thanks.previewLeadEnd", {
                        sv: "är sparad lokalt i preview. Du kan se kvittot direkt.",
                        en: "is saved locally in preview. You can view the receipt right away.",
                        tr: "preview modunda yerel olarak kaydedildi. Fişi hemen görebilirsiniz.",
                      })
                    : TT(i18n, t, "thanks.leadEnd", {
                        sv: "är mottagen. Du kan se och skriva ut ditt kvitto när som helst.",
                        en: "is received. You can view and print your receipt anytime.",
                        tr: "alındı. Fişinizi istediğiniz zaman görüntüleyip yazdırabilirsiniz.",
                      })}
            </>
          )}
        </p>

        <div className="thanks-signal-row" aria-hidden="true">
          <span className="thanks-signal">
            {flow.isNotifyOnly
              ? TT(i18n, t, "thanks.signal.notify", {
                  sv: "Bevaka",
                  en: "Notify",
                  tr: "Bildir",
                })
              : flow.isMixed
                ? TT(i18n, t, "thanks.signal.mixed", {
                    sv: "Blandad order",
                    en: "Mixed order",
                    tr: "Karma sipariş",
                  })
                : flow.hasPreorder
                  ? TT(i18n, t, "thanks.signal.preorder", {
                      sv: "Förbeställning",
                      en: "Pre-order",
                      tr: "Ön sipariş",
                    })
                  : isPreview
                    ? TT(i18n, t, "thanks.signal.previewOrder", {
                        sv: "Preview-order",
                        en: "Preview order",
                        tr: "Preview sipariş",
                      })
                    : TT(i18n, t, "thanks.signal.confirmed", {
                        sv: "Bekräftad",
                        en: "Confirmed",
                        tr: "Onaylandı",
                      })}
          </span>

          <span className="thanks-signal">
            {isPreview
              ? TT(i18n, t, "thanks.signal.preview", {
                  sv: "Preview",
                  en: "Preview",
                  tr: "Preview",
                })
              : TT(i18n, t, "thanks.signal.live", {
                  sv: "Live",
                  en: "Live",
                  tr: "Live",
                })}
          </span>

          <span className="thanks-signal">{getSyncStatusLabel(flow, finalizeState, i18n, t)}</span>
        </div>

        {flow.syncPending ? (
          <div className="syncBox" role="status" aria-live="polite">
            <div className="syncBoxTitle">
              {TT(i18n, t, "thanks.syncPending.title", {
                sv: "Sparad lokalt – server-synk väntar",
                en: "Saved locally — server sync pending",
                tr: "Yerel kaydedildi — sunucu senkronu bekliyor",
              })}
            </div>
            <div className="syncBoxLead">
              {TT(i18n, t, "thanks.syncPending.lead", {
                sv: "Sidan har ändå kvitto och order-id. När serverkontakten fungerar igen kan ordern följas upp via admin/pending server write.",
                en: "The page still has a receipt and order id. When server contact works again, the order can be followed up through admin/pending server write.",
                tr: "Sayfada yine de fiş ve sipariş kimliği var. Sunucu bağlantısı tekrar çalıştığında sipariş admin/pending server write üzerinden takip edilebilir.",
              })}
            </div>
          </div>
        ) : null}

        {flow.isNotifyOnly ? (
          <div className="notifyBox">
            <div className="notifyBoxTitle">
              {TT(i18n, t, "thanks.notify.boxTitle", {
                sv: "Bevakning registrerad",
                en: "Notification request saved",
                tr: "Bildirim isteği kaydedildi",
              })}
            </div>

            <div className="notifyBoxLead">
              {TT(i18n, t, "thanks.notify.boxLead", {
                sv: "Det här flödet ska inte räknas som en order. Det används för att mäta intresse och kontakta kunden när produkten öppnar.",
                en: "This flow should not count as an order. It is used to measure interest and contact the customer when the product opens.",
                tr: "Bu akış sipariş sayılmamalıdır. İlgi ölçmek ve ürün açıldığında müşteriye ulaşmak için kullanılır.",
              })}
            </div>
          </div>
        ) : flow.hasPreorder ? (
          <div className={`preorderBox ${flow.isMixed ? "preorderBox--mixed" : ""}`}>
            <div className="preorderBoxTitle">
              {flow.isMixed
                ? TT(i18n, t, "thanks.mixed.boxTitle", {
                    sv: "Blandad order sparad",
                    en: "Mixed order saved",
                    tr: "Karma sipariş kaydedildi",
                  })
                : TT(i18n, t, "thanks.preorder.boxTitle", {
                    sv: "Din plats är reserverad",
                    en: "Your place is reserved",
                    tr: "Yeriniz rezerve edildi",
                  })}
            </div>

            <div className="preorderBoxLead">
              {flow.isMixed
                ? TT(i18n, t, "thanks.mixed.boxLead", {
                    sv: "Ordern innehåller både vanliga produkter och förbeställning. Förbeställda rader hanteras i separat produktionsvåg.",
                    en: "The order contains both regular items and a pre-order. Pre-order lines are handled in a separate production wave.",
                    tr: "Sipariş hem normal ürünler hem de ön sipariş içeriyor. Ön sipariş satırları ayrı üretim dalgasında işlenir.",
                  })
                : TT(i18n, t, "thanks.preorder.boxLead", {
                    sv: "Det här flödet är registrerat som förbeställning och inte som vanlig direktleverans.",
                    en: "This flow is registered as a pre-order and not as a normal direct delivery.",
                    tr: "Bu akış normal doğrudan teslimat değil, ön sipariş olarak kaydedildi.",
                  })}
            </div>

            {reservationCode ? (
              <div className="preorderReservationRow">
                <span className="preorderReservationLabel">
                  {TT(i18n, t, "thanks.preorder.reservationLabel", {
                    sv: "Reservationskod",
                    en: "Reservation code",
                    tr: "Rezervasyon kodu",
                  })}
                </span>
                <span className="preorderReservationCode mono">{reservationCode}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {!order ? (
          <p className="hint hint-warn">
            {TT(i18n, t, "thanks.orderMissing", {
              sv: "Obs: Vi hittar inte orderdetaljerna i denna webbläsare. Kvittolänken kan ändå öppnas om ordern finns sparad på servern.",
              en: "Note: We cannot find the order details in this browser. The receipt link may still work if the order is saved on the server.",
              tr: "Not: Bu tarayıcıda sipariş detaylarını bulamıyoruz. Sipariş sunucuda kayıtlıysa fiş bağlantısı yine çalışabilir.",
            })}
          </p>
        ) : null}

        {!flow.isNotifyOnly ? (
          <div className="dreamBox" aria-live="polite">
            <div className="dreamHead">
              <div className="dreamTitle">DreamPoints</div>
              <div className="dreamBadge">{levelLabel(level, i18n, t)}</div>
            </div>

            <div className="dreamGrid">
              <div className="dreamStat">
                <div className="dreamLabel">
                  {TT(i18n, t, "thanks.dreamPoints.balance", {
                    sv: "Poängsaldo",
                    en: "Points balance",
                    tr: "Puan bakiyesi",
                  })}
                </div>
                <div className="dreamValue">{Number(points || 0)}</div>
              </div>

              <div className="dreamStat">
                <div className="dreamLabel">
                  {TT(i18n, t, "thanks.dreamPoints.earned", {
                    sv: "Intjänat på ordern",
                    en: "Earned on this order",
                    tr: "Bu siparişte kazanılan",
                  })}
                </div>
                <div className="dreamValue">{Number(dreamAward?.earned || 0)} p</div>
              </div>
            </div>

            <div className="dreamHint">
              {dreamAward?.earned > 0
                ? TT(i18n, t, "thanks.dreamPoints.success", {
                    sv: "Poängen är registrerade och följer med dig vidare i Calestra.",
                    en: "Your points are registered and move forward with you in Calestra.",
                    tr: "Puanlarınız kaydedildi ve Calestra'da sizinle devam ediyor.",
                  })
                : TT(i18n, t, "thanks.dreamPoints.pending", {
                    sv: "Poängstatus visas här när den finns sparad på ordern.",
                    en: "Points status is shown here once saved on the order.",
                    tr: "Puan durumu siparişte kayıtlı olduğunda burada gösterilir.",
                  })}
            </div>
          </div>
        ) : null}

        <details className="metaBox">
          <summary className="metaTitle">
            {TT(i18n, t, "thanks.meta.title", {
              sv: "Orderdata",
              en: "Order data",
              tr: "Sipariş verisi",
            })}
          </summary>

          <div className="metaGrid">
            {flow.flowType ? <div className="metaChip">Flow: {flow.flowType}</div> : null}
            {flow.syncPending ? <div className="metaChip">Sync: pending</div> : null}
            {core.memberTier ? <div className="metaChip">Tier: {core.memberTier}</div> : null}
            {core.campaignId ? <div className="metaChip">Campaign: {core.campaignId}</div> : null}
            {core.creatorId ? <div className="metaChip">Creator: {core.creatorId}</div> : null}
            {core.affiliateId ? <div className="metaChip">Affiliate: {core.affiliateId}</div> : null}
            {core.associateCode ? <div className="metaChip">Code: {core.associateCode}</div> : null}
            {core.sourceChannel ? <div className="metaChip">Channel: {core.sourceChannel}</div> : null}
          </div>
        </details>

        <div className="celeste-note" aria-live="polite">
          <span className="celeste-dot" />
          <span>{L.celeste}</span>
        </div>

        <div className="actions">
          {!flow.isNotifyOnly ? (
            <Link className="btn" to={`/receipt/${encodeURIComponent(id || "")}${receiptQuery}`}>
              {TT(i18n, t, "thanks.viewReceipt", {
                sv: "Visa kvitto",
                en: "View receipt",
                tr: "Fişi görüntüle",
              })}
            </Link>
          ) : null}

          {!flow.isNotifyOnly ? (
            <button className="btn btn-ghost" type="button" onClick={copyReceiptLink}>
              {copied
                ? TT(i18n, t, "thanks.copied", {
                    sv: "Kopierat!",
                    en: "Copied!",
                    tr: "Kopyalandı!",
                  })
                : TT(i18n, t, "thanks.copyReceiptLink", {
                    sv: "Kopiera kvittolänk",
                    en: "Copy receipt link",
                    tr: "Fiş bağlantısını kopyala",
                  })}
            </button>
          ) : null}

          {!flow.isNotifyOnly ? (
            <button className="btn btn-ghost" type="button" onClick={shareReceipt}>
              {TT(i18n, t, "thanks.share", { sv: "Dela", en: "Share", tr: "Paylaş" })}
            </button>
          ) : null}

          {!flow.isNotifyOnly ? (
            <button className="btn btn-ghost" type="button" onClick={printReceipt}>
              {TT(i18n, t, "thanks.print", { sv: "Skriv ut", en: "Print", tr: "Yazdır" })}
            </button>
          ) : null}

          <Link className="btn btn-ghost" to="/shop">
            {TT(i18n, t, "thanks.continue", {
              sv: "Fortsätt handla",
              en: "Continue shopping",
              tr: "Alışverişe devam et",
            })}
          </Link>
        </div>

        <div className="hint">
          {flow.isNotifyOnly
            ? TT(i18n, t, "thanks.notifyHint", {
                sv: "Bevaka-läge används för produkter som inte ska säljas ännu. Ingen betalning tas och ingen vanlig order skapas.",
                en: "Notify mode is used for products that should not be sold yet. No payment is taken and no regular order is created.",
                tr: "Bildirim modu henüz satılmaması gereken ürünler için kullanılır. Ödeme alınmaz ve normal sipariş oluşturulmaz.",
              })
            : isPreview
              ? TT(i18n, t, "thanks.previewHint", {
                  sv: "Preview: Ingen betalning tas. Detta är ett testflöde som hjälper dig validera order, kvitto och adminspårning.",
                  en: "Preview: No payment is taken. This is a test flow to validate order, receipt, and admin tracking.",
                  tr: "Preview: Ödeme alınmaz. Bu akış sipariş, fiş ve admin takibini doğrulamak içindir.",
                })
              : TT(i18n, t, "thanks.hint", {
                  sv: "Tips: Spara kvittolänken. Den fungerar även utan konto.",
                  en: "Tip: Save the receipt link. It works even without an account.",
                  tr: "İpucu: Fiş bağlantısını kaydedin. Hesap olmadan da çalışır.",
                })}
        </div>
      </div>

      <style>{baseStyles}</style>
    </div>
  );
}

const baseStyles = `
  .container{
    max-width:860px;
    margin:0 auto;
    padding:16px;
  }

  .thanks-page{
    padding-top:8px;
    padding-bottom:36px;
  }

  .thanks-card{
    position:relative;
    overflow:hidden;
    background:linear-gradient(180deg, rgba(255,255,255,.97), rgba(248,250,252,.99));
    border-radius:24px;
    padding:24px;
    border:1px solid rgba(15,23,42,.06);
    box-shadow:0 18px 42px rgba(15,23,42,.08);
  }

  .theme-dark .thanks-card{
    background:linear-gradient(180deg, rgba(15,22,34,.98), rgba(8,12,20,.98));
    border-color:rgba(255,255,255,.06);
    box-shadow:0 16px 40px rgba(0,0,0,.35);
  }

  .thanks-star{
    position:absolute;
    inset:auto -10% -18% auto;
    width:240px;
    height:240px;
    border-radius:999px;
    background:radial-gradient(circle, rgba(250,204,21,.18), rgba(250,204,21,0));
    filter:blur(10px);
    pointer-events:none;
  }

  .thanks-card--notify .thanks-star{
    background:radial-gradient(circle, rgba(59,130,246,.18), rgba(59,130,246,0));
  }

  .thanks-card--sync-pending .thanks-star{
    background:radial-gradient(circle, rgba(249,115,22,.20), rgba(249,115,22,0));
  }

  .thanks-kicker-row{
    display:inline-flex;
    align-items:center;
    gap:8px;
    padding:6px 10px;
    border-radius:999px;
    background:rgba(15,23,42,.05);
    border:1px solid rgba(15,23,42,.08);
    color:#475569;
    font-size:11px;
    font-weight:1000;
    letter-spacing:.08em;
    text-transform:uppercase;
    margin-bottom:12px;
    position:relative;
    z-index:1;
  }

  .theme-dark .thanks-kicker-row{
    background:rgba(255,255,255,.05);
    border-color:rgba(148,163,184,.18);
    color:#cbd5e1;
  }

  .thanks-live-dot{
    width:8px;
    height:8px;
    border-radius:999px;
    background:#f97316;
    box-shadow:0 0 0 0 rgba(249,115,22,.45);
    animation:thanksPulse 1.8s infinite;
  }

  @keyframes thanksPulse{
    0%{ box-shadow:0 0 0 0 rgba(249,115,22,.45); }
    70%{ box-shadow:0 0 0 8px rgba(249,115,22,0); }
    100%{ box-shadow:0 0 0 0 rgba(249,115,22,0); }
  }

  .h1{
    font-size:clamp(30px, 4.4vw, 54px);
    line-height:1.02;
    letter-spacing:-.045em;
    margin:0 0 8px;
    color:#0f172a;
    position:relative;
    z-index:1;
  }

  .theme-dark .h1{
    color:#f8fafc;
  }

  .lead{
    margin:4px 0 12px;
    color:#334155;
    line-height:1.65;
    font-size:15px;
    font-weight:700;
    position:relative;
    z-index:1;
  }

  .theme-dark .lead{
    color:#c9d2e3;
  }

  .thanks-signal-row{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    margin:0 0 12px;
    position:relative;
    z-index:1;
  }

  .thanks-signal{
    display:inline-flex;
    align-items:center;
    padding:6px 10px;
    border-radius:999px;
    background:rgba(15,23,42,.05);
    border:1px solid rgba(15,23,42,.08);
    color:#475569;
    font-size:11px;
    font-weight:1000;
    letter-spacing:.08em;
    text-transform:uppercase;
  }

  .theme-dark .thanks-signal{
    background:rgba(255,255,255,.05);
    border-color:rgba(148,163,184,.16);
    color:#cbd5e1;
  }

  .syncBox,
  .preorderBox,
  .notifyBox{
    margin:0 0 12px;
    padding:14px;
    border-radius:18px;
    position:relative;
    z-index:1;
  }

  .syncBox{
    border:1px solid rgba(249,115,22,.28);
    background:linear-gradient(180deg, rgba(249,115,22,.10), rgba(250,204,21,.05));
  }

  .preorderBox{
    border:1px solid rgba(249,115,22,.28);
    background:linear-gradient(180deg, rgba(249,115,22,.10), rgba(250,204,21,.05));
  }

  .preorderBox--mixed{
    border-color:rgba(59,130,246,.24);
    background:linear-gradient(180deg, rgba(59,130,246,.10), rgba(250,204,21,.05));
  }

  .notifyBox{
    border:1px solid rgba(59,130,246,.24);
    background:linear-gradient(180deg, rgba(59,130,246,.10), rgba(125,211,252,.05));
  }

  .theme-dark .syncBox,
  .theme-dark .preorderBox{
    background:linear-gradient(180deg, rgba(249,115,22,.14), rgba(255,255,255,.03));
    border-color:rgba(249,115,22,.24);
  }

  .theme-dark .preorderBox--mixed,
  .theme-dark .notifyBox{
    background:linear-gradient(180deg, rgba(59,130,246,.14), rgba(255,255,255,.03));
    border-color:rgba(96,165,250,.22);
  }

  .syncBoxTitle,
  .preorderBoxTitle,
  .notifyBoxTitle{
    font-size:14px;
    font-weight:1000;
    color:#0f172a;
  }

  .theme-dark .syncBoxTitle,
  .theme-dark .preorderBoxTitle,
  .theme-dark .notifyBoxTitle{
    color:#f8fafc;
  }

  .syncBoxLead,
  .preorderBoxLead,
  .notifyBoxLead{
    margin-top:6px;
    font-size:13px;
    line-height:1.55;
    font-weight:900;
  }

  .syncBoxLead,
  .preorderBoxLead{
    color:#7c2d12;
  }

  .preorderBox--mixed .preorderBoxLead,
  .notifyBoxLead{
    color:#1d4ed8;
  }

  .theme-dark .syncBoxLead,
  .theme-dark .preorderBoxLead{
    color:#fed7aa;
  }

  .theme-dark .preorderBox--mixed .preorderBoxLead,
  .theme-dark .notifyBoxLead{
    color:#bfdbfe;
  }

  .preorderReservationRow{
    margin-top:10px;
    display:flex;
    flex-wrap:wrap;
    align-items:center;
    gap:8px;
  }

  .preorderReservationLabel{
    font-size:12px;
    font-weight:1000;
    color:#7c2d12;
    text-transform:uppercase;
    letter-spacing:.05em;
  }

  .preorderBox--mixed .preorderReservationLabel{
    color:#1d4ed8;
  }

  .preorderReservationCode{
    display:inline-flex;
    align-items:center;
    min-height:32px;
    padding:0 10px;
    border-radius:999px;
    background:rgba(255,255,255,.72);
    border:1px solid rgba(15,23,42,.08);
    color:#0f172a;
    font-size:12px;
    font-weight:1000;
  }

  .theme-dark .preorderReservationCode{
    background:rgba(255,255,255,.06);
    border-color:rgba(148,163,184,.18);
    color:#f8fafc;
  }

  .dreamBox{
    margin:12px 0 4px;
    padding:14px;
    border-radius:18px;
    border:1px solid rgba(250,204,21,.28);
    background:linear-gradient(180deg, rgba(250,204,21,.10), rgba(250,204,21,.04));
    position:relative;
    z-index:1;
  }

  .theme-dark .dreamBox{
    border-color:rgba(250,204,21,.20);
    background:linear-gradient(180deg, rgba(250,204,21,.10), rgba(255,255,255,.03));
  }

  .dreamHead{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    flex-wrap:wrap;
  }

  .dreamTitle{
    font-size:14px;
    font-weight:1000;
    color:#0f172a;
  }

  .theme-dark .dreamTitle{
    color:#f8fafc;
  }

  .dreamBadge{
    padding:5px 10px;
    border-radius:999px;
    background:rgba(255,255,255,.72);
    border:1px solid rgba(15,23,42,.08);
    color:#0f172a;
    font-size:11px;
    font-weight:1000;
    text-transform:capitalize;
  }

  .theme-dark .dreamBadge{
    background:rgba(255,255,255,.06);
    border-color:rgba(148,163,184,.18);
    color:#f8fafc;
  }

  .dreamGrid{
    margin-top:10px;
    display:grid;
    grid-template-columns:repeat(2, minmax(0,1fr));
    gap:10px;
  }

  .dreamStat{
    border-radius:14px;
    padding:12px;
    background:rgba(255,255,255,.72);
    border:1px solid rgba(15,23,42,.06);
  }

  .theme-dark .dreamStat{
    background:rgba(255,255,255,.04);
    border-color:rgba(148,163,184,.14);
  }

  .dreamLabel{
    font-size:11px;
    color:#64748b;
    font-weight:900;
  }

  .theme-dark .dreamLabel{
    color:#cbd5e1;
  }

  .dreamValue{
    margin-top:4px;
    font-size:22px;
    line-height:1.1;
    font-weight:1000;
    color:#0f172a;
  }

  .theme-dark .dreamValue{
    color:#f8fafc;
  }

  .dreamHint{
    margin-top:10px;
    font-size:12px;
    line-height:1.5;
    color:#475569;
    font-weight:800;
  }

  .theme-dark .dreamHint{
    color:#cbd5e1;
  }

  .metaBox{
    margin-top:12px;
    padding:12px;
    border-radius:16px;
    border:1px solid rgba(15,23,42,.08);
    background:rgba(15,23,42,.03);
    position:relative;
    z-index:1;
  }

  .theme-dark .metaBox{
    background:rgba(255,255,255,.04);
    border-color:rgba(148,163,184,.14);
  }

  .metaTitle{
    cursor:pointer;
    font-size:12px;
    font-weight:1000;
    color:#0f172a;
    text-transform:uppercase;
    letter-spacing:.05em;
  }

  .theme-dark .metaTitle{
    color:#f8fafc;
  }

  .metaGrid{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    margin-top:10px;
  }

  .metaChip{
    display:inline-flex;
    align-items:center;
    border-radius:999px;
    padding:5px 10px;
    font-size:12px;
    font-weight:800;
    background:#fff;
    border:1px solid rgba(15,23,42,.08);
    color:#334155;
  }

  .theme-dark .metaChip{
    background:rgba(255,255,255,.05);
    border-color:rgba(148,163,184,.14);
    color:#cbd5e1;
  }

  .celeste-note{
    margin-top:10px;
    display:flex;
    align-items:center;
    gap:8px;
    font-size:12px;
    font-weight:800;
    color:#475569;
    opacity:.92;
    position:relative;
    z-index:1;
  }

  .theme-dark .celeste-note{
    color:#cbd5e1;
  }

  .celeste-dot{
    width:6px;
    height:6px;
    border-radius:999px;
    background:#facc15;
    box-shadow:0 0 0 6px rgba(250,204,21,.12);
  }

  .mono{
    font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  }

  .strong{
    font-weight:900;
  }

  .actions{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    margin-top:14px;
    position:relative;
    z-index:1;
  }

  .btn{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-height:44px;
    padding:0 14px;
    border-radius:999px;
    background:linear-gradient(135deg,#4B6BFA,#3558ff);
    color:#fff;
    text-decoration:none;
    font-weight:900;
    border:0;
    cursor:pointer;
    box-shadow:0 14px 28px rgba(75,107,250,.16);
    transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
  }

  .btn:hover{
    background:linear-gradient(135deg,#3F5BE0,#2948d8);
    transform:translateY(-1px);
  }

  .btn-ghost{
    background:transparent;
    border:1px solid #4B6BFA;
    color:#4B6BFA;
    box-shadow:none;
  }

  .btn-ghost:hover{
    background:#eef2ff;
  }

  .theme-dark .btn-ghost{
    border-color:#4B6BFA;
    color:#cfe0ff;
  }

  .theme-dark .btn-ghost:hover{
    background:#0b1424;
  }

  .hint{
    margin-top:12px;
    color:#6b7280;
    font-size:14px;
    line-height:1.55;
    position:relative;
    z-index:1;
  }

  .hint-warn{
    padding:10px 12px;
    border-radius:14px;
    background:rgba(245,158,11,.08);
    border:1px solid rgba(245,158,11,.20);
    color:#92400e;
    font-weight:800;
  }

  .theme-dark .hint{
    color:#9aa3af;
  }

  .theme-dark .hint-warn{
    color:#fde68a;
    background:rgba(245,158,11,.10);
    border-color:rgba(245,158,11,.20);
  }

  @media (max-width: 720px){
    .container{
      padding:12px;
    }

    .thanks-card{
      padding:18px;
      border-radius:20px;
    }

    .dreamGrid{
      grid-template-columns:1fr;
    }

    .actions .btn{
      width:100%;
    }

    .preorderReservationRow{
      align-items:flex-start;
      flex-direction:column;
    }
  }

  @media (prefers-reduced-motion: reduce){
    .thanks-live-dot,
    .btn{
      animation:none;
      transition:none;
    }
  }
`;