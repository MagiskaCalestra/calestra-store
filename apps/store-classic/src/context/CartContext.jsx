// D:\WebProjects\Calestra\apps\store-classic\src\context\CartContext.jsx

import React from "react";

const CartContext = React.createContext(null);

const LS_KEY = "cw.cart.v2";
const LEGACY_LS_KEY = "cw.cart.v1";

function safeJsonParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function readLocalStorage(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // noop
  }
}

function removeLocalStorage(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // noop
  }
}

function normalizeText(v) {
  return String(v ?? "").trim();
}

function normalizeMode(value) {
  const s = normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_/]+/g, " ")
    .replace(/[^a-z0-9\u00C0-\u024F -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!s) return "";

  if (
    s === "buy" ||
    s === "standard" ||
    s === "shop" ||
    s === "purchase" ||
    s === "ready" ||
    s === "ready for fulfillment" ||
    s === "ready fulfillment" ||
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
    s === "notify only" ||
    s === "notify queue" ||
    s === "back in stock" ||
    s === "watch only" ||
    s === "coming soon" ||
    s === "meddela mig" ||
    s === "bevaka"
  ) {
    return "notify";
  }

  return s;
}

function truthyFlag(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;

  const s = normalizeMode(value);

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
    "notify only",
    "back in stock",
    "watch only",
    "coming soon",
  ].includes(s);
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const s = normalizeText(value);
    if (s) return s;
  }
  return "";
}

function numberOr(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeId(src = {}) {
  return firstNonEmpty(
    src.id,
    src.product?.id,
    src.productId,
    src.slug,
    src.product?.slug,
    src.sku,
    src.product?.sku
  );
}

function normalizeTitle(src = {}) {
  return firstNonEmpty(src.title, src.name, src.product?.title, src.product?.name, "Produkt");
}

function normalizePrice(src = {}) {
  const n = Number(
    src.price ??
      src.priceSEK ??
      src.unitPrice ??
      src.product?.price ??
      src.product?.priceSEK ??
      0
  );
  return Number.isFinite(n) ? n : 0;
}

function normalizeQty(v) {
  const n = Number(v ?? 1);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.round(n));
}

function normalizeImage(src = {}) {
  return (
    src.image ||
    src.images?.find?.((x) => x?.type === "thumb")?.image ||
    src.images?.find?.((x) => x?.type === "hero")?.image ||
    src.images?.[0]?.image ||
    src.images?.[0]?.src ||
    src.product?.image ||
    src.product?.images?.find?.((x) => x?.type === "thumb")?.image ||
    src.product?.images?.find?.((x) => x?.type === "hero")?.image ||
    src.product?.images?.[0]?.image ||
    src.product?.images?.[0]?.src ||
    ""
  );
}

function normalizeMeta(src = {}) {
  const sourceMeta = src.meta && typeof src.meta === "object" ? src.meta : {};
  const meta = { ...sourceMeta };

  const size = firstNonEmpty(sourceMeta.size, src.size, src.product?.size);
  const color = firstNonEmpty(sourceMeta.color, src.color, src.product?.color);
  const material = firstNonEmpty(sourceMeta.material, src.material, src.product?.material);

  if (size) meta.size = size;
  if (color) meta.color = color;
  if (material) meta.material = material;

  const lineMode = normalizeMode(
    sourceMeta.lineMode ||
      src.lineMode ||
      src.orderType ||
      src.ctaMode ||
      src.product?.ctaMode
  );

  if (lineMode) meta.lineMode = lineMode;

  const fulfillmentType = firstNonEmpty(
    sourceMeta.fulfillmentType,
    src.fulfillmentType,
    src.product?.fulfillmentType
  );

  const availabilityType = firstNonEmpty(
    sourceMeta.availabilityType,
    src.availabilityType,
    src.product?.availabilityType
  );

  if (fulfillmentType) meta.fulfillmentType = fulfillmentType;
  if (availabilityType) meta.availabilityType = availabilityType;

  return Object.keys(meta).length ? meta : undefined;
}

function normalizeVariantTitle(src = {}) {
  return firstNonEmpty(
    src.variantTitle,
    src.variant,
    src.variant_name,
    src.variantName,
    src.meta?.variant
  );
}

