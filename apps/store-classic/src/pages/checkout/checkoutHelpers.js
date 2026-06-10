// D:\WebProjects\Calestra\apps\store-classic\src\pages\checkout\checkoutHelpers.js
// apps/store-classic/src/pages/checkout/checkoutHelpers.js

import { TT } from "../../i18n/tt.js";
import { formatMoney, convertFromSEK } from "../../utils/money.js";
import {
  safeJsonParse,
  readLsValue,
  readLsJson,
  writeLsJson,
  writeSessionJson,
  readSessionJson,
  removeLsKey,
} from "./storage.js";
import {
  IS_PREVIEW,
  ORDER_REGISTER_URL,
  ORDERS_INGEST_URL,
  CHECKOUT_DRAFT_URL,
  DISCOUNT_VALIDATE_URL,
  CHECKOUT_DRAFT_ID_KEY,
  CHECKOUT_DRAFT_SNAPSHOT_KEY,
  PENDING_ORDER_LS_KEY,
  CHECKOUT_PREFILL_KEY,
  MEMBER_PROFILE_CUSTOMER_KEY,
  MEMBER_PROFILE_SHIPPING_KEY,
  MEMBER_PROFILE_BILLING_KEY,
  ANALYTICS_QUEUE_KEY,
  CHECKOUT_BEGIN_FALLBACK_KEY,
  ORDER_LIST_KEY,
  ORDER_LAST_KEY,
  ORDER_CURRENT_KEY,
} from "./checkoutConfig.js";

/* ==================== Status ==================== */
export async function fetchStatusSafe() {
  const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
  const to = ac ? setTimeout(() => ac.abort(), 2500) : null;

  try {
    const r = await fetch("/api/status", {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: ac ? ac.signal : undefined,
    });

    const text = await r.text();
    let data = null;

    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, error: text || `HTTP ${r.status}` };
    }

    if (!r.ok) return { ok: false, error: data?.error || `HTTP ${r.status}` };
    return data;
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  } finally {
    if (to) clearTimeout(to);
  }
}

/* ==================== Small helpers ==================== */
export function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

export function asInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function getParam(searchParams, names) {
  const list = Array.isArray(names) ? names : [names];

  for (const name of list) {
    const v = searchParams?.get?.(name);
    if (v != null && String(v).trim()) return String(v).trim();
  }

  return "";
}

export function normalizeCode(value, max = 160) {
  return cleanString(value || "", max)
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, max);
}

export function pickFirst(...values) {
  for (const value of values) {
    const v = cleanString(value || "", 500);
    if (v) return v;
  }

  return "";
}

export function normalizeAffiliateInput(input) {
  if (!input) return "";
  if (typeof input === "string") return normalizeCode(input, 160);

  if (typeof input === "object") {
    return normalizeCode(
      input.id ||
        input.affiliateId ||
        input.affiliate_id ||
        input.affiliateCode ||
        input.affiliate_code ||
        input.code ||
        input.slug ||
        input.handle ||
        input.ref ||
        "",
      160
    );
  }

  return "";
}

export function normalizeLineKey(item, idx = 0) {
  return cleanString(
    item?.lineKey ||
      item?.variantKey ||
      item?.id ||
      item?.product?.id ||
      `line_${idx}`,
    240
  );
}

export function truthyFlag(value) {
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
    "waiting_preorder",
    "waiting-preorder",
    "waiting preorder",
    "notify",
    "notify_me",
    "notify-me",
    "notify me",
    "notify_only",
    "notify-only",
    "notify only",
    "back_in_stock",
    "back-in-stock",
    "back in stock",
    "watch_only",
    "watch-only",
    "watch only",
  ].includes(s);
}

