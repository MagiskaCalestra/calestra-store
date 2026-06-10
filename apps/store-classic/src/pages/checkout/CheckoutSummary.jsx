// D:\WebProjects\Calestra\apps\store-classic\src\pages\checkout\CheckoutSummary.jsx
// apps/store-classic/src/pages/checkout/CheckoutSummary.jsx

import React from "react";
import { TT } from "../../i18n/tt.js";

function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function interpolateText(value, vars = {}) {
  let out = value == null ? "" : String(value);

  Object.entries(vars || {}).forEach(([key, val]) => {
    out = out.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(val ?? ""));
  });

  return out;
}

function tx(i18n, t, key, fallbackByLang, opts) {
  return interpolateText(TT(i18n, t, key, fallbackByLang, opts), opts);
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
    "waiting_preorder",
    "waiting-preorder",
    "waiting preorder",
    "notify",
    "notify_me",
    "notify-me",
    "notify me",
    "notify only",
    "notify-only",
    "notify_only",
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
    return String(path || "")
      .split(".")
      .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
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
    item?.availability,
    item?.availabilityType,
    item?.availabilityLabel,
    item?.availabilityText,
    item?.fulfillmentType,
    item?.fulfilmentType,
    item?.fulfillment,
    item?.fulfilment,
    item?.fulfillmentStatus,
    item?.status,
    item?.badge,
    item?.variant,
    item?.variantTitle,
    item?.title,
    item?.name,
    item?.slug,
    item?.handle,
    item?.sku,
    item?.category,
    item?.type,

    item?.product?.lineMode,
    item?.product?.orderType,
    item?.product?.ctaMode,
    item?.product?.availability,
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
    item?.product?.category,
    item?.product?.type,

    item?.meta?.lineMode,
    item?.meta?.orderType,
    item?.meta?.ctaMode,
    item?.meta?.availabilityType,
    item?.meta?.availabilityLabel,
    item?.meta?.availabilityText,
    item?.meta?.fulfillmentType,
    item?.meta?.fulfillmentStatus,
    item?.meta?.label,
    item?.meta?.statusLabel,
    item?.meta?.badge,
    item?.meta?.status,
    item?.meta?.category,
    item?.meta?.type,

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
    s.includes("coming soon") ||
    s.includes("launch only") ||
    s.includes("first drop") ||
    s.includes("first wave") ||
    s.includes("on siparis") ||
    s.includes("ön sipariş")
  );
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

function getDirectMode(item) {
  return normalizeSearchText(
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
      getNested(item, "product.meta.lineMode") ||
      getNested(item, "product.meta.orderType") ||
      getNested(item, "product.meta.ctaMode") ||
      getNested(item, "product.meta.fulfillmentType") ||
      getNested(item, "product.meta.availabilityType") ||
      ""
  );
}

function detectNotifyItem(item) {
  if (!item || typeof item !== "object") return false;

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
    mode === "back_in_stock" ||
    mode === "watch only" ||
    mode === "watch-only" ||
    mode === "watch_only"
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

    item?.product?.notifyOnly,
    item?.product?.notifyMe,
    item?.product?.notify_me,
    item?.product?.backInStockOnly,
    item?.product?.watchOnly,

    item?.meta?.notifyOnly,
    item?.meta?.notifyMe,
    item?.meta?.notify_me,
    item?.meta?.backInStockOnly,
    item?.meta?.watchOnly,

    getNested(item, "product.meta.notifyOnly"),
    getNested(item, "product.meta.notifyMe"),
    getNested(item, "product.meta.backInStockOnly"),
    getNested(item, "product.flags.notifyOnly"),
    getNested(item, "product.flags.notifyMe"),
    getNested(item, "product.flags.backInStockOnly"),
  ];

  if (candidates.some(truthyFlag)) return true;

  return extractLineTexts(item).some(hasNotifyKeyword);
}

function detectPreorderItem(item) {
  if (!item || typeof item !== "object") return false;

  const mode = getDirectMode(item);

  if (
    mode === "preorder" ||
    mode === "pre order" ||
    mode === "pre-order" ||
    mode === "pre_order" ||
    mode === "waiting preorder" ||
    mode === "waiting_preorder" ||
    mode === "waiting-preorder"
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
    item?.preorderActive,
    item?.comingSoon,
    item?.launchOnly,
    item?.reservationRequired,

    item?.product?.preorder,
    item?.product?.preOrder,
    item?.product?.isPreorder,
    item?.product?.isPreOrder,
    item?.product?.preorderOnly,
    item?.product?.preOrderOnly,
    item?.product?.preorderActive,
    item?.product?.comingSoon,
    item?.product?.launchOnly,

    item?.meta?.preorder,
    item?.meta?.preOrder,
    item?.meta?.isPreorder,
    item?.meta?.isPreOrder,
    item?.meta?.preorderOnly,
    item?.meta?.preorderActive,
    item?.meta?.comingSoon,
    item?.meta?.launchOnly,

    getNested(item, "product.meta.preorder"),
    getNested(item, "product.meta.preOrder"),
    getNested(item, "product.meta.isPreorder"),
    getNested(item, "product.meta.preorderOnly"),
    getNested(item, "product.meta.preorderActive"),
    getNested(item, "product.flags.preorder"),
    getNested(item, "product.flags.preOrder"),
  ];

  if (candidates.some(truthyFlag)) return true;

  return extractLineTexts(item).some(hasPreorderKeyword);
}

