// D:\WebProjects\Calestra\apps\store-classic\src\components\ProductCardPro.jsx

import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCurrency } from "../context/CurrencyContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useSound } from "../context/SoundContext.jsx";
import { convertBasePrice, applyPsychological, formatMoney } from "../utils/money.js";
import { TT } from "../i18n/tt.js";

import "../styles/product-card-pro.css";

function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function getLang(i18n) {
  const raw = String(i18n?.resolvedLanguage || i18n?.language || "sv").toLowerCase();
  if (raw.startsWith("sv")) return "sv";
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("tr")) return "tr";
  return "sv";
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
    s === "kop" ||
    s === "köp" ||
    s === "in stock" ||
    s === "instock" ||
    s === "available" ||
    s === "ready" ||
    s === "ready for fulfillment" ||
    s === "ready fulfillment" ||
    s === "ready-for-fulfillment" ||
    s === "ready_for_fulfillment"
  ) {
    return "buy";
  }

  if (
    s === "notify" ||
    s === "notify me" ||
    s === "notify-me" ||
    s === "notify_me" ||
    s === "notify only" ||
    s === "notify-only" ||
    s === "notify_only" ||
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
    s === "collector pre order" ||
    s === "collector preorder" ||
    s === "förköp" ||
    s === "forkop" ||
    s === "förbeställ" ||
    s === "forbestall" ||
    s === "on siparis" ||
    s === "ön sipariş"
  ) {
    return "preorder";
  }

  return s;
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
    "coming soon",
    "coming-soon",
    "coming_soon",
    "launch only",
    "launch-only",
    "launch_only",
    "notify",
    "notify me",
    "notify-me",
    "notify_me",
    "back in stock",
    "back-in-stock",
    "back_in_stock",
    "watch only",
    "watch-only",
    "watch_only",
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
  const n = numberOrNull(variant?.qty ?? variant?.quantity ?? variant?.stock ?? variant?.inventory);
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
  const direct = numberOrNull(product?.stock ?? product?.inventory ?? product?.qty);
  if (direct != null) return Math.max(0, direct);

  const meta = numberOrNull(product?.meta?.stock ?? product?.meta?.inventory ?? product?.meta?.qty);
  if (meta != null) return Math.max(0, meta);

  return null;
}

function getEffectiveStock(product) {
  const variantTotal = getVariantStockTotal(product);
  const declared = getDeclaredStock(product);

  if (variantTotal != null) return variantTotal;
  if (declared != null) return declared;

  return null;
}

function hasAnyStock(product) {
  const stock = getEffectiveStock(product);
  if (stock == null) return true;
  return stock > 0;
}

function pickDefaultVariant(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length) return { size: null, color: null, sku: null, qty: null };

  const firstAvailable =
    variants.find((variant) => {
      const qty = getVariantQty(variant);
      return qty == null || qty > 0;
    }) ||
    variants[0] ||
    {};

  return {
    size: firstAvailable.size ?? null,
    color: firstAvailable.color ?? null,
    sku: firstAvailable.sku ?? null,
    qty:
      typeof firstAvailable.qty === "number"
        ? firstAvailable.qty
        : getVariantQty(firstAvailable),
  };
}

function trProduct(product, i18n, t, field, fallback = "") {
  const slug = cleanString(product?.slug || product?.id || "", 240);
  const lang = getLang(i18n);

  const fromProductI18n =
    product?.i18n?.[lang]?.[field] ||
    product?.i18n?.sv?.[field] ||
    "";

  if (fromProductI18n && String(fromProductI18n).trim()) return fromProductI18n;

  const candidates = [
    product?.[`${field}_${lang}`],
    product?.[`${field}${lang.toUpperCase()}`],
    product?.[`${field}${lang}`],
    product?.[lang]?.[field],
  ];

  for (const value of candidates) {
    if (value != null && String(value).trim()) return String(value);
  }

  if (!slug || !field || typeof t !== "function") return fallback;

  const key = `products.${slug}.${field}`;

  try {
    const value = t(key, { defaultValue: "" });
    if (typeof value === "string" && value.trim() && value !== key) return value;
  } catch {
    // fallback below
  }

  return fallback;
}