export function getNested(obj, path) {
  try {
    return String(path || "")
      .split(".")
      .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  } catch {
    return undefined;
  }
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

function normalizeCategory(value) {
  return normalizeSearchText(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

function arrayFromMaybe(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function extractSearchTexts(item) {
  const values = [
    item?.badge,
    item?.status,
    item?.variant,
    item?.variantTitle,
    item?.title,
    item?.name,
    item?.slug,
    item?.handle,
    item?.url,
    item?.sku,
    item?.category,
    item?.type,
    item?.lineMode,
    item?.orderType,
    item?.ctaMode,
    item?.saleType,
    item?.purchaseType,
    item?.fulfillmentType,
    item?.fulfilmentType,
    item?.fulfillmentStatus,
    item?.availabilityType,
    item?.availabilityLabel,
    item?.availabilityText,

    item?.product?.title,
    item?.product?.name,
    item?.product?.status,
    item?.product?.badge,
    item?.product?.subtitle,
    item?.product?.description,
    item?.product?.slug,
    item?.product?.handle,
    item?.product?.url,
    item?.product?.sku,
    item?.product?.category,
    item?.product?.type,
    item?.product?.lineMode,
    item?.product?.orderType,
    item?.product?.ctaMode,
    item?.product?.fulfillmentType,
    item?.product?.fulfilmentType,
    item?.product?.fulfillmentStatus,
    item?.product?.availabilityType,
    item?.product?.availabilityLabel,
    item?.product?.availabilityText,

    item?.meta?.label,
    item?.meta?.statusLabel,
    item?.meta?.badge,
    item?.meta?.slug,
    item?.meta?.handle,
    item?.meta?.category,
    item?.meta?.type,
    item?.meta?.lineMode,
    item?.meta?.orderType,
    item?.meta?.ctaMode,
    item?.meta?.fulfillmentType,
    item?.meta?.fulfilmentType,
    item?.meta?.fulfillmentStatus,
    item?.meta?.availabilityType,
    item?.meta?.availabilityLabel,
    item?.meta?.availabilityText,

    getNested(item, "product.meta.slug"),
    getNested(item, "product.meta.handle"),
    getNested(item, "product.meta.badge"),
    getNested(item, "product.meta.status"),
    getNested(item, "product.meta.category"),
    getNested(item, "product.meta.type"),
    getNested(item, "product.meta.lineMode"),
    getNested(item, "product.meta.orderType"),
    getNested(item, "product.meta.ctaMode"),
    getNested(item, "product.meta.fulfillmentType"),
    getNested(item, "product.meta.fulfilmentType"),
    getNested(item, "product.meta.fulfillmentStatus"),
    getNested(item, "product.meta.availabilityType"),
    getNested(item, "product.meta.availabilityLabel"),
    getNested(item, "product.meta.availabilityText"),
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

function hasPreorderKeyword(text) {
  if (!text) return false;

  return (
    text.includes("preorder") ||
    text.includes("pre order") ||
    text.includes("pre-order") ||
    text.includes("pre_order") ||
    text.includes("forbestall") ||
    text.includes("for bestall") ||
    text.includes("förbeställ") ||
    text.includes("forhandsbok") ||
    text.includes("förhandsbok") ||
    text.includes("forhandsreservation") ||
    text.includes("förhandsreservation") ||
    text.includes("reservation") ||
    text.includes("reserve") ||
    text.includes("coming soon") ||
    text.includes("launch only") ||
    text.includes("first drop") ||
    text.includes("first wave") ||
    text.includes("on siparis") ||
    text.includes("ön sipariş")
  );
}

function hasNotifyKeyword(text) {
  if (!text) return false;

  return (
    text.includes("notify") ||
    text.includes("notify me") ||
    text.includes("notify-me") ||
    text.includes("notify_me") ||
    text.includes("notify only") ||
    text.includes("back in stock") ||
    text.includes("back-in-stock") ||
    text.includes("back_in_stock") ||
    text.includes("restock alert") ||
    text.includes("mail me") ||
    text.includes("watch only") ||
    text.includes("bevaka") ||
    text.includes("meddela mig")
  );
}

function getDirectLineMode(item) {
  return normalizeSearchText(
    item?.lineMode ||
      item?.orderType ||
      item?.ctaMode ||
      item?.saleType ||
      item?.purchaseType ||
      item?.fulfillmentType ||
      item?.fulfilmentType ||
      item?.availabilityType ||
      item?.meta?.lineMode ||
      item?.meta?.orderType ||
      item?.meta?.ctaMode ||
      item?.meta?.saleType ||
      item?.meta?.purchaseType ||
      item?.meta?.fulfillmentType ||
      item?.meta?.fulfilmentType ||
      item?.meta?.availabilityType ||
      item?.product?.lineMode ||
      item?.product?.orderType ||
      item?.product?.ctaMode ||
      item?.product?.saleType ||
      item?.product?.purchaseType ||
      item?.product?.fulfillmentType ||
      item?.product?.fulfilmentType ||
      item?.product?.availabilityType ||
      getNested(item, "product.meta.lineMode") ||
      getNested(item, "product.meta.orderType") ||
      getNested(item, "product.meta.ctaMode") ||
      getNested(item, "product.meta.fulfillmentType") ||
      getNested(item, "product.meta.fulfilmentType") ||
      getNested(item, "product.meta.availabilityType") ||
      ""
  );
}

function itemHasCategory(item, category) {
  const key = normalizeCategory(category);
  if (!key) return false;

  const values = [
    item?.category,
    item?.product?.category,
    item?.meta?.category,
    getNested(item, "product.meta.category"),
    ...arrayFromMaybe(item?.categories),
    ...arrayFromMaybe(item?.product?.categories),
    ...arrayFromMaybe(item?.meta?.categories),
    ...arrayFromMaybe(getNested(item, "product.meta.categories")),
  ]
    .map(normalizeCategory)
    .filter(Boolean);

  return values.includes(key);
}

function detectSpecialCategory(item) {
  const text = extractSearchTexts(item).join(" ");

  if (
    itemHasCategory(item, "market-lab") ||
    text.includes("market lab") ||
    text.includes("future idea") ||
    text.includes("future ideas") ||
    text.includes("concept") ||
    text.includes("prototype")
  ) {
    return "market-lab";
  }

  if (
    itemHasCategory(item, "travel") ||
    text.includes("travel") ||
    text.includes("resa") ||
    text.includes("seyahat") ||
    text.includes("bagage") ||
    text.includes("luggage")
  ) {
    return "travel";
  }

  if (
    itemHasCategory(item, "supply") ||
    text.includes("supply") ||
    text.includes("starter kit") ||
    text.includes("starter pack") ||
    text.includes("nödkit") ||
    text.includes("nodkit")
  ) {
    return "supply";
  }

  return "";
}

function getPreorderLeadDays(item) {
  const val =
    item?.preorderLeadDays ??
    item?.leadDays ??
    item?.meta?.preorderLeadDays ??
    item?.meta?.leadDays ??
    item?.product?.preorderLeadDays ??
    item?.product?.leadDays ??
    getNested(item, "product.meta.preorderLeadDays") ??
    getNested(item, "product.meta.leadDays") ??
    null;

  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function slimImageList(images) {
  if (!Array.isArray(images)) return undefined;

  const next = images
    .slice(0, 4)
    .map((img) => {
      if (!img || typeof img !== "object") return null;

      return {
        image: cleanString(img.image || img.src || "", 1000),
        alt: cleanString(img.alt || "", 240) || undefined,
      };
    })
    .filter(Boolean);

  return next.length ? next : undefined;
}

export function slimProductSnapshot(product) {
  if (!product || typeof product !== "object") return undefined;

  const mode = getDirectLineMode(product);
  const preorder =
    truthyFlag(product.preorder) ||
    truthyFlag(product.preOrder) ||
    truthyFlag(product.isPreorder) ||
    truthyFlag(product.preorderOnly) ||
    truthyFlag(product.comingSoon) ||
    truthyFlag(product.launchOnly) ||
    mode === "preorder" ||
    mode === "pre order" ||
    mode === "pre-order" ||
    mode === "pre_order";

  const notifyOnly =
    truthyFlag(product.notifyOnly) ||
    truthyFlag(product.notifyMe) ||
    truthyFlag(product.backInStockOnly) ||
    mode === "notify" ||
    mode === "notify me" ||
    mode === "notify-me" ||
    mode === "notify_me" ||
    mode === "notify only" ||
    mode === "notify-only" ||
    mode === "notify_only" ||
    mode === "back in stock" ||
    mode === "back-in-stock" ||
    mode === "back_in_stock";

  return {
    id: cleanString(product.id || "", 160) || undefined,
    slug: cleanString(product.slug || product.handle || "", 240) || undefined,
    title: cleanString(product.title || product.name || "", 240) || undefined,
    price: Number(product.price ?? 0),
    image:
      cleanString(
        product.image ||
          product.images?.[0]?.image ||
          product.images?.[0]?.src ||
          "",
        1000
      ) || undefined,
    badge: cleanString(product.badge || product.preorderBadge || "", 120) || undefined,
    status: cleanString(product.status || product.availabilityLabel || "", 120) || undefined,
    preorder: preorder || undefined,
    notifyOnly: notifyOnly || undefined,
    lineMode: notifyOnly ? "notify" : preorder ? "preorder" : undefined,
    ctaMode: notifyOnly ? "notify" : preorder ? "preorder" : undefined,
  };
}

/* ==================== Preorder / notify helpers ==================== */
export function detectNotifyItem(item) {
  if (!item || typeof item !== "object") return false;

  const mode = getDirectLineMode(item);

  if (
    mode === "notify" ||
    mode === "notify me" ||
    mode === "notify-me" ||
    mode === "notify_me" ||
    mode === "notify only" ||
    mode === "notify-only" ||
    mode === "notify_only" ||
    mode === "back in stock" ||
    mode === "back-in-stock" ||
    mode === "back_in_stock"
  ) {
    return true;
  }

  if (
    mode === "buy" ||
    mode === "standard" ||
    mode === "ready for fulfillment" ||
    mode === "ready_for_fulfillment" ||
    mode === "preorder" ||
    mode === "pre order" ||
    mode === "pre-order" ||
    mode === "pre_order"
  ) {
    return false;
  }

  const candidates = [
    item?.notifyOnly,
    item?.notifyMe,
    item?.notify_me,
    item?.backInStockOnly,
    item?.watchOnly,
    item?.meta?.notifyOnly,
    item?.meta?.notifyMe,
    item?.meta?.notify_me,
    item?.meta?.backInStockOnly,
    item?.meta?.watchOnly,
    item?.product?.notifyOnly,
    item?.product?.notifyMe,
    item?.product?.notify_me,
    item?.product?.backInStockOnly,
    item?.product?.watchOnly,
    getNested(item, "product.meta.notifyOnly"),
    getNested(item, "product.meta.notifyMe"),
    getNested(item, "product.meta.backInStockOnly"),
    getNested(item, "product.flags.notifyOnly"),
    getNested(item, "product.flags.notifyMe"),
    getNested(item, "product.flags.backInStockOnly"),
  ];

  if (candidates.some(truthyFlag)) return true;

  return extractSearchTexts(item).some(hasNotifyKeyword);
}

export function detectPreorderItem(item) {
  if (!item || typeof item !== "object") return false;

  const mode = getDirectLineMode(item);

  if (
    mode === "preorder" ||
    mode === "pre order" ||
    mode === "pre-order" ||
    mode === "pre_order" ||
    mode === "waiting preorder" ||
    mode === "waiting-preorder" ||
    mode === "waiting_preorder"
  ) {
    return true;
  }

  if (
    mode === "buy" ||
    mode === "standard" ||
    mode === "ready for fulfillment" ||
    mode === "ready_for_fulfillment" ||
    mode === "notify" ||
    mode === "notify me" ||
    mode === "notify-me" ||
    mode === "notify_me"
  ) {
    return false;
  }

  const candidates = [
    item?.preorder,
    item?.preOrder,
    item?.isPreorder,
    item?.isPreOrder,
    item?.preorderOnly,
    item?.preOrderOnly,
    item?.comingSoon,
    item?.launchOnly,
    item?.reservationRequired,
    item?.product?.preorder,
    item?.product?.preOrder,
    item?.product?.isPreorder,
    item?.product?.isPreOrder,
    item?.product?.preorderOnly,
    item?.product?.preOrderOnly,
    item?.product?.comingSoon,
    item?.product?.launchOnly,
    item?.meta?.preorder,
    item?.meta?.preOrder,
    item?.meta?.isPreorder,
    item?.meta?.isPreOrder,
    item?.meta?.comingSoon,
    item?.meta?.launchOnly,
    getNested(item, "product.meta.preorder"),
    getNested(item, "product.meta.preOrder"),
    getNested(item, "product.meta.isPreorder"),
    getNested(item, "product.meta.preorderOnly"),
    getNested(item, "product.meta.comingSoon"),
    getNested(item, "product.meta.launchOnly"),
    getNested(item, "product.badges.preorder"),
    getNested(item, "product.flags.preorder"),
    getNested(item, "product.flags.preOrder"),
    getNested(item, "product.flags.comingSoon"),
    getNested(item, "product.flags.launchOnly"),
    getNested(item, "product.tags.preorder"),
    getNested(item, "product.tags.comingSoon"),
  ];

  if (candidates.some(truthyFlag)) return true;

  return extractSearchTexts(item).some(hasPreorderKeyword);
}

function detectLineMode(item) {
  if (detectNotifyItem(item)) return "notify";
  if (detectPreorderItem(item)) return "preorder";
  return "buy";
}

export function extractPreorderLabel(item) {
  const textCandidates = [
    item?.preorderLabel,
    item?.preOrderLabel,
    item?.meta?.preorderLabel,
    item?.meta?.preOrderLabel,
    item?.product?.preorderLabel,
    item?.product?.preOrderLabel,
    item?.product?.preorderBadge,
    item?.badge,
    item?.status,
    item?.availabilityLabel,
    item?.product?.badge,
    item?.product?.status,
    item?.product?.availabilityLabel,
    item?.meta?.badge,
    item?.meta?.status,
    item?.meta?.availabilityLabel,
  ].filter(Boolean);

  const found = textCandidates.find((v) =>
    normalizeSearchText(v).match(
      /pre ?order|forbestall|förbeställ|forhandsbok|förhandsbok|reservation|coming soon|on siparis|ön sipariş/
    )
  );

  return cleanString(found || "", 120);
}

export function extractPreorderNote(item) {
  const textCandidates = [
    item?.preorderNote,
    item?.preOrderNote,
    item?.preorderText,
    item?.availabilityText,
    item?.meta?.preorderNote,
    item?.meta?.preOrderNote,
    item?.meta?.preorderText,
    item?.meta?.availabilityText,
    item?.product?.preorderNote,
    item?.product?.preOrderNote,
    item?.product?.preorderText,
    item?.product?.availabilityText,
    item?.product?.subtitle,
    item?.product?.description,
    item?.description,
    item?.meta?.description,
  ].filter(Boolean);

  const found = textCandidates.find((v) =>
    normalizeSearchText(v).match(
      /pre ?order|forbestall|förbeställ|forhandsbok|förhandsbok|reservation|coming soon|first wave|launch|on siparis|ön sipariş/
    )
  );

  return cleanString(found || "", 240);
}

export function extractNotifyLabel(item) {
  const textCandidates = [
    item?.notifyLabel,
    item?.backInStockLabel,
    item?.availabilityLabel,
    item?.meta?.notifyLabel,
    item?.meta?.backInStockLabel,
    item?.meta?.availabilityLabel,
    item?.product?.notifyLabel,
    item?.product?.backInStockLabel,
    item?.product?.availabilityLabel,
    item?.badge,
    item?.status,
    item?.product?.badge,
    item?.product?.status,
  ].filter(Boolean);

  const found = textCandidates.find((v) =>
    normalizeSearchText(v).match(
      /notify|back in stock|restock|watch only|bevaka|meddela mig/
    )
  );

  return cleanString(found || "", 120);
}

export function extractNotifyNote(item) {
  const textCandidates = [
    item?.notifyNote,
    item?.backInStockNote,
    item?.availabilityText,
    item?.meta?.notifyNote,
    item?.meta?.backInStockNote,
    item?.meta?.availabilityText,
    item?.product?.notifyNote,
    item?.product?.backInStockNote,
    item?.product?.availabilityText,
    item?.product?.subtitle,
    item?.product?.description,
    item?.description,
  ].filter(Boolean);

  const found = textCandidates.find((v) =>
    normalizeSearchText(v).match(
      /notify|back in stock|restock|watch only|bevaka|meddela mig/
    )
  );

  return cleanString(found || "", 240);
}

export function normalizeOrderItemsSnapshot(items) {
  const list = Array.isArray(items) ? items : [];

  return list.map((it, idx) => {
    const p = it?.product || {};
    const meta = it?.meta && typeof it.meta === "object" ? it.meta : undefined;
    const lineMode = detectLineMode(it);
    const isPreorder = lineMode === "preorder";
    const isNotifyOnly = lineMode === "notify";
    const preorderLabel = extractPreorderLabel(it);
    const preorderNote = extractPreorderNote(it);
    const notifyLabel = extractNotifyLabel(it);
    const notifyNote = extractNotifyNote(it);
    const specialCategory = detectSpecialCategory(it);
    const leadDays = getPreorderLeadDays(it);

    const categories = [
      ...arrayFromMaybe(it?.categories),
      ...arrayFromMaybe(p?.categories),
      ...arrayFromMaybe(meta?.categories),
      ...arrayFromMaybe(getNested(it, "product.meta.categories")),
    ].filter(Boolean);

    if (specialCategory && !categories.map(normalizeCategory).includes(specialCategory)) {
      categories.push(specialCategory);
    }

    return {
      lineKey: normalizeLineKey(it, idx),
      variantKey: cleanString(it?.variantKey || "", 240),
      id: cleanString(it?.id || p?.id || "", 160),
      slug: cleanString(it?.slug || it?.handle || p?.slug || p?.handle || "", 240),
      title: cleanString(it?.title || p?.title || "Produkt", 240),
      name: cleanString(it?.name || it?.title || p?.title || "Produkt", 240),
      qty: Math.max(1, Number(it?.qty || it?.quantity || 1)),
      price: Number(it?.price ?? p?.price ?? 0),
      priceSEK: Number(it?.priceSEK ?? it?.price ?? p?.price ?? 0),
      image:
        cleanString(
          it?.image ||
            it?.images?.[0]?.image ||
            it?.images?.[0]?.src ||
            p?.image ||
            p?.images?.[0]?.image ||
            p?.images?.[0]?.src ||
            "",
          1000
        ) || "",
      variantTitle: cleanString(it?.variantTitle || it?.variant || "", 240),
      variant: cleanString(it?.variant || it?.variantTitle || "", 240),

      lineMode,
      ctaMode: lineMode,
      orderType: isPreorder ? "preorder" : isNotifyOnly ? "notify" : cleanString(it?.orderType || "standard", 80),
      fulfillmentType: isPreorder
        ? "waiting_preorder"
        : isNotifyOnly
          ? "notify"
          : cleanString(it?.fulfillmentType || "ready_for_fulfillment", 80),
      availabilityType: isPreorder
        ? "preorder"
        : isNotifyOnly
          ? "notify"
          : cleanString(it?.availabilityType || "", 80),
      fulfillmentStatus: isPreorder
        ? "pending"
        : isNotifyOnly
          ? "waiting_interest"
          : cleanString(it?.fulfillmentStatus || "accepted", 80),
      printfulEligible: isPreorder || isNotifyOnly ? false : it?.printfulEligible !== false,

      isPreorder,
      preorder: isPreorder,
      preOrder: isPreorder,
      preorderOnly: isPreorder || undefined,
      preorderActive: isPreorder || undefined,
      preorderLabel: preorderLabel || (isPreorder ? "PRE-ORDER" : ""),
      preOrderLabel: preorderLabel || (isPreorder ? "PRE-ORDER" : ""),
      preorderNote,
      preOrderNote: preorderNote,
      preorderText: preorderNote,
      preorderLeadDays: isPreorder ? leadDays : 0,

      notifyOnly: isNotifyOnly,
      notifyMe: isNotifyOnly,
      notifyLabel: notifyLabel || (isNotifyOnly ? "NOTIFY" : ""),
      notifyNote,

      category: specialCategory || cleanString(it?.category || p?.category || meta?.category || "", 120),
      categories: categories.length ? categories : undefined,

      meta: {
        ...(meta || {}),
        size: cleanString(meta?.size || "", 120) || undefined,
        color: cleanString(meta?.color || "", 120) || undefined,
        material: cleanString(meta?.material || "", 120) || undefined,
        lineMode,
        ctaMode: lineMode,
        orderType: isPreorder ? "preorder" : isNotifyOnly ? "notify" : "standard",
        fulfillmentType: isPreorder
          ? "waiting_preorder"
          : isNotifyOnly
            ? "notify"
            : cleanString(it?.fulfillmentType || "ready_for_fulfillment", 80),
        availabilityType: isPreorder ? "preorder" : isNotifyOnly ? "notify" : undefined,
        preorder: isPreorder || undefined,
        isPreorder: isPreorder || undefined,
        preOrder: isPreorder || undefined,
        preorderLabel: preorderLabel || undefined,
        preorderNote: preorderNote || undefined,
        preorderLeadDays: isPreorder && leadDays ? leadDays : undefined,
        notifyOnly: isNotifyOnly || undefined,
        notifyMe: isNotifyOnly || undefined,
        notifyLabel: notifyLabel || undefined,
        notifyNote: notifyNote || undefined,
        category: specialCategory || meta?.category || undefined,
      },
      product: slimProductSnapshot(it?.product),
      images: slimImageList(it?.images),
    };
  });
}

export function buildPreorderMeta(items) {
  const list = Array.isArray(items) ? items : [];
  const preorderItems = list.filter(detectPreorderItem);
  const notifyItems = list.filter(detectNotifyItem);
  const buyItems = list.filter((it) => !detectPreorderItem(it) && !detectNotifyItem(it));

  const hasPreorder = preorderItems.length > 0;
  const hasNotifyOnly = notifyItems.length > 0;
  const mixedCart = hasPreorder && buyItems.length > 0;
  const notifyOnly = hasNotifyOnly && !hasPreorder && buyItems.length === 0;

  let flowType = "standard";
  if (notifyOnly) flowType = "notify_only";
  else if (mixedCart) flowType = "mixed";
  else if (hasPreorder) flowType = "preorder";

  const leadDays = preorderItems
    .map(getPreorderLeadDays)
    .filter((n) => Number.isFinite(n) && n > 0);

  return {
    hasPreorder,
    hasNotifyOnly,
    preorderCount: preorderItems.length,
    preorderQty: preorderItems.reduce(
      (sum, it) => sum + Math.max(1, Number(it?.qty || it?.quantity || 1)),
      0
    ),
    notifyOnlyCount: notifyItems.length,
    notifyOnlyQty: notifyItems.reduce(
      (sum, it) => sum + Math.max(1, Number(it?.qty || it?.quantity || 1)),
      0
    ),
    itemIds: preorderItems
      .map((it) => cleanString(it?.id || it?.product?.id || "", 160))
      .filter(Boolean),
    slugs: preorderItems
      .map((it) =>
        cleanString(it?.slug || it?.handle || it?.product?.slug || it?.product?.handle || "", 240)
      )
      .filter(Boolean),
    titles: preorderItems
      .map((it) => cleanString(it?.title || it?.product?.title || "", 240))
      .filter(Boolean),
    flowType,
    mixedCart,
    preorderMixedWithRegular: mixedCart,
    preorderLeadDaysMin: leadDays.length ? Math.min(...leadDays) : 0,
    preorderLeadDaysMax: leadDays.length ? Math.max(...leadDays) : 0,
  };
}

/* ==================== Local persistence ==================== */
export function readLocalJson(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return safeJsonParse(raw, fallback);
  } catch {
    return fallback;
  }
}

export function writeLocalJson(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function writeSessionOrder(order) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(ORDER_CURRENT_KEY, JSON.stringify(order));
  } catch {}
}

export function upsertLocalOrder(order) {
  if (typeof window === "undefined" || !order) return;

  const orderId = cleanString(order?.id || order?.orderId || order?.order_id || "", 160);
  if (!orderId) return;

  const existing = readLocalJson(ORDER_LIST_KEY, []);
  const list = Array.isArray(existing) ? existing : [];
  const idx = list.findIndex((o) => {
    const oid = cleanString(o?.id || o?.orderId || o?.order_id || "", 160);
    return oid === orderId;
  });

  if (idx === -1) {
    list.unshift(order);
  } else {
    list[idx] = {
      ...list[idx],
      ...order,
      items: Array.isArray(order.items) ? order.items : list[idx]?.items || [],
    };
  }

  writeLocalJson(ORDER_LIST_KEY, list);
  writeLocalJson(ORDER_LAST_KEY, order);
  writeSessionOrder(order);
}

export function hasRecentBeginCheckoutEvent({ maxAgeMs = 20_000 } = {}) {
  if (typeof window === "undefined") return false;

  try {
    const now = Date.now();

    const fallbackMeta = readSessionJson(CHECKOUT_BEGIN_FALLBACK_KEY);
    if (fallbackMeta && fallbackMeta.ts && now - Number(fallbackMeta.ts) <= maxAgeMs) {
      return true;
    }

    const raw = window.localStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (!raw) return false;

    const queue = safeJsonParse(raw, []);
    if (!Array.isArray(queue) || !queue.length) return false;

    for (let i = queue.length - 1; i >= 0; i -= 1) {
      const item = queue[i];
      const ts = Number(item?.ts || 0);
      if (!ts) continue;
      if (now - ts > maxAgeMs) break;

      if (
        String(item?.type || "") === "begin_checkout" &&
        String(item?.name || "") === "checkout"
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function markBeginCheckoutFallback() {
  writeSessionJson(CHECKOUT_BEGIN_FALLBACK_KEY, {
    ts: Date.now(),
    path: "/checkout",
  });
}

export function loadCheckoutPrefill() {
  const prefill = readLsJson([CHECKOUT_PREFILL_KEY]) || {};
  const savedCustomer = readLsJson([MEMBER_PROFILE_CUSTOMER_KEY]) || {};
  const identity =
    readLsJson(["cw.identity", "cw.user", "cw.member", "cw.session.identity"]) || {};
  const member =
    readLsJson(["cw.member", "cw.membership", "cw.member.snapshot", "cw.portal.member"]) || {};

  return {
    name: cleanString(
      prefill.name ||
        savedCustomer.name ||
        prefill.fullName ||
        identity.name ||
        identity.fullName ||
        member.name ||
        member.fullName ||
        readLsValue(["cw.member.displayName"]),
      160
    ),
    email: cleanString(
      prefill.email || savedCustomer.email || identity.email || member.email,
      160
    ),
    phone: cleanString(
      prefill.phone || savedCustomer.phone || identity.phone || member.phone,
      80
    ),
    updatedAt: cleanString(prefill.updatedAt || savedCustomer.updatedAt || "", 64),
  };
}

export function saveCheckoutPrefillCustomer(customer) {
  const payload = {
    name: cleanString(customer?.name || "", 160),
    email: cleanString(customer?.email || "", 160),
    phone: cleanString(customer?.phone || "", 80),
    updatedAt: new Date().toISOString(),
  };

  writeLsJson(CHECKOUT_PREFILL_KEY, payload);
  writeLsJson(MEMBER_PROFILE_CUSTOMER_KEY, payload);
}

export function saveMemberShippingSnapshot(shipping, anyPhysical) {
  if (!anyPhysical) {
    removeLsKey(MEMBER_PROFILE_SHIPPING_KEY);
    return;
  }

  const payload = {
    company: cleanString(shipping?.company || "", 160),
    careOf: cleanString(shipping?.careOf || "", 160),
    address1: cleanString(shipping?.address1 || "", 240),
    address2: cleanString(shipping?.address2 || "", 240),
    doorCode: cleanString(shipping?.doorCode || "", 80),
    zip: cleanString(shipping?.zip || "", 40),
    city: cleanString(shipping?.city || "", 120),
    country: cleanString(shipping?.country || "SE", 8) || "SE",
    region: cleanString(shipping?.region || "", 120),
    deliveryNotes: cleanString(shipping?.deliveryNotes || "", 240),
    updatedAt: new Date().toISOString(),
  };

  const hasUsefulValue = !!(
    payload.address1 ||
    payload.zip ||
    payload.city ||
    payload.company ||
    payload.careOf ||
    payload.region
  );

  if (hasUsefulValue) writeLsJson(MEMBER_PROFILE_SHIPPING_KEY, payload);
}

export function saveMemberBillingSnapshot(billing, useSeparateBilling) {
  if (!useSeparateBilling) {
    removeLsKey(MEMBER_PROFILE_BILLING_KEY);
    return;
  }

  const payload = {
    company: cleanString(billing?.company || "", 160),
    careOf: cleanString(billing?.careOf || "", 160),
    address1: cleanString(billing?.address1 || "", 240),
    address2: cleanString(billing?.address2 || "", 240),
    zip: cleanString(billing?.zip || "", 40),
    city: cleanString(billing?.city || "", 120),
    country: cleanString(billing?.country || "SE", 8) || "SE",
    region: cleanString(billing?.region || "", 120),
    orgNumber: cleanString(billing?.orgNumber || "", 80),
    vatId: cleanString(billing?.vatId || "", 80),
    updatedAt: new Date().toISOString(),
  };

  const hasUsefulValue = !!(
    payload.address1 ||
    payload.zip ||
    payload.city ||
    payload.company ||
    payload.orgNumber ||
    payload.vatId
  );

  if (hasUsefulValue) writeLsJson(MEMBER_PROFILE_BILLING_KEY, payload);
}

export function saveCheckoutDraftSnapshot(snapshot) {
  writeLsJson(CHECKOUT_DRAFT_SNAPSHOT_KEY, {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  });
}

export function clearCheckoutDraftSnapshot() {
  removeLsKey(CHECKOUT_DRAFT_SNAPSHOT_KEY);
}

/* ==================== Campaign / discount ==================== */
export function normalizeCampaignData(raw) {
  const input = raw && typeof raw === "object" ? raw : {};

  const discounts = Array.isArray(input.discounts) ? input.discounts.filter(Boolean) : [];
  const vip = Array.isArray(input.vipTiers)
    ? input.vipTiers.filter(Boolean)
    : Array.isArray(input.vip)
      ? input.vip.filter(Boolean)
      : [];

  return {
    key: cleanString(input.key || input.id || input.campaignKey || "standard", 120),
    title: cleanString(input.title || input.label || "Standard", 240),
    theme: cleanString(input.theme || input.themeKey || "neutral", 120),
    mode: cleanString(input.mode || input.source || "auto", 80),
    override: !!input.override,
    startsAt: cleanString(input.startsAt || input.start || "", 64),
    endsAt: cleanString(input.endsAt || input.end || "", 64),
    discountCode: cleanString(input.discountCode || input.code || input.promoCode || "", 120),
    discountPercent: Number(input.discountPercent ?? input.percent ?? 0) || 0,
    discountAmountSek: Number(input.discountAmountSek ?? input.amountSek ?? 0) || 0,
    freeShipping: !!input.freeShipping,
    vipEnabled:
      input.vipEnabled != null ? !!input.vipEnabled : vip.some((x) => x?.enabled !== false),
    discounts,
    vip,
  };
}

export function buildPendingDiscountMeta(campaign) {
  const normalized = normalizeCampaignData(campaign);
  const activeDiscounts = normalized.discounts.filter((d) => d?.enabled !== false);
  const activeVip = normalized.vip.filter((v) => v?.enabled !== false);

  return {
    campaignKey: normalized.key,
    campaignTitle: normalized.title,
    campaignTheme: normalized.theme,
    campaignMode: normalized.mode,
    campaignOverride: normalized.override,
    startsAt: normalized.startsAt,
    endsAt: normalized.endsAt,
    freeShipping: normalized.freeShipping,
    discountCode: normalized.discountCode,
    discountPercent: normalized.discountPercent,
    discountAmountSek: normalized.discountAmountSek,
    activeDiscountCount: activeDiscounts.length,
    activeVipCount: activeVip.length,
    hasPendingDiscount:
      !!normalized.discountCode ||
      normalized.discountPercent > 0 ||
      normalized.discountAmountSek > 0 ||
      activeDiscounts.length > 0,
    vipEnabled: normalized.vipEnabled || activeVip.length > 0,
  };
}

export function normalizeDiscountCodeInput(value) {
  return cleanString(value || "", 80)
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toUpperCase()
    .slice(0, 80);
}

function readDiscountNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }

  return 0;
}

function normalizeDiscountType(value) {
  const s = cleanString(value || "", 40).toLowerCase();

  if (["fixed", "amount", "sek", "cash", "fast"].includes(s)) return "fixed";
  if (["shipping", "free_shipping", "free-shipping", "frakt"].includes(s)) return "shipping";
  if (["product", "drop", "campaign"].includes(s)) return s;

  return "percent";
}

export function normalizeValidatedDiscountResponse(data, requestMeta = {}) {
  const input = data && typeof data === "object" ? data : {};
  const discount = input.discount && typeof input.discount === "object" ? input.discount : {};
  const rule = input.rule && typeof input.rule === "object" ? input.rule : {};

  const valid = Boolean(
    input.valid === true ||
      input.ok === true ||
      discount.valid === true ||
      rule.valid === true
  );

  const code = normalizeDiscountCodeInput(
    input.code ||
      input.discountCode ||
      input.discount_code ||
      discount.code ||
      discount.discountCode ||
      rule.code ||
      requestMeta.code
  );

  const type = normalizeDiscountType(
    input.type ||
      input.discountType ||
      input.discount_type ||
      discount.type ||
      discount.discountType ||
      rule.type
  );

  const percent = readDiscountNumber(
    input.percent,
    input.discountPercent,
    input.discount_percent,
    discount.percent,
    discount.discountPercent,
    rule.percent,
    rule.valuePercent,
    type === "percent" ? input.value : undefined,
    type === "percent" ? discount.value : undefined,
    type === "percent" ? rule.value : undefined
  );

  const fixedSek = readDiscountNumber(
    input.amountSek,
    input.amount_sek,
    input.discountAmountSek,
    input.discount_amount_sek,
    discount.amountSek,
    discount.amount_sek,
    discount.discountAmountSek,
    rule.amountSek,
    rule.amount_sek,
    type === "fixed" ? input.value : undefined,
    type === "fixed" ? discount.value : undefined,
    type === "fixed" ? rule.value : undefined
  );

  const subtotalSek = Math.max(0, Number(requestMeta.subtotalSek || 0));
  const shippingSek = Math.max(0, Number(requestMeta.shippingSek || 0));

  const freeShipping = Boolean(
    input.freeShipping ||
      input.free_shipping ||
      discount.freeShipping ||
      discount.free_shipping ||
      rule.freeShipping ||
      rule.free_shipping ||
      type === "shipping"
  );

  const computedPercentSek =
    type === "percent" && percent > 0 ? Math.round(subtotalSek * (percent / 100)) : 0;

  const computedShippingSek = freeShipping ? shippingSek : 0;

  const explicitDiscountSek = readDiscountNumber(
    input.discountSek,
    input.discount_sek,
    input.discountAmountSek,
    input.discount_amount_sek,
    input.appliedDiscountSek,
    input.applied_discount_sek,
    discount.discountSek,
    discount.discount_sek,
    discount.amountSek,
    rule.discountSek,
    rule.discount_sek
  );

  const discountAmountSek = Math.max(
    0,
    Math.min(
      subtotalSek + shippingSek,
      explicitDiscountSek || fixedSek || computedPercentSek || computedShippingSek || 0
    )
  );

  return {
    ok: !!input.ok,
    valid,
    code,
    type,
    percent: Math.max(0, percent),
    fixedSek: Math.max(0, fixedSek),
    freeShipping,
    discountAmountSek,
    subtotalSek,
    shippingSek,
    source: "manual_code",
    message: cleanString(
      input.message ||
        input.detail ||
        discount.message ||
        rule.message ||
        (valid ? "Rabattkod godkänd." : "Rabattkoden kunde inte användas."),
      300
    ),
    raw: input,
  };
}

export async function validateDiscountCode({
  code,
  subtotalSek = 0,
  shippingSek = 0,
  currency = "SEK",
  customerEmail = "",
  items = [],
  campaignKey = "",
  signal,
} = {}) {
  const normalizedCode = normalizeDiscountCodeInput(code);

  if (!normalizedCode) {
    return {
      ok: false,
      valid: false,
      code: "",
      discountAmountSek: 0,
      message: "Ange en rabattkod.",
      source: "manual_code",
    };
  }

  try {
    const res = await fetch(DISCOUNT_VALIDATE_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        code: normalizedCode,
        subtotalSek: Math.max(0, Number(subtotalSek || 0)),
        shippingSek: Math.max(0, Number(shippingSek || 0)),
        currency: cleanString(currency || "SEK", 12).toUpperCase(),
        customerEmail: cleanString(customerEmail || "", 320).toLowerCase(),
        campaignKey: cleanString(campaignKey || "", 120),
        items: Array.isArray(items)
          ? items.map((item) => ({
              id: cleanString(item?.id || item?.product?.id || "", 160),
              slug: cleanString(item?.slug || item?.product?.slug || "", 240),
              title: cleanString(item?.title || item?.name || item?.product?.title || "", 240),
              qty: Math.max(1, Number(item?.qty || item?.quantity || 1)),
              priceSEK: Math.max(0, Number(item?.priceSEK || item?.price || 0)),
              lineMode: cleanString(item?.lineMode || "", 80),
            }))
          : [],
      }),
      signal,
    });

    const text = await res.text().catch(() => "");
    const data = safeJsonParse(text, null);

    if (!res.ok) {
      return {
        ok: false,
        valid: false,
        code: normalizedCode,
        discountAmountSek: 0,
        source: "manual_code",
        message:
          data?.detail ||
          data?.error ||
          data?.message ||
          text ||
          `Rabattkontroll misslyckades (${res.status}).`,
        raw: data || text,
      };
    }

    return normalizeValidatedDiscountResponse(data || {}, {
      code: normalizedCode,
      subtotalSek,
      shippingSek,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      return {
        ok: false,
        valid: false,
        code: normalizedCode,
        discountAmountSek: 0,
        source: "manual_code",
        aborted: true,
        message: "Rabattkontrollen avbröts.",
      };
    }

    return {
      ok: false,
      valid: false,
      code: normalizedCode,
      discountAmountSek: 0,
      source: "manual_code",
      message: String(error?.message || error || "Kunde inte kontrollera rabattkod."),
    };
  }
}

export function buildManualDiscountMeta(validation, base = {}) {
  const v = validation && typeof validation === "object" ? validation : {};
  const valid = !!v.valid;

  return {
    manualCode: normalizeDiscountCodeInput(v.code || ""),
    manualCodeValid: valid,
    manualDiscountType: cleanString(v.type || "", 40),
    manualDiscountPercent: Math.max(0, Number(v.percent || 0)),
    manualDiscountFixedSek: Math.max(0, Number(v.fixedSek || 0)),
    manualDiscountAmountSek: valid ? Math.max(0, Number(v.discountAmountSek || 0)) : 0,
    manualFreeShipping: !!v.freeShipping,
    manualDiscountMessage: cleanString(v.message || "", 300),
    manualDiscountSource: cleanString(v.source || "manual_code", 80),
    manualDiscountAppliedAt: valid ? new Date().toISOString() : "",
    baseSubtotalSek: Math.max(0, Number(base.subtotalSek || v.subtotalSek || 0)),
    baseShippingSek: Math.max(0, Number(base.shippingSek || v.shippingSek || 0)),
  };
}

export function mergeDiscountMeta(campaignDiscountMeta, manualDiscountMeta) {
  const campaignMeta =
    campaignDiscountMeta && typeof campaignDiscountMeta === "object"
      ? campaignDiscountMeta
      : {};

  const manualMeta =
    manualDiscountMeta && typeof manualDiscountMeta === "object"
      ? manualDiscountMeta
      : {};

  const manualAmountSek = Math.max(0, Number(manualMeta.manualDiscountAmountSek || 0));

  return {
    ...campaignMeta,
    ...manualMeta,
    hasManualDiscount: !!manualMeta.manualCode,
    manualDiscountApplied: !!manualMeta.manualCodeValid && manualAmountSek > 0,
    discountCode: manualMeta.manualCodeValid
      ? manualMeta.manualCode
      : campaignMeta.discountCode || "",
    discountAmountSek: manualMeta.manualCodeValid
      ? manualAmountSek
      : Number(campaignMeta.discountAmountSek || 0),
    hasPendingDiscount:
      !!campaignMeta.hasPendingDiscount ||
      (!!manualMeta.manualCodeValid && manualAmountSek > 0),
    freeShipping: !!campaignMeta.freeShipping || !!manualMeta.manualFreeShipping,
  };
}

/* ==================== Pending server order ==================== */
export function writePendingServerOrder(order, diagnostics = {}) {
  writeLsJson(PENDING_ORDER_LS_KEY, {
    savedAt: new Date().toISOString(),
    order,
    diagnostics,
  });
}

export function clearPendingServerOrder() {
  removeLsKey(PENDING_ORDER_LS_KEY);
}

/* ==================== Core attribution ==================== */
export function inferAttributionOwner({
  affiliateId,
  creatorId,
  associateId,
  associateCode,
  ambassadorCode,
  partnerCode,
  referralCode,
  rewardCode,
  sourceChannel,
  trafficSource,
  utmSource,
}) {
  const source = String(sourceChannel || trafficSource || utmSource || "")
    .trim()
    .toLowerCase();

  if (creatorId || source.includes("creator") || source.includes("influencer")) return "creator";
  if (affiliateId || source.includes("affiliate")) return "affiliate";

  if (
    associateId ||
    associateCode ||
    ambassadorCode ||
    partnerCode ||
    referralCode ||
    rewardCode ||
    source.includes("associate") ||
    source.includes("ambassador") ||
    source.includes("partner") ||
    source.includes("referral") ||
    source.includes("reward")
  ) {
    return "associate";
  }

  return "calestra";
}

export function inferThirdPartyType({
  affiliateId,
  creatorId,
  associateId,
  associateCode,
  ambassadorCode,
  partnerCode,
  referralCode,
  rewardCode,
  sourceChannel,
  trafficSource,
}) {
  const source = String(sourceChannel || trafficSource || "")
    .trim()
    .toLowerCase();

  if (affiliateId && creatorId) return "creator_affiliate";
  if (creatorId || source.includes("creator") || source.includes("influencer")) return "creator";
  if (affiliateId || source.includes("affiliate")) return "affiliate";
  if (ambassadorCode || source.includes("ambassador")) return "ambassador";
  if (partnerCode || source.includes("partner")) return "partner";
  if (referralCode || source.includes("referral")) return "referral";
  if (rewardCode || source.includes("reward")) return "reward";
  if (associateId || associateCode || source.includes("associate")) return "associate";

  return "";
}

function readAttributionStorage() {
  const objects = [
    readLsJson(["cw.checkout.attribution"]),
    readLsJson(["cw.attribution", "cw.session.attribution", "cw.growth.attribution"]),
    readLsJson(["cw.referral"]),
    readLsJson(["cw.affiliate"]),
    readLsJson(["cw.creator"]),
    readLsJson(["cw.associate"]),
    readLsJson(["cw.campaign.attribution"]),
  ].filter((x) => x && typeof x === "object");

  const merged = {};
  for (const obj of objects) Object.assign(merged, obj);
  return merged;
}

export function buildCoreMeta(affiliateInput) {
  if (typeof window === "undefined") {
    const affiliateId = normalizeAffiliateInput(affiliateInput);

    return {
      userId: "",
      memberId: "",
      memberTier: "",
      campaignId: "",
      creatorId: "",
      creatorCode: "",
      affiliateId,
      affiliateCode: affiliateId,
      affiliateReferralCode: affiliateId,
      associateId: "",
      associateCode: "",
      ambassadorCode: "",
      partnerCode: "",
      referralCode: "",
      rewardCode: "",
      rewardReady: false,
      attributionOwner: inferAttributionOwner({
        affiliateId,
        creatorId: "",
        associateId: "",
        associateCode: "",
        ambassadorCode: "",
        partnerCode: "",
        referralCode: "",
        rewardCode: "",
        sourceChannel: "",
        trafficSource: "",
        utmSource: "",
      }),
      thirdPartyType: affiliateId ? "affiliate" : "",
      sourceChannel: affiliateId ? "affiliate" : "store",
      trafficSource: "",
      entryPoint: "checkout",
      sessionRef: "",
      attribution: {
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        utmContent: "",
        utmTerm: "",
        referrer: "",
        landingPath: "",
      },
    };
  }

  const url = new URL(window.location.href);
  const sp = url.searchParams;

  const identity =
    readLsJson(["cw.identity", "cw.user", "cw.member", "cw.session.identity"]) || {};
  const member =
    readLsJson(["cw.member", "cw.membership", "cw.member.snapshot", "cw.portal.member"]) || {};
  const attribution = readAttributionStorage();

  const affiliateId = normalizeCode(
    getParam(sp, ["affiliate_id", "affiliateId", "affiliate", "affid"]) ||
      attribution.affiliateId ||
      attribution.affiliate_id ||
      member.affiliateId ||
      identity.affiliateId ||
      readLsValue(["cw.affiliateId", "cw.affiliate.id", "cw.ref.affiliate"]) ||
      normalizeAffiliateInput(affiliateInput),
    160
  );

  const affiliateCode = normalizeCode(
    getParam(sp, ["affiliate_code", "affiliateCode", "affcode", "aff_code", "ref", "aff"]) ||
      attribution.affiliateCode ||
      attribution.affiliate_code ||
      attribution.affiliateReferralCode ||
      readLsValue(["cw.affiliateCode", "cw.affiliate.code", "cw.ref"]),
    160
  );

  const creatorId = normalizeCode(
    getParam(sp, ["creator_id", "creatorId", "creator", "crid"]) ||
      attribution.creatorId ||
      attribution.creator_id ||
      attribution.creator ||
      readLsValue(["cw.creatorId", "cw.creator_id", "cw.creator.id", "cw.creator"]),
    160
  );

  const creatorCode = normalizeCode(
    getParam(sp, ["creator_code", "creatorCode", "creator_ref"]) ||
      attribution.creatorCode ||
      attribution.creator_code ||
      readLsValue(["cw.creatorCode", "cw.creator.code"]),
    160
  );

  const associateId = normalizeCode(
    getParam(sp, ["associate_id", "associateId", "associate", "asid", "ambassador_id", "ambassadorId"]) ||
      attribution.associateId ||
      attribution.associate_id ||
      attribution.associate ||
      attribution.ambassadorId ||
      attribution.ambassador_id ||
      readLsValue(["cw.associateId", "cw.associate_id", "cw.associate.id", "cw.associate"]),
    160
  );

  const associateCode = normalizeCode(
    getParam(sp, [
      "associate_code",
      "associateCode",
      "assoc_code",
      "assoc",
      "ambassador_code",
      "ambassadorCode",
      "ambassador",
      "partner",
      "partnerCode",
      "partner_code",
      "ref_code",
      "code",
    ]) ||
      attribution.associateCode ||
      attribution.associate_code ||
      attribution.ambassadorCode ||
      attribution.ambassador_code ||
      attribution.partnerCode ||
      attribution.partner_code ||
      attribution.code ||
      readLsValue([
        "cw.associateCode",
        "cw.associate_code",
        "cw.associate.code",
        "cw.ambassadorCode",
        "cw.ambassador.code",
        "cw.partnerCode",
        "cw.partner.code",
        "cw.code",
        "cw.ref.code",
      ]),
    160
  );

  const ambassadorCode = normalizeCode(
    getParam(sp, ["ambassador_code", "ambassadorCode", "ambassador"]) ||
      attribution.ambassadorCode ||
      attribution.ambassador_code ||
      readLsValue(["cw.ambassadorCode", "cw.ambassador.code"]) ||
      associateCode,
    160
  );

  const partnerCode = normalizeCode(
    getParam(sp, ["partner_code", "partnerCode", "partner"]) ||
      attribution.partnerCode ||
      attribution.partner_code ||
      readLsValue(["cw.partnerCode", "cw.partner.code"]) ||
      associateCode ||
      creatorCode ||
      affiliateCode,
    160
  );

  const referralCode = normalizeCode(
    getParam(sp, ["referral_code", "referralCode", "referral", "ref_code"]) ||
      attribution.referralCode ||
      attribution.referral_code ||
      readLsValue(["cw.referralCode", "cw.referral.code"]) ||
      partnerCode,
    160
  );

  const rewardCode = normalizeCode(
    getParam(sp, ["reward_code", "rewardCode", "reward"]) ||
      attribution.rewardCode ||
      attribution.reward_code ||
      readLsValue(["cw.rewardCode", "cw.reward.code"]) ||
      partnerCode ||
      referralCode ||
      associateCode ||
      ambassadorCode ||
      creatorCode ||
      affiliateCode,
    160
  );

  const utmSource = cleanString(
    getParam(sp, ["utm_source"]) || attribution.utmSource || attribution.utm_source || "",
    120
  );
  const utmMedium = cleanString(
    getParam(sp, ["utm_medium"]) || attribution.utmMedium || attribution.utm_medium || "",
    120
  );
  const utmCampaign = cleanString(
    getParam(sp, ["utm_campaign"]) || attribution.utmCampaign || attribution.utm_campaign || "",
    160
  );
  const utmContent = cleanString(
    getParam(sp, ["utm_content"]) || attribution.utmContent || attribution.utm_content || "",
    160
  );
  const utmTerm = cleanString(
    getParam(sp, ["utm_term"]) || attribution.utmTerm || attribution.utm_term || "",
    160
  );

  const sourceChannel = cleanString(
    getParam(sp, ["source_channel", "sourceChannel", "source", "channel"]) ||
      attribution.sourceChannel ||
      attribution.source_channel ||
      attribution.source ||
      readLsValue(["cw.sourceChannel", "cw.source_channel", "cw.source", "cw.channel"]) ||
      utmSource ||
      (associateCode || ambassadorCode || partnerCode || referralCode || rewardCode
        ? "associate"
        : creatorCode
          ? "creator"
          : affiliateId || affiliateCode
            ? "affiliate"
            : "store"),
    120
  );

  const trafficSource = cleanString(
    getParam(sp, ["traffic_source", "trafficSource", "tsrc"]) ||
      attribution.trafficSource ||
      attribution.traffic_source ||
      attribution.utmSource ||
      readLsValue(["cw.trafficSource", "cw.traffic_source"]) ||
      utmSource ||
      sourceChannel,
    120
  );

  const entryPoint = cleanString(
    getParam(sp, ["entry_point", "entryPoint", "entry", "ep"]) ||
      attribution.entryPoint ||
      attribution.entry_point ||
      readLsValue(["cw.entryPoint", "cw.entry_point"]) ||
      window.location.pathname ||
      "checkout",
    160
  );

  const campaignId = normalizeCode(
    getParam(sp, ["campaign_id", "campaignId", "campaign", "cid"]) ||
      attribution.campaignId ||
      attribution.campaign_id ||
      attribution.campaign ||
      utmCampaign ||
      readLsValue(["cw.campaignId", "cw.campaign_id", "cw.campaign"]),
    160
  );

  const attributionOwner = inferAttributionOwner({
    affiliateId,
    creatorId,
    associateId,
    associateCode,
    ambassadorCode,
    partnerCode,
    referralCode,
    rewardCode,
    sourceChannel,
    trafficSource,
    utmSource,
  });

  const thirdPartyType = inferThirdPartyType({
    affiliateId,
    creatorId,
    associateId,
    associateCode,
    ambassadorCode,
    partnerCode,
    referralCode,
    rewardCode,
    sourceChannel,
    trafficSource,
  });

  const payload = {
    userId: cleanString(
      getParam(sp, ["user_id", "userId", "uid"]) ||
        identity.userId ||
        identity.user_id ||
        identity.id ||
        member.userId ||
        member.user_id ||
        readLsValue(["cw.userId", "cw.user_id", "cw.identity.userId"]),
      160
    ),
    memberId: cleanString(
      getParam(sp, ["member_id", "memberId", "mid"]) ||
        member.memberId ||
        member.member_id ||
        member.id ||
        identity.memberId ||
        identity.member_id ||
        readLsValue(["cw.memberId", "cw.member_id"]),
      160
    ),
    memberTier: cleanString(
      getParam(sp, ["member_tier", "memberTier", "tier"]) ||
        member.memberTier ||
        member.member_tier ||
        member.tier ||
        identity.memberTier ||
        identity.member_tier ||
        readLsValue(["cw.memberTier", "cw.member_tier", "cw.tier"]),
      80
    ),
    campaignId,
    creatorId,
    creatorCode,
    affiliateId,
    affiliateCode,
    affiliateReferralCode: affiliateCode,
    associateId,
    associateCode,
    ambassadorCode,
    partnerCode,
    referralCode,
    rewardCode,
    rewardReady: !!rewardCode,
    attributionOwner,
    thirdPartyType,
    sourceChannel,
    trafficSource,
    entryPoint,
    sessionRef: cleanString(
      attribution.sessionRef ||
        attribution.session_ref ||
        readLsValue(["cw.sessionRef", "cw.session_ref", "cw.sid"]) ||
        "",
      160
    ),
    attribution: {
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      referrer: cleanString(document.referrer || "", 500),
      landingPath: cleanString(
        attribution.landingPath ||
          attribution.landing_path ||
          readLsValue(["cw.landingPath", "cw.landing_path"]) ||
          `${window.location.pathname}${window.location.search}`,
        500
      ),
    },
  };

  writeLsJson("cw.checkout.attribution", {
    affiliateId,
    affiliateCode,
    creatorId,
    creatorCode,
    associateId,
    associateCode,
    ambassadorCode,
    partnerCode,
    referralCode,
    rewardCode,
    rewardReady: !!rewardCode,
    campaignId,
    sourceChannel,
    trafficSource,
    entryPoint,
    attributionOwner,
    thirdPartyType,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    updatedAt: new Date().toISOString(),
  });

  return payload;
}

export function buildDreamPointsMeta({ points, level, preview, currency, rates, locale }) {
  const earnOnThisOrder = Math.max(0, asInt(preview?.earnOnThisOrder, 0));
  const maxRedeemSek = Math.max(0, Number(preview?.maxRedeemSek || 0));
  const nextBalance = Math.max(
    0,
    asInt(preview?.nextBalance ?? Number(points || 0) + earnOnThisOrder, 0)
  );

  return {
    balance: Math.max(0, asInt(points, 0)),
    level: cleanString(level || "starlight", 80).toLowerCase(),
    earnPreview: earnOnThisOrder,
    maxRedeemSek,
    maxRedeemActive: Number(convertFromSEK(maxRedeemSek, currency, rates) || 0),
    nextBalance,
    currency: cleanString(currency || "SEK", 16),
    locale: cleanString(locale || "sv-SE", 32),
    mode: IS_PREVIEW ? "preview" : "live",
  };
}

export function hasUsefulCoreMeta(meta) {
  if (!meta || typeof meta !== "object") return false;

  return Boolean(
    meta.userId ||
      meta.memberId ||
      meta.memberTier ||
      meta.campaignId ||
      meta.creatorId ||
      meta.creatorCode ||
      meta.affiliateId ||
      meta.affiliateCode ||
      meta.associateId ||
      meta.associateCode ||
      meta.ambassadorCode ||
      meta.partnerCode ||
      meta.referralCode ||
      meta.rewardCode ||
      meta.rewardReady ||
      meta.attributionOwner ||
      meta.thirdPartyType ||
      meta.sourceChannel ||
      meta.trafficSource ||
      meta.entryPoint ||
      meta.sessionRef
  );
}

/* ==================== DreamPoints / server helpers ==================== */
export function summarizeResult(label, result) {
  if (!result) return `${label}: no_result`;
  if (result.ok) return `${label}: ok`;
  if (result.skipped) return `${label}: skipped_${result.error || "unknown"}`;
  return `${label}: ${result.error || result.status || "failed"}`;
}

export function buildServerWriteError(ingestResult, registerResult, _unused, t) {
  const parts = [
    summarizeResult("ingest", ingestResult),
    summarizeResult("register", registerResult),
  ].join(" • ");

  if (typeof t === "function") {
    return t(
      "checkout.error.serverWriteFailed",
      "Testorder skapades lokalt men nådde inte admin/servern. Kontrollera VITE_ORDERS_INGEST_URL, ORDER_REGISTER_URL eller orders-service. {{details}}",
      { details: parts }
    );
  }

  return (
    "Testorder skapades lokalt men nådde inte admin/servern. " +
    "Kontrollera VITE_ORDERS_INGEST_URL, ORDER_REGISTER_URL eller orders-service. " +
    parts
  );
}

export function applyDreamAwardToOrder(order, awardResult, amountSek) {
  if (!order || !awardResult?.ok) return order;

  const currentMeta =
    order?.dreamPointsMeta && typeof order.dreamPointsMeta === "object"
      ? order.dreamPointsMeta
      : {};

  const currentSnap =
    order?.dreamPoints && typeof order.dreamPoints === "object" ? order.dreamPoints : {};

  return {
    ...order,
    dreamPointsMeta: {
      ...currentMeta,
      earned: Number(awardResult.earned || 0),
      earnPreview: Number(awardResult.earned || 0),
      balance: Number(awardResult.profile?.points || 0),
      nextBalance: Number(awardResult.profile?.points || 0),
      level: String(awardResult.profile?.level || currentMeta.level || "starlight"),
      amountSek: Math.max(0, Number(amountSek || 0)),
      awardedAt: new Date().toISOString(),
      orderId: order?.id || order?.orderId || "",
    },
    dreamPoints: {
      ...currentSnap,
      earned: Number(awardResult.earned || 0),
      balance: Number(awardResult.profile?.points || 0),
      level: String(awardResult.profile?.level || currentSnap.level || "starlight"),
      awardedAt: new Date().toISOString(),
      orderId: order?.id || order?.orderId || "",
    },
    dreamPointsEarned: Number(awardResult.earned || 0),
    dreamPointsLevel: String(awardResult.profile?.level || "starlight"),
  };
}

function buildOrderServerPayload(order) {
  const core = order?.coreMeta || order?.core || {};

  return {
    id: order?.id || "",
    orderId: order?.id || order?.orderId || order?.order_id || "",
    createdAt: order?.createdAt || new Date().toISOString(),
    email: order?.customer?.email || "",
    customerName: order?.customer?.name || "",
    customer: order?.customer || {},
    shipping: order?.shipping || {},
    billing: order?.billing || {},
    currency: order?.currency || "SEK",
    totalsSEK: order?.totalsSEK || null,
    items: Array.isArray(order?.items) ? order.items : [],
    mode: order?.mode || "preview",
    anyPhysical: !!order?.anyPhysical,
    affiliate: order?.affiliate || null,

    affiliateId: core?.affiliateId || order?.affiliate || null,
    affiliateCode: core?.affiliateCode || core?.affiliateReferralCode || "",
    affiliateReferralCode: core?.affiliateReferralCode || core?.affiliateCode || "",

    creatorId: core?.creatorId || "",
    creatorCode: core?.creatorCode || "",

    associateId: core?.associateId || "",
    associateCode: core?.associateCode || "",
    ambassadorCode: core?.ambassadorCode || core?.associateCode || "",
    partnerCode: core?.partnerCode || "",
    referralCode: core?.referralCode || "",
    rewardCode: core?.rewardCode || "",
    rewardReady: !!core?.rewardReady || !!core?.rewardCode,

    attributionOwner: core?.attributionOwner || "calestra",
    thirdPartyType: core?.thirdPartyType || "",
    trafficSource: core?.trafficSource || "",
    draftId: order?.draftId || "",

    userId: core?.userId || "",
    memberId: core?.memberId || "",
    memberTier: core?.memberTier || "",
    campaignId: core?.campaignId || "",
    sourceChannel: core?.sourceChannel || "",
    entryPoint: core?.entryPoint || "",

    campaign: order?.campaign || null,
    discountMeta: order?.discountMeta || null,
    coreMeta: core || null,
    core: core || null,
    dreamPointsMeta: order?.dreamPointsMeta || null,
    dreamPoints: order?.dreamPoints || null,
    dreamPointsEarned: order?.dreamPointsEarned || 0,
    dreamPointsLevel: order?.dreamPointsLevel || order?.dreamPointsMeta?.level || "starlight",

    orderFlowType: order?.orderFlowType || "standard",
    preorderMeta: order?.preorderMeta || null,
    hasPreorder: !!order?.preorderMeta?.hasPreorder,
    fulfillmentSummary: order?.fulfillmentSummary || null,
    preorderSystem: order?.preorderSystem || null,
    uiMeta: order?.uiMeta || null,
  };
}

export async function postOrderRegister(order) {
  try {
    const res = await fetch(ORDER_REGISTER_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(buildOrderServerPayload(order)),
      keepalive: true,
    });

    const text = await res.text().catch(() => "");
    const data = safeJsonParse(text, null);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data?.error || data?.detail || text || `order_register_http_${res.status}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: data || { ok: true },
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: String(e?.message || e || "order_register_fetch_failed"),
    };
  }
}

export async function postOrderIngest(order) {
  const ingestUrl = String(ORDERS_INGEST_URL || "").trim();

  if (!ingestUrl) {
    return {
      ok: false,
      skipped: true,
      error: "missing_ingest_url",
    };
  }

  try {
    const res = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(buildOrderServerPayload(order)),
      keepalive: true,
    });

    const text = await res.text().catch(() => "");
    const data = safeJsonParse(text, null);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data?.error || data?.detail || text || `orders_ingest_http_${res.status}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: data || { ok: true },
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: String(e?.message || e || "orders_ingest_fetch_failed"),
    };
  }
}

export function generateDraftId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}

  return `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateDraftId() {
  if (typeof window === "undefined") return generateDraftId();

  try {
    const existing = window.localStorage.getItem(CHECKOUT_DRAFT_ID_KEY);
    if (existing) return existing;

    const next = generateDraftId();
    window.localStorage.setItem(CHECKOUT_DRAFT_ID_KEY, next);
    return next;
  } catch {
    return generateDraftId();
  }
}

export function clearDraftId() {
  removeLsKey(CHECKOUT_DRAFT_ID_KEY);
}

export async function saveCheckoutDraft(payload) {
  try {
    const res = await fetch(CHECKOUT_DRAFT_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    return !!res.ok;
  } catch {
    return false;
  }
}

export async function markCheckoutDraftRecovered(draftId, orderId) {
  if (!draftId || !orderId) return { ok: false, error: "missing_draft_or_order_id" };

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
        orderId,
      }),
      keepalive: true,
    });

    if (!res.ok) {
      return { ok: false, error: `draft_convert_http_${res.status}` };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: String(e?.message || e || "draft_convert_failed"),
    };
  }
}

export function formatDreamLevel(level, i18n, t) {
  const key = String(level || "starlight").toLowerCase();

  return TT(i18n, t, `checkout.dreamPoints.level.${key}`, {
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

export function createMoneyFormatter(currency, locale) {
  return (value) => formatMoney(value, currency, locale);
}