function detectLineMode(item) {
  if (detectNotifyItem(item)) return "notify";
  if (detectPreorderItem(item)) return "preorder";
  return "buy";
}

function normalizeLineKey(item, idx = 0) {
  return cleanString(
    item?.lineKey ||
      item?.variantKey ||
      item?.id ||
      item?.product?.id ||
      item?.product?.slug ||
      item?.slug ||
      `line_${idx}`,
    240
  );
}

function getItemTitle(item, t) {
  return cleanString(
    item?.title ||
      item?.name ||
      item?.product?.title ||
      item?.product?.name ||
      t("checkout.itemFallback", "Produkt"),
    220
  );
}

function getItemImage(item) {
  return (
    item?.image ||
    item?.images?.[0]?.image ||
    item?.images?.[0]?.src ||
    item?.product?.image ||
    item?.product?.images?.[0]?.image ||
    item?.product?.images?.[0]?.src ||
    "/images/no-image.png"
  );
}

function getQty(item) {
  const n = Number(item?.qty ?? item?.quantity ?? 1);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function getUnitActive(item, currency, rates) {
  const activeRate = Number(rates?.[currency] || 1);
  const priceSEK = Number(item?.priceSEK ?? item?.price ?? item?.product?.price ?? 0);
  const value = priceSEK * activeRate;
  return Number.isFinite(value) ? value : 0;
}

function getVisibleMeta(coreMetaWithCampaign = {}, i18n, t) {
  const labels = {
    tier: TT(i18n, t, "checkout.meta.labels.tier", {
      sv: "Nivå",
      en: "Tier",
      tr: "Seviye",
    }),
    campaign: TT(i18n, t, "checkout.meta.labels.campaign", {
      sv: "Kampanj",
      en: "Campaign",
      tr: "Kampanya",
    }),
    creator: TT(i18n, t, "checkout.meta.labels.creator", {
      sv: "Creator",
      en: "Creator",
      tr: "Creator",
    }),
    affiliate: TT(i18n, t, "checkout.meta.labels.affiliate", {
      sv: "Affiliate",
      en: "Affiliate",
      tr: "Affiliate",
    }),
    associate: TT(i18n, t, "checkout.meta.labels.associate", {
      sv: "Associate",
      en: "Associate",
      tr: "Associate",
    }),
    code: TT(i18n, t, "checkout.meta.labels.code", {
      sv: "Kod",
      en: "Code",
      tr: "Kod",
    }),
    owner: TT(i18n, t, "checkout.meta.labels.owner", {
      sv: "Ägare",
      en: "Owner",
      tr: "Sahip",
    }),
    type: TT(i18n, t, "checkout.meta.labels.type", {
      sv: "Typ",
      en: "Type",
      tr: "Tür",
    }),
    channel: TT(i18n, t, "checkout.meta.labels.channel", {
      sv: "Kanal",
      en: "Channel",
      tr: "Kanal",
    }),
  };

  return [
    coreMetaWithCampaign.memberTier
      ? `${labels.tier}: ${cleanString(coreMetaWithCampaign.memberTier, 80)}`
      : "",
    coreMetaWithCampaign.campaignId
      ? `${labels.campaign}: ${cleanString(coreMetaWithCampaign.campaignId, 120)}`
      : "",
    coreMetaWithCampaign.creatorId
      ? `${labels.creator}: ${cleanString(coreMetaWithCampaign.creatorId, 120)}`
      : "",
    coreMetaWithCampaign.affiliateId
      ? `${labels.affiliate}: ${cleanString(coreMetaWithCampaign.affiliateId, 120)}`
      : "",
    coreMetaWithCampaign.associateId
      ? `${labels.associate}: ${cleanString(coreMetaWithCampaign.associateId, 120)}`
      : "",
    coreMetaWithCampaign.associateCode
      ? `${labels.code}: ${cleanString(coreMetaWithCampaign.associateCode, 120)}`
      : "",
    coreMetaWithCampaign.attributionOwner
      ? `${labels.owner}: ${cleanString(coreMetaWithCampaign.attributionOwner, 120)}`
      : "",
    coreMetaWithCampaign.thirdPartyType
      ? `${labels.type}: ${cleanString(coreMetaWithCampaign.thirdPartyType, 120)}`
      : "",
    coreMetaWithCampaign.sourceChannel
      ? `${labels.channel}: ${cleanString(coreMetaWithCampaign.sourceChannel, 120)}`
      : "",
  ].filter(Boolean);
}

function toActiveDiscountValue(sekValue, currency, rates) {
  const activeRate = Number(rates?.[currency] || 1);
  const n = Number(sekValue || 0);
  const value = n * activeRate;
  return Number.isFinite(value) ? value : 0;
}

function getPositiveNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return 0;
}