function getProductView(product, i18n, t) {
  if (!product) return null;

  return {
    ...product,
    title: trProduct(product, i18n, t, "title", product.title || ""),
    description: trProduct(product, i18n, t, "description", product.description || ""),
    subtitle: trProduct(product, i18n, t, "subtitle", product.subtitle || ""),
    badge: trProduct(product, i18n, t, "badge", product.badge || ""),
    status: trProduct(product, i18n, t, "status", product.status || ""),
    availabilityLabel: trProduct(
      product,
      i18n,
      t,
      "availabilityLabel",
      product.availabilityLabel || ""
    ),
    availabilityText: trProduct(
      product,
      i18n,
      t,
      "availabilityText",
      product.availabilityText || ""
    ),
    preorderBadge: trProduct(product, i18n, t, "preorderBadge", product.preorderBadge || ""),
    preorderLabel: trProduct(product, i18n, t, "preorderLabel", product.preorderLabel || ""),
    preorderText: trProduct(product, i18n, t, "preorderText", product.preorderText || ""),
    preorderNote: trProduct(product, i18n, t, "preorderNote", product.preorderNote || ""),
    preorderEta: trProduct(product, i18n, t, "preorderEta", product.preorderEta || ""),
    notifyLabel: trProduct(product, i18n, t, "notifyLabel", product.notifyLabel || ""),
    notifyNote: trProduct(product, i18n, t, "notifyNote", product.notifyNote || ""),
    backInStockLabel: trProduct(
      product,
      i18n,
      t,
      "backInStockLabel",
      product.backInStockLabel || ""
    ),
    backInStockNote: trProduct(
      product,
      i18n,
      t,
      "backInStockNote",
      product.backInStockNote || ""
    ),
  };
}

