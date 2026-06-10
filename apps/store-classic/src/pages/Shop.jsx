// D:\WebProjects\Calestra\apps\store-classic\src\pages\Shop.jsx

import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCurrency } from "../context/CurrencyContext.jsx";
import { listProducts } from "../api/products";
import StoreProgress from "../components/StoreProgress.jsx";
import { FilterProvider, useFilters } from "../context/FilterContext.jsx";
import FilterBar from "../components/FilterBar.jsx";
import { MOODS, MOOD_META } from "../components/FeelingBar.jsx";
import { applyFilters } from "../utils/filters.js";
import ProductCardPro from "../components/ProductCardPro.jsx";
import { useCart } from "../context/CartContext.jsx";
import { TT } from "../i18n/tt.js";

const SHOP_HERO_IMAGE =
  "/images/shop/ChatGPT%20Image%2026%20apr.%202026%2013_19_04.png";

const FIRST_DROP_TOTAL_UNITS = 10;

const FIRST_DROP_SLUGS = new Set([
  "black-star-tee",
  "black-star-hoodie",
  "black-star-tote",
  "hidden-signal-mug",
  "calestra-harmonic-star-necklace",
  "calestra-harmonic-star-collector-print",
]);

const CATEGORY_ORDER = [
  "first-drop",
  "market-lab",
  "apparel",
  "accessories",
  "home",
  "jewelry",
  "prints",
  "sets",
  "travel",
  "supply",
  "support",
  "collectors",
  "surprise-boxes",
  "digital",
  "other",
];

const CATEGORY_LABELS = {
  "first-drop": { sv: "First Drop", en: "First Drop", tr: "First Drop" },
  "market-lab": { sv: "Market Lab", en: "Market Lab", tr: "Market Lab" },
  apparel: { sv: "Kläder", en: "Apparel", tr: "Giyim" },
  accessories: { sv: "Accessoarer", en: "Accessories", tr: "Aksesuarlar" },
  home: { sv: "Hem", en: "Home", tr: "Ev" },
  jewelry: { sv: "Smycken", en: "Jewelry", tr: "Takılar" },
  prints: { sv: "Prints", en: "Prints", tr: "Baskılar" },
  sets: { sv: "Paket", en: "Sets", tr: "Setler" },
  travel: { sv: "Resa", en: "Travel", tr: "Seyahat" },
  supply: { sv: "Supply", en: "Supply", tr: "Tedarik" },
  support: { sv: "Support", en: "Support", tr: "Destek" },
  collectors: { sv: "Collectors", en: "Collectors", tr: "Koleksiyon" },
  "surprise-boxes": {
    sv: "Surprise Boxes",
    en: "Surprise Boxes",
    tr: "Sürpriz Kutular",
  },
  digital: { sv: "Digitalt", en: "Digital", tr: "Dijital" },
  other: { sv: "Övrigt", en: "Other", tr: "Diğer" },
};

const PRODUCT_MOOD_ALIASES = {
  cozy: ["cozy", "warm", "dreamy", "home", "winter", "mug", "mys", "varm"],
  gift: ["gift", "present", "gåva", "gava", "hediye", "birthday", "jul", "eid"],
  practical: ["practical", "everyday", "utility", "useful", "vardag", "tote", "bag"],
  soft: ["soft", "soft-light", "fluffy", "pink", "gentle", "cute", "mjuk", "fluff", "rosa"],
  dark: ["dark", "dark-star", "black", "svart", "street", "hoodie", "tee"],
  premium: ["premium", "clean", "minimal", "gold", "guld", "jewelry", "necklace", "collector"],
  collector: ["collector", "collectible", "limited", "symbol", "harmonic-star", "print", "necklace"],
  street: ["street", "trend", "style", "stil", "ungdom", "youth", "hoodie", "tee", "black"],
};

function getMoodLabel(mood, i18n, t) {
  const key = normalizeCategory(mood);
  const lang = getLang(i18n);
  const fallback = MOOD_META?.[key]?.[lang] || MOOD_META?.[key]?.sv || mood;

  return TT(
    i18n,
    t,
    `shop.feel.${key}`,
    {
      sv: fallback,
      en: fallback,
      tr: fallback,
    }
  );
}

function getMoodNote(mood, i18n, t) {
  const key = normalizeCategory(mood);
  const lang = getLang(i18n);
  const fallback = MOOD_META?.[key]?.note?.[lang] || MOOD_META?.[key]?.note?.sv || "";

  return TT(
    i18n,
    t,
    `shop.feel.${key}.note`,
    {
      sv: fallback,
      en: fallback,
      tr: fallback,
    }
  );
}

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

function localizedProductField(product, i18n, t, field, fallback = "") {
  if (!product || typeof product !== "object") return fallback;

  const slug = String(product?.slug || "").trim();
  const lang = getLang(i18n);

  const fromProductI18n =
    product?.i18n?.[lang]?.[field] ||
    product?.i18n?.sv?.[field] ||
    "";

  if (fromProductI18n != null && String(fromProductI18n).trim()) {
    return String(fromProductI18n);
  }

  const productKey = slug ? `products.${slug}.${field}` : "";

  try {
    if (productKey && i18n?.exists?.(productKey)) {
      const value = t(productKey, { defaultValue: "" });
      if (value && value !== productKey) return value;
    }
  } catch {
    // fallback below
  }

  const candidates = [
    product?.[`${field}_${lang}`],
    product?.[`${field}${lang.toUpperCase()}`],
    product?.[`${field}${lang}`],
    product?.[lang]?.[field],
    product?.[field],
    fallback,
  ];

  for (const value of candidates) {
    if (value != null && String(value).trim()) return String(value);
  }

  return "";
}

