// apps/store-classic/src/pages/checkout/checkoutSubmit.js

import {
  ORDER_REGISTER_URL,
  ORDERS_INGEST_URL,
  IS_PREVIEW,
  PURCHASE_TRACKED_KEY,
} from "./checkoutConfig.js";

import {
  cleanString,
  normalizeAffiliateInput,
  saveCheckoutPrefillCustomer,
  saveMemberShippingSnapshot,
  saveMemberBillingSnapshot,
  saveCheckoutDraftSnapshot,
  clearCheckoutDraftSnapshot,
  writePendingServerOrder,
  clearPendingServerOrder,
  buildServerWriteError,
  applyDreamAwardToOrder,
  postOrderRegister,
  postOrderIngest,
  upsertLocalOrder,
  writeLocalJson,
  readLocalJson,
  clearDraftId,
  saveCheckoutDraft,
  markCheckoutDraftRecovered,
} from "./checkoutHelpers.js";

import {
  applyDiscountToTotalsSEK,
  applyDiscountToDisplayTotals,
} from "../../utils/money.js";

function makeReservationCode(orderId) {
  const base = String(orderId || "CW").replace(/[^A-Z0-9-]/gi, "").toUpperCase();
  return `PRE-${base}`;
}

function normalizeLineQty(item) {
  const n = Number(item?.qty ?? item?.quantity ?? 1);
  return Number.isFinite(n) && n > 0 ? Math.max(1, n) : 1;
}

