// D:\WebProjects\Calestra\apps\store-classic\src\pages\Product.jsx
// apps/store-classic/src/pages/Product.jsx

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import data from "../data/products.json";

import { FREE_SHIPPING_BY_CURRENCY } from "../data/shipping.js";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { convertBasePrice, applyPsychological, formatMoney } from "../utils/money.js";

import { useCart } from "../context/CartContext.jsx";
import { useSound } from "../context/SoundContext.jsx";
import { TT } from "../i18n/tt.js";

import SmartImg from "../components/SmartImg.jsx";
import RelatedStrip from "../components/RelatedStrip.jsx";
import AddedToCartPanel from "../components/AddedToCartPanel.jsx";

const API_BASE =
  import.meta?.env?.VITE_PUBLIC_API_BASE || "https://magiskacalestra.se";

const LEGACY_REDIRECTS = {
  "support-light-pack": "support-dream-pack",
};

async function fetchProductLiveStock(slug) {
  if (!slug || typeof fetch !== "function") return null;

  try {
    const url = new URL("/api/stock", API_BASE);
    url.searchParams.set("slug", slug);
    url.searchParams.set("t", String(Date.now()));

    const res = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) return null;

    return json.product || null;
  } catch {
    return null;
  }
}

function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function getLang(i18n) {
  const raw = String(i18n?.resolvedLanguage || i18n?.language || "sv")
    .slice(0, 2)
    .toLowerCase();

  return ["sv", "en", "tr"].includes(raw) ? raw : "sv";
}

function interpolateText(value, vars = {}) {
  let out = value == null ? "" : String(value);

  Object.entries(vars || {}).forEach(([key, val]) => {
    out = out.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(val ?? ""));
  });

  return out;
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

function normalizeCtaMode(value) {
  const s = normalizeSearchText(value);

  if (!s) return "";

  if (
    s === "buy" ||
    s === "shop" ||
    s === "purchase" ||
    s === "ready" ||
    s === "ready for fulfillment" ||
    s === "ready-for-fulfillment" ||
    s === "ready_for_fulfillment" ||
    s === "kop" ||
    s === "köp"
  ) {
    return "buy";
  }

  if (
    s === "preorder" ||
    s === "pre order" ||
    s === "pre-order" ||
    s === "pre_order" ||
    s === "reserve" ||
    s === "reservation" ||
    s === "reservation queue" ||
    s === "reservation-queue" ||
    s === "reservation_queue" ||
    s === "forkop" ||
    s === "förköp" ||
    s === "forbestall" ||
    s === "förbeställ" ||
    s === "on siparis" ||
    s === "ön sipariş"
  ) {
    return "preorder";
  }

  if (
    s === "notify" ||
    s === "notify me" ||
    s === "notify-me" ||
    s === "notify_me" ||
    s === "notify queue" ||
    s === "notify-queue" ||
    s === "notify_queue" ||
    s === "back in stock" ||
    s === "back-in-stock" ||
    s === "back_in_stock" ||
    s === "watch only" ||
    s === "watch-only" ||
    s === "watch_only" ||
    s === "coming soon" ||
    s === "coming-soon" ||
    s === "coming_soon" ||
    s === "meddela mig" ||
    s === "bevaka"
  ) {
    return "notify";
  }

  return s;
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

function truthyFlag(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;

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
    "pre order",
    "pre-order",
    "pre_order",
    "reserve",
    "reservation",
    "notify",
    "notify me",
    "notify_me",
    "notify-me",
    "back in stock",
    "back_in_stock",
    "back-in-stock",
    "coming soon",
    "coming_soon",
    "coming-soon",
    "launch only",
    "launch_only",
    "launch-only",
    "watch only",
    "watch-only",
    "watch_only",
  ].includes(s);
}

function localizedField(obj, baseKey, i18n, fallback = "") {
  if (!obj || typeof obj !== "object") return fallback;

  const lang = getLang(i18n);

  const fromI18n =
    obj?.i18n?.[lang]?.[baseKey] ||
    obj?.i18n?.sv?.[baseKey] ||
    "";

  if (fromI18n != null && String(fromI18n).trim()) {
    return String(fromI18n);
  }

  const candidates = [
    `${baseKey}_${lang}`,
    `${baseKey}${lang.toUpperCase()}`,
    `${baseKey}${lang}`,
    `${lang}.${baseKey}`,
  ];

  for (const key of candidates) {
    if (key.includes(".")) {
      const [root, child] = key.split(".");
      const value = obj?.[root]?.[child];
      if (value != null && String(value).trim()) return String(value);
    } else if (obj?.[key] != null && String(obj[key]).trim()) {
      return String(obj[key]);
    }
  }

  return obj?.[baseKey] != null && String(obj[baseKey]).trim()
    ? String(obj[baseKey])
    : fallback;
}

function i18nProductField(product, i18n, t, field, fallback = "") {
  const direct = localizedField(product, field, i18n, "");
  if (direct) return direct;

  const slug = product?.slug;
  if (slug) {
    const key = `products.${slug}.${field}`;
    try {
      const value = t(key, { defaultValue: "" });
      if (value && value !== key) return value;
    } catch {
      // fallback below
    }
  }

  return fallback;
}

function localizeProduct(product, i18n, t) {
  if (!product) return null;

  return {
    ...product,
    title: i18nProductField(product, i18n, t, "title", product.title || ""),
    subtitle: i18nProductField(product, i18n, t, "subtitle", product.subtitle || ""),
    description: i18nProductField(product, i18n, t, "description", product.description || ""),
    badge: i18nProductField(product, i18n, t, "badge", product.badge || ""),
    status: i18nProductField(product, i18n, t, "status", product.status || ""),
    availabilityLabel: i18nProductField(
      product,
      i18n,
      t,
      "availabilityLabel",
      product.availabilityLabel || ""
    ),
    availabilityText: i18nProductField(
      product,
      i18n,
      t,
      "availabilityText",
      product.availabilityText || ""
    ),
    preorderBadge: i18nProductField(
      product,
      i18n,
      t,
      "preorderBadge",
      product.preorderBadge || ""
    ),
    preorderLabel: i18nProductField(
      product,
      i18n,
      t,
      "preorderLabel",
      product.preorderLabel || ""
    ),
    preorderText: i18nProductField(product, i18n, t, "preorderText", product.preorderText || ""),
    preorderNote: i18nProductField(product, i18n, t, "preorderNote", product.preorderNote || ""),
    preorderEta: i18nProductField(product, i18n, t, "preorderEta", product.preorderEta || ""),
    notifyLabel: i18nProductField(product, i18n, t, "notifyLabel", product.notifyLabel || ""),
    notifyNote: i18nProductField(product, i18n, t, "notifyNote", product.notifyNote || ""),
    backInStockLabel: i18nProductField(
      product,
      i18n,
      t,
      "backInStockLabel",
      product.backInStockLabel || ""
    ),
    backInStockNote: i18nProductField(
      product,
      i18n,
      t,
      "backInStockNote",
      product.backInStockNote || ""
    ),
  };
}

function getImages(product) {
  const arr = Array.isArray(product?.images) ? product.images : [];
  const hero =
    arr.find((x) => x.type === "hero")?.image ||
    arr.find((x) => x.type === "thumb")?.image ||
    arr[0]?.image ||
    product?.image ||
    "/images/no-image.png";

  return { arr, hero };
}

function clampQty(value, max = 99) {
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? parsed : 1;
  const safeMax = Number.isFinite(Number(max)) ? Math.max(1, Math.min(99, Number(max))) : 99;
  return Math.max(1, Math.min(safeMax, Math.floor(n)));
}

function stockBadge(stock) {
  if (stock == null) return null;

  const n = Number.isFinite(stock) ? Number(stock) : 0;
  if (n <= 0) return { tone: "out" };
  if (n <= 2) return { tone: "hot" };
  if (n <= 5) return { tone: "warn" };
  return null;
}

function getCampaignMode() {
  try {
    const v = localStorage.getItem("cw.campaignOverride");
    return v && typeof v === "string" ? v.toLowerCase() : "";
  } catch {
    return "";
  }
}

function useIsMobile(breakpoint = 980) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

function getProductTextBundle(product) {
  const tags = arrayFromMaybe(product?.tags).map(normalizeSearchText).filter(Boolean);
  const cats = [
    ...arrayFromMaybe(product?.category),
    ...arrayFromMaybe(product?.categories),
    ...arrayFromMaybe(product?.collection),
    ...arrayFromMaybe(product?.collections),
    ...arrayFromMaybe(product?.section),
    ...arrayFromMaybe(product?.department),
    ...arrayFromMaybe(product?.meta?.category),
    ...arrayFromMaybe(product?.meta?.categories),
  ]
    .map(normalizeSearchText)
    .filter(Boolean);

  return [
    normalizeSearchText(product?.slug),
    normalizeSearchText(product?.title),
    normalizeSearchText(product?.subtitle),
    normalizeSearchText(product?.type),
    normalizeSearchText(product?.status),
    normalizeSearchText(product?.badge),
    normalizeSearchText(product?.availabilityLabel),
    normalizeSearchText(product?.availabilityType),
    normalizeSearchText(product?.fulfillmentType),
    normalizeSearchText(product?.meta?.availabilityType),
    normalizeSearchText(product?.meta?.fulfillmentType),
    ...tags,
    ...cats,
  ].join(" ");
}

function productHasCategory(product, category) {
  const key = normalizeCategory(category);
  if (!key) return false;

  const values = [
    ...arrayFromMaybe(product?.category),
    ...arrayFromMaybe(product?.categories),
    ...arrayFromMaybe(product?.collection),
    ...arrayFromMaybe(product?.collections),
    ...arrayFromMaybe(product?.section),
    ...arrayFromMaybe(product?.department),
    ...arrayFromMaybe(product?.meta?.category),
    ...arrayFromMaybe(product?.meta?.categories),
  ]
    .map(normalizeCategory)
    .filter(Boolean);

  return values.includes(key);
}

function isJewelryProduct(product) {
  const text = getProductTextBundle(product);

  return (
    text.includes("jewelry") ||
    text.includes("necklace") ||
    text.includes("halsband") ||
    text.includes("taki") ||
    text.includes("takı") ||
    productHasCategory(product, "jewelry")
  );
}

function isMarketLabProduct(product) {
  const text = getProductTextBundle(product);

  return (
    productHasCategory(product, "market-lab") ||
    text.includes("market lab") ||
    text.includes("future idea") ||
    text.includes("future ideas") ||
    text.includes("concept") ||
    text.includes("prototype") ||
    text.includes("lab item")
  );
}

function getDisplayMode(product, imageUrl = "") {
  const url = String(imageUrl || "").toLowerCase();
  const jewelry = isJewelryProduct(product);

  if (!jewelry) return "cover";

  if (
    url.includes("-hero") ||
    url.includes("-close") ||
    url.includes("-cosmic") ||
    url.includes("-box") ||
    url.includes("-signature")
  ) {
    return "contain";
  }

  return "cover";
}

