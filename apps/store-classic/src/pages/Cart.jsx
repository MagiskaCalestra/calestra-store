// D:\WebProjects\Calestra\apps\store-classic\src\pages\Cart.jsx

import React, { useMemo, useRef, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCart } from "../context/CartContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { useDreamPoints } from "../context/DreamPointsContext.jsx";
import {
  formatMoney,
  convertFromSEK,
  computeTotals,
  computeFreeShippingProgress,
  hasPhysicalItems,
  computeTotalsSEKFromCart,
} from "../utils/money.js";

import { trackBeginCheckout } from "../analytics/analyticsClient.js";
import { TT } from "../i18n/tt.js";

const CHECKOUT_DRAFT_LS_KEY = "cw.checkoutDraftId";

const CORE_LS_KEYS = {
  userId: "cw.userId",
  memberId: "cw.memberId",
  memberTier: "cw.memberTier",
  campaignId: "cw.campaignId",
  creatorId: "cw.creatorId",
  affiliateId: "cw.affiliateId",
  associateId: "cw.associateId",
  associateCode: "cw.associateCode",
  sourceChannel: "cw.sourceChannel",
  entryPoint: "cw.entryPoint",
};

function safeGetLS(key, fallback = "") {
  try {
    if (typeof window === "undefined") return fallback;
    const value = window.localStorage.getItem(key);
    return value == null ? fallback : String(value);
  } catch {
    return fallback;
  }
}

function safeSetLS(key, value) {
  try {
    if (typeof window === "undefined") return;
    if (value == null || value === "") return;
    window.localStorage.setItem(key, String(value));
  } catch {
    // noop
  }
}