function localizeProduct(product, i18n, t) {
  if (!product || typeof product !== "object") return product;

  return {
    ...product,
    title: localizedProductField(product, i18n, t, "title", product.title || ""),
    subtitle: localizedProductField(product, i18n, t, "subtitle", product.subtitle || ""),
    description: localizedProductField(product, i18n, t, "description", product.description || ""),
    badge: localizedProductField(product, i18n, t, "badge", product.badge || ""),
    status: localizedProductField(product, i18n, t, "status", product.status || ""),
    availabilityLabel: localizedProductField(
      product,
      i18n,
      t,
      "availabilityLabel",
      product.availabilityLabel || ""
    ),
    availabilityText: localizedProductField(
      product,
      i18n,
      t,
      "availabilityText",
      product.availabilityText || ""
    ),
    preorderBadge: localizedProductField(
      product,
      i18n,
      t,
      "preorderBadge",
      product.preorderBadge || ""
    ),
    preorderLabel: localizedProductField(
      product,
      i18n,
      t,
      "preorderLabel",
      product.preorderLabel || ""
    ),
    preorderNote: localizedProductField(
      product,
      i18n,
      t,
      "preorderNote",
      product.preorderNote || ""
    ),
    preorderText: localizedProductField(
      product,
      i18n,
      t,
      "preorderText",
      product.preorderText || ""
    ),
    preorderEta: localizedProductField(
      product,
      i18n,
      t,
      "preorderEta",
      product.preorderEta || ""
    ),
    notifyLabel: localizedProductField(
      product,
      i18n,
      t,
      "notifyLabel",
      product.notifyLabel || ""
    ),
    notifyNote: localizedProductField(
      product,
      i18n,
      t,
      "notifyNote",
      product.notifyNote || ""
    ),
    backInStockLabel: localizedProductField(
      product,
      i18n,
      t,
      "backInStockLabel",
      product.backInStockLabel || ""
    ),
    backInStockNote: localizedProductField(
      product,
      i18n,
      t,
      "backInStockNote",
      product.backInStockNote || ""
    ),
  };
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

  if (s === "buy" || s === "shop" || s === "purchase" || s === "kop" || s === "köp") {
    return "buy";
  }

  if (
    s === "preorder" ||
    s === "pre order" ||
    s === "pre-order" ||
    s === "pre_order" ||
    s === "reserve" ||
    s === "reservation" ||
    s === "forkop" ||
    s === "förköp" ||
    s === "forbestall" ||
    s === "förbeställ"
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

function arrayFromMaybe(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function truthy(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;

  const s = normalizeSearchText(value);
  return ["1", "yes", "true", "on", "active", "enabled"].includes(s);
}

function getVariantStockTotal(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length) return null;

  let sawNumber = false;
  let total = 0;

  for (const variant of variants) {
    const qty = numberOrNull(variant?.qty ?? variant?.quantity ?? variant?.stock);
    if (qty == null) continue;
    sawNumber = true;
    total += Math.max(0, qty);
  }

  return sawNumber ? total : null;
}

function getEffectiveStock(product) {
  const variantTotal = getVariantStockTotal(product);
  if (variantTotal != null) return variantTotal;

  const declared = numberOrNull(product?.stock ?? product?.inventory ?? product?.qty);
  if (declared != null) return Math.max(0, declared);

  return null;
}

function hasAnyStock(product) {
  const stock = getEffectiveStock(product);
  if (stock == null) return true;
  return stock > 0;
}

function detectProductCtaMode(product) {
  if (!product || typeof product !== "object") return "buy";

  const directMode = normalizeCtaMode(product?.ctaMode || product?.cta);
  const fulfillment = normalizeCtaMode(
    product?.fulfillmentType ||
      product?.availabilityType ||
      product?.availability ||
      product?.mode ||
      product?.status ||
      ""
  );
  const metaMode = normalizeCtaMode(
    product?.meta?.ctaMode ||
      product?.meta?.fulfillmentType ||
      product?.meta?.availabilityType ||
      product?.meta?.mode ||
      ""
  );

  const inStock = hasAnyStock(product);

  if (directMode === "buy") return inStock ? "buy" : "notify";
  if (directMode === "preorder") return inStock ? "preorder" : "notify";
  if (directMode === "notify") return "notify";

  if (metaMode === "buy") return inStock ? "buy" : "notify";
  if (metaMode === "preorder") return inStock ? "preorder" : "notify";
  if (metaMode === "notify") return "notify";

  if (fulfillment === "buy" || fulfillment === "ready for fulfillment") {
    return inStock ? "buy" : "notify";
  }

  if (fulfillment === "preorder") return inStock ? "preorder" : "notify";
  if (fulfillment === "notify") return "notify";

  if (
    product?.preorder === true ||
    product?.isPreorder === true ||
    product?.preorderOnly === true ||
    product?.flags?.preorder === true ||
    product?.flags?.isPreorder === true ||
    product?.meta?.preorder === true ||
    product?.meta?.isPreorder === true ||
    truthy(product?.preorder)
  ) {
    return inStock ? "preorder" : "notify";
  }

  if (
    product?.notifyOnly === true ||
    product?.notifyMe === true ||
    product?.backInStockOnly === true ||
    product?.flags?.notifyOnly === true ||
    product?.flags?.notifyMe === true ||
    product?.flags?.backInStockOnly === true ||
    product?.meta?.notifyOnly === true ||
    product?.meta?.notifyMe === true
  ) {
    return "notify";
  }

  return inStock ? "buy" : "notify";
}

function isPreorderProduct(product) {
  return detectProductCtaMode(product) === "preorder";
}

function isNotifyOnlyProduct(product) {
  return detectProductCtaMode(product) === "notify";
}

function isFirstDropProduct(product) {
  return FIRST_DROP_SLUGS.has(String(product?.slug || "").trim());
}

function collectRawCategoryValues(product) {
  return [
    ...arrayFromMaybe(product?.categories),
    ...arrayFromMaybe(product?.category),
    ...arrayFromMaybe(product?.collection),
    ...arrayFromMaybe(product?.collections),
    ...arrayFromMaybe(product?.section),
    ...arrayFromMaybe(product?.department),
    ...arrayFromMaybe(product?.meta?.categories),
    ...arrayFromMaybe(product?.meta?.category),
    ...arrayFromMaybe(product?.meta?.collection),
  ];
}

function getDerivedCategories(product) {
  if (!product || typeof product !== "object") return ["other"];

  const set = new Set();

  const slug = normalizeSearchText(product.slug);
  const title = normalizeSearchText(product.title);
  const type = normalizeSearchText(product.type);
  const status = normalizeSearchText(product.status);
  const availabilityType = normalizeSearchText(product.availabilityType);
  const fulfillmentType = normalizeSearchText(product.fulfillmentType);
  const launchPhase = normalizeSearchText(product.launchPhase || product.phase || product?.meta?.launchPhase);
  const tags = arrayFromMaybe(product.tags).map(normalizeSearchText).filter(Boolean);

  const rawCategories = collectRawCategoryValues(product)
    .map(normalizeCategory)
    .filter(Boolean);

  const normalizedTags = tags.map(normalizeCategory).filter(Boolean);

  const combined = [
    slug,
    title,
    type,
    status,
    availabilityType,
    fulfillmentType,
    launchPhase,
    ...tags,
    ...rawCategories,
    ...normalizedTags,
  ]
    .join(" ")
    .replace(/-/g, " ");

  rawCategories.forEach((c) => set.add(c));

  if (isFirstDropProduct(product)) set.add("first-drop");

  if (
    rawCategories.includes("market-lab") ||
    normalizedTags.includes("market-lab") ||
    combined.includes("market lab") ||
    combined.includes("future idea") ||
    combined.includes("future ideas") ||
    combined.includes("concept") ||
    combined.includes("prototype") ||
    combined.includes("lab item")
  ) {
    set.add("market-lab");
  }

  if (
    rawCategories.includes("supply") ||
    normalizedTags.includes("supply") ||
    combined.includes("supply") ||
    combined.includes("starter kit") ||
    combined.includes("starter pack") ||
    combined.includes("nödkit") ||
    combined.includes("nodkit") ||
    combined.includes("emergency kit")
  ) {
    set.add("supply");
  }

  if (
    rawCategories.includes("travel") ||
    normalizedTags.includes("travel") ||
    combined.includes("travel") ||
    combined.includes("resa") ||
    combined.includes("seyahat") ||
    combined.includes("bagage") ||
    combined.includes("luggage") ||
    combined.includes("passport") ||
    combined.includes("boarding") ||
    combined.includes("trip")
  ) {
    set.add("travel");
  }

  if (product.support || tags.includes("support") || normalizedTags.includes("support")) {
    set.add("support");
  }

  if (product.isDigital || type === "digital" || rawCategories.includes("digital")) {
    set.add("digital");
  }

  if (
    slug.includes("tee") ||
    slug.includes("hoodie") ||
    slug.includes("cap") ||
    title.includes("tee") ||
    title.includes("hoodie") ||
    title.includes("cap") ||
    title.includes("t shirt") ||
    title.includes("t-shirt") ||
    type === "apparel" ||
    rawCategories.includes("apparel")
  ) {
    set.add("apparel");
  }

  if (
    slug.includes("tote") ||
    slug.includes("bag") ||
    slug.includes("cap") ||
    title.includes("tote") ||
    title.includes("bag") ||
    title.includes("keps") ||
    type === "accessory" ||
    type === "accessories" ||
    rawCategories.includes("accessories")
  ) {
    set.add("accessories");
  }

  if (
    slug.includes("mug") ||
    title.includes("mug") ||
    title.includes("kopp") ||
    tags.includes("home") ||
    rawCategories.includes("home")
  ) {
    set.add("home");
  }

  if (
    slug.includes("necklace") ||
    title.includes("necklace") ||
    title.includes("halsband") ||
    tags.includes("jewelry") ||
    tags.includes("necklace") ||
    rawCategories.includes("jewelry")
  ) {
    set.add("jewelry");
    set.add("collectors");
  }

  if (
    slug.includes("print") ||
    title.includes("print") ||
    title.includes("poster") ||
    tags.includes("print") ||
    tags.includes("poster") ||
    tags.includes("wall-art") ||
    rawCategories.includes("prints")
  ) {
    set.add("prints");
    set.add("collectors");
  }

  if (
    slug.includes("set") ||
    slug.includes("collection") ||
    title.includes("set") ||
    title.includes("pack") ||
    tags.includes("set") ||
    tags.includes("bundle") ||
    rawCategories.includes("sets")
  ) {
    set.add("sets");
  }

  if (
    slug.includes("surprise") ||
    tags.includes("surprise") ||
    tags.includes("mystery") ||
    rawCategories.includes("surprise-boxes")
  ) {
    set.add("surprise-boxes");
  }

  if (
    product.collectible ||
    tags.includes("collector") ||
    tags.includes("collectible") ||
    rawCategories.includes("collectors")
  ) {
    set.add("collectors");
  }

  if (!set.size) set.add("other");

  return Array.from(set);
}

function collectMoodSourceValues(product) {
  return [
    ...arrayFromMaybe(product?.moods),
    ...arrayFromMaybe(product?.mood),
    ...arrayFromMaybe(product?.feelings),
    ...arrayFromMaybe(product?.feeling),
    ...arrayFromMaybe(product?.tags),
    ...arrayFromMaybe(product?.categories),
    ...arrayFromMaybe(product?.category),
    ...arrayFromMaybe(product?.collection),
    ...arrayFromMaybe(product?.meta?.moods),
    ...arrayFromMaybe(product?.meta?.mood),
    ...arrayFromMaybe(product?.meta?.feelings),
    ...arrayFromMaybe(product?.meta?.feeling),
    ...arrayFromMaybe(product?.meta?.tags),
    product?.slug,
    product?.title,
    product?.subtitle,
    product?.description,
    product?.type,
    product?.status,
  ];
}

function getDerivedMoods(product) {
  if (!product || typeof product !== "object") return [];

  const set = new Set();
  const sourceValues = collectMoodSourceValues(product)
    .map(normalizeCategory)
    .filter(Boolean);

  const sourceText = sourceValues.join(" ");

  for (const mood of MOODS) {
    const key = normalizeCategory(mood);
    const aliases = PRODUCT_MOOD_ALIASES[key] || [key];

    if (sourceValues.includes(key) || aliases.some((alias) => sourceText.includes(normalizeCategory(alias)))) {
      set.add(key);
    }
  }

  const slug = normalizeSearchText(product.slug);
  const categories = getDerivedCategories(product);

  if (isFirstDropProduct(product)) {
    set.add("collector");
  }

  if (slug.includes("tee")) {
    set.add("dark");
    set.add("premium");
    set.add("street");
  }

  if (slug.includes("hoodie")) {
    set.add("dark");
    set.add("street");
    set.add("cozy");
  }

  if (slug.includes("tote")) {
    set.add("soft");
    set.add("cozy");
    set.add("gift");
    set.add("practical");
  }

  if (slug.includes("mug")) {
    set.add("soft");
    set.add("cozy");
    set.add("gift");
  }

  if (slug.includes("necklace")) {
    set.add("premium");
    set.add("collector");
  }

  if (slug.includes("print")) {
    set.add("premium");
    set.add("collector");
  }

  if (categories.includes("travel") || categories.includes("supply")) {
    set.add("practical");
  }

  if (categories.includes("collectors") || categories.includes("jewelry") || categories.includes("prints")) {
    set.add("collector");
    set.add("premium");
  }

  return Array.from(set);
}

function withCatalogMeta(product) {
  const categories = getDerivedCategories(product);
  const moods = getDerivedMoods({ ...product, categories });

  const existingTags = arrayFromMaybe(product?.tags).map(String).filter(Boolean);
  const existingFeelings = arrayFromMaybe(product?.feelings).map(String).filter(Boolean);

  return {
    ...product,
    categories,
    catalogCategories: categories,
    primaryCategory: categories[0] || "other",
    moods,
    mood: moods,
    feelings: Array.from(new Set([...existingFeelings, ...moods])),
    tags: Array.from(new Set([...existingTags, ...moods])),
  };
}

function getCategoryLabel(category, i18n, t) {
  const key = normalizeCategory(category);
  return TT(
    i18n,
    t,
    `shop.catalog.${key}`,
    CATEGORY_LABELS[key] || {
      sv: category,
      en: category,
      tr: category,
    }
  );
}

function sortCategories(categories) {
  return [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    const av = ai === -1 ? 999 : ai;
    const bv = bi === -1 ? 999 : bi;
    if (av !== bv) return av - bv;
    return String(a).localeCompare(String(b), "sv");
  });
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

function getPreorderLabel(product, i18n, t) {
  return cleanString(
    product?.preorderBadge ||
      product?.preorderLabel ||
      TT(i18n, t, "shop.preorder.defaultLabel", {
        sv: "FÖRKÖP",
        en: "PRE-ORDER",
        tr: "ÖN SİPARİŞ",
      }),
    120
  );
}

function getPreorderNote(product, i18n, t) {
  const explicit = cleanString(
    product?.preorderNote || product?.preorderText || product?.availabilityText || "",
    320
  );

  if (explicit) return explicit;

  const leadDays = getPreorderLeadDays(product);
  if (leadDays > 0) {
    return TT(
      i18n,
      t,
      "shop.preorder.defaultLeadDays",
      {
        sv: "Detta är ett förköp. Ordern går via kassan och produktion/leverans sker i en senare våg, cirka {{days}} dagar.",
        en: "This is a pre-order. The order goes through checkout and production/delivery happen in a later wave, around {{days}} days.",
        tr: "Bu bir ön sipariştir. Sipariş ödeme akışından geçer; üretim/teslimat yaklaşık {{days}} gün sonra sonraki dalgada gerçekleşir.",
      },
      { days: leadDays }
    );
  }

  return TT(i18n, t, "shop.preorder.defaultNote", {
    sv: "Detta är ett förköp. Ordern går via kassan, medan produktion och leverans kopplas senare när systemet är redo.",
    en: "This is a pre-order. The order goes through checkout, while production and delivery are connected later when the system is ready.",
    tr: "Bu bir ön sipariştir. Sipariş ödeme akışından geçer; üretim ve teslimat sistem hazır olduğunda bağlanır.",
  });
}

function buildIntentPrefill(product) {
  const ctaMode = detectProductCtaMode(product);

  return {
    productId: cleanString(product?.id || "", 160),
    slug: cleanString(product?.slug || "", 240),
    title: cleanString(product?.title || "", 240),
    image: cleanString(
      product?.images?.find?.((x) => x.type === "thumb")?.image ||
        product?.images?.find?.((x) => x.type === "hero")?.image ||
        product?.image ||
        "",
      1000
    ),
    ctaMode,
    queueType: ctaMode === "preorder" ? "reservation_queue" : "notify_queue",
    savedAt: new Date().toISOString(),
  };
}

function saveIntentPrefill(product) {
  try {
    if (typeof window === "undefined") return;

    const ctaMode = detectProductCtaMode(product);
    const key = ctaMode === "preorder" ? "cw.preorder.prefill" : "cw.notify.prefill";
    const payload = buildIntentPrefill(product);

    window.localStorage.setItem(key, JSON.stringify(payload));
    window.localStorage.setItem("cw.notify.prefill", JSON.stringify(payload));
  } catch {
    // noop
  }
}

export default function Shop() {
  return (
    <FilterProvider>
      <ShopInner />
    </FilterProvider>
  );
}

function ShopInner() {
  const { t, i18n } = useTranslation();
  const { currency } = useCurrency();
  const { add } = useCart();

  const nav = useNavigate();
  const { state: filters, setQuery, setFeel, setFlags, setSort, setPriceMax } = useFilters();
  const [params, setParams] = useSearchParams();

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [items, setItems] = React.useState([]);

  const tx = React.useCallback(
    (key, fallbackByLang, opts) => TT(i18n, t, key, fallbackByLang, opts),
    [i18n, t]
  );

  React.useEffect(() => {
    const q = params.get("q");
    setQuery(q != null ? q : "");

    const feelRaw = params.get("feel") || params.get("feelings");
    const feelList =
      feelRaw != null
        ? String(feelRaw)
            .split(",")
            .map((x) => normalizeCategory(x))
            .filter(Boolean)
        : [];
    setFeel(feelList);

    const sort = params.get("sort");
    setSort(sort != null ? sort : "");

    const max = params.get("max");
    setPriceMax(max != null ? max : "");

    setFlags({
      limited: params.get("limited") === "1",
      support: params.get("support") === "1",
      inStock: params.get("instock") === "1",
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const deferredQ = React.useDeferredValue(filters.q);
  const catParam = normalizeCategory(params.get("cat"));
  const showAll = params.get("all") === "1";
  const preorderOnly = params.get("preorder") === "1";
  const notifyOnly = params.get("notify") === "1";
  const catalogExpanded = showAll || !!catParam || preorderOnly || notifyOnly;

  React.useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    const id = setTimeout(async () => {
      try {
        setErr("");
        setLoading(true);

        const data = await listProducts({
          q: deferredQ,
          page: 1,
          limit: 250,
          signal: ctrl.signal,
          lang: getLang(i18n),
        });

        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e?.name !== "AbortError") {
          setErr(
            e?.message ||
              tx("shop.error.loadFailed", {
                sv: "Kunde inte ladda",
                en: "Load failed",
                tr: "Yüklenemedi",
              })
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }, 120);

    return () => {
      alive = false;
      ctrl.abort();
      clearTimeout(id);
    };
  }, [deferredQ, tx, i18n]);

  const localizedItems = React.useMemo(() => {
    return (items || []).filter(Boolean).map((p) => localizeProduct(p, i18n, t));
  }, [items, i18n, t]);

  const catalogSource = React.useMemo(() => {
    return localizedItems
      .filter(Boolean)
      .map(withCatalogMeta)
      .filter((p) => p.type !== "digital")
      .filter((p) => p.id !== "support-001" && p.slug !== "support-light-pack")
      .filter(
        (p) =>
          String(p?.slug || "").trim() !== "starlight-surprise-box" &&
          String(p?.slug || "").trim() !== "starlight-surprise-box-premium"
      );
  }, [localizedItems]);

  const catalog = React.useMemo(() => {
    let base = catalogSource;

    if (!catalogExpanded) {
      base = base.filter((p) => isFirstDropProduct(p));
    }

    if (catParam) {
      base = base.filter((p) => (p.categories || []).map(normalizeCategory).includes(catParam));
    }

    if (preorderOnly) {
      base = base.filter((p) => isPreorderProduct(p));
    }

    if (notifyOnly) {
      base = base.filter((p) => isNotifyOnlyProduct(p));
    }

    return base;
  }, [catalogSource, catParam, catalogExpanded, preorderOnly, notifyOnly]);

  const allCats = React.useMemo(() => {
    const cats = new Set();

    catalogSource.forEach((p) => {
      (p.categories || []).forEach((c) => {
        const key = normalizeCategory(c);
        if (key && key !== "first-drop") cats.add(key);
      });
    });

    return sortCategories(Array.from(cats));
  }, [catalogSource]);

  const visible = React.useMemo(() => applyFilters(catalog, filters), [catalog, filters]);

  const preorderCount = React.useMemo(
    () => catalog.filter((p) => isPreorderProduct(p)).length,
    [catalog]
  );

  const notifyCount = React.useMemo(
    () => catalog.filter((p) => isNotifyOnlyProduct(p)).length,
    [catalog]
  );

  const resultText = React.useMemo(() => {
    const x = visible.length;
    const y = catalog.length;

    if (loading) return "";
    if (x === 0) {
      return tx("shop.count.zero", {
        sv: "Inga träffar",
        en: "No results",
        tr: "Sonuç yok",
      });
    }

    if (y > 0 && x < y) {
      return tx(
        "shop.count.of",
        {
          sv: "Visar {{x}} av {{y}} produkter",
          en: "Showing {{x}} of {{y}} products",
          tr: "{{y}} üründen {{x}} tanesi gösteriliyor",
        },
        { x, y }
      );
    }

    return x === 1
      ? tx("shop.count.one", {
          sv: "Visar 1 produkt",
          en: "Showing 1 product",
          tr: "1 ürün gösteriliyor",
        })
      : tx(
          "shop.count.many",
          {
            sv: "Visar {{x}} produkter",
            en: "Showing {{x}} products",
            tr: "{{x}} ürün gösteriliyor",
          },
          { x }
        );
  }, [visible.length, catalog.length, loading, tx]);

  function updateParams(mutator) {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      mutator(p);
      return p;
    });
  }

  function clearShopFilters({ keepAll = false } = {}) {
    setQuery("");
    setFeel([]);
    setSort("");
    setPriceMax("");
    setFlags({
      inStock: false,
      limited: false,
      support: false,
    });

    const next = new URLSearchParams();
    if (keepAll) next.set("all", "1");
    setParams(next);
  }

  function scrollToProducts() {
    window.setTimeout(() => {
      document.getElementById("first-drop-products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function setCatalogCategory(category) {
    const key = normalizeCategory(category);
    updateParams((p) => {
      if (key) p.set("cat", key);
      else p.delete("cat");
      p.set("all", "1");
      p.delete("preorder");
      p.delete("notify");
    });
    scrollToProducts();
  }

  function toggleMood(mood) {
    const key = normalizeCategory(mood);
    if (!key) return;

    updateParams((p) => {
      const current = String(p.get("feel") || p.get("feelings") || "")
        .split(",")
        .map((x) => normalizeCategory(x))
        .filter(Boolean);

      const set = new Set(current);
      if (set.has(key)) set.delete(key);
      else set.add(key);

      const next = Array.from(set);
      if (next.length) p.set("feel", next.join(","));
      else p.delete("feel");

      p.delete("feelings");
      p.set("all", "1");
    });

    scrollToProducts();
  }

  function handleBuy(rawProduct) {
    const product = localizeProduct(rawProduct, i18n, t);
    const ctaMode = detectProductCtaMode(product);

    if (ctaMode === "notify") {
      saveIntentPrefill(product);
      nav(`/product/${product.slug}?intent=notify`);
      return;
    }

    if (ctaMode === "preorder") {
      saveIntentPrefill(product);
      nav(`/product/${product.slug}?intent=preorder`);
      return;
    }

    const list = Array.isArray(product?.variants) ? product.variants : [];
    const manySizes = new Set(list.map((v) => (v.size || "").toLowerCase()).filter(Boolean)).size > 1;
    const manyColors = new Set(list.map((v) => (v.color || "").toLowerCase()).filter(Boolean)).size > 1;

    if (manySizes || manyColors) {
      nav(`/product/${product.slug}`);
      return;
    }

    add({
      id: product.slug,
      lineKey: product.slug,
      variantKey: product.slug,
      title: product.title,
      name: product.title,
      qty: 1,
      price: Number(product.price) || 0,
      priceSEK: Number(product.price) || 0,
      image:
        product.images?.find((x) => x.type === "thumb")?.image ||
        product.images?.find((x) => x.type === "hero")?.image ||
        product.image ||
        "/images/no-image.png",
      isDigital: !!product.isDigital,
      type: product.type,
      requiresShipping: product.requiresShipping,
      shipping: product.shipping,
      lineMode: "buy",
      orderType: "standard",
      fulfillmentType: "ready_for_fulfillment",
      fulfillmentStatus: "accepted",
      printfulEligible: true,
      preorder: false,
      isPreorder: false,
      preorderLabel: getPreorderLabel(product, i18n, t),
      preorderNote: getPreorderNote(product, i18n, t),
      preorderLeadDays: getPreorderLeadDays(product),
      launchGate: product.launchGate || null,
      product: {
        ...product,
        ctaMode: "buy",
        preorder: false,
        isPreorder: false,
        notifyOnly: false,
        notifyMe: false,
      },
      meta: {
        lineMode: "buy",
        launchGate: product.launchGate || null,
      },
    });
  }

  const isPreview = React.useMemo(() => {
    try {
      if (params.get("preview") === "1") return true;
      if (params.get("preview") === "0") return false;
      const v = localStorage.getItem("cw.preview");
      if (v === "1") return true;
      if (v === "0") return false;
    } catch {
      // noop
    }
    return true;
  }, [params]);

  const [showTop, setShowTop] = React.useState(false);

  React.useEffect(() => {
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setShowTop((window.scrollY || 0) > 600);
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function goFirstDrop() {
    clearShopFilters({ keepAll: false });
    scrollToProducts();
  }

  function goAllCatalog() {
    clearShopFilters({ keepAll: true });
    scrollToProducts();
  }

  const hasFiltersOn =
    params.get("instock") === "1" ||
    params.get("limited") === "1" ||
    params.get("support") === "1" ||
    params.get("preorder") === "1" ||
    params.get("notify") === "1" ||
    !!params.get("cat") ||
    !!params.get("q") ||
    !!params.get("feel") ||
    !!params.get("feelings") ||
    !!params.get("max") ||
    !!params.get("sort") ||
    !!filters?.q ||
    (Array.isArray(filters?.feel) && filters.feel.length > 0) ||
    !!filters?.priceMax ||
    !!filters?.sort ||
    !!filters?.flags?.inStock ||
    !!filters?.flags?.limited ||
    !!filters?.flags?.support;

  return (
    <div className="shop container" role="main" aria-labelledby="shop-title" id="main">
      <section
        className="shop-brand-hero shop-brand-hero--cinematic"
        aria-label={tx("shop.hero.aria", {
          sv: "Calestra Store",
          en: "Calestra Store",
          tr: "Calestra Store",
        })}
        style={{ "--shopHeroImage": `url("${SHOP_HERO_IMAGE}")` }}
      >
        <div className="shop-brand-star shop-brand-star--main" aria-hidden="true" />
        <div className="shop-brand-star shop-brand-star--soft" aria-hidden="true" />

        <div className="shop-brand-copy">
          <div className="shop-brand-kicker">
            <span className="live-dot" />
            <span>{tx("shop.live", { sv: "DROP MODE", en: "DROP MODE", tr: "DROP MODE" })}</span>
          </div>

          <div className="shop-brand-found">
            {tx("shop.found", {
              sv: "Du hittade den. Nu börjar allt.",
              en: "You found it. Now everything begins.",
              tr: "Onu buldun. Şimdi her şey başlıyor.",
            })}
          </div>

          <h1 id="shop-title">
            {tx("shop.hero.titleLine1", { sv: "Somewhere…", en: "Somewhere…", tr: "Somewhere…" })}
            <br />
            {tx("shop.hero.titleLine2", { sv: "it waits for you.", en: "it waits for you.", tr: "it waits for you." })}
          </h1>

          <p>
            {tx("shop.hero.leadLine1", {
              sv: "You don’t follow the light.",
              en: "You don’t follow the light.",
              tr: "You don’t follow the light.",
            })}
            <br />
            {tx("shop.hero.leadLine2", {
              sv: "You become it.",
              en: "You become it.",
              tr: "You become it.",
            })}
          </p>

          <div className="shop-brand-actions">
            <button type="button" className="brand-btn brand-btn--light" onClick={goFirstDrop}>
              {tx("shop.hero.enterDrop", { sv: "Gå in i droppen", en: "Enter the drop", tr: "Drop’a gir" })}
            </button>

            <button
              type="button"
              className="brand-btn brand-btn--dark"
              onClick={() => {
                clearShopFilters({ keepAll: true });
                updateParams((p) => {
                  p.set("all", "1");
                  p.set("preorder", "1");
                });
                scrollToProducts();
              }}
            >
              {tx("shop.quick.preorder", { sv: "Förköp", en: "Pre-order", tr: "Ön sipariş" })}
            </button>

            <button type="button" className="brand-btn brand-btn--ghost" onClick={goAllCatalog}>
              {tx("shop.hero.fullCatalog", { sv: "Se hela katalogen", en: "See full catalog", tr: "Tüm kataloğu gör" })}
            </button>
          </div>
        </div>
      </section>

      <section
        className="drop-intro"
        aria-label={tx("shop.dropIntro.aria", {
          sv: "The First Drop",
          en: "The First Drop",
          tr: "The First Drop",
        })}
      >
        <div>
          <span>{tx("shop.dropIntro.kicker", { sv: "The First Drop", en: "The First Drop", tr: "The First Drop" })}</span>
          <h2>{tx("shop.dropIntro.title", { sv: "Symboler du kan bära.", en: "Symbols you can wear.", tr: "Taşıyabileceğin semboller." })}</h2>
          <p>
            {tx(
              "shop.dropIntro.body",
              {
                sv: "Första droppen är en kontrollerad testvåg: 6 produkter och totalt {{units}} budgeterade exemplar. Market Lab visar framtida idéer utan att binda kapital. När vågen tar slut öppnas nästa bara om trafiken och signalerna är positiva.",
                en: "The first drop is a controlled test wave: 6 products and {{units}} budgeted units in total. Market Lab shows future ideas without tying up capital. When the wave sells out, the next one opens only if traffic and signals are positive.",
                tr: "İlk drop kontrollü bir test dalgasıdır: 6 ürün ve toplam {{units}} bütçelenmiş adet. Market Lab sermaye bağlamadan gelecek fikirleri gösterir. Dalga tükenirse, sonraki dalga yalnızca trafik ve sinyaller olumluysa açılır.",
              },
              { units: FIRST_DROP_TOTAL_UNITS }
            )}
          </p>
        </div>

        {isPreview && (
          <div
            className="preview-pill"
            title={tx("shop.previewPill.title", {
              sv: "Kontrollerad preview – allt är inte aktiverat ännu.",
              en: "Controlled preview – not everything is active yet.",
              tr: "Kontrollü önizleme – her şey henüz aktif değil.",
            })}
          >
            {tx("shop.previewPill.label", { sv: "PREVIEW", en: "PREVIEW", tr: "ÖNİZLEME" })}
          </div>
        )}
      </section>

      {allCats.length > 0 ? (
        <section className="catalog-strip" aria-label={tx("shop.catalog.aria", { sv: "Katalog", en: "Catalog", tr: "Katalog" })}>
          <div className="catalog-strip__head">
            <span>{tx("shop.catalog.kicker", { sv: "KATALOG", en: "CATALOG", tr: "KATALOG" })}</span>
            <strong>{tx("shop.catalog.title", { sv: "Byggd för att växa", en: "Built to grow", tr: "Büyümek için kuruldu" })}</strong>
          </div>

          <div className="catalog-strip__row">
            <button
              type="button"
              className={`catalog-chip ${!catalogExpanded ? "is-on" : ""}`}
              onClick={goFirstDrop}
            >
              {tx("shop.catalog.firstDrop", { sv: "First Drop", en: "First Drop", tr: "First Drop" })}
            </button>

            <button
              type="button"
              className={`catalog-chip ${showAll && !catParam && !preorderOnly && !notifyOnly ? "is-on" : ""}`}
              onClick={goAllCatalog}
            >
              {tx("shop.catalog.all", { sv: "Alla", en: "All", tr: "Tümü" })}
            </button>

            {allCats.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`catalog-chip ${catParam === cat ? "is-on" : ""}`}
                onClick={() => setCatalogCategory(cat)}
              >
                {getCategoryLabel(cat, i18n, t)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mood-strip" aria-label={tx("shop.mood.aria", { sv: "Välj känsla", en: "Choose mood", tr: "Duygu seç" })}>
        <div className="mood-strip__head">
          <span>{tx("shop.mood.kicker", { sv: "VÄLJ KÄNSLA", en: "CHOOSE MOOD", tr: "DUYGU SEÇ" })}</span>
          <strong>
            {tx("shop.mood.title", {
              sv: "Butiken anpassar sig efter din vibe",
              en: "The store adapts to your vibe",
              tr: "Mağaza senin hissine uyum sağlar",
            })}
          </strong>
        </div>

        <div className="mood-strip__row">
          {MOODS.map((mood) => {
            const active = Array.isArray(filters?.feel) && filters.feel.map(normalizeCategory).includes(mood);
            const label = getMoodLabel(mood, i18n, t);
            const note = getMoodNote(mood, i18n, t);

            return (
              <button
                key={mood}
                type="button"
                className={`mood-chip mood-chip--${mood} ${active ? "is-on" : ""}`}
                onClick={() => toggleMood(mood)}
                aria-pressed={active}
                title={note || label}
              >
                <span>{label}</span>
                {note ? <small>{note}</small> : null}
              </button>
            );
          })}
        </div>
      </section>

      <div className="top-hints" aria-live="polite">
        <span className="mini-hint">
          {tx("shop.currencyNow", { sv: "Visar priser i", en: "Showing prices in", tr: "Fiyatlar şu para biriminde" })} <b>{currency}</b>
        </span>
        <span className="mini-hint">{resultText}</span>
        {!catalogExpanded && (
          <span className="mini-hint">
            {tx(
              "shop.hints.firstDropCount",
              {
                sv: "First Drop: 6 produkter · max {{units}} ex",
                en: "First Drop: 6 products · max {{units}} units",
                tr: "First Drop: 6 ürün · maks. {{units}} adet",
              },
              { units: FIRST_DROP_TOTAL_UNITS }
            )}
          </span>
        )}
        {preorderCount > 0 && (
          <span className="mini-hint mini-hint--preorder">
            {tx("shop.hints.preorderActive", { sv: "Förköp aktivt", en: "Pre-order active", tr: "Ön sipariş aktif" })}
          </span>
        )}
        {notifyCount > 0 && (
          <span className="mini-hint mini-hint--notify">
            {tx("shop.hints.notifyAvailable", { sv: "Meddela mig-läge tillgängligt", en: "Notify mode available", tr: "Bildirim modu mevcut" })}
          </span>
        )}
        {hasFiltersOn && (
          <button
            type="button"
            className="mini-clear"
            onClick={() => clearShopFilters({ keepAll: showAll })}
          >
            {tx("shop.quick.clear", { sv: "Rensa", en: "Clear", tr: "Temizle" })}
          </button>
        )}
      </div>

      {!loading && !err && visible.length > 0 && (
        <div className="shop-actions-row" aria-label={tx("shop.quick.aria", { sv: "Snabbval", en: "Quick choices", tr: "Hızlı seçimler" })}>
          <button type="button" className="shop-pill" onClick={() => updateParams((p) => p.set("instock", "1"))}>
            {tx("shop.quick.inStock", { sv: "Visa i lager", en: "Show in stock", tr: "Stokta olanları göster" })}
          </button>

          <button type="button" className="shop-pill" onClick={() => updateParams((p) => p.set("limited", "1"))}>
            {tx("shop.quick.limited", { sv: "Limited", en: "Limited", tr: "Sınırlı" })}
          </button>

          <button
            type="button"
            className="shop-pill shop-pill--preorder"
            onClick={() => {
              clearShopFilters({ keepAll: true });
              updateParams((p) => {
                p.set("all", "1");
                p.set("preorder", "1");
              });
            }}
          >
            {tx("shop.quick.preorder", { sv: "Förköp", en: "Pre-order", tr: "Ön sipariş" })}
          </button>

          <button
            type="button"
            className="shop-pill shop-pill--notify"
            onClick={() => {
              clearShopFilters({ keepAll: true });
              updateParams((p) => {
                p.set("all", "1");
                p.set("notify", "1");
              });
            }}
          >
            {tx("shop.quick.notify", { sv: "Meddela mig", en: "Notify me", tr: "Bana haber ver" })}
          </button>

          <button
            type="button"
            className="shop-pill"
            onClick={() =>
              updateParams((p) => {
                p.set("all", "1");
                p.set("support", "1");
              })
            }
          >
            {tx("shop.quick.support", { sv: "Support", en: "Support", tr: "Destek" })}
          </button>

          <button
            type="button"
            className="shop-pill shop-pill--ghost"
            onClick={() => clearShopFilters({ keepAll: showAll })}
          >
            {tx("shop.quick.clear", { sv: "Rensa", en: "Clear", tr: "Temizle" })}
          </button>
        </div>
      )}

      {loading && (
        <div className="msg">
          {tx("shop.loading", { sv: "Laddar produkter…", en: "Loading products…", tr: "Ürünler yükleniyor…" })}
        </div>
      )}

      {!loading && err && (
        <div className="msg error">
          {tx("shop.error", { sv: "Kunde inte hämta produkter", en: "Could not load products", tr: "Ürünler alınamadı" })}: {err}
        </div>
      )}

      {!loading && !err && visible.length === 0 && (
        <div className="empty">
          <div className="empty__title">
            {tx("shop.emptyTitle", { sv: "Inga träffar just nu", en: "No results right now", tr: "Şu anda sonuç yok" })}
          </div>
          <div className="empty__body">
            {tx("shop.empty", { sv: "Inga produkter matchar filtret ännu.", en: "No products match the filter yet.", tr: "Henüz filtreyle eşleşen ürün yok." })}
          </div>
          <div className="empty__tip">
            {tx("shop.emptyTip", {
              sv: "Tips: prova att nollställa filter eller byt kategori ✦",
              en: "Tip: try clearing filters or changing category ✦",
              tr: "İpucu: filtreleri temizlemeyi veya kategori değiştirmeyi dene ✦",
            })}
          </div>
          <div className="empty__cta">
            <button className="empty__link" type="button" onClick={goAllCatalog}>
              {tx("shop.emptyCta", { sv: "Visa hela katalogen", en: "Show full catalog", tr: "Tüm kataloğu göster" })} →
            </button>
          </div>
        </div>
      )}

      <div className="shop-grid" id="first-drop-products">
        {(loading ? Array.from({ length: 10 }) : visible).map((p, i) =>
          loading ? (
            <div key={`skel-${i}`} className="skel" aria-hidden="true" />
          ) : (
            <ProductCardPro key={p.id || p.slug || `p-${i}`} product={p} item={p} onBuy={handleBuy} />
          )
        )}
      </div>

      <section className="shop-story" aria-label={tx("shop.story.aria", { sv: "Calestra Store story", en: "Calestra Store story", tr: "Calestra Store hikâyesi" })}>
        <div className="story-head">
          <div>
            <span>{tx("shop.story.kicker", { sv: "STEP BEYOND THE DROP", en: "STEP BEYOND THE DROP", tr: "STEP BEYOND THE DROP" })}</span>
            <h2>{tx("shop.story.title", { sv: "Mer än en vanlig webshop.", en: "More than a regular webshop.", tr: "Sıradan bir web mağazasından daha fazlası." })}</h2>
            <p>
              {tx("shop.story.body", {
                sv: "Produkterna är rena och tydliga för att sälja. Berättelsen ligger runt dem för att bygga varumärket.",
                en: "The products are clean and clear to sell. The story surrounds them to build the brand.",
                tr: "Ürünler satış için sade ve nettir. Hikâye ise markayı inşa etmek için onların etrafında yer alır.",
              })}
            </p>
          </div>

          <button type="button" className="story-btn" onClick={goAllCatalog}>
            {tx("shop.story.more", { sv: "Visa mer", en: "Show more", tr: "Daha fazlasını göster" })}
          </button>
        </div>

        <div className="story-grid">
          <div className="story-card story-card--dark">
            <span>{tx("shop.story.card1.kicker", { sv: "ALLTID CALESTRA", en: "ALWAYS CALESTRA", tr: "HER ZAMAN CALESTRA" })}</span>
            <strong>{tx("shop.story.card1.title", { sv: "Symbolen är alltid närvarande.", en: "The symbol is always present.", tr: "Sembol her zaman orada." })}</strong>
            <p>{tx("shop.story.card1.body", { sv: "Du är aldrig ensam i känslan.", en: "You are never alone in the feeling.", tr: "Bu duyguda asla yalnız değilsin." })}</p>
          </div>

          <div className="story-card">
            <span>{tx("shop.story.card2.kicker", { sv: "HARMONIC QUALITY", en: "HARMONIC QUALITY", tr: "HARMONIC QUALITY" })}</span>
            <strong>{tx("shop.story.card2.title", { sv: "Noggrant utvalda material.", en: "Carefully selected materials.", tr: "Özenle seçilmiş malzemeler." })}</strong>
            <p>
              {tx("shop.story.card2.body", {
                sv: "Byggt för att hålla och kännas bättre än en snabb trend.",
                en: "Built to last and feel better than a fast trend.",
                tr: "Hızlı bir trendden daha iyi hissettirmek ve uzun ömürlü olmak için tasarlandı.",
              })}
            </p>
          </div>

          <div className="story-card">
            <span>{tx("shop.story.card3.kicker", { sv: "MINDFUL PRODUCTION", en: "MINDFUL PRODUCTION", tr: "MINDFUL PRODUCTION" })}</span>
            <strong>{tx("shop.story.card3.title", { sv: "Producerat vid behov.", en: "Produced when needed.", tr: "İhtiyaç oldukça üretilir." })}</strong>
            <p>
              {tx("shop.story.card3.body", {
                sv: "Mindre brus. Mer ansvar. Mer kontroll över första vågen.",
                en: "Less noise. More responsibility. More control over the first wave.",
                tr: "Daha az gürültü. Daha fazla sorumluluk. İlk dalga üzerinde daha fazla kontrol.",
              })}
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="promo-banner collection-banner"
        onClick={() => updateParams((p) => p.set("limited", "1"))}
        aria-label={tx("shop.promo.collectionCta", {
          sv: "Visa den limiterade kollektionen",
          en: "Show the limited collection",
          tr: "Sınırlı koleksiyonu göster",
        })}
      >
        <div className="promo-inner">
          <span className="promo-icon" aria-hidden="true">
            ✦
          </span>
          <span className="promo-text">
            {tx("shop.promo.collection", {
              sv: "Harmonic Star Collection ✦ – symbol, plagg och samlartryck i första droppen",
              en: "Harmonic Star Collection ✦ – symbol, apparel and collector print in the first drop",
              tr: "Harmonic Star Collection ✦ – ilk dropta sembol, giyim ve koleksiyon baskısı",
            })}
          </span>
          <span className="promo-cta" aria-hidden="true">
            {tx("shop.promo.cta", { sv: "Se mer", en: "See more", tr: "Daha fazlası" })} →
          </span>
        </div>
      </button>

      {preorderCount > 0 ? (
        <div className="preorder-note" aria-live="polite">
          <span className="preorder-note__badge">
            {tx("shop.preorder.defaultLabel", { sv: "FÖRKÖP", en: "PRE-ORDER", tr: "ÖN SİPARİŞ" })}
          </span>
          <span className="preorder-note__text">
            {tx(
              "shop.preorder.firstDropNote",
              {
                sv: "Förköp går via kassan. Första vågen är strikt begränsad till {{units}} budgeterade exemplar totalt, medan produktion och leverans kopplas säkert innan skarp lansering.",
                en: "Pre-orders go through checkout. The first wave is strictly limited to {{units}} budgeted units in total, while production and delivery are connected safely before live launch.",
                tr: "Ön siparişler ödeme akışından geçer. İlk dalga toplam {{units}} bütçelenmiş adetle sınırlıdır; üretim ve teslimat canlı lansmandan önce güvenle bağlanır.",
              },
              { units: FIRST_DROP_TOTAL_UNITS }
            )}
          </span>
        </div>
      ) : null}

      <details className="shop-tools">
        <summary>
          {tx("shop.tools.summary", { sv: "Filter och katalogläge", en: "Filters and catalog mode", tr: "Filtreler ve katalog modu" })}
        </summary>

        <div className="drop-note">
          <div className="drop-note-title">
            {catalogExpanded
              ? tx("shop.tools.fullCatalogTitle", { sv: "Full Catalog v1", en: "Full Catalog v1", tr: "Full Catalog v1" })
              : tx("shop.tools.firstDropTitle", { sv: "First Drop v1", en: "First Drop v1", tr: "First Drop v1" })}
          </div>
          <div className="drop-note-body">
            {catalogExpanded
              ? tx("shop.tools.fullCatalogBody", {
                  sv: "Hela katalogläget är öppet. Kategorierna byggs automatiskt från produkter, tags och slugs. Market Lab visas först när katalogen eller en kategori öppnas.",
                  en: "Full catalog mode is open. Categories are built automatically from products, tags and slugs. Market Lab only appears when the catalog or a category is opened.",
                  tr: "Tam katalog modu açık. Kategoriler ürünlerden, etiketlerden ve slug’lardan otomatik oluşturulur. Market Lab yalnızca katalog veya bir kategori açıldığında görünür.",
                })
              : tx(
                  "shop.tools.firstDropBody",
                  {
                    sv: "Endast våra sex starkaste auto-produkter visas i denna våg. Första vågen är budgeterad till totalt {{units}} exemplar. Fler släpp och Market Lab-idéer finns i hela katalogen.",
                    en: "Only our six strongest auto-products are shown in this wave. The first wave is budgeted for {{units}} units in total. More releases and Market Lab ideas are available in the full catalog.",
                    tr: "Bu dalgada yalnızca en güçlü altı otomatik ürünümüz gösterilir. İlk dalga toplam {{units}} adet için bütçelenmiştir. Daha fazla release ve Market Lab fikirleri tam katalogda bulunur.",
                  },
                  { units: FIRST_DROP_TOTAL_UNITS }
                )}
          </div>

          {catalogExpanded ? (
            <button type="button" className="drop-note-link" onClick={goFirstDrop}>
              {tx("shop.tools.showFirstDrop", { sv: "Visa endast första droppen", en: "Show only the first drop", tr: "Yalnızca ilk drop’u göster" })}
            </button>
          ) : (
            <button type="button" className="drop-note-link" onClick={goAllCatalog}>
              {tx("shop.tools.showFullCatalog", { sv: "Visa hela katalogen", en: "Show full catalog", tr: "Tüm kataloğu göster" })}
            </button>
          )}
        </div>

        <FilterBar categories={allCats} />
      </details>

      <div className="progress-wrap">
        <StoreProgress />
      </div>

      {isPreview && (
        <div className="preview-note">
          <span className="dot" aria-hidden />
          <span>
            {tx("shop.previewNote", {
              sv: "Vissa funktioner är under uppbyggnad. Det du ser är medvetet launch-ready preview — stabilt, snabbt och tydligt.",
              en: "Some features are still being built. What you see is intentionally launch-ready preview — stable, fast and clear.",
              tr: "Bazı özellikler hâlâ geliştiriliyor. Gördüğün şey bilinçli olarak launch-ready önizleme — stabil, hızlı ve net.",
            })}
          </span>
        </div>
      )}

      <button
        type="button"
        className={`to-top ${showTop ? "is-on" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={tx("shop.top", { sv: "Till toppen", en: "To top", tr: "Yukarı çık" })}
      >
        ↑
      </button>

      <style>{`
        .shop.container {
          max-width: 1160px;
          margin: 0 auto;
          padding: 1.25rem 1rem 4rem;
          --shop-night: var(--calestra-night, #07101f);
          --shop-deep: var(--calestra-deep, #101827);
          --shop-ink: var(--calestra-ink, #0f172a);
          --shop-lyra-blue: var(--lyra-blue, #b9d7ff);
          --shop-lyra-blue-strong: var(--lyra-blue-strong, #7fb4ff);
          --shop-lyra-silver: var(--lyra-silver, #e8edf7);
          --shop-lyra-mist: var(--lyra-mist, #f3f7ff);
          --shop-lyra-champagne: var(--lyra-champagne, #f1dca7);
          --shop-lyra-glow: var(--lyra-glow, rgba(150, 190, 255, 0.35));
          --shop-gold: var(--harmonic-gold, #d6a84f);
        }

        .shop-brand-hero{
          position:relative;
          overflow:hidden;
          min-height:360px;
          border-radius:30px;
          margin:0 0 18px;
          color:#fff;
          background:
            radial-gradient(circle at 18% 18%, rgba(185,215,255,.24), transparent 28%),
            radial-gradient(circle at 76% 22%, rgba(241,220,167,.17), transparent 28%),
            linear-gradient(90deg, rgba(2,8,18,.95) 0%, rgba(2,8,18,.80) 34%, rgba(2,8,18,.42) 62%, rgba(2,8,18,.72) 100%),
            var(--shopHeroImage),
            linear-gradient(135deg, #07111f 0%, #0b1020 48%, #05070d 100%);
          background-size:cover;
          background-position:center;
          border:1px solid rgba(185,215,255,.26);
          box-shadow:
            0 24px 70px rgba(15,23,42,.18),
            0 0 0 1px rgba(255,255,255,.05) inset,
            0 0 46px rgba(127,180,255,.10);
        }

        .shop-brand-hero::before{
          content:"";
          position:absolute;
          inset:0;
          pointer-events:none;
          background:
            linear-gradient(115deg, rgba(185,215,255,.18), transparent 28%, transparent 70%, rgba(241,220,167,.10)),
            radial-gradient(circle at 28% 72%, rgba(185,215,255,.18), transparent 24%);
          mix-blend-mode:screen;
          opacity:.82;
        }

        .shop-brand-hero::after{
          content:"";
          position:absolute;
          inset:auto 0 0 0;
          height:42%;
          pointer-events:none;
          background:linear-gradient(180deg, transparent, rgba(7,16,31,.72));
        }

        .shop-brand-star{
          position:absolute;
          left:60%;
          top:-8%;
          width:230px;
          height:230px;
          transform:translateX(-50%);
          background:
            linear-gradient(90deg, transparent 48%, rgba(241,220,167,.92) 49%, rgba(241,220,167,.92) 51%, transparent 52%),
            linear-gradient(0deg, transparent 48%, rgba(185,215,255,.90) 49%, rgba(185,215,255,.90) 51%, transparent 52%);
          filter:
            drop-shadow(0 0 20px rgba(185,215,255,.40))
            drop-shadow(0 0 34px rgba(241,220,167,.22));
          opacity:.80;
          pointer-events:none;
        }

        .shop-brand-star::before,
        .shop-brand-star::after{
          content:"";
          position:absolute;
          inset:0;
          background:
            linear-gradient(45deg, transparent 48.8%, rgba(185,215,255,.66) 49.4%, rgba(241,220,167,.62) 50.6%, transparent 51.2%);
        }

        .shop-brand-star::after{
          transform:rotate(90deg);
        }

        .shop-brand-star--soft{
          left:88%;
          top:70%;
          width:140px;
          height:140px;
          opacity:.16;
        }

        .shop-brand-copy{
          position:relative;
          z-index:2;
          min-height:360px;
          max-width:660px;
          padding:clamp(22px, 4vw, 46px);
          display:flex;
          flex-direction:column;
          justify-content:flex-end;
        }

        .shop-brand-kicker{
          display:inline-flex;
          align-items:center;
          gap:8px;
          width:max-content;
          padding:6px 10px;
          border-radius:999px;
          background:rgba(185,215,255,.12);
          border:1px solid rgba(185,215,255,.22);
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          margin-bottom:10px;
          box-shadow:0 0 24px rgba(127,180,255,.12);
        }

        .live-dot{
          width:8px;
          height:8px;
          border-radius:999px;
          background:#f97316;
          box-shadow:0 0 0 0 rgba(249,115,22,.45);
          animation: shopLivePulse 1.8s infinite;
        }

        @keyframes shopLivePulse{
          0%{ box-shadow:0 0 0 0 rgba(249,115,22,.42); }
          70%{ box-shadow:0 0 0 8px rgba(249,115,22,0); }
          100%{ box-shadow:0 0 0 0 rgba(249,115,22,0); }
        }

        .shop-brand-found{
          width:max-content;
          max-width:100%;
          margin:0 0 12px;
          padding:7px 12px;
          border-radius:999px;
          background:rgba(255,255,255,.11);
          border:1px solid rgba(185,215,255,.20);
          font-size:13px;
          line-height:1.3;
          font-weight:1000;
          color:rgba(255,255,255,.94);
          box-shadow:0 0 22px rgba(185,215,255,.10);
        }

        .shop-brand-copy h1{
          margin:0;
          font-size:clamp(38px, 5vw, 66px);
          line-height:.96;
          letter-spacing:-.055em;
          color:#fff;
          text-shadow:
            0 0 24px rgba(185,215,255,.18),
            0 8px 34px rgba(0,0,0,.34);
        }

        .shop-brand-copy p{
          margin:16px 0 0;
          max-width:540px;
          font-size:clamp(15px, 1.7vw, 20px);
          line-height:1.35;
          color:rgba(232,237,247,.88);
          font-weight:800;
        }

        .shop-brand-actions{
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:20px;
        }

        .brand-btn{
          min-height:42px;
          padding:0 15px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.16);
          font-weight:1000;
          cursor:pointer;
        }

        .brand-btn--light{
          background:linear-gradient(135deg, #ffffff 0%, #e8edf7 48%, #b9d7ff 140%);
          color:#0f172a;
          border-color:rgba(185,215,255,.80);
          box-shadow:
            0 18px 36px rgba(255,255,255,.12),
            0 0 24px rgba(185,215,255,.18);
        }

        .brand-btn--dark{
          background:linear-gradient(135deg, rgba(185,215,255,.14), rgba(255,255,255,.08));
          color:#fff;
          border-color:rgba(185,215,255,.20);
        }

        .brand-btn--ghost{
          background:transparent;
          color:rgba(255,255,255,.90);
          border-color:rgba(185,215,255,.18);
        }

        .drop-intro{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:16px;
          margin:0 0 14px;
          padding:18px 20px;
          border-radius:22px;
          background:
            radial-gradient(circle at top left, rgba(185,215,255,.30), transparent 35%),
            radial-gradient(circle at top right, rgba(241,220,167,.20), transparent 38%),
            linear-gradient(135deg, rgba(255,255,255,.97), rgba(248,250,252,.99));
          border:1px solid rgba(185,215,255,.24);
          box-shadow:
            0 16px 34px rgba(15,23,42,.05),
            0 0 0 1px rgba(255,255,255,.72) inset;
        }

        .drop-intro span{
          display:block;
          margin-bottom:7px;
          font-size:12px;
          font-weight:1000;
          letter-spacing:.10em;
          color:#8a5c14;
          text-transform:uppercase;
        }

        .drop-intro h2{
          margin:0;
          color:#0f172a;
          font-size:clamp(28px, 4vw, 42px);
          line-height:1.02;
          letter-spacing:-.04em;
        }

        .drop-intro p{
          margin:8px 0 0;
          max-width:780px;
          color:#334155;
          font-size:15px;
          line-height:1.55;
          font-weight:800;
        }

        .catalog-strip{
          margin:0 0 12px;
          padding:14px;
          border-radius:20px;
          border:1px solid rgba(185,215,255,.24);
          background:
            radial-gradient(circle at top right, rgba(185,215,255,.25), transparent 34%),
            radial-gradient(circle at top left, rgba(241,220,167,.14), transparent 34%),
            rgba(255,255,255,.86);
          box-shadow:
            0 14px 28px rgba(15,23,42,.04),
            0 0 0 1px rgba(255,255,255,.66) inset;
        }

        .catalog-strip__head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom:10px;
        }

        .catalog-strip__head span{
          font-size:11px;
          font-weight:1000;
          letter-spacing:.10em;
          color:#8a5c14;
        }

        .catalog-strip__head strong{
          color:#0f172a;
          font-size:14px;
          font-weight:1000;
        }

        .catalog-strip__row{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }

        .catalog-chip{
          min-height:36px;
          padding:0 12px;
          border-radius:999px;
          border:1px solid rgba(15,23,42,.10);
          background:rgba(255,255,255,.86);
          color:#0f172a;
          font-size:12px;
          font-weight:1000;
          cursor:pointer;
        }

        .catalog-chip:hover{
          border-color:rgba(127,180,255,.42);
          box-shadow:0 8px 18px rgba(127,180,255,.10);
        }

        .catalog-chip.is-on{
          background:linear-gradient(135deg,#0f172a 0%, #1e3a5f 62%, #7fb4ff 145%);
          color:#fff;
          border-color:rgba(185,215,255,.42);
          box-shadow:
            0 10px 20px rgba(15,23,42,.12),
            0 0 24px rgba(127,180,255,.16);
        }

        .preview-pill{
          font-size:10px;
          font-weight:950;
          letter-spacing:.14em;
          padding:6px 12px;
          border-radius:999px;
          border:1px solid rgba(241,220,167,.46);
          background:rgba(241,220,167,.14);
          color:rgba(124,77,9,.95);
          white-space:nowrap;
        }

        .mood-strip{
          margin:0 0 12px;
          padding:14px;
          border-radius:20px;
          border:1px solid rgba(185,215,255,.24);
          background:
            radial-gradient(circle at top left, rgba(255,190,220,.16), transparent 32%),
            radial-gradient(circle at top right, rgba(127,180,255,.20), transparent 34%),
            linear-gradient(135deg, rgba(255,255,255,.92), rgba(248,250,252,.98));
          box-shadow:
            0 14px 28px rgba(15,23,42,.04),
            0 0 0 1px rgba(255,255,255,.66) inset;
        }

        .mood-strip__head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom:10px;
        }

        .mood-strip__head span{
          font-size:11px;
          font-weight:1000;
          letter-spacing:.10em;
          color:#8a5c14;
        }

        .mood-strip__head strong{
          color:#0f172a;
          font-size:14px;
          font-weight:1000;
          text-align:right;
        }

        .mood-strip__row{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }

        .mood-chip{
          min-height:42px;
          padding:7px 12px;
          border-radius:16px;
          border:1px solid rgba(15,23,42,.10);
          background:rgba(255,255,255,.86);
          color:#0f172a;
          font-size:12px;
          font-weight:1000;
          cursor:pointer;
          display:inline-flex;
          flex-direction:column;
          align-items:flex-start;
          justify-content:center;
          gap:2px;
          line-height:1.1;
          transition:transform .12s ease, border-color .12s ease, box-shadow .12s ease, background .12s ease;
        }

        .mood-chip:hover{
          transform:translateY(-1px);
          border-color:rgba(127,180,255,.42);
          box-shadow:0 8px 18px rgba(127,180,255,.10);
        }

        .mood-chip small{
          font-size:10.5px;
          font-weight:800;
          opacity:.68;
        }

        .mood-chip.is-on{
          background:linear-gradient(135deg,#0f172a 0%, #1e3a5f 62%, #7fb4ff 145%);
          color:#fff;
          border-color:rgba(185,215,255,.52);
          box-shadow:
            0 10px 20px rgba(15,23,42,.12),
            0 0 24px rgba(127,180,255,.16);
        }

        .mood-chip--soft{ border-color:rgba(255,145,200,.28); }
        .mood-chip--dark{ border-color:rgba(20,24,38,.24); }
        .mood-chip--premium{ border-color:rgba(214,174,82,.30); }
        .mood-chip--cozy{ border-color:rgba(255,170,90,.28); }
        .mood-chip--collector{ border-color:rgba(150,120,255,.30); }
        .mood-chip--street{ border-color:rgba(80,110,255,.28); }
        .mood-chip--gift{ border-color:rgba(255,115,145,.28); }
        .mood-chip--practical{ border-color:rgba(80,170,140,.28); }

        .top-hints{
          margin-top:10px;
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          align-items:center;
        }

        .mini-hint{
          font-size:12.5px;
          color:rgba(15,23,42,.74);
          background:rgba(185,215,255,.16);
          border:1px solid rgba(127,180,255,.16);
          border-radius:999px;
          padding:6px 10px;
          font-weight:750;
        }

        .mini-hint--preorder{
          color:#854d0e;
          background:rgba(254,240,138,.36);
          border-color:rgba(245,158,11,.22);
        }

        .mini-hint--notify{
          color:#1d4ed8;
          background:rgba(219,234,254,.66);
          border-color:rgba(96,165,250,.24);
        }

        .mini-clear{
          border:0;
          background:transparent;
          text-decoration:underline;
          font-weight:900;
          cursor:pointer;
          color:inherit;
          opacity:.8;
        }

        .shop-actions-row{
          margin-top:12px;
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          align-items:center;
        }

        .shop-pill{
          border-radius:999px;
          padding:8px 12px;
          border:1px solid rgba(127,180,255,.24);
          background:rgba(185,215,255,.16);
          color:rgba(15,23,42,.86);
          font-weight:900;
          font-size:12px;
          cursor:pointer;
        }

        .shop-pill:hover{
          transform:translateY(-1px);
          border-color:rgba(127,180,255,.44);
          box-shadow:0 10px 22px rgba(127,180,255,.12);
        }

        .shop-pill--preorder{
          background:rgba(254,240,138,.36);
          border-color:rgba(245,158,11,.24);
          color:#854d0e;
        }

        .shop-pill--notify{
          background:rgba(219,234,254,.66);
          border-color:rgba(96,165,250,.24);
          color:#1d4ed8;
        }

        .shop-pill--ghost{
          border-color:rgba(148,163,184,.22);
          background:rgba(2,6,23,.03);
        }

        .shop-grid{
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap:1.75rem;
          margin-top:1.5rem;
          scroll-margin-top:150px;
        }

        .shop .msg{
          margin-top:1.25rem;
          font-size:.95rem;
        }

        .shop .msg.error{
          color:#ff6b6b;
        }

        .empty{
          margin-top:14px;
          padding:16px;
          border-radius:16px;
          border:1px solid rgba(185,215,255,.22);
          background:
            radial-gradient(circle at top left, rgba(185,215,255,.20), transparent 34%),
            rgba(2,6,23,.04);
        }

        .empty__title{
          font-weight:950;
          font-size:14px;
          margin-bottom:6px;
        }

        .empty__body{
          opacity:.9;
          line-height:1.5;
          margin-bottom:8px;
          font-size:13px;
        }

        .empty__tip{
          opacity:.75;
          font-weight:800;
          font-size:12px;
        }

        .empty__cta{
          margin-top:10px;
        }

        .empty__link{
          display:inline-flex;
          align-items:center;
          gap:6px;
          font-weight:950;
          text-decoration:none;
          border-radius:12px;
          padding:10px 12px;
          border:1px solid rgba(127,180,255,.26);
          background:rgba(185,215,255,.16);
          color:rgba(15,23,42,.92);
          cursor:pointer;
        }

        .shop .skel{
          height:340px;
          border-radius:20px;
          background:linear-gradient(120deg, rgba(185,215,255,0.18), rgba(255,255,255,0.06));
          animation: shop-skel-pulse 1.3s ease-in-out infinite alternate;
        }

        @keyframes shop-skel-pulse{
          from { opacity:0.35; transform:translateY(1px); }
          to { opacity:0.8; transform:translateY(-1px); }
        }

        .shop-story{
          margin:34px 0 18px;
          padding:20px;
          border-radius:24px;
          background:
            radial-gradient(circle at top left, rgba(185,215,255,.26), transparent 34%),
            radial-gradient(circle at top right, rgba(241,220,167,.15), transparent 34%),
            linear-gradient(135deg, rgba(255,255,255,.95), rgba(248,250,252,.99));
          border:1px solid rgba(185,215,255,.24);
          box-shadow:
            0 16px 34px rgba(15,23,42,.05),
            0 0 0 1px rgba(255,255,255,.66) inset;
        }

        .story-head{
          display:flex;
          justify-content:space-between;
          align-items:flex-end;
          gap:16px;
          margin-bottom:14px;
        }

        .story-head span{
          display:block;
          margin-bottom:7px;
          color:#8a5c14;
          font-size:12px;
          font-weight:1000;
          letter-spacing:.10em;
        }

        .story-head h2{
          margin:0;
          color:#0f172a;
          font-size:clamp(26px, 4vw, 38px);
          line-height:1.04;
          letter-spacing:-.04em;
        }

        .story-head p{
          margin:8px 0 0;
          color:#334155;
          font-size:15px;
          line-height:1.55;
          font-weight:800;
        }

        .story-btn{
          min-height:42px;
          padding:0 14px;
          border-radius:999px;
          border:1px solid rgba(185,215,255,.32);
          background:linear-gradient(135deg,#0f172a 0%, #1e3a5f 72%, #7fb4ff 160%);
          color:#fff;
          font-weight:1000;
          cursor:pointer;
          white-space:nowrap;
          box-shadow:0 12px 24px rgba(15,23,42,.12);
        }

        .story-grid{
          display:grid;
          grid-template-columns:repeat(3, minmax(0,1fr));
          gap:12px;
        }

        .story-card{
          padding:16px;
          border-radius:18px;
          background:rgba(255,255,255,.76);
          border:1px solid rgba(185,215,255,.22);
        }

        .story-card--dark{
          color:#fff;
          background:
            radial-gradient(circle at top right, rgba(185,215,255,.18), transparent 30%),
            radial-gradient(circle at bottom left, rgba(241,220,167,.12), transparent 34%),
            linear-gradient(135deg, #0f172a, #1e293b);
          border-color:rgba(185,215,255,.20);
          box-shadow:0 0 28px rgba(127,180,255,.09);
        }

        .story-card span{
          display:block;
          margin-bottom:8px;
          color:#8a5c14;
          font-size:11px;
          letter-spacing:.10em;
          font-weight:1000;
        }

        .story-card--dark span{
          color:#f1dca7;
        }

        .story-card strong{
          display:block;
          color:#0f172a;
          font-size:16px;
          line-height:1.3;
          font-weight:1000;
        }

        .story-card--dark strong{
          color:#fff;
        }

        .story-card p{
          margin:7px 0 0;
          color:#475569;
          font-size:13px;
          line-height:1.5;
          font-weight:800;
        }

        .story-card--dark p{
          color:rgba(232,237,247,.80);
        }

        .promo-banner.collection-banner{
          width:100%;
          background:
            radial-gradient(circle at 14% 20%, rgba(185,215,255,.16), transparent 32%),
            linear-gradient(90deg, #07101f, #151b2e);
          border-radius:16px;
          margin:8px 0 18px;
          padding:14px 18px;
          display:flex;
          justify-content:center;
          color:#fff;
          border:1px solid rgba(185,215,255,0.18);
          cursor:pointer;
          text-align:left;
          box-shadow:
            0 14px 28px rgba(15,23,42,.14),
            0 0 30px rgba(127,180,255,.08);
        }

        .promo-banner.collection-banner:hover{
          transform:translateY(-1px);
          box-shadow:0 16px 34px rgba(0,0,0,.22), 0 0 34px rgba(127,180,255,.13);
        }

        .promo-banner .promo-inner{
          width:100%;
          display:flex;
          gap:10px;
          align-items:center;
          font-size:14px;
        }

        .promo-banner .promo-icon{
          font-size:18px;
          color:#f1dca7;
          text-shadow:0 0 18px rgba(185,215,255,.28);
        }

        .promo-banner .promo-text{
          font-weight:800;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          flex:1;
        }

        .promo-banner .promo-cta{
          font-weight:950;
          opacity:.92;
          white-space:nowrap;
          color:#dbeafe;
        }

        .preorder-note{
          margin:0 0 16px;
          display:flex;
          gap:10px;
          align-items:flex-start;
          padding:12px 14px;
          border-radius:16px;
          border:1px solid rgba(245,158,11,.24);
          background:linear-gradient(135deg, rgba(254,240,138,.28), rgba(251,191,36,.12));
        }

        .preorder-note__badge{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:6px 10px;
          border-radius:999px;
          background:linear-gradient(135deg,#d97706,#f59e0b);
          color:#fff;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          white-space:nowrap;
        }

        .preorder-note__text{
          color:#0f172a;
          font-size:13px;
          line-height:1.5;
          font-weight:800;
        }

        .shop-tools{
          margin:18px 0;
          border-radius:18px;
          border:1px solid rgba(185,215,255,.24);
          background:
            radial-gradient(circle at top left, rgba(185,215,255,.18), transparent 34%),
            rgba(255,255,255,.80);
          box-shadow:
            0 12px 26px rgba(15,23,42,.04),
            0 0 0 1px rgba(255,255,255,.62) inset;
          overflow:hidden;
        }

        .shop-tools summary{
          cursor:pointer;
          padding:14px 16px;
          color:#0f172a;
          font-weight:1000;
          list-style:none;
        }

        .shop-tools summary::-webkit-details-marker{
          display:none;
        }

        .shop-tools summary::after{
          content:"↓";
          float:right;
          opacity:.65;
        }

        .shop-tools[open] summary::after{
          content:"↑";
        }

        .shop-tools > *:not(summary){
          margin-left:14px;
          margin-right:14px;
        }

        .drop-note{
          margin:0 0 16px;
          padding:14px 16px;
          border-radius:16px;
          border:1px solid rgba(185,215,255,.22);
          background:
            radial-gradient(circle at top left, rgba(185,215,255,.18), transparent 34%),
            linear-gradient(135deg, rgba(15,23,42,.04), rgba(249,115,22,.04));
        }

        .drop-note-title{
          font-size:12px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:#64748b;
          margin-bottom:6px;
        }

        .drop-note-body{
          color:#0f172a;
          font-size:14px;
          line-height:1.55;
          font-weight:800;
        }

        .drop-note-link{
          margin-top:10px;
          border:0;
          background:transparent;
          padding:0;
          color:#0f172a;
          font-weight:1000;
          text-decoration:underline;
          cursor:pointer;
        }

        .progress-wrap{
          margin:18px 0 16px;
        }

        .preview-note{
          margin-top:10px;
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px 12px;
          border-radius:14px;
          border:1px solid rgba(185,215,255,.22);
          background:rgba(185,215,255,.13);
          color:rgba(15,23,42,.78);
          font-weight:750;
          font-size:12.5px;
          line-height:1.35;
        }

        .preview-note .dot{
          width:8px;
          height:8px;
          border-radius:999px;
          background:rgba(241,220,167,.92);
          box-shadow:0 0 0 6px rgba(241,220,167,.14), 0 0 14px rgba(185,215,255,.20);
          flex:0 0 auto;
        }

        .to-top{
          position:fixed;
          right:14px;
          bottom:calc(14px + env(safe-area-inset-bottom));
          width:44px;
          height:44px;
          border-radius:999px;
          border:1px solid rgba(185,215,255,.28);
          background:rgba(255,255,255,.88);
          backdrop-filter:blur(10px) saturate(150%);
          box-shadow:0 12px 40px rgba(0,0,0,.14), 0 0 24px rgba(127,180,255,.12);
          font-weight:1000;
          opacity:0;
          pointer-events:none;
          transform:translateY(10px);
          transition:opacity .16s ease, transform .16s ease;
          z-index:40;
        }

        .to-top.is-on{
          opacity:1;
          pointer-events:auto;
          transform:translateY(0);
        }

        @media (max-width: 900px){
          .shop-brand-hero{
            min-height:330px;
          }

          .shop-brand-copy{
            min-height:330px;
          }

          .drop-intro,
          .story-head{
            flex-direction:column;
            align-items:flex-start;
          }

          .story-grid{
            grid-template-columns:1fr;
          }

          .catalog-strip__head,
          .mood-strip__head{
            align-items:flex-start;
            flex-direction:column;
          }

          .mood-strip__head strong{
            text-align:left;
          }
        }

        @media (max-width: 640px){
          .shop.container{
            padding-inline:.75rem;
          }

          .shop-brand-hero{
            border-radius:24px;
            min-height:390px;
          }

          .shop-brand-copy{
            min-height:390px;
            padding:22px 18px;
          }

          .shop-brand-copy h1{
            font-size:42px;
          }

          .shop-brand-star--main{
            left:72%;
            width:210px;
            height:210px;
          }

          .promo-banner .promo-inner{
            flex-direction:column;
            align-items:flex-start;
          }

          .promo-banner .promo-text{
            white-space:normal;
          }

          .promo-banner .promo-cta{
            align-self:flex-end;
          }

          .preorder-note{
            flex-direction:column;
          }
        }

        @media (prefers-reduced-motion: reduce){
          .live-dot{
            animation:none;
          }
        }
      `}</style>
    </div>
  );
}