function buildVariantKey(src = {}) {
  const id = normalizeId(src);
  const variantTitle = normalizeVariantTitle(src);
  const size = firstNonEmpty(src.meta?.size, src.size);
  const color = firstNonEmpty(src.meta?.color, src.color);
  const material = firstNonEmpty(src.meta?.material, src.material);

  const key = [id, variantTitle, size, color, material].join("::");
  return normalizeText(key);
}

function makeUid() {
  return `cl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function makeLineKey(src = {}) {
  const existing = normalizeText(src.lineKey);
  if (existing) return existing;

  const variantKey = buildVariantKey(src);
  if (variantKey) return variantKey;

  return makeUid();
}

function detectPreorder(src = {}) {
  const mode = normalizeMode(
    src.ctaMode ||
      src.lineMode ||
      src.orderType ||
      src.fulfillmentType ||
      src.availabilityType ||
      src.meta?.lineMode ||
      src.meta?.fulfillmentType ||
      src.meta?.availabilityType ||
      src.product?.ctaMode ||
      src.product?.fulfillmentType ||
      src.product?.availabilityType
  );

  return !!(
    mode === "preorder" ||
    truthyFlag(src.preorder) ||
    truthyFlag(src.isPreorder) ||
    truthyFlag(src.preOrder) ||
    truthyFlag(src.preorderOnly) ||
    truthyFlag(src.preorderActive) ||
    truthyFlag(src.meta?.preorder) ||
    truthyFlag(src.meta?.isPreorder) ||
    truthyFlag(src.meta?.preOrder) ||
    truthyFlag(src.product?.preorder) ||
    truthyFlag(src.product?.isPreorder) ||
    truthyFlag(src.product?.preOrder) ||
    truthyFlag(src.product?.preorderOnly)
  );
}

function detectNotify(src = {}) {
  const mode = normalizeMode(
    src.ctaMode ||
      src.lineMode ||
      src.orderType ||
      src.fulfillmentType ||
      src.availabilityType ||
      src.meta?.lineMode ||
      src.meta?.fulfillmentType ||
      src.meta?.availabilityType ||
      src.product?.ctaMode ||
      src.product?.fulfillmentType ||
      src.product?.availabilityType
  );

  return !!(
    mode === "notify" ||
    truthyFlag(src.notifyOnly) ||
    truthyFlag(src.notifyMe) ||
    truthyFlag(src.backInStockOnly) ||
    truthyFlag(src.meta?.notifyOnly) ||
    truthyFlag(src.meta?.notifyMe) ||
    truthyFlag(src.product?.notifyOnly) ||
    truthyFlag(src.product?.notifyMe) ||
    truthyFlag(src.product?.backInStockOnly)
  );
}

function normalizeLineMode(src = {}) {
  if (detectPreorder(src)) return "preorder";
  if (detectNotify(src)) return "notify";

  const mode = normalizeMode(
    src.lineMode ||
      src.ctaMode ||
      src.orderType ||
      src.meta?.lineMode ||
      src.product?.ctaMode ||
      src.product?.lineMode
  );

  return mode === "preorder" || mode === "notify" ? mode : "buy";
}

function normalizeOrderType(src = {}) {
  const lineMode = normalizeLineMode(src);
  if (lineMode === "preorder") return "preorder";
  if (lineMode === "notify") return "notify";

  const explicit = normalizeMode(src.orderType || src.product?.orderType);
  return explicit || "standard";
}

function normalizeFulfillmentType(src = {}) {
  const lineMode = normalizeLineMode(src);

  if (lineMode === "preorder") return "preorder";
  if (lineMode === "notify") return "notify";

  return firstNonEmpty(
    src.fulfillmentType,
    src.meta?.fulfillmentType,
    src.product?.fulfillmentType,
    "ready_for_fulfillment"
  );
}

function normalizeAvailabilityType(src = {}) {
  const lineMode = normalizeLineMode(src);

  if (lineMode === "preorder") return "preorder";
  if (lineMode === "notify") return "notify";

  return firstNonEmpty(src.availabilityType, src.meta?.availabilityType, src.product?.availabilityType);
}

function normalizeProductSnapshot(src = {}) {
  const p = src.product && typeof src.product === "object" ? src.product : {};
  const lineMode = normalizeLineMode(src);
  const isPreorder = lineMode === "preorder";
  const isNotify = lineMode === "notify";

  if (!Object.keys(p).length) {
    return {
      id: normalizeId(src),
      slug: firstNonEmpty(src.slug, src.productSlug),
      title: normalizeTitle(src),
      image: normalizeImage(src),
      price: normalizePrice(src),
      ctaMode: lineMode,
      preorder: isPreorder || undefined,
      isPreorder: isPreorder || undefined,
      notifyOnly: isNotify || undefined,
      fulfillmentType: normalizeFulfillmentType(src),
      availabilityType: normalizeAvailabilityType(src) || undefined,
      requiresShipping: src.requiresShipping,
      type: src.type,
    };
  }

  return {
    ...p,
    id: firstNonEmpty(p.id, src.productId, src.id),
    slug: firstNonEmpty(p.slug, src.slug),
    title: firstNonEmpty(p.title, src.title, src.name),
    image: normalizeImage({ ...src, product: p }),
    price: numberOr(p.price ?? p.priceSEK ?? src.price ?? src.priceSEK, normalizePrice(src)),
    ctaMode: lineMode,
    preorder: isPreorder || p.preorder || undefined,
    isPreorder: isPreorder || p.isPreorder || undefined,
    preOrder: isPreorder || p.preOrder || undefined,
    preorderOnly: isPreorder || p.preorderOnly || undefined,
    preorderActive: isPreorder || p.preorderActive || undefined,
    preorderLabel: isPreorder
      ? firstNonEmpty(src.preorderLabel, src.preOrderLabel, src.meta?.preorderLabel, p.preorderLabel, p.preorderBadge)
      : p.preorderLabel,
    preorderNote: isPreorder
      ? firstNonEmpty(src.preorderNote, src.preOrderNote, src.preorderText, src.meta?.preorderNote, p.preorderNote, p.preorderText)
      : p.preorderNote,
    preorderEta: isPreorder
      ? firstNonEmpty(src.preorderEta, src.meta?.preorderEta, p.preorderEta)
      : p.preorderEta,
    preorderLeadDays: isPreorder
      ? numberOr(src.preorderLeadDays ?? src.meta?.preorderLeadDays ?? p.preorderLeadDays, 0)
      : p.preorderLeadDays,
    notifyOnly: isNotify || p.notifyOnly || undefined,
    notifyMe: isNotify || p.notifyMe || undefined,
    notifyLabel: isNotify
      ? firstNonEmpty(src.notifyLabel, src.meta?.notifyLabel, p.notifyLabel, p.backInStockLabel)
      : p.notifyLabel,
    notifyNote: isNotify
      ? firstNonEmpty(src.notifyNote, src.meta?.notifyNote, p.notifyNote, p.backInStockNote)
      : p.notifyNote,
    fulfillmentType: normalizeFulfillmentType(src),
    availabilityType: normalizeAvailabilityType(src) || p.availabilityType,
    requiresShipping:
      src.requiresShipping != null ? src.requiresShipping : p.requiresShipping,
    type: src.type || p.type,
  };
}

function toNormalizedItem(input, qtyOverride) {
  const src = input || {};
  const qtyRaw = qtyOverride != null ? qtyOverride : src.qty;

  const lineMode = normalizeLineMode(src);
  const isPreorder = lineMode === "preorder";
  const isNotify = lineMode === "notify";
  const meta = normalizeMeta(src) || {};

  meta.lineMode = lineMode;

  if (isPreorder) {
    meta.preorder = true;
    meta.isPreorder = true;
    meta.preOrder = true;
    meta.preorderActive = true;
    meta.fulfillmentType = "preorder";
    meta.availabilityType = "preorder";
    meta.preorderLabel = firstNonEmpty(
      src.preorderLabel,
      src.preOrderLabel,
      src.meta?.preorderLabel,
      src.product?.preorderLabel,
      src.product?.preorderBadge
    );
    meta.preorderNote = firstNonEmpty(
      src.preorderNote,
      src.preOrderNote,
      src.preorderText,
      src.meta?.preorderNote,
      src.product?.preorderNote,
      src.product?.preorderText
    );
    meta.preorderEta = firstNonEmpty(src.preorderEta, src.meta?.preorderEta, src.product?.preorderEta);
    meta.preorderLeadDays = numberOr(
      src.preorderLeadDays ?? src.meta?.preorderLeadDays ?? src.product?.preorderLeadDays,
      0
    );
  }

  if (isNotify) {
    meta.notifyOnly = true;
    meta.notifyMe = true;
    meta.fulfillmentType = "notify";
    meta.availabilityType = "notify";
    meta.notifyLabel = firstNonEmpty(
      src.notifyLabel,
      src.meta?.notifyLabel,
      src.product?.notifyLabel,
      src.product?.backInStockLabel
    );
    meta.notifyNote = firstNonEmpty(
      src.notifyNote,
      src.meta?.notifyNote,
      src.product?.notifyNote,
      src.product?.backInStockNote
    );
  }

  const normalized = {
    id: normalizeId(src),
    title: normalizeTitle(src),
    name: normalizeTitle(src),
    price: normalizePrice(src),
    priceSEK: numberOr(src.priceSEK ?? src.price ?? src.product?.priceSEK ?? src.product?.price, normalizePrice(src)),
    qty: normalizeQty(qtyRaw),
    image: normalizeImage(src),
    variantTitle: normalizeVariantTitle(src),
    variant: normalizeVariantTitle(src),
    meta: Object.keys(meta).length ? meta : undefined,
    product: normalizeProductSnapshot(src),
    images: Array.isArray(src.images)
      ? src.images
      : Array.isArray(src.product?.images)
        ? src.product.images
        : undefined,

    ctaMode: lineMode,
    lineMode,
    orderType: normalizeOrderType(src),
    fulfillmentType: normalizeFulfillmentType(src),
    fulfillmentStatus: firstNonEmpty(src.fulfillmentStatus, src.product?.fulfillmentStatus, "accepted"),
    availabilityType: normalizeAvailabilityType(src),
    availabilityLabel: firstNonEmpty(
      src.availabilityLabel,
      src.product?.availabilityLabel,
      isPreorder ? src.preorderLabel || src.product?.preorderLabel : "",
      isNotify ? src.notifyLabel || src.product?.notifyLabel : ""
    ),
    badge: firstNonEmpty(src.badge, src.product?.badge),

    isDigital: !!(src.isDigital ?? src.product?.isDigital),
    type: src.type || src.product?.type,
    requiresShipping: src.requiresShipping ?? src.product?.requiresShipping,
    shipping: src.shipping || src.product?.shipping || null,
    launchGate: src.launchGate || src.product?.launchGate || null,
    printfulEligible:
      src.printfulEligible != null ? !!src.printfulEligible : !!src.product?.printfulEligible,

    preorder: isPreorder,
    isPreorder,
    preOrder: isPreorder,
    preorderOnly: isPreorder,
    preorderActive: isPreorder,
    preorderLabel: isPreorder
      ? firstNonEmpty(src.preorderLabel, src.preOrderLabel, meta.preorderLabel, src.product?.preorderLabel, src.product?.preorderBadge)
      : firstNonEmpty(src.preorderLabel, src.product?.preorderLabel),
    preOrderLabel: isPreorder
      ? firstNonEmpty(src.preOrderLabel, src.preorderLabel, meta.preorderLabel, src.product?.preorderLabel)
      : firstNonEmpty(src.preOrderLabel, src.product?.preOrderLabel),
    preorderNote: isPreorder
      ? firstNonEmpty(src.preorderNote, src.preOrderNote, src.preorderText, meta.preorderNote, src.product?.preorderNote, src.product?.preorderText)
      : firstNonEmpty(src.preorderNote, src.product?.preorderNote),
    preOrderNote: isPreorder
      ? firstNonEmpty(src.preOrderNote, src.preorderNote, meta.preorderNote, src.product?.preorderNote)
      : firstNonEmpty(src.preOrderNote, src.product?.preOrderNote),
    preorderText: isPreorder
      ? firstNonEmpty(src.preorderText, src.preorderNote, meta.preorderNote, src.product?.preorderText, src.product?.preorderNote)
      : firstNonEmpty(src.preorderText, src.product?.preorderText),
    preorderEta: isPreorder
      ? firstNonEmpty(src.preorderEta, meta.preorderEta, src.product?.preorderEta)
      : firstNonEmpty(src.preorderEta, src.product?.preorderEta),
    preorderLeadDays: isPreorder
      ? numberOr(src.preorderLeadDays ?? meta.preorderLeadDays ?? src.product?.preorderLeadDays, 0)
      : numberOr(src.preorderLeadDays ?? src.product?.preorderLeadDays, 0),

    notifyOnly: isNotify,
    notifyMe: isNotify,
    notifyLabel: isNotify
      ? firstNonEmpty(src.notifyLabel, meta.notifyLabel, src.product?.notifyLabel, src.product?.backInStockLabel)
      : firstNonEmpty(src.notifyLabel, src.product?.notifyLabel),
    notifyNote: isNotify
      ? firstNonEmpty(src.notifyNote, meta.notifyNote, src.product?.notifyNote, src.product?.backInStockNote)
      : firstNonEmpty(src.notifyNote, src.product?.notifyNote),
  };

  normalized.variantKey = buildVariantKey(normalized);
  normalized.lineKey = makeLineKey({
    ...normalized,
    lineKey: src.lineKey,
  });

  return normalized;
}

function sameVariant(a, b) {
  if (!a || !b) return false;

  const aKey = normalizeText(a.variantKey || buildVariantKey(a));
  const bKey = normalizeText(b.variantKey || buildVariantKey(b));

  if (aKey && bKey) return aKey === bKey;

  const aId = normalizeId(a);
  const bId = normalizeId(b);
  if (!aId || !bId) return false;
  if (aId !== bId) return false;

  const aVariant = normalizeVariantTitle(a);
  const bVariant = normalizeVariantTitle(b);
  if (aVariant !== bVariant) return false;

  const aSize = normalizeText(a.meta?.size || a.size || "");
  const bSize = normalizeText(b.meta?.size || b.size || "");
  if (aSize !== bSize) return false;

  const aColor = normalizeText(a.meta?.color || a.color || "");
  const bColor = normalizeText(b.meta?.color || b.color || "");
  if (aColor !== bColor) return false;

  const aMaterial = normalizeText(a.meta?.material || a.material || "");
  const bMaterial = normalizeText(b.meta?.material || b.material || "");
  if (aMaterial !== bMaterial) return false;

  const aMode = normalizeLineMode(a);
  const bMode = normalizeLineMode(b);
  if (aMode !== bMode) return false;

  return true;
}

function isTargetMatch(item, target) {
  const t = normalizeText(target);
  if (!t) return false;

  return (
    normalizeText(item.lineKey) === t ||
    normalizeText(item.variantKey) === t ||
    normalizeText(item.id) === t
  );
}

function mergeCartItems(existing, incoming) {
  const existingMeta = existing.meta && typeof existing.meta === "object" ? existing.meta : {};
  const incomingMeta = incoming.meta && typeof incoming.meta === "object" ? incoming.meta : {};

  const merged = {
    ...existing,
    ...incoming,
    qty: normalizeQty(Number(existing.qty || 1) + Number(incoming.qty || 1)),
    id: existing.id || incoming.id,
    title: existing.title || incoming.title,
    name: existing.name || incoming.name || existing.title || incoming.title,
    image: existing.image || incoming.image,
    price: Number.isFinite(Number(existing.price)) ? Number(existing.price) : Number(incoming.price || 0),
    priceSEK: Number.isFinite(Number(existing.priceSEK))
      ? Number(existing.priceSEK)
      : Number(incoming.priceSEK || incoming.price || 0),
    product: {
      ...(incoming.product || {}),
      ...(existing.product || {}),
      ...((normalizeLineMode(existing) === "preorder" || normalizeLineMode(incoming) === "preorder") && {
        ctaMode: "preorder",
        preorder: true,
        isPreorder: true,
        preorderOnly: true,
        preorderActive: true,
      }),
    },
    images: existing.images || incoming.images,
    variantTitle: existing.variantTitle || incoming.variantTitle,
    variant: existing.variant || incoming.variant,
    meta: {
      ...incomingMeta,
      ...existingMeta,
      lineMode:
        normalizeLineMode(existing) === "preorder" || normalizeLineMode(incoming) === "preorder"
          ? "preorder"
          : normalizeLineMode(existing) === "notify" || normalizeLineMode(incoming) === "notify"
            ? "notify"
            : "buy",
    },
    variantKey: existing.variantKey || incoming.variantKey,
    lineKey: existing.lineKey || incoming.lineKey,
  };

  return toNormalizedItem(merged, merged.qty);
}

function dedupeAndNormalize(list) {
  const src = Array.isArray(list) ? list : [];
  const out = [];

  for (const raw of src) {
    const item = toNormalizedItem(raw);
    if (!item.id) continue;

    const idx = out.findIndex((x) => sameVariant(x, item));
    if (idx === -1) {
      out.push(item);
      continue;
    }

    out[idx] = mergeCartItems(out[idx], item);
  }

  return out;
}

function readStoredCart() {
  if (typeof window === "undefined") return [];

  const rawV2 = readLocalStorage(LS_KEY);
  if (rawV2) {
    const parsed = safeJsonParse(rawV2, []);
    return dedupeAndNormalize(parsed);
  }

  const rawV1 = readLocalStorage(LEGACY_LS_KEY);
  if (rawV1) {
    const parsed = safeJsonParse(rawV1, []);
    const migrated = dedupeAndNormalize(parsed);
    writeStoredCart(migrated);
    return migrated;
  }

  return [];
}

function writeStoredCart(items) {
  const normalized = dedupeAndNormalize(items);
  writeLocalStorage(LS_KEY, JSON.stringify(normalized));

  // Städa gammal nyckel så gammal state inte återkommer
  removeLocalStorage(LEGACY_LS_KEY);
}

export function CartProvider({ children }) {
  const [items, setItems] = React.useState(() => readStoredCart());

  React.useEffect(() => {
    writeStoredCart(items);
  }, [items]);

  const add = React.useCallback((item, qty = 1) => {
    const normalized = toNormalizedItem(item, qty);
    if (!normalized.id) return;

    setItems((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const idx = list.findIndex((x) => sameVariant(x, normalized));

      if (idx === -1) {
        return [...list, normalized];
      }

      const next = [...list];
      next[idx] = mergeCartItems(next[idx], normalized);
      return next;
    });
  }, []);

  const inc = React.useCallback((lineKey) => {
    const t = normalizeText(lineKey);
    if (!t) return;

    setItems((prev) =>
      (Array.isArray(prev) ? prev : []).map((item) =>
        isTargetMatch(item, t)
          ? toNormalizedItem({ ...item, qty: normalizeQty(Number(item.qty || 1) + 1) })
          : item
      )
    );
  }, []);

  const dec = React.useCallback((lineKey) => {
    const t = normalizeText(lineKey);
    if (!t) return;

    setItems((prev) =>
      (Array.isArray(prev) ? prev : [])
        .map((item) => {
          if (!isTargetMatch(item, t)) return item;
          const nextQty = Math.max(0, Number(item.qty || 1) - 1);
          return { ...item, qty: nextQty };
        })
        .filter((item) => Number(item.qty || 0) > 0)
        .map((item) => toNormalizedItem(item, item.qty))
    );
  }, []);

  const remove = React.useCallback((lineKey) => {
    const t = normalizeText(lineKey);
    if (!t) return;

    setItems((prev) =>
      (Array.isArray(prev) ? prev : []).filter((item) => !isTargetMatch(item, t))
    );
  }, []);

  const clear = React.useCallback(() => {
    setItems([]);
  }, []);

  const replaceCart = React.useCallback((nextItems) => {
    const normalized = dedupeAndNormalize(nextItems);
    setItems(normalized);
  }, []);

  const count = React.useMemo(() => {
    return (Array.isArray(items) ? items : []).reduce(
      (sum, item) => sum + Math.max(1, Number(item.qty || 1)),
      0
    );
  }, [items]);

  const subtotalSEK = React.useMemo(() => {
    return (Array.isArray(items) ? items : []).reduce((sum, item) => {
      return sum + Number(item.price || 0) * Math.max(1, Number(item.qty || 1));
    }, 0);
  }, [items]);

  const hasPreorderItems = React.useMemo(() => {
    return (Array.isArray(items) ? items : []).some((item) => normalizeLineMode(item) === "preorder");
  }, [items]);

  const hasNotifyItems = React.useMemo(() => {
    return (Array.isArray(items) ? items : []).some((item) => normalizeLineMode(item) === "notify");
  }, [items]);

  const value = React.useMemo(
    () => ({
      items,
      count,
      subtotalSEK,
      hasPreorderItems,
      hasNotifyItems,
      add,
      inc,
      dec,
      remove,
      clear,
      replaceCart,
      setItems,
    }),
    [
      items,
      count,
      subtotalSEK,
      hasPreorderItems,
      hasNotifyItems,
      add,
      inc,
      dec,
      remove,
      clear,
      replaceCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}

export default CartContext;