function normalizeLinePriceSek(item) {
  const n = Number(item?.priceSEK ?? item?.price ?? item?.product?.price ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampMoney(value) {
  const n = normalizeNumber(value, 0);
  return Math.max(0, Math.round(n * 100) / 100);
}

function pickNumber(source, keys = [], fallback = 0) {
  const obj = source && typeof source === "object" ? source : {};

  for (const key of keys) {
    const n = Number(obj[key]);
    if (Number.isFinite(n)) return n;
  }

  return fallback;
}

function pickString(source, keys = [], fallback = "") {
  const obj = source && typeof source === "object" ? source : {};

  for (const key of keys) {
    const v = cleanString(obj[key] || "", 240);
    if (v) return v;
  }

  return fallback;
}

function hasDiscountSignals(totalsSEK) {
  const base = totalsSEK && typeof totalsSEK === "object" ? totalsSEK : {};

  return Boolean(
    pickNumber(base, [
      "discount",
      "discountSek",
      "discountSEK",
      "discountAmountSek",
      "discountAmountSEK",
      "totalDiscountSek",
      "totalDiscountSEK",
      "shippingDiscountSek",
      "shippingDiscountSEK",
    ]) > 0 ||
      base.freeShippingApplied ||
      pickNumber(base, [
        "totalBeforeDiscountSEK",
        "shippingBeforeDiscountSEK",
        "shipBeforeDiscount",
        "shippingBeforeDiscount",
      ]) > 0
  );
}

function hasDiscountMeta(discountMeta) {
  const meta = discountMeta && typeof discountMeta === "object" ? discountMeta : {};

  return Boolean(
    meta.hasPendingDiscount ||
      meta.hasManualDiscount ||
      meta.manualDiscountApplied ||
      meta.discountCode ||
      meta.manualCode ||
      meta.freeShipping ||
      meta.manualFreeShipping ||
      meta.freeShippingApplied ||
      Number(meta.discountPercent || 0) > 0 ||
      Number(meta.manualDiscountPercent || 0) > 0 ||
      Number(meta.discountAmountSek || 0) > 0 ||
      Number(meta.discountAmountSEK || 0) > 0 ||
      Number(meta.manualDiscountAmountSek || 0) > 0 ||
      Number(meta.discountSek || 0) > 0 ||
      Number(meta.totalDiscountSek || 0) > 0 ||
      Number(meta.shippingDiscountSek || 0) > 0 ||
      Number(meta.shippingDiscountSEK || 0) > 0
  );
}

function normalizeTotalsForOrder({
  totalsSEK,
  displayTotals,
  discountMeta,
  anyPhysical,
  allDigital,
}) {
  const incoming = totalsSEK && typeof totalsSEK === "object" ? totalsSEK : {};
  const meta = discountMeta && typeof discountMeta === "object" ? discountMeta : {};

  /*
   * Viktigt:
   * useCheckoutLogic skickar normalt redan rabatterade totalsSEK.
   * Därför får vi INTE alltid applicera rabatt igen här.
   * Vi applicerar bara rabatt om totalsSEK saknar rabatt-signaler men discountMeta säger att rabatt finns.
   */
  const shouldApplyHere = !hasDiscountSignals(incoming) && hasDiscountMeta(meta);

  const discountedBase = shouldApplyHere
    ? applyDiscountToTotalsSEK(incoming, meta)
    : incoming;

  const base = discountedBase && typeof discountedBase === "object" ? discountedBase : {};
  const display = displayTotals && typeof displayTotals === "object" ? displayTotals : {};

  const subtotalSEK = clampMoney(
    pickNumber(base, ["subtotal", "sub", "items", "itemsTotal", "subtotalSEK", "subtotalSek"], 0)
  );

  const shippingAfterSEK = allDigital
    ? 0
    : clampMoney(
        pickNumber(base, ["ship", "shipping", "shippingSek", "shippingSEK", "freight"], 0)
      );

  const shippingBeforeDiscountSEK = allDigital
    ? 0
    : clampMoney(
        pickNumber(
          base,
          [
            "shippingBeforeDiscountSEK",
            "shipBeforeDiscount",
            "shippingBeforeDiscount",
            "ship",
            "shipping",
            "shippingSek",
            "shippingSEK",
            "freight",
          ],
          shippingAfterSEK
        )
      );

  const shippingDiscountSEK = clampMoney(
    pickNumber(
      base,
      ["shippingDiscountSek", "shippingDiscountSEK", "shippingDiscount"],
      Math.max(0, shippingBeforeDiscountSEK - shippingAfterSEK)
    )
  );

  const itemDiscountSEK = clampMoney(
    pickNumber(base, ["discountSek", "discountSEK"], 0)
  );

  const totalDiscountSEK = clampMoney(
    pickNumber(
      base,
      ["totalDiscountSek", "totalDiscountSEK", "discountAmountSek", "discountAmountSEK", "discount"],
      itemDiscountSEK + shippingDiscountSEK
    )
  );

  const totalBeforeDiscountSEK = clampMoney(
    pickNumber(
      base,
      ["totalBeforeDiscountSEK", "totalBeforeDiscount", "amountBeforeDiscountSEK"],
      subtotalSEK + shippingBeforeDiscountSEK
    )
  );

  const explicitGrand = pickNumber(
    base,
    ["grand", "total", "totalSek", "totalSEK", "amount"],
    NaN
  );

  const computedGrand = clampMoney(
    Math.max(0, totalBeforeDiscountSEK - totalDiscountSEK)
  );

  const displayTotal = Number(display.total);
  const trustedDisplayTotal =
    Number.isFinite(displayTotal) && displayTotal >= 0 ? clampMoney(displayTotal) : null;

  const finalTotalSEK = clampMoney(
    Number.isFinite(explicitGrand)
      ? explicitGrand
      : trustedDisplayTotal != null
        ? trustedDisplayTotal
        : computedGrand
  );

  const freeShippingApplied = Boolean(
    base.freeShippingApplied ||
      meta.freeShippingApplied ||
      meta.freeShipping ||
      meta.manualFreeShipping ||
      (anyPhysical && shippingBeforeDiscountSEK > 0 && shippingAfterSEK === 0)
  );

  const discountCode = pickString(base, ["discountCode"], "") ||
    cleanString(meta.discountCode || meta.manualCode || meta.code || "", 120);

  return {
    ...base,

    subtotal: subtotalSEK,
    sub: subtotalSEK,
    items: subtotalSEK,
    itemsTotal: subtotalSEK,
    subtotalSEK,
    subtotalSek: subtotalSEK,

    ship: shippingAfterSEK,
    shipping: shippingAfterSEK,
    shippingSek: shippingAfterSEK,
    shippingSEK: shippingAfterSEK,
    freight: shippingAfterSEK,

    originalShippingSEK: shippingBeforeDiscountSEK,
    shipBeforeDiscount: shippingBeforeDiscountSEK,
    shippingBeforeDiscount: shippingBeforeDiscountSEK,
    shippingBeforeDiscountSEK,

    freeShippingApplied,
    shippingDiscountSek: shippingDiscountSEK,
    shippingDiscountSEK,

    subtotalBeforeDiscount: subtotalSEK,
    totalBeforeDiscountSEK,

    discountSek: itemDiscountSEK,
    discountSEK: itemDiscountSEK,
    discount: totalDiscountSEK,
    discountAmountSek: totalDiscountSEK,
    discountAmountSEK: totalDiscountSEK,
    totalDiscountSek: totalDiscountSEK,
    totalDiscountSEK,

    discountCode,

    total: finalTotalSEK,
    grand: finalTotalSEK,
    totalSek: finalTotalSEK,
    totalSEK: finalTotalSEK,
    amount: finalTotalSEK,
  };
}

function normalizeDisplayTotalsForOrder({
  displayTotals,
  normalizedTotalsSEK,
  discountMeta,
  currency,
  rates,
}) {
  const display = displayTotals && typeof displayTotals === "object" ? displayTotals : {};
  const totals = normalizedTotalsSEK && typeof normalizedTotalsSEK === "object" ? normalizedTotalsSEK : {};
  const meta = discountMeta && typeof discountMeta === "object" ? discountMeta : {};

  /*
   * Om displayTotals redan kommer från useCheckoutLogic är den redan rabatterad.
   * applyDiscountToDisplayTotals används bara som fallback när display saknar rabattfält.
   */
  const displayHasDiscount = Boolean(
    Number(display.discount || 0) > 0 ||
      Number(display.discountSEK || 0) > 0 ||
      Number(display.discountAmountSEK || 0) > 0 ||
      Number(display.shippingDiscount || 0) > 0 ||
      display.freeShippingApplied
  );

  const fallbackDisplay =
    !displayHasDiscount && hasDiscountMeta(meta)
      ? applyDiscountToDisplayTotals(display, totals, meta, currency, rates)
      : display;

  const subtotal = Number.isFinite(Number(fallbackDisplay.subtotal))
    ? Number(fallbackDisplay.subtotal)
    : Number(totals.subtotal || totals.sub || 0);

  const shipping = Number.isFinite(Number(fallbackDisplay.shipping))
    ? Number(fallbackDisplay.shipping)
    : Number(totals.shipping || totals.ship || 0);

  const total = Number.isFinite(Number(fallbackDisplay.total))
    ? Number(fallbackDisplay.total)
    : Number(totals.total || totals.grand || 0);

  return {
    ...fallbackDisplay,
    subtotal: clampMoney(subtotal),
    shipping: clampMoney(shipping),
    total: clampMoney(total),
    totalBeforeDiscount: clampMoney(
      Number(fallbackDisplay.totalBeforeDiscount || 0) ||
        Number(totals.totalBeforeDiscountSEK || 0)
    ),
    discount: clampMoney(
      Number(fallbackDisplay.discount || 0) ||
        Number(totals.totalDiscountSek || 0) ||
        Number(totals.discountAmountSEK || 0)
    ),
    discountSEK: clampMoney(
      Number(totals.totalDiscountSek || 0) ||
        Number(totals.discountAmountSEK || 0)
    ),
    discountAmountSEK: clampMoney(
      Number(totals.totalDiscountSek || 0) ||
        Number(totals.discountAmountSEK || 0)
    ),
    shippingDiscount: clampMoney(
      Number(fallbackDisplay.shippingDiscount || 0) ||
        Number(totals.shippingDiscountSEK || 0)
    ),
    shippingDiscountSEK: clampMoney(Number(totals.shippingDiscountSEK || 0)),
    discountCode: meta.discountCode || meta.manualCode || totals.discountCode || "",
    freeShippingApplied: !!totals.freeShippingApplied,
  };
}

function normalizeDiscountMetaForOrder(discountMeta, normalizedTotalsSEK) {
  const meta = discountMeta && typeof discountMeta === "object" ? discountMeta : {};
  const totals = normalizedTotalsSEK && typeof normalizedTotalsSEK === "object" ? normalizedTotalsSEK : {};

  const itemDiscountSek = clampMoney(
    Number(totals.discountSek || 0) ||
      Number(totals.discountSEK || 0) ||
      Number(meta.manualDiscountAmountSek || 0) ||
      Number(meta.discountSek || 0)
  );

  const totalDiscountSek = clampMoney(
    Number(totals.totalDiscountSek || 0) ||
      Number(totals.discountAmountSEK || 0) ||
      Number(totals.discountAmountSek || 0) ||
      Number(meta.totalDiscountSek || 0) ||
      Number(meta.discountAmountSek || 0) ||
      itemDiscountSek
  );

  const shippingDiscountSek = clampMoney(
    Number(totals.shippingDiscountSek || 0) ||
      Number(totals.shippingDiscountSEK || 0) ||
      Number(meta.shippingDiscountSek || 0) ||
      Number(meta.shippingDiscountSEK || 0)
  );

  const discountCode =
    cleanString(meta.discountCode || meta.manualCode || meta.code || "", 120) ||
    cleanString(totals.discountCode || "", 120);

  return {
    ...meta,

    discountCode,

    discountSek: itemDiscountSek,
    discountSEK: itemDiscountSek,

    discountAmountSek: totalDiscountSek,
    discountAmountSEK: totalDiscountSek,
    totalDiscountSek,
    totalDiscountSEK: totalDiscountSek,

    manualDiscountAmountSek: clampMoney(
      Number(meta.manualDiscountAmountSek || 0) || itemDiscountSek
    ),

    freeShipping: !!(meta.freeShipping || meta.manualFreeShipping || totals.freeShippingApplied),
    manualFreeShipping: !!(meta.manualFreeShipping || totals.freeShippingApplied),
    freeShippingApplied: !!totals.freeShippingApplied,

    shippingDiscountSek,
    shippingDiscountSEK: shippingDiscountSek,

    hasPendingDiscount:
      !!meta.hasPendingDiscount ||
      !!discountCode ||
      totalDiscountSek > 0 ||
      shippingDiscountSek > 0 ||
      !!totals.freeShippingApplied,

    manualDiscountApplied:
      !!meta.manualDiscountApplied ||
      !!meta.manualCodeValid ||
      itemDiscountSek > 0 ||
      totalDiscountSek > 0,
  };
}

function normalizeText(value) {
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
  if (value === true) return true;
  if (value === false || value == null) return false;

  const s = normalizeText(value);

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
    "pre order",
    "pre_order",
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

function extractLineTexts(item) {
  const values = [
    item?.lineMode,
    item?.orderType,
    item?.ctaMode,
    item?.saleType,
    item?.purchaseType,
    item?.availabilityType,
    item?.availabilityLabel,
    item?.availabilityText,
    item?.fulfillmentType,
    item?.fulfilmentType,
    item?.fulfillmentStatus,
    item?.status,
    item?.badge,
    item?.title,
    item?.name,
    item?.slug,
    item?.handle,
    item?.sku,

    item?.meta?.lineMode,
    item?.meta?.orderType,
    item?.meta?.ctaMode,
    item?.meta?.availabilityType,
    item?.meta?.availabilityLabel,
    item?.meta?.availabilityText,
    item?.meta?.fulfillmentType,
    item?.meta?.fulfillmentStatus,
    item?.meta?.status,
    item?.meta?.badge,
    item?.meta?.label,

    item?.product?.lineMode,
    item?.product?.orderType,
    item?.product?.ctaMode,
    item?.product?.availabilityType,
    item?.product?.availabilityLabel,
    item?.product?.availabilityText,
    item?.product?.fulfillmentType,
    item?.product?.fulfillmentStatus,
    item?.product?.status,
    item?.product?.badge,
    item?.product?.title,
    item?.product?.name,
    item?.product?.subtitle,
    item?.product?.description,
    item?.product?.slug,
    item?.product?.handle,

    getNested(item, "product.meta.lineMode"),
    getNested(item, "product.meta.orderType"),
    getNested(item, "product.meta.ctaMode"),
    getNested(item, "product.meta.availabilityType"),
    getNested(item, "product.meta.availabilityLabel"),
    getNested(item, "product.meta.availabilityText"),
    getNested(item, "product.meta.fulfillmentType"),
    getNested(item, "product.meta.fulfillmentStatus"),
    getNested(item, "product.meta.status"),
    getNested(item, "product.meta.badge"),
  ];

  const tags = [
    ...arrayFromMaybe(item?.tags),
    ...arrayFromMaybe(item?.meta?.tags),
    ...arrayFromMaybe(item?.product?.tags),
    ...arrayFromMaybe(getNested(item, "product.meta.tags")),
    ...arrayFromMaybe(getNested(item, "product.flags.tags")),
  ];

  return [...values, ...tags].filter(Boolean).map(normalizeText).filter(Boolean);
}

function hasPreorderKeyword(text) {
  if (!text) return false;

  return (
    text.includes("preorder") ||
    text.includes("pre order") ||
    text.includes("pre-order") ||
    text.includes("pre_order") ||
    text.includes("forbestall") ||
    text.includes("förbeställ") ||
    text.includes("forhandsreservation") ||
    text.includes("förhandsreservation") ||
    text.includes("reservation") ||
    text.includes("reserve") ||
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
    text.includes("bevaka") ||
    text.includes("meddela mig")
  );
}

function getDirectMode(item) {
  return normalizeText(
    item?.lineMode ||
      item?.orderType ||
      item?.ctaMode ||
      item?.fulfillmentType ||
      item?.availabilityType ||
      item?.meta?.lineMode ||
      item?.meta?.orderType ||
      item?.meta?.ctaMode ||
      item?.meta?.fulfillmentType ||
      item?.meta?.availabilityType ||
      item?.product?.lineMode ||
      item?.product?.orderType ||
      item?.product?.ctaMode ||
      item?.product?.fulfillmentType ||
      item?.product?.availabilityType ||
      ""
  );
}

function isLineNotify(item) {
  const mode = getDirectMode(item);

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
    mode === "pre_order" ||
    mode === "waiting preorder" ||
    mode === "waiting_preorder"
  ) {
    return false;
  }

  const flags = [
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

  if (flags.some(truthyFlag)) return true;

  return extractLineTexts(item).some(hasNotifyKeyword);
}

function isLinePreorder(item) {
  const mode = getDirectMode(item);

  if (
    mode === "preorder" ||
    mode === "pre order" ||
    mode === "pre-order" ||
    mode === "pre_order" ||
    mode === "waiting preorder" ||
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

  const flags = [
    item?.isPreorder,
    item?.preorder,
    item?.preOrder,
    item?.preorderOnly,
    item?.preorderActive,
    item?.meta?.preorder,
    item?.meta?.isPreorder,
    item?.meta?.preOrder,
    item?.meta?.preorderOnly,
    item?.meta?.preorderActive,
    item?.product?.preorder,
    item?.product?.isPreorder,
    item?.product?.preOrder,
    item?.product?.preorderOnly,
    item?.product?.preorderActive,
    getNested(item, "product.meta.preorder"),
    getNested(item, "product.meta.isPreorder"),
    getNested(item, "product.meta.preOrder"),
    getNested(item, "product.meta.preorderOnly"),
    getNested(item, "product.meta.preorderActive"),
    getNested(item, "product.flags.preorder"),
    getNested(item, "product.flags.preOrder"),
  ];

  if (flags.some(truthyFlag)) return true;

  return extractLineTexts(item).some(hasPreorderKeyword);
}

function detectLineMode(item) {
  if (isLineNotify(item)) return "notify";
  if (isLinePreorder(item)) return "preorder";
  return "buy";
}

function lineLabel(item, keys = [], fallback = "") {
  for (const key of keys) {
    const value =
      item?.[key] ??
      item?.meta?.[key] ??
      item?.product?.[key] ??
      getNested(item, `product.meta.${key}`) ??
      "";
    const s = cleanString(value || "", 320);
    if (s) return s;
  }

  return fallback;
}

function decorateOrderItemsForFlow(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const lineMode = detectLineMode(item);
    const preorder = lineMode === "preorder";
    const notify = lineMode === "notify";
    const qty = normalizeLineQty(item);
    const priceSEK = normalizeLinePriceSek(item);

    const preorderLabel = lineLabel(item, [
      "preorderLabel",
      "preOrderLabel",
      "preorderBadge",
      "availabilityLabel",
    ]);
    const preorderNote = lineLabel(item, [
      "preorderNote",
      "preOrderNote",
      "preorderText",
      "availabilityText",
    ]);
    const notifyLabel = lineLabel(item, [
      "notifyLabel",
      "backInStockLabel",
      "availabilityLabel",
    ]);
    const notifyNote = lineLabel(item, [
      "notifyNote",
      "backInStockNote",
      "availabilityText",
    ]);

    return {
      ...item,
      qty,
      priceSEK,

      lineMode,
      ctaMode: lineMode,
      orderType: preorder ? "preorder" : notify ? "notify" : "standard",
      fulfillmentType: preorder
        ? "preorder"
        : notify
          ? "notify"
          : "ready_for_fulfillment",
      availabilityType: preorder ? "preorder" : notify ? "notify" : item?.availabilityType || "",
      fulfillmentStatus: preorder ? "pending" : notify ? "waiting_interest" : "accepted",

      reservationRequired: preorder,
      printfulEligible: !preorder && !notify,

      preorder,
      isPreorder: preorder,
      preOrder: preorder,
      preorderOnly: preorder || undefined,
      preorderActive: preorder || undefined,
      preorderLabel: preorder ? preorderLabel : item?.preorderLabel || "",
      preOrderLabel: preorder ? preorderLabel : item?.preOrderLabel || "",
      preorderNote: preorder ? preorderNote : item?.preorderNote || "",
      preOrderNote: preorder ? preorderNote : item?.preOrderNote || "",
      preorderText: preorder ? preorderNote : item?.preorderText || "",

      notifyOnly: notify,
      notifyMe: notify,
      notifyLabel: notify ? notifyLabel : item?.notifyLabel || "",
      notifyNote: notify ? notifyNote : item?.notifyNote || "",

      meta: {
        ...(item?.meta && typeof item.meta === "object" ? item.meta : {}),
        lineMode,
        ctaMode: lineMode,
        orderType: preorder ? "preorder" : notify ? "notify" : "standard",
        fulfillmentType: preorder ? "preorder" : notify ? "notify" : "ready_for_fulfillment",
        availabilityType: preorder ? "preorder" : notify ? "notify" : item?.availabilityType || "",
        preorder: preorder || undefined,
        isPreorder: preorder || undefined,
        preOrder: preorder || undefined,
        preorderLabel: preorder ? preorderLabel : undefined,
        preorderNote: preorder ? preorderNote : undefined,
        notifyOnly: notify || undefined,
        notifyMe: notify || undefined,
        notifyLabel: notify ? notifyLabel : undefined,
        notifyNote: notify ? notifyNote : undefined,
      },

      product:
        item?.product && typeof item.product === "object"
          ? {
              ...item.product,
              lineMode,
              ctaMode: lineMode,
              orderType: preorder ? "preorder" : notify ? "notify" : "standard",
              fulfillmentType: preorder ? "preorder" : notify ? "notify" : item.product.fulfillmentType,
              availabilityType: preorder ? "preorder" : notify ? "notify" : item.product.availabilityType,
              preorder: preorder || item.product.preorder || undefined,
              isPreorder: preorder || item.product.isPreorder || undefined,
              preOrder: preorder || item.product.preOrder || undefined,
              preorderOnly: preorder || item.product.preorderOnly || undefined,
              notifyOnly: notify || item.product.notifyOnly || undefined,
              notifyMe: notify || item.product.notifyMe || undefined,
            }
          : item?.product,
    };
  });
}

function getFlowDisplayStatus(flowType, t) {
  if (flowType === "mixed") {
    return t("checkoutSubmit.status.mixedRegistered", "Blandad order registrerad");
  }

  if (flowType === "preorder") {
    return t("checkoutSubmit.status.preorderReserved", "Förbeställning reserverad");
  }

  if (flowType === "notify_only") {
    return t("checkoutSubmit.status.notifyBlocked", "Bevaka-intresse registrerat");
  }

  return t("checkoutSubmit.status.orderRegistered", "Order registrerad");
}

function summarizeFlowFromItems(items, t) {
  const list = Array.isArray(items) ? items : [];
  const preorderLines = list.filter((it) => it?.lineMode === "preorder");
  const notifyLines = list.filter((it) => it?.lineMode === "notify");
  const buyLines = list.filter((it) => it?.lineMode === "buy");

  if (notifyLines.length && !preorderLines.length && !buyLines.length) {
    return {
      flowType: "notify_only",
      orderStatus: "notify_blocked",
      preorderStage: undefined,
      displayStatus: getFlowDisplayStatus("notify_only", t),
    };
  }

  if (preorderLines.length && buyLines.length) {
    return {
      flowType: "mixed",
      orderStatus: "mixed_pending",
      preorderStage: "partially_reserved",
      displayStatus: getFlowDisplayStatus("mixed", t),
    };
  }

  if (preorderLines.length) {
    return {
      flowType: "preorder",
      orderStatus: "preorder_reserved",
      preorderStage: "reserved",
      displayStatus: getFlowDisplayStatus("preorder", t),
    };
  }

  return {
    flowType: "standard",
    orderStatus: "accepted",
    preorderStage: undefined,
    displayStatus: getFlowDisplayStatus("standard", t),
  };
}

function buildPreorderMetaWithStage(preorderMeta, flowType, reservationCode, stage) {
  const isPreorderLike = flowType === "preorder" || flowType === "mixed";

  return {
    ...(preorderMeta || {}),
    hasPreorder: isPreorderLike || !!preorderMeta?.hasPreorder,
    hasNotifyOnly: flowType === "notify_only" || !!preorderMeta?.hasNotifyOnly,
    mixedCart: flowType === "mixed" || !!preorderMeta?.mixedCart,
    flowType: flowType || preorderMeta?.flowType || "standard",
    reservationCode: isPreorderLike ? reservationCode || undefined : undefined,
    stage: isPreorderLike ? stage || "reserved" : undefined,
  };
}

function buildFulfillmentSummary(items) {
  const list = Array.isArray(items) ? items : [];

  return {
    totalLines: list.length,
    buyLines: list.filter((it) => it?.lineMode === "buy").length,
    preorderLines: list.filter((it) => it?.lineMode === "preorder").length,
    notifyLines: list.filter((it) => it?.lineMode === "notify").length,
    printfulReadyLines: list.filter((it) => it?.printfulEligible).length,
    waitingLines: list.filter((it) => !it?.printfulEligible).length,
  };
}

function getRuntimeMode() {
  return IS_PREVIEW ? "preview" : "live_no_payment";
}

function getRuntimePaymentStatus() {
  return IS_PREVIEW ? "preview" : "not_charged";
}

function getRuntimeSource() {
  return IS_PREVIEW ? "store-preview" : "store-live-no-payment";
}

function shouldAllowLocalOrderFallback() {
  return true;
}

async function safeAsync(label, fn) {
  try {
    const result = await fn();
    return result || { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: cleanString(error?.message || `${label}_failed`, 300),
      detail: error,
    };
  }
}

function readLs(key) {
  try {
    if (typeof window === "undefined") return "";
    return cleanString(window.localStorage.getItem(key) || "", 500);
  } catch {
    return "";
  }
}

function readLsJson(key) {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeCode(value) {
  return cleanString(value || "", 160)
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 160);
}

function pickFirst(...values) {
  for (const value of values) {
    const v = cleanString(value || "", 300);
    if (v) return v;
  }

  return "";
}

function inferAttributionOwnerLocal({
  associateCode,
  ambassadorCode,
  partnerCode,
  referralCode,
  creatorCode,
  affiliateCode,
  sourceChannel,
  trafficSource,
}) {
  const source = `${sourceChannel || ""} ${trafficSource || ""}`.toLowerCase();

  if (source.includes("creator") || creatorCode) return "creator";
  if (source.includes("affiliate") || affiliateCode) return "affiliate";

  if (
    source.includes("associate") ||
    source.includes("ambassador") ||
    source.includes("partner") ||
    source.includes("referral") ||
    associateCode ||
    ambassadorCode ||
    partnerCode ||
    referralCode
  ) {
    return "associate";
  }

  return "calestra";
}

function inferThirdPartyTypeLocal({ attributionOwner, sourceChannel, trafficSource }) {
  const owner = cleanString(attributionOwner || "", 80).toLowerCase();
  const source = `${sourceChannel || ""} ${trafficSource || ""}`.toLowerCase();

  if (source.includes("creator") || owner === "creator") return "creator";
  if (source.includes("affiliate") || owner === "affiliate") return "affiliate";
  if (source.includes("ambassador")) return "ambassador";
  if (source.includes("partner")) return "partner";
  if (source.includes("referral")) return "referral";
  if (source.includes("associate") || owner === "associate") return "associate";

  return owner && owner !== "calestra" ? owner : "";
}

function buildSafeCoreMeta(coreMeta, affiliate) {
  const base = coreMeta && typeof coreMeta === "object" ? coreMeta : {};
  const stored =
    readLsJson("cw.checkout.attribution") ||
    readLsJson("cw.attribution") ||
    readLsJson("cw.referral") ||
    {};

  const affiliateId = normalizeCode(
    pickFirst(
      base.affiliateId,
      base.affiliate_id,
      stored.affiliateId,
      stored.affiliate_id,
      readLs("cw.affiliateId"),
      normalizeAffiliateInput(affiliate)
    )
  );

  const affiliateCode = normalizeCode(
    pickFirst(
      base.affiliateCode,
      base.affiliate_code,
      base.affiliateReferralCode,
      stored.affiliateCode,
      stored.affiliate_code,
      stored.affiliateReferralCode,
      readLs("cw.affiliateCode")
    )
  );

  const creatorId = normalizeCode(
    pickFirst(
      base.creatorId,
      base.creator_id,
      stored.creatorId,
      stored.creator_id,
      readLs("cw.creatorId")
    )
  );

  const creatorCode = normalizeCode(
    pickFirst(
      base.creatorCode,
      base.creator_code,
      stored.creatorCode,
      stored.creator_code,
      readLs("cw.creatorCode")
    )
  );

  const associateId = normalizeCode(
    pickFirst(
      base.associateId,
      base.associate_id,
      stored.associateId,
      stored.associate_id,
      readLs("cw.associateId")
    )
  );

  const associateCode = normalizeCode(
    pickFirst(
      base.associateCode,
      base.associate_code,
      stored.associateCode,
      stored.associate_code,
      readLs("cw.associateCode")
    )
  );

  const ambassadorCode = normalizeCode(
    pickFirst(
      base.ambassadorCode,
      base.ambassador_code,
      stored.ambassadorCode,
      stored.ambassador_code,
      readLs("cw.ambassadorCode"),
      associateCode
    )
  );

  const partnerCode = normalizeCode(
    pickFirst(
      base.partnerCode,
      base.partner_code,
      stored.partnerCode,
      stored.partner_code,
      readLs("cw.partnerCode"),
      associateCode,
      creatorCode,
      affiliateCode
    )
  );

  const referralCode = normalizeCode(
    pickFirst(
      base.referralCode,
      base.referral_code,
      stored.referralCode,
      stored.referral_code,
      readLs("cw.referralCode"),
      partnerCode
    )
  );

  const rewardCode = normalizeCode(
    pickFirst(
      base.rewardCode,
      base.reward_code,
      stored.rewardCode,
      stored.reward_code,
      readLs("cw.rewardCode"),
      partnerCode,
      referralCode,
      associateCode,
      ambassadorCode,
      creatorCode,
      affiliateCode
    )
  );

  const campaignId = normalizeCode(
    pickFirst(
      base.campaignId,
      base.campaign_id,
      stored.campaignId,
      stored.campaign_id,
      readLs("cw.campaignId")
    )
  );

  const sourceChannel = cleanString(
    pickFirst(
      base.sourceChannel,
      base.source_channel,
      stored.sourceChannel,
      stored.source_channel,
      readLs("cw.sourceChannel"),
      associateCode || ambassadorCode || partnerCode || referralCode
        ? "associate"
        : creatorCode
          ? "creator"
          : affiliateCode || affiliateId
            ? "affiliate"
            : "store"
    ),
    120
  );

  const trafficSource = cleanString(
    pickFirst(
      base.trafficSource,
      base.traffic_source,
      stored.trafficSource,
      stored.traffic_source,
      readLs("cw.trafficSource"),
      sourceChannel
    ),
    120
  );

  const entryPoint = cleanString(
    pickFirst(
      base.entryPoint,
      base.entry_point,
      stored.entryPoint,
      stored.entry_point,
      readLs("cw.entryPoint"),
      "checkout"
    ),
    120
  );

  const attributionOwner = cleanString(
    pickFirst(
      base.attributionOwner,
      base.attribution_owner,
      stored.attributionOwner,
      stored.attribution_owner,
      inferAttributionOwnerLocal({
        associateCode,
        ambassadorCode,
        partnerCode,
        referralCode,
        creatorCode,
        affiliateCode,
        sourceChannel,
        trafficSource,
      })
    ),
    80
  );

  const thirdPartyType = cleanString(
    pickFirst(
      base.thirdPartyType,
      base.third_party_type,
      stored.thirdPartyType,
      stored.third_party_type,
      inferThirdPartyTypeLocal({ attributionOwner, sourceChannel, trafficSource })
    ),
    80
  );

  const rewardReady = Boolean(
    base.rewardReady ||
      base.reward_ready ||
      stored.rewardReady ||
      stored.reward_ready ||
      rewardCode
  );

  return {
    ...base,

    affiliateId,
    affiliateCode,
    affiliateReferralCode: affiliateCode,

    creatorId,
    creatorCode,

    associateId,
    associateCode,
    ambassadorCode,

    partnerCode,
    referralCode,
    rewardCode,
    rewardReady,

    campaignId,
    sourceChannel,
    trafficSource,
    entryPoint,
    attributionOwner,
    thirdPartyType,

    attribution: {
      ...(base.attribution || {}),
      ...(stored.attribution || {}),
      utmSource: cleanString(
        base?.attribution?.utmSource ||
          stored?.attribution?.utmSource ||
          stored?.utmSource ||
          stored?.utm_source ||
          readLs("cw.utm.source") ||
          "",
        120
      ),
      utmMedium: cleanString(
        base?.attribution?.utmMedium ||
          stored?.attribution?.utmMedium ||
          stored?.utmMedium ||
          stored?.utm_medium ||
          readLs("cw.utm.medium") ||
          "",
        120
      ),
      utmCampaign: cleanString(
        base?.attribution?.utmCampaign ||
          stored?.attribution?.utmCampaign ||
          stored?.utmCampaign ||
          stored?.utm_campaign ||
          readLs("cw.utm.campaign") ||
          "",
        160
      ),
      utmContent: cleanString(
        base?.attribution?.utmContent ||
          stored?.attribution?.utmContent ||
          stored?.utmContent ||
          stored?.utm_content ||
          readLs("cw.utm.content") ||
          "",
        160
      ),
      utmTerm: cleanString(
        base?.attribution?.utmTerm ||
          stored?.attribution?.utmTerm ||
          stored?.utmTerm ||
          stored?.utm_term ||
          readLs("cw.utm.term") ||
          "",
        160
      ),
    },
  };
}

function buildAttributionPayload(safeCoreMeta, affiliate) {
  return {
    affiliate: affiliate || null,
    affiliateId: safeCoreMeta.affiliateId || normalizeAffiliateInput(affiliate),
    affiliateCode: safeCoreMeta.affiliateCode || "",
    campaignId: safeCoreMeta.campaignId || "",
    creatorId: safeCoreMeta.creatorId || "",
    creatorCode: safeCoreMeta.creatorCode || "",
    associateId: safeCoreMeta.associateId || "",
    associateCode: safeCoreMeta.associateCode || "",
    ambassadorCode: safeCoreMeta.ambassadorCode || safeCoreMeta.associateCode || "",
    partnerCode: safeCoreMeta.partnerCode || "",
    referralCode: safeCoreMeta.referralCode || "",
    rewardCode: safeCoreMeta.rewardCode || "",
    rewardReady: !!safeCoreMeta.rewardReady,
    attributionOwner: safeCoreMeta.attributionOwner || "calestra",
    thirdPartyType: safeCoreMeta.thirdPartyType || "",
    trafficSource: safeCoreMeta.trafficSource || "",
    sourceChannel: safeCoreMeta.sourceChannel || "",
    entryPoint: safeCoreMeta.entryPoint || "",
  };
}

export async function submitCheckoutOrder({
  customer,
  shipping,
  billing,
  useSeparateBilling,
  anyPhysical,
  affiliate,
  campaign,
  discountMeta,
  coreMetaWithCampaign,
  dreamPointsMeta,
  preorderMeta,
  normalizedItems,
  draftId,
  totalsSEK,
  currency,
  allDigital,
  isPreorderFlow,
  isMixedFlow,
  subtotalSEKForPoints,
  awardOrderPoints,
  refresh,
  clear,
  navigate,
  displayTotals,
  safeTrack,
  trackPurchaseSuccess,
  t,
}) {
  const safeCampaign = campaign || {};
  const safeCoreMeta = buildSafeCoreMeta(coreMetaWithCampaign, affiliate);
  const safeDreamMeta = dreamPointsMeta || {};
  const attributionPayload = buildAttributionPayload(safeCoreMeta, affiliate);

  const normalizedTotalsSEK = normalizeTotalsForOrder({
    totalsSEK,
    displayTotals,
    discountMeta,
    anyPhysical,
    allDigital,
  });

  const safeDiscountMeta = normalizeDiscountMetaForOrder(discountMeta, normalizedTotalsSEK);

  const safeDisplayTotals = normalizeDisplayTotalsForOrder({
    displayTotals,
    normalizedTotalsSEK,
    discountMeta: safeDiscountMeta,
    currency,
    rates: {},
  });

  const orderId = `CW-${Date.now().toString(36).toUpperCase()}`;
  const decoratedItems = decorateOrderItemsForFlow(normalizedItems);
  const flowSummary = summarizeFlowFromItems(decoratedItems, t);

  const runtimeFlowType = isMixedFlow
    ? "mixed"
    : isPreorderFlow
      ? "preorder"
      : flowSummary.flowType;

  if (runtimeFlowType === "notify_only") {
    throw new Error(
      t(
        "checkout.notifyOnlyError",
        "Bevaka-produkter ska inte slutföras som checkout."
      )
    );
  }

  const reservationCode =
    runtimeFlowType === "preorder" || runtimeFlowType === "mixed"
      ? makeReservationCode(orderId)
      : "";

  const preorderMetaReserved = buildPreorderMetaWithStage(
    preorderMeta,
    runtimeFlowType,
    reservationCode,
    flowSummary.preorderStage
  );

  const runtimeMode = getRuntimeMode();
  const runtimePaymentStatus = getRuntimePaymentStatus();
  const runtimeSource = getRuntimeSource();

  saveCheckoutPrefillCustomer(customer);
  saveMemberShippingSnapshot(shipping, anyPhysical);
  saveMemberBillingSnapshot(billing, useSeparateBilling);

  const draftPayload = {
    action: "save",
    draftId,
    source: "store-classic",
    sourceChannel: safeCoreMeta.sourceChannel || "store",
    trafficSource: safeCoreMeta.trafficSource || "",
    entryPoint: safeCoreMeta.entryPoint || "checkout",
    lastStep: "checkout_submit",
    customer,
    shipping: anyPhysical ? shipping : {},
    billing: useSeparateBilling ? billing : {},
    currency,
    totalsSEK: normalizedTotalsSEK,
    displayTotals: safeDisplayTotals,
    anyPhysical,
    items: decoratedItems,

    userId: safeCoreMeta.userId || "",
    memberId: safeCoreMeta.memberId || "",
    memberTier: safeCoreMeta.memberTier || "",

    ...attributionPayload,

    campaign: safeCampaign,
    discountMeta: safeDiscountMeta,
    coreMeta: safeCoreMeta,
    dreamPointsMeta: safeDreamMeta,
    orderFlowType: runtimeFlowType,
    preorderMeta: preorderMetaReserved,
  };

  await safeAsync("save_checkout_draft", () => saveCheckoutDraft(draftPayload));

  saveCheckoutDraftSnapshot({
    draftId,
    email: cleanString(customer?.email || "", 160),
    customer,
    shipping: anyPhysical ? shipping : {},
    billing: useSeparateBilling ? billing : {},
    anyPhysical,
    useSeparateBilling,
    lastStep: "checkout_submit",
    itemCount: decoratedItems.length,
    items: decoratedItems,
    source: "store-classic",
    sourceChannel: safeCoreMeta.sourceChannel || "store",
    trafficSource: safeCoreMeta.trafficSource || "",
    entryPoint: safeCoreMeta.entryPoint || "checkout",
    totalsSEK: normalizedTotalsSEK,
    displayTotals: safeDisplayTotals,

    userId: safeCoreMeta.userId || "",
    memberId: safeCoreMeta.memberId || "",
    memberTier: safeCoreMeta.memberTier || "",

    ...attributionPayload,

    discountMeta: safeDiscountMeta,
    orderFlowType: runtimeFlowType,
    preorderMeta: preorderMetaReserved,
  });

  let order = {
    id: orderId,
    orderId,
    draftId,
    status: flowSummary.orderStatus,
    sourceType: "checkout",
    source: runtimeSource,
    paymentStatus: runtimePaymentStatus,
    isTest: true,
    mode: runtimeMode,
    createdAt: new Date().toISOString(),
    currency,
    totalsSEK: normalizedTotalsSEK,
    displayTotals: safeDisplayTotals,
    items: decoratedItems,
    allDigital,
    anyPhysical,
    customer,
    shipping: anyPhysical ? shipping : null,
    billing: useSeparateBilling ? billing : null,

    ...attributionPayload,

    campaign: safeCampaign,
    discountMeta: safeDiscountMeta,
    coreMeta: safeCoreMeta,
    core: safeCoreMeta,
    dreamPointsMeta: safeDreamMeta,
    dreamPoints: safeDreamMeta,
    orderFlowType: runtimeFlowType,
    preorderMeta: preorderMetaReserved,
    fulfillmentSummary: buildFulfillmentSummary(decoratedItems),
    preorderSystem:
      runtimeFlowType === "standard"
        ? { enabled: false }
        : {
            enabled: true,
            reservationCode,
            stage: flowSummary.preorderStage,
            displayStatus: flowSummary.displayStatus,
          },
    uiMeta: {
      flowType: runtimeFlowType,
      isPreorderFlow: runtimeFlowType === "preorder",
      isMixedFlow: runtimeFlowType === "mixed",
      statusLabel: flowSummary.orderStatus,
      displayStatus: flowSummary.displayStatus,
      ctaMode:
        runtimeFlowType === "preorder"
          ? "preorder"
          : runtimeFlowType === "mixed"
            ? "mixed"
            : "buy",
      freeShippingApplied: !!normalizedTotalsSEK.freeShippingApplied,
      discountCode: safeDiscountMeta.discountCode || "",
      discountAmountSek: safeDiscountMeta.discountAmountSek || 0,
      totalDiscountSek: safeDiscountMeta.totalDiscountSek || 0,
      shippingDiscountSek: safeDiscountMeta.shippingDiscountSek || 0,
      totalSek: normalizedTotalsSEK.totalSek,
    },
    recovery: {
      draftId,
      recoveredAt: new Date().toISOString(),
      source: "checkout_complete",
    },
  };

  const pointsAmountSek = Math.max(0, Number(subtotalSEKForPoints || 0));

  if (typeof awardOrderPoints === "function" && pointsAmountSek > 0) {
    const awardResult = await safeAsync("award_dreampoints", () =>
      Promise.resolve(awardOrderPoints(orderId, pointsAmountSek))
    );

    if (awardResult?.ok) {
      order = applyDreamAwardToOrder(order, awardResult, pointsAmountSek);
      if (typeof refresh === "function") refresh();
    }
  }

  upsertLocalOrder(order);

  const [ingestResult, registerResult] = await Promise.all([
    safeAsync("orders_ingest", () => postOrderIngest(order)),
    safeAsync("orders_register", () => postOrderRegister(order)),
  ]);

  const draftConvertResult = await safeAsync("draft_convert", () =>
    markCheckoutDraftRecovered(draftId, orderId)
  );

  const serverWriteOk = !!(ingestResult?.ok || registerResult?.ok);

  if (!serverWriteOk) {
    const diagnostics = {
      ingestResult,
      registerResult,
      draftConvertResult,
      orderRegisterUrl: ORDER_REGISTER_URL,
      ordersIngestUrl: ORDERS_INGEST_URL || "",
      mode: runtimeMode,
      paymentStatus: runtimePaymentStatus,
      source: runtimeSource,
      rewardCode: safeCoreMeta.rewardCode || "",
      rewardReady: !!safeCoreMeta.rewardReady,
      attributionOwner: safeCoreMeta.attributionOwner || "",
      thirdPartyType: safeCoreMeta.thirdPartyType || "",
      localFallbackAllowed: shouldAllowLocalOrderFallback(),
      freeShippingApplied: !!normalizedTotalsSEK.freeShippingApplied,
      discountCode: safeDiscountMeta.discountCode || "",
      totalDiscountSek: safeDiscountMeta.totalDiscountSek || 0,
      shippingDiscountSek: safeDiscountMeta.shippingDiscountSek || 0,
      totalSek: normalizedTotalsSEK.totalSek,
    };

    console.warn("[checkout] server write failed, order saved locally", diagnostics);

    order = {
      ...order,
      status:
        runtimeFlowType === "preorder"
          ? "preorder_reserved_local"
          : runtimeFlowType === "mixed"
            ? "mixed_pending_local"
            : "accepted_local",
      serverWrite: {
        ok: false,
        pendingRetry: true,
        ingestOk: !!ingestResult?.ok,
        registerOk: !!registerResult?.ok,
        error: buildServerWriteError(ingestResult, registerResult, undefined, t),
        diagnostics,
      },
      recovery: {
        ...(order.recovery || {}),
        pendingServerSync: true,
        source: "checkout_complete_local_fallback",
      },
    };

    upsertLocalOrder(order);
    writePendingServerOrder(order, diagnostics);
  } else {
    order = {
      ...order,
      serverWrite: {
        ok: true,
        pendingRetry: false,
        ingestOk: !!ingestResult?.ok,
        registerOk: !!registerResult?.ok,
      },
    };

    upsertLocalOrder(order);
    clearPendingServerOrder();
  }

  if (!draftConvertResult?.ok) {
    console.warn("[checkout] draft convert warning", draftConvertResult);
  }

  if (typeof safeTrack === "function") {
    safeTrack(trackPurchaseSuccess, {
      orderId,
      total: Number(safeDisplayTotals?.total ?? normalizedTotalsSEK?.totalSek ?? 0),
      currency,

      ...attributionPayload,

      campaignKey: safeCampaign.key || "",
      campaignTheme: safeCampaign.theme || "",
      memberTier: safeCoreMeta.memberTier || "",
      pendingDiscount: !!safeDiscountMeta.hasPendingDiscount,
      discountCode: safeDiscountMeta.discountCode || "",
      discountPercent: safeDiscountMeta.discountPercent || 0,
      discountAmountSek: safeDiscountMeta.discountAmountSek || 0,
      totalDiscountSek: safeDiscountMeta.totalDiscountSek || 0,
      shippingDiscountSek: safeDiscountMeta.shippingDiscountSek || 0,
      freeShippingApplied: !!normalizedTotalsSEK.freeShippingApplied,
      activeDiscountCount: safeDiscountMeta.activeDiscountCount || 0,
      activeVipCount: safeDiscountMeta.activeVipCount || 0,
      dreamPointsEarned: Number(order?.dreamPointsEarned || order?.dreamPointsMeta?.earned || 0),
      dreamPointsLevel: String(order?.dreamPointsLevel || order?.dreamPointsMeta?.level || ""),
      serverWrite: {
        ok: !!serverWriteOk,
        pendingRetry: !serverWriteOk,
        ingestOk: !!ingestResult?.ok,
        registerOk: !!registerResult?.ok,
      },
      mode: runtimeMode,
      paymentStatus: runtimePaymentStatus,
      source: runtimeSource,
      isTest: true,
      orderFlowType: runtimeFlowType,
      preorderCount: preorderMetaReserved?.preorderCount || 0,
      preorderQty: preorderMetaReserved?.preorderQty || 0,
      hasPreorder: !!preorderMetaReserved?.hasPreorder,
      mixedCart: runtimeFlowType === "mixed",
      reservationCode: reservationCode || "",
      items: decoratedItems.map((it) => ({
        id: it?.id || it?.product?.id || "",
        qty: normalizeLineQty(it),
        priceSEK: normalizeLinePriceSek(it),
        isPreorder: it?.lineMode === "preorder",
        notifyOnly: it?.lineMode === "notify",
        lineMode: it?.lineMode || "buy",
        fulfillmentType: it?.fulfillmentType || "",
        availabilityType: it?.availabilityType || "",
        fulfillmentStatus: it?.fulfillmentStatus || "",
        printfulEligible: !!it?.printfulEligible,
      })),
    });
  }

  writeLocalJson(PURCHASE_TRACKED_KEY, {
    ...(readLocalJson(PURCHASE_TRACKED_KEY, {}) || {}),
    [orderId]: true,
  });

  clearDraftId();
  clearCheckoutDraftSnapshot();

  if (typeof clear === "function") clear();

  const thanksQuery = new URLSearchParams();

  if (runtimeFlowType === "preorder") thanksQuery.set("flow", "preorder");
  if (runtimeFlowType === "mixed") thanksQuery.set("flow", "mixed");
  if (IS_PREVIEW) thanksQuery.set("mode", "preview");
  if (!serverWriteOk) thanksQuery.set("sync", "pending");
  if (reservationCode) thanksQuery.set("reservation", reservationCode);

  const qs = thanksQuery.toString();

  navigate(
    qs
      ? `/thanks/${encodeURIComponent(orderId)}?${qs}`
      : `/thanks/${encodeURIComponent(orderId)}`,
    { replace: true }
  );

  return { ok: true, orderId, order, serverWriteOk };
}

export function handleCheckoutSubmitError({
  err,
  safeTrack,
  trackPurchaseFail,
  coreMetaWithCampaign,
  campaign,
  affiliate,
  preorderMeta,
  setErrors,
  t,
  draftId,
  customer,
  shipping,
  billing,
  anyPhysical,
  useSeparateBilling,
  normalizedItems,
}) {
  const safeCoreMeta = buildSafeCoreMeta(coreMetaWithCampaign, affiliate);
  const safeCampaign = campaign || {};
  const attributionPayload = buildAttributionPayload(safeCoreMeta, affiliate);

  console.error("[checkout] place order failed", err);

  if (typeof safeTrack === "function") {
    safeTrack(trackPurchaseFail, {
      step: "submit_order",
      reason: String(err?.message || "unknown_error"),
      campaignId: safeCoreMeta.campaignId || "",
      campaignKey: safeCampaign.key || "",

      ...attributionPayload,

      memberTier: safeCoreMeta.memberTier || "",
      orderFlowType: preorderMeta?.flowType,
      preorderCount: preorderMeta?.preorderCount || 0,
      preorderQty: preorderMeta?.preorderQty || 0,
      hasPreorder: !!preorderMeta?.hasPreorder,
      hasNotifyOnly: !!preorderMeta?.hasNotifyOnly,
      notifyOnlyCount: preorderMeta?.notifyOnlyCount || 0,
      mixedCart: !!preorderMeta?.mixedCart,
    });
  }

  setErrors((m) => ({
    ...m,
    submit:
      String(err?.message || "").trim() ||
      t("checkout.error", "Kunde inte genomföra köpet."),
  }));

  saveCheckoutDraftSnapshot({
    draftId,
    email: cleanString(customer?.email || "", 160),
    customer,
    shipping: anyPhysical ? shipping : {},
    billing: useSeparateBilling ? billing : {},
    anyPhysical,
    useSeparateBilling,
    lastStep: "checkout_error",
    error: cleanString(err?.message || "checkout_failed", 300),
    itemCount: Array.isArray(normalizedItems) ? normalizedItems.length : 0,
    items: Array.isArray(normalizedItems)
      ? decorateOrderItemsForFlow(normalizedItems)
      : [],
    source: "store-classic",
    sourceChannel: safeCoreMeta.sourceChannel || "store",
    trafficSource: safeCoreMeta.trafficSource || "",
    entryPoint: safeCoreMeta.entryPoint || "checkout",

    ...attributionPayload,

    orderFlowType: preorderMeta?.flowType,
    preorderMeta: {
      ...(preorderMeta || {}),
      stage:
        preorderMeta?.flowType === "preorder" || preorderMeta?.flowType === "mixed"
          ? "checkout_error"
          : undefined,
    },
  });
}