function getThumbMode(product, imageUrl = "") {
  const url = String(imageUrl || "").toLowerCase();
  const jewelry = isJewelryProduct(product);

  if (!jewelry) return "cover";
  if (url.includes("-worn")) return "cover";
  return "contain";
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function getDirectCtaMode(product) {
  const candidates = [
    product?.ctaMode,
    product?.cta,
    product?.mode,
    product?.availabilityType,
    product?.fulfillmentType,
    product?.status,
    product?.meta?.ctaMode,
    product?.meta?.cta,
    product?.meta?.mode,
    product?.meta?.availabilityType,
    product?.meta?.fulfillmentType,
    product?.flags?.ctaMode,
  ];

  for (const value of candidates) {
    const mode = normalizeCtaMode(value);
    if (mode === "buy" || mode === "preorder" || mode === "notify") return mode;
  }

  return "";
}

function getVariantQty(variant) {
  return numberOrNull(variant?.qty ?? variant?.quantity ?? variant?.stock ?? variant?.inventory);
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
    total += Math.max(0, qty);
  }

  return sawNumber ? total : null;
}

function getDeclaredStock(product) {
  const direct = numberOrNull(product?.stock ?? product?.inventory ?? product?.qty);
  if (direct != null) return Math.max(0, direct);

  const meta = numberOrNull(product?.meta?.stock ?? product?.meta?.inventory ?? product?.meta?.qty);
  if (meta != null) return Math.max(0, meta);

  return null;
}

function getEffectiveStock(product) {
  const variantTotal = getVariantStockTotal(product);
  if (variantTotal != null) return variantTotal;

  const declared = getDeclaredStock(product);
  if (declared != null) return declared;

  return null;
}

function getCurrentVariantStock(currentVariant) {
  const qty = getVariantQty(currentVariant);
  return qty == null ? null : Math.max(0, qty);
}

function hasAnyStock(product) {
  const stock = getEffectiveStock(product);
  if (stock == null) return true;
  return stock > 0;
}

function buildPreorderPayload(product, labels = {}) {
  const directMode = getDirectCtaMode(product);

  const isPreorder = !!(
    directMode === "preorder" ||
    truthyFlag(product?.preorder) ||
    truthyFlag(product?.isPreorder) ||
    truthyFlag(product?.preOrder) ||
    truthyFlag(product?.preorderActive) ||
    truthyFlag(product?.preorderOnly) ||
    truthyFlag(product?.comingSoon) ||
    truthyFlag(product?.launchOnly) ||
    truthyFlag(product?.meta?.preorder) ||
    truthyFlag(product?.meta?.isPreorder) ||
    truthyFlag(product?.meta?.preOrder) ||
    truthyFlag(product?.meta?.preorderOnly) ||
    truthyFlag(product?.flags?.preorder) ||
    truthyFlag(product?.flags?.isPreorder) ||
    truthyFlag(product?.flags?.preorderOnly)
  );

  const preorderLabel = cleanString(
    product?.preorderBadge ||
      product?.preorderLabel ||
      product?.availabilityLabel ||
      product?.badge ||
      labels.preorderDefaultLabel ||
      "PRE-ORDER",
    120
  );

  const preorderNote = cleanString(
    product?.preorderNote ||
      product?.preorderText ||
      product?.availabilityText ||
      labels.preorderDefaultNote ||
      "Detta är en förhandsreservation. Produktion och leverans sker i en senare våg.",
    320
  );

  const preorderEta = cleanString(product?.preorderEta || product?.meta?.preorderEta || "", 180);

  const preorderLeadDays = Number(
    product?.preorderLeadDays ||
      product?.leadDays ||
      product?.meta?.preorderLeadDays ||
      product?.meta?.leadDays ||
      0
  );

  return {
    isPreorder,
    preorderLabel,
    preorderNote,
    preorderEta,
    preorderLeadDays:
      Number.isFinite(preorderLeadDays) && preorderLeadDays > 0 ? preorderLeadDays : 0,
  };
}

function buildNotifyPayload(product, labels = {}) {
  const directMode = getDirectCtaMode(product);

  const explicitNotify = !!(
    directMode === "notify" ||
    truthyFlag(product?.notifyOnly) ||
    truthyFlag(product?.notifyMe) ||
    truthyFlag(product?.notify_me) ||
    truthyFlag(product?.backInStockOnly) ||
    truthyFlag(product?.watchOnly) ||
    truthyFlag(product?.meta?.notifyOnly) ||
    truthyFlag(product?.meta?.notifyMe) ||
    truthyFlag(product?.meta?.backInStockOnly) ||
    truthyFlag(product?.flags?.notifyOnly) ||
    truthyFlag(product?.flags?.notifyMe) ||
    truthyFlag(product?.flags?.backInStockOnly)
  );

  const notifyLabel = cleanString(
    product?.notifyLabel ||
      product?.backInStockLabel ||
      labels.notifyDefaultLabel ||
      "Meddela mig",
    120
  );

  const notifyNote = cleanString(
    product?.notifyNote ||
      product?.backInStockNote ||
      labels.notifyDefaultNote ||
      "Den här produkten är inte köpbar just nu. Lämna din e-post för att bli meddelad när den öppnar.",
    320
  );

  return {
    isNotifyOnly: explicitNotify,
    notifyLabel,
    notifyNote,
  };
}

function getProductCtaMode(product) {
  if (!product || typeof product !== "object") return "buy";

  const directMode = getDirectCtaMode(product);
  const inStock = hasAnyStock(product);

  if (directMode === "buy") return inStock ? "buy" : "notify";
  if (directMode === "notify") return "notify";
  if (directMode === "preorder") return inStock ? "preorder" : "notify";

  const notify = buildNotifyPayload(product);
  if (notify.isNotifyOnly) return "notify";

  const preorder = buildPreorderPayload(product);
  if (preorder.isPreorder) return inStock ? "preorder" : "notify";

  return inStock ? "buy" : "notify";
}

function buildCartProductSnapshot(product, hero, labels = {}) {
  const preorder = buildPreorderPayload(product, labels);
  const notify = buildNotifyPayload(product, labels);
  const ctaMode = getProductCtaMode(product);

  return {
    id: cleanString(product?.id || "", 160),
    slug: cleanString(product?.slug || "", 240),
    title: cleanString(product?.title || "", 240),
    subtitle: cleanString(product?.subtitle || "", 240),
    description: cleanString(product?.description || "", 500),
    image: cleanString(hero || product?.image || "", 1000),
    badge: cleanString(product?.badge || product?.preorderBadge || "", 120),
    status: cleanString(product?.status || product?.availabilityLabel || "", 120),
    preorder: preorder.isPreorder || undefined,
    isPreorder: preorder.isPreorder || undefined,
    preorderOnly: preorder.isPreorder || undefined,
    preorderLabel: preorder.isPreorder ? preorder.preorderLabel : undefined,
    preorderNote: preorder.isPreorder ? preorder.preorderNote : undefined,
    preorderEta: preorder.isPreorder ? preorder.preorderEta : undefined,
    preorderLeadDays: preorder.isPreorder ? preorder.preorderLeadDays || undefined : undefined,
    notifyOnly: notify.isNotifyOnly || undefined,
    notifyLabel: notify.isNotifyOnly ? notify.notifyLabel : undefined,
    notifyNote: notify.isNotifyOnly ? notify.notifyNote : undefined,
    ctaMode,
    fulfillmentType:
      preorder.isPreorder
        ? "preorder"
        : notify.isNotifyOnly
          ? "notify"
          : cleanString(product?.fulfillmentType || "", 80) || undefined,
    availabilityType:
      preorder.isPreorder
        ? "preorder"
        : notify.isNotifyOnly
          ? "notify"
          : cleanString(product?.availabilityType || "", 80) || undefined,
    requiresShipping: !!product?.requiresShipping,
    type: cleanString(product?.type || "", 40) || undefined,
    category: product?.category,
    categories: product?.categories,
    tags: product?.tags,
  };
}

function buildCartLineItem({ product, currentVariant, selSize, selColor, hero, qty, labels = {} }) {
  const preorder = buildPreorderPayload(product, labels);
  const notify = buildNotifyPayload(product, labels);
  const ctaMode = getProductCtaMode(product);

  const size = selSize || currentVariant?.size || null;
  const color = selColor || currentVariant?.color || null;

  const id = currentVariant?.sku
    ? currentVariant.sku
    : product.slug + (size ? `:${size}` : "") + (color ? `:${color}` : "");

  const variantTitle = [size, color].filter(Boolean).join(", ");
  const lineTitle = product.title + (variantTitle ? ` (${variantTitle})` : "");

  const meta = {};
  if (size) meta.size = size;
  if (color) meta.color = color;

  if (preorder.isPreorder) {
    meta.preorder = true;
    meta.isPreorder = true;
    meta.preOrder = true;
    meta.preorderActive = true;
    meta.preorderLabel = preorder.preorderLabel;
    meta.preOrderLabel = preorder.preorderLabel;
    meta.preorderNote = preorder.preorderNote;
    meta.preOrderNote = preorder.preorderNote;
    meta.preorderText = preorder.preorderNote;
    meta.preorderEta = preorder.preorderEta || undefined;
    meta.preorderLeadDays = preorder.preorderLeadDays || undefined;
    meta.fulfillmentType = "preorder";
    meta.availabilityType = "preorder";
    meta.availabilityLabel = preorder.preorderLabel;
    meta.badge = preorder.preorderLabel;
    meta.statusLabel = preorder.preorderLabel;
  }

  return {
    id,
    lineKey: id,
    variantKey: id,
    title: lineTitle,
    name: lineTitle,
    image: hero || "/images/no-image.png",
    price: Number(product.price || 0),
    priceSEK: Number(product.price || 0),
    qty,
    variantTitle,
    variant: variantTitle,
    isDigital: !!product.isDigital,
    type: product.type,
    requiresShipping: !!product.requiresShipping,
    shipping: product.shipping || null,

    ctaMode,
    lineMode: preorder.isPreorder ? "preorder" : "buy",
    orderType: preorder.isPreorder ? "preorder" : "standard",

    preorder: preorder.isPreorder,
    isPreorder: preorder.isPreorder,
    preOrder: preorder.isPreorder,
    preorderOnly: preorder.isPreorder,
    preorderActive: preorder.isPreorder,
    preorderLabel: preorder.isPreorder ? preorder.preorderLabel : "",
    preOrderLabel: preorder.isPreorder ? preorder.preorderLabel : "",
    preorderNote: preorder.isPreorder ? preorder.preorderNote : "",
    preOrderNote: preorder.isPreorder ? preorder.preorderNote : "",
    preorderText: preorder.isPreorder ? preorder.preorderNote : "",
    preorderEta: preorder.isPreorder ? preorder.preorderEta : "",
    preorderLeadDays: preorder.isPreorder ? preorder.preorderLeadDays : 0,
    notifyOnly: notify.isNotifyOnly,
    notifyLabel: notify.isNotifyOnly ? notify.notifyLabel : "",
    notifyNote: notify.isNotifyOnly ? notify.notifyNote : "",
    fulfillmentType: preorder.isPreorder ? "preorder" : product?.fulfillmentType || "",
    availabilityType: preorder.isPreorder ? "preorder" : product?.availabilityType || "",
    availabilityLabel: preorder.isPreorder
      ? preorder.preorderLabel
      : product?.availabilityLabel || "",
    badge: preorder.isPreorder ? preorder.preorderLabel : product?.badge || "",
    status: preorder.isPreorder ? "pre-order" : product?.status || "",

    meta,
    product: buildCartProductSnapshot(product, hero, labels),
  };
}

