// D:\WebProjects\Calestra\apps\store-classic\src\pages\checkout\useCheckoutLogic.js
// apps/store-classic/src/pages/checkout/useCheckoutLogic.js

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TT } from "../../i18n/tt.js";
import {
  submitCheckoutOrder,
  handleCheckoutSubmitError,
} from "./checkoutSubmit.js";
import { useCart } from "../../context/CartContext.jsx";
import { useCurrency } from "../../context/CurrencyContext.jsx";
import { useDreamPoints } from "../../context/DreamPointsContext.jsx";
import {
  computeTotals,
  computeFreeShippingProgress,
  hasPhysicalItems,
  computeTotalsSEKFromCart,
  applyDiscountToTotalsSEK,
  applyDiscountToDisplayTotals,
} from "../../utils/money.js";
import useAffiliate from "../../hooks/useAffiliate.js";
import useCampaign from "../../hooks/useCampaign.jsx";

import {
  trackBeginCheckout,
  trackPurchaseAttempt,
  trackPurchaseSuccess,
  trackPurchaseFail,
} from "../../analytics/analyticsClient.js";

import {
  IS_PREVIEW,
  EMAIL_RE,
  PHONE_RE,
  ZIP_SE,
  ZIP_US,
  ZIP_FALLBACK,
} from "./checkoutConfig.js";

import {
  fetchStatusSafe,
  cleanString,
  normalizeAffiliateInput,
  normalizeOrderItemsSnapshot,
  buildPreorderMeta,
  hasRecentBeginCheckoutEvent,
  markBeginCheckoutFallback,
  loadCheckoutPrefill,
  saveCheckoutPrefillCustomer,
  saveMemberShippingSnapshot,
  saveMemberBillingSnapshot,
  saveCheckoutDraftSnapshot,
  normalizeCampaignData,
  buildPendingDiscountMeta,
  validateDiscountCode,
  buildManualDiscountMeta,
  mergeDiscountMeta,
  inferAttributionOwner,
  inferThirdPartyType,
  buildCoreMeta,
  buildDreamPointsMeta,
  hasUsefulCoreMeta,
  getOrCreateDraftId,
  saveCheckoutDraft,
  formatDreamLevel,
  createMoneyFormatter,
} from "./checkoutHelpers.js";

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

function asBool(v) {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v == null) return false;

  const s = normalizeSearchText(v);

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

function asNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function itemQty(item) {
  return Math.max(
    1,
    asNum(item?.qty ?? item?.quantity ?? item?.count ?? item?.amount ?? 1, 1)
  );
}