function safeSetJsonLS(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

function cleanStr(v, max = 200) {
  const s = v == null ? "" : String(v).trim();
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

function makeAnonymousUserId() {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `CWU-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

function getOrCreateAnonymousUserId() {
  const existing = safeGetLS(CORE_LS_KEYS.userId, "");
  if (existing) return existing;

  const next = makeAnonymousUserId();
  safeSetLS(CORE_LS_KEYS.userId, next);
  return next;
}

function syncCoreIdsFromSearchParams(searchParams) {
  const mappings = [
    ["campaign", CORE_LS_KEYS.campaignId],
    ["campaign_id", CORE_LS_KEYS.campaignId],
    ["creator", CORE_LS_KEYS.creatorId],
    ["creator_id", CORE_LS_KEYS.creatorId],
    ["affiliate", CORE_LS_KEYS.affiliateId],
    ["affiliate_id", CORE_LS_KEYS.affiliateId],
    ["associate", CORE_LS_KEYS.associateId],
    ["associate_id", CORE_LS_KEYS.associateId],
    ["associate_code", CORE_LS_KEYS.associateCode],
    ["code", CORE_LS_KEYS.associateCode],
    ["ref", CORE_LS_KEYS.associateCode],
    ["member_id", CORE_LS_KEYS.memberId],
    ["member_tier", CORE_LS_KEYS.memberTier],
    ["source", CORE_LS_KEYS.sourceChannel],
    ["source_channel", CORE_LS_KEYS.sourceChannel],
    ["entry", CORE_LS_KEYS.entryPoint],
    ["entry_point", CORE_LS_KEYS.entryPoint],
  ];

  for (const [paramKey, lsKey] of mappings) {
    const value = cleanStr(searchParams.get(paramKey) || "", 160);
    if (value) safeSetLS(lsKey, value);
  }
}

function buildCoreSystemFields(searchParams) {
  syncCoreIdsFromSearchParams(searchParams);

  return {
    userId: cleanStr(safeGetLS(CORE_LS_KEYS.userId, getOrCreateAnonymousUserId()), 160),
    memberId: cleanStr(safeGetLS(CORE_LS_KEYS.memberId, ""), 160),
    memberTier: cleanStr(safeGetLS(CORE_LS_KEYS.memberTier, "guest"), 80) || "guest",
    campaignId: cleanStr(safeGetLS(CORE_LS_KEYS.campaignId, ""), 160),
    creatorId: cleanStr(safeGetLS(CORE_LS_KEYS.creatorId, ""), 160),
    affiliateId: cleanStr(safeGetLS(CORE_LS_KEYS.affiliateId, ""), 160),
    associateId: cleanStr(safeGetLS(CORE_LS_KEYS.associateId, ""), 160),
    associateCode: cleanStr(safeGetLS(CORE_LS_KEYS.associateCode, ""), 160),
    sourceChannel: cleanStr(safeGetLS(CORE_LS_KEYS.sourceChannel, "store"), 80) || "store",
    entryPoint: cleanStr(safeGetLS(CORE_LS_KEYS.entryPoint, "cart"), 120) || "cart",
  };
}

function makeDraftId() {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `DRAFT-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

function getOrCreateDraftId() {
  if (typeof window === "undefined") return makeDraftId();

  try {
    const existing = window.localStorage.getItem(CHECKOUT_DRAFT_LS_KEY);
    if (existing && String(existing).trim()) return existing;

    const created = makeDraftId();
    window.localStorage.setItem(CHECKOUT_DRAFT_LS_KEY, created);
    return created;
  } catch {
    return makeDraftId();
  }
}

function setDraftId(draftId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHECKOUT_DRAFT_LS_KEY, String(draftId || ""));
  } catch {
    // noop
  }
}

async function readJsonSafe(res) {
  const text = await res.text().catch(() => "");
  if (!text) return { json: null, text: "" };

  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

async function fetchStatusSafe() {
  try {
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    const to = ac ? setTimeout(() => ac.abort(), 2500) : null;

    const r = await fetch("/api/status", {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: ac ? ac.signal : undefined,
    });

    if (to) clearTimeout(to);

    const text = await r.text();
    let data = null;

    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, error: text };
    }

    if (!r.ok) return { ok: false, error: data?.error || `HTTP ${r.status}` };
    return data;
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

function PauseNotice({ reason, t }) {
  return (
    <div className="pauseNotice" role="status" aria-live="polite">
      <div className="pauseBadge">{t("cart.pause.badge", "PAUSAD")}</div>
      <div className="pauseText">
        {t("cart.pause.text", "Butiken är tillfälligt pausad.")}
        {reason ? <span className="pauseReason"> ({reason})</span> : null}
      </div>
    </div>
  );
}

function normalizeLineKey(item, idx = 0) {
  return cleanStr(
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

function truthyFlag(value) {
  if (value === true) return true;
  if (value === false) return false;

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
    item?.availabilityType,
    item?.availabilityLabel,
    item?.fulfillmentType,
    item?.ctaMode,
    item?.lineMode,
    item?.orderType,
    item?.product?.title,
    item?.product?.name,
    item?.product?.status,
    item?.product?.badge,
    item?.product?.subtitle,
    item?.product?.slug,
    item?.product?.handle,
    item?.product?.url,
    item?.product?.sku,
    item?.product?.category,
    item?.product?.type,
    item?.product?.availabilityType,
    item?.product?.availabilityLabel,
    item?.product?.fulfillmentType,
    item?.product?.ctaMode,
    item?.meta?.label,
    item?.meta?.statusLabel,
    item?.meta?.badge,
    item?.meta?.status,
    item?.meta?.slug,
    item?.meta?.handle,
    item?.meta?.category,
    item?.meta?.type,
    item?.meta?.availabilityType,
    item?.meta?.availabilityLabel,
    item?.meta?.fulfillmentType,
    item?.meta?.lineMode,
    item?.meta?.orderType,
    getNested(item, "product.meta.slug"),
    getNested(item, "product.meta.handle"),
    getNested(item, "product.meta.badge"),
    getNested(item, "product.meta.status"),
    getNested(item, "product.meta.category"),
    getNested(item, "product.meta.type"),
    getNested(item, "product.meta.availabilityType"),
    getNested(item, "product.meta.availabilityLabel"),
    getNested(item, "product.meta.fulfillmentType"),
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
    text.includes("forbestall") ||
    text.includes("for bestall") ||
    text.includes("förbeställ") ||
    text.includes("förköp") ||
    text.includes("forhandsbok") ||
    text.includes("förhandsbok") ||
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
    text.includes("restock alert") ||
    text.includes("mail me") ||
    text.includes("bevaka") ||
    text.includes("meddela mig")
  );
}

function hasCategory(item, category) {
  const key = normalizeCategory(category);
  if (!key) return false;

  const categories = [
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

  return categories.includes(key);
}

function detectLineMode(item) {
  const meta = item?.meta && typeof item.meta === "object" ? item.meta : {};

  const direct = normalizeSearchText(
    item?.lineMode ||
      item?.orderType ||
      item?.ctaMode ||
      meta?.lineMode ||
      meta?.orderType ||
      meta?.ctaMode ||
      item?.product?.lineMode ||
      item?.product?.orderType ||
      item?.product?.ctaMode ||
      ""
  );

  if (direct === "buy" || direct === "standard") return "buy";
  if (
    direct === "preorder" ||
    direct === "pre order" ||
    direct === "pre-order" ||
    direct === "pre_order"
  ) {
    return "preorder";
  }
  if (
    direct === "notify" ||
    direct === "notify me" ||
    direct === "notify-only" ||
    direct === "notify only" ||
    direct === "notify_me"
  ) {
    return "notify";
  }

  const notifyFlags = [
    item?.notifyMe,
    item?.notify_me,
    item?.backInStockOnly,
    item?.notifyOnly,
    meta?.notifyMe,
    meta?.notify_me,
    meta?.backInStockOnly,
    meta?.notifyOnly,
    item?.product?.notifyMe,
    item?.product?.notify_me,
    item?.product?.backInStockOnly,
    item?.product?.notifyOnly,
    getNested(item, "product.meta.notifyMe"),
    getNested(item, "product.meta.notifyOnly"),
    getNested(item, "product.meta.backInStockOnly"),
    getNested(item, "product.flags.notifyMe"),
    getNested(item, "product.flags.backInStockOnly"),
  ];

  if (notifyFlags.some(truthyFlag)) return "notify";

  const explicitPreorder = [
    item?.preorder,
    item?.isPreorder,
    item?.preOrder,
    item?.preorderActive,
    item?.preorderOnly,
    meta?.preorder,
    meta?.isPreorder,
    meta?.preOrder,
    meta?.preorderActive,
    meta?.preorderOnly,
    item?.product?.preorder,
    item?.product?.isPreorder,
    item?.product?.preOrder,
    item?.product?.preorderOnly,
    getNested(item, "product.meta.preorder"),
    getNested(item, "product.meta.isPreorder"),
    getNested(item, "product.meta.preOrder"),
    getNested(item, "product.meta.preorderOnly"),
    getNested(item, "product.flags.preorder"),
    getNested(item, "product.flags.preOrder"),
  ];

  if (explicitPreorder.some(truthyFlag)) return "preorder";

  const fulfillment = normalizeSearchText(
    item?.fulfillmentType ||
      item?.availabilityType ||
      meta?.fulfillmentType ||
      meta?.availabilityType ||
      item?.product?.fulfillmentType ||
      item?.product?.availabilityType ||
      getNested(item, "product.meta.fulfillmentType") ||
      getNested(item, "product.meta.availabilityType") ||
      ""
  );

  if (
    fulfillment === "preorder" ||
    fulfillment === "pre order" ||
    fulfillment === "pre-order" ||
    fulfillment === "pre_order"
  ) {
    return "preorder";
  }

  if (
    fulfillment === "notify" ||
    fulfillment === "notify me" ||
    fulfillment === "notify-me" ||
    fulfillment === "notify_me" ||
    fulfillment === "back in stock" ||
    fulfillment === "back-in-stock" ||
    fulfillment === "back_in_stock"
  ) {
    return "notify";
  }

  const texts = extractSearchTexts(item);
  if (texts.some(hasNotifyKeyword)) return "notify";
  if (texts.some(hasPreorderKeyword)) return "preorder";

  return "buy";
}

function detectSpecialCategory(item) {
  const texts = extractSearchTexts(item).join(" ");

  if (
    hasCategory(item, "market-lab") ||
    texts.includes("market lab") ||
    texts.includes("future idea") ||
    texts.includes("concept") ||
    texts.includes("prototype")
  ) {
    return "market-lab";
  }

  if (
    hasCategory(item, "travel") ||
    texts.includes("travel") ||
    texts.includes("resa") ||
    texts.includes("seyahat") ||
    texts.includes("bagage") ||
    texts.includes("luggage")
  ) {
    return "travel";
  }

  if (
    hasCategory(item, "supply") ||
    texts.includes("supply") ||
    texts.includes("starter kit") ||
    texts.includes("starter pack") ||
    texts.includes("nödkit") ||
    texts.includes("nodkit")
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

function getPreorderText(item, i18n, t) {
  const meta = item?.meta && typeof item.meta === "object" ? item.meta : {};

  const raw =
    item?.preorderText ||
    item?.availabilityText ||
    item?.preorderNote ||
    meta?.preorderText ||
    meta?.availabilityText ||
    meta?.preorderNote ||
    item?.product?.preorderText ||
    item?.product?.availabilityText ||
    item?.product?.preorderNote ||
    "";

  const text = cleanStr(raw, 260);
  if (text) return text;

  const leadDays = getPreorderLeadDays(item);
  if (leadDays > 0) {
    return tx(
      i18n,
      t,
      "cart.preorder.lineLeadDays",
      {
        sv: "Reserveras nu. Beräknad produktionsvåg: cirka {{days}} dagar.",
        en: "Reserved now. Estimated production wave: about {{days}} days.",
        tr: "Şimdi rezerve edilir. Tahmini üretim dalgası: yaklaşık {{days}} gün.",
      },
      { days: leadDays }
    );
  }

  return TT(i18n, t, "cart.preorder.lineDefault", {
    sv: "Reserveras nu och levereras i en senare produktionsvåg.",
    en: "Reserved now and delivered in a later production wave.",
    tr: "Şimdi rezerve edilir ve sonraki üretim dalgasında teslim edilir.",
  });
}

function getNotifyText(item, i18n, t) {
  const meta = item?.meta && typeof item.meta === "object" ? item.meta : {};

  const raw =
    item?.notifyText ||
    item?.notifyNote ||
    item?.availabilityText ||
    meta?.notifyText ||
    meta?.notifyNote ||
    item?.product?.notifyText ||
    item?.product?.notifyNote ||
    item?.product?.availabilityText ||
    "";

  const text = cleanStr(raw, 260);
  if (text) return text;

  return TT(i18n, t, "cart.notify.lineDefault", {
    sv: "Den här produkten är inte köpbar just nu. Bevaka den och få mejl när den blir tillgänglig.",
    en: "This product is not available to buy right now. Watch it and get an email when it becomes available.",
    tr: "Bu ürün şu anda satın alınamaz. Takibe al ve hazır olduğunda e-posta al.",
  });
}

function buildFlowMeta(items, i18n, t) {
  const all = Array.isArray(items) ? items : [];

  const buyItems = all.filter((it) => detectLineMode(it) === "buy");
  const preorderItems = all.filter((it) => detectLineMode(it) === "preorder");
  const notifyItems = all.filter((it) => detectLineMode(it) === "notify");

  const leadDays = preorderItems
    .map((it) => getPreorderLeadDays(it))
    .filter((n) => Number.isFinite(n) && n > 0);

  const hasPreorder = preorderItems.length > 0;
  const hasNotifyOnly = notifyItems.length > 0;
  const mixedCart = preorderItems.length > 0 && buyItems.length > 0;
  const preorderOnly = preorderItems.length > 0 && buyItems.length === 0;
  const notifyOnly = notifyItems.length > 0 && buyItems.length === 0 && preorderItems.length === 0;

  let flowType = "standard";
  if (notifyOnly) flowType = "notify_only";
  else if (mixedCart) flowType = "mixed";
  else if (preorderOnly) flowType = "preorder";

  let summaryText = "";
  if (flowType === "preorder") {
    summaryText = TT(i18n, t, "cart.flowSummary.preorder", {
      sv: "Hela ordern består av förbeställningar. Leverans sker i senare produktionsvåg.",
      en: "The entire order consists of pre-orders. Delivery happens in a later production wave.",
      tr: "Siparişin tamamı ön siparişlerden oluşuyor. Teslimat sonraki üretim dalgasında yapılır.",
    });
  } else if (flowType === "mixed") {
    summaryText = TT(i18n, t, "cart.flowSummary.mixed", {
      sv: "Korgen innehåller både vanliga köp och förbeställningar. Förbeställda artiklar levereras i senare produktionsvåg.",
      en: "The cart contains both regular purchases and pre-orders. Pre-order items ship in a later production wave.",
      tr: "Sepet hem normal satın alımlar hem ön siparişler içeriyor. Ön sipariş ürünleri sonraki üretim dalgasında gönderilir.",
    });
  } else if (flowType === "notify_only") {
    summaryText = TT(i18n, t, "cart.flowSummary.notifyOnly", {
      sv: "Korgen innehåller endast bevakningsprodukter. Dessa ska inte gå till checkout utan till bevaka mig-flöde.",
      en: "The cart only contains notify-me products. These should not go to checkout, but to the notify-me flow.",
      tr: "Sepet yalnızca bildirim ürünleri içeriyor. Bunlar checkout yerine bildirim akışına gitmeli.",
    });
  }

  return {
    hasPreorder,
    hasNotifyOnly,
    preorderCount: preorderItems.length,
    preorderQty: preorderItems.reduce((sum, it) => sum + Math.max(1, Number(it?.qty || 1)), 0),
    preorderLineKeys: preorderItems.map((it, idx) => normalizeLineKey(it, idx)).filter(Boolean),
    preorderLeadDaysMin: leadDays.length ? Math.min(...leadDays) : 0,
    preorderLeadDaysMax: leadDays.length ? Math.max(...leadDays) : 0,
    preorderMixedWithRegular: mixedCart,
    mixedCart,
    flowType,
    notifyOnlyCount: notifyItems.length,
    summaryText,
  };
}

function compactCartItems(items, i18n, t) {
  return (Array.isArray(items) ? items : []).map((it, idx) => {
    const lineMode = detectLineMode(it);
    const preorder = lineMode === "preorder";
    const notifyOnly = lineMode === "notify";
    const preorderText = preorder ? getPreorderText(it, i18n, t) : "";
    const notifyText = notifyOnly ? getNotifyText(it, i18n, t) : "";
    const leadDays = getPreorderLeadDays(it);
    const specialCategory = detectSpecialCategory(it);

    const slug = cleanStr(it?.slug || it?.handle || it?.product?.slug || it?.product?.handle || "", 240);
    const image =
      it?.image ||
      it?.images?.find?.((x) => x?.type === "thumb")?.image ||
      it?.images?.find?.((x) => x?.type === "hero")?.image ||
      it?.images?.[0]?.image ||
      it?.images?.[0]?.src ||
      it?.product?.image ||
      it?.product?.images?.find?.((x) => x?.type === "thumb")?.image ||
      it?.product?.images?.find?.((x) => x?.type === "hero")?.image ||
      it?.product?.images?.[0]?.image ||
      it?.product?.images?.[0]?.src ||
      "";

    return {
      lineKey: normalizeLineKey(it, idx),
      variantKey: cleanStr(it?.variantKey || "", 240),
      id: it?.id || it?.product?.id || String(idx),
      slug,
      title: it?.title || it?.product?.title || "",
      name: it?.name || it?.title || it?.product?.title || "",
      image,
      price: Number(it?.price ?? it?.product?.price ?? 0),
      priceSEK: Number(it?.priceSEK ?? it?.price ?? it?.product?.price ?? 0),
      qty: Math.max(1, Number(it?.qty || 1)),
      variantTitle:
        it?.variantTitle || it?.variant || [it?.meta?.size, it?.meta?.color].filter(Boolean).join(", "),
      variant: it?.variant || it?.variantTitle || "",

      lineMode,
      ctaMode: lineMode,
      orderType: preorder ? "preorder" : notifyOnly ? "notify" : "standard",
      fulfillmentType: preorder ? "preorder" : notifyOnly ? "notify" : "ready_for_fulfillment",
      availabilityType: preorder ? "preorder" : notifyOnly ? "notify" : it?.availabilityType || it?.product?.availabilityType || "",
      fulfillmentStatus: preorder ? "pending" : notifyOnly ? "waiting_interest" : "accepted",
      printfulEligible: !preorder && !notifyOnly,

      preorder,
      isPreorder: preorder,
      preOrder: preorder,
      preorderOnly: preorder || undefined,
      preorderText,
      preorderNote: preorderText || undefined,
      preorderLeadDays: leadDays,

      notifyOnly: notifyOnly || undefined,
      notifyMe: notifyOnly || undefined,
      notifyText: notifyText || undefined,
      notifyNote: notifyText || undefined,

      category: specialCategory || it?.category || it?.product?.category || "",
      categories: Array.isArray(it?.categories)
        ? it.categories
        : Array.isArray(it?.product?.categories)
          ? it.product.categories
          : specialCategory
            ? [specialCategory]
            : undefined,

      badge: cleanStr(it?.badge || it?.product?.badge || it?.meta?.badge || "", 120),
      status: cleanStr(it?.status || it?.product?.status || it?.meta?.status || "", 120),

      meta:
        it?.meta && typeof it.meta === "object"
          ? {
              ...it.meta,
              size: it.meta.size || undefined,
              color: it.meta.color || undefined,
              material: it.meta.material || undefined,
              preorder: preorder || undefined,
              isPreorder: preorder || undefined,
              preOrder: preorder || undefined,
              preorderText: preorderText || undefined,
              preorderNote: preorderText || undefined,
              preorderLeadDays: leadDays || undefined,
              notifyOnly: notifyOnly || undefined,
              notifyMe: notifyOnly || undefined,
              notifyText: notifyText || undefined,
              notifyNote: notifyText || undefined,
              lineMode,
              ctaMode: lineMode,
              orderType: preorder ? "preorder" : notifyOnly ? "notify" : "standard",
              fulfillmentType: preorder ? "preorder" : notifyOnly ? "notify" : "ready_for_fulfillment",
              availabilityType: preorder ? "preorder" : notifyOnly ? "notify" : it.meta.availabilityType,
              category: specialCategory || it.meta.category || undefined,
            }
          : {
              preorder: preorder || undefined,
              isPreorder: preorder || undefined,
              preOrder: preorder || undefined,
              preorderText: preorderText || undefined,
              preorderNote: preorderText || undefined,
              preorderLeadDays: leadDays || undefined,
              notifyOnly: notifyOnly || undefined,
              notifyMe: notifyOnly || undefined,
              notifyText: notifyText || undefined,
              notifyNote: notifyText || undefined,
              lineMode,
              ctaMode: lineMode,
              orderType: preorder ? "preorder" : notifyOnly ? "notify" : "standard",
              fulfillmentType: preorder ? "preorder" : notifyOnly ? "notify" : "ready_for_fulfillment",
              availabilityType: preorder ? "preorder" : notifyOnly ? "notify" : undefined,
              category: specialCategory || undefined,
            },

      product:
        it?.product && typeof it.product === "object"
          ? {
              ...it.product,
              slug: it.product.slug || slug,
              image: it.product.image || image,
              preorder:
                preorder ||
                truthyFlag(it?.product?.preorder) ||
                truthyFlag(it?.product?.isPreorder) ||
                truthyFlag(it?.product?.preOrder) ||
                undefined,
              isPreorder:
                preorder ||
                truthyFlag(it?.product?.preorder) ||
                truthyFlag(it?.product?.isPreorder) ||
                truthyFlag(it?.product?.preOrder) ||
                undefined,
              preOrder:
                preorder ||
                truthyFlag(it?.product?.preOrder) ||
                undefined,
              notifyOnly:
                notifyOnly ||
                truthyFlag(it?.product?.notifyMe) ||
                truthyFlag(it?.product?.backInStockOnly) ||
                undefined,
              notifyMe:
                notifyOnly ||
                truthyFlag(it?.product?.notifyMe) ||
                undefined,
              lineMode,
              ctaMode: lineMode,
              orderType: preorder ? "preorder" : notifyOnly ? "notify" : "standard",
              fulfillmentType: preorder ? "preorder" : notifyOnly ? "notify" : it.product.fulfillmentType,
              availabilityType: preorder ? "preorder" : notifyOnly ? "notify" : it.product.availabilityType,
              category: specialCategory || it.product.category,
              categories: Array.isArray(it.product.categories)
                ? it.product.categories
                : specialCategory
                  ? [specialCategory]
                  : it.product.categories,
            }
          : undefined,
    };
  });
}

function buildRestoreErrorMessage(codeOrText, i18n, t) {
  const raw = String(codeOrText || "").trim();

  if (!raw) {
    return TT(i18n, t, "cart.restore.errors.default", {
      sv: "Kunde inte återställa kundvagnen.",
      en: "Could not restore the cart.",
      tr: "Sepet geri yüklenemedi.",
    });
  }

  if (raw.includes("missing_draft_id")) {
    return TT(i18n, t, "cart.restore.errors.missingDraftId", {
      sv: "Restore-länken saknar draft-id.",
      en: "The restore link is missing a draft id.",
      tr: "Geri yükleme bağlantısında taslak kimliği eksik.",
    });
  }

  if (raw.includes("not_found")) {
    return TT(i18n, t, "cart.restore.errors.notFound", {
      sv: "Den sparade kundvagnen hittades inte.",
      en: "The saved cart was not found.",
      tr: "Kaydedilen sepet bulunamadı.",
    });
  }

  if (raw.includes("empty_cart")) {
    return TT(i18n, t, "cart.restore.errors.emptyCart", {
      sv: "Den sparade kundvagnen var tom.",
      en: "The saved cart was empty.",
      tr: "Kaydedilen sepet boştu.",
    });
  }

  if (raw.includes("checkout_restore_failed")) {
    return TT(i18n, t, "cart.restore.errors.failed", {
      sv: "Återställningen misslyckades just nu.",
      en: "The restore failed right now.",
      tr: "Geri yükleme şu anda başarısız oldu.",
    });
  }

  if (raw.includes("not_restorable")) {
    return TT(i18n, t, "cart.restore.errors.notRestorable", {
      sv: "Den sparade kundvagnen går inte längre att återställa.",
      en: "The saved cart can no longer be restored.",
      tr: "Kaydedilen sepet artık geri yüklenemiyor.",
    });
  }

  return tx(
    i18n,
    t,
    "cart.restore.errors.withDetail",
    {
      sv: "Kunde inte återställa kundvagnen. ({{detail}})",
      en: "Could not restore the cart. ({{detail}})",
      tr: "Sepet geri yüklenemedi. ({{detail}})",
    },
    { detail: raw }
  );
}

function buildCoreMeta(core) {
  return {
    userId: core.userId || "",
    memberId: core.memberId || "",
    memberTier: core.memberTier || "guest",
    campaignId: core.campaignId || "",
    creatorId: core.creatorId || "",
    affiliateId: core.affiliateId || "",
    associateId: core.associateId || "",
    associateCode: core.associateCode || "",
    sourceChannel: core.sourceChannel || "store",
    entryPoint: core.entryPoint || "cart",
    sessionRef: "",
    attribution: {
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmContent: "",
      utmTerm: "",
      referrer: typeof document !== "undefined" ? String(document.referrer || "") : "",
      landingPath:
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/cart",
    },
  };
}

function buildDreamPointsMeta({ points, level, preview, currency }) {
  const earnOnThisOrder = Math.max(0, Number(preview?.earnOnThisOrder || 0));
  const maxRedeemSek = Math.max(0, Number(preview?.maxRedeemSek || 0));
  const nextBalance = Math.max(
    0,
    Number(preview?.nextBalance ?? Number(points || 0) + earnOnThisOrder)
  );

  return {
    balance: Math.max(0, Number(points || 0)),
    level: String(level || "starlight").toLowerCase(),
    earnPreview: earnOnThisOrder,
    maxRedeemSek,
    maxRedeemActive: maxRedeemSek,
    nextBalance,
    currency: String(currency || "SEK"),
    locale:
      typeof window !== "undefined" ? String(window.navigator?.language || "sv-SE") : "sv-SE",
    mode: "preview",
  };
}

function isProbablyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function buildCheckoutPrefillPayload({
  items,
  compactItems,
  core,
  coreMeta,
  dreamPointsMeta,
  totalsSEK,
  currency,
  anyPhysical,
  flowMeta,
}) {
  return {
    source: "cart",
    lastStep: "cart",
    savedAt: new Date().toISOString(),
    currency,
    anyPhysical,
    shippingCountry: "SE",
    items: compactItems,
    rawItems: items,
    totalsSEK,
    preorderMeta: flowMeta,
    orderFlowType: flowMeta.flowType || "standard",
    hasPreorder: !!flowMeta.hasPreorder,
    hasNotifyOnly: !!flowMeta.hasNotifyOnly,
    userId: core.userId,
    memberId: core.memberId,
    memberTier: core.memberTier,
    campaignId: core.campaignId,
    creatorId: core.creatorId,
    affiliateId: core.affiliateId,
    associateId: core.associateId,
    associateCode: core.associateCode,
    sourceChannel: core.sourceChannel || "store",
    entryPoint: core.entryPoint || "cart",
    coreMeta,
    dreamPointsMeta,
  };
}

export default function Cart() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { items: rawItems, inc, dec, remove, clear, replaceCart } = useCart();
  const { currency, locale, rates } = useCurrency();
  const { points, level, previewForCart, getSnapshot } = useDreamPoints();

  const [paused, setPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  const [saveEmail, setSaveEmail] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [saveMsg, setSaveMsg] = useState("");

  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState("");
  const [restoreErr, setRestoreErr] = useState("");

  const restoreOnceRef = useRef("");
  const beginCheckoutOnceRef = useRef(false);

  useEffect(() => {
    syncCoreIdsFromSearchParams(searchParams);
  }, [searchParams]);

  useEffect(() => {
    let alive = true;

    async function tick() {
      const s = await fetchStatusSafe();
      if (!alive) return;

      if (!s?.ok) {
        setPaused(false);
        setPauseReason("");
        return;
      }

      setPaused(!!s.paused);
      setPauseReason(String(s.reason || ""));
    }

    tick();
    const id = setInterval(tick, 30_000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function runRestore() {
      const paramsSnapshot = new URLSearchParams(searchParams);
      const restoreDraftId = String(paramsSnapshot.get("restore") || "").trim();
      const restoreError = String(paramsSnapshot.get("restore_error") || "").trim();

      if (restoreError) {
        setRestoreBusy(false);
        setRestoreMsg("");
        setRestoreErr(buildRestoreErrorMessage(restoreError, i18n, t));

        const next = new URLSearchParams(paramsSnapshot);
        next.delete("restore");
        next.delete("restore_error");
        next.delete("draftId");
        setSearchParams(next, { replace: true });
        return;
      }

      if (!restoreDraftId) return;
      if (restoreOnceRef.current === restoreDraftId) return;

      restoreOnceRef.current = restoreDraftId;
      setRestoreBusy(true);
      setRestoreErr("");
      setRestoreMsg("");

      try {
        const url = new URL("/api/checkout-restore", window.location.origin);
        url.searchParams.set("draftId", restoreDraftId);

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: { accept: "application/json" },
          cache: "no-store",
        });

        const { json, text } = await readJsonSafe(res);

        if (!res.ok || !json?.ok) {
          const msg = json?.detail || json?.error || text || res.statusText || "restore_failed";
          throw new Error(msg);
        }

        const restoredItems = Array.isArray(json?.items) ? json.items : [];
        if (!restoredItems.length) throw new Error("empty_cart");

        replaceCart(restoredItems);
        setDraftId(restoreDraftId);

        if (!alive) return;

        setRestoreMsg(
          tx(
            i18n,
            t,
            "cart.restore.success",
            {
              sv: "Kundvagnen återställd ✅ {{count}} produkt{{suffix}} laddad{{loadedSuffix}}.",
              en: "Cart restored ✅ {{count}} product{{suffix}} loaded.",
              tr: "Sepet geri yüklendi ✅ {{count}} ürün yüklendi.",
            },
            {
              count: restoredItems.length,
              suffix: restoredItems.length === 1 ? "" : "er",
              loadedSuffix: restoredItems.length === 1 ? "" : "e",
            }
          )
        );
        setRestoreErr("");

        const next = new URLSearchParams(paramsSnapshot);
        next.delete("restore");
        next.delete("draftId");
        next.delete("restore_error");
        setSearchParams(next, { replace: true });
      } catch (e) {
        if (!alive) return;

        setRestoreMsg("");
        setRestoreErr(buildRestoreErrorMessage(e?.message || e, i18n, t));

        const next = new URLSearchParams(paramsSnapshot);
        next.delete("restore");
        next.delete("draftId");
        next.delete("restore_error");
        setSearchParams(next, { replace: true });
      } finally {
        if (alive) setRestoreBusy(false);
      }
    }

    runRestore();

    return () => {
      alive = false;
    };
  }, [searchParams, setSearchParams, replaceCart, i18n, t]);

  const items = Array.isArray(rawItems) ? rawItems : [];
  const isEmpty = items.length === 0;

  const anyPhysical = useMemo(() => hasPhysicalItems(items), [items]);
  const allDigital = useMemo(() => items.length > 0 && !anyPhysical, [items.length, anyPhysical]);

  const totals = useMemo(() => computeTotals(items, currency, rates, "SE"), [items, currency, rates]);
  const totalsSEK = useMemo(() => computeTotalsSEKFromCart(items, "SE"), [items]);

  const displayTotals = useMemo(() => {
    if (allDigital) return { ...totals, shipping: 0, total: totals.subtotal };
    return totals;
  }, [allDigital, totals]);

  const progress = useMemo(() => {
    if (!anyPhysical) return { isFree: true, remainingSEK: 0, remainingActive: 0, thresholdSEK: 0 };
    return computeFreeShippingProgress(totals.subtotalSEK, currency, rates, "SE", items);
  }, [anyPhysical, totals.subtotalSEK, currency, rates, items]);

  const dreamPointsPreview = useMemo(() => {
    return previewForCart(Number(totalsSEK?.sub ?? totalsSEK?.grand ?? 0));
  }, [previewForCart, totalsSEK]);

  const flowMeta = useMemo(() => buildFlowMeta(items, i18n, t), [items, i18n, t]);
  const isPurePreorderFlow = flowMeta.flowType === "preorder";
  const isMixedFlow = flowMeta.flowType === "mixed";
  const isNotifyOnlyFlow = flowMeta.flowType === "notify_only";

  function Money({ value }) {
    return <span>{formatMoney(value, currency, locale)}</span>;
  }

  function safeTrackBeginCheckout(meta) {
    try {
      if (typeof trackBeginCheckout === "function") trackBeginCheckout(meta);
    } catch {
      // noop
    }
  }

  function handleCheckout() {
    if (isEmpty) return;
    if (paused) return;
    if (isNotifyOnlyFlow) return;

    const core = buildCoreSystemFields(searchParams);
    const dreamSnapshot = typeof getSnapshot === "function" ? getSnapshot() : null;

    const compactItems = compactCartItems(items, i18n, t);
    const coreMeta = buildCoreMeta(core);
    const dreamPointsMeta = buildDreamPointsMeta({
      points: Number(dreamSnapshot?.points ?? points ?? 0),
      level: String(dreamSnapshot?.level ?? level ?? "starlight"),
      preview: dreamPointsPreview,
      currency,
    });

    safeSetJsonLS(
      "cw.checkout.prefill",
      buildCheckoutPrefillPayload({
        items,
        compactItems,
        core,
        coreMeta,
        dreamPointsMeta,
        totalsSEK,
        currency,
        anyPhysical,
        flowMeta,
      })
    );

    if (!beginCheckoutOnceRef.current) {
      beginCheckoutOnceRef.current = true;

      safeTrackBeginCheckout({
        source: "cart",
        currency,
        itemsCount: items.length,
        total: Number(displayTotals?.total ?? 0),
        anyPhysical: !!anyPhysical,
        userId: core.userId || "",
        memberId: core.memberId || "",
        memberTier: core.memberTier || "guest",
        campaignId: core.campaignId || "",
        creatorId: core.creatorId || "",
        affiliateId: core.affiliateId || "",
        associateId: core.associateId || "",
        associateCode: core.associateCode || "",
        sourceChannel: core.sourceChannel || "store",
        entryPoint: core.entryPoint || "cart",
        dreamPointsLevel: dreamSnapshot?.level || level || "starlight",
        hasPreorder: flowMeta.hasPreorder,
        preorderCount: flowMeta.preorderCount,
        preorderQty: flowMeta.preorderQty || 0,
        orderFlowType: flowMeta.flowType || "standard",
      });
    }

    navigate("/checkout");
  }

  async function handleSaveCart(e) {
    e.preventDefault();

    const email = String(saveEmail || "").trim().toLowerCase();

    if (!email || isEmpty) return;

    if (!isProbablyEmail(email)) {
      setSaveState("error");
      setSaveMsg(
        TT(i18n, t, "cart.saveCart.errors.invalid_email_local", {
          sv: "Ange en giltig e-postadress.",
          en: "Enter a valid email address.",
          tr: "Geçerli bir e-posta gir.",
        })
      );
      return;
    }

    setSaveState("loading");
    setSaveMsg("");

    try {
      const draftId = getOrCreateDraftId();
      const core = buildCoreSystemFields(searchParams);
      const dreamSnapshot = typeof getSnapshot === "function" ? getSnapshot() : null;

      const coreMeta = buildCoreMeta(core);
      const dreamPointsMeta = buildDreamPointsMeta({
        points: Number(dreamSnapshot?.points ?? points ?? 0),
        level: String(dreamSnapshot?.level ?? level ?? "starlight"),
        preview: dreamPointsPreview,
        currency,
      });

      const compactItems = compactCartItems(items, i18n, t);

      const res = await fetch("/api/checkout-draft", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          action: "save",
          draftId,
          email,
          lang: String(i18n?.language || "sv").slice(0, 2).toLowerCase(),
          currency,
          source: "cart",
          sourceChannel: core.sourceChannel || "store",
          entryPoint: core.entryPoint || "cart",
          lastStep: "cart",
          anyPhysical,
          shippingCountry: "SE",
          totalsSEK,
          preorderMeta: flowMeta,
          orderFlowType: flowMeta.flowType || "standard",
          hasPreorder: !!flowMeta.hasPreorder,
          hasNotifyOnly: !!flowMeta.hasNotifyOnly,
          customer: {
            email,
            name: "",
            phone: "",
          },
          shipping: {
            country: "SE",
          },
          items: compactItems,
          userId: core.userId,
          memberId: core.memberId,
          memberTier: core.memberTier,
          campaignId: core.campaignId,
          creatorId: core.creatorId,
          affiliateId: core.affiliateId,
          associateId: core.associateId,
          associateCode: core.associateCode,
          coreMeta,
          dreamPointsMeta,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        const key = String(data?.error || "unknown");
        const detail = String(data?.detail || data?.message || "").trim();

        let msg = TT(i18n, t, `cart.saveCart.errors.${key}`, {
          sv:
            key === "invalid_email"
              ? "Ange en giltig e-postadress."
              : key === "empty_cart"
                ? "Din kundvagn är tom."
                : key === "missing_draft_id"
                  ? "Kundvagnen kunde inte få ett utkast-id."
                  : key === "missing_db_binding"
                    ? "Cloudflare DB-binding saknas för checkout-draft."
                    : key === "invalid_json"
                      ? "API fick ogiltig data."
                      : "Kunde inte spara kundvagnen just nu.",
          en:
            key === "invalid_email"
              ? "Enter a valid email address."
              : key === "empty_cart"
                ? "Your cart is empty."
                : key === "missing_draft_id"
                  ? "The cart could not get a draft id."
                  : key === "missing_db_binding"
                    ? "Cloudflare DB binding is missing for checkout-draft."
                    : key === "invalid_json"
                      ? "API received invalid data."
                      : "Could not save the cart right now.",
          tr:
            key === "invalid_email"
              ? "Geçerli bir e-posta gir."
              : key === "empty_cart"
                ? "Sepetin boş."
                : key === "missing_draft_id"
                  ? "Sepet için taslak kimliği oluşturulamadı."
                  : key === "missing_db_binding"
                    ? "checkout-draft için Cloudflare DB bağlantısı eksik."
                    : key === "invalid_json"
                      ? "API geçersiz veri aldı."
                      : "Sepet şu anda kaydedilemedi.",
        });

        if (detail) msg += ` (${detail})`;

        setSaveState("error");
        setSaveMsg(msg);
        return;
      }

      setSaveState("ok");
      setSaveMsg(
        TT(i18n, t, "cart.saveCart.success", {
          sv: "Klart! Vi har sparat din kundvagn.",
          en: "Done! Your cart has been saved.",
          tr: "Tamam! Sepetin kaydedildi.",
        })
      );
      setSaveEmail("");
    } catch {
      setSaveState("error");
      setSaveMsg(
        TT(i18n, t, "cart.saveCart.errors.network", {
          sv: "Ingen kontakt just nu. Försök igen om en stund.",
          en: "No connection right now. Please try again soon.",
          tr: "Şu anda bağlantı yok. Lütfen biraz sonra tekrar dene.",
        })
      );
    }
  }

  const preorderBodyText =
    flowMeta.preorderLeadDaysMin > 0
      ? isMixedFlow
        ? tx(
            i18n,
            t,
            "cart.preorder.bodyMixedLeadDays",
            {
              sv: "Korgen innehåller både vanliga köp och förbeställningar. Förbeställda artiklar levereras i senare produktionsvåg, cirka {{min}}–{{max}} dagar.",
              en: "Your cart contains both regular purchases and pre-orders. Pre-order items ship in a later production wave, around {{min}}–{{max}} days.",
              tr: "Sepetiniz hem normal satın alımlar hem ön siparişler içeriyor. Ön sipariş ürünleri sonraki üretim dalgasında, yaklaşık {{min}}–{{max}} gün içinde teslim edilir.",
            },
            {
              min: flowMeta.preorderLeadDaysMin,
              max: flowMeta.preorderLeadDaysMax || flowMeta.preorderLeadDaysMin,
            }
          )
        : tx(
            i18n,
            t,
            "cart.preorder.bodyLeadDays",
            {
              sv: "En eller flera produkter reserveras nu. Leverans sker i senare produktionsvåg, cirka {{min}}–{{max}} dagar.",
              en: "One or more items are reserved now. Delivery happens in a later production wave, about {{min}}–{{max}} days.",
              tr: "Bir veya daha fazla ürün şimdi rezerve ediliyor. Teslimat sonraki üretim dalgasında, yaklaşık {{min}}–{{max}} gün içinde olur.",
            },
            {
              min: flowMeta.preorderLeadDaysMin,
              max: flowMeta.preorderLeadDaysMax || flowMeta.preorderLeadDaysMin,
            }
          )
      : isMixedFlow
        ? TT(i18n, t, "cart.preorder.bodyMixed", {
            sv: "Korgen innehåller både vanliga köp och förbeställningar. Förbeställda artiklar levereras i senare produktionsvåg.",
            en: "Your cart contains both regular purchases and pre-orders. Pre-order items ship in a later production wave.",
            tr: "Sepetiniz hem normal satın alımlar hem ön siparişler içeriyor. Ön sipariş ürünleri sonraki üretim dalgasında teslim edilir.",
          })
        : TT(i18n, t, "cart.preorder.body", {
            sv: "En eller flera produkter reserveras nu. Leverans sker i senare produktionsvåg.",
            en: "One or more items are reserved now. Delivery happens in a later production wave.",
            tr: "Bir veya daha fazla ürün şimdi rezerve ediliyor. Teslimat sonraki üretim dalgasında olur.",
          });

  const notifyBodyText = TT(i18n, t, "cart.notifyOnly.body", {
    sv: "Korgen innehåller bara bevakningsprodukter. Dessa ska gå via bevaka-flöde, inte till vanlig checkout.",
    en: "The cart contains only notify-me products. These should go through a notify flow, not standard checkout.",
    tr: "Sepet yalnızca haber ver ürünleri içeriyor. Bunlar normal checkout yerine bildirim akışına gitmeli.",
  });

  const L = {
    title: TT(i18n, t, "cart.title", { sv: "Kundvagn", en: "Cart", tr: "Sepet" }),
    emptyTitle: TT(i18n, t, "cart.empty", {
      sv: "Din kundvagn är tom",
      en: "Your cart is empty",
      tr: "Sepetiniz boş",
    }),
    emptyHint: TT(i18n, t, "cart.emptyHint", {
      sv: "Lägg till några produkter för att komma vidare till kassan.",
      en: "Add some products to continue to checkout.",
      tr: "Kasaya geçmek için birkaç ürün ekleyin.",
    }),
    toShop: TT(i18n, t, "cart.toShop", {
      sv: "Till butiken",
      en: "Go to shop",
      tr: "Mağazaya git",
    }),
    continueShopping: TT(i18n, t, "cart.continue", {
      sv: "Fortsätt handla",
      en: "Continue shopping",
      tr: "Alışverişe devam et",
    }),
    backHome: TT(i18n, t, "thanks.backHome", {
      sv: "Till startsidan",
      en: "Back to home",
      tr: "Ana sayfaya dön",
    }),
    viewProduct: TT(i18n, t, "cart.viewProduct", {
      sv: "Visa produkten",
      en: "View product",
      tr: "Ürünü görüntüle",
    }),
    dec: TT(i18n, t, "cart.decrease", {
      sv: "Minska antal",
      en: "Decrease quantity",
      tr: "Adedi azalt",
    }),
    inc: TT(i18n, t, "cart.increase", {
      sv: "Öka antal",
      en: "Increase quantity",
      tr: "Adedi artır",
    }),
    remove: TT(i18n, t, "cart.remove", {
      sv: "Ta bort",
      en: "Remove",
      tr: "Kaldır",
    }),
    clear: TT(i18n, t, "cart.clear", {
      sv: "Töm kundvagnen",
      en: "Clear cart",
      tr: "Sepeti boşalt",
    }),
    summary: TT(i18n, t, "checkout.summary", {
      sv: "Orderöversikt",
      en: "Order summary",
      tr: "Sipariş özeti",
    }),
    subtotal: TT(i18n, t, "checkout.subtotal", {
      sv: "Delsumma",
      en: "Subtotal",
      tr: "Ara toplam",
    }),
    ship: TT(i18n, t, "checkout.shippingFee", {
      sv: "Frakt",
      en: "Shipping",
      tr: "Kargo",
    }),
    free: TT(i18n, t, "checkout.free", {
      sv: "Fri frakt",
      en: "Free shipping",
      tr: "Ücretsiz kargo",
    }),
    total: TT(i18n, t, "checkout.total", {
      sv: "Totalt",
      en: "Total",
      tr: "Toplam",
    }),
    toFree: (amount) =>
      tx(
        i18n,
        t,
        "checkout.progress.toFree",
        {
          sv: "{{amount}} kvar till fri frakt",
          en: "{{amount}} left for free shipping",
          tr: "Ücretsiz kargo için {{amount}} kaldı",
        },
        { amount }
      ),
    gotFree: TT(i18n, t, "checkout.progress.free", {
      sv: "Du har fri frakt!",
      en: "You have free shipping!",
      tr: "Ücretsiz kargo kazandınız!",
    }),
    checkout: isNotifyOnlyFlow
      ? TT(i18n, t, "cart.notifyOnly.cta", {
          sv: "Bevaka i stället",
          en: "Notify instead",
          tr: "Bunun yerine bildir",
        })
      : isPurePreorderFlow
        ? TT(i18n, t, "cart.checkoutPreorder", {
            sv: "Till förbeställning",
            en: "Continue to preorder",
            tr: "Ön siparişe devam et",
          })
        : isMixedFlow
          ? TT(i18n, t, "cart.checkoutMixed", {
              sv: "Till blandad kassa",
              en: "Continue to mixed checkout",
              tr: "Karma checkout'a devam et",
            })
          : TT(i18n, t, "cart.checkout", {
              sv: "Till kassan",
              en: "Go to checkout",
              tr: "Kasaya git",
            }),
    paused: TT(i18n, t, "cart.pause.button", {
      sv: "Pausad",
      en: "Paused",
      tr: "Duraklatıldı",
    }),
    trust1: TT(i18n, t, "cart.trust.preview1", {
      sv: "Kvitto skapas efter order",
      en: "Receipt is created after the order",
      tr: "Siparişten sonra fiş oluşturulur",
    }),
    returns: TT(i18n, t, "trust.returnsShort", {
      sv: "Tillverkas på beställning • Trygg garanti vid fel",
      en: "Made to order • Safe guarantee for errors",
      tr: "Sipariş üzerine üretilir • Hata durumunda güvenli garanti",
    }),
    celeste: isNotifyOnlyFlow
      ? TT(i18n, t, "cart.celesteNotifyOnly", {
          sv: "Det här ska inte stressas till checkout. Bevaka först – så öppnar vi rätt dörr när produkten är redo.",
          en: "This should not be rushed to checkout. Notify first — we open the right door when the product is ready.",
          tr: "Bu checkout'a aceleyle gitmemeli. Önce bildirim — ürün hazır olduğunda doğru kapıyı açarız.",
        })
      : isPurePreorderFlow
        ? TT(i18n, t, "cart.celestePreorder", {
            sv: "Det här är en reservation. Nästa steg gör förbeställningen tydlig hela vägen.",
            en: "This is a reservation. The next step makes the preorder clear all the way through.",
            tr: "Bu bir rezervasyon. Sonraki adım ön siparişi baştan sona netleştirir.",
          })
        : isMixedFlow
          ? TT(i18n, t, "cart.celesteMixed", {
              sv: "Du har både vanliga köp och förbeställningar här. Vi håller allt tydligt i samma checkout.",
              en: "You have both regular purchases and pre-orders here. We keep everything clear in the same checkout.",
              tr: "Burada hem normal satın alımlar hem ön siparişler var. Hepsini aynı checkout içinde net tutarız.",
            })
          : TT(i18n, t, "cart.celeste", {
              sv: "Det här valet… känns rätt.",
              en: "This choice… feels right.",
              tr: "Bu seçim… doğru hissettiriyor.",
            }),
    saveTitle: TT(i18n, t, "cart.saveCart.title", {
      sv: "Spara kundvagnen",
      en: "Save cart",
      tr: "Sepeti kaydet",
    }),
    saveLead: TT(i18n, t, "cart.saveCart.lead", {
      sv: "Skriv din e-post så kan vi spara kundvagnen inför återkomst.",
      en: "Enter your email and we can save your cart for your return.",
      tr: "E-postanı yaz, dönüşün için sepeti kaydedelim.",
    }),
    savePlaceholder: TT(i18n, t, "cart.saveCart.placeholder", {
      sv: "din@epost.se",
      en: "your@email.com",
      tr: "sen@eposta.com",
    }),
    saveButton: TT(i18n, t, "cart.saveCart.button", {
      sv: "Spara kundvagn",
      en: "Save cart",
      tr: "Sepeti kaydet",
    }),
    saveBusy: TT(i18n, t, "cart.saveCart.busy", {
      sv: "Sparar…",
      en: "Saving…",
      tr: "Kaydediliyor…",
    }),
    dreamTitle: TT(i18n, t, "cart.dreamPoints.title", {
      sv: "DreamPoints™ light",
      en: "DreamPoints™ light",
      tr: "DreamPoints™ light",
    }),
    dreamLead: TT(i18n, t, "cart.dreamPoints.lead", {
      sv: "En mjuk start på medlemsvärde – utan att störa checkout-flödet.",
      en: "A soft start to member value – without disturbing the checkout flow.",
      tr: "Checkout akışını bozmadan üyelik değerine yumuşak bir başlangıç.",
    }),
    dreamBalance: TT(i18n, t, "cart.dreamPoints.balance", {
      sv: "Dina poäng",
      en: "Your points",
      tr: "Puanların",
    }),
    dreamLevel: TT(i18n, t, "cart.dreamPoints.level", {
      sv: "Nivå",
      en: "Level",
      tr: "Seviye",
    }),
    dreamEarnNow: TT(i18n, t, "cart.dreamPoints.earnNow", {
      sv: "Du tjänar nu",
      en: "You earn now",
      tr: "Şimdi kazanırsın",
    }),
    dreamMaxFuture: TT(i18n, t, "cart.dreamPoints.maxFuture", {
      sv: "Möjlig rabatt senare",
      en: "Possible discount later",
      tr: "Daha sonra olası indirim",
    }),
    dreamHint: TT(i18n, t, "cart.dreamPoints.hint", {
      sv: "Snart kan detta kopplas till order, receipt och tydligare medlemsförmåner.",
      en: "Soon this can connect to orders, receipts, and clearer member benefits.",
      tr: "Yakında bu siparişlere, fişlere ve daha net üyelik avantajlarına bağlanabilir.",
    }),
    preorderBadge: TT(i18n, t, "cart.preorder.badge", {
      sv: "Förbeställning",
      en: "Preorder",
      tr: "Ön sipariş",
    }),
    notifyBadge: TT(i18n, t, "cart.notify.badge", {
      sv: "Bevaka",
      en: "Notify me",
      tr: "Bildir",
    }),
    marketLabBadge: TT(i18n, t, "cart.marketLab.badge", {
      sv: "Market Lab",
      en: "Market Lab",
      tr: "Market Lab",
    }),
    preorderTitle: isMixedFlow
      ? TT(i18n, t, "cart.preorder.titleMixed", {
          sv: "Förbeställning + vanligt köp",
          en: "Preorder + regular purchase",
          tr: "Ön sipariş + normal satın alım",
        })
      : TT(i18n, t, "cart.preorder.title", {
          sv: "Förbeställning i kundvagnen",
          en: "Preorder in cart",
          tr: "Sepette ön sipariş var",
        }),
    preorderBody: preorderBodyText,
    notifyTitle: TT(i18n, t, "cart.notify.title", {
      sv: "Bevakningsläge i kundvagnen",
      en: "Notify-only items in cart",
      tr: "Sepette sadece bildirim ürünleri",
    }),
    notifyBody: notifyBodyText,
    cartKicker: TT(i18n, t, "cart.kicker", {
      sv: "Checkout Mode",
      en: "Checkout Mode",
      tr: "Checkout Mode",
    }),
    cartLead: TT(i18n, t, "cart.lead", {
      sv: "Här blir valet verkligt. En sista överblick innan du går vidare in i Calestras nästa steg.",
      en: "This is where the choice becomes real. One final look before you continue into Calestra’s next step.",
      tr: "Seçimin gerçek olduğu yer burası. Calestra’nın bir sonraki adımına geçmeden önce son bir bakış.",
    }),
    restoreBusy: TT(i18n, t, "cart.restore.busy", {
      sv: "Återställer sparad kundvagn…",
      en: "Restoring saved cart…",
      tr: "Kaydedilen sepet geri yükleniyor…",
    }),
    digitalOnly: TT(i18n, t, "cart.digitalOnly", {
      sv: "Endast digitala produkter i kundvagnen – ingen frakt tillkommer.",
      en: "Only digital products in the cart – no shipping is added.",
      tr: "Sepette yalnızca dijital ürünler var – kargo eklenmez.",
    }),
  };

  return (
    <div
      className={`container cart-page cart-page--${flowMeta.flowType || "standard"}`}
      role="main"
      aria-labelledby="cart-title"
    >
      <div className="cart-hero">
        <div className="cart-hero-kicker">
          <span className="cart-live-dot" />
          <span>{L.cartKicker}</span>
        </div>

        <h1 id="cart-title" className="h1 cart-title">
          {L.title}
        </h1>

        <p className="cart-lead">{L.cartLead}</p>
      </div>

      {restoreBusy ? (
        <div className="restoreNotice" role="status" aria-live="polite">
          {L.restoreBusy}
        </div>
      ) : null}

      {restoreMsg ? (
        <div className="restoreNotice restoreOk" role="status" aria-live="polite">
          {restoreMsg}
        </div>
      ) : null}

      {restoreErr ? (
        <div className="restoreNotice restoreErr" role="alert" aria-live="polite">
          {restoreErr}
        </div>
      ) : null}

      {!isEmpty && paused && <PauseNotice reason={pauseReason} t={t} />}

      {!isEmpty && isNotifyOnlyFlow ? (
        <div className="preorderNotice notifyNotice" role="status" aria-live="polite">
          <div className="preorderNoticeBadge">{L.notifyBadge}</div>
          <div className="preorderNoticeBody">
            <div className="preorderNoticeTitle">{L.notifyTitle}</div>
            <div className="preorderNoticeText">{L.notifyBody}</div>
          </div>
        </div>
      ) : !isEmpty && flowMeta.hasPreorder ? (
        <div className="preorderNotice" role="status" aria-live="polite">
          <div className="preorderNoticeBadge">{L.preorderBadge}</div>
          <div className="preorderNoticeBody">
            <div className="preorderNoticeTitle">{L.preorderTitle}</div>
            <div className="preorderNoticeText">{L.preorderBody}</div>
          </div>
        </div>
      ) : null}

      {isEmpty ? (
        <section className="card empty" aria-live="polite">
          <div className="empty-emoji">🛒</div>
          <h2 className="card-title">{L.emptyTitle}</h2>
          <p className="muted">{L.emptyHint}</p>

          <div className="actions">
            <Link to="/shop" className="btn primary">
              {L.toShop}
            </Link>
            <Link to="/" className="btn">
              {L.backHome}
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid">
          <section className="card items-card">
            <ul className="list">
              {items.map((it, idx) => {
                const sku = cleanStr(
                  (
                    it.slug ||
                    it.handle ||
                    it.id ||
                    it.product?.slug ||
                    it.product?.handle ||
                    it.product?.id ||
                    ""
                  ).split(":")[0],
                  160
                );

                const lineKey = normalizeLineKey(it, idx);

                const unitSEK = Number((it.price ?? it.product?.price) || 0);
                const unit = convertFromSEK(unitSEK, currency, rates);
                const qty = Math.max(1, Number(it.qty || 1));
                const line = unit * qty;

                const img =
                  it.image ||
                  it.images?.find?.((x) => x?.type === "thumb")?.image ||
                  it.images?.find?.((x) => x?.type === "hero")?.image ||
                  it.images?.[0]?.image ||
                  it.images?.[0]?.src ||
                  it.product?.image ||
                  it.product?.images?.find?.((x) => x?.type === "thumb")?.image ||
                  it.product?.images?.find?.((x) => x?.type === "hero")?.image ||
                  it.product?.images?.[0]?.image ||
                  it.product?.images?.[0]?.src ||
                  "";

                const lineMode = detectLineMode(it);
                const preorder = lineMode === "preorder";
                const notifyOnly = lineMode === "notify";
                const specialCategory = detectSpecialCategory(it);
                const marketLab = specialCategory === "market-lab";
                const preorderText = preorder ? getPreorderText(it, i18n, t) : "";
                const notifyText = notifyOnly ? getNotifyText(it, i18n, t) : "";

                const productUrl = sku
                  ? `/product/${encodeURIComponent(sku)}${
                      notifyOnly ? "?intent=notify" : preorder ? "?intent=preorder" : ""
                    }`
                  : "/shop";

                return (
                  <li
                    key={`${lineKey}__${idx}`}
                    className={`row ${preorder ? "row--preorder" : ""} ${
                      notifyOnly ? "row--notify" : ""
                    } ${marketLab ? "row--market" : ""}`}
                  >
                    <Link to={productUrl} title={L.viewProduct} className="thumb-wrap">
                      <img className="thumb" src={img} alt="" aria-hidden="true" loading="lazy" />
                    </Link>

                    <div className="info">
                      <div className="title">
                        <Link to={productUrl} className="title-link">
                          {it.title || it.product?.title}
                        </Link>
                      </div>

                      <div className="muted tiny mono sku">{lineKey}</div>

                      {marketLab ? (
                        <div className="preorderInline marketInline">
                          <span className="preorderInlineBadge marketInlineBadge">
                            {L.marketLabBadge}
                          </span>
                          <span className="preorderInlineText">
                            {TT(i18n, t, "cart.marketLab.line", {
                              sv: "Framtida idé som valideras innan kapital binds.",
                              en: "Future idea validated before capital is tied up.",
                              tr: "Sermaye bağlanmadan önce doğrulanan gelecek fikri.",
                            })}
                          </span>
                        </div>
                      ) : null}

                      {preorder ? (
                        <div className="preorderInline">
                          <span className="preorderInlineBadge">{L.preorderBadge}</span>
                          <span className="preorderInlineText">{preorderText}</span>
                        </div>
                      ) : null}

                      {notifyOnly ? (
                        <div className="preorderInline notifyInline">
                          <span className="preorderInlineBadge notifyInlineBadge">
                            {L.notifyBadge}
                          </span>
                          <span className="preorderInlineText">{notifyText}</span>
                        </div>
                      ) : null}

                      <div className="qty">
                        <button className="pill" aria-label={L.dec} onClick={() => dec(lineKey)}>
                          −
                        </button>

                        <div className="qty-val" aria-live="polite">
                          {it.qty}
                        </div>

                        <button className="pill" aria-label={L.inc} onClick={() => inc(lineKey)}>
                          +
                        </button>

                        <button
                          className="link danger"
                          onClick={() => remove(lineKey)}
                          aria-label={L.remove}
                        >
                          {L.remove}
                        </button>
                      </div>
                    </div>

                    <div className="prices">
                      <div className="unit">
                        <Money value={unit} />
                      </div>
                      <div className="line">
                        <Money value={line} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="toolbar">
              <Link to="/shop" className="btn ghost">
                {L.continueShopping}
              </Link>

              <button
                className="btn danger ghost"
                onClick={() => {
                  clear();
                  setRestoreMsg("");
                  setRestoreErr("");
                  setSaveMsg("");
                  setSaveState("idle");
                }}
              >
                {L.clear}
              </button>
            </div>
          </section>

          <aside className="card summary" aria-labelledby="summary-title">
            <h2 id="summary-title" className="card-title">
              {L.summary}
            </h2>

            <div className="summary-row">
              <span>{L.subtotal}</span>
              <span>
                <Money value={displayTotals.subtotal} />
              </span>
            </div>

            {anyPhysical && (
              <div className="summary-row">
                <span>{L.ship}</span>
                <span>
                  {displayTotals.shipping === 0 ? L.free : <Money value={displayTotals.shipping} />}
                </span>
              </div>
            )}

            <div className="divider" />

            <div className="summary-row total">
              <span>{L.total}</span>
              <span>
                <Money value={displayTotals.total} />
              </span>
            </div>

            {isNotifyOnlyFlow ? (
              <div className="preorderSummaryBox notifySummaryBox">
                <div className="preorderSummaryTitle">{L.notifyBadge}</div>
                <div className="preorderSummaryText">{L.notifyBody}</div>
              </div>
            ) : flowMeta.hasPreorder ? (
              <div className="preorderSummaryBox">
                <div className="preorderSummaryTitle">{L.preorderBadge}</div>
                <div className="preorderSummaryText">{L.preorderBody}</div>
              </div>
            ) : null}

            {!anyPhysical ? (
              <div className="digitalNote">{L.digitalOnly}</div>
            ) : (
              <div className="free-ship">
                {!progress.isFree ? (
                  <>
                    <div className="progress">
                      <div
                        className="bar"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              (1 - Number(progress.remainingSEK || 0) / Number(progress.thresholdSEK || 1)) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="progress-text">
                      {L.toFree(formatMoney(progress.remainingActive, currency, locale))}
                    </div>
                  </>
                ) : (
                  <div className="progress-success">{L.gotFree}</div>
                )}
              </div>
            )}

            <div className="dreampoints-box" aria-label={L.dreamTitle}>
              <div className="dreampoints-head">
                <div className="dreampoints-title">{L.dreamTitle}</div>
                <div className="dreampoints-level-badge">{String(level || "starlight")}</div>
              </div>

              <div className="dreampoints-lead">{L.dreamLead}</div>

              <div className="dreampoints-grid">
                <div className="dreampoints-stat">
                  <div className="dreampoints-label">{L.dreamBalance}</div>
                  <div className="dreampoints-value">{Number(points || 0)}</div>
                </div>

                <div className="dreampoints-stat">
                  <div className="dreampoints-label">{L.dreamLevel}</div>
                  <div className="dreampoints-value small">{String(level || "starlight")}</div>
                </div>

                <div className="dreampoints-stat">
                  <div className="dreampoints-label">{L.dreamEarnNow}</div>
                  <div className="dreampoints-value">
                    {Number(dreamPointsPreview?.earnOnThisOrder || 0)} p
                  </div>
                </div>

                <div className="dreampoints-stat">
                  <div className="dreampoints-label">{L.dreamMaxFuture}</div>
                  <div className="dreampoints-value small">
                    {formatMoney(
                      convertFromSEK(
                        Number(dreamPointsPreview?.maxRedeemSek || 0),
                        currency,
                        rates
                      ),
                      currency,
                      locale
                    )}
                  </div>
                </div>
              </div>

              <div className="dreampoints-hint">{L.dreamHint}</div>
            </div>

            <div className="save-cart-box">
              <div className="save-cart-title">{L.saveTitle}</div>
              <div className="save-cart-lead">{L.saveLead}</div>

              <form className="save-cart-form" onSubmit={handleSaveCart}>
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={saveEmail}
                  onChange={(e) => {
                    setSaveEmail(e.target.value);
                    if (saveState !== "loading") {
                      setSaveState("idle");
                      setSaveMsg("");
                    }
                  }}
                  placeholder={L.savePlaceholder}
                  aria-label={L.saveTitle}
                  disabled={saveState === "loading"}
                />
                <button
                  type="submit"
                  disabled={saveState === "loading" || !saveEmail.trim()}
                >
                  {saveState === "loading" ? L.saveBusy : L.saveButton}
                </button>
              </form>

              {saveState === "ok" ? <div className="save-cart-ok">{saveMsg}</div> : null}
              {saveState === "error" ? <div className="save-cart-err">{saveMsg}</div> : null}
            </div>

            <div className="celeste-note" aria-live="polite">
              <span className="celeste-dot" />
              <span>{L.celeste}</span>
            </div>

            <button
              className={`cta ${paused || isNotifyOnlyFlow ? "disabled" : ""}`}
              onClick={handleCheckout}
              disabled={paused || isNotifyOnlyFlow}
            >
              {paused ? L.paused : L.checkout}
              {!paused && !isNotifyOnlyFlow && <span className="cta-glow" aria-hidden />}
            </button>

            <div className="trust">
              <div className="trust-item">🧾 {L.trust1}</div>
              <div className="trust-item">↩️ {L.returns}</div>
            </div>
          </aside>
        </div>
      )}

      {!isEmpty && (
        <div className="sticky" role="region" aria-label={L.summary}>
          <div className="sticky-total">
            {L.total}: <Money value={displayTotals.total} />
          </div>
          <button
            className={`cta ${paused || isNotifyOnlyFlow ? "disabled" : ""}`}
            onClick={handleCheckout}
            disabled={paused || isNotifyOnlyFlow}
          >
            {paused ? L.paused : L.checkout}
          </button>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.cart-page {
  padding-top: 20px;
  padding-bottom: 76px;
}

.cart-hero{
  margin-bottom: 16px;
}

.cart-hero-kicker{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:6px 10px;
  border-radius:999px;
  background: rgba(15,23,42,.05);
  border:1px solid rgba(15,23,42,.08);
  color:#475569;
  font-size:11px;
  font-weight:1000;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.cart-live-dot{
  width:8px;
  height:8px;
  border-radius:999px;
  background:#f97316;
  box-shadow:0 0 0 0 rgba(249,115,22,.45);
  animation: cartPulse 1.8s infinite;
}

@keyframes cartPulse{
  0%{ box-shadow:0 0 0 0 rgba(249,115,22,.45); }
  70%{ box-shadow:0 0 0 8px rgba(249,115,22,0); }
  100%{ box-shadow:0 0 0 0 rgba(249,115,22,0); }
}

.cart-title {
  margin: 12px 0 8px;
}

.cart-lead{
  margin:0;
  color:#475569;
  font-size:14px;
  line-height:1.6;
  font-weight:700;
  max-width:70ch;
}

.card {
  background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.99));
  border-radius: 22px;
  padding: 16px 18px 18px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.10);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.theme-dark .card{
  background: linear-gradient(180deg, rgba(2,6,23,.96), rgba(15,23,42,.96));
  border-color: rgba(148,163,184,.14);
}

.card.empty {
  text-align: center;
  max-width: 520px;
  margin: 24px auto 0;
}

.card-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 900;
}

.empty-emoji {
  font-size: 40px;
  margin-bottom: 8px;
}

.card.empty .muted {
  color: #6b7280;
  margin-bottom: 16px;
}

.card.empty .actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1.1fr);
  gap: 24px;
  align-items: flex-start;
  margin-top: 12px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 14px;
}

.row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
}

.row:last-child {
  border-bottom: none;
}

.row--preorder{
  border-radius: 18px;
  padding: 12px;
  border: 1px solid rgba(245,158,11,.18);
  background: linear-gradient(135deg, rgba(245,158,11,.055), rgba(255,255,255,.68));
}

.row--notify{
  border-radius: 18px;
  padding: 12px;
  border: 1px solid rgba(59,130,246,.18);
  background: linear-gradient(135deg, rgba(59,130,246,.055), rgba(255,255,255,.68));
}

.row--market{
  border-radius: 18px;
  padding: 12px;
  border: 1px solid rgba(99,102,241,.18);
  background: linear-gradient(135deg, rgba(99,102,241,.055), rgba(255,255,255,.68));
}

.theme-dark .row--preorder{
  background: linear-gradient(135deg, rgba(245,158,11,.10), rgba(255,255,255,.025));
  border-color: rgba(245,158,11,.18);
}

.theme-dark .row--notify{
  background: linear-gradient(135deg, rgba(59,130,246,.10), rgba(255,255,255,.025));
  border-color: rgba(59,130,246,.18);
}

.theme-dark .row--market{
  background: linear-gradient(135deg, rgba(99,102,241,.10), rgba(255,255,255,.025));
  border-color: rgba(129,140,248,.18);
}

.thumb-wrap {
  display: inline-flex;
}

.thumb {
  width: 90px;
  height: 90px;
  border-radius: 16px;
  object-fit: cover;
  border: 1px solid rgba(148,163,184,0.25);
  background: #f1f5f9;
}

.info {
  min-width: 0;
}

.title-link {
  font-weight: 900;
  color: #0f172a;
  text-decoration: none;
}

.theme-dark .title-link{
  color:#f8fafc;
}

.title-link:hover {
  text-decoration: underline;
}

.sku {
  margin-top: 2px;
  word-break: break-word;
}

.muted {
  color: #6b7280;
}

.theme-dark .muted{
  color:#94a3b8;
}

.tiny {
  font-size: 11px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.qty {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.pill {
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,0.9);
  background: #fff;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: 900;
}

.theme-dark .pill{
  background:#020617;
  color:#f8fafc;
  border-color: rgba(148,163,184,.28);
}

.pill:hover {
  background: #f9fafb;
}

.qty-val {
  min-width: 24px;
  text-align: center;
  font-weight: 800;
}

.link.danger {
  border: 0;
  background: none;
  color: #b91c1c;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 900;
}

.prices {
  text-align: right;
  font-size: 14px;
}

.prices .unit {
  color: #6b7280;
}

.theme-dark .prices .unit{
  color:#94a3b8;
}

.prices .line {
  font-weight: 900;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.btn {
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,0.7);
  padding: 8px 14px;
  background: #f9fafb;
  font-size: 13px;
  cursor: pointer;
  text-decoration:none;
  font-weight:900;
  color:#111827;
}

.theme-dark .btn{
  background: rgba(255,255,255,.04);
  color:#f8fafc;
  border-color: rgba(148,163,184,.22);
}

.btn.ghost {
  background: transparent;
}

.btn.primary {
  border-color: #111827;
  background: #111827;
  color: #f9fafb;
}

.theme-dark .btn.primary{
  background:#f8fafc;
  color:#020617;
  border-color:#f8fafc;
}

.btn.danger {
  border-color: #b91c1c;
  color: #b91c1c;
}

.summary {
  position: sticky;
  top: 80px;
  align-self: flex-start;
  background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
  overflow:hidden;
}

.summary::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background: radial-gradient(circle at 80% 20%, rgba(250,204,21,.12), transparent 40%);
  opacity:.6;
}

.theme-dark .summary{
  background: linear-gradient(180deg, rgba(2,6,23,.96), rgba(15,23,42,.96));
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  padding: 4px 0;
  position:relative;
  z-index:1;
}

.summary-row.total {
  font-weight: 900;
  font-size: 15px;
}

.divider {
  border-top: 1px dashed rgba(148,163,184,0.7);
  margin: 6px 0 4px;
  position:relative;
  z-index:1;
}

.free-ship {
  margin-top: 12px;
  font-size: 12px;
  position:relative;
  z-index:1;
}

.progress {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.theme-dark .progress{
  background: rgba(255,255,255,.10);
}

.progress .bar {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg,#22c55e,#4ade80);
  transition: width 0.35s ease-out;
}

.progress-text {
  margin-top: 6px;
  color: #4b5563;
  font-weight:800;
}

.theme-dark .progress-text{
  color:#cbd5e1;
}

.progress-success {
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(34,197,94,0.08);
  color: #15803d;
  font-weight:900;
}

.trust {
  margin-top: 14px;
  border-top: 1px solid rgba(148,163,184,0.35);
  padding-top: 8px;
  display: grid;
  gap: 4px;
  font-size: 12px;
  color: #4b5563;
  position:relative;
  z-index:1;
}

.theme-dark .trust{
  color:#cbd5e1;
  border-top-color: rgba(148,163,184,.18);
}

.cta {
  margin-top: 14px;
  width: 100%;
  border-radius: 999px;
  border: 0;
  padding: 12px 16px;
  font-weight: 1000;
  font-size: 14px;
  cursor: pointer;
  background: linear-gradient(90deg, #0f172a, #1e293b);
  color: #fff;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease;
  position:relative;
  overflow:hidden;
  z-index:1;
}

.theme-dark .cta {
  background: linear-gradient(90deg, #f8fafc, #e2e8f0);
  color: #020617;
}

.cart-page--preorder .cta,
.cart-page--mixed .cta{
  background: linear-gradient(90deg, #b45309, #f59e0b);
}

.theme-dark .cart-page--preorder .cta,
.theme-dark .cart-page--mixed .cta{
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  color:#241400;
}

.cta:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
}

.cta:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.14);
}

.cta.disabled,
.cta[disabled],
.cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform:none;
  box-shadow:none;
}

.cta-glow{
  position:absolute;
  inset:0;
  border-radius:999px;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.25), transparent 60%);
  opacity:0;
  transition: opacity .3s ease;
}

.cta:hover .cta-glow{ opacity:.35; }

.sticky {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(148, 163, 184, 0.35);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  z-index: 50;
}

.theme-dark .sticky {
  background: rgba(2, 6, 23, 0.96);
  border-top-color: rgba(148, 163, 184, 0.18);
}

.sticky-total {
  font-weight: 1000;
  font-size: 14px;
  color: #0f172a;
}

.theme-dark .sticky-total {
  color: #f8fafc;
}

.sticky .cta{
  margin-top:0;
  width:auto;
  min-width:160px;
}

.pauseNotice{
  display:flex;
  align-items:center;
  gap:10px;
  border:1px solid rgba(244,63,94,.35);
  background: rgba(244,63,94,.08);
  padding: 10px 12px;
  border-radius: 14px;
  margin: 0 0 14px;
}

.pauseBadge{
  font-weight:1000;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(244,63,94,.12);
  border:1px solid rgba(244,63,94,.35);
}

.pauseText{
  font-weight:900;
  color:#0f172a;
  opacity:.92;
}

.pauseReason{
  opacity:.7;
  font-weight:900;
}

.theme-dark .pauseText{
  color:#e6e7ea;
}

.restoreNotice{
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 900;
  border: 1px solid rgba(59,130,246,.24);
  background: rgba(59,130,246,.08);
  color:#1e3a8a;
}

.restoreOk{
  border-color: rgba(34,197,94,.25);
  background: rgba(34,197,94,.08);
  color:#166534;
}

.restoreErr{
  border-color: rgba(239,68,68,.24);
  background: rgba(239,68,68,.08);
  color:#991b1b;
}

.theme-dark .restoreNotice{ color:#dbeafe; }
.theme-dark .restoreOk{ color:#bbf7d0; }
.theme-dark .restoreErr{ color:#fecaca; }

.preorderNotice{
  display:flex;
  align-items:flex-start;
  gap:12px;
  margin: 0 0 14px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(245,158,11,.30);
  background: linear-gradient(135deg, rgba(245,158,11,.10), rgba(250,204,21,.08));
}

.notifyNotice{
  border-color: rgba(59,130,246,.28);
  background: linear-gradient(135deg, rgba(59,130,246,.10), rgba(125,211,252,.08));
}

.preorderNoticeBadge{
  flex:0 0 auto;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:28px;
  padding:0 10px;
  border-radius:999px;
  background: rgba(255,255,255,.72);
  border:1px solid rgba(146,64,14,.14);
  color:#9a3412;
  font-size:11px;
  font-weight:1000;
  text-transform:uppercase;
  letter-spacing:.06em;
}

.notifyNotice .preorderNoticeBadge{
  border-color: rgba(30,64,175,.14);
  color:#1d4ed8;
}

.preorderNoticeTitle{
  font-size:13px;
  font-weight:1000;
  color:#0f172a;
  margin-bottom:4px;
}

.preorderNoticeText{
  color:#475569;
  font-size:13px;
  font-weight:800;
  line-height:1.5;
}

.theme-dark .preorderNotice{
  border-color: rgba(250,204,21,.22);
  background: linear-gradient(135deg, rgba(250,204,21,.10), rgba(255,255,255,.03));
}

.theme-dark .notifyNotice{
  border-color: rgba(125,211,252,.20);
  background: linear-gradient(135deg, rgba(59,130,246,.12), rgba(255,255,255,.03));
}

.theme-dark .preorderNoticeBadge{
  background: rgba(255,255,255,.08);
  border-color: rgba(250,204,21,.18);
  color:#fde68a;
}

.theme-dark .notifyNotice .preorderNoticeBadge{
  border-color: rgba(125,211,252,.18);
  color:#bfdbfe;
}

.theme-dark .preorderNoticeTitle{ color:#f8fafc; }
.theme-dark .preorderNoticeText{ color:#cbd5e1; }

.preorderInline{
  margin-top:7px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
}

.preorderInlineBadge{
  display:inline-flex;
  align-items:center;
  padding:4px 8px;
  border-radius:999px;
  background: rgba(254,243,199,.92);
  color:#92400e;
  font-size:11px;
  font-weight:1000;
  letter-spacing:.03em;
  text-transform:uppercase;
}

.notifyInline .preorderInlineBadge,
.notifyInlineBadge{
  background: rgba(219,234,254,.92);
  color:#1d4ed8;
}

.marketInline .preorderInlineBadge,
.marketInlineBadge{
  background: rgba(224,231,255,.92);
  color:#4338ca;
}

.preorderInlineText{
  font-size:12px;
  line-height:1.45;
  color:#475569;
  font-weight:800;
}

.theme-dark .preorderInlineBadge{
  background: rgba(250,204,21,.12);
  color:#fde68a;
}

.theme-dark .notifyInline .preorderInlineBadge,
.theme-dark .notifyInlineBadge{
  background: rgba(59,130,246,.14);
  color:#bfdbfe;
}

.theme-dark .marketInline .preorderInlineBadge,
.theme-dark .marketInlineBadge{
  background: rgba(99,102,241,.16);
  color:#c7d2fe;
}

.theme-dark .preorderInlineText{
  color:#cbd5e1;
}

.preorderSummaryBox{
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(245,158,11,.08);
  border: 1px solid rgba(245,158,11,.22);
  position:relative;
  z-index:1;
}

.notifySummaryBox{
  background: rgba(59,130,246,.08);
  border-color: rgba(59,130,246,.22);
}

.preorderSummaryTitle{
  font-size:12px;
  font-weight:1000;
  text-transform:uppercase;
  letter-spacing:.06em;
  color:#9a3412;
  margin-bottom:4px;
}

.notifySummaryBox .preorderSummaryTitle{
  color:#1d4ed8;
}

.preorderSummaryText{
  font-size:12px;
  line-height:1.5;
  color:#475569;
  font-weight:800;
}

.theme-dark .preorderSummaryBox{
  background: rgba(250,204,21,.08);
  border-color: rgba(250,204,21,.18);
}

.theme-dark .notifySummaryBox{
  background: rgba(59,130,246,.10);
  border-color: rgba(96,165,250,.18);
}

.theme-dark .preorderSummaryTitle{ color:#fde68a; }
.theme-dark .notifySummaryBox .preorderSummaryTitle{ color:#bfdbfe; }
.theme-dark .preorderSummaryText{ color:#cbd5e1; }

.celeste-note{
  margin-top: 10px;
  display:flex;
  align-items:center;
  gap:8px;
  font-size:12px;
  font-weight:800;
  color:#475569;
  opacity:.9;
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

.digitalNote{
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15,23,42,.04);
  border: 1px solid rgba(15,23,42,.08);
  color:#475569;
  font-size:12px;
  font-weight:800;
  line-height:1.45;
  position:relative;
  z-index:1;
}

.theme-dark .digitalNote{
  background: rgba(255,255,255,.05);
  border-color: rgba(148,163,184,.14);
  color:#cbd5e1;
}

.dreampoints-box{
  margin-top: 14px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(250,204,21,.28);
  background: linear-gradient(180deg, rgba(250,204,21,.10), rgba(250,204,21,.04));
  position: relative;
  z-index: 1;
}

.theme-dark .dreampoints-box{
  background: linear-gradient(180deg, rgba(250,204,21,.10), rgba(255,255,255,.03));
  border-color: rgba(250,204,21,.20);
}

.dreampoints-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}

.dreampoints-title{
  font-size: 13px;
  font-weight: 1000;
  color:#0f172a;
}

.theme-dark .dreampoints-title{
  color:#f8fafc;
}

.dreampoints-level-badge{
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 1000;
  letter-spacing: .03em;
  text-transform: capitalize;
  background: rgba(255,255,255,.7);
  border: 1px solid rgba(15,23,42,.08);
  color:#0f172a;
}

.theme-dark .dreampoints-level-badge{
  background: rgba(255,255,255,.06);
  border-color: rgba(148,163,184,.18);
  color:#f8fafc;
}

.dreampoints-lead{
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
  color:#475569;
  font-weight: 800;
}

.theme-dark .dreampoints-lead{
  color:#cbd5e1;
}

.dreampoints-grid{
  margin-top: 10px;
  display:grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap:8px;
}

.dreampoints-stat{
  border-radius: 14px;
  padding: 10px;
  background: rgba(255,255,255,.72);
  border: 1px solid rgba(15,23,42,.06);
}

.theme-dark .dreampoints-stat{
  background: rgba(255,255,255,.04);
  border-color: rgba(148,163,184,.14);
}

.dreampoints-label{
  font-size: 11px;
  color:#64748b;
  font-weight: 900;
}

.theme-dark .dreampoints-label{
  color:#cbd5e1;
}

.dreampoints-value{
  margin-top: 4px;
  font-size: 20px;
  line-height: 1.1;
  font-weight: 1000;
  color:#0f172a;
}

.theme-dark .dreampoints-value{
  color:#f8fafc;
}

.dreampoints-value.small{
  font-size: 15px;
  text-transform: capitalize;
}

.dreampoints-hint{
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.45;
  color:#475569;
  font-weight: 800;
}

.theme-dark .dreampoints-hint{
  color:#cbd5e1;
}

.save-cart-box{
  margin-top: 14px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(15,23,42,.08);
  background: rgba(15,23,42,.035);
  position: relative;
  z-index: 1;
}

.theme-dark .save-cart-box{
  background: rgba(255,255,255,.04);
  border-color: rgba(148,163,184,.16);
}

.save-cart-title{
  font-size: 13px;
  font-weight: 1000;
  color:#0f172a;
}

.theme-dark .save-cart-title{
  color:#f8fafc;
}

.save-cart-lead{
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
  color:#475569;
  font-weight: 800;
}

.theme-dark .save-cart-lead{
  color:#cbd5e1;
}

.save-cart-form{
  display:flex;
  gap:8px;
  margin-top:10px;
}

.save-cart-form input{
  flex:1;
  min-width:0;
  height:38px;
  border-radius:12px;
  border:1px solid rgba(148,163,184,.6);
  padding:0 12px;
  font-weight:800;
  background:#fff;
  color:#0f172a;
}

.theme-dark .save-cart-form input{
  background:#020617;
  color:#f8fafc;
  border-color: rgba(148,163,184,.22);
}

.save-cart-form button{
  height:38px;
  border-radius:12px;
  border:0;
  padding:0 12px;
  font-weight:1000;
  background:#0f172a;
  color:#fff;
  cursor:pointer;
  white-space:nowrap;
}

.save-cart-form button:disabled{
  opacity:.6;
  cursor:not-allowed;
}

.theme-dark .save-cart-form button{
  background:#f8fafc;
  color:#020617;
}

.save-cart-ok{
  margin-top:8px;
  font-size:12px;
  font-weight:900;
  color:#15803d;
}

.save-cart-err{
  margin-top:8px;
  font-size:12px;
  font-weight:900;
  color:#b91c1c;
  white-space:pre-wrap;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .summary {
    position: static;
    top: auto;
  }
}

@media (max-width: 640px) {
  .cart-page{
    padding-bottom: 92px;
  }

  .row {
    grid-template-columns: 70px 1fr;
    grid-template-rows: auto auto;
    gap: 8px;
  }

  .prices {
    grid-column: span 2;
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    text-align:left;
  }

  .thumb {
    width: 70px;
    height: 70px;
  }

  .cart-lead {
    font-size: 13px;
  }

  .card {
    padding: 14px;
  }

  .dreampoints-grid{
    grid-template-columns: 1fr;
  }

  .save-cart-form{
    flex-direction:column;
  }

  .save-cart-form button{
    width:100%;
  }

  .preorderNotice{
    flex-direction:column;
  }

  .sticky{
    align-items:stretch;
    flex-direction:column;
  }

  .sticky .cta{
    width:100%;
    min-width:0;
  }
}

@media (prefers-reduced-motion: reduce){
  .cart-live-dot,
  .progress .bar,
  .cta{
    animation:none;
    transition:none;
  }
}
`;