function buildQueuePrefill(product, labels = {}) {
  const notify = buildNotifyPayload(product, labels);
  const preorder = buildPreorderPayload(product, labels);
  const ctaMode = getProductCtaMode(product);

  return {
    productId: cleanString(product?.id || "", 160),
    slug: cleanString(product?.slug || "", 240),
    title: cleanString(product?.title || "", 240),
    image: cleanString(
      product?.image ||
        product?.images?.find?.((x) => x.type === "thumb")?.image ||
        product?.images?.find?.((x) => x.type === "hero")?.image ||
        product?.images?.[0]?.image ||
        "",
      1000
    ),
    ctaMode,
    queueType: ctaMode === "preorder" ? "reservation_queue" : "notify_queue",
    notifyOnly: notify.isNotifyOnly,
    notifyLabel: notify.notifyLabel,
    notifyNote: notify.notifyNote,
    preorder: preorder.isPreorder,
    preorderLabel: preorder.preorderLabel,
    preorderNote: preorder.preorderNote,
    savedAt: new Date().toISOString(),
  };
}

export default function ProductPage() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { currency, rates, locale } = useCurrency();
  const { add } = useCart();
  const { muted } = useSound();

  const isMobile = useIsMobile(980);

  const [addedPanelOpen, setAddedPanelOpen] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);

  const tx = useCallback(
    (key, fallbackByLang, opts) =>
      interpolateText(TT(i18n, t, key, fallbackByLang, opts), opts),
    [i18n, t]
  );

  const productLabels = useMemo(
    () => ({
      preorderDefaultLabel: tx("product.preorder.defaultLabel", {
        sv: "FÖRKÖP",
        en: "PRE-ORDER",
        tr: "ÖN SİPARİŞ",
      }),
      preorderDefaultNote: tx("product.preorder.defaultNote", {
        sv: "Detta är ett förköp. Produkten läggs i kundvagnen och hanteras i kassan.",
        en: "This is a pre-order. The product is added to the cart and handled at checkout.",
        tr: "Bu bir ön sipariştir. Ürün sepete eklenir ve ödeme adımında işlenir.",
      }),
      notifyDefaultLabel: tx("product.notify.defaultLabel", {
        sv: "Meddela mig",
        en: "Notify me",
        tr: "Bana haber ver",
      }),
      notifyDefaultNote: tx("product.notify.defaultNote", {
        sv: "Den här produkten är inte köpbar just nu. Lämna din e-post för att bli meddelad när den öppnar.",
        en: "This product is not available for purchase right now. Leave your email to be notified when it opens.",
        tr: "Bu ürün şu anda satın alınamıyor. Açıldığında haber almak için e-postanızı bırakın.",
      }),
    }),
    [tx]
  );

  useEffect(() => {
    const next = LEGACY_REDIRECTS[slug];
    if (next) navigate(`/product/${next}`, { replace: true });
  }, [slug, navigate]);

  const rawProduct = useMemo(() => data.find((p) => p.slug === slug) || null, [slug]);
  const localizedProduct = useMemo(() => localizeProduct(rawProduct, i18n, t), [rawProduct, i18n, t]);

  const [liveStock, setLiveStock] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadLiveStock() {
      if (!localizedProduct?.slug) {
        setLiveStock(null);
        return;
      }

      const next = await fetchProductLiveStock(localizedProduct.slug);
      if (alive) setLiveStock(next);
    }

    setLiveStock(null);
    loadLiveStock();

    return () => {
      alive = false;
    };
  }, [localizedProduct?.slug]);

  const product = useMemo(() => {
    if (!localizedProduct) return null;
    if (!liveStock) return localizedProduct;

    const variantsBySku =
      liveStock?.variants && typeof liveStock.variants === "object" ? liveStock.variants : {};

    const variants = Array.isArray(localizedProduct.variants)
      ? localizedProduct.variants.map((variant) => {
          const sku = String(variant?.sku || "");
          const liveVariant = sku ? variantsBySku[sku] : null;
          if (!liveVariant || liveVariant.stock == null) return variant;

          const stock = Math.max(0, Number(liveVariant.stock || 0));

          return {
            ...variant,
            qty: stock,
            inventory: stock,
            stock,
          };
        })
      : localizedProduct.variants;

    const liveQty = Number(liveStock.stock);
    const hasLiveQty = Number.isFinite(liveQty);
    const stock = hasLiveQty ? Math.max(0, liveQty) : localizedProduct.stock;
    const soldOut = hasLiveQty && stock <= 0;

    return {
      ...localizedProduct,
      variants,
      stock,
      inventory: stock,
      availabilityType: soldOut ? "notify" : localizedProduct.availabilityType,
      fulfillmentType: soldOut ? "notify" : localizedProduct.fulfillmentType,
      ctaMode: soldOut ? "notify" : localizedProduct.ctaMode,
      notifyOnly: soldOut ? true : localizedProduct.notifyOnly,
      backInStockOnly: soldOut ? true : localizedProduct.backInStockOnly,
    };
  }, [localizedProduct, liveStock]);

  const relatedItems = useMemo(() => {
    if (!rawProduct) return [];

    const productTags = Array.isArray(rawProduct.tags)
      ? rawProduct.tags.map((x) => String(x).toLowerCase())
      : [];

    const productCategories = [
      ...arrayFromMaybe(rawProduct.category),
      ...arrayFromMaybe(rawProduct.categories),
      ...arrayFromMaybe(rawProduct.collection),
      ...arrayFromMaybe(rawProduct.collections),
    ].map(normalizeCategory);

    return data
      .filter((p) => p?.slug && p.slug !== rawProduct.slug)
      .map((p) => {
        const tags = Array.isArray(p.tags) ? p.tags.map((x) => String(x).toLowerCase()) : [];

        const categories = [
          ...arrayFromMaybe(p.category),
          ...arrayFromMaybe(p.categories),
          ...arrayFromMaybe(p.collection),
          ...arrayFromMaybe(p.collections),
        ].map(normalizeCategory);

        const tagScore = tags.filter((tag) => productTags.includes(tag)).length;
        const categoryScore = categories.filter((cat) => productCategories.includes(cat)).length * 2;
        const typeScore = p.type && rawProduct.type && p.type === rawProduct.type ? 1 : 0;
        const limitedScore = p.limited === rawProduct.limited ? 1 : 0;
        const supportScore = p.support === rawProduct.support ? 1 : 0;

        return {
          product: localizeProduct(p, i18n, t),
          score: tagScore + categoryScore + typeScore + limitedScore + supportScore,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.product);
  }, [rawProduct, i18n, t]);

  const campaign = getCampaignMode();
  const jewelryMode = isJewelryProduct(product);
  const marketLabMode = isMarketLabProduct(product);
  const preorderInfo = buildPreorderPayload(product, productLabels);
  const notifyInfo = buildNotifyPayload(product, productLabels);
  const ctaMode = getProductCtaMode(product);
  const isQueueFlow = ctaMode === "notify";

  const [queueEmail, setQueueEmail] = useState("");
  const [queueState, setQueueState] = useState({
    loading: false,
    ok: false,
    msg: "",
  });
  const [queueOpen, setQueueOpen] = useState(false);

  const showQueueInline = queueOpen;

  useEffect(() => {
    if (!product) return;

    const intent = String(searchParams.get("intent") || "").toLowerCase();
    if (intent !== "notify" && intent !== "notify-me" && intent !== "notify_me") return;

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "cw.notify.prefill",
          JSON.stringify(buildQueuePrefill(product, productLabels))
        );
      }
    } catch {
      // noop
    }
  }, [product, searchParams, productLabels]);

  useEffect(() => {
    if (!showQueueInline) return;

    try {
      const checkoutRaw = window.localStorage.getItem("cw.checkout.prefill");
      if (checkoutRaw) {
        const parsed = JSON.parse(checkoutRaw);
        const existingEmail = String(parsed?.email || "").trim();
        if (existingEmail && !queueEmail) {
          setQueueEmail(existingEmail);
          return;
        }
      }
    } catch {
      // noop
    }

    try {
      const notifyRaw = window.localStorage.getItem("cw.notify.prefill");
      if (notifyRaw) {
        const parsed = JSON.parse(notifyRaw);
        const existingEmail = String(parsed?.email || "").trim();
        if (existingEmail && !queueEmail) setQueueEmail(existingEmail);
      }
    } catch {
      // noop
    }
  }, [showQueueInline, queueEmail]);

  const variantList = Array.isArray(product?.variants) ? product.variants : [];
  const sizesFromVariants = Array.from(new Set(variantList.map((v) => v.size).filter(Boolean)));
  const colorsFromVariants = Array.from(new Set(variantList.map((v) => v.color).filter(Boolean)));

  const sizes = sizesFromVariants.length
    ? sizesFromVariants
    : Array.isArray(product?.sizes)
      ? product.sizes
      : [];

  const colors = colorsFromVariants.length
    ? colorsFromVariants
    : Array.isArray(product?.colors)
      ? product.colors
      : product?.color
        ? [product.color]
        : [];

  const [selSize, setSelSize] = useState(sizes[0] ?? null);
  const [selColor, setSelColor] = useState(colors[0] ?? null);

  useEffect(() => {
    setSelSize(sizes[0] ?? null);
    setSelColor(colors[0] ?? null);
    setQueueOpen(false);
    setQueueState({ loading: false, ok: false, msg: "" });
    setQueueEmail("");
    setAddedPanelOpen(false);
    setLastAddedProduct(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const currentVariant = useMemo(() => {
    if (!variantList.length) return null;
    return (
      variantList.find(
        (v) => (selSize ? v.size === selSize : true) && (selColor ? v.color === selColor : true)
      ) || variantList[0]
    );
  }, [variantList, selSize, selColor]);

  const variantStock = getCurrentVariantStock(currentVariant);
  const productStock = getEffectiveStock(product);

  const effectiveStock = useMemo(() => {
    if (!product) return null;
    if (variantStock != null) return variantStock;
    return productStock;
  }, [product, variantStock, productStock]);

  const qtyMax = useMemo(() => {
    if (!product) return 1;
    if (ctaMode === "notify") return 1;
    if (ctaMode === "preorder") {
      return effectiveStock != null && effectiveStock > 0 ? Math.min(99, effectiveStock) : 99;
    }
    if (effectiveStock != null) return Math.max(1, Math.min(99, effectiveStock));
    return 99;
  }, [product, ctaMode, effectiveStock]);

  const inStock = (() => {
    if (!product) return false;
    if (ctaMode === "notify") return false;
    if (ctaMode === "preorder") return Number(product.price || 0) > 0;
    if (effectiveStock == null) return true;
    return effectiveStock > 0;
  })();

  useEffect(() => {
    setQty((q) => clampQty(q, qtyMax));
  }, [qtyMax]);

  const stockChip = useMemo(() => {
    if (ctaMode === "preorder") {
      return {
        tone: "limited",
        text:
          preorderInfo.preorderLabel ||
          tx("product.preorderBadge", {
            sv: "Förköp",
            en: "Pre-order",
            tr: "Ön sipariş",
          }),
      };
    }

    if (ctaMode === "notify") {
      return {
        tone: "out",
        text:
          notifyInfo.notifyLabel ||
          tx("product.notifyBadge", {
            sv: "Meddela mig",
            en: "Notify me",
            tr: "Bana haber ver",
          }),
      };
    }

    const raw = stockBadge(effectiveStock);
    if (!raw) return null;

    let text;
    if (raw.tone === "out") {
      text = tx("product.stock.out", { sv: "Slut", en: "Sold out", tr: "Tükendi" });
    } else if (raw.tone === "hot") {
      text = tx("product.stock.hot", {
        sv: "Sista ex!",
        en: "Last pieces!",
        tr: "Son parçalar!",
      });
    } else {
      text = tx("product.stock.warn", {
        sv: "Nästan slut",
        en: "Almost sold out",
        tr: "Neredeyse tükendi",
      });
    }

    return { tone: raw.tone, text };
  }, [effectiveStock, ctaMode, preorderInfo.preorderLabel, notifyInfo.notifyLabel, tx]);

  const baseSEK = Number(product?.price || 0);

  const displayNow =
    baseSEK > 0
      ? formatMoney(
          applyPsychological(convertBasePrice(baseSEK, currency, rates), currency),
          currency,
          locale
        )
      : tx("product.noPrice", {
          sv: "Ej prissatt",
          en: "Not priced",
          tr: "Fiyatlandırılmamış",
        });

  const displayWas =
    product?.compareAtPrice != null
      ? formatMoney(
          applyPsychological(
            convertBasePrice(Number(product.compareAtPrice) || 0, currency, rates),
            currency
          ),
          currency,
          locale
        )
      : null;

  const freeThresholdBase = Number(
    FREE_SHIPPING_BY_CURRENCY?.[currency] ?? FREE_SHIPPING_BY_CURRENCY?.SEK ?? 0
  );
  const freeThresholdText =
    freeThresholdBase > 0 ? formatMoney(freeThresholdBase, currency, locale) : "";

  const { arr: images, hero: initialHero } = getImages(product);
  const [heroIdx, setHeroIdx] = useState(
    Math.max(0, images.findIndex((im) => im.image === initialHero))
  );

  useEffect(() => {
    setHeroIdx(Math.max(0, images.findIndex((im) => im.image === initialHero)));
  }, [slug, images, initialHero]);

  const hero = images[heroIdx]?.image || initialHero;
  const safeLen = Math.max(images.length || 1, 1);

  const goNext = useCallback(() => setHeroIdx((i) => (i + 1) % safeLen), [safeLen]);
  const goPrev = useCallback(() => setHeroIdx((i) => (i - 1 + safeLen) % safeLen), [safeLen]);

  const SOUND_URL = `${import.meta.env.BASE_URL ?? "/"}sound/shine-1-268902.mp3`;
  const dingRef = useRef(null);

  useEffect(() => {
    const a = new Audio(SOUND_URL);
    a.preload = "auto";
    a.volume = 0.6;
    dingRef.current = a;
    return () => {
      try {
        a.pause();
      } catch {
        // noop
      }
      a.src = "";
    };
  }, [SOUND_URL]);

  async function beep() {
    if (muted) return;
    const a = dingRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      await a.play();
    } catch {
      // noop
    }
  }

  const [qty, setQty] = useState(1);

  const changeQty = (delta) => {
    setQty((q) => clampQty((q ?? 1) + delta, qtyMax));
  };

  const onQtyInput = (e) => {
    const v = parseInt(e.target.value || "1", 10);
    setQty(clampQty(v, qtyMax));
  };

  const confetti = useRef(null);

  function fireConfetti() {
    try {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
    } catch {
      // noop
    }

    const host = confetti.current;
    if (!host) return;

    for (let i = 0; i < 10; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      s.style.setProperty("--dx", `${((Math.random() - 0.5) * 140).toFixed(0)}px`);
      s.style.setProperty("--dy", `${(-60 - Math.random() * 80).toFixed(0)}px`);
      s.style.setProperty("--rot", `${((Math.random() - 0.5) * 180).toFixed(0)}deg`);
      s.style.left = "50%";
      s.style.top = "0";
      host.appendChild(s);
      setTimeout(() => {
        if (s.parentNode) s.parentNode.removeChild(s);
      }, 800);
    }
  }

  function handleAdd(goCart = false, e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!product) return;
    if (ctaMode === "notify") return;
    if (baseSEK <= 0) return;
    if (ctaMode !== "preorder" && !inStock) return;

    const safeQty = clampQty(qty, qtyMax);

    if (ctaMode !== "preorder" && effectiveStock != null && safeQty > effectiveStock) {
      setQty(clampQty(effectiveStock, qtyMax));
      return;
    }

    const lineItem = buildCartLineItem({
      product,
      currentVariant,
      selSize,
      selColor,
      hero: hero || initialHero,
      qty: safeQty,
      labels: productLabels,
    });

    add(lineItem);
    setLastAddedProduct(lineItem);
    setAddedPanelOpen(true);
    setQty(safeQty);

    void beep();
    fireConfetti();

    if (goCart) navigate("/cart");
  }

  function handleGoToCart(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    navigate("/cart");
  }

  function handleOpenQueue(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!product || ctaMode !== "notify") return;

    const next = new URLSearchParams(searchParams);
    next.set("intent", "notify");
    setSearchParams(next, { replace: true });

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "cw.notify.prefill",
          JSON.stringify(buildQueuePrefill(product, productLabels))
        );
      }
    } catch {
      // noop
    }

    setQueueOpen(true);

    window.requestAnimationFrame(() => {
      const target = document.getElementById("queue-box");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function submitQueue(e) {
    e?.preventDefault?.();

    if (!product) return;

    const email = String(queueEmail || "").trim().toLowerCase();
    if (!isEmail(email)) {
      setQueueState({
        loading: false,
        ok: false,
        msg: tx("product.queue.invalidEmail", {
          sv: "Skriv en giltig e-postadress.",
          en: "Enter a valid email address.",
          tr: "Geçerli bir e-posta adresi yazın.",
        }),
      });
      return;
    }

    setQueueState({ loading: true, ok: false, msg: "" });

    try {
      const source = `notify-queue:${product.slug}`;

      const res = await fetch(new URL("/api/subscribe", API_BASE).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          product_slug: product.slug,
          queue_type: "notify_queue",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setQueueState({
          loading: false,
          ok: true,
          msg: tx("product.queue.alreadyNotify", {
            sv: "Du är redan registrerad. Kolla inkorgen om du behöver bekräfta.",
            en: "You are already registered. Check your inbox if you need to confirm.",
            tr: "Zaten kayıtlısınız. Onay gerekiyorsa gelen kutunuzu kontrol edin.",
          }),
        });
        return;
      }

      if (!res.ok) {
        setQueueState({
          loading: false,
          ok: false,
          msg:
            json?.error ||
            tx("product.queue.errorWithStatus", {
              sv: `Något gick fel (${res.status}). Försök igen.`,
              en: `Something went wrong (${res.status}). Try again.`,
              tr: `Bir sorun oluştu (${res.status}). Tekrar deneyin.`,
            }),
        });
        return;
      }

      try {
        if (typeof window !== "undefined") {
          const existingRaw = window.localStorage.getItem("cw.checkout.prefill");
          const existing = existingRaw ? JSON.parse(existingRaw) : {};
          window.localStorage.setItem(
            "cw.checkout.prefill",
            JSON.stringify({
              ...existing,
              email,
            })
          );

          const notifyRaw = window.localStorage.getItem("cw.notify.prefill");
          const notifyExisting = notifyRaw ? JSON.parse(notifyRaw) : {};
          window.localStorage.setItem(
            "cw.notify.prefill",
            JSON.stringify({
              ...notifyExisting,
              email,
              savedAt: new Date().toISOString(),
            })
          );
        }
      } catch {
        // noop
      }

      setQueueState({
        loading: false,
        ok: true,
        msg: tx("product.queue.successNotify", {
          sv: "Klart! Kolla din e-post för att bekräfta.",
          en: "Done! Check your email to confirm.",
          tr: "Tamam! Onaylamak için e-postanızı kontrol edin.",
        }),
      });
    } catch {
      setQueueState({
        loading: false,
        ok: false,
        msg: tx("product.queue.networkError", {
          sv: "Nätverksfel. Försök igen.",
          en: "Network error. Try again.",
          tr: "Ağ hatası. Tekrar deneyin.",
        }),
      });
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const actionsRef = useRef(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMobile) {
      setShowSticky(false);
      return;
    }

    let raf = 0;

    function compute() {
      const el = actionsRef.current;
      if (!el) {
        setShowSticky(false);
        return;
      }

      const r = el.getBoundingClientRect();
      setShowSticky(r.bottom < 0 || r.top < -120);
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    }

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isMobile]);

  const urgencyText = useMemo(() => {
    if (ctaMode === "preorder") {
      return (
        preorderInfo.preorderNote ||
        tx("product.urgency.preorder", {
          sv: "Förköp är aktivt. Lägg produkten i kundvagnen och fortsätt till kassan när du är redo.",
          en: "Pre-order is active. Add the product to the cart and continue to checkout when ready.",
          tr: "Ön sipariş aktif. Ürünü sepete ekleyin ve hazır olduğunuzda ödemeye geçin.",
        })
      );
    }

    if (ctaMode === "notify") {
      return (
        notifyInfo.notifyNote ||
        tx("product.urgency.notify", {
          sv: "Den här produkten är inte öppen för köp just nu. Lämna din e-post så meddelar vi dig när den blir tillgänglig.",
          en: "This product is not open for purchase right now. Leave your email and we will notify you when it becomes available.",
          tr: "Bu ürün şu anda satın almaya açık değil. E-postanızı bırakın, açıldığında size haber verelim.",
        })
      );
    }

    if (!inStock || effectiveStock === 0) {
      return tx("product.urgency.out", {
        sv: "Den här releasen är just nu slutsåld.",
        en: "This release is currently sold out.",
        tr: "Bu release şu anda tükendi.",
      });
    }

    if (product?.limited && effectiveStock != null && effectiveStock <= 2) {
      return tx(
        "product.urgency.limitedVeryLow",
        {
          sv: "Endast {{count}} kvar – första droppen kan försvinna när som helst.",
          en: "Only {{count}} left — the first drop can disappear at any time.",
          tr: "Yalnızca {{count}} kaldı — ilk drop her an tükenebilir.",
        },
        { count: effectiveStock }
      );
    }

    if (product?.limited && effectiveStock != null && effectiveStock <= 5) {
      return tx(
        "product.urgency.limitedLow",
        {
          sv: "Begränsad release – {{count}} kvar i denna våg.",
          en: "Limited release — {{count}} left in this wave.",
          tr: "Sınırlı release — bu dalgada {{count}} kaldı.",
        },
        { count: effectiveStock }
      );
    }

    if (product?.limited) {
      return tx("product.urgency.limited", {
        sv: "Första droppen är live – nästa release är inte garanterad.",
        en: "The first drop is live — the next release is not guaranteed.",
        tr: "İlk drop yayında — sonraki release garanti değil.",
      });
    }

    if (effectiveStock != null && effectiveStock <= 5) {
      return tx(
        "product.urgency.low",
        {
          sv: "Få kvar i lager – tidiga köp får första vågen.",
          en: "Few left in stock — early purchases get the first wave.",
          tr: "Stokta az kaldı — erken alışverişler ilk dalgaya girer.",
        },
        { count: effectiveStock }
      );
    }

    if (marketLabMode) {
      return tx("product.urgency.marketLab", {
        sv: "Market Lab visar framtida idéer utan att binda kapital. När intresset är tydligt kan produkten gå vidare till riktig drop.",
        en: "Market Lab shows future ideas without tying up capital. When interest is clear, the product can move into a real drop.",
        tr: "Market Lab sermaye bağlamadan gelecekteki fikirleri gösterir. İlgi netleştiğinde ürün gerçek bir drop’a geçebilir.",
      });
    }

    return tx("product.urgency.default", {
      sv: "Utvald release med begränsad känsla – byggd för tidiga upptäckare.",
      en: "Selected release with a limited feeling — built for early discoverers.",
      tr: "Sınırlı hissi taşıyan seçili release — erken keşfedenler için tasarlandı.",
    });
  }, [inStock, effectiveStock, product, preorderInfo, notifyInfo, ctaMode, marketLabMode, tx]);

  const founderLine = useMemo(() => {
    if (ctaMode === "preorder") {
      return tx("product.founder.preorder", {
        sv: "Det här är ett tidigt förköp. Du säkrar intresset via kundvagnen och kassan, utan att produkten behöver vara i full produktion ännu.",
        en: "This is an early pre-order. You secure your interest through cart and checkout before the product is in full production.",
        tr: "Bu erken bir ön sipariştir. Ürün tam üretime geçmeden önce sepet ve ödeme üzerinden ilginizi güvenceye alırsınız.",
      });
    }

    if (ctaMode === "notify") {
      return tx("product.founder.notify", {
        sv: "Den här produkten väntar fortfarande på rätt läge. När den öppnar vill vi kunna nå de som verkligen vill ha den först.",
        en: "This product is still waiting for the right moment. When it opens, we want to reach those who truly want it first.",
        tr: "Bu ürün hâlâ doğru zamanı bekliyor. Açıldığında onu gerçekten isteyenlere önce ulaşmak istiyoruz.",
      });
    }

    if (marketLabMode) {
      return tx("product.founder.marketLab", {
        sv: "Market Lab är Calestras testyta. Här kan framtida idéer visas, mätas och förbättras innan vi binder kapital.",
        en: "Market Lab is Calestra’s testing ground. Future ideas can be shown, measured and improved before we tie up capital.",
        tr: "Market Lab, Calestra’nın test alanıdır. Gelecekteki fikirler sermaye bağlamadan önce gösterilir, ölçülür ve geliştirilir.",
      });
    }

    if (jewelryMode) {
      return tx("product.founder.jewelry", {
        sv: "Det här är inte bara ett smycke. Det är Calestras symbol i bärbar form — ett stilla ljus att bära nära.",
        en: "This is not just jewelry. It is Calestra’s symbol in wearable form — a quiet light to keep close.",
        tr: "Bu sadece bir takı değil. Calestra’nın taşınabilir sembolü — yanında taşıyabileceğin sessiz bir ışık.",
      });
    }

    if (product?.support) {
      return tx("product.founder.support", {
        sv: "Det här är mer än ett köp – det är ett tidigt stöd till det som byggs.",
        en: "This is more than a purchase — it is early support for what is being built.",
        tr: "Bu bir alışverişten fazlası — inşa edilen şeye erken bir destek.",
      });
    }

    if (product?.limited) {
      return tx("product.founder.limited", {
        sv: "De som bär den här var där tidigt – innan resten av världen hunnit ikapp.",
        en: "Those who wear this were there early — before the rest of the world caught up.",
        tr: "Bunu taşıyanlar erkenden oradaydı — dünya yetişmeden önce.",
      });
    }

    return tx("product.founder.default", {
      sv: "Det här är inte bara en produkt. Det är en del av början.",
      en: "This is not just a product. It is part of the beginning.",
      tr: "Bu sadece bir ürün değil. Başlangıcın bir parçası.",
    });
  }, [ctaMode, marketLabMode, jewelryMode, product, tx]);

  const primaryCta = useMemo(() => {
    if (ctaMode === "notify") {
      return tx("product.cta.notifyMe", { sv: "Meddela mig", en: "Notify me", tr: "Bana haber ver" });
    }
    if (ctaMode === "preorder") {
      return tx("product.cta.preorder", { sv: "Förköp", en: "Pre-order", tr: "Ön sipariş" });
    }
    if (!inStock) return tx("product.out", { sv: "Slutsåld", en: "Sold out", tr: "Tükendi" });
    if (jewelryMode) {
      return tx("product.cta.wearLight", { sv: "Bär ljuset", en: "Wear the light", tr: "Işığı taşı" });
    }
    if (product?.limited) {
      return tx("product.cta.secure", { sv: "Säkra din", en: "Secure yours", tr: "Kendininkini ayır" });
    }
    if (product?.support) {
      return tx("product.cta.join", { sv: "Bli en av de första", en: "Become one of the first", tr: "İlklerden biri ol" });
    }
    return tx("product.addToCart", { sv: "Lägg i kundvagn", en: "Add to cart", tr: "Sepete ekle" });
  }, [ctaMode, inStock, jewelryMode, product, tx]);

  const secondaryCta = useMemo(() => {
    if (ctaMode === "notify") return tx("product.cta.moreInfo", { sv: "Läs mer", en: "Read more", tr: "Daha fazla bilgi" });
    if (ctaMode === "preorder") return tx("product.goToCart", { sv: "Gå till kundvagn", en: "Go to cart", tr: "Sepete git" });
    if (!inStock) return tx("product.goToCart", { sv: "Gå till kundvagn", en: "Go to cart", tr: "Sepete git" });
    if (jewelryMode) return tx("product.cta.keepClose", { sv: "Ha den nära", en: "Keep it close", tr: "Yakınında taşı" });
    if (product?.limited) return tx("product.cta.takePlace", { sv: "Ta din plats", en: "Take your place", tr: "Yerini al" });
    return tx("product.goToCart", { sv: "Gå till kundvagn", en: "Go to cart", tr: "Sepete git" });
  }, [ctaMode, inStock, jewelryMode, product, tx]);

  const signalFeelText = useMemo(() => {
    if (ctaMode === "preorder") return tx("product.signal.feelPreorder", { sv: "Förköp", en: "Pre-order", tr: "Ön sipariş" });
    if (ctaMode === "notify") return tx("product.signal.feelNotify", { sv: "Mer väntelista", en: "More waitlist", tr: "Daha çok bekleme listesi" });
    if (marketLabMode) return tx("product.signal.feelMarketLab", { sv: "Testidé", en: "Test idea", tr: "Test fikri" });
    if (jewelryMode) return tx("product.signal.feelJewelry", { sv: "Mer symbolisk", en: "More symbolic", tr: "Daha sembolik" });
    if (product?.limited) return tx("product.signal.feelLimited", { sv: "Mer sällsynt", en: "More rare", tr: "Daha nadir" });
    return tx("product.signal.feelValue", { sv: "Mer utvald", en: "More selected", tr: "Daha seçkin" });
  }, [ctaMode, marketLabMode, jewelryMode, product, tx]);

  const signalNowText = useMemo(() => {
    if (ctaMode === "preorder") return tx("product.signal.buyPreorder", { sv: "Via kundvagn", en: "Through cart", tr: "Sepet üzerinden" });
    if (ctaMode === "notify") return tx("product.signal.buyNotify", { sv: "Mail-intresse", en: "Email interest", tr: "E-posta ilgisi" });
    if (marketLabMode) return tx("product.signal.buyMarketLab", { sv: "Mät intresse", en: "Measure interest", tr: "İlgiyi ölç" });
    if (jewelryMode) return tx("product.signal.buyJewelry", { sv: "Bärbar ikon", en: "Wearable icon", tr: "Taşınabilir ikon" });
    if (product?.limited) return tx("product.signal.buyLimited", { sv: "Första vågen", en: "First wave", tr: "İlk dalga" });
    return tx("product.signal.buyValue", { sv: "Snabb väg", en: "Fast path", tr: "Hızlı yol" });
  }, [ctaMode, marketLabMode, jewelryMode, product, tx]);

  const productToneNote = useMemo(() => {
    if (ctaMode === "preorder") {
      return preorderInfo.preorderEta
        ? `${preorderInfo.preorderNote} ${preorderInfo.preorderEta}`
        : preorderInfo.preorderNote;
    }

    if (ctaMode === "notify") return notifyInfo.notifyNote;

    if (marketLabMode) {
      return tx("product.marketLab.note", {
        sv: "Market Lab-produkter är framtida idéer. De ska kunna visas och valideras utan att Calestra binder kapital för tidigt.",
        en: "Market Lab products are future ideas. They can be shown and validated without Calestra tying up capital too early.",
        tr: "Market Lab ürünleri gelecekteki fikirlerdir. Calestra çok erken sermaye bağlamadan gösterilip doğrulanabilir.",
      });
    }

    if (!jewelryMode) return null;

    return tx("product.jewelry.note", {
      sv: "Passar som gåva, samlarobjekt eller som din egen lilla Harmonic Star att bära till vardags.",
      en: "Works as a gift, collector object, or your own small Harmonic Star to wear every day.",
      tr: "Hediye, koleksiyon parçası veya günlük taşıyabileceğin küçük Harmonic Star olarak uygundur.",
    });
  }, [preorderInfo, notifyInfo, marketLabMode, jewelryMode, ctaMode, tx]);

  const queueBoxTitle = useMemo(() => {
    return notifyInfo.notifyLabel || tx("product.cta.notifyMe", { sv: "Meddela mig", en: "Notify me", tr: "Bana haber ver" });
  }, [notifyInfo.notifyLabel, tx]);

  const queueBoxLead = useMemo(() => {
    return (
      notifyInfo.notifyNote ||
      tx("product.queue.leadNotify", {
        sv: "Lämna din e-post så skickar vi en notis när produkten blir tillgänglig.",
        en: "Leave your email and we will notify you when the product becomes available.",
        tr: "E-postanızı bırakın, ürün açıldığında size bildirim gönderelim.",
      })
    );
  }, [notifyInfo.notifyNote, tx]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product?.title || "",
    description: product?.description || "",
    image: images.map((im) => im.image || initialHero).slice(0, 6),
    sku: product?.slug || "",
    brand: { "@type": "Brand", name: "Calestra" },
    offers:
      baseSEK > 0
        ? {
            "@type": "Offer",
            priceCurrency: currency,
            price: (
              applyPsychological(convertBasePrice(baseSEK, currency, rates), currency) || 0
            ).toFixed(2),
            availability:
              ctaMode === "notify"
                ? "https://schema.org/OutOfStock"
                : ctaMode === "preorder"
                  ? "https://schema.org/PreOrder"
                  : inStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
            url: typeof window !== "undefined" ? window.location.href : "",
          }
        : undefined,
  };

  const addDisabled =
    ctaMode === "notify"
      ? false
      : ctaMode === "preorder"
        ? baseSEK <= 0
        : baseSEK <= 0 ||
          !inStock ||
          (currentVariant && getCurrentVariantStock(currentVariant) === 0);

  if (!product) {
    return (
      <div className="pdp container">
        <p style={{ marginTop: 16 }}>
          {tx("product.missing", {
            sv: "Produkten kunde inte hittas.",
            en: "The product could not be found.",
            tr: "Ürün bulunamadı.",
          })}
        </p>
        <Link to="/shop" className="pdp-back">
          ←{" "}
          {tx("product.backToShop", {
            sv: "Tillbaka till butiken",
            en: "Back to the shop",
            tr: "Mağazaya dön",
          })}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`pdp container ${jewelryMode ? "pdp--jewelry" : ""} ${
        ctaMode === "notify" ? "pdp--queue" : ""
      } ${ctaMode === "preorder" ? "pdp--preorder" : ""} ${
        marketLabMode ? "pdp--market-lab" : ""
      }`}
      data-campaign={campaign || undefined}
    >
      <Link to="/shop" className="pdp-back">
        ←{" "}
        {tx("product.backToShop", {
          sv: "Tillbaka till butiken",
          en: "Back to the shop",
          tr: "Mağazaya dön",
        })}
      </Link>

      <section className="pdp-topline">
        <div className="pdp-kicker">
          <span className="pdp-live-dot" />
          <span>
            {ctaMode === "preorder"
              ? tx("product.kickerPreorder", { sv: "Förköp", en: "Pre-order", tr: "Ön sipariş" })
              : ctaMode === "notify"
                ? tx("product.kickerNotify", {
                    sv: "Meddela när redo",
                    en: "Notify when ready",
                    tr: "Hazır olunca haber ver",
                  })
                : marketLabMode
                  ? tx("product.kickerMarketLab", { sv: "Market Lab", en: "Market Lab", tr: "Market Lab" })
                  : jewelryMode
                    ? tx("product.kickerJewelry", {
                        sv: "Bärbar symbol",
                        en: "Wearable symbol",
                        tr: "Taşınabilir sembol",
                      })
                    : tx("product.kicker", { sv: "Utvald release", en: "Selected release", tr: "Seçili release" })}
          </span>
        </div>
      </section>

      <div className="pdp-grid">
        <section className="pdp-card pdp-gallery">
          {!!hero && (
            <figure
              className={`pdp-hero-wrap ${campaign ? "is-campaign" : ""} ${
                jewelryMode ? "is-jewelry" : ""
              }`}
            >
              <SmartImg
                src={hero}
                alt={product.title}
                className={`pdp-hero pdp-hero--${getDisplayMode(product, hero)}`}
                loading="eager"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="pdp-arrow pdp-arrow--left"
                    onClick={goPrev}
                    aria-label={tx("product.prevImage", {
                      sv: "Föregående bild",
                      en: "Previous image",
                      tr: "Önceki görsel",
                    })}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="pdp-arrow pdp-arrow--right"
                    onClick={goNext}
                    aria-label={tx("product.nextImage", {
                      sv: "Nästa bild",
                      en: "Next image",
                      tr: "Sonraki görsel",
                    })}
                  >
                    ›
                  </button>
                </>
              )}

              {campaign && <span className="pdp-glint" aria-hidden="true" />}
            </figure>
          )}

          {!!images.length && (
            <div className="pdp-thumbs" role="list">
              {images.map((im, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setHeroIdx(i)}
                  className={`pdp-thumb ${heroIdx === i ? "is-active" : ""} ${
                    jewelryMode ? "is-jewelry" : ""
                  }`}
                  aria-label={tx("product.thumb", {
                    sv: "Välj bild",
                    en: "Choose image",
                    tr: "Görsel seç",
                  })}
                >
                  <SmartImg
                    src={im.image}
                    alt=""
                    aria-hidden="true"
                    className={`pdp-thumb-img pdp-thumb-img--${getThumbMode(product, im.image)}`}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="pdp-card pdp-info">
          <div className="pdp-header">
            <div className="pdp-badges">
              {product.limited && (
                <span className="pflag pflag--limited">
                  {tx("product.flag.limited", { sv: "Limited", en: "Limited", tr: "Sınırlı" })}
                </span>
              )}

              {product.support && (
                <span className="pflag pflag--support">
                  {tx("product.flag.support", { sv: "Support", en: "Support", tr: "Destek" })}
                </span>
              )}

              {marketLabMode && (
                <span className="pflag pflag--market">
                  {tx("product.flag.marketLab", { sv: "Market Lab", en: "Market Lab", tr: "Market Lab" })}
                </span>
              )}

              {jewelryMode && (
                <span className="pflag pflag--jewelry">
                  {tx("product.flag.jewelry", { sv: "Smycke", en: "Jewelry", tr: "Takı" })}
                </span>
              )}

              {ctaMode === "preorder" && (
                <span className="pflag pflag--preorder">{preorderInfo.preorderLabel}</span>
              )}

              {ctaMode === "notify" && (
                <span className="pflag pflag--notify">{notifyInfo.notifyLabel}</span>
              )}

              {stockChip && (
                <span
                  className={`pflag pflag--${stockChip.tone}`}
                  data-anim={stockChip.tone === "hot" ? "pulse" : undefined}
                  aria-live="polite"
                >
                  {stockChip.text}
                </span>
              )}
            </div>

            <h1 className="pdp-title">{product.title}</h1>

            {product.subtitle && <div className="pdp-subtitle">{product.subtitle}</div>}
          </div>

          <div className="pdp-price-row">
            <span className="pdp-now">{displayNow}</span>
            {displayWas && <span className="pdp-was">{displayWas}</span>}
          </div>

          <div className="pdp-urgency" aria-live="polite">
            {urgencyText}
          </div>

          {product.description && <p className="pdp-desc">{product.description}</p>}

          <div className="pdp-founder">{founderLine}</div>

          {productToneNote && <div className="pdp-jewelry-note">{productToneNote}</div>}

          <div className="pdp-signal-grid">
            <div className="pdp-signal">
              <span>{tx("product.signal.feel", { sv: "Känsla", en: "Feeling", tr: "His" })}</span>
              <strong>{signalFeelText}</strong>
            </div>

            <div className="pdp-signal">
              <span>{tx("product.signal.drop", { sv: "Status", en: "Status", tr: "Durum" })}</span>
              <strong>
                {ctaMode === "preorder"
                  ? tx("product.signal.preorderOpen", {
                      sv: "Förköp öppet",
                      en: "Pre-order open",
                      tr: "Ön sipariş açık",
                    })
                  : ctaMode === "notify"
                    ? tx("product.signal.notifyOpen", {
                        sv: "Mail-intresse öppet",
                        en: "Email interest open",
                        tr: "E-posta ilgisi açık",
                      })
                    : effectiveStock == null
                      ? tx("product.signal.available", {
                          sv: "Tillgänglig",
                          en: "Available",
                          tr: "Mevcut",
                        })
                      : effectiveStock > 0
                        ? tx(
                            "product.signal.stockCount",
                            {
                              sv: "{{count}} kvar",
                              en: "{{count}} left",
                              tr: "{{count}} kaldı",
                            },
                            { count: effectiveStock }
                          )
                        : tx("product.signal.dropOut", {
                            sv: "Slut i lager",
                            en: "Out of stock",
                            tr: "Stokta yok",
                          })}
              </strong>
            </div>

            <div className="pdp-signal">
              <span>{tx("product.signal.buy", { sv: "Nu", en: "Now", tr: "Şimdi" })}</span>
              <strong>{signalNowText}</strong>
            </div>
          </div>

          {sizes.length > 0 && ctaMode !== "notify" && (
            <div className="pdp-group">
              <div className="pdp-label">
                {tx("product.size", { sv: "Storlek", en: "Size", tr: "Beden" })}
              </div>
              <div className="pdp-options">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`pdp-chip ${selSize === s ? "is-on" : ""}`}
                    onClick={() => setSelSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && ctaMode !== "notify" && (
            <div className="pdp-group">
              <div className="pdp-label">
                {tx("product.color", { sv: "Färg", en: "Color", tr: "Renk" })}
              </div>
              <div className="pdp-options">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`pdp-chip ${selColor === c ? "is-on" : ""}`}
                    onClick={() => setSelColor(c)}
                  >
                    {tx(`colors.${c}`, { sv: c, en: c, tr: c })}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentVariant && getCurrentVariantStock(currentVariant) != null && ctaMode === "buy" && (
            <div
              className={`pdp-stockline ${
                getCurrentVariantStock(currentVariant) > 0 ? "is-ok" : "is-out"
              }`}
            >
              {getCurrentVariantStock(currentVariant) > 0
                ? tx(
                    "product.inStock",
                    {
                      sv: "I lager: {{count}} st",
                      en: "In stock: {{count}}",
                      tr: "Stokta: {{count}} adet",
                    },
                    { count: getCurrentVariantStock(currentVariant) }
                  )
                : tx("product.outOfStock", {
                    sv: "Slut i lager",
                    en: "Out of stock",
                    tr: "Stokta yok",
                  })}
            </div>
          )}

          {ctaMode !== "notify" && (
            <div className="pdp-qty-row">
              <label htmlFor="qty" className="pdp-label">
                {tx("product.qty", { sv: "Antal", en: "Quantity", tr: "Adet" })}
              </label>

              <div className="pdp-qty-ctrl">
                <button
                  type="button"
                  className="pdp-pill"
                  onClick={() => changeQty(-1)}
                  disabled={qty <= 1}
                  aria-label={tx("product.decrease", {
                    sv: "Minska antal",
                    en: "Decrease quantity",
                    tr: "Adedi azalt",
                  })}
                >
                  −
                </button>

                <input
                  id="qty"
                  className="pdp-qty-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={qtyMax}
                  value={qty}
                  onChange={onQtyInput}
                  aria-label={tx("product.qtyInput", {
                    sv: "Antal",
                    en: "Quantity",
                    tr: "Adet",
                  })}
                />

                <button
                  type="button"
                  className="pdp-pill"
                  onClick={() => changeQty(1)}
                  disabled={qty >= qtyMax}
                  aria-label={tx("product.increase", {
                    sv: "Öka antal",
                    en: "Increase quantity",
                    tr: "Adedi artır",
                  })}
                >
                  +
                </button>
              </div>

              {effectiveStock != null && ctaMode === "buy" ? (
                <div className="pdp-qty-hint">
                  {tx(
                    "product.qty.maxHint",
                    {
                      sv: "Max {{count}} st kan läggas till just nu.",
                      en: "Max {{count}} can be added right now.",
                      tr: "Şu anda en fazla {{count}} adet eklenebilir.",
                    },
                    { count: qtyMax }
                  )}
                </div>
              ) : null}
            </div>
          )}

          <div className="pdp-actions" ref={actionsRef}>
            <div className="confetti-host" ref={confetti} aria-hidden="true" />

            <button
              className="pdp-btn pdp-primary"
              disabled={addDisabled}
              onClick={(e) => (isQueueFlow ? handleOpenQueue(e) : handleAdd(false, e))}
            >
              {primaryCta}
            </button>

            <button
              className="pdp-btn"
              onClick={(e) => (isQueueFlow ? handleOpenQueue(e) : handleGoToCart(e))}
            >
              {secondaryCta}
            </button>
          </div>

          {showQueueInline ? (
            <div id="queue-box" className="queueBox" aria-live="polite">
              <div className="queueBoxTitle">{queueBoxTitle}</div>
              <div className="queueBoxLead">{queueBoxLead}</div>

              <form className="queueForm" onSubmit={submitQueue}>
                <input
                  type="email"
                  value={queueEmail}
                  onChange={(e) => setQueueEmail(e.target.value)}
                  placeholder={tx("product.queue.placeholder", {
                    sv: "din@email.com",
                    en: "your@email.com",
                    tr: "sen@eposta.com",
                  })}
                  inputMode="email"
                  autoComplete="email"
                  className="queueInput"
                  disabled={queueState.loading}
                />

                <button
                  type="submit"
                  className="queueBtn"
                  disabled={queueState.loading || !isEmail(queueEmail)}
                >
                  {queueState.loading
                    ? tx("product.queue.loading", { sv: "…", en: "…", tr: "…" })
                    : tx("product.notify.submit", {
                        sv: "Meddela mig när den finns",
                        en: "Notify me when available",
                        tr: "Açıldığında bana haber ver",
                      })}
                </button>
              </form>

              <div className="queueHint">
                {tx("product.queue.hintNotify", {
                  sv: "Vi skickar ett bekräftelsemejl först så att du inte missar när produkten öppnar.",
                  en: "We send a confirmation email first so you do not miss when the product opens.",
                  tr: "Ürün açıldığında kaçırmamanız için önce onay e-postası göndeririz.",
                })}
              </div>

              {queueState.msg ? (
                <div className={`queueMsg ${queueState.ok ? "is-ok" : "is-err"}`}>
                  {queueState.msg}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="pdp-legal">
            <small>
              {tx("product.taxHint", {
                sv: "Priser visas i",
                en: "Prices are shown in",
                tr: "Fiyatlar şu para biriminde gösterilir:",
              })}{" "}
              {currency}.{" "}
              {tx("product.returnHint", {
                sv: "Tillverkas på beställning • Trygg garanti vid fel.",
                en: "Made on demand • Safe guarantee for defects.",
                tr: "Sipariş üzerine üretilir • Hata durumunda güvenli garanti.",
              })}{" "}
              {freeThresholdText
                ? tx(
                    "product.shippingHintDyn",
                    {
                      sv: "Fri frakt över {{amount}}.",
                      en: "Free shipping over {{amount}}.",
                      tr: "{{amount}} üzeri ücretsiz kargo.",
                    },
                    { amount: freeThresholdText }
                  )
                : tx("product.shippingHint", {
                    sv: "Fri frakt finns enligt villkor.",
                    en: "Free shipping is available according to terms.",
                    tr: "Ücretsiz kargo koşullara göre mevcuttur.",
                  })}
            </small>
          </div>
        </aside>
      </div>

      <RelatedStrip items={relatedItems} />

      {isMobile && (
        <div
          className={`pdp-sticky ${showSticky ? "is-on" : ""}`}
          role="region"
          aria-label={tx("product.sticky.aria", {
            sv: "Snabbköp",
            en: "Quick buy",
            tr: "Hızlı alışveriş",
          })}
        >
          <div className="pdp-sticky-inner">
            <div className="pdp-sticky-left">
              <div className="pdp-sticky-title">{product.title}</div>

              <div className="pdp-sticky-sub">
                <span className="pdp-sticky-price">{displayNow}</span>

                {stockChip ? (
                  <span className={`pdp-sticky-chip pdp-sticky-chip--${stockChip.tone}`}>
                    {stockChip.text}
                  </span>
                ) : null}

                {ctaMode !== "notify" && (selSize || selColor) ? (
                  <span className="pdp-sticky-variant">
                    {[
                      selSize
                        ? `${tx("product.size", {
                            sv: "Storlek",
                            en: "Size",
                            tr: "Beden",
                          })}: ${selSize}`
                        : "",
                      selColor
                        ? `${tx("product.color", {
                            sv: "Färg",
                            en: "Color",
                            tr: "Renk",
                          })}: ${tx(`colors.${selColor}`, {
                            sv: selColor,
                            en: selColor,
                            tr: selColor,
                          })}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              className="pdp-sticky-btn"
              disabled={addDisabled}
              onClick={(e) => (isQueueFlow ? handleOpenQueue(e) : handleAdd(false, e))}
            >
              {primaryCta}
            </button>
          </div>
        </div>
      )}

      <AddedToCartPanel
        open={addedPanelOpen}
        onClose={() => setAddedPanelOpen(false)}
        product={lastAddedProduct}
        t={t}
        i18n={i18n}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <style>{`
        .pdp.container{
          max-width:1160px;
          margin:0 auto;
          padding:18px 16px 110px;
        }

        .pdp-back{
          display:inline-flex;
          align-items:center;
          gap:6px;
          text-decoration:none;
          font-weight:900;
          color:#334155;
          margin-bottom:12px;
        }

        .pdp-topline{
          margin-bottom:12px;
        }

        .pdp-kicker{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:6px 10px;
          border-radius:999px;
          background:rgba(15,23,42,.05);
          border:1px solid rgba(15,23,42,.08);
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
        }

        .pdp-live-dot{
          width:8px;
          height:8px;
          border-radius:999px;
          background:#f97316;
          box-shadow:0 0 0 0 rgba(249,115,22,.42);
          animation:pdpPulse 1.8s infinite;
        }

        @keyframes pdpPulse{
          0%{ box-shadow:0 0 0 0 rgba(249,115,22,.42); }
          70%{ box-shadow:0 0 0 8px rgba(249,115,22,0); }
          100%{ box-shadow:0 0 0 0 rgba(249,115,22,0); }
        }

        .pdp-grid{
          display:grid;
          grid-template-columns:1.06fr .94fr;
          gap:18px;
          align-items:start;
        }

        .pdp-card{
          border-radius:26px;
          border:1px solid rgba(15,23,42,.08);
          background:linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
          box-shadow:0 18px 38px rgba(15,23,42,.06);
        }

        .pdp-gallery{
          padding:14px;
        }

        .pdp-hero-wrap{
          position:relative;
          overflow:hidden;
          border-radius:22px;
          background:#f8fafc;
        }

        .pdp-hero-wrap.is-jewelry{
          background:
            radial-gradient(circle at 50% 16%, rgba(251,191,36,.18), rgba(251,191,36,0) 42%),
            linear-gradient(180deg, #fffdf8 0%, #faf6ef 100%);
        }

        .pdp-hero{
          width:100%;
          aspect-ratio:1/1.04;
          display:block;
        }

        .pdp-hero--cover{ object-fit:cover; }

        .pdp-hero--contain{
          object-fit:contain;
          padding:16px;
        }

        .pdp--jewelry .pdp-hero{
          aspect-ratio:1/1.12;
        }

        .pdp-hero-wrap.is-campaign::after{
          content:"";
          position:absolute;
          inset:auto -20% -24% auto;
          width:220px;
          height:220px;
          border-radius:999px;
          background:radial-gradient(circle, rgba(251,191,36,.18), rgba(251,191,36,0));
          pointer-events:none;
          filter:blur(14px);
        }

        .pdp-glint{
          position:absolute;
          inset:0;
          pointer-events:none;
          background:linear-gradient(115deg, transparent 0%, rgba(255,255,255,.18) 28%, transparent 54%);
          mix-blend-mode:screen;
          opacity:.45;
        }

        .pdp-arrow{
          position:absolute;
          top:50%;
          transform:translateY(-50%);
          width:42px;
          height:42px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.28);
          background:rgba(15,23,42,.55);
          color:#fff;
          font-size:24px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          backdrop-filter:blur(8px);
        }

        .pdp-arrow--left{ left:12px; }
        .pdp-arrow--right{ right:12px; }

        .pdp-thumbs{
          display:grid;
          grid-template-columns:repeat(auto-fit, minmax(70px, 1fr));
          gap:10px;
          margin-top:12px;
        }

        .pdp-thumb{
          border:1px solid rgba(148,163,184,.22);
          border-radius:16px;
          padding:0;
          overflow:hidden;
          background:#fff;
          cursor:pointer;
        }

        .pdp-thumb-img{
          width:100%;
          aspect-ratio:1/1;
          display:block;
        }

        .pdp-thumb-img--cover{ object-fit:cover; }

        .pdp-thumb-img--contain{
          object-fit:contain;
          padding:8px;
          background:
            radial-gradient(circle at 50% 20%, rgba(251,191,36,.12), rgba(251,191,36,0) 46%),
            linear-gradient(180deg, #fffdf8 0%, #faf6ef 100%);
        }

        .pdp-thumb.is-jewelry .pdp-thumb-img{
          aspect-ratio:3/4;
        }

        .pdp-thumb.is-active{
          border-color:#0f172a;
          box-shadow:0 0 0 2px rgba(15,23,42,.08);
        }

        .pdp-info{
          padding:22px;
          position:relative;
          overflow:hidden;
        }

        .pdp-info::before{
          content:"";
          position:absolute;
          inset:-80px -90px auto auto;
          width:210px;
          height:210px;
          border-radius:999px;
          background:radial-gradient(circle, rgba(251,191,36,.14), rgba(251,191,36,0) 68%);
          pointer-events:none;
        }

        .pdp-header{
          position:relative;
          margin-bottom:10px;
        }

        .pdp-badges{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          margin-bottom:12px;
        }

        .pflag{
          display:inline-flex;
          align-items:center;
          padding:6px 10px;
          border-radius:999px;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
        }

        .pflag--limited,
        .pflag--preorder{
          background:rgba(254,240,138,.98);
          color:#854d0e;
        }

        .pflag--support{
          background:rgba(224,231,255,.95);
          color:#3730A3;
        }

        .pflag--jewelry{
          background:rgba(255,247,237,.95);
          color:#9A3412;
        }

        .pflag--market,
        .pflag--notify{
          background:rgba(219,234,254,.98);
          color:#1d4ed8;
        }

        .pflag--hot{
          background:rgba(254,226,226,.95);
          color:#991B1B;
        }

        .pflag--warn{
          background:rgba(255,237,213,.95);
          color:#9A3412;
        }

        .pflag--out{
          background:rgba(229,231,235,.95);
          color:#374151;
        }

        .pdp-title{
          margin:0;
          font-size:clamp(30px, 4vw, 48px);
          line-height:1.02;
          letter-spacing:-.045em;
          color:#0f172a;
        }

        .pdp-subtitle{
          margin-top:8px;
          color:#64748b;
          font-size:14px;
          font-weight:800;
        }

        .pdp-price-row{
          display:flex;
          align-items:flex-end;
          gap:12px;
          margin:14px 0 10px;
          position:relative;
        }

        .pdp-now{
          font-size:clamp(28px, 4vw, 40px);
          line-height:1;
          font-weight:1000;
          color:#0f172a;
          letter-spacing:-.03em;
        }

        .pdp-was{
          color:#94a3b8;
          text-decoration:line-through;
          font-weight:900;
          font-size:14px;
          transform:translateY(-3px);
        }

        .pdp-urgency{
          margin:0 0 12px;
          padding:10px 12px;
          border-radius:14px;
          background:linear-gradient(135deg, rgba(15,23,42,.06), rgba(249,115,22,.06));
          border:1px solid rgba(15,23,42,.08);
          color:#0f172a;
          font-weight:900;
          line-height:1.45;
          font-size:13px;
        }

        .pdp--queue .pdp-urgency,
        .pdp--preorder .pdp-urgency,
        .pdp--market-lab .pdp-urgency{
          background:linear-gradient(135deg, rgba(254,240,138,.34), rgba(255,255,255,.88));
          border-color:rgba(245,158,11,.24);
        }

        .pdp-desc{
          margin:0 0 14px;
          color:#334155;
          line-height:1.65;
          font-size:15px;
          font-weight:700;
          max-width:64ch;
        }

        .pdp-founder{
          margin:0 0 16px;
          padding-left:14px;
          border-left:3px solid rgba(249,115,22,.45);
          color:#475569;
          font-size:14px;
          line-height:1.55;
          font-weight:900;
        }

        .pdp-jewelry-note{
          margin:0 0 16px;
          padding:12px 14px;
          border-radius:16px;
          background:linear-gradient(135deg, rgba(255,247,237,.9), rgba(255,255,255,.9));
          border:1px solid rgba(251,191,36,.24);
          color:#7c5b2b;
          font-size:14px;
          line-height:1.55;
          font-weight:800;
        }

        .pdp-signal-grid{
          display:grid;
          grid-template-columns:repeat(3, minmax(0,1fr));
          gap:10px;
          margin:0 0 16px;
        }

        .pdp-signal{
          padding:12px;
          border-radius:16px;
          border:1px solid rgba(15,23,42,.08);
          background:rgba(255,255,255,.72);
        }

        .pdp-signal span{
          display:block;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:#64748b;
          margin-bottom:5px;
        }

        .pdp-signal strong{
          font-size:14px;
          line-height:1.2;
          color:#0f172a;
        }

        .pdp-group{
          margin-top:14px;
        }

        .pdp-label{
          display:block;
          margin-bottom:8px;
          font-size:12px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:#475569;
        }

        .pdp-options{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }

        .pdp-chip{
          min-height:40px;
          padding:0 13px;
          border-radius:999px;
          border:1px solid rgba(15,23,42,.10);
          background:rgba(255,255,255,.76);
          color:#0f172a;
          font-weight:1000;
          cursor:pointer;
        }

        .pdp-chip.is-on{
          background:#0f172a;
          color:#fff;
          border-color:#0f172a;
          box-shadow:0 12px 24px rgba(15,23,42,.14);
        }

        .pdp-stockline{
          margin-top:12px;
          font-size:14px;
          font-weight:900;
        }

        .pdp-stockline.is-ok{ color:#087443; }
        .pdp-stockline.is-out{ color:#9b1c1c; }

        .pdp-qty-row{
          margin-top:16px;
        }

        .pdp-qty-ctrl{
          display:inline-flex;
          align-items:center;
          gap:8px;
        }

        .pdp-pill{
          width:40px;
          height:40px;
          border-radius:999px;
          border:1px solid rgba(15,23,42,.10);
          background:#fff;
          color:#0f172a;
          font-size:22px;
          line-height:1;
          cursor:pointer;
        }

        .pdp-pill:disabled{
          opacity:.45;
          cursor:not-allowed;
        }

        .pdp-qty-input{
          width:74px;
          height:40px;
          border-radius:12px;
          border:1px solid rgba(15,23,42,.10);
          padding:0 10px;
          text-align:center;
          font-weight:900;
          font-size:14px;
          background:#fff;
          color:#0f172a;
        }

        .pdp-qty-hint{
          margin-top:7px;
          color:#64748b;
          font-size:12px;
          font-weight:800;
        }

        .pdp-actions{
          position:relative;
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          margin-top:18px;
        }

        .pdp-btn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-height:46px;
          padding:0 16px;
          border-radius:999px;
          border:1px solid rgba(15,23,42,.10);
          background:rgba(255,255,255,.78);
          color:#0f172a;
          font-weight:1000;
          text-decoration:none;
          cursor:pointer;
        }

        .pdp-primary{
          background:linear-gradient(135deg,#0f172a,#334155);
          color:#fff;
          border-color:#0f172a;
          box-shadow:0 16px 28px rgba(15,23,42,.16);
        }

        .pdp--queue .pdp-primary,
        .pdp--preorder .pdp-primary,
        .pdp--market-lab .pdp-primary{
          background:linear-gradient(135deg,#d97706,#f59e0b);
          border-color:#b45309;
          box-shadow:0 16px 28px rgba(217,119,6,.20);
        }

        .pdp-btn:disabled{
          opacity:.55;
          cursor:not-allowed;
          box-shadow:none;
        }

        .queueBox{
          margin-top:16px;
          padding:16px;
          border-radius:20px;
          border:1px solid rgba(245,158,11,.24);
          background:
            radial-gradient(circle at top right, rgba(251,191,36,.16), transparent 34%),
            linear-gradient(135deg, rgba(255,251,235,.88), rgba(255,255,255,.92));
          box-shadow:0 16px 32px rgba(15,23,42,.06);
        }

        .queueBoxTitle{
          font-size:14px;
          font-weight:1000;
          color:#0f172a;
        }

        .queueBoxLead{
          margin-top:6px;
          font-size:13px;
          line-height:1.55;
          color:#475569;
          font-weight:800;
        }

        .queueForm{
          display:flex;
          gap:10px;
          margin-top:12px;
          flex-wrap:wrap;
        }

        .queueInput{
          flex:1 1 240px;
          min-width:0;
          height:44px;
          border-radius:12px;
          border:1px solid rgba(15,23,42,.12);
          padding:0 12px;
          font-weight:800;
          background:#fff;
          color:#0f172a;
        }

        .queueBtn{
          min-height:44px;
          padding:0 16px;
          border-radius:999px;
          border:0;
          background:linear-gradient(135deg,#0f172a,#334155);
          color:#fff;
          font-weight:1000;
          cursor:pointer;
        }

        .queueBtn:disabled{
          opacity:.6;
          cursor:not-allowed;
        }

        .queueHint{
          margin-top:10px;
          font-size:12px;
          line-height:1.5;
          color:#475569;
          font-weight:800;
        }

        .queueMsg{
          margin-top:10px;
          font-size:13px;
          font-weight:900;
        }

        .queueMsg.is-ok{ color:#166534; }
        .queueMsg.is-err{ color:#b91c1c; }

        .pdp-legal{
          margin-top:16px;
          color:#64748b;
          line-height:1.55;
        }

        .confetti-host{
          position:absolute;
          inset:0 auto auto 0;
          pointer-events:none;
        }

        .spark{
          position:absolute;
          width:7px;
          height:7px;
          border-radius:2px;
          background:linear-gradient(135deg,#f59e0b,#f97316);
          animation:sparkFly .8s ease-out forwards;
        }

        @keyframes sparkFly{
          from{
            transform:translate(0,0) rotate(0deg) scale(1);
            opacity:1;
          }
          to{
            transform:translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(.75);
            opacity:0;
          }
        }

        .pdp-sticky{
          position:fixed;
          left:0;
          right:0;
          bottom:0;
          z-index:60;
          padding:10px 12px calc(10px + env(safe-area-inset-bottom));
          background:rgba(255,255,255,.9);
          backdrop-filter:blur(12px) saturate(140%);
          border-top:1px solid rgba(15,23,42,.08);
          transform:translateY(110%);
          transition:transform .18s ease;
          box-shadow:0 -14px 28px rgba(15,23,42,.08);
        }

        .pdp-sticky.is-on{
          transform:translateY(0);
        }

        .pdp-sticky-inner{
          max-width:1160px;
          margin:0 auto;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
        }

        .pdp-sticky-left{
          min-width:0;
        }

        .pdp-sticky-title{
          font-size:13px;
          font-weight:1000;
          color:#0f172a;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .pdp-sticky-sub{
          display:flex;
          flex-wrap:wrap;
          gap:6px;
          margin-top:4px;
          font-size:12px;
          color:#475569;
          font-weight:800;
        }

        .pdp-sticky-price{
          color:#0f172a;
          font-weight:1000;
        }

        .pdp-sticky-chip{
          display:inline-flex;
          padding:2px 7px;
          border-radius:999px;
          font-size:11px;
          font-weight:1000;
        }

        .pdp-sticky-chip--hot{ background:rgba(254,226,226,.95); color:#991B1B; }
        .pdp-sticky-chip--warn{ background:rgba(255,237,213,.95); color:#9A3412; }
        .pdp-sticky-chip--out{ background:rgba(229,231,235,.95); color:#374151; }
        .pdp-sticky-chip--limited{ background:rgba(254,240,138,.98); color:#854d0e; }

        .pdp-sticky-btn{
          min-height:42px;
          padding:0 14px;
          border-radius:999px;
          border:1px solid #0f172a;
          background:#0f172a;
          color:#fff;
          font-weight:1000;
          cursor:pointer;
          flex:0 0 auto;
        }

        .pdp-sticky-btn:disabled{
          opacity:.6;
          cursor:not-allowed;
        }

        .pdp--queue .pdp-sticky-btn,
        .pdp--preorder .pdp-sticky-btn,
        .pdp--market-lab .pdp-sticky-btn{
          border-color:#b45309;
          background:linear-gradient(135deg,#d97706,#f59e0b);
        }

        @media (max-width:980px){
          .pdp-grid{
            grid-template-columns:1fr;
          }

          .pdp-signal-grid{
            grid-template-columns:1fr;
          }
        }

        @media (max-width:640px){
          .pdp.container{
            padding:14px 12px 110px;
          }

          .pdp-card{
            border-radius:22px;
          }

          .pdp-gallery{
            padding:12px;
          }

          .pdp-info{
            padding:18px;
          }

          .pdp-title{
            font-size:34px;
          }

          .pdp-actions{
            flex-direction:column;
          }

          .pdp-btn{
            width:100%;
          }

          .queueForm{
            flex-direction:column;
          }

          .queueBtn{
            width:100%;
          }

          .pdp-sticky-inner{
            align-items:flex-start;
            flex-direction:column;
          }

          .pdp-sticky-btn{
            width:100%;
          }
        }

        @media (prefers-reduced-motion:reduce){
          .pdp-live-dot,
          .pdp-sticky,
          .spark{
            animation:none;
            transition:none;
          }
        }
      `}</style>
    </div>
  );
}