function getRawMode(product) {
  const candidates = [
    product?.ctaMode,
    product?.rawCtaMode,
    product?.cta,
    product?.mode,
    product?.availabilityType,
    product?.fulfillmentType,
    product?.status,
    product?.meta?.ctaMode,
    product?.meta?.rawCtaMode,
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

function getProductTextBundle(product) {
  const tags = arrayFromMaybe(product?.tags).map(normalizeSearchText).filter(Boolean);

  const categories = [
    ...arrayFromMaybe(product?.category),
    ...arrayFromMaybe(product?.categories),
    ...arrayFromMaybe(product?.collection),
    ...arrayFromMaybe(product?.collections),
    ...arrayFromMaybe(product?.section),
    ...arrayFromMaybe(product?.department),
    ...arrayFromMaybe(product?.meta?.category),
    ...arrayFromMaybe(product?.meta?.categories),
    ...arrayFromMaybe(product?.meta?.collection),
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
    ...categories,
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
    ...arrayFromMaybe(product?.meta?.collection),
  ]
    .map(normalizeCategory)
    .filter(Boolean);

  return values.includes(key);
}

function isLaunchBuyProtected(product) {
  const rawMode = getRawMode(product);
  const inStock = hasAnyStock(product);
  const price = Number(product?.price ?? product?.priceSEK ?? 0);
  const hasPrice = Number.isFinite(price) && price > 0;

  return (
    inStock &&
    hasPrice &&
    (rawMode === "buy" ||
      product?.printfulEligible === true ||
      product?.fulfillmentType === "ready_for_fulfillment" ||
      product?.fulfillmentType === "ready-for-fulfillment" ||
      normalizeCtaMode(product?.fulfillmentType) === "buy" ||
      normalizeCtaMode(product?.availabilityType) === "buy")
  );
}

function buildPreorderPayload(product, labels = {}) {
  const rawMode = getRawMode(product);

  const explicitPreorder =
    rawMode === "preorder" ||
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
    truthyFlag(product?.meta?.comingSoon) ||
    truthyFlag(product?.meta?.launchOnly) ||
    truthyFlag(product?.flags?.preorder) ||
    truthyFlag(product?.flags?.isPreorder) ||
    truthyFlag(product?.flags?.preorderOnly) ||
    truthyFlag(product?.flags?.comingSoon) ||
    truthyFlag(product?.flags?.launchOnly);

  const preorderLabel = cleanString(
    product?.preorderBadge ||
      product?.preorderLabel ||
      product?.availabilityLabel ||
      product?.badge ||
      labels.preorderDefaultLabel ||
      "FÖRKÖP",
    120
  );

  const preorderNote = cleanString(
    product?.preorderNote ||
      product?.preorderText ||
      product?.availabilityText ||
      labels.preorderDefaultNote ||
      "",
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
    isPreorder: explicitPreorder,
    preorderLabel,
    preorderNote,
    preorderEta,
    preorderLeadDays:
      Number.isFinite(preorderLeadDays) && preorderLeadDays > 0 ? preorderLeadDays : 0,
  };
}

function buildNotifyPayload(product, labels = {}) {
  const rawMode = getRawMode(product);

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
      product?.availabilityText ||
      labels.notifyDefaultNote ||
      "",
    320
  );

  if (isLaunchBuyProtected(product) || rawMode === "buy" || rawMode === "preorder") {
    return {
      isNotifyOnly: false,
      notifyLabel,
      notifyNote,
    };
  }

  const explicitNotify =
    rawMode === "notify" ||
    truthyFlag(product?.notifyMe) ||
    truthyFlag(product?.notify_me) ||
    truthyFlag(product?.notifyOnly) ||
    truthyFlag(product?.backInStockOnly) ||
    truthyFlag(product?.watchOnly) ||
    truthyFlag(product?.meta?.notifyMe) ||
    truthyFlag(product?.meta?.notifyOnly) ||
    truthyFlag(product?.meta?.backInStockOnly) ||
    truthyFlag(product?.flags?.notifyMe) ||
    truthyFlag(product?.flags?.notifyOnly) ||
    truthyFlag(product?.flags?.backInStockOnly);

  const tags = arrayFromMaybe(product?.tags).map((x) => normalizeSearchText(x));
  const tagNotify =
    tags.includes("notify") ||
    tags.includes("notify me") ||
    tags.includes("back in stock") ||
    tags.includes("watch only");

  return { isNotifyOnly: explicitNotify || tagNotify, notifyLabel, notifyNote };
}

function detectCtaMode(product) {
  const rawMode = getRawMode(product);
  const inStock = hasAnyStock(product);
  const price = Number(product?.price ?? product?.priceSEK ?? 0);
  const hasPrice = Number.isFinite(price) && price > 0;

  if (isLaunchBuyProtected(product)) return "buy";

  if (rawMode === "buy") return inStock && hasPrice ? "buy" : "notify";
  if (rawMode === "preorder") return inStock && hasPrice ? "preorder" : "notify";
  if (rawMode === "notify") return "notify";

  if (buildNotifyPayload(product).isNotifyOnly) return "notify";
  if (buildPreorderPayload(product).isPreorder) return inStock && hasPrice ? "preorder" : "notify";

  return inStock && hasPrice ? "buy" : "notify";
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

function isSupplyProduct(product) {
  const text = getProductTextBundle(product);

  return (
    productHasCategory(product, "supply") ||
    text.includes("supply") ||
    text.includes("starter kit") ||
    text.includes("starter pack") ||
    text.includes("nodkit") ||
    text.includes("nödkit") ||
    text.includes("emergency kit")
  );
}

function isTravelProduct(product) {
  const text = getProductTextBundle(product);

  return (
    productHasCategory(product, "travel") ||
    text.includes("travel") ||
    text.includes("resa") ||
    text.includes("seyahat") ||
    text.includes("bagage") ||
    text.includes("luggage") ||
    text.includes("passport") ||
    text.includes("boarding") ||
    text.includes("trip")
  );
}

function getCardImageFit(product, imageUrl = "") {
  if (!isJewelryProduct(product)) return "cover";

  const url = String(imageUrl || "").toLowerCase();
  if (url.includes("-worn") || url.includes("-model")) return "cover";

  return "contain";
}

function buildIntentPrefill(product, heroImg, labels = {}) {
  const notify = buildNotifyPayload(product, labels);
  const preorder = buildPreorderPayload(product, labels);
  const ctaMode = detectCtaMode(product);

  return {
    productId: cleanString(product?.id || "", 160),
    slug: cleanString(product?.slug || "", 240),
    title: cleanString(product?.title || "", 240),
    image: cleanString(heroImg || product?.image || "", 1000),
    ctaMode,
    queueType: ctaMode === "preorder" ? "reservation_queue" : "notify_queue",
    notifyOnly: notify.isNotifyOnly || ctaMode === "notify",
    notifyLabel: notify.notifyLabel,
    notifyNote: notify.notifyNote,
    preorder: preorder.isPreorder || ctaMode === "preorder",
    preorderLabel: preorder.preorderLabel,
    preorderNote: preorder.preorderNote,
    preorderEta: preorder.preorderEta,
    preorderLeadDays: preorder.preorderLeadDays,
    savedAt: new Date().toISOString(),
  };
}

function getHeroImage(product) {
  const images = Array.isArray(product?.images) ? product.images : [];

  return (
    images.find((x) => x.type === "thumb")?.image ||
    images.find((x) => x.type === "hero")?.image ||
    images[0]?.image ||
    product?.image ||
    "/images/no-image.png"
  );
}

export default function ProductCardPro({ product, onBuy }) {
  const { t, i18n } = useTranslation();
  const { currency, rates, locale } = useCurrency();
  const { add } = useCart();
  const { muted } = useSound();

  const productView = useMemo(() => getProductView(product, i18n, t), [product, i18n, t]);
  const defVar = useMemo(() => pickDefaultVariant(productView), [productView]);

  const [toast, setToast] = useState("");
  const toastTimer = useRef(0);
  const dingRef = useRef(null);

  const SOUND_URL = `${import.meta.env.BASE_URL ?? "/"}sound/shine-1-268902.mp3`;

  React.useEffect(() => {
    const audio = new Audio(SOUND_URL);
    audio.preload = "auto";
    audio.volume = 0.55;
    dingRef.current = audio;

    return () => {
      try {
        audio.pause();
      } catch {
        // noop
      }
      audio.src = "";
    };
  }, [SOUND_URL]);

  if (!productView) return null;

  const { slug, title, description, price, limited, support, subtitle } = productView;

  const L = {
    limited: TT(i18n, t, "productCard.badges.limited", {
      sv: "Limited",
      en: "Limited",
      tr: "Sınırlı",
    }),
    low: TT(i18n, t, "productCard.badges.lowStock", {
      sv: "Få kvar",
      en: "Low stock",
      tr: "Az kaldı",
    }),
    support: TT(i18n, t, "productCard.badges.support", {
      sv: "Support",
      en: "Support",
      tr: "Destek",
    }),
    out: TT(i18n, t, "productCard.badges.outOfStock", {
      sv: "Slut",
      en: "Sold out",
      tr: "Tükendi",
    }),
    jewelry: TT(i18n, t, "productCard.badges.jewelry", {
      sv: "Smycke",
      en: "Jewelry",
      tr: "Takı",
    }),
    marketLab: TT(i18n, t, "productCard.badges.marketLab", {
      sv: "Market Lab",
      en: "Market Lab",
      tr: "Market Lab",
    }),
    supply: TT(i18n, t, "productCard.badges.supply", {
      sv: "Supply",
      en: "Supply",
      tr: "Tedarik",
    }),
    travel: TT(i18n, t, "productCard.badges.travel", {
      sv: "Resa",
      en: "Travel",
      tr: "Seyahat",
    }),
    preorder: TT(i18n, t, "productCard.badges.preorder", {
      sv: "Förköp",
      en: "Pre-order",
      tr: "Ön sipariş",
    }),
    preorderDefaultLabel: TT(i18n, t, "productCard.preorder.defaultLabel", {
      sv: "FÖRKÖP",
      en: "PRE-ORDER",
      tr: "ÖN SİPARİŞ",
    }),
    preorderDefaultNote: TT(i18n, t, "productCard.preorder.defaultNote", {
      sv: "Du köper platsen i nästa produktionsvåg. Ordern går via kassan, men betalning är fortfarande i testläge tills systemet kopplas live.",
      en: "You secure your place in the next production wave. The order goes through checkout, but payment is still in test mode until the system goes live.",
      tr: "Sonraki üretim dalgasındaki yerini ayırırsın. Sipariş kasadan geçer, fakat sistem canlıya alınana kadar ödeme test modundadır.",
    }),
    notify: TT(i18n, t, "productCard.badges.notify", {
      sv: "Meddela mig",
      en: "Notify me",
      tr: "Bana haber ver",
    }),
    notifyDefaultLabel: TT(i18n, t, "productCard.notify.defaultLabel", {
      sv: "Meddela mig",
      en: "Notify me",
      tr: "Bana haber ver",
    }),
    notifyDefaultNote: TT(i18n, t, "productCard.notify.defaultNote", {
      sv: "Första live-vågen är slut. Lämna din e-post så meddelar vi dig när nästa våg öppnar.",
      en: "The first live wave is sold out. Leave your email and we will notify you when the next wave opens.",
      tr: "İlk canlı dalga tükendi. E-postanı bırak, sonraki dalga açıldığında haber verelim.",
    }),
    vat: TT(i18n, t, "product.vatIncluded", {
      sv: "inkl. moms där det är tillämpligt",
      en: "VAT included where applicable",
      tr: "uygun yerlerde KDV dahil",
    }),
    marketLabNote: TT(i18n, t, "productCard.marketLab.note", {
      sv: "Framtida idé – valideras innan kapital binds.",
      en: "Future idea — validated before capital is tied up.",
      tr: "Gelecek fikri — sermaye bağlanmadan önce doğrulanır.",
    }),
    view: TT(i18n, t, "productCard.buttons.view", {
      sv: "Visa",
      en: "View",
      tr: "Göster",
    }),
    buy: TT(i18n, t, "productCard.buttons.buy", {
      sv: "Köp",
      en: "Buy",
      tr: "Satın al",
    }),
    preorderCta: TT(i18n, t, "productCard.buttons.preorder", {
      sv: "Förköp",
      en: "Pre-order",
      tr: "Ön sipariş",
    }),
    notifyCta: TT(i18n, t, "productCard.buttons.notify", {
      sv: "Meddela mig",
      en: "Notify me",
      tr: "Bana haber ver",
    }),
    added: TT(i18n, t, "productCard.toast.added", {
      sv: "Tillagd",
      en: "Added",
      tr: "Eklendi",
    }),
    selected: TT(i18n, t, "productCard.selected", {
      sv: "Utvald release",
      en: "Selected release",
      tr: "Seçili release",
    }),
  };

  const href = `/product/${slug}`;
  const effectiveStock = getEffectiveStock(productView);
  const hasStockNumber = Number.isFinite(effectiveStock);
  const ctaMode = detectCtaMode(productView);

  const isPreorder = ctaMode === "preorder";
  const isNotifyOnly = ctaMode === "notify";
  const isBuy = ctaMode === "buy";

  const heroImg = getHeroImage(productView);

  const jewelryMode = isJewelryProduct(productView);
  const marketLabMode = isMarketLabProduct(productView);
  const supplyMode = isSupplyProduct(productView);
  const travelMode = isTravelProduct(productView);
  const imageFit = getCardImageFit(productView, heroImg);

  const isLowStock = isBuy && hasStockNumber && effectiveStock > 0 && effectiveStock <= 5;

  const out =
    !isNotifyOnly &&
    !isPreorder &&
    ((hasStockNumber && effectiveStock <= 0) || Number(price || 0) <= 0);

  const base = convertBasePrice(Number(price || 0), currency, rates);
  const psych = applyPsychological(base, currency);
  const displayPrice =
    Number(price || 0) > 0
      ? formatMoney(psych, currency, locale)
      : TT(i18n, t, "productCard.noPrice", {
          sv: "Ej prissatt",
          en: "Not priced",
          tr: "Fiyatlandırılmamış",
        });

  const preorderInfo = buildPreorderPayload(productView, L);
  const notifyInfo = buildNotifyPayload(productView, L);

  const mainBadge = out
    ? L.out
    : isNotifyOnly
      ? notifyInfo.notifyLabel || L.notify
      : isPreorder
        ? preorderInfo.preorderLabel || L.preorder
        : isLowStock
          ? L.low
          : marketLabMode
            ? L.marketLab
            : travelMode
              ? L.travel
              : supplyMode
                ? L.supply
                : limited
                  ? L.limited
                  : jewelryMode
                    ? L.jewelry
                    : support
                      ? L.support
                      : L.selected;

  const showSecondaryLimited =
    !!limited && !isLowStock && !out && !isPreorder && !isNotifyOnly && mainBadge !== L.limited;

  const showSecondaryLow =
    isLowStock && !out && !isPreorder && !isNotifyOnly && mainBadge !== L.low;

  const showSecondaryMarket =
    marketLabMode && !out && !isPreorder && !isNotifyOnly && mainBadge !== L.marketLab;

  const primaryLabel = out
    ? L.view
    : isNotifyOnly
      ? L.notifyCta
      : isPreorder
        ? L.preorderCta
        : L.buy;

  const priceSub = isNotifyOnly
    ? notifyInfo.notifyNote || L.notifyDefaultNote
    : isPreorder
      ? preorderInfo.preorderNote || L.preorderDefaultNote
      : marketLabMode
        ? L.marketLabNote
        : L.vat;

  const ctaHref = isNotifyOnly
    ? `${href}?intent=notify`
    : isPreorder
      ? `${href}?intent=preorder`
      : href;

  function showToast(message) {
    try {
      window.clearTimeout(toastTimer.current);
    } catch {
      // noop
    }

    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 900);
  }

  async function beep() {
    if (muted) return;

    const audio = dingRef.current;
    if (!audio) return;

    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // noop
    }
  }

  function handleIntentPrefill() {
    try {
      if (typeof window !== "undefined") {
        const payload = buildIntentPrefill(productView, heroImg, L);

        window.localStorage.setItem("cw.notify.prefill", JSON.stringify(payload));

        if (payload.ctaMode === "preorder") {
          window.localStorage.setItem("cw.preorder.prefill", JSON.stringify(payload));
        }
      }
    } catch {
      // noop
    }
  }

  function handleQuickBuy(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (isNotifyOnly || isPreorder) {
      handleIntentPrefill();

      if (typeof onBuy === "function") {
        onBuy(productView);
        return;
      }

      if (typeof window !== "undefined") {
        window.location.assign(ctaHref);
      }

      return;
    }

    if (typeof onBuy === "function") {
      onBuy(productView);
      return;
    }

    if (out) return;

    const baseSEK = Number(productView.price || 0);
    if (!Number.isFinite(baseSEK) || baseSEK <= 0) return;

    const size = defVar?.size ?? null;
    const color = defVar?.color ?? null;
    const id = defVar?.sku
      ? defVar.sku
      : productView.slug + (size ? `:${size}` : "") + (color ? `:${color}` : "");

    const variantTitle = [size, color].filter(Boolean).join(", ");
    const meta = {};

    if (size) meta.size = size;
    if (color) meta.color = color;

    meta.lineMode = "buy";

    add({
      id,
      lineKey: id,
      variantKey: id,
      title: productView.title + (variantTitle ? ` (${variantTitle})` : ""),
      name: productView.title + (variantTitle ? ` (${variantTitle})` : ""),
      image: heroImg,
      price: baseSEK,
      priceSEK: baseSEK,
      qty: 1,
      variantTitle,
      variant: variantTitle,
      isDigital: !!productView.isDigital,
      type: productView.type,
      requiresShipping: productView.requiresShipping,
      shipping: productView.shipping || null,
      meta,
      ctaMode: "buy",
      lineMode: "buy",
      orderType: "standard",
      fulfillmentType: "ready_for_fulfillment",
      fulfillmentStatus: "accepted",
      printfulEligible: true,
      preorder: false,
      isPreorder: false,
      preorderLabel: "",
      preorderNote: "",
      product: {
        ...productView,
        ctaMode: "buy",
        preorder: false,
        isPreorder: false,
        notifyOnly: false,
        notifyMe: false,
        preorderLabel: "",
        preorderNote: "",
      },
    });

    void beep();
    showToast(L.added);
  }

  return (
    <article
      className={[
        "product-card-pro",
        out ? "is-out" : "",
        support ? "is-support" : "",
        limited ? "is-limited" : "",
        isPreorder ? "is-preorder" : "",
        isNotifyOnly ? "is-notify" : "",
        jewelryMode ? "is-jewelry" : "",
        marketLabMode ? "is-market-lab" : "",
        supplyMode ? "is-supply" : "",
        travelMode ? "is-travel" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-celeste-anchor={slug || productView?.id || title || "card"}
      data-celeste-title={title || ""}
      data-celeste-preorder={isPreorder ? "1" : "0"}
      data-celeste-notify={isNotifyOnly ? "1" : "0"}
      data-celeste-out={out ? "1" : "0"}
      data-celeste-stock={hasStockNumber ? String(effectiveStock) : ""}
      data-calestra-category={
        marketLabMode
          ? "market-lab"
          : travelMode
            ? "travel"
            : supplyMode
              ? "supply"
              : ""
      }
    >
      <Link to={href} className="pcp-media-link" aria-label={title} title={title}>
        <div className={`pcp-media ${jewelryMode ? "pcp-media--jewelry" : ""}`}>
          <img
            src={heroImg}
            alt={title}
            className={`pcp-img pcp-img--${imageFit}`}
            loading="lazy"
          />

          <div className="pcp-badges" aria-hidden="true">
            <span
              className={`pcp-badge ${
                isPreorder
                  ? "pcp-badge--preorder"
                  : isNotifyOnly
                    ? "pcp-badge--notify"
                    : out
                      ? "pcp-badge--out"
                      : marketLabMode
                        ? "pcp-badge--market"
                        : "pcp-badge--main"
              }`}
            >
              {mainBadge}
            </span>

            {showSecondaryMarket ? (
              <span className="pcp-badge pcp-badge--market">{L.marketLab}</span>
            ) : null}

            {showSecondaryLimited ? (
              <span className="pcp-badge pcp-badge--limited">{L.limited}</span>
            ) : null}

            {showSecondaryLow ? (
              <span className="pcp-badge pcp-badge--low">{L.low}</span>
            ) : null}
          </div>

          <div className="pcp-media-shade" aria-hidden="true" />
        </div>
      </Link>

      <div className="pcp-body">
        <div className="pcp-eyebrow">{mainBadge}</div>

        <h3 className="pcp-title">
          <Link to={href}>{title}</Link>
        </h3>

        {subtitle ? (
          <div className="pcp-subtitle">{subtitle}</div>
        ) : description ? (
          <p className="pcp-desc">{description}</p>
        ) : null}

        <div className="pcp-price-row">
          <div className="pcp-price-block">
            <div className="pcp-price" title={displayPrice}>
              {displayPrice}
            </div>
            <div className="pcp-price-sub">{priceSub}</div>
          </div>
        </div>

        <div className="pcp-actions">
          <Link
            to={href}
            className="pcp-btn pcp-btn--ghost"
            onClick={isNotifyOnly || isPreorder ? handleIntentPrefill : undefined}
          >
            {L.view}
          </Link>

          {isNotifyOnly ? (
            <Link
              to={ctaHref}
              className="pcp-btn pcp-btn--notify"
              onClick={handleIntentPrefill}
              aria-label={primaryLabel}
              title={primaryLabel}
            >
              {primaryLabel}
            </Link>
          ) : isPreorder ? (
            <Link
              to={ctaHref}
              className="pcp-btn pcp-btn--preorder"
              onClick={handleIntentPrefill}
              aria-label={primaryLabel}
              title={primaryLabel}
            >
              {primaryLabel}
            </Link>
          ) : (
            <button
              type="button"
              className="pcp-btn pcp-btn--primary"
              onClick={handleQuickBuy}
              disabled={out}
              aria-label={primaryLabel}
              title={primaryLabel}
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>

      {toast ? (
        <div className="pcp-toast" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </article>
  );
}