function normalizeCategory(value) {
  return normalizeSearchText(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
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
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLsJson(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

function readUrlParam(names = []) {
  try {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search || "");
    for (const name of names) {
      const v = cleanString(params.get(name) || "", 240);
      if (v) return v;
    }
  } catch {
    // noop
  }
  return "";
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

function normalizeLaunchMode(value) {
  return cleanString(value || "preview", 40).toLowerCase().replace(/\s+/g, "_");
}

function readBool(value, fallback = false) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return fallback;

  const s = normalizeSearchText(value);

  if (["1", "true", "yes", "y", "on", "active", "enabled"].includes(s)) return true;
  if (["0", "false", "no", "n", "off", "inactive", "disabled"].includes(s)) return false;

  return fallback;
}

async function validateStockBeforeCheckout(items = []) {
  if (typeof fetch !== "function") return { ok: true, skipped: true };

  try {
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify({ items }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error || `HTTP ${res.status}`,
        problems: Array.isArray(data?.problems) ? data.problems : [],
      };
    }

    if (data?.ok === false || data?.valid === false) {
      return {
        ok: false,
        error: data?.error || "stock_unavailable",
        problems: Array.isArray(data?.problems) ? data.problems : [],
      };
    }

    return { ok: true, data };
  } catch {
    // Stock API must not block checkout if the network check itself fails.
    // The server-side /api/orders/register guard still protects final order registration.
    return { ok: true, skipped: true, networkFallback: true };
  }
}

function normalizeLaunchStatus(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const launch = input.launch && typeof input.launch === "object" ? input.launch : {};

  const mode = normalizeLaunchMode(launch.mode || input.mode || "preview");
  const checkoutEnabled = readBool(
    launch.checkoutEnabled ?? input.checkoutEnabled,
    mode === "live" || mode === "soft" || mode === "preview" || mode === "reserve"
  );
  const paymentCaptureActive = readBool(
    launch.paymentCaptureActive ?? input.paymentCaptureActive,
    false
  );
  const orderQueueActive = readBool(launch.orderQueueActive ?? input.orderQueueActive, true);
  const recoveryEngineEnabled = readBool(
    launch.recoveryEngineEnabled ?? input.recoveryEngineEnabled,
    true
  );
  const stripeArmed = readBool(launch.stripeArmed ?? input.stripeArmed, false);
  const storefrontVisible = readBool(
    launch.storefrontVisible ?? input.storefrontVisible,
    true
  );
  const reserveMessaging = readBool(
    launch.reserveMessaging ?? input.reserveMessaging,
    true
  );

  return {
    ok: !!input.ok,
    paused: readBool(input.paused, false),
    reason: cleanString(input.reason || "", 500),
    updatedAt: cleanString(launch.updatedAt || input.updatedAt || "", 120),
    generatedAt: cleanString(input.generatedAt || "", 120),
    mode,
    launchMode: mode,
    checkoutEnabled,
    paymentCaptureActive,
    printfulDispatchMode: cleanString(
      launch.printfulDispatchMode || input.printfulDispatchMode || "off",
      80
    ).toLowerCase(),
    orderQueueActive,
    recoveryEngineEnabled,
    stripeArmed,
    storefrontVisible,
    reserveMessaging,
    raw: input,
  };
}

function getLaunchBlockReason(status) {
  const s = status && typeof status === "object" ? status : {};
  const mode = normalizeLaunchMode(s.mode || s.launchMode || "preview");

  if (s.paused) return "paused";
  if (mode === "emergency") return "emergency";
  if (s.storefrontVisible === false) return "storefront_hidden";
  if (s.checkoutEnabled === false) return "checkout_disabled";
  if (s.orderQueueActive === false) return "order_queue_disabled";

  return "";
}

function buildLaunchPauseReason(status) {
  const s = status && typeof status === "object" ? status : {};
  const customReason = cleanString(s.reason || "", 500);
  if (customReason) return customReason;

  const blockReason = getLaunchBlockReason(s);

  if (blockReason === "emergency") return "Emergency mode is active.";
  if (blockReason === "storefront_hidden") return "Storefront is temporarily hidden.";
  if (blockReason === "checkout_disabled") return "Checkout is temporarily disabled.";
  if (blockReason === "order_queue_disabled") return "Order queue is temporarily disabled.";
  if (blockReason === "paused") return "Store is paused.";

  return "";
}

function getTotalsSekNumber(totals, keys = []) {
  const source = totals && typeof totals === "object" ? totals : {};

  for (const key of keys) {
    const n = Number(source[key]);
    if (Number.isFinite(n)) return n;
  }

  return 0;
}

function getShippingSekFromTotals(totalsSEK) {
  const base = totalsSEK && typeof totalsSEK === "object" ? totalsSEK : {};

  return Math.max(
    0,
    getTotalsSekNumber(base, [
      "shipping",
      "shippingSek",
      "shippingSEK",
      "ship",
      "freight",
      "freightSek",
      "delivery",
      "deliverySek",
    ])
  );
}

function readAttributionFromStorage() {
  const objects = [
    readLsJson("cw.attribution"),
    readLsJson("cw.referral"),
    readLsJson("cw.affiliate"),
    readLsJson("cw.creator"),
    readLsJson("cw.associate"),
    readLsJson("cw.campaign.attribution"),
    readLsJson("cw.checkout.attribution"),
  ].filter((x) => x && typeof x === "object");

  const merged = {};
  for (const obj of objects) Object.assign(merged, obj);

  return {
    affiliateId: pickFirst(
      merged.affiliateId,
      merged.affiliate_id,
      merged.ref,
      readLs("cw.affiliateId"),
      readLs("cw.affiliate.id"),
      readLs("cw.ref")
    ),
    affiliateCode: pickFirst(
      merged.affiliateCode,
      merged.affiliate_code,
      merged.code,
      readLs("cw.affiliateCode"),
      readLs("cw.affiliate.code")
    ),
    creatorId: pickFirst(
      merged.creatorId,
      merged.creator_id,
      readLs("cw.creatorId"),
      readLs("cw.creator.id")
    ),
    creatorCode: pickFirst(
      merged.creatorCode,
      merged.creator_code,
      readLs("cw.creatorCode"),
      readLs("cw.creator.code")
    ),
    associateId: pickFirst(
      merged.associateId,
      merged.associate_id,
      readLs("cw.associateId"),
      readLs("cw.associate.id")
    ),
    associateCode: pickFirst(
      merged.associateCode,
      merged.associate_code,
      merged.ambassadorCode,
      merged.ambassador_code,
      readLs("cw.associateCode"),
      readLs("cw.associate.code"),
      readLs("cw.ambassadorCode"),
      readLs("cw.ambassador.code")
    ),
    campaignId: pickFirst(
      merged.campaignId,
      merged.campaign_id,
      readLs("cw.campaignId"),
      readLs("cw.campaign.id")
    ),
    sourceChannel: pickFirst(
      merged.sourceChannel,
      merged.source_channel,
      readLs("cw.sourceChannel")
    ),
    entryPoint: pickFirst(merged.entryPoint, merged.entry_point, readLs("cw.entryPoint")),
    trafficSource: pickFirst(
      merged.trafficSource,
      merged.traffic_source,
      merged.utmSource,
      merged.utm_source,
      readLs("cw.trafficSource"),
      readLs("cw.utm.source")
    ),
    utmSource: pickFirst(merged.utmSource, merged.utm_source, readLs("cw.utm.source")),
    utmMedium: pickFirst(merged.utmMedium, merged.utm_medium, readLs("cw.utm.medium")),
    utmCampaign: pickFirst(merged.utmCampaign, merged.utm_campaign, readLs("cw.utm.campaign")),
    utmContent: pickFirst(merged.utmContent, merged.utm_content, readLs("cw.utm.content")),
    utmTerm: pickFirst(merged.utmTerm, merged.utm_term, readLs("cw.utm.term")),
  };
}

function readAttributionFromUrl() {
  const affiliateCode = normalizeCode(
    readUrlParam(["affiliateCode", "affiliate_code", "affcode", "aff_code", "ref", "aff"])
  );
  const creatorCode = normalizeCode(
    readUrlParam(["creatorCode", "creator_code", "creator", "creator_ref"])
  );
  const associateCode = normalizeCode(
    readUrlParam([
      "associateCode",
      "associate_code",
      "ambassadorCode",
      "ambassador_code",
      "ambassador",
      "assoc",
      "assoc_code",
      "partner",
      "partnerCode",
      "partner_code",
      "code",
    ])
  );

  return {
    affiliateId: normalizeCode(readUrlParam(["affiliateId", "affiliate_id", "affid"])),
    affiliateCode,
    creatorId: normalizeCode(readUrlParam(["creatorId", "creator_id"])),
    creatorCode,
    associateId: normalizeCode(
      readUrlParam(["associateId", "associate_id", "ambassadorId", "ambassador_id"])
    ),
    associateCode,
    campaignId: normalizeCode(readUrlParam(["campaignId", "campaign_id", "cid"])),
    sourceChannel: cleanString(
      readUrlParam(["sourceChannel", "source_channel", "channel"]) ||
        (associateCode ? "associate" : creatorCode ? "creator" : affiliateCode ? "affiliate" : ""),
      120
    ),
    entryPoint: cleanString(readUrlParam(["entryPoint", "entry_point"]) || "checkout", 120),
    trafficSource: cleanString(readUrlParam(["trafficSource", "traffic_source", "utm_source"]), 120),
    utmSource: cleanString(readUrlParam(["utm_source"]), 120),
    utmMedium: cleanString(readUrlParam(["utm_medium"]), 120),
    utmCampaign: cleanString(readUrlParam(["utm_campaign"]), 160),
    utmContent: cleanString(readUrlParam(["utm_content"]), 160),
    utmTerm: cleanString(readUrlParam(["utm_term"]), 160),
  };
}

function resolveCheckoutAttribution(affiliate) {
  const stored = readAttributionFromStorage();
  const url = readAttributionFromUrl();

  const affiliateInput = normalizeAffiliateInput(affiliate);

  const resolved = {
    affiliateId: normalizeCode(pickFirst(url.affiliateId, stored.affiliateId, affiliateInput)),
    affiliateCode: normalizeCode(pickFirst(url.affiliateCode, stored.affiliateCode, affiliateInput)),
    creatorId: normalizeCode(pickFirst(url.creatorId, stored.creatorId)),
    creatorCode: normalizeCode(pickFirst(url.creatorCode, stored.creatorCode)),
    associateId: normalizeCode(pickFirst(url.associateId, stored.associateId)),
    associateCode: normalizeCode(pickFirst(url.associateCode, stored.associateCode)),
    campaignId: normalizeCode(pickFirst(url.campaignId, stored.campaignId)),
    sourceChannel: cleanString(
      pickFirst(url.sourceChannel, stored.sourceChannel) ||
        (pickFirst(url.associateCode, stored.associateCode)
          ? "associate"
          : pickFirst(url.creatorCode, stored.creatorCode)
            ? "creator"
            : pickFirst(url.affiliateCode, stored.affiliateCode, affiliateInput)
              ? "affiliate"
              : ""),
      120
    ),
    entryPoint: cleanString(pickFirst(url.entryPoint, stored.entryPoint) || "checkout", 120),
    trafficSource: cleanString(
      pickFirst(url.trafficSource, stored.trafficSource, url.utmSource, stored.utmSource),
      120
    ),
    utmSource: cleanString(pickFirst(url.utmSource, stored.utmSource), 120),
    utmMedium: cleanString(pickFirst(url.utmMedium, stored.utmMedium), 120),
    utmCampaign: cleanString(pickFirst(url.utmCampaign, stored.utmCampaign), 160),
    utmContent: cleanString(pickFirst(url.utmContent, stored.utmContent), 160),
    utmTerm: cleanString(pickFirst(url.utmTerm, stored.utmTerm), 160),
  };

  const hasAny =
    resolved.affiliateId ||
    resolved.affiliateCode ||
    resolved.creatorId ||
    resolved.creatorCode ||
    resolved.associateId ||
    resolved.associateCode ||
    resolved.campaignId ||
    resolved.sourceChannel ||
    resolved.trafficSource ||
    resolved.utmSource ||
    resolved.utmMedium ||
    resolved.utmCampaign ||
    resolved.utmContent ||
    resolved.utmTerm;

  if (hasAny) {
    writeLsJson("cw.checkout.attribution", {
      ...resolved,
      updatedAt: new Date().toISOString(),
    });
  }

  return resolved;
}

function extractLineTexts(item) {
  const values = [
    item?.lineMode,
    item?.orderType,
    item?.saleType,
    item?.purchaseType,
    item?.lineType,
    item?.kind,
    item?.availability,
    item?.availabilityType,
    item?.availabilityLabel,
    item?.availabilityText,
    item?.fulfillmentType,
    item?.fulfilmentType,
    item?.fulfillment,
    item?.fulfilment,
    item?.status,
    item?.badge,
    item?.title,
    item?.name,
    item?.slug,
    item?.handle,
    item?.sku,
    item?.category,
    item?.type,
    item?.product?.lineMode,
    item?.product?.orderType,
    item?.product?.availability,
    item?.product?.availabilityType,
    item?.product?.availabilityLabel,
    item?.product?.availabilityText,
    item?.product?.fulfillmentType,
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
    item?.meta?.availabilityType,
    item?.meta?.availabilityLabel,
    item?.meta?.availabilityText,
    item?.meta?.fulfillmentType,
    item?.meta?.status,
    item?.meta?.badge,
    item?.meta?.label,
    item?.meta?.category,
    item?.meta?.type,
    getNested(item, "product.meta.lineMode"),
    getNested(item, "product.meta.orderType"),
    getNested(item, "product.meta.availabilityType"),
    getNested(item, "product.meta.availabilityLabel"),
    getNested(item, "product.meta.availabilityText"),
    getNested(item, "product.meta.fulfillmentType"),
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

  return [...values, ...tags, ...categories].filter(Boolean).map(normalizeSearchText).filter(Boolean);
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
    text.includes("back in stock") ||
    text.includes("back-in-stock") ||
    text.includes("back_in_stock") ||
    text.includes("restock alert") ||
    text.includes("mail me") ||
    text.includes("bevaka") ||
    text.includes("meddela mig")
  );
}

function itemIsNotifyOnly(item) {
  if (!item || typeof item !== "object") return false;

  const meta = item?.meta && typeof item.meta === "object" ? item.meta : {};

  const direct = normalizeSearchText(
    item?.lineMode ||
      item?.orderType ||
      item?.ctaMode ||
      item?.fulfillmentType ||
      item?.availabilityType ||
      meta?.lineMode ||
      meta?.orderType ||
      meta?.ctaMode ||
      meta?.fulfillmentType ||
      meta?.availabilityType ||
      item?.product?.lineMode ||
      item?.product?.orderType ||
      item?.product?.ctaMode ||
      item?.product?.fulfillmentType ||
      item?.product?.availabilityType ||
      ""
  );

  if (
    direct === "notify" ||
    direct === "notify me" ||
    direct === "notify-me" ||
    direct === "notify_me" ||
    direct === "notify only" ||
    direct === "notify-only" ||
    direct === "notify_only" ||
    direct === "back in stock" ||
    direct === "back-in-stock" ||
    direct === "back_in_stock"
  ) {
    return true;
  }

  if (
    direct === "buy" ||
    direct === "standard" ||
    direct === "preorder" ||
    direct === "pre order" ||
    direct === "pre-order" ||
    direct === "pre_order"
  ) {
    return false;
  }

  const flags = [
    item?.notifyOnly,
    item?.notifyMe,
    item?.notify_me,
    item?.backInStockOnly,
    item?.watchOnly,
    meta?.notifyOnly,
    meta?.notifyMe,
    meta?.notify_me,
    meta?.backInStockOnly,
    meta?.watchOnly,
    item?.product?.notifyOnly,
    item?.product?.notifyMe,
    item?.product?.backInStockOnly,
    item?.product?.watchOnly,
    getNested(item, "product.meta.notifyOnly"),
    getNested(item, "product.meta.notifyMe"),
    getNested(item, "product.meta.backInStockOnly"),
    getNested(item, "product.flags.notifyOnly"),
    getNested(item, "product.flags.notifyMe"),
    getNested(item, "product.flags.backInStockOnly"),
  ];

  if (flags.some(asBool)) return true;

  const texts = extractLineTexts(item);
  return texts.some(hasNotifyKeyword);
}

function itemIsPreorder(item) {
  if (!item || typeof item !== "object") return false;

  const meta = item?.meta && typeof item.meta === "object" ? item.meta : {};

  const direct = normalizeSearchText(
    item?.lineMode ||
      item?.orderType ||
      item?.ctaMode ||
      item?.fulfillmentType ||
      item?.availabilityType ||
      meta?.lineMode ||
      meta?.orderType ||
      meta?.ctaMode ||
      meta?.fulfillmentType ||
      meta?.availabilityType ||
      item?.product?.lineMode ||
      item?.product?.orderType ||
      item?.product?.ctaMode ||
      item?.product?.fulfillmentType ||
      item?.product?.availabilityType ||
      ""
  );

  if (
    direct === "preorder" ||
    direct === "pre order" ||
    direct === "pre-order" ||
    direct === "pre_order"
  ) {
    return true;
  }

  if (
    direct === "buy" ||
    direct === "standard" ||
    direct === "notify" ||
    direct === "notify me" ||
    direct === "notify-me" ||
    direct === "notify_me"
  ) {
    return false;
  }

  const flags = [
    item?.isPreorder,
    item?.preorder,
    item?.preOrder,
    item?.is_preorder,
    item?.pre_order,
    item?.preorderActive,
    item?.preorderOnly,
    meta?.isPreorder,
    meta?.preorder,
    meta?.preOrder,
    meta?.preorderActive,
    meta?.preorderOnly,
    item?.product?.isPreorder,
    item?.product?.preorder,
    item?.product?.preOrder,
    item?.product?.preorderActive,
    item?.product?.preorderOnly,
    getNested(item, "product.meta.isPreorder"),
    getNested(item, "product.meta.preorder"),
    getNested(item, "product.meta.preOrder"),
    getNested(item, "product.meta.preorderActive"),
    getNested(item, "product.meta.preorderOnly"),
    getNested(item, "product.flags.preorder"),
    getNested(item, "product.flags.preOrder"),
  ];

  if (flags.some(asBool)) return true;

  const texts = extractLineTexts(item);
  return texts.some(hasPreorderKeyword);
}

function detectLineMode(item) {
  if (itemIsNotifyOnly(item)) return "notify";
  if (itemIsPreorder(item)) return "preorder";
  return "buy";
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
  const text = extractLineTexts(item).join(" ");

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
  const meta = item?.meta && typeof item.meta === "object" ? item.meta : {};
  const val =
    item?.preorderLeadDays ??
    item?.leadDays ??
    meta?.preorderLeadDays ??
    meta?.leadDays ??
    item?.product?.preorderLeadDays ??
    item?.product?.leadDays ??
    getNested(item, "product.meta.preorderLeadDays") ??
    getNested(item, "product.meta.leadDays") ??
    null;

  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function buildFallbackFlowMeta(items) {
  const list = Array.isArray(items) ? items : [];
  const preorderItems = list.filter((item) => detectLineMode(item) === "preorder");
  const notifyItems = list.filter((item) => detectLineMode(item) === "notify");
  const buyItems = list.filter((item) => detectLineMode(item) === "buy");

  const preorderCount = preorderItems.length;
  const preorderQty = preorderItems.reduce((sum, item) => sum + itemQty(item), 0);

  const hasPreorder = preorderCount > 0;
  const hasNotifyOnly = notifyItems.length > 0;
  const mixedCart = hasPreorder && buyItems.length > 0;
  const notifyOnly = hasNotifyOnly && buyItems.length === 0 && preorderItems.length === 0;

  const leadDays = preorderItems
    .map((item) => getPreorderLeadDays(item))
    .filter((n) => Number.isFinite(n) && n > 0);

  let flowType = "standard";
  if (notifyOnly) flowType = "notify_only";
  else if (mixedCart) flowType = "mixed";
  else if (hasPreorder) flowType = "preorder";

  return {
    hasPreorder,
    hasNotifyOnly,
    preorderCount,
    preorderQty,
    notifyOnlyCount: notifyItems.length,
    mixedCart,
    preorderMixedWithRegular: mixedCart,
    flowType,
    preorderLeadDaysMin: leadDays.length ? Math.min(...leadDays) : 0,
    preorderLeadDaysMax: leadDays.length ? Math.max(...leadDays) : 0,
    items: preorderItems.map((item) => ({
      id: item?.id ?? item?.productId ?? item?.slug ?? "",
      slug: item?.slug ?? item?.product?.slug ?? "",
      title: item?.title ?? item?.name ?? item?.product?.title ?? "",
      qty: itemQty(item),
      releaseDate:
        item?.releaseDate ??
        item?.launchDate ??
        item?.availableFrom ??
        item?.product?.releaseDate ??
        item?.product?.launchDate ??
        item?.product?.availableFrom ??
        "",
    })),
  };
}

function mergePreorderMeta(primary, fallback) {
  const p = primary && typeof primary === "object" ? primary : {};
  const f = fallback && typeof fallback === "object" ? fallback : {};

  const hasPreorder = asBool(p.hasPreorder) || asBool(f.hasPreorder);
  const hasNotifyOnly = asBool(p.hasNotifyOnly) || asBool(f.hasNotifyOnly);

  const preorderCount = Math.max(asNum(p.preorderCount, 0), asNum(f.preorderCount, 0));
  const preorderQty = Math.max(asNum(p.preorderQty, 0), asNum(f.preorderQty, 0));
  const notifyOnlyCount = Math.max(asNum(p.notifyOnlyCount, 0), asNum(f.notifyOnlyCount, 0));

  const mixedCart = asBool(p.mixedCart) || asBool(f.mixedCart);

  let flowType = String(p.flowType || "").trim().toLowerCase();
  if (!flowType || flowType === "standard") {
    flowType = String(f.flowType || "").trim().toLowerCase();
  }

  if (!flowType || flowType === "standard") {
    if (hasNotifyOnly && !hasPreorder) flowType = "notify_only";
    else if (hasPreorder) flowType = mixedCart ? "mixed" : "preorder";
    else flowType = "standard";
  }

  return {
    ...f,
    ...p,
    hasPreorder,
    hasNotifyOnly,
    preorderCount,
    preorderQty,
    notifyOnlyCount,
    mixedCart,
    preorderMixedWithRegular: mixedCart,
    flowType,
    items: Array.isArray(p.items) && p.items.length ? p.items : f.items || [],
  };
}

function getLineText(item, keys = []) {
  const meta = item?.meta && typeof item.meta === "object" ? item.meta : {};
  for (const key of keys) {
    const value =
      item?.[key] ??
      meta?.[key] ??
      item?.product?.[key] ??
      getNested(item, `product.meta.${key}`) ??
      "";
    const s = cleanString(value || "", 500);
    if (s) return s;
  }
  return "";
}

function normalizeLineSnapshotItem(item, src, idx) {
  const lineMode =
    itemIsNotifyOnly(item) || itemIsNotifyOnly(src)
      ? "notify"
      : itemIsPreorder(item) || itemIsPreorder(src)
        ? "preorder"
        : "buy";

  const preorder = lineMode === "preorder";
  const notifyOnly = lineMode === "notify";
  const specialCategory = detectSpecialCategory(src || item);
  const leadDays = getPreorderLeadDays(src || item);

  const preorderLabel = getLineText(src || item, [
    "preorderLabel",
    "preOrderLabel",
    "preorderBadge",
    "availabilityLabel",
  ]);
  const preorderNote = getLineText(src || item, [
    "preorderNote",
    "preOrderNote",
    "preorderText",
    "availabilityText",
  ]);
  const notifyLabel = getLineText(src || item, ["notifyLabel", "backInStockLabel", "availabilityLabel"]);
  const notifyNote = getLineText(src || item, ["notifyNote", "backInStockNote", "availabilityText"]);

  const categories = [
    ...arrayFromMaybe(item?.categories),
    ...arrayFromMaybe(src?.categories),
    ...arrayFromMaybe(item?.product?.categories),
    ...arrayFromMaybe(src?.product?.categories),
  ];

  if (specialCategory && !categories.map(normalizeCategory).includes(specialCategory)) {
    categories.push(specialCategory);
  }

  return {
    ...item,
    lineMode,
    ctaMode: lineMode,
    orderType: preorder ? "preorder" : notifyOnly ? "notify" : "standard",
    fulfillmentType: preorder
      ? "preorder"
      : notifyOnly
        ? "notify"
        : cleanString(item?.fulfillmentType || src?.fulfillmentType || "ready_for_fulfillment", 80),
    availabilityType: preorder
      ? "preorder"
      : notifyOnly
        ? "notify"
        : cleanString(item?.availabilityType || src?.availabilityType || "", 80),
    fulfillmentStatus: preorder
      ? "pending"
      : notifyOnly
        ? "waiting_interest"
        : cleanString(item?.fulfillmentStatus || "accepted", 80),
    printfulEligible: !preorder && !notifyOnly,
    isPreorder: preorder,
    preorder,
    preOrder: preorder,
    preorderOnly: preorder || undefined,
    preorderActive: preorder || undefined,
    preorderLabel: preorder ? preorderLabel : item?.preorderLabel || "",
    preOrderLabel: preorder ? preorderLabel : item?.preOrderLabel || "",
    preorderNote: preorder ? preorderNote : item?.preorderNote || "",
    preOrderNote: preorder ? preorderNote : item?.preOrderNote || "",
    preorderText: preorder ? preorderNote : item?.preorderText || "",
    preorderLeadDays: preorder ? leadDays : item?.preorderLeadDays || 0,
    notifyOnly,
    notifyMe: notifyOnly,
    notifyLabel: notifyOnly ? notifyLabel : item?.notifyLabel || "",
    notifyNote: notifyOnly ? notifyNote : item?.notifyNote || "",
    category: specialCategory || item?.category || src?.category || "",
    categories: categories.length ? categories : item?.categories,
    meta: {
      ...(item?.meta && typeof item.meta === "object" ? item.meta : {}),
      ...(src?.meta && typeof src.meta === "object" ? src.meta : {}),
      lineMode,
      ctaMode: lineMode,
      orderType: preorder ? "preorder" : notifyOnly ? "notify" : "standard",
      fulfillmentType: preorder
        ? "preorder"
        : notifyOnly
          ? "notify"
          : item?.fulfillmentType || src?.fulfillmentType || "ready_for_fulfillment",
      availabilityType: preorder ? "preorder" : notifyOnly ? "notify" : item?.availabilityType || src?.availabilityType || "",
      preorder: preorder || undefined,
      isPreorder: preorder || undefined,
      preOrder: preorder || undefined,
      preorderLabel: preorder ? preorderLabel : undefined,
      preorderNote: preorder ? preorderNote : undefined,
      preorderLeadDays: preorder ? leadDays || undefined : undefined,
      notifyOnly: notifyOnly || undefined,
      notifyMe: notifyOnly || undefined,
      notifyLabel: notifyOnly ? notifyLabel : undefined,
      notifyNote: notifyOnly ? notifyNote : undefined,
      category: specialCategory || undefined,
    },
    product:
      item?.product && typeof item.product === "object"
        ? {
            ...item.product,
            ctaMode: lineMode,
            lineMode,
            orderType: preorder ? "preorder" : notifyOnly ? "notify" : "standard",
            fulfillmentType: preorder ? "preorder" : notifyOnly ? "notify" : item.product.fulfillmentType,
            availabilityType: preorder ? "preorder" : notifyOnly ? "notify" : item.product.availabilityType,
            preorder: preorder || item.product.preorder || undefined,
            isPreorder: preorder || item.product.isPreorder || undefined,
            preOrder: preorder || item.product.preOrder || undefined,
            preorderOnly: preorder || item.product.preorderOnly || undefined,
            notifyOnly: notifyOnly || item.product.notifyOnly || undefined,
            notifyMe: notifyOnly || item.product.notifyMe || undefined,
            category: specialCategory || item.product.category,
            categories: categories.length ? categories : item.product.categories,
          }
        : item?.product,
    lineIndex: idx,
  };
}

export function useCheckoutLogic({ t, i18n }) {
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const { currency, locale, rates } = useCurrency();
  const { points, level, previewForCart, awardOrderPoints, refresh } = useDreamPoints();
  const affiliate = useAffiliate();
  const campaignState = useCampaign();

  const [paused, setPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [launchStatus, setLaunchStatus] = useState(() =>
    normalizeLaunchStatus({
      ok: true,
      mode: IS_PREVIEW ? "preview" : "live",
      checkoutEnabled: true,
      paymentCaptureActive: false,
      printfulDispatchMode: "off",
      orderQueueActive: true,
      recoveryEngineEnabled: true,
      storefrontVisible: true,
      reserveMessaging: true,
    })
  );
  const [agree, setAgree] = useState(false);
  const [useSeparateBilling, setUseSeparateBilling] = useState(false);
  const [errors, setErrors] = useState({});
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [discountBusy, setDiscountBusy] = useState(false);
  const [discountValidation, setDiscountValidation] = useState(null);
  const [discountError, setDiscountError] = useState("");

  const [customer, setCustomer] = useState(() => {
    const prefill = loadCheckoutPrefill();
    return {
      name: prefill.name || "",
      email: prefill.email || "",
      phone: prefill.phone || "",
    };
  });

  const [shipping, setShipping] = useState({
    company: "",
    careOf: "",
    address1: "",
    address2: "",
    doorCode: "",
    zip: "",
    city: "",
    country: "SE",
    region: "",
    deliveryNotes: "",
  });

  const [billing, setBilling] = useState({
    company: "",
    careOf: "",
    address1: "",
    address2: "",
    zip: "",
    city: "",
    country: "SE",
    region: "",
    orgNumber: "",
    vatId: "",
  });

  const cartIsEmpty = !Array.isArray(items) || items.length === 0;
  const isPlacingRef = useRef(false);
  const attemptOnceRef = useRef(false);
  const draftSaveTimerRef = useRef(null);
  const localMirrorTimerRef = useRef(null);
  const lastDraftSignatureRef = useRef("");
  const didMergePrefillRef = useRef(false);
  const beginCheckoutFallbackOnceRef = useRef(false);

  const draftId = useMemo(() => getOrCreateDraftId(), []);

  const safeTrack = useCallback((fn, payload) => {
    try {
      if (typeof fn === "function") fn(payload);
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function tick() {
      const s = await fetchStatusSafe();
      if (!alive) return;

      if (!s?.ok) {
        setLaunchStatus((prev) => ({
          ...prev,
          ok: false,
          lastError: cleanString(s?.error || "status_unavailable", 300),
          generatedAt: new Date().toISOString(),
        }));
        setPaused(false);
        setPauseReason("");
        return;
      }

      const nextStatus = normalizeLaunchStatus(s);
      const blockedReason = getLaunchBlockReason(nextStatus);
      const nextPaused = !!blockedReason;

      setLaunchStatus(nextStatus);
      setPaused(nextPaused);
      setPauseReason(nextPaused ? buildLaunchPauseReason(nextStatus) : "");
    }

    tick();
    const id = setInterval(tick, 30_000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (cartIsEmpty && !isPlacingRef.current) {
      navigate("/cart", { replace: true });
    }
  }, [cartIsEmpty, navigate]);

  useEffect(() => {
    if (didMergePrefillRef.current) return;
    didMergePrefillRef.current = true;

    const prefill = loadCheckoutPrefill();
    if (!prefill.name && !prefill.email && !prefill.phone) return;

    setCustomer((prev) => ({
      name: prev.name || prefill.name || "",
      email: prev.email || prefill.email || "",
      phone: prev.phone || prefill.phone || "",
    }));
  }, []);

  const anyPhysical = useMemo(() => hasPhysicalItems(items), [items]);
  const allDigital = useMemo(
    () => Array.isArray(items) && items.length > 0 && !anyPhysical,
    [items, anyPhysical]
  );

  const preorderMeta = useMemo(() => {
    const fromHelper = buildPreorderMeta(items);
    const fallback = buildFallbackFlowMeta(items);
    return mergePreorderMeta(fromHelper, fallback);
  }, [items]);

  const isPreorderFlow = preorderMeta?.flowType === "preorder";
  const isMixedFlow = preorderMeta?.flowType === "mixed";
  const isNotifyOnlyFlow = preorderMeta?.flowType === "notify_only";

  const launchMode = launchStatus.launchMode || launchStatus.mode || (IS_PREVIEW ? "preview" : "live");
  const launchBlockReason = getLaunchBlockReason(launchStatus);
  const remoteCheckoutBlocked = !!launchBlockReason;
  const checkoutEnabledRemote = launchStatus.checkoutEnabled !== false;
  const paymentCaptureActiveRemote = !!launchStatus.paymentCaptureActive;
  const printfulDispatchModeRemote = launchStatus.printfulDispatchMode || "off";

  const normalizedItems = useMemo(() => {
    const list = normalizeOrderItemsSnapshot(items);
    if (!Array.isArray(list)) return [];

    return list.map((item, idx) => {
      const src = Array.isArray(items) ? items[idx] : null;
      return normalizeLineSnapshotItem(item, src, idx);
    });
  }, [items]);

  const totals = useMemo(
    () => computeTotals(items, currency, rates, shipping.country),
    [items, currency, rates, shipping.country]
  );

  const baseDisplayTotals = useMemo(() => {
    if (allDigital) return { ...totals, shipping: 0, total: totals.subtotal };
    return totals;
  }, [allDigital, totals]);

  const baseTotalsSEK = useMemo(
    () => computeTotalsSEKFromCart(items, shipping.country),
    [items, shipping.country]
  );

  const campaign = useMemo(() => {
    const base =
      campaignState?.resolvedCampaign ||
      campaignState?.campaign ||
      campaignState?.activeCampaign ||
      campaignState?.current ||
      campaignState ||
      {};
    return normalizeCampaignData(base);
  }, [campaignState]);

  const campaignDiscountMeta = useMemo(
    () => buildPendingDiscountMeta(campaign),
    [campaign]
  );

  const manualDiscountMeta = useMemo(
    () =>
      buildManualDiscountMeta(discountValidation, {
        subtotalSek: getTotalsSekNumber(baseTotalsSEK, ["subtotal", "sub", "items", "itemsTotal"]),
        shippingSek: anyPhysical ? getShippingSekFromTotals(baseTotalsSEK) : 0,
      }),
    [discountValidation, baseTotalsSEK, anyPhysical]
  );

  const mergedDiscountMeta = useMemo(
    () => mergeDiscountMeta(campaignDiscountMeta, manualDiscountMeta),
    [campaignDiscountMeta, manualDiscountMeta]
  );

  const discountMeta = useMemo(() => {
    const campaignAmountSek = Math.max(
      0,
      Number(
        campaignDiscountMeta?.discountAmountSek ??
          campaignDiscountMeta?.campaignDiscountAmountSek ??
          0
      )
    );

    const manualRawAmountSek = manualDiscountMeta?.manualCodeValid
      ? Math.max(0, Number(manualDiscountMeta?.manualDiscountAmountSek || 0))
      : 0;

    const freeShipping = !!(
      mergedDiscountMeta?.freeShipping ||
      campaignDiscountMeta?.freeShipping ||
      manualDiscountMeta?.manualFreeShipping
    );

    const shippingDiscountSek =
      freeShipping && anyPhysical ? getShippingSekFromTotals(baseTotalsSEK) : 0;

    const manualType = String(manualDiscountMeta?.manualDiscountType || "").toLowerCase();

    /*
     * Om rabattkoden är fri frakt kan backend skicka discountAmountSek = fraktbeloppet.
     * Då får beloppet inte räknas som produktrabatt också.
     *
     * Exempel FREESHIPVIP:
     * subtotal = 299
     * shipping = 49
     * backend/manualRawAmountSek = 49
     * shippingDiscountSek = 49
     * manualItemDiscountSek = 0
     * totalDiscountSek = 49
     * sluttotal = 299
     */
    const manualItemDiscountSek =
      manualRawAmountSek > 0 && (freeShipping || manualType === "shipping")
        ? Math.max(0, manualRawAmountSek - shippingDiscountSek)
        : manualRawAmountSek;

    const selectedItemDiscountSek =
      manualItemDiscountSek > 0 ? manualItemDiscountSek : campaignAmountSek;

    const totalDiscountSek = Math.max(0, selectedItemDiscountSek + shippingDiscountSek);

    const discountType =
      manualDiscountMeta?.manualDiscountType ||
      mergedDiscountMeta?.discountType ||
      (Number(mergedDiscountMeta?.discountPercent || 0) > 0 ? "percent" : "") ||
      (selectedItemDiscountSek > 0 ? "fixed" : "") ||
      (freeShipping ? "shipping" : "");

    return {
      ...mergedDiscountMeta,

      discountType,

      manualDiscountAmountSek: manualItemDiscountSek,
      manualDiscountApplied: manualItemDiscountSek > 0,

      itemDiscountSek: selectedItemDiscountSek,
      itemDiscountSEK: selectedItemDiscountSek,

      discountSek: selectedItemDiscountSek,
      discountSEK: selectedItemDiscountSek,
      discountAmountSek: selectedItemDiscountSek,
      discountAmountSEK: selectedItemDiscountSek,

      freeShipping,
      freeShippingApplied: shippingDiscountSek > 0,
      freeShippingDiscountSek: shippingDiscountSek,
      shippingDiscountSek,
      shippingDiscountSEK: shippingDiscountSek,

      totalDiscountSek,
      totalDiscountSEK: totalDiscountSek,

      hasPendingDiscount:
        !!mergedDiscountMeta?.hasPendingDiscount ||
        selectedItemDiscountSek > 0 ||
        shippingDiscountSek > 0 ||
        freeShipping,
    };
  }, [
    mergedDiscountMeta,
    campaignDiscountMeta,
    manualDiscountMeta,
    baseTotalsSEK,
    anyPhysical,
  ]);

  const appliedDiscountSek = useMemo(
    () => Math.max(0, Number(discountMeta?.totalDiscountSek || 0)),
    [discountMeta]
  );

  const totalsSEK = useMemo(
    () => applyDiscountToTotalsSEK(baseTotalsSEK, discountMeta),
    [baseTotalsSEK, discountMeta]
  );

  const displayTotals = useMemo(
    () =>
      applyDiscountToDisplayTotals(
        baseDisplayTotals,
        baseTotalsSEK,
        discountMeta,
        currency,
        rates
      ),
    [baseDisplayTotals, baseTotalsSEK, discountMeta, currency, rates]
  );

  const progress = useMemo(() => {
    if (!anyPhysical || discountMeta?.freeShipping) {
      return { isFree: true, remainingSEK: 0, remainingActive: 0, thresholdSEK: 0 };
    }

    return computeFreeShippingProgress(
      baseDisplayTotals.subtotalSEK ?? totals.subtotalSEK,
      currency,
      rates,
      shipping.country,
      items
    );
  }, [
    anyPhysical,
    discountMeta,
    baseDisplayTotals.subtotalSEK,
    totals.subtotalSEK,
    currency,
    rates,
    shipping.country,
    items,
  ]);

  const subtotalSEKForPoints = useMemo(() => {
    return Number(baseTotalsSEK?.subtotal ?? baseTotalsSEK?.sub ?? baseTotalsSEK?.total ?? 0);
  }, [baseTotalsSEK]);

  const dreamPreview = useMemo(() => {
    return previewForCart(subtotalSEKForPoints);
  }, [previewForCart, subtotalSEKForPoints]);

  const checkoutAttribution = useMemo(() => resolveCheckoutAttribution(affiliate), [affiliate]);

  const coreMeta = useMemo(() => {
    const base = buildCoreMeta(affiliate) || {};

    return {
      ...base,
      affiliateId: cleanString(base.affiliateId || checkoutAttribution.affiliateId || "", 160),
      affiliateCode: cleanString(
        base.affiliateCode || checkoutAttribution.affiliateCode || "",
        160
      ),
      creatorId: cleanString(base.creatorId || checkoutAttribution.creatorId || "", 160),
      creatorCode: cleanString(base.creatorCode || checkoutAttribution.creatorCode || "", 160),
      associateId: cleanString(base.associateId || checkoutAttribution.associateId || "", 160),
      associateCode: cleanString(
        base.associateCode || checkoutAttribution.associateCode || "",
        160
      ),
      campaignId: cleanString(base.campaignId || checkoutAttribution.campaignId || "", 160),
      sourceChannel: cleanString(
        base.sourceChannel || checkoutAttribution.sourceChannel || "",
        120
      ),
      entryPoint: cleanString(base.entryPoint || checkoutAttribution.entryPoint || "checkout", 120),
      trafficSource: cleanString(
        base.trafficSource || checkoutAttribution.trafficSource || "",
        120
      ),
      attribution: {
        ...(base.attribution || {}),
        utmSource: cleanString(
          base?.attribution?.utmSource || checkoutAttribution.utmSource || "",
          120
        ),
        utmMedium: cleanString(
          base?.attribution?.utmMedium || checkoutAttribution.utmMedium || "",
          120
        ),
        utmCampaign: cleanString(
          base?.attribution?.utmCampaign || checkoutAttribution.utmCampaign || "",
          160
        ),
        utmContent: cleanString(
          base?.attribution?.utmContent || checkoutAttribution.utmContent || "",
          160
        ),
        utmTerm: cleanString(
          base?.attribution?.utmTerm || checkoutAttribution.utmTerm || "",
          160
        ),
      },
    };
  }, [affiliate, checkoutAttribution]);

  const dreamPointsMeta = useMemo(
    () =>
      buildDreamPointsMeta({
        points,
        level,
        preview: dreamPreview,
        currency,
        rates,
        locale,
      }),
    [points, level, dreamPreview, currency, rates, locale]
  );

  const coreMetaWithCampaign = useMemo(() => {
    const affiliateId = cleanString(coreMeta?.affiliateId || "", 160);
    const affiliateCode = cleanString(coreMeta?.affiliateCode || "", 160);
    const creatorId = cleanString(coreMeta?.creatorId || "", 160);
    const creatorCode = cleanString(coreMeta?.creatorCode || "", 160);
    const associateId = cleanString(coreMeta?.associateId || "", 160);
    const associateCode = cleanString(coreMeta?.associateCode || "", 160);

    const sourceChannel = cleanString(
      coreMeta?.sourceChannel ||
        (associateCode ? "associate" : creatorCode ? "creator" : affiliateCode ? "affiliate" : ""),
      120
    );

    const trafficSource = cleanString(
      coreMeta?.trafficSource ||
        coreMeta?.attribution?.utmSource ||
        sourceChannel ||
        "",
      120
    );

    const attributionOwner = inferAttributionOwner({
      affiliateId,
      creatorId,
      associateId,
      associateCode,
      sourceChannel,
      trafficSource,
      utmSource: coreMeta?.attribution?.utmSource || "",
    });

    const thirdPartyType = inferThirdPartyType({
      affiliateId,
      creatorId,
      associateId,
      associateCode,
      sourceChannel,
      trafficSource,
    });

    return {
      ...coreMeta,
      affiliateId,
      affiliateCode,
      affiliateReferralCode: affiliateCode,
      creatorId,
      creatorCode,
      associateId,
      associateCode,
      ambassadorCode: associateCode,
      partnerCode: associateCode || creatorCode || affiliateCode || "",
      referralCode: associateCode || creatorCode || affiliateCode || "",
      campaignId: cleanString(coreMeta?.campaignId || campaign?.key || "", 160),
      campaignKey: cleanString(campaign?.key || "", 120),
      campaignTitle: cleanString(campaign?.title || "", 240),
      campaignTheme: cleanString(campaign?.theme || "", 120),
      campaignMode: cleanString(campaign?.mode || "", 80),
      attributionOwner,
      thirdPartyType,
      trafficSource,
      sourceChannel,
      entryPoint: cleanString(coreMeta?.entryPoint || "checkout", 120),
      attribution: {
        ...(coreMeta?.attribution || {}),
        utmSource: cleanString(coreMeta?.attribution?.utmSource || "", 120),
        utmMedium: cleanString(coreMeta?.attribution?.utmMedium || "", 120),
        utmCampaign: cleanString(coreMeta?.attribution?.utmCampaign || "", 160),
        utmContent: cleanString(coreMeta?.attribution?.utmContent || "", 160),
        utmTerm: cleanString(coreMeta?.attribution?.utmTerm || "", 160),
      },
    };
  }, [coreMeta, campaign]);

  useEffect(() => {
    if (beginCheckoutFallbackOnceRef.current) return;
    if (cartIsEmpty) return;

    beginCheckoutFallbackOnceRef.current = true;

    if (hasRecentBeginCheckoutEvent({ maxAgeMs: 20_000 })) return;

    markBeginCheckoutFallback();

    safeTrack(trackBeginCheckout, {
      source: "checkout_fallback",
      currency,
      total: Number(displayTotals?.total ?? 0),
      itemsCount: Array.isArray(items) ? items.length : 0,
      anyPhysical: !!anyPhysical,
      affiliate: affiliate || null,
      affiliateId: coreMetaWithCampaign.affiliateId || normalizeAffiliateInput(affiliate),
      affiliateCode: coreMetaWithCampaign.affiliateCode || "",
      campaignId: coreMetaWithCampaign.campaignId || "",
      campaignKey: campaign.key || "",
      campaignTheme: campaign.theme || "",
      creatorId: coreMetaWithCampaign.creatorId || "",
      creatorCode: coreMetaWithCampaign.creatorCode || "",
      associateId: coreMetaWithCampaign.associateId || "",
      associateCode: coreMetaWithCampaign.associateCode || "",
      ambassadorCode: coreMetaWithCampaign.ambassadorCode || coreMetaWithCampaign.associateCode || "",
      partnerCode: coreMetaWithCampaign.partnerCode || "",
      referralCode: coreMetaWithCampaign.referralCode || "",
      attributionOwner: coreMetaWithCampaign.attributionOwner || "calestra",
      thirdPartyType: coreMetaWithCampaign.thirdPartyType || "",
      trafficSource: coreMetaWithCampaign.trafficSource || "",
      memberId: coreMetaWithCampaign.memberId || "",
      memberTier: coreMetaWithCampaign.memberTier || "",
      sourceChannel: coreMetaWithCampaign.sourceChannel || "",
      entryPoint: coreMetaWithCampaign.entryPoint || "checkout",
      draftId,
      dreamPointsLevel: dreamPointsMeta.level || "",
      orderFlowType: preorderMeta?.flowType,
      preorderCount: preorderMeta?.preorderCount || 0,
      preorderQty: preorderMeta?.preorderQty || 0,
      hasPreorder: !!preorderMeta?.hasPreorder,
      hasNotifyOnly: !!preorderMeta?.hasNotifyOnly,
      notifyOnlyCount: preorderMeta?.notifyOnlyCount || 0,
      mixedCart: !!preorderMeta?.mixedCart,
      discountCode: discountMeta.discountCode || "",
      discountAmountSek: discountMeta.totalDiscountSek || discountMeta.discountAmountSek || 0,
      hasManualDiscount: !!discountMeta.hasManualDiscount,
      manualDiscountApplied: !!discountMeta.manualDiscountApplied,
      freeShipping: !!discountMeta.freeShipping,
      freeShippingApplied: !!discountMeta.freeShippingApplied,
      freeShippingDiscountSek: discountMeta.freeShippingDiscountSek || 0,
    });
  }, [
    cartIsEmpty,
    currency,
    displayTotals,
    items,
    anyPhysical,
    affiliate,
    coreMetaWithCampaign,
    campaign,
    dreamPointsMeta,
    draftId,
    preorderMeta,
    discountMeta,
    safeTrack,
  ]);

  const hasCheckoutIdentity =
    !!String(customer.email || "").trim() ||
    !!String(customer.name || "").trim() ||
    !!String(customer.phone || "").trim();

  const hasDraftContext = hasCheckoutIdentity || hasUsefulCoreMeta(coreMetaWithCampaign);

  useEffect(() => {
    if (!hasCheckoutIdentity) return;
    saveCheckoutPrefillCustomer(customer);
  }, [hasCheckoutIdentity, customer]);

  useEffect(() => {
    saveMemberShippingSnapshot(shipping, anyPhysical);
  }, [shipping, anyPhysical]);

  useEffect(() => {
    saveMemberBillingSnapshot(billing, useSeparateBilling);
  }, [billing, useSeparateBilling]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (cartIsEmpty) return;

    const snapshot = {
      draftId,
      email: cleanString(customer?.email || "", 160),
      customer,
      shipping: anyPhysical ? shipping : {},
      billing: useSeparateBilling ? billing : {},
      anyPhysical,
      useSeparateBilling,
      lastStep: "checkout",
      itemCount: Array.isArray(normalizedItems) ? normalizedItems.length : 0,
      items: normalizedItems,
      source: "store-classic",
      sourceChannel: coreMetaWithCampaign.sourceChannel || "store",
      trafficSource: coreMetaWithCampaign.trafficSource || "",
      entryPoint: coreMetaWithCampaign.entryPoint || "checkout",
      userId: coreMetaWithCampaign.userId || "",
      memberId: coreMetaWithCampaign.memberId || "",
      memberTier: coreMetaWithCampaign.memberTier || "",
      campaignId: coreMetaWithCampaign.campaignId || "",
      creatorId: coreMetaWithCampaign.creatorId || "",
      creatorCode: coreMetaWithCampaign.creatorCode || "",
      affiliateId: coreMetaWithCampaign.affiliateId || "",
      affiliateCode: coreMetaWithCampaign.affiliateCode || "",
      associateId: coreMetaWithCampaign.associateId || "",
      associateCode: coreMetaWithCampaign.associateCode || "",
      ambassadorCode: coreMetaWithCampaign.ambassadorCode || coreMetaWithCampaign.associateCode || "",
      partnerCode: coreMetaWithCampaign.partnerCode || "",
      referralCode: coreMetaWithCampaign.referralCode || "",
      attributionOwner: coreMetaWithCampaign.attributionOwner || "calestra",
      thirdPartyType: coreMetaWithCampaign.thirdPartyType || "",
      orderFlowType: preorderMeta?.flowType,
      preorderMeta,
      campaign,
      discountMeta,
    };

    if (localMirrorTimerRef.current) clearTimeout(localMirrorTimerRef.current);

    const timerId = setTimeout(() => {
      saveCheckoutDraftSnapshot(snapshot);
    }, 250);

    localMirrorTimerRef.current = timerId;

    return () => {
      clearTimeout(timerId);
      if (localMirrorTimerRef.current === timerId) {
        localMirrorTimerRef.current = null;
      }
    };
  }, [
    draftId,
    customer,
    shipping,
    billing,
    anyPhysical,
    useSeparateBilling,
    normalizedItems,
    cartIsEmpty,
    coreMetaWithCampaign,
    preorderMeta,
    campaign,
    discountMeta,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (cartIsEmpty) return;
    if (!hasDraftContext) return;

    const payload = {
      action: "save",
      draftId,
      source: "store-classic",
      sourceChannel: coreMetaWithCampaign.sourceChannel || "store",
      trafficSource: coreMetaWithCampaign.trafficSource || "",
      entryPoint: coreMetaWithCampaign.entryPoint || "checkout",
      lastStep: "checkout",
      customer,
      shipping: anyPhysical ? shipping : {},
      billing: useSeparateBilling ? billing : {},
      currency,
      totalsSEK,
      anyPhysical,
      affiliate: affiliate || null,
      items: normalizedItems,
      userId: coreMetaWithCampaign.userId || "",
      memberId: coreMetaWithCampaign.memberId || "",
      memberTier: coreMetaWithCampaign.memberTier || "",
      campaignId: coreMetaWithCampaign.campaignId || "",
      creatorId: coreMetaWithCampaign.creatorId || "",
      creatorCode: coreMetaWithCampaign.creatorCode || "",
      affiliateId: coreMetaWithCampaign.affiliateId || normalizeAffiliateInput(affiliate),
      affiliateCode: coreMetaWithCampaign.affiliateCode || "",
      associateId: coreMetaWithCampaign.associateId || "",
      associateCode: coreMetaWithCampaign.associateCode || "",
      ambassadorCode: coreMetaWithCampaign.ambassadorCode || coreMetaWithCampaign.associateCode || "",
      partnerCode: coreMetaWithCampaign.partnerCode || "",
      referralCode: coreMetaWithCampaign.referralCode || "",
      attributionOwner: coreMetaWithCampaign.attributionOwner || "calestra",
      thirdPartyType: coreMetaWithCampaign.thirdPartyType || "",
      campaign,
      discountMeta,
      coreMeta: coreMetaWithCampaign,
      dreamPointsMeta,
      orderFlowType: preorderMeta?.flowType,
      preorderMeta,
    };

    const signature = JSON.stringify({
      draftId,
      email: customer.email || "",
      name: customer.name || "",
      phone: customer.phone || "",
      shippingCountry: shipping.country || "",
      itemCount: Array.isArray(normalizedItems) ? normalizedItems.length : 0,
      itemSignature: normalizedItems
        .map(
          (it) =>
            `${it.lineKey || it.id || it.slug}:${it.qty}:${it.priceSEK}:${
              it.lineMode || "buy"
            }`
        )
        .join("|"),
      totalsSEK,
      useSeparateBilling,
      billingZip: billing.zip || "",
      userId: coreMetaWithCampaign.userId || "",
      memberId: coreMetaWithCampaign.memberId || "",
      memberTier: coreMetaWithCampaign.memberTier || "",
      campaignId: coreMetaWithCampaign.campaignId || "",
      creatorId: coreMetaWithCampaign.creatorId || "",
      creatorCode: coreMetaWithCampaign.creatorCode || "",
      affiliateId: coreMetaWithCampaign.affiliateId || "",
      affiliateCode: coreMetaWithCampaign.affiliateCode || "",
      associateId: coreMetaWithCampaign.associateId || "",
      associateCode: coreMetaWithCampaign.associateCode || "",
      ambassadorCode: coreMetaWithCampaign.ambassadorCode || "",
      partnerCode: coreMetaWithCampaign.partnerCode || "",
      referralCode: coreMetaWithCampaign.referralCode || "",
      attributionOwner: coreMetaWithCampaign.attributionOwner || "",
      thirdPartyType: coreMetaWithCampaign.thirdPartyType || "",
      trafficSource: coreMetaWithCampaign.trafficSource || "",
      sourceChannel: coreMetaWithCampaign.sourceChannel || "",
      entryPoint: coreMetaWithCampaign.entryPoint || "",
      dreamLevel: dreamPointsMeta.level || "",
      dreamEarnPreview: dreamPointsMeta.earnPreview || 0,
      dreamBalance: dreamPointsMeta.balance || 0,
      dreamMaxRedeemSek: dreamPointsMeta.maxRedeemSek || 0,
      campaignKey: campaign.key || "",
      campaignTitle: campaign.title || "",
      campaignTheme: campaign.theme || "",
      campaignMode: campaign.mode || "",
      discountCode: discountMeta.discountCode || "",
      discountPercent: discountMeta.discountPercent || 0,
      discountAmountSek: discountMeta.totalDiscountSek || discountMeta.discountAmountSek || 0,
      hasManualDiscount: !!discountMeta.hasManualDiscount,
      manualDiscountApplied: !!discountMeta.manualDiscountApplied,
      activeDiscountCount: discountMeta.activeDiscountCount || 0,
      activeVipCount: discountMeta.activeVipCount || 0,
      vipEnabled: !!discountMeta.vipEnabled,
      freeShipping: !!discountMeta.freeShipping,
      freeShippingApplied: !!discountMeta.freeShippingApplied,
      freeShippingDiscountSek: discountMeta.freeShippingDiscountSek || 0,
      orderFlowType: preorderMeta?.flowType,
      preorderCount: preorderMeta?.preorderCount || 0,
      preorderQty: preorderMeta?.preorderQty || 0,
      notifyOnlyCount: preorderMeta?.notifyOnlyCount || 0,
      mixedCart: !!preorderMeta?.mixedCart,
    });

    if (lastDraftSignatureRef.current === signature) return;
    lastDraftSignatureRef.current = signature;

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    const timerId = setTimeout(() => {
      saveCheckoutDraft(payload);
    }, 900);

    draftSaveTimerRef.current = timerId;

    return () => {
      clearTimeout(timerId);
      if (draftSaveTimerRef.current === timerId) {
        draftSaveTimerRef.current = null;
      }
    };
  }, [
    draftId,
    customer,
    shipping,
    billing,
    currency,
    totalsSEK,
    anyPhysical,
    affiliate,
    normalizedItems,
    cartIsEmpty,
    hasDraftContext,
    useSeparateBilling,
    campaign,
    discountMeta,
    coreMetaWithCampaign,
    dreamPointsMeta,
    preorderMeta,
  ]);

  const hasRequiredFilled = useCallback(() => {
    const baseCustomer =
      customer.name.trim() &&
      EMAIL_RE.test(String(customer.email).trim()) &&
      PHONE_RE.test(String(customer.phone).trim());

    if (!baseCustomer) return false;
    if (!anyPhysical) return true;

    const shipBase = shipping.address1.trim() && shipping.city.trim() && shipping.country.trim();

    const zip = String(shipping.zip || "").trim();
    const c = (shipping.country || "SE").toUpperCase();
    const zipOk =
      (c === "SE" && ZIP_SE.test(zip)) ||
      (c === "US" && ZIP_US.test(zip)) ||
      ZIP_FALLBACK.test(zip);

    if (!(shipBase && zipOk)) return false;

    if (useSeparateBilling) {
      const bZip = String(billing.zip || "").trim();
      const bc = (billing.country || "SE").toUpperCase();
      const bZipOk =
        (bc === "SE" && ZIP_SE.test(bZip)) ||
        (bc === "US" && ZIP_US.test(bZip)) ||
        ZIP_FALLBACK.test(bZip);

      const bBase =
        billing.address1.trim() && billing.city.trim() && billing.country.trim() && bZipOk;

      if (!bBase) return false;
    }

    return true;
  }, [customer, anyPhysical, shipping, useSeparateBilling, billing]);

  const validate = useCallback(() => {
    const e = {};

    if (!customer.name?.trim()) e["customer.name"] = t("error.required", "Obligatoriskt");
    if (!EMAIL_RE.test(String(customer.email || "").trim())) {
      e["customer.email"] = t("error.email", "Ogiltig e-post");
    }
    if (!PHONE_RE.test(String(customer.phone || "").trim())) {
      e["customer.phone"] = t("error.phone", "Ogiltigt telefonnummer");
    }

    if (anyPhysical) {
      if (!shipping.address1?.trim()) {
        e["shipping.address1"] = t("error.required", "Obligatoriskt");
      }

      const zip = String(shipping.zip || "").trim();
      const c = (shipping.country || "SE").toUpperCase();
      const zipOk =
        (c === "SE" && ZIP_SE.test(zip)) ||
        (c === "US" && ZIP_US.test(zip)) ||
        ZIP_FALLBACK.test(zip);

      if (!zipOk) e["shipping.zip"] = t("error.zip", "Ogiltigt postnummer");
      if (!shipping.city?.trim()) e["shipping.city"] = t("error.required", "Obligatoriskt");
      if (!shipping.country?.trim()) e["shipping.country"] = t("error.required", "Obligatoriskt");
    }

    if (useSeparateBilling) {
      if (!billing.address1?.trim()) {
        e["billing.address1"] = t("error.required", "Obligatoriskt");
      }

      const bZip = String(billing.zip || "").trim();
      const bc = (billing.country || "SE").toUpperCase();
      const bZipOk =
        (bc === "SE" && ZIP_SE.test(bZip)) ||
        (bc === "US" && ZIP_US.test(bZip)) ||
        ZIP_FALLBACK.test(bZip);

      if (!bZipOk) e["billing.zip"] = t("error.zip", "Ogiltigt postnummer");
      if (!billing.city?.trim()) e["billing.city"] = t("error.required", "Obligatoriskt");
      if (!billing.country?.trim()) e["billing.country"] = t("error.required", "Obligatoriskt");
    }

    if (!agree) e.agree = t("error.required", "Obligatoriskt");

    if (remoteCheckoutBlocked) {
      e.submit = TT(i18n, t, "checkout.launchBlockedError", {
        sv: "Checkout är tillfälligt pausad. Försök igen om en stund.",
        en: "Checkout is temporarily paused. Please try again shortly.",
        tr: "Checkout geçici olarak duraklatıldı. Lütfen kısa süre sonra tekrar deneyin.",
      });
    }

    if (isNotifyOnlyFlow) {
      e.submit = t(
        "checkout.notifyOnlyError",
        "Bevaka-produkter ska inte slutföras som checkout."
      );
    }

    setErrors(e);
    return e;
  }, [
    customer,
    shipping,
    billing,
    anyPhysical,
    useSeparateBilling,
    agree,
    remoteCheckoutBlocked,
    isNotifyOnlyFlow,
    i18n,
    t,
  ]);

  const disabledCTA = remoteCheckoutBlocked || isNotifyOnlyFlow || !agree || !hasRequiredFilled();

  const handleApplyDiscountCode = useCallback(async () => {
    const code = normalizeCode(discountCodeInput);

    setDiscountError("");

    if (!code) {
      setDiscountValidation(null);
      setDiscountError(
        TT(i18n, t, "checkout.discount.enterCode", {
          sv: "Skriv en rabattkod först.",
          en: "Enter a discount code first.",
          tr: "Önce bir indirim kodu yaz.",
        })
      );
      return;
    }

    if (discountBusy) return;

    setDiscountBusy(true);

    try {
      const result = await validateDiscountCode({
        code,
        subtotalSek: getTotalsSekNumber(baseTotalsSEK, ["subtotal", "sub", "items", "itemsTotal"]),
        shippingSek: anyPhysical ? getShippingSekFromTotals(baseTotalsSEK) : 0,
        currency,
        customerEmail: customer.email,
        items: normalizedItems,
        campaignKey: campaign.key || "",
      });

      setDiscountValidation(result);

      if (!result?.valid) {
        setDiscountError(
          result?.message ||
            TT(i18n, t, "checkout.discount.invalid", {
              sv: "Rabattkoden kunde inte användas.",
              en: "The discount code could not be used.",
              tr: "İndirim kodu kullanılamadı.",
            })
        );
        return;
      }

      setDiscountCodeInput(result.code || code);
      setDiscountError("");
    } finally {
      setDiscountBusy(false);
    }
  }, [
    discountCodeInput,
    discountBusy,
    baseTotalsSEK,
    anyPhysical,
    currency,
    customer.email,
    normalizedItems,
    campaign.key,
    i18n,
    t,
  ]);

  const handleClearDiscountCode = useCallback(() => {
    setDiscountCodeInput("");
    setDiscountValidation(null);
    setDiscountError("");
  }, []);

  const handlePlaceOrder = useCallback(
    async (e) => {
      if (e?.preventDefault) e.preventDefault();

      if (remoteCheckoutBlocked) {
        setErrors((m) => ({
          ...m,
          submit:
            pauseReason ||
            TT(i18n, t, "checkout.pause.submitError", {
              sv: "Butiken är pausad just nu. Försök igen om en stund.",
              en: "The store is paused right now. Please try again shortly.",
              tr: "Mağaza şu anda duraklatıldı. Lütfen kısa süre sonra tekrar deneyin.",
            }),
        }));
        return;
      }

      if (isNotifyOnlyFlow) {
        setErrors((m) => ({
          ...m,
          submit: t(
            "checkout.notifyOnlyError",
            "Bevaka-produkter ska inte slutföras som checkout."
          ),
        }));
        return;
      }

      const eMap = validate();
      if (Object.keys(eMap).length > 0) return;

      const stockCheck = await validateStockBeforeCheckout(normalizedItems);
      if (!stockCheck?.ok) {
        const first = Array.isArray(stockCheck.problems) ? stockCheck.problems[0] : null;
        const title = first?.title || first?.slug || first?.sku || "";

        setErrors((m) => ({
          ...m,
          submit: title
            ? TT(i18n, t, "checkout.stockGuard.productUnavailable", {
                sv: `Produkten är slut eller saknar tillräckligt antal: ${title}. Registrera gärna intresse/kö istället.`,
                en: `The product is sold out or does not have enough stock: ${title}. Please register interest instead.`,
                tr: `Ürün tükendi veya yeterli stok yok: ${title}. Lütfen ilgi/kayıt bırakın.`,
              })
            : TT(i18n, t, "checkout.stockGuard.unavailable", {
                sv: "En produkt i korgen är slut. Registrera gärna intresse/kö istället.",
                en: "A product in your cart is sold out. Please register interest instead.",
                tr: "Sepetinizdeki bir ürün tükendi. Lütfen ilgi/kayıt bırakın.",
              }),
        }));
        return;
      }

      if (isPlacingRef.current) return;
      isPlacingRef.current = true;

      if (!attemptOnceRef.current) {
        attemptOnceRef.current = true;
        safeTrack(trackPurchaseAttempt, {
          step: "submit_order",
          provider: IS_PREVIEW ? "preview" : "live",
          currency,
          total: Number(displayTotals?.total ?? 0),
          itemsCount: Array.isArray(items) ? items.length : 0,
          anyPhysical: !!anyPhysical,
          affiliate: affiliate || null,
          affiliateId: coreMetaWithCampaign.affiliateId || normalizeAffiliateInput(affiliate),
          affiliateCode: coreMetaWithCampaign.affiliateCode || "",
          campaignId: coreMetaWithCampaign.campaignId || "",
          campaignKey: campaign.key || "",
          campaignTheme: campaign.theme || "",
          creatorId: coreMetaWithCampaign.creatorId || "",
          creatorCode: coreMetaWithCampaign.creatorCode || "",
          associateId: coreMetaWithCampaign.associateId || "",
          associateCode: coreMetaWithCampaign.associateCode || "",
          ambassadorCode:
            coreMetaWithCampaign.ambassadorCode || coreMetaWithCampaign.associateCode || "",
          partnerCode: coreMetaWithCampaign.partnerCode || "",
          referralCode: coreMetaWithCampaign.referralCode || "",
          attributionOwner: coreMetaWithCampaign.attributionOwner || "calestra",
          thirdPartyType: coreMetaWithCampaign.thirdPartyType || "",
          trafficSource: coreMetaWithCampaign.trafficSource || "",
          memberTier: coreMetaWithCampaign.memberTier || "",
          sourceChannel: coreMetaWithCampaign.sourceChannel || "",
          entryPoint: coreMetaWithCampaign.entryPoint || "",
          pendingDiscount: discountMeta.hasPendingDiscount,
          discountCode: discountMeta.discountCode || "",
          discountAmountSek: discountMeta.totalDiscountSek || discountMeta.discountAmountSek || 0,
          hasManualDiscount: !!discountMeta.hasManualDiscount,
          manualDiscountApplied: !!discountMeta.manualDiscountApplied,
          freeShipping: !!discountMeta.freeShipping,
          freeShippingApplied: !!discountMeta.freeShippingApplied,
          freeShippingDiscountSek: discountMeta.freeShippingDiscountSek || 0,
          activeDiscountCount: discountMeta.activeDiscountCount || 0,
          activeVipCount: discountMeta.activeVipCount || 0,
          orderFlowType: preorderMeta?.flowType,
          preorderCount: preorderMeta?.preorderCount || 0,
          preorderQty: preorderMeta?.preorderQty || 0,
          hasPreorder: !!preorderMeta?.hasPreorder,
          hasNotifyOnly: !!preorderMeta?.hasNotifyOnly,
          notifyOnlyCount: preorderMeta?.notifyOnlyCount || 0,
          mixedCart: !!preorderMeta?.mixedCart,
        });
      }

      try {
        await submitCheckoutOrder({
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
          t,
          displayTotals,
          safeTrack,
          trackPurchaseSuccess,
          trackPurchaseFail,
        });
      } catch (err) {
        handleCheckoutSubmitError({
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
        });

        isPlacingRef.current = false;
        attemptOnceRef.current = false;
      }
    },
    [
      remoteCheckoutBlocked,
      pauseReason,
      i18n,
      isNotifyOnlyFlow,
      validate,
      safeTrack,
      currency,
      displayTotals,
      items,
      anyPhysical,
      affiliate,
      coreMetaWithCampaign,
      campaign,
      discountMeta,
      preorderMeta,
      draftId,
      customer,
      shipping,
      billing,
      useSeparateBilling,
      totalsSEK,
      dreamPointsMeta,
      isPreorderFlow,
      isMixedFlow,
      allDigital,
      subtotalSEKForPoints,
      awardOrderPoints,
      refresh,
      normalizedItems,
      clear,
      navigate,
      t,
    ]
  );

  const focusFirstError = useCallback(() => {
    if (typeof document === "undefined") return;

    const keys = Object.keys(errors);
    if (!keys.length) return;

    const firstKey = keys[0];
    const el = document.querySelector(
      `[data-error-key="${firstKey}"] input, [data-error-key="${firstKey}"] select, [data-error-key="${firstKey}"] textarea`
    );

    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errors]);

  const money = useMemo(() => createMoneyFormatter(currency, locale), [currency, locale]);

  const prefillActive =
    !!String(customer.name || "").trim() ||
    !!String(customer.email || "").trim() ||
    !!String(customer.phone || "").trim();

  const labels = {
    kicker: isNotifyOnlyFlow
      ? TT(i18n, t, "checkout.kicker.notify", {
          sv: "Bevaka-läge",
          en: "Notify mode",
          tr: "Bildirim modu",
        })
      : isPreorderFlow
        ? TT(i18n, t, "checkout.kicker.preorder", {
            sv: "Förbeställning",
            en: "Pre-order",
            tr: "Ön Sipariş",
          })
        : isMixedFlow
          ? TT(i18n, t, "checkout.kicker.mixed", {
              sv: "Blandad kassa",
              en: "Mixed checkout",
              tr: "Karma ödeme",
            })
          : TT(i18n, t, "checkout.kicker", {
              sv: "Snabbkassa",
              en: "Fast Checkout",
              tr: "Hızlı Checkout",
            }),

    lead: isNotifyOnlyFlow
      ? TT(i18n, t, "checkout.lead.notify", {
          sv: "Den här korgen innehåller bevaka-produkter. Vi stoppar checkout här så att inget av misstag blir en order.",
          en: "This cart contains notify-me items. Checkout is blocked here so nothing becomes an order by mistake.",
          tr: "Bu sepet bildirim ürünleri içeriyor. Yanlışlıkla sipariş oluşmaması için checkout burada durdurulur.",
        })
      : isPreorderFlow
        ? TT(i18n, t, "checkout.lead.preorder", {
            sv: "Du reserverar nu din plats i första vågen. Din förbeställning sparas tydligt och följer med till admin och uppföljning.",
            en: "You are now reserving your place in the first wave. Your pre-order is saved clearly and follows through to admin and follow-up.",
            tr: "Şu anda ilk dalgada yerini ayırtıyorsun. Ön siparişin açık şekilde kaydedilir ve yönetim tarafına aktarılır.",
          })
        : isMixedFlow
          ? TT(i18n, t, "checkout.lead.mixed", {
              sv: "Din korg innehåller både vanliga produkter och förbeställningar. Ordern genomförs som blandad kassa, medan förbeställningsraderna ligger kvar tydligt markerade.",
              en: "Your cart contains both regular products and pre-orders. The order is handled as a mixed checkout while pre-order lines remain clearly marked.",
              tr: "Sepetinde hem normal ürünler hem de ön siparişler var. Sipariş karma ödeme olarak işlenir ve ön sipariş satırları açıkça işaretli kalır.",
            })
          : TT(i18n, t, "checkout.lead", {
              sv: "Ett sista lugnt steg innan ordern blir verklig. Smidigt, tydligt och byggt för att bara flyta.",
              en: "One final calm step before the order becomes real. Smooth, clear, and designed to simply flow.",
              tr: "Sipariş gerçeğe dönüşmeden önce son sakin adım. Akıcı, net ve doğal hissettirecek şekilde tasarlandı.",
            }),

    celeste: isNotifyOnlyFlow
      ? TT(i18n, t, "checkout.celeste.notify", {
          sv: "Det här är intresse, inte köp. Vi håller det säkert och tydligt.",
          en: "This is interest, not purchase. We keep it safe and clear.",
          tr: "Bu satın alma değil, ilgi bildirimi. Bunu güvenli ve net tutuyoruz.",
        })
      : isPreorderFlow
        ? TT(i18n, t, "checkout.celeste.preorder", {
            sv: "Din plats är nästan säkrad. När du vill, låser vi din förbeställning.",
            en: "Your place is almost secured. When you’re ready, we lock in your pre-order.",
            tr: "Yeriniz neredeyse hazır. Hazırsan ön siparişinizi sabitleriz.",
          })
        : isMixedFlow
          ? TT(i18n, t, "checkout.celeste.mixed", {
              sv: "Din order innehåller två rytmer samtidigt. Vi håller allt tydligt, lugnt och samlat.",
              en: "Your order carries two rhythms at once. We keep everything clear, calm, and collected.",
              tr: "Siparişiniz aynı anda iki ritim taşıyor. Her şeyi net, sakin ve düzenli tutuyoruz.",
            })
          : TT(i18n, t, "checkout.celeste", {
              sv: "Allt är i balans. När du vill, går vi vidare.",
              en: "Everything is in balance. When you’re ready, we continue.",
              tr: "Her şey dengede. Hazırsan devam ederiz.",
            }),

    ctaLabel: remoteCheckoutBlocked
      ? TT(i18n, t, "checkout.paused", {
          sv: launchBlockReason === "checkout_disabled" ? "Checkout pausad" : "Pausad",
          en: launchBlockReason === "checkout_disabled" ? "Checkout paused" : "Paused",
          tr: launchBlockReason === "checkout_disabled" ? "Checkout duraklatıldı" : "Duraklatıldı",
        })
      : isNotifyOnlyFlow
        ? TT(i18n, t, "checkout.notifyBlocked", {
            sv: "Bevaka-produkt",
            en: "Notify item",
            tr: "Bildirim ürünü",
          })
        : isPreorderFlow
          ? IS_PREVIEW
            ? TT(i18n, t, "checkout.placePreorderPreview", {
                sv: "Skapa test-förbeställning",
                en: "Create test pre-order",
                tr: "Test ön siparişi oluştur",
              })
            : TT(i18n, t, "checkout.placePreorder", {
                sv: "Förbeställ nu",
                en: "Pre-order now",
                tr: "Şimdi ön sipariş ver",
              })
          : isMixedFlow
            ? IS_PREVIEW
              ? TT(i18n, t, "checkout.placeMixedPreview", {
                  sv: "Skapa testorder",
                  en: "Create test order",
                  tr: "Test siparişi oluştur",
                })
              : TT(i18n, t, "checkout.placeMixed", {
                  sv: "Slutför order",
                  en: "Complete order",
                  tr: "Siparişi tamamla",
                })
            : IS_PREVIEW
              ? t("checkout.placeOrderPreview", "Skapa testorder")
              : t("checkout.placeOrder", "Slutför köp"),

    dreamLevelLabel: formatDreamLevel(level, i18n, t),
  };

  return {
    items,
    currency,
    locale,
    rates,
    points,
    level,
    paused,
    pauseReason,
    launchStatus,
    launchMode,
    launchBlockReason,
    remoteCheckoutBlocked,
    checkoutEnabledRemote,
    paymentCaptureActiveRemote,
    printfulDispatchModeRemote,
    agree,
    useSeparateBilling,
    customer,
    shipping,
    billing,
    errors,
    cartIsEmpty,
    anyPhysical,
    allDigital,
    preorderMeta,
    isPreorderFlow,
    isMixedFlow,
    isNotifyOnlyFlow,
    totals,
    displayTotals,
    progress,
    totalsSEK,
    subtotalSEKForPoints,
    dreamPreview,
    dreamPointsMeta,
    campaign,
    discountMeta,
    coreMetaWithCampaign,
    draftId,
    prefillActive,
    disabledCTA,
    labels,
    IS_PREVIEW,

    discountCodeInput,
    discountBusy,
    discountValidation,
    discountError,
    appliedDiscountSek,

    setAgree,
    setUseSeparateBilling,
    setErrors,
    setDiscountCodeInput,
    handleApplyDiscountCode,
    handleClearDiscountCode,
    onChangeCustomer: (k, v) => setCustomer((s) => ({ ...s, [k]: v })),
    onChangeShipping: (k, v) => setShipping((s) => ({ ...s, [k]: v })),
    onChangeBilling: (k, v) => setBilling((s) => ({ ...s, [k]: v })),

    validate,
    hasRequiredFilled,
    handlePlaceOrder,
    focusFirstError,
    money,
  };
}

export default useCheckoutLogic;