function getDiscountViewState({ discountMeta = {}, discountValidation = null, discountCodeInput = "" }) {
  const d = discountMeta && typeof discountMeta === "object" ? discountMeta : {};
  const validation = discountValidation && typeof discountValidation === "object" ? discountValidation : null;

  const discountCode = cleanString(
    d.discountCode ||
      d.manualCode ||
      d.code ||
      validation?.code ||
      discountCodeInput ||
      "",
    80
  );

  const shippingDiscountSek = getPositiveNumber(
    d.shippingDiscountSek,
    d.shippingDiscountSEK,
    d.freeShippingDiscountSek,
    d.freeShippingDiscountSEK
  );

  const freeShipping = !!(
    d.freeShipping ||
    d.manualFreeShipping ||
    d.campaignFreeShipping ||
    d.freeShippingApplied ||
    shippingDiscountSek > 0 ||
    d.discountType === "shipping" ||
    d.type === "shipping" ||
    d.type === "free_shipping"
  );

  const explicitItemDiscountSek = getPositiveNumber(
    d.itemDiscountSek,
    d.itemDiscountSEK,
    d.productDiscountSek,
    d.productDiscountSEK,
    d.manualItemDiscountSek,
    d.campaignItemDiscountSek
  );

  const genericDiscountSek = getPositiveNumber(
    d.discountSek,
    d.discountSEK,
    d.discountAmountSek,
    d.discountAmountSEK,
    d.manualDiscountAmountSek,
    d.campaignDiscountAmountSek
  );

  const totalDiscountSek = getPositiveNumber(
    d.totalDiscountSek,
    d.totalDiscountSEK,
    d.totalDiscountAmountSek,
    d.totalDiscountAmountSEK
  );

  let itemDiscountSek = explicitItemDiscountSek;

  if (!itemDiscountSek && totalDiscountSek > 0) {
    itemDiscountSek = Math.max(0, totalDiscountSek - shippingDiscountSek);
  }

  if (!itemDiscountSek && genericDiscountSek > 0) {
    const looksLikeShippingOnly =
      freeShipping &&
      shippingDiscountSek > 0 &&
      Math.abs(genericDiscountSek - shippingDiscountSek) < 0.01;

    itemDiscountSek = looksLikeShippingOnly ? 0 : genericDiscountSek;
  }

  return {
    discountCode,
    freeShipping,
    shippingDiscountSek,
    itemDiscountSek: Math.max(0, Number(itemDiscountSek || 0)),
    totalDiscountSek: Math.max(
      0,
      Number(totalDiscountSek || 0) || Number(itemDiscountSek || 0) + Number(shippingDiscountSek || 0)
    ),
  };
}

function getLineNote(item) {
  const mode = detectLineMode(item);

  if (mode === "preorder") {
    return cleanString(
      item?.preorderNote ||
        item?.preorderText ||
        item?.preOrderNote ||
        item?.availabilityText ||
        item?.meta?.preorderNote ||
        item?.meta?.preorderText ||
        item?.meta?.availabilityText ||
        item?.product?.preorderNote ||
        item?.product?.preorderText ||
        item?.product?.availabilityText ||
        "",
      220
    );
  }

  if (mode === "notify") {
    return cleanString(
      item?.notifyNote ||
        item?.backInStockNote ||
        item?.availabilityText ||
        item?.meta?.notifyNote ||
        item?.meta?.backInStockNote ||
        item?.meta?.availabilityText ||
        item?.product?.notifyNote ||
        item?.product?.backInStockNote ||
        item?.product?.availabilityText ||
        "",
      220
    );
  }

  return "";
}

