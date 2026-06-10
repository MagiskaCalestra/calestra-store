// D:\WebProjects\Calestra\apps\store-classic\src\api\products.js

// Launch mode: läs direkt från store-classic/src/data/products.json
// och strunta i C-Core / Infinity tills vidare.
//
// Viktigt:
// - ctaMode från products.json ska respekteras först.
// - buy + lager > 0 = buy
// - buy + lager 0 = notify
// - preorder + lager > 0 = preorder
// - preorder + lager 0 = notify
// - notify = notify
// Detta hindrar att texter som "Meddela mig" råkar smitta köpbara produkter.

import rawProducts from "../data/products.json";
import i18n from "../i18n/index.js";

const SUPPORTED_LANGS = ["sv", "en", "tr"];
const DEFAULT_LANG = "sv";

function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function normalizeLang(lang) {
  const short = String(lang || DEFAULT_LANG).slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(short) ? short : DEFAULT_LANG;
}

function getActiveLang(lang) {
  return normalizeLang(lang || i18n?.language || DEFAULT_LANG);
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

function normalizeCtaMode(value) {
  const s = normalizeSearchText(value);

  if (!s) return "";

  if (s === "buy" || s === "shop" || s === "purchase" || s === "köp") {
    return "buy";
  }

  if (
    s === "preorder" ||
    s === "pre order" ||
    s === "pre-order" ||
    s === "pre_order" ||
    s === "reserve" ||
    s === "reservation" ||
    s === "förköp" ||
    s === "forkop" ||
    s === "förbeställ" ||
    s === "forbestall"
  ) {
    return "preorder";
  }

  if (
    s === "notify" ||
    s === "notify me" ||
    s === "notify-me" ||
    s === "notify_me" ||
    s === "back in stock" ||
    s === "back-in-stock" ||
    s === "back_in_stock" ||
    s === "watch only" ||
    s === "watch-only" ||
    s === "watch_only" ||
    s === "meddela mig" ||
    s === "bevaka"
  ) {
    return "notify";
  }

  return s;
}

function truthyFlag(value) {
  if (value === true) return true;
  if (value === false) return false;

  const s = normalizeCtaMode(value);

  return [
    "1",
    "true",
    "yes",
    "y",
    "preorder",
    "reserve",
    "reservation",
    "coming soon",
    "coming-soon",
    "coming_soon",
    "launch only",
    "launch-only",
    "launch_only",
    "notify",
    "back in stock",
    "watch only",
  ].includes(s);
}

function arrayFromMaybe(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getVariantQty(variant) {
  const n = numberOrNull(variant?.qty ?? variant?.quantity ?? variant?.stock);
  return n == null ? null : Math.max(0, n);
}

function getVariantStockTotal(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  if (!variants.length) return null;

  let sawNumber = false;
  let total = 0;

  for (const variant of variants) {
    const qty = getVariantQty(variant);

    if (qty == null) continue;

    sawNumber = true;
    total += qty;
  }

  return sawNumber ? total : null;
}

function getDeclaredStock(product) {
  const n = numberOrNull(product?.stock ?? product?.inventory ?? product?.qty);
  return n == null ? null : Math.max(0, n);
}

function getEffectiveStock(product) {
  const variantTotal = getVariantStockTotal(product);
  const declared = getDeclaredStock(product);

  // Variantlager är mest exakt eftersom kunden väljer storlek/variant.
  if (variantTotal != null) return variantTotal;
  if (declared != null) return declared;

  // Om inget lager finns i datan antar vi köpbar, så vi inte råkar stänga produkten.
  return null;
}

function hasAnyStock(product) {
  const stock = getEffectiveStock(product);
  if (stock == null) return true;
  return stock > 0;
}

function getLocalizedField(product, field, lang) {
  const safeLang = getActiveLang(lang);
  const byLang = product?.i18n?.[safeLang]?.[field];

  if (byLang !== undefined && byLang !== null && String(byLang).trim() !== "") {
    return byLang;
  }

  const svFallback = product?.i18n?.sv?.[field];

  if (svFallback !== undefined && svFallback !== null && String(svFallback).trim() !== "") {
    return svFallback;
  }

  return product?.[field] ?? "";
}

function localizeProduct(product, lang) {
  if (!product || typeof product !== "object") return product;

  const safeLang = getActiveLang(lang);

  return {
    ...product,

    title: getLocalizedField(product, "title", safeLang),
    description: getLocalizedField(product, "description", safeLang),
    subtitle: getLocalizedField(product, "subtitle", safeLang) || product.subtitle || "",

    badge: getLocalizedField(product, "badge", safeLang) || product.badge || "",
    status: getLocalizedField(product, "status", safeLang) || product.status || "",

    availabilityLabel:
      getLocalizedField(product, "availabilityLabel", safeLang) ||
      product.availabilityLabel ||
      "",

    availabilityText:
      getLocalizedField(product, "availabilityText", safeLang) ||
      product.availabilityText ||
      "",

    preorderBadge:
      getLocalizedField(product, "preorderBadge", safeLang) ||
      product.preorderBadge ||
      product.badge ||
      "",

    preorderLabel:
      getLocalizedField(product, "preorderLabel", safeLang) ||
      product.preorderLabel ||
      product.preorderBadge ||
      product.availabilityLabel ||
      "",

    preorderText:
      getLocalizedField(product, "preorderText", safeLang) ||
      product.preorderText ||
      product.availabilityText ||
      "",

    preorderNote:
      getLocalizedField(product, "preorderNote", safeLang) ||
      product.preorderNote ||
      product.preorderText ||
      product.availabilityText ||
      "",

    preorderEta:
      getLocalizedField(product, "preorderEta", safeLang) ||
      product.preorderEta ||
      "",

    notifyLabel:
      getLocalizedField(product, "notifyLabel", safeLang) ||
      product.notifyLabel ||
      "",

    notifyNote:
      getLocalizedField(product, "notifyNote", safeLang) ||
      product.notifyNote ||
      product.notifyText ||
      "",

    backInStockLabel:
      getLocalizedField(product, "backInStockLabel", safeLang) ||
      product.backInStockLabel ||
      "",

    backInStockNote:
      getLocalizedField(product, "backInStockNote", safeLang) ||
      product.backInStockNote ||
      "",

    _lang: safeLang,
  };
}

function getHeroImage(product) {
  return (
    (Array.isArray(product?.images)
      ? product.images.find((img) => img.type === "thumb")?.image ||
        product.images.find((img) => img.type === "hero")?.image
      : null) ||
    product?.heroImage ||
    product?.hero ||
    product?.image ||
    "/images/no-image.png"
  );
}

function hasExplicitPreorder(product) {
  const mode = normalizeCtaMode(product?.ctaMode);
  const fulfillment = normalizeCtaMode(product?.fulfillmentType || product?.availabilityType);

  if (mode === "preorder") return true;
  if (fulfillment === "preorder") return true;

  return [
    product?.preorder,
    product?.isPreorder,
    product?.preOrder,
    product?.preorderActive,
    product?.preorderOnly,
    product?.comingSoon,
    product?.launchOnly,
    product?.meta?.preorder,
    product?.meta?.isPreorder,
    product?.meta?.preOrder,
    product?.meta?.preorderOnly,
    product?.meta?.comingSoon,
    product?.meta?.launchOnly,
    product?.flags?.preorder,
    product?.flags?.comingSoon,
    product?.flags?.launchOnly,
  ].some(truthyFlag);
}

function hasExplicitNotify(product) {
  const mode = normalizeCtaMode(product?.ctaMode);
  const fulfillment = normalizeCtaMode(product?.fulfillmentType || product?.availabilityType);

  if (mode === "notify") return true;
  if (fulfillment === "notify") return true;

  return [
    product?.notifyMe,
    product?.notify_me,
    product?.notifyOnly,
    product?.backInStockOnly,
    product?.watchOnly,
    product?.meta?.notifyMe,
    product?.meta?.notifyOnly,
    product?.meta?.backInStockOnly,
    product?.flags?.notifyMe,
    product?.flags?.backInStockOnly,
  ].some(truthyFlag);
}

function detectProductMode(product) {
  if (!product || typeof product !== "object") return "buy";

  const rawMode = normalizeCtaMode(product?.ctaMode);
  const inStock = hasAnyStock(product);

  // 1. Explicit ctaMode vinner alltid.
  if (rawMode === "buy") return inStock ? "buy" : "notify";
  if (rawMode === "preorder") return inStock ? "preorder" : "notify";
  if (rawMode === "notify") return "notify";

  // 2. Explicit fulfillment/availability vinner efter ctaMode.
  const fulfillment = normalizeCtaMode(
    product?.fulfillmentType ||
      product?.availabilityType ||
      product?.meta?.fulfillmentType ||
      product?.meta?.availabilityType ||
      ""
  );

  if (fulfillment === "buy") return inStock ? "buy" : "notify";
  if (fulfillment === "preorder") return inStock ? "preorder" : "notify";
  if (fulfillment === "notify") return "notify";

  // 3. Flaggor.
  if (hasExplicitPreorder(product)) return inStock ? "preorder" : "notify";
  if (hasExplicitNotify(product)) return "notify";

  // 4. Text/tags används bara som fallback när ingen tydlig mode finns.
  const tags = arrayFromMaybe(product?.tags).map((x) => normalizeSearchText(x));

  if (
    tags.includes("notify") ||
    tags.includes("notify me") ||
    tags.includes("back in stock") ||
    tags.includes("watch only")
  ) {
    return "notify";
  }

  if (
    tags.includes("preorder") ||
    tags.includes("pre order") ||
    tags.includes("pre-order") ||
    tags.includes("pre_order")
  ) {
    return inStock ? "preorder" : "notify";
  }

  return inStock ? "buy" : "notify";
}

function getPreorderLeadDays(product) {
  const raw =
    product?.preorderLeadDays ??
    product?.leadDays ??
    product?.meta?.preorderLeadDays ??
    product?.meta?.leadDays ??
    null;

  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeProduct(product, index) {
  const priceSEK =
    typeof product?.price === "number"
      ? product.price
      : Number(product?.priceSEK || product?.price || 0) || 0;

  const heroImage = getHeroImage(product);
  const effectiveStock = getEffectiveStock(product);
  const ctaMode = detectProductMode(product);

  const isPreorder = ctaMode === "preorder";
  const isNotifyOnly = ctaMode === "notify";
  const isBuy = ctaMode === "buy";

  const stock =
    effectiveStock != null
      ? effectiveStock
      : getDeclaredStock(product) != null
        ? getDeclaredStock(product)
        : product?.stock;

  return {
    ...product,

    priceSEK,
    price: priceSEK,

    heroImage,
    hero: heroImage,
    image: heroImage,

    stock,

    ctaMode,

    preorder: isPreorder,
    isPreorder,
    preOrder: isPreorder,
    preorderOnly: isPreorder,
    preorderActive: isPreorder,

    notifyOnly: isNotifyOnly,
    notifyMe: isNotifyOnly,
    backInStockOnly: isNotifyOnly,

    fulfillmentType: isBuy
      ? "ready_for_fulfillment"
      : isPreorder
        ? "preorder"
        : "notify",

    availabilityType: isBuy
      ? "in_stock"
      : isPreorder
        ? "preorder"
        : "notify",

    preorderLeadDays: getPreorderLeadDays(product) || 0,

    preorderLabel: cleanString(
      product?.preorderLabel || product?.preorderBadge || product?.availabilityLabel || "",
      120
    ),

    preorderNote: cleanString(
      product?.preorderNote || product?.preorderText || product?.availabilityText || "",
      320
    ),

    notifyLabel: cleanString(product?.notifyLabel || product?.backInStockLabel || "", 120),

    notifyNote: cleanString(
      product?.notifyNote || product?.notifyText || product?.backInStockNote || "",
      320
    ),

    _effectiveStock: effectiveStock,
    _idx: index,
  };
}

const allProducts = (Array.isArray(rawProducts) ? rawProducts : []).map(normalizeProduct);

export async function listProducts({ q, page = 1, limit = 200, lang } = {}) {
  let items = allProducts.map((product) => localizeProduct(product, lang));

  if (q && q.trim() !== "") {
    const needle = normalizeSearchText(q);

    items = items.filter((product) => {
      const title = normalizeSearchText(product.title);
      const desc = normalizeSearchText(product.description);
      const subtitle = normalizeSearchText(product.subtitle);
      const feels = Array.isArray(product.feelings) ? product.feelings : [];
      const tags = Array.isArray(product.tags) ? product.tags : [];

      const inFeels = feels.some((feel) => normalizeSearchText(feel).includes(needle));
      const inTags = tags.some((tag) => normalizeSearchText(tag).includes(needle));

      return (
        title.includes(needle) ||
        desc.includes(needle) ||
        subtitle.includes(needle) ||
        inFeels ||
        inTags
      );
    });
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 200);
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit;

  return items.slice(start, end);
}

export async function getProductBySlug(slug, { lang } = {}) {
  if (!slug) return null;

  const found = allProducts.find((product) => product.slug === slug);
  return found ? localizeProduct(found, lang) : null;
}

export function getAllProductsSync({ lang } = {}) {
  return allProducts.map((product) => localizeProduct(product, lang));
}