export default function CheckoutSummary({
  t,
  i18n,
  items = [],
  currency,
  rates,
  points,
  anyPhysical,
  preorderMeta,
  isPreorderFlow,
  displayTotals,
  progress,
  dreamPreview,
  campaign,
  discountMeta,
  coreMetaWithCampaign,
  labels,
  disabledCTA,
  IS_PREVIEW,
  handlePlaceOrder,
  money,

  discountCodeInput = "",
  discountBusy = false,
  discountValidation = null,
  discountError = "",
  appliedDiscountSek = 0,
  setDiscountCodeInput,
  handleApplyDiscountCode,
  handleClearDiscountCode,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeCampaign = campaign || {};
  const safeDiscount = discountMeta || {};
  const safeCoreMeta = coreMetaWithCampaign || {};
  const safeLabels = labels || {};
  const safeTotals = displayTotals || { subtotal: 0, shipping: 0, total: 0 };
  const safeProgress = progress || {
    isFree: true,
    remainingSEK: 0,
    thresholdSEK: 0,
    remainingActive: 0,
  };

  function Money({ value }) {
    return <span>{typeof money === "function" ? money(value) : String(value ?? 0)}</span>;
  }

  const lineModes = safeItems.map(detectLineMode);
  const preorderLines = lineModes.filter((mode) => mode === "preorder").length;
  const notifyLines = lineModes.filter((mode) => mode === "notify").length;
  const buyLines = lineModes.filter((mode) => mode === "buy").length;

  const detectedPreorderCount = preorderLines;
  const preorderQty =
    Number(preorderMeta?.preorderQty || 0) ||
    safeItems.reduce((sum, item, idx) => {
      return lineModes[idx] === "preorder" ? sum + getQty(item) : sum;
    }, 0);

  const notifyQty = safeItems.reduce((sum, item, idx) => {
    return lineModes[idx] === "notify" ? sum + getQty(item) : sum;
  }, 0);

  const hasPreorder =
    !!preorderMeta?.hasPreorder || !!isPreorderFlow || detectedPreorderCount > 0;

  const hasNotify = !!preorderMeta?.hasNotifyOnly || notifyLines > 0;

  const mixedCart =
    !!preorderMeta?.mixedCart || (!!hasPreorder && preorderLines > 0 && buyLines > 0);

  const notifyOnly = hasNotify && notifyLines > 0 && buyLines === 0 && preorderLines === 0;

  const flowType = notifyOnly
    ? "notify_only"
    : mixedCart
      ? "mixed"
      : hasPreorder
        ? "preorder"
        : "standard";

  const maxRedeemActive = Number(
    dreamPreview?.maxRedeemActive ??
      Number(dreamPreview?.maxRedeemSek || 0) * Number(rates?.[currency] || 1)
  );

  const progressPercent = !safeProgress.isFree
    ? Math.min(
        100,
        Math.max(
          0,
          (1 -
            Number(safeProgress.remainingSEK || 0) /
              Number(safeProgress.thresholdSEK || 1)) *
            100
        )
      )
    : 100;

  const metaChips = getVisibleMeta(safeCoreMeta, i18n, t);

  const discountView = getDiscountViewState({
    discountMeta: safeDiscount,
    discountValidation,
    discountCodeInput,
  });

  const activeDiscountSek = discountView.itemDiscountSek;
  const activeShippingDiscountSek = discountView.shippingDiscountSek;
  const activeDiscountValue = toActiveDiscountValue(activeDiscountSek, currency, rates);
  const activeDiscountCode = discountView.discountCode;

  const showDiscountAmount = activeDiscountValue > 0;
  const showFreeShippingCodeBenefit =
    anyPhysical &&
    discountView.freeShipping &&
    activeDiscountCode &&
    activeShippingDiscountSek > 0 &&
    !showDiscountAmount;

  const showCampaignBox =
    safeCampaign.key ||
    safeCampaign.title ||
    safeCampaign.theme ||
    safeCampaign.mode ||
    Number(safeDiscount.activeDiscountCount || 0) > 0 ||
    Number(safeDiscount.activeVipCount || 0) > 0 ||
    safeDiscount.discountCode ||
    safeDiscount.manualCode ||
    Number(safeDiscount.discountPercent || 0) > 0 ||
    activeDiscountSek > 0 ||
    discountView.freeShipping;

  const showMetaBox = metaChips.length > 0;

  const preorderTitle =
    flowType === "mixed"
      ? TT(i18n, t, "checkout.preorder.boxTitleMixed", {
          sv: "Blandad order",
          en: "Mixed order",
          tr: "Karma sipariş",
        })
      : TT(i18n, t, "checkout.preorder.boxTitle", {
          sv: "Förbeställning aktiv",
          en: "Pre-order active",
          tr: "Ön sipariş aktif",
        });

  const preorderLead =
    flowType === "mixed"
      ? TT(i18n, t, "checkout.preorder.boxLeadMixed", {
          sv: "Din order innehåller både vanliga produkter och förbeställningar. Förbeställda rader markeras tydligt och följer med till admin och uppföljning.",
          en: "Your order contains both regular products and pre-orders. Pre-order lines stay clearly marked for admin and follow-up.",
          tr: "Siparişiniz hem normal ürünler hem de ön siparişler içeriyor. Ön sipariş satırları yönetim ve takip için açık şekilde işaretlenir.",
        })
      : TT(i18n, t, "checkout.preorder.boxLead", {
          sv: "Minst en produkt reserveras nu och levereras i en senare produktionsvåg.",
          en: "At least one product is reserved now and delivered in a later production wave.",
          tr: "En az bir ürün şimdi rezerve edilir ve sonraki üretim dalgasında teslim edilir.",
        });

  const notifyTitle = TT(i18n, t, "checkout.notify.boxTitle", {
    sv: "Bevaka-läge aktivt",
    en: "Notify mode active",
    tr: "Bildirim modu aktif",
  });

  const notifyLead = TT(i18n, t, "checkout.notify.boxLead", {
    sv: "Den här korgen innehåller bevaka-produkter. Dessa ska inte gå vidare som vanlig order.",
    en: "This cart contains notify-me products. These should not continue as a regular order.",
    tr: "Bu sepet bildirim ürünleri içeriyor. Bunlar normal sipariş olarak devam etmemeli.",
  });

  const summaryKicker =
    flowType === "notify_only"
      ? TT(i18n, t, "checkout.summary.kickerNotify", {
          sv: "BEVAKA-LÄGE",
          en: "NOTIFY MODE",
          tr: "BİLDİRİM MODU",
        })
      : flowType === "mixed"
        ? TT(i18n, t, "checkout.summary.kickerMixed", {
            sv: "BLANDAD CHECKOUT",
            en: "MIXED CHECKOUT",
            tr: "KARMA CHECKOUT",
          })
        : hasPreorder
          ? TT(i18n, t, "checkout.summary.kickerPreorder", {
              sv: "FÖRBESTÄLLNING",
              en: "PRE-ORDER",
              tr: "ÖN SİPARİŞ",
            })
          : TT(i18n, t, "checkout.summary.kickerStandard", {
              sv: "HARMONIC STAR",
              en: "HARMONIC STAR",
              tr: "HARMONIC STAR",
            });

  const campaignLabels = {
    theme: TT(i18n, t, "checkout.campaign.labels.theme", {
      sv: "Tema",
      en: "Theme",
      tr: "Tema",
    }),
    mode: TT(i18n, t, "checkout.campaign.labels.mode", {
      sv: "Läge",
      en: "Mode",
      tr: "Mod",
    }),
    discounts: TT(i18n, t, "checkout.campaign.labels.discounts", {
      sv: "Rabatter",
      en: "Discounts",
      tr: "İndirimler",
    }),
    vip: TT(i18n, t, "checkout.campaign.labels.vip", {
      sv: "VIP",
      en: "VIP",
      tr: "VIP",
    }),
    code: TT(i18n, t, "checkout.campaign.labels.code", {
      sv: "Kod",
      en: "Code",
      tr: "Kod",
    }),
    pending: TT(i18n, t, "checkout.campaign.labels.pending", {
      sv: "väntande",
      en: "pending",
      tr: "bekliyor",
    }),
    freeShipping: TT(i18n, t, "checkout.campaign.labels.freeShipping", {
      sv: "Fri frakt",
      en: "Free shipping",
      tr: "Ücretsiz kargo",
    }),
  };

  const manualDiscountValid = !!discountValidation?.valid;
  const hasManualCode = !!cleanString(discountCodeInput || safeDiscount.manualCode || "", 80);

  return (
    <>
      <aside className="col summary-col">
        <section className="card summary-card" aria-labelledby="summary-title">
          <div className="summary-star" aria-hidden="true" />

          <div className="summary-topline">
            <span className="summary-kicker">{summaryKicker}</span>
          </div>

          <h2 id="summary-title" className="card-title">
            {TT(i18n, t, "checkout.summary.title", {
              sv: "Översikt",
              en: "Summary",
              tr: "Özet",
            })}
          </h2>

          {notifyOnly ? (
            <div className="preorder-box preorder-box--notify">
              <div className="preorder-box-head">
                <div className="preorder-box-title">{notifyTitle}</div>
                <div className="preorder-box-badge">{notifyQty || notifyLines || 1}</div>
              </div>

              <div className="preorder-box-lead">{notifyLead}</div>

              <div className="preorder-box-hint">
                {TT(i18n, t, "checkout.notify.boxHint", {
                  sv: "Gå tillbaka till produkten och använd bevaka-flödet i stället.",
                  en: "Go back to the product and use the notify flow instead.",
                  tr: "Ürüne geri dönüp bildirim akışını kullanın.",
                })}
              </div>
            </div>
          ) : hasPreorder ? (
            <div className={`preorder-box ${flowType === "mixed" ? "preorder-box--mixed" : ""}`}>
              <div className="preorder-box-head">
                <div className="preorder-box-title">{preorderTitle}</div>
                <div className="preorder-box-badge">{preorderQty || detectedPreorderCount || 1}</div>
              </div>

              <div className="preorder-box-lead">{preorderLead}</div>

              {flowType === "mixed" ? (
                <div className="preorder-box-hint">
                  {TT(i18n, t, "checkout.preorder.mixedHint", {
                    sv: "Vanliga produkter och förbeställningar kan hanteras i samma order, men leveranslogiken hålls separat.",
                    en: "Regular products and pre-orders can be handled in the same order, while fulfillment stays separate.",
                    tr: "Normal ürünler ve ön siparişler aynı siparişte işlenebilir, teslimat mantığı ayrı tutulur.",
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <ul className="mini-cart">
            {safeItems.map((it, idx) => {
              const qty = getQty(it);
              const lineActive = getUnitActive(it, currency, rates) * qty;
              const lineMode = lineModes[idx] || detectLineMode(it);
              const itemIsPreorder = lineMode === "preorder";
              const itemIsNotify = lineMode === "notify";
              const variantText = cleanString(it?.variantTitle || it?.variant || "", 120);
              const lineNote = getLineNote(it);

              return (
                <li
                  key={`${normalizeLineKey(it, idx)}__${idx}`}
                  className={`mini-item ${
                    itemIsPreorder ? "mini-item--preorder" : itemIsNotify ? "mini-item--notify" : ""
                  }`}
                >
                  <img src={getItemImage(it)} alt="" aria-hidden="true" className="mini-thumb" />

                  <div className="mini-info">
                    <div className="mini-title">{getItemTitle(it, t)}</div>

                    <div className="mini-meta">
                      <span>× {qty}</span>
                      {variantText ? <span>{variantText}</span> : null}

                      {itemIsPreorder ? (
                        <span className="mini-preorder-pill">
                          {TT(i18n, t, "checkout.preorder.pill", {
                            sv: "PRE-ORDER",
                            en: "PRE-ORDER",
                            tr: "ÖN SİPARİŞ",
                          })}
                        </span>
                      ) : null}

                      {itemIsNotify ? (
                        <span className="mini-notify-pill">
                          {TT(i18n, t, "checkout.notify.pill", {
                            sv: "BEVAKA",
                            en: "NOTIFY",
                            tr: "BİLDİR",
                          })}
                        </span>
                      ) : null}
                    </div>

                    {lineNote ? <div className="mini-line-note">{lineNote}</div> : null}
                  </div>

                  <div className="mini-price">
                    <Money value={lineActive} />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="divider" />

          <div className="summary-row">
            <span>
              {TT(i18n, t, "checkout.subtotal", {
                sv: "Delsumma",
                en: "Subtotal",
                tr: "Ara toplam",
              })}
            </span>
            <span>
              <Money value={safeTotals.subtotal} />
            </span>
          </div>

          {anyPhysical ? (
            <div className="summary-row">
              <span>
                {TT(i18n, t, "checkout.shippingFee", {
                  sv: "Frakt",
                  en: "Shipping",
                  tr: "Kargo",
                })}
              </span>
              <span>
                {Number(safeTotals.shipping || 0) === 0 ? (
                  TT(i18n, t, "checkout.free", {
                    sv: "Fri frakt",
                    en: "Free shipping",
                    tr: "Ücretsiz kargo",
                  })
                ) : (
                  <Money value={safeTotals.shipping} />
                )}
              </span>
            </div>
          ) : null}

          {showFreeShippingCodeBenefit ? (
            <div className="summary-row discount">
              <span>
                {TT(i18n, t, "checkout.discount.freeShippingCode", {
                  sv: "Kod",
                  en: "Code",
                  tr: "Kod",
                })}
                {activeDiscountCode ? ` (${activeDiscountCode})` : ""}
              </span>
              <span>
                {TT(i18n, t, "checkout.discount.freeShippingBenefit", {
                  sv: "Fri frakt",
                  en: "Free shipping",
                  tr: "Ücretsiz kargo",
                })}
              </span>
            </div>
          ) : null}

          {showDiscountAmount ? (
            <div className="summary-row discount">
              <span>
                {TT(i18n, t, "checkout.discount.row", {
                  sv: "Rabatt",
                  en: "Discount",
                  tr: "İndirim",
                })}
                {activeDiscountCode ? ` (${activeDiscountCode})` : ""}
              </span>
              <span>
                −<Money value={activeDiscountValue} />
              </span>
            </div>
          ) : null}

          <div className="divider" />

          <div className="summary-row total">
            <span>
              {TT(i18n, t, "checkout.total", {
                sv: "Totalt",
                en: "Total",
                tr: "Toplam",
              })}
            </span>
            <span>
              <Money value={safeTotals.total} />
            </span>
          </div>

          <div className="discount-box" aria-label={t("checkout.discount.aria", "Rabattkod")}>
            <div className="discount-box-title">
              {TT(i18n, t, "checkout.discount.title", {
                sv: "Rabattkod",
                en: "Discount code",
                tr: "İndirim kodu",
              })}
            </div>

            <div className="discount-box-lead">
              {TT(i18n, t, "checkout.discount.lead", {
                sv: "Koden kontrolleras mot rabattmotorn och sparas på ordern.",
                en: "The code is checked against the discount engine and saved on the order.",
                tr: "Kod indirim motorunda kontrol edilir ve siparişe kaydedilir.",
              })}
            </div>

            <div className="discount-row">
              <input
                className="input"
                value={discountCodeInput}
                onChange={(e) => {
                  if (typeof setDiscountCodeInput === "function") {
                    setDiscountCodeInput(String(e.target.value || "").toUpperCase());
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (typeof handleApplyDiscountCode === "function") handleApplyDiscountCode();
                  }
                }}
                placeholder={TT(i18n, t, "checkout.discount.placeholder", {
                  sv: "Har du en kod?",
                  en: "Have a code?",
                  tr: "Kodun var mı?",
                })}
                autoComplete="off"
                disabled={discountBusy}
              />

              <div className="discount-actions">
                <button
                  type="button"
                  className="discount-btn"
                  onClick={handleApplyDiscountCode}
                  disabled={discountBusy || !hasManualCode}
                >
                  {discountBusy
                    ? TT(i18n, t, "checkout.discount.checking", {
                        sv: "Kontrollerar…",
                        en: "Checking…",
                        tr: "Kontrol ediliyor…",
                      })
                    : TT(i18n, t, "checkout.discount.apply", {
                        sv: "Använd",
                        en: "Apply",
                        tr: "Uygula",
                      })}
                </button>

                {hasManualCode ? (
                  <button
                    type="button"
                    className="discount-btn secondary"
                    onClick={handleClearDiscountCode}
                    disabled={discountBusy}
                  >
                    {TT(i18n, t, "checkout.discount.clear", {
                      sv: "Rensa",
                      en: "Clear",
                      tr: "Temizle",
                    })}
                  </button>
                ) : null}
              </div>
            </div>

            {manualDiscountValid ? (
              <div className="discount-message ok" role="status" aria-live="polite">
                {showFreeShippingCodeBenefit
                  ? TT(i18n, t, "checkout.discount.freeShippingApproved", {
                      sv: "Rabattkoden är godkänd och ger fri frakt.",
                      en: "The discount code is approved and gives free shipping.",
                      tr: "İndirim kodu onaylandı ve ücretsiz kargo sağlar.",
                    })
                  : discountValidation?.message ||
                    TT(i18n, t, "checkout.discount.approved", {
                      sv: "Rabattkoden är godkänd.",
                      en: "The discount code is approved.",
                      tr: "İndirim kodu onaylandı.",
                    })}
              </div>
            ) : discountError ? (
              <div className="discount-message bad" role="alert" aria-live="polite">
                {discountError}
              </div>
            ) : null}
          </div>

          {!anyPhysical ? (
            <div className="digital-note">
              {TT(i18n, t, "checkout.digitalOnly", {
                sv: "Endast digitala produkter i ordern – ingen frakt tillkommer.",
                en: "Only digital products in the order – no shipping is added.",
                tr: "Siparişte yalnızca dijital ürünler var – kargo eklenmez.",
              })}
            </div>
          ) : (
            <div className="free-ship">
              {!safeProgress.isFree ? (
                <>
                  <div className="progress">
                    <div className="bar" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="progress-text">
                    {tx(
                      i18n,
                      t,
                      "checkout.progress.toFree",
                      {
                        sv: "{{amount}} kvar till fri frakt",
                        en: "{{amount}} left for free shipping",
                        tr: "Ücretsiz kargo için {{amount}} kaldı",
                      },
                      {
                        amount:
                          typeof money === "function"
                            ? money(safeProgress.remainingActive)
                            : safeProgress.remainingActive,
                      }
                    )}
                  </div>
                </>
              ) : (
                <div className="progress-success">
                  {TT(i18n, t, "checkout.progress.free", {
                    sv: "Du har fri frakt!",
                    en: "You have free shipping!",
                    tr: "Ücretsiz kargo kazandınız!",
                  })}
                </div>
              )}
            </div>
          )}

          {showCampaignBox ? (
            <details
              className="campaign-box"
              aria-label={TT(i18n, t, "checkout.campaign.aria", {
                sv: "Kampanjöversikt",
                en: "Campaign snapshot",
                tr: "Kampanya özeti",
              })}
            >
              <summary className="campaign-box-summary">
                <span>
                  {TT(i18n, t, "checkout.campaign.title", {
                    sv: "Aktiv kampanj",
                    en: "Active campaign",
                    tr: "Aktif kampanya",
                  })}
                </span>
                <b>{safeCampaign.key || "standard"}</b>
              </summary>

              <div className="campaign-box-lead">
                {safeCampaign.title ||
                  TT(i18n, t, "checkout.campaign.standard", {
                    sv: "Standard",
                    en: "Standard",
                    tr: "Standart",
                  })}
              </div>

              <div className="campaign-chip-grid">
                {safeCampaign.theme ? (
                  <div className="campaign-chip">
                    {campaignLabels.theme}: {safeCampaign.theme}
                  </div>
                ) : null}

                {safeCampaign.mode ? (
                  <div className="campaign-chip">
                    {campaignLabels.mode}: {safeCampaign.mode}
                  </div>
                ) : null}

                {Number(safeDiscount.activeDiscountCount || 0) > 0 ? (
                  <div className="campaign-chip">
                    {campaignLabels.discounts}: {safeDiscount.activeDiscountCount}
                  </div>
                ) : null}

                {Number(safeDiscount.activeVipCount || 0) > 0 ? (
                  <div className="campaign-chip">
                    {campaignLabels.vip}: {safeDiscount.activeVipCount}
                  </div>
                ) : null}

                {activeDiscountCode ? (
                  <div className="campaign-chip">
                    {campaignLabels.code}: {activeDiscountCode}
                  </div>
                ) : null}

                {Number(safeDiscount.discountPercent || 0) > 0 ? (
                  <div className="campaign-chip">
                    {safeDiscount.discountPercent}% {campaignLabels.pending}
                  </div>
                ) : null}

                {Number(activeDiscountSek || 0) > 0 ? (
                  <div className="campaign-chip">
                    {activeDiscountSek} kr {campaignLabels.pending}
                  </div>
                ) : null}

                {discountView.freeShipping ? (
                  <div className="campaign-chip">{campaignLabels.freeShipping}</div>
                ) : null}
              </div>
            </details>
          ) : null}

          <div className="dreampoints-box" aria-label="DreamPoints">
            <div className="dreampoints-head">
              <div className="dreampoints-title">
                {TT(i18n, t, "checkout.dreamPoints.title", {
                  sv: "DreamPoints™",
                  en: "DreamPoints™",
                  tr: "DreamPoints™",
                })}
              </div>
              <div className="dreampoints-level-badge">
                {safeLabels.dreamLevelLabel || "Starlight"}
              </div>
            </div>

            <div className="dreampoints-lead">
              {TT(i18n, t, "checkout.dreamPoints.lead", {
                sv: "Mitt Calestra gör förmånen synlig redan här — lugnt, tydligt och utan att störa flödet.",
                en: "My Calestra makes the benefit visible already here — calm, clear, and without disturbing the flow.",
                tr: "Benim Calestra avantajı burada da görünür kılar — sakin, net ve akışı bozmadan.",
              })}
            </div>

            <div className="dreampoints-grid">
              <div className="dreampoints-stat">
                <div className="dreampoints-label">
                  {TT(i18n, t, "checkout.dreamPoints.balance", {
                    sv: "Poängsaldo",
                    en: "Points balance",
                    tr: "Puan bakiyesi",
                  })}
                </div>
                <div className="dreampoints-value">{Number(points || 0)}</div>
              </div>

              <div className="dreampoints-stat">
                <div className="dreampoints-label">
                  {TT(i18n, t, "checkout.dreamPoints.levelLabel", {
                    sv: "Nivå",
                    en: "Level",
                    tr: "Seviye",
                  })}
                </div>
                <div className="dreampoints-value small">
                  {safeLabels.dreamLevelLabel || "Starlight"}
                </div>
              </div>

              <div className="dreampoints-stat">
                <div className="dreampoints-label">
                  {TT(i18n, t, "checkout.dreamPoints.earnNow", {
                    sv: "Du tjänar nu",
                    en: "You earn now",
                    tr: "Şimdi kazanırsın",
                  })}
                </div>
                <div className="dreampoints-value">
                  {Number(dreamPreview?.earnOnThisOrder || 0)} p
                </div>
              </div>

              <div className="dreampoints-stat">
                <div className="dreampoints-label">
                  {TT(i18n, t, "checkout.dreamPoints.futureDiscount", {
                    sv: "Möjlig rabatt senare",
                    en: "Possible discount later",
                    tr: "Daha sonra olası indirim",
                  })}
                </div>
                <div className="dreampoints-value small">
                  <Money value={Number.isFinite(maxRedeemActive) ? maxRedeemActive : 0} />
                </div>
              </div>
            </div>

            <div className="dreampoints-hint">
              {TT(i18n, t, "checkout.dreamPoints.optimizedHint", {
                sv: "Poängen förbereds här och låses in på ordern direkt efter genomfört köp.",
                en: "Points are prepared here and written to the order immediately after a completed purchase.",
                tr: "Puanlar burada hazırlanır ve tamamlanan siparişten hemen sonra siparişe yazılır.",
              })}
            </div>
          </div>

          {showMetaBox ? (
            <details
              className="meta-box"
              aria-label={TT(i18n, t, "checkout.meta.aria", {
                sv: "Tillväxt och orderdata",
                en: "Growth and order data",
                tr: "Büyüme ve sipariş verisi",
              })}
            >
              <summary className="meta-title">
                {TT(i18n, t, "checkout.meta.title", {
                  sv: "Orderdata",
                  en: "Order data",
                  tr: "Sipariş verisi",
                })}
              </summary>

              <div className="meta-grid">
                {metaChips.map((chip) => (
                  <div key={chip} className="meta-chip">
                    {chip}
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          <div className="celeste-note" aria-live="polite">
            <span className="celeste-dot" />
            <span>{safeLabels.celeste}</span>
          </div>

          <button
            type="button"
            className={`cta ${disabledCTA ? "disabled" : ""}`}
            onClick={handlePlaceOrder}
            disabled={disabledCTA}
            aria-disabled={disabledCTA}
          >
            {safeLabels.ctaLabel}
            {!disabledCTA ? <span className="cta-glow" aria-hidden="true" /> : null}
          </button>

          <div className="trust">
            {IS_PREVIEW ? (
              <>
                <div className="trust-item">
                  🧪{" "}
                  {hasPreorder
                    ? TT(i18n, t, "checkout.preview.trust1.preorder", {
                        sv: "Test-förbeställning – ingen betalning tas",
                        en: "Test pre-order – no payment is taken",
                        tr: "Test ön sipariş – ödeme alınmaz",
                      })
                    : TT(i18n, t, "checkout.preview.trust1", {
                        sv: "Testkassa – ingen betalning tas",
                        en: "Test checkout – no payment is taken",
                        tr: "Test kasa – ödeme alınmaz",
                      })}
                </div>

                <div className="trust-item">
                  🧾{" "}
                  {hasPreorder
                    ? TT(i18n, t, "checkout.preview.trust2.preorder", {
                        sv: "Förbeställningen måste nå admin/servern innan den räknas som klar",
                        en: "The pre-order must reach admin/server before it counts as complete",
                        tr: "Ön sipariş tamam sayılmadan önce admin/sunucuya ulaşmalıdır",
                      })
                    : TT(i18n, t, "checkout.preview.trust2", {
                        sv: "Ordern måste nå admin/servern innan den räknas som klar",
                        en: "The order must reach admin/server before it counts as complete",
                        tr: "Sipariş tamam sayılmadan önce admin/sunucuya ulaşmalıdır",
                      })}
                </div>

                <div className="trust-item">
                  ↩️{" "}
                  {TT(i18n, t, "trust.returnsShort", {
                    sv: "Tillverkas på beställning • Trygg garanti vid fel",
                    en: "Made to order • Safe guarantee for errors",
                    tr: "Sipariş üzerine üretilir • Hata durumunda güvenli garanti",
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="trust-item">
                  🔒{" "}
                  {TT(i18n, t, "checkout.trust.ssl", {
                    sv: "Säker kassa",
                    en: "Secure checkout",
                    tr: "Güvenli ödeme",
                  })}
                </div>

                <div className="trust-item">
                  🛡️{" "}
                  {TT(i18n, t, "checkout.trust.encrypted", {
                    sv: "Skyddad betalning",
                    en: "Protected payment",
                    tr: "Korumalı ödeme",
                  })}
                </div>

                <div className="trust-item">
                  ↩️{" "}
                  {TT(i18n, t, "trust.returnsShort", {
                    sv: "Tillverkas på beställning • Trygg garanti vid fel",
                    en: "Made to order • Safe guarantee for errors",
                    tr: "Sipariş üzerine üretilir • Hata durumunda güvenli garanti",
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </aside>

      <div className="sticky-bar" role="region" aria-label={t("checkout.summary", "Sammanfattning")}>
        <div className="sticky-total">
          {TT(i18n, t, "checkout.total", {
            sv: "Totalt",
            en: "Total",
            tr: "Toplam",
          })}
          : <Money value={safeTotals.total} />
        </div>

        <button
          type="button"
          className={`cta sticky ${disabledCTA ? "disabled" : ""}`}
          onClick={handlePlaceOrder}
          disabled={disabledCTA}
          aria-disabled={disabledCTA}
        >
          {safeLabels.ctaLabel}
        </button>
      </div>
    </>
  );
}