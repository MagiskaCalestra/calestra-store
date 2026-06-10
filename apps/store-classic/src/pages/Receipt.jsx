// D:\WebProjects\Calestra\apps\store-classic\src\pages\Receipt.jsx
// apps/store-classic/src/pages/Receipt.jsx

import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCurrency } from "../context/CurrencyContext.jsx";
import { useDreamPoints } from "../context/DreamPointsContext.jsx";
import { formatMoney, convertFromSEK, hasPhysicalItems } from "../utils/money.js";
import { TT } from "../i18n/tt.js";

const DREAM_AWARDED_KEY = "cw.dreampoints.awarded.orders";
const ORDER_LIST_KEY = "cw.orders";
const ORDER_LAST_KEY = "cw.order.last";
const ORDER_CURRENT_KEY = "cw.order.current";

function safeJsonParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function readStorage(key, mode = "local") {
  if (typeof window === "undefined") return null;

  try {
    const api = mode === "session" ? window.sessionStorage : window.localStorage;
    return api.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value, mode = "local") {
  if (typeof window === "undefined") return;

  try {
    const api = mode === "session" ? window.sessionStorage : window.localStorage;
    api.setItem(key, value);
  } catch {
    // noop
  }
}

function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeOrderId(order) {
  return normalizeText(order?.id || order?.orderId || order?.order_id || "");
}

function readOrderList() {
  const parsed = safeJsonParse(readStorage(ORDER_LIST_KEY, "local"), []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeOrderList(list) {
  writeStorage(ORDER_LIST_KEY, JSON.stringify(Array.isArray(list) ? list : []), "local");
}

function upsertLocalOrder(order) {
  if (typeof window === "undefined" || !order) return;

  const orderId = normalizeOrderId(order);
  if (!orderId) return;

  const list = readOrderList();
  const idx = list.findIndex((o) => normalizeOrderId(o) === orderId);

  if (idx === -1) {
    list.unshift(order);
  } else {
    list[idx] = {
      ...list[idx],
      ...order,
      items: Array.isArray(order.items) ? order.items : list[idx]?.items || [],
    };
  }

  writeOrderList(list);
  writeStorage(ORDER_LAST_KEY, JSON.stringify(order), "local");
  writeStorage(ORDER_CURRENT_KEY, JSON.stringify(order), "session");
}

function loadLocalOrder(id) {
  if (typeof window === "undefined") return null;

  const wanted = normalizeText(id);
  if (!wanted) return null;

  const sources = [
    safeJsonParse(readStorage(ORDER_CURRENT_KEY, "session"), null),
    safeJsonParse(readStorage(ORDER_LAST_KEY, "local"), null),
  ];

  for (const src of sources) {
    if (src && normalizeOrderId(src) === wanted) return src;
  }

  return readOrderList().find((o) => normalizeOrderId(o) === wanted) || null;
}

function truthyFlag(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;

  const s = String(value).trim().toLowerCase();

  return [
    "1",
    "true",
    "yes",
    "y",
    "preorder",
    "pre-order",
    "pre_order",
    "reserve",
    "reservation",
    "coming_soon",
    "coming-soon",
    "launch_only",
    "launch-only",
  ].includes(s);
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

function hasPreorderKeyword(value) {
  const s = normalizeSearchText(value);
  if (!s) return false;

  return (
    s.includes("preorder") ||
    s.includes("pre order") ||
    s.includes("pre-order") ||
    s.includes("forbestall") ||
    s.includes("förbeställ") ||
    s.includes("forhandsbok") ||
    s.includes("förhandsbok") ||
    s.includes("forhandsreservation") ||
    s.includes("förhandsreservation") ||
    s.includes("reservation") ||
    s.includes("reserve") ||
    s.includes("coming soon") ||
    s.includes("launch only") ||
    s.includes("first wave") ||
    s.includes("first drop")
  );
}

function isPreorderLine(item) {
  if (!item || typeof item !== "object") return false;

  const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
  const product = item.product && typeof item.product === "object" ? item.product : {};

  const flags = [
    item.isPreorder,
    item.preorder,
    item.preOrder,
    item.preorderOnly,
    item.preorderActive,
    item.comingSoon,
    item.launchOnly,
    meta.isPreorder,
    meta.preorder,
    meta.preOrder,
    meta.preorderOnly,
    meta.preorderActive,
    meta.comingSoon,
    meta.launchOnly,
    product.isPreorder,
    product.preorder,
    product.preOrder,
    product.preorderOnly,
    product.preorderActive,
    product.comingSoon,
    product.launchOnly,
  ];

  if (flags.some(truthyFlag)) return true;

  const fulfillment = normalizeSearchText(
    item.fulfillmentType ||
      item.availabilityType ||
      item.orderType ||
      item.lineMode ||
      meta.fulfillmentType ||
      meta.availabilityType ||
      product.fulfillmentType ||
      product.availabilityType ||
      ""
  );

  if (["preorder", "pre order", "pre-order"].includes(fulfillment)) return true;

  return [
    item.badge,
    item.status,
    item.title,
    item.name,
    item.slug,
    product.title,
    product.name,
    product.status,
    product.badge,
    product.subtitle,
    product.description,
    meta.label,
    meta.statusLabel,
    meta.badge,
    meta.status,
  ].some(hasPreorderKeyword);
}

function normalizeLineKey(item, idx) {
  return cleanString(
    item?.lineKey ||
      item?.variantKey ||
      item?.id ||
      item?.productId ||
      item?.product?.id ||
      item?.slug ||
      item?.product?.slug ||
      `${idx}`,
    240
  );
}

function normalizeItems(order, i18n, t) {
  const src = Array.isArray(order?.items) ? order.items : [];

  return src.map((it, idx) => {
    const p = it?.product && typeof it.product === "object" ? it.product : {};
    const preorder = isPreorderLine(it);
    const qty = Math.max(1, Number(it?.qty ?? it?.quantity ?? 1) || 1);
    const priceSEK = Number(
      it?.priceSEK ?? it?.price_sek ?? it?.price ?? p?.priceSEK ?? p?.price ?? 0
    );

    return {
      lineKey: normalizeLineKey(it, idx),
      id: cleanString(it?.id || it?.productId || p?.id || it?.slug || p?.slug || `${idx}`, 160),
      name: cleanString(
        it?.name ||
          it?.title ||
          it?.productTitle ||
          p?.title ||
          p?.name ||
          TT(i18n, t, "receipt.fallbackProduct", {
            sv: "Produkt",
            en: "Product",
            tr: "Ürün",
          }),
        260
      ),
      qty,
      priceSEK: Number.isFinite(priceSEK) ? priceSEK : 0,
      image:
        it?.image ||
        it?.images?.[0]?.image ||
        it?.images?.[0]?.src ||
        p?.image ||
        p?.images?.[0]?.image ||
        p?.images?.[0]?.src ||
        "",
      variant: cleanString(
        it?.variantTitle ||
          it?.variant ||
          [it?.meta?.size || it?.size, it?.meta?.color || it?.color].filter(Boolean).join(", "),
        160
      ),
      lineMode: preorder ? "preorder" : cleanString(it?.lineMode || it?.orderType || "buy", 80),
      fulfillmentType: cleanString(it?.fulfillmentType || "", 120),
      fulfillmentStatus: cleanString(it?.fulfillmentStatus || "", 120),
      isPreorder: preorder,
      preorderText: cleanString(
        it?.preorderText ||
          it?.preorderNote ||
          it?.meta?.preorderText ||
          it?.meta?.preorderNote ||
          p?.preorderText ||
          p?.preorderNote ||
          "",
        280
      ),
    };
  });
}

function shippingRulesSEK(subSEK, country = "SE") {
  const c = String(country || "SE").toUpperCase();

  const table = {
    SE: { threshold: 500, fee: 49 },
    NO: { threshold: 700, fee: 89 },
    FI: { threshold: 700, fee: 89 },
    DK: { threshold: 600, fee: 69 },
    DE: { threshold: 700, fee: 89 },
    NL: { threshold: 700, fee: 89 },
    GB: { threshold: 800, fee: 99 },
    US: { threshold: 120, fee: 132 },
    TR: { threshold: 2000, fee: 149 },
    FR: { threshold: 700, fee: 89 },
    ES: { threshold: 700, fee: 89 },
  };

  const rule = table[c] || table.SE;
  const isFree = Number(subSEK || 0) >= rule.threshold;

  return {
    isFree,
    feeSEK: isFree ? 0 : rule.fee,
    thresholdSEK: rule.threshold,
  };
}

function extractDiscount(order) {
  const discountMeta =
    order?.discountMeta ||
    order?.discount_meta ||
    order?.core?.discountMeta ||
    order?.coreMeta?.discountMeta ||
    {};

  const totals = order?.totalsSEK || {};
  const type = cleanString(
    discountMeta.discountType ||
      discountMeta.manualDiscountType ||
      discountMeta.type ||
      totals.discountType ||
      "",
    80
  ).toLowerCase();

  const percent = Number(discountMeta.discountPercent || discountMeta.manualDiscountPercent || 0);

  const code = cleanString(
    discountMeta.discountCode ||
      discountMeta.manualCode ||
      discountMeta.code ||
      order?.discountCode ||
      "",
    120
  );

  const freeShipping = !!(
    discountMeta.freeShipping ||
    discountMeta.manualFreeShipping ||
    discountMeta.hasFreeShipping ||
    discountMeta.shippingFree ||
    discountMeta.freeShippingApplied ||
    totals.freeShipping ||
    totals.shippingFree ||
    totals.freeShippingApplied ||
    type === "shipping" ||
    type === "free_shipping" ||
    type === "free-shipping"
  );

  const explicitItemAmountSEK = Number(
    discountMeta.itemDiscountSek ??
      discountMeta.itemDiscountSEK ??
      discountMeta.productDiscountSek ??
      discountMeta.productDiscountSEK ??
      discountMeta.manualItemDiscountSek ??
      discountMeta.campaignItemDiscountSek ??
      0
  );

  const genericAmountSEK = Number(
    discountMeta.manualDiscountAmountSek ??
      discountMeta.discountAmountSek ??
      discountMeta.discountAmountSEK ??
      discountMeta.discountSek ??
      discountMeta.discountSEK ??
      totals.discountSek ??
      totals.discountSEK ??
      totals.discountAmountSEK ??
      totals.discountAmountSek ??
      0
  );

  const totalDiscountSEK = Number(
    discountMeta.totalDiscountSek ??
      discountMeta.totalDiscountSEK ??
      totals.totalDiscountSek ??
      totals.totalDiscountSEK ??
      0
  );

  const shippingDiscountSEK = Number(
    discountMeta.shippingDiscountSek ??
      discountMeta.shippingDiscountSEK ??
      discountMeta.freeShippingDiscountSek ??
      totals.shippingDiscountSek ??
      totals.shippingDiscountSEK ??
      0
  );

  return {
    rawAmountSEK: Number.isFinite(genericAmountSEK) ? Math.max(0, genericAmountSEK) : 0,
    explicitItemAmountSEK: Number.isFinite(explicitItemAmountSEK)
      ? Math.max(0, explicitItemAmountSEK)
      : 0,
    totalDiscountSEK: Number.isFinite(totalDiscountSEK) ? Math.max(0, totalDiscountSEK) : 0,
    shippingDiscountSEK: Number.isFinite(shippingDiscountSEK)
      ? Math.max(0, shippingDiscountSEK)
      : 0,
    percent: Number.isFinite(percent) ? Math.max(0, percent) : 0,
    code,
    type,
    freeShipping,
    hasDiscount:
      (Number.isFinite(genericAmountSEK) && genericAmountSEK > 0) ||
      (Number.isFinite(explicitItemAmountSEK) && explicitItemAmountSEK > 0) ||
      (Number.isFinite(totalDiscountSEK) && totalDiscountSEK > 0) ||
      (Number.isFinite(shippingDiscountSEK) && shippingDiscountSEK > 0) ||
      (Number.isFinite(percent) && percent > 0) ||
      freeShipping ||
      !!code,
  };
}

function totalsSEKFromOrder(order, items) {
  const discount = extractDiscount(order);
  const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
  const extractVat = (gross) => round2(gross - gross / 1.25);

  const itemSub = items.reduce((sum, item) => {
    return sum + Number(item.priceSEK || 0) * Number(item.qty || 1);
  }, 0);

  const anyPhysical =
    typeof order?.anyPhysical === "boolean" ? order.anyPhysical : hasPhysicalItems(order?.items || []);

  const country = order?.shipping?.country || order?.billing?.country || "SE";
  const shippingRule = shippingRulesSEK(itemSub, country);

  const sourceTotals = order?.totalsSEK && typeof order.totalsSEK === "object" ? order.totalsSEK : {};

  const sourceSub = Number(
    sourceTotals.sub ??
      sourceTotals.subtotal ??
      sourceTotals.items ??
      sourceTotals.itemsTotal ??
      itemSub
  );

  const sub = Number.isFinite(sourceSub) && sourceSub > 0 ? sourceSub : itemSub;

  const originalShipFromSource = Number(
    sourceTotals.shippingBeforeDiscountSEK ??
      sourceTotals.shippingBeforeDiscountSek ??
      sourceTotals.shipBeforeDiscount ??
      sourceTotals.originalShippingSEK ??
      sourceTotals.originalShippingSek ??
      NaN
  );

  const sourceShip = Number(
    sourceTotals.ship ??
      sourceTotals.shipping ??
      sourceTotals.shippingSek ??
      sourceTotals.shippingSEK ??
      sourceTotals.freight ??
      shippingRule.feeSEK
  );

  const originalShip = anyPhysical
    ? Number.isFinite(originalShipFromSource)
      ? Math.max(0, originalShipFromSource)
      : Number.isFinite(sourceShip)
        ? discount.freeShipping && sourceShip === 0
          ? shippingRule.feeSEK
          : Math.max(0, sourceShip)
        : shippingRule.feeSEK
    : 0;

  const shippingDiscountSEK = anyPhysical
    ? discount.freeShipping
      ? originalShip
      : Math.min(originalShip, discount.shippingDiscountSEK)
    : 0;

  const ship = round2(Math.max(0, originalShip - shippingDiscountSEK));

  let itemDiscountSEK = 0;

  if (discount.explicitItemAmountSEK > 0) {
    itemDiscountSEK = discount.explicitItemAmountSEK;
  } else if (discount.totalDiscountSEK > 0) {
    itemDiscountSEK = Math.max(0, discount.totalDiscountSEK - shippingDiscountSEK);
  } else if (discount.rawAmountSEK > 0) {
    itemDiscountSEK = discount.freeShipping
      ? Math.max(0, discount.rawAmountSEK - shippingDiscountSEK)
      : discount.rawAmountSEK;
  }

  if (discount.percent > 0 && itemDiscountSEK <= 0 && !discount.freeShipping) {
    itemDiscountSEK = sub * (discount.percent / 100);
  }

  itemDiscountSEK = round2(Math.min(sub, Math.max(0, itemDiscountSEK)));

  const sourceTax = Number(sourceTotals.tax ?? sourceTotals.vat ?? NaN);

  const tax =
    Number.isFinite(sourceTax) && !discount.hasDiscount
      ? round2(sourceTax)
      : round2(extractVat(Math.max(0, sub - itemDiscountSEK)) + extractVat(ship));

  const grand = round2(Math.max(0, sub + ship - itemDiscountSEK));

  return {
    sub: round2(sub),
    ship: round2(ship),
    tax,
    discount: itemDiscountSEK,
    shippingDiscount: round2(shippingDiscountSEK),
    grand,
  };
}

function readAwardedMap() {
  const parsed = safeJsonParse(readStorage(DREAM_AWARDED_KEY, "local"), {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function readAwardedOrderRecord(orderId) {
  if (!orderId) return null;

  const hit = readAwardedMap()?.[orderId];
  if (!hit) return null;

  if (hit === true) {
    return { earned: 0, awardedAt: "", amountSek: 0 };
  }

  return {
    earned: Number(hit.earned || 0),
    awardedAt: hit.awardedAt || "",
    amountSek: Number(hit.amountSek || 0),
  };
}

function extractCore(order) {
  const core = order?.core || {};
  const coreMeta = order?.coreMeta || order?.core_meta || {};
  const attribution = coreMeta?.attribution || core?.attribution || {};

  return {
    userId: core.userId || coreMeta.userId || order?.userId || order?.user_id || "",
    memberId: core.memberId || coreMeta.memberId || order?.memberId || order?.member_id || "",
    memberTier:
      core.memberTier || coreMeta.memberTier || order?.memberTier || order?.member_tier || "guest",
    campaignId:
      core.campaignId ||
      coreMeta.campaignId ||
      order?.campaignId ||
      order?.campaign_id ||
      order?.campaign?.key ||
      "",
    campaignTitle: order?.campaign?.title || core.campaignTitle || coreMeta.campaignTitle || "",
    creatorId: core.creatorId || coreMeta.creatorId || order?.creatorId || order?.creator_id || "",
    creatorCode:
      core.creatorCode || coreMeta.creatorCode || order?.creatorCode || order?.creator_code || "",
    affiliateId:
      core.affiliateId ||
      coreMeta.affiliateId ||
      order?.affiliateId ||
      order?.affiliate_id ||
      order?.affiliate ||
      "",
    affiliateCode:
      core.affiliateCode ||
      core.affiliateReferralCode ||
      coreMeta.affiliateCode ||
      coreMeta.affiliateReferralCode ||
      order?.affiliateCode ||
      order?.affiliate_code ||
      "",
    associateId:
      core.associateId || coreMeta.associateId || order?.associateId || order?.associate_id || "",
    associateCode:
      core.associateCode ||
      coreMeta.associateCode ||
      order?.associateCode ||
      order?.associate_code ||
      "",
    ambassadorCode:
      core.ambassadorCode ||
      coreMeta.ambassadorCode ||
      order?.ambassadorCode ||
      order?.ambassador_code ||
      "",
    partnerCode:
      core.partnerCode || coreMeta.partnerCode || order?.partnerCode || order?.partner_code || "",
    referralCode:
      core.referralCode ||
      coreMeta.referralCode ||
      order?.referralCode ||
      order?.referral_code ||
      "",
    rewardCode:
      core.rewardCode || coreMeta.rewardCode || order?.rewardCode || order?.reward_code || "",
    rewardReady: !!(core.rewardReady || coreMeta.rewardReady || order?.rewardReady),
    attributionOwner:
      core.attributionOwner ||
      coreMeta.attributionOwner ||
      order?.attributionOwner ||
      order?.attribution_owner ||
      "calestra",
    thirdPartyType:
      core.thirdPartyType ||
      coreMeta.thirdPartyType ||
      order?.thirdPartyType ||
      order?.third_party_type ||
      "",
    sourceChannel:
      core.sourceChannel ||
      coreMeta.sourceChannel ||
      order?.sourceChannel ||
      order?.source_channel ||
      order?.source ||
      "store",
    trafficSource:
      core.trafficSource ||
      coreMeta.trafficSource ||
      order?.trafficSource ||
      order?.traffic_source ||
      attribution?.utmSource ||
      "",
    entryPoint:
      core.entryPoint ||
      coreMeta.entryPoint ||
      order?.entryPoint ||
      order?.entry_point ||
      "checkout",
  };
}

function levelLabel(level, i18n, t) {
  const key = String(level || "starlight").toLowerCase();

  if (key === "aurora") {
    return TT(i18n, t, "receipt.dreamPoints.levels.aurora", {
      sv: "Aurora",
      en: "Aurora",
      tr: "Aurora",
    });
  }

  if (key === "celestial") {
    return TT(i18n, t, "receipt.dreamPoints.levels.celestial", {
      sv: "Celestial",
      en: "Celestial",
      tr: "Celestial",
    });
  }

  if (key === "moonlight") {
    return TT(i18n, t, "receipt.dreamPoints.levels.moonlight", {
      sv: "Moonlight",
      en: "Moonlight",
      tr: "Moonlight",
    });
  }

  return TT(i18n, t, "receipt.dreamPoints.levels.starlight", {
    sv: "Starlight",
    en: "Starlight",
    tr: "Starlight",
  });
}

function getViewCurrency(orderCurrency, activeCurrency) {
  return activeCurrency || orderCurrency || "SEK";
}

function readFlowState(order, searchParams, items) {
  const flowQuery = String(searchParams.get("flow") || "").trim().toLowerCase();
  const status = String(order?.status || "").trim().toLowerCase();
  const orderFlowType = String(order?.orderFlowType || order?.uiMeta?.flowType || "")
    .trim()
    .toLowerCase();

  const hasPreorderMeta = !!order?.preorderMeta?.hasPreorder;
  const mixedMeta =
    !!order?.preorderMeta?.mixedCart || orderFlowType === "mixed" || flowQuery === "mixed";
  const hasPreorderItems = Array.isArray(items) ? items.some((it) => it.isPreorder) : false;
  const buyLines = Array.isArray(items) ? items.filter((it) => !it.isPreorder).length : 0;
  const preorderLines = Array.isArray(items) ? items.filter((it) => it.isPreorder).length : 0;

  const isPreorder =
    flowQuery === "preorder" ||
    flowQuery === "mixed" ||
    status === "preorder_reserved" ||
    status === "mixed_pending" ||
    status === "reserved" ||
    orderFlowType === "preorder" ||
    orderFlowType === "mixed" ||
    hasPreorderMeta ||
    hasPreorderItems ||
    !!order?.preorderSystem?.enabled;

  const isMixed = isPreorder && (mixedMeta || (preorderLines > 0 && buyLines > 0));

  return {
    isPreorder,
    isMixed,
    flowType: isMixed ? "mixed" : isPreorder ? "preorder" : "standard",
    preorderLines,
    buyLines,
  };
}

function safeDateText(value, locale) {
  if (!value) return "";

  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(locale);
  } catch {
    return "";
  }
}

function buildGrowthChips(core, i18n, t) {
  const labels = {
    creator: TT(i18n, t, "receipt.growth.creator", {
      sv: "Creator",
      en: "Creator",
      tr: "Creator",
    }),
    affiliate: TT(i18n, t, "receipt.growth.affiliate", {
      sv: "Affiliate",
      en: "Affiliate",
      tr: "Affiliate",
    }),
    associate: TT(i18n, t, "receipt.growth.associate", {
      sv: "Associate",
      en: "Associate",
      tr: "Associate",
    }),
    code: TT(i18n, t, "receipt.growth.code", { sv: "Kod", en: "Code", tr: "Kod" }),
    owner: TT(i18n, t, "receipt.growth.owner", { sv: "Ägare", en: "Owner", tr: "Sahip" }),
    type: TT(i18n, t, "receipt.growth.type", { sv: "Typ", en: "Type", tr: "Tür" }),
    channel: TT(i18n, t, "receipt.growth.channel", {
      sv: "Kanal",
      en: "Channel",
      tr: "Kanal",
    }),
    traffic: TT(i18n, t, "receipt.growth.traffic", {
      sv: "Trafik",
      en: "Traffic",
      tr: "Trafik",
    }),
    tier: TT(i18n, t, "receipt.growth.tier", { sv: "Nivå", en: "Tier", tr: "Seviye" }),
    campaign: TT(i18n, t, "receipt.growth.campaign", {
      sv: "Kampanj",
      en: "Campaign",
      tr: "Kampanya",
    }),
    reward: TT(i18n, t, "receipt.growth.reward", {
      sv: "Reward",
      en: "Reward",
      tr: "Ödül",
    }),
  };

  return [
    core.creatorId ? `${labels.creator}: ${cleanString(core.creatorId, 120)}` : "",
    core.creatorCode ? `${labels.code}: ${cleanString(core.creatorCode, 120)}` : "",
    core.affiliateId ? `${labels.affiliate}: ${cleanString(core.affiliateId, 120)}` : "",
    core.affiliateCode ? `${labels.code}: ${cleanString(core.affiliateCode, 120)}` : "",
    core.associateId ? `${labels.associate}: ${cleanString(core.associateId, 120)}` : "",
    core.associateCode ? `${labels.code}: ${cleanString(core.associateCode, 120)}` : "",
    core.partnerCode ? `Partner: ${cleanString(core.partnerCode, 120)}` : "",
    core.referralCode ? `Referral: ${cleanString(core.referralCode, 120)}` : "",
    core.rewardCode ? `${labels.reward}: ${cleanString(core.rewardCode, 120)}` : "",
    core.attributionOwner ? `${labels.owner}: ${cleanString(core.attributionOwner, 120)}` : "",
    core.thirdPartyType ? `${labels.type}: ${cleanString(core.thirdPartyType, 120)}` : "",
    core.sourceChannel ? `${labels.channel}: ${cleanString(core.sourceChannel, 120)}` : "",
    core.trafficSource ? `${labels.traffic}: ${cleanString(core.trafficSource, 120)}` : "",
    core.memberTier ? `${labels.tier}: ${cleanString(core.memberTier, 120)}` : "",
    core.campaignId ? `${labels.campaign}: ${cleanString(core.campaignId, 120)}` : "",
  ].filter(Boolean);
}

export default function Receipt() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { currency: activeCurrency, locale: ctxLocale, rates } = useCurrency();
  const { points, level, refresh } = useDreamPoints();

  const [order, setOrder] = React.useState(() => (id ? loadLocalOrder(id) : null));

  React.useEffect(() => {
    if (!id) return;

    const found = loadLocalOrder(id);
    if (found) setOrder(found);
  }, [id]);

  React.useEffect(() => {
    if (!order) return;
    upsertLocalOrder(order);
  }, [order]);

  React.useEffect(() => {
    if (typeof refresh === "function") refresh();
  }, [refresh, id]);

  React.useEffect(() => {
    if (searchParams.get("pdf") !== "1") return;

    const to = setTimeout(() => {
      try {
        window.print();
      } catch {
        // noop
      }
    }, 150);

    return () => clearTimeout(to);
  }, [searchParams]);

  const items = React.useMemo(() => normalizeItems(order, i18n, t), [order, i18n, t]);
  const totalsSEK = React.useMemo(() => totalsSEKFromOrder(order, items), [order, items]);
  const discount = React.useMemo(() => extractDiscount(order || {}), [order]);
  const dreamAwarded = React.useMemo(() => readAwardedOrderRecord(id), [id]);
  const core = React.useMemo(() => extractCore(order || {}), [order]);
  const flowState = React.useMemo(
    () => readFlowState(order || {}, searchParams, items),
    [order, searchParams, items]
  );
  const growthChips = React.useMemo(() => buildGrowthChips(core, i18n, t), [core, i18n, t]);

  if (!id || !order) {
    return (
      <div className="container">
        <div className="card receipt-card">
          <div className="receipt-kicker-row">
            <span className="receipt-live-dot" />
            <span className="receipt-kicker">
              {TT(i18n, t, "receipt.kicker", {
                sv: "Harmonic Star",
                en: "Harmonic Star",
                tr: "Harmonic Star",
              })}
            </span>
          </div>

          <h1>
            {TT(i18n, t, "receipt.title", {
              sv: "Kvitto",
              en: "Receipt",
              tr: "Fiş",
            })}
          </h1>

          <p>
            {TT(i18n, t, "receipt.missing", {
              sv: "Ordern kunde inte hittas i denna webbläsare.",
              en: "The order could not be found in this browser.",
              tr: "Sipariş bu tarayıcıda bulunamadı.",
            })}
          </p>

          <div className="bottomActions">
            <Link className="btn" to="/shop">
              {TT(i18n, t, "receipt.toShop", {
                sv: "Till butiken",
                en: "Go to shop",
                tr: "Mağazaya git",
              })}
            </Link>
          </div>
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  const locale = ctxLocale || (typeof window !== "undefined" && navigator.language) || "sv-SE";
  const orderCurrency = order.currency || "SEK";
  const viewCurrency = getViewCurrency(orderCurrency, activeCurrency);

  const anyPhysical =
    typeof order.anyPhysical === "boolean" ? order.anyPhysical : hasPhysicalItems(order.items || []);

  const money = (sek) =>
    formatMoney(convertFromSEK(Number(sek || 0), viewCurrency, rates), viewCurrency, locale);

  const createdText = safeDateText(order?.createdAt || order?.created_at, locale);
  const isPreview = String(order.mode || "preview").toLowerCase() !== "live";

  const reservationCode = cleanString(
    order?.preorderSystem?.reservationCode ||
      order?.preorderMeta?.reservationCode ||
      searchParams.get("reservation") ||
      "",
    120
  );

  const showFreeShippingCodeRow =
    anyPhysical && discount.freeShipping && !!discount.code && Number(totalsSEK.discount || 0) <= 0;

  return (
    <div className="container receipt-page">
      <div className="card receipt-card">
        <div className="receipt-star" aria-hidden="true" />

        <header className="top">
          <div className="top-left">
            <div className="receipt-kicker-row">
              <span className="receipt-live-dot" />
              <span className="receipt-kicker">
                {TT(i18n, t, "receipt.kicker", {
                  sv: "Harmonic Star",
                  en: "Harmonic Star",
                  tr: "Harmonic Star",
                })}
              </span>
            </div>

            <h1 className="h1">
              {TT(i18n, t, "receipt.title", {
                sv: "Kvitto",
                en: "Receipt",
                tr: "Fiş",
              })}

              {isPreview ? (
                <span className="pill">
                  {TT(i18n, t, "receipt.previewBadge", {
                    sv: "PREVIEW",
                    en: "PREVIEW",
                    tr: "PREVIEW",
                  })}
                </span>
              ) : null}

              {flowState.isPreorder ? (
                <span className="pill preorder-pill">
                  {flowState.isMixed
                    ? TT(i18n, t, "receipt.mixed.badge", {
                        sv: "MIXED",
                        en: "MIXED",
                        tr: "KARMA",
                      })
                    : TT(i18n, t, "receipt.preorder.badge", {
                        sv: "PREORDER",
                        en: "PREORDER",
                        tr: "ÖN SİPARİŞ",
                      })}
                </span>
              ) : null}
            </h1>

            <p className="receipt-lead">
              {flowState.isPreorder
                ? flowState.isMixed
                  ? TT(i18n, t, "receipt.mixed.lead", {
                      sv: "Detta kvitto visar en blandad order med både vanliga rader och förbeställning.",
                      en: "This receipt shows a mixed order with both regular lines and pre-order lines.",
                      tr: "Bu fiş hem normal satırları hem de ön sipariş satırlarını içeren karma bir siparişi gösterir.",
                    })
                  : TT(i18n, t, "receipt.preorder.lead", {
                      sv: "Detta kvitto visar en registrerad förbeställning. Reservationen är sparad i systemet och markerad tydligt här.",
                      en: "This receipt shows a registered pre-order. The reservation is saved in the system and clearly marked here.",
                      tr: "Bu fiş kayıtlı bir ön siparişi gösterir. Rezervasyon sistemde kaydedildi ve burada açıkça işaretlendi.",
                    })
                : TT(i18n, t, "receipt.lead", {
                    sv: "Ett rent kvitto för det som nu har tagit form. Sparat, delbart och alltid nära till hands.",
                    en: "A clean receipt for what has now taken shape. Saved, shareable, and always close at hand.",
                    tr: "Artık şekil alan şey için temiz bir fiş. Kaydedilmiş, paylaşılabilir ve her zaman elinizin altında.",
                  })}
            </p>

            <div className="meta">
              <div>
                <strong>
                  {TT(i18n, t, "receipt.orderId", {
                    sv: "Order-ID",
                    en: "Order ID",
                    tr: "Sipariş ID",
                  })}
                  :
                </strong>{" "}
                <span className="mono">{id}</span>
              </div>

              {createdText ? (
                <div>
                  <strong>
                    {TT(i18n, t, "receipt.date", {
                      sv: "Datum",
                      en: "Date",
                      tr: "Tarih",
                    })}
                    :
                  </strong>{" "}
                  {createdText}
                </div>
              ) : null}

              <div>
                <strong>
                  {TT(i18n, t, "receipt.orderCurrency", {
                    sv: "Ordervaluta",
                    en: "Order currency",
                    tr: "Sipariş para birimi",
                  })}
                  :
                </strong>{" "}
                {orderCurrency}
              </div>

              {viewCurrency !== orderCurrency ? (
                <div>
                  <strong>
                    {TT(i18n, t, "receipt.viewCurrency", {
                      sv: "Visas i",
                      en: "Shown in",
                      tr: "Gösterilen para birimi",
                    })}
                    :
                  </strong>{" "}
                  {viewCurrency}
                  <span className="approx">
                    {" "}
                    (
                    {TT(i18n, t, "receipt.approx", {
                      sv: "ungefärligt",
                      en: "approximate",
                      tr: "yaklaşık",
                    })}
                    )
                  </span>
                </div>
              ) : null}

              {flowState.isPreorder ? (
                <div>
                  <strong>
                    {TT(i18n, t, "receipt.preorder.status", {
                      sv: "Ordertyp",
                      en: "Order type",
                      tr: "Sipariş türü",
                    })}
                    :
                  </strong>{" "}
                  {flowState.isMixed
                    ? TT(i18n, t, "receipt.mixed.statusValue", {
                        sv: "Blandad order",
                        en: "Mixed order",
                        tr: "Karma sipariş",
                      })
                    : TT(i18n, t, "receipt.preorder.statusValue", {
                        sv: "Förbeställning",
                        en: "Pre-order",
                        tr: "Ön sipariş",
                      })}
                </div>
              ) : null}

              {reservationCode ? (
                <div>
                  <strong>
                    {TT(i18n, t, "receipt.preorder.reservationCode", {
                      sv: "Reservationskod",
                      en: "Reservation code",
                      tr: "Rezervasyon kodu",
                    })}
                    :
                  </strong>{" "}
                  <span className="mono">{reservationCode}</span>
                </div>
              ) : null}
            </div>

            <div className="celeste-note" aria-live="polite">
              <span className="celeste-dot" />
              <span>
                {flowState.isPreorder
                  ? TT(i18n, t, "receipt.celeste.preorder", {
                      sv: "Allt är registrerat som förbeställning. Du kan alltid hitta tillbaka hit.",
                      en: "Everything is registered as a pre-order. You can always find your way back here.",
                      tr: "Her şey ön sipariş olarak kaydedildi. Buraya her zaman geri dönebilirsiniz.",
                    })
                  : TT(i18n, t, "receipt.celeste", {
                      sv: "Allt är registrerat. Du kan alltid hitta tillbaka hit.",
                      en: "Everything is registered. You can always find your way back here.",
                      tr: "Her şey kaydedildi. Buraya her zaman geri dönebilirsiniz.",
                    })}
              </span>
            </div>
          </div>

          <div className="topActions">
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
              {TT(i18n, t, "receipt.print", {
                sv: "Skriv ut",
                en: "Print",
                tr: "Yazdır",
              })}
            </button>

            <Link className="btn" to="/shop">
              {TT(i18n, t, "receipt.continue", {
                sv: "Fortsätt handla",
                en: "Continue shopping",
                tr: "Alışverişe devam et",
              })}
            </Link>
          </div>
        </header>

        <div className="divider" />

        {flowState.isPreorder ? (
          <>
            <div
              className={`preorderBox ${flowState.isMixed ? "preorderBox--mixed" : ""}`}
              aria-live="polite"
            >
              <div className="preorderBoxTitle">
                {flowState.isMixed
                  ? TT(i18n, t, "receipt.mixed.boxTitle", {
                      sv: "Blandad order registrerad",
                      en: "Mixed order registered",
                      tr: "Karma sipariş kaydedildi",
                    })
                  : TT(i18n, t, "receipt.preorder.boxTitle", {
                      sv: "Förbeställning registrerad",
                      en: "Pre-order registered",
                      tr: "Ön sipariş kaydedildi",
                    })}
              </div>

              <div className="preorderBoxLead">
                {flowState.isMixed
                  ? TT(i18n, t, "receipt.mixed.boxLead", {
                      sv: "Ordern innehåller både vanliga produkter och förbeställningar. Leveranslogiken hålls tydligt separat.",
                      en: "The order contains both regular products and pre-orders. Fulfillment logic is kept clearly separate.",
                      tr: "Sipariş hem normal ürünler hem de ön siparişler içeriyor. Teslimat mantığı net şekilde ayrı tutulur.",
                    })
                  : TT(i18n, t, "receipt.preorder.boxLead", {
                      sv: "Den här ordern behandlas som reservation eller förbeställning och inte som vanlig direktleverans.",
                      en: "This order is handled as a reservation or pre-order, not as a standard direct shipment.",
                      tr: "Bu sipariş normal doğrudan teslimat değil, rezervasyon veya ön sipariş olarak işlenir.",
                    })}
              </div>

              {reservationCode ? (
                <div className="preorderCodeRow">
                  <span>
                    {TT(i18n, t, "receipt.preorder.reservationCode", {
                      sv: "Reservationskod",
                      en: "Reservation code",
                      tr: "Rezervasyon kodu",
                    })}
                  </span>
                  <strong className="mono">{reservationCode}</strong>
                </div>
              ) : null}
            </div>

            <div className="divider" />
          </>
        ) : null}

        <div className="dreamBox" aria-live="polite">
          <div className="dreamHead">
            <div className="dreamTitle">
              {TT(i18n, t, "receipt.dreamPoints.title", {
                sv: "DreamPoints",
                en: "DreamPoints",
                tr: "DreamPoints",
              })}
            </div>
            <div className="dreamBadge">{levelLabel(level, i18n, t)}</div>
          </div>

          <div className="dreamGrid">
            <div className="dreamStat">
              <div className="dreamLabel">
                {TT(i18n, t, "receipt.dreamPoints.balance", {
                  sv: "Poängsaldo",
                  en: "Points balance",
                  tr: "Puan bakiyesi",
                })}
              </div>
              <div className="dreamValue">{Number(points || 0)}</div>
            </div>

            <div className="dreamStat">
              <div className="dreamLabel">
                {TT(i18n, t, "receipt.dreamPoints.earned", {
                  sv: "Intjänat på ordern",
                  en: "Earned on this order",
                  tr: "Bu siparişte kazanılan",
                })}
              </div>
              <div className="dreamValue">{Number(dreamAwarded?.earned || 0)} p</div>
            </div>
          </div>

          <div className="dreamHint">
            {dreamAwarded?.earned > 0
              ? TT(i18n, t, "receipt.dreamPoints.success", {
                  sv: "Poäng har redan lagts till från den här ordern och visas här som kvittobevis.",
                  en: "Points have already been added from this order and are shown here as receipt proof.",
                  tr: "Bu siparişten puanlar zaten eklendi ve burada fiş kanıtı olarak gösteriliyor.",
                })
              : TT(i18n, t, "receipt.dreamPoints.previewHint", {
                  sv: "Poängstatus visas här när den finns sparad på ordern.",
                  en: "Points status is shown here once it is saved on the order.",
                  tr: "Puan durumu siparişte kayıtlı olduğunda burada gösterilir.",
                })}
          </div>
        </div>

        {growthChips.length > 0 ? (
          <>
            <details className="growthBox" aria-label="Growth attribution receipt">
              <summary className="growthTitle">
                {TT(i18n, t, "receipt.growth.title", {
                  sv: "Orderdata",
                  en: "Order data",
                  tr: "Sipariş verisi",
                })}
              </summary>

              <div className="growthGrid">
                {growthChips.map((chip) => (
                  <div key={chip} className="growthChip">
                    {chip}
                  </div>
                ))}
              </div>
            </details>

            <div className="divider" />
          </>
        ) : null}

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>
                  {TT(i18n, t, "receipt.product", {
                    sv: "Produkt",
                    en: "Product",
                    tr: "Ürün",
                  })}
                </th>
                <th className="num">
                  {TT(i18n, t, "receipt.qty", {
                    sv: "Antal",
                    en: "Qty",
                    tr: "Adet",
                  })}
                </th>
                <th className="num">
                  {TT(i18n, t, "receipt.unit", {
                    sv: "Styck",
                    en: "Unit",
                    tr: "Birim",
                  })}
                </th>
                <th className="num">
                  {TT(i18n, t, "receipt.sum", {
                    sv: "Summa",
                    en: "Sum",
                    tr: "Toplam",
                  })}
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((it, idx) => (
                <tr key={`${it.lineKey}__${idx}`}>
                  <td>
                    <div className="itemCell">
                      {it.image ? (
                        <img src={it.image} alt="" aria-hidden="true" className="lineThumb" />
                      ) : null}

                      <div>
                        <div className="itemName">{it.name}</div>

                        {it.variant ? <span className="variant">{it.variant}</span> : null}

                        {it.isPreorder ? (
                          <div className="itemPreorder">
                            <span className="itemPreorderBadge">
                              {TT(i18n, t, "receipt.preorder.badge", {
                                sv: "PREORDER",
                                en: "PREORDER",
                                tr: "ÖN SİPARİŞ",
                              })}
                            </span>

                            {it.preorderText ? (
                              <span className="itemPreorderText">{it.preorderText}</span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="num">{it.qty}</td>
                  <td className="num">{money(it.priceSEK)}</td>
                  <td className="num strongNum">
                    {money(Number(it.priceSEK || 0) * Number(it.qty || 1))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divider" />

        <div className="summary">
          <div>
            <span>
              {TT(i18n, t, "checkout.subtotal", {
                sv: "Delsumma",
                en: "Subtotal",
                tr: "Ara toplam",
              })}
            </span>
            <span>{money(totalsSEK.sub)}</span>
          </div>

          {anyPhysical ? (
            <div>
              <span>
                {TT(i18n, t, "checkout.shippingFee", {
                  sv: "Frakt",
                  en: "Shipping",
                  tr: "Kargo",
                })}
              </span>
              <span>
                {Number(totalsSEK.ship || 0) === 0
                  ? TT(i18n, t, "checkout.free", {
                      sv: "Fri frakt",
                      en: "Free shipping",
                      tr: "Ücretsiz kargo",
                    })
                  : money(totalsSEK.ship)}
              </span>
            </div>
          ) : null}

          {showFreeShippingCodeRow ? (
            <div className="discountRow">
              <span>
                {TT(i18n, t, "receipt.discountCode", {
                  sv: "Kod",
                  en: "Code",
                  tr: "Kod",
                })}
                {discount.code ? ` (${discount.code})` : ""}
              </span>
              <span>
                {TT(i18n, t, "checkout.free", {
                  sv: "Fri frakt",
                  en: "Free shipping",
                  tr: "Ücretsiz kargo",
                })}
              </span>
            </div>
          ) : null}

          {Number(totalsSEK.discount || 0) > 0 ? (
            <div className="discountRow">
              <span>
                {TT(i18n, t, "receipt.discount", {
                  sv: "Rabatt",
                  en: "Discount",
                  tr: "İndirim",
                })}
                {discount.code ? ` (${discount.code})` : ""}
              </span>
              <span>−{money(Number(totalsSEK.discount || 0))}</span>
            </div>
          ) : null}

          <div>
            <span>
              {TT(i18n, t, "receipt.vat", {
                sv: "Varav moms",
                en: "Included VAT",
                tr: "Dahil KDV",
              })}
            </span>
            <span>{money(totalsSEK.tax)}</span>
          </div>

          <div className="total">
            <span>
              {TT(i18n, t, "checkout.total", {
                sv: "Totalt",
                en: "Total",
                tr: "Toplam",
              })}
            </span>
            <span>{money(totalsSEK.grand)}</span>
          </div>
        </div>

        <div className="bottomActions">
          <Link className="btn" to="/shop">
            {TT(i18n, t, "receipt.toShop", {
              sv: "Till butiken",
              en: "Go to shop",
              tr: "Mağazaya git",
            })}
          </Link>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .container{
    max-width:980px;
    margin:0 auto;
    padding:16px;
  }

  .receipt-page{
    padding-top:8px;
    padding-bottom:32px;
  }

  .receipt-card{
    position:relative;
    overflow:hidden;
    background:linear-gradient(180deg, rgba(255,255,255,.97), rgba(248,250,252,.99));
    border-radius:24px;
    padding:22px;
    border:1px solid rgba(230,234,240,.95);
    box-shadow:0 18px 42px rgba(15,23,42,.08);
  }

  .theme-dark .receipt-card{
    background:linear-gradient(180deg, rgba(15,22,34,.98), rgba(8,12,20,.98));
    border-color:rgba(255,255,255,.10);
    box-shadow:0 16px 40px rgba(0,0,0,.35);
  }

  .receipt-star{
    position:absolute;
    inset:auto -10% -18% auto;
    width:230px;
    height:230px;
    border-radius:999px;
    background:radial-gradient(circle, rgba(250,204,21,.16), rgba(250,204,21,0));
    filter:blur(10px);
    pointer-events:none;
  }

  .top{
    display:flex;
    justify-content:space-between;
    gap:16px;
    flex-wrap:wrap;
    position:relative;
    z-index:1;
  }

  .top-left{
    min-width:0;
    flex:1 1 520px;
  }

  .receipt-kicker-row{
    display:inline-flex;
    align-items:center;
    gap:8px;
    padding:6px 10px;
    border-radius:999px;
    background:rgba(15,23,42,.05);
    border:1px solid rgba(15,23,42,.08);
    color:#475569;
    font-size:11px;
    font-weight:1000;
    letter-spacing:.08em;
    text-transform:uppercase;
    margin-bottom:12px;
  }

  .theme-dark .receipt-kicker-row{
    background:rgba(255,255,255,.05);
    border-color:rgba(148,163,184,.18);
    color:#cbd5e1;
  }

  .receipt-live-dot{
    width:8px;
    height:8px;
    border-radius:999px;
    background:#f97316;
    box-shadow:0 0 0 0 rgba(249,115,22,.45);
    animation:receiptPulse 1.8s infinite;
  }

  @keyframes receiptPulse{
    0%{ box-shadow:0 0 0 0 rgba(249,115,22,.45); }
    70%{ box-shadow:0 0 0 8px rgba(249,115,22,0); }
    100%{ box-shadow:0 0 0 0 rgba(249,115,22,0); }
  }

  .h1{
    margin:0 0 6px;
    font-size:clamp(30px, 4vw, 50px);
    line-height:1.02;
    letter-spacing:-.04em;
    color:#0f172a;
  }

  .theme-dark .h1{
    color:#f8fafc;
  }

  .pill{
    margin-left:8px;
    font-size:11px;
    font-weight:1000;
    padding:4px 9px;
    border-radius:999px;
    background:#eaf0ff;
    color:#3558ff;
    vertical-align:middle;
    letter-spacing:.03em;
  }

  .preorder-pill{
    background:rgba(249,115,22,.12);
    color:#9a3412;
  }

  .theme-dark .pill{
    background:rgba(124,139,255,.14);
    color:#e6e7ea;
  }

  .theme-dark .preorder-pill{
    background:rgba(249,115,22,.16);
    color:#fdba74;
  }

  .receipt-lead{
    margin:0 0 12px;
    color:#334155;
    line-height:1.6;
    font-size:14px;
    font-weight:700;
    max-width:66ch;
  }

  .theme-dark .receipt-lead{
    color:#c9d2e3;
  }

  .meta{
    font-size:14px;
    color:#475569;
    display:grid;
    gap:4px;
  }

  .theme-dark .meta{
    color:#c9d2e3;
  }

  .mono{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    font-weight:800;
  }

  .approx{
    color:#64748b;
    margin-left:4px;
  }

  .theme-dark .approx{
    color:#a3acb8;
  }

  .celeste-note{
    margin-top:10px;
    display:flex;
    align-items:center;
    gap:8px;
    font-size:12px;
    font-weight:800;
    color:#475569;
    opacity:.92;
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

  .topActions{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    align-self:flex-start;
  }

  .btn{
    padding:10px 14px;
    border-radius:999px;
    background:linear-gradient(135deg,#4B6BFA,#3558ff);
    color:#fff;
    border:0;
    cursor:pointer;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    font-weight:900;
    min-height:42px;
    box-shadow:0 14px 28px rgba(75,107,250,.16);
    transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
  }

  .btn:hover{
    background:linear-gradient(135deg,#3F5BE0,#2948d8);
    transform:translateY(-1px);
  }

  .btn-ghost{
    background:transparent;
    border:1px solid #4B6BFA;
    color:#4B6BFA;
    box-shadow:none;
  }

  .btn-ghost:hover{
    background:#eef2ff;
  }

  .theme-dark .btn-ghost{
    border-color:#4B6BFA;
    color:#cfe0ff;
  }

  .theme-dark .btn-ghost:hover{
    background:#0b1424;
  }

  .preorderBox{
    position:relative;
    z-index:1;
    margin:0 0 16px;
    padding:14px;
    border-radius:18px;
    border:1px solid rgba(249,115,22,.28);
    background:linear-gradient(180deg, rgba(249,115,22,.10), rgba(250,204,21,.05));
  }

  .preorderBox--mixed{
    border-color:rgba(75,107,250,.24);
    background:linear-gradient(180deg, rgba(75,107,250,.08), rgba(250,204,21,.05));
  }

  .theme-dark .preorderBox{
    background:linear-gradient(180deg, rgba(249,115,22,.14), rgba(255,255,255,.03));
    border-color:rgba(249,115,22,.24);
  }

  .theme-dark .preorderBox--mixed{
    background:linear-gradient(180deg, rgba(75,107,250,.12), rgba(255,255,255,.03));
    border-color:rgba(124,139,255,.20);
  }

  .preorderBoxTitle{
    font-size:14px;
    font-weight:1000;
    color:#0f172a;
  }

  .theme-dark .preorderBoxTitle{
    color:#f8fafc;
  }

  .preorderBoxLead{
    margin-top:6px;
    font-size:13px;
    line-height:1.55;
    color:#7c2d12;
    font-weight:900;
  }

  .preorderBox--mixed .preorderBoxLead{
    color:#334155;
  }

  .theme-dark .preorderBoxLead{
    color:#fed7aa;
  }

  .theme-dark .preorderBox--mixed .preorderBoxLead{
    color:#cbd5e1;
  }

  .preorderCodeRow{
    margin-top:10px;
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    align-items:center;
    font-size:12px;
    font-weight:900;
    color:#7c2d12;
  }

  .preorderCodeRow strong{
    display:inline-flex;
    padding:5px 9px;
    border-radius:999px;
    background:rgba(255,255,255,.76);
    border:1px solid rgba(15,23,42,.08);
    color:#0f172a;
  }

  .theme-dark .preorderCodeRow{
    color:#fed7aa;
  }

  .theme-dark .preorderCodeRow strong{
    background:rgba(255,255,255,.06);
    border-color:rgba(148,163,184,.18);
    color:#f8fafc;
  }

  .dreamBox{
    position:relative;
    z-index:1;
    margin:0 0 16px;
    padding:14px;
    border-radius:18px;
    border:1px solid rgba(250,204,21,.28);
    background:linear-gradient(180deg, rgba(250,204,21,.10), rgba(250,204,21,.04));
  }

  .theme-dark .dreamBox{
    border-color:rgba(250,204,21,.20);
    background:linear-gradient(180deg, rgba(250,204,21,.10), rgba(255,255,255,.03));
  }

  .dreamHead{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    flex-wrap:wrap;
  }

  .dreamTitle{
    font-size:14px;
    font-weight:1000;
    color:#0f172a;
  }

  .theme-dark .dreamTitle{
    color:#f8fafc;
  }

  .dreamBadge{
    padding:5px 10px;
    border-radius:999px;
    background:rgba(255,255,255,.72);
    border:1px solid rgba(15,23,42,.08);
    color:#0f172a;
    font-size:11px;
    font-weight:1000;
    text-transform:capitalize;
  }

  .theme-dark .dreamBadge{
    background:rgba(255,255,255,.06);
    border-color:rgba(148,163,184,.18);
    color:#f8fafc;
  }

  .dreamGrid{
    margin-top:10px;
    display:grid;
    grid-template-columns:repeat(2, minmax(0,1fr));
    gap:10px;
  }

  .dreamStat{
    border-radius:14px;
    padding:12px;
    background:rgba(255,255,255,.72);
    border:1px solid rgba(15,23,42,.06);
  }

  .theme-dark .dreamStat{
    background:rgba(255,255,255,.04);
    border-color:rgba(148,163,184,.14);
  }

  .dreamLabel{
    font-size:11px;
    color:#64748b;
    font-weight:900;
  }

  .theme-dark .dreamLabel{
    color:#cbd5e1;
  }

  .dreamValue{
    margin-top:4px;
    font-size:22px;
    line-height:1.1;
    font-weight:1000;
    color:#0f172a;
  }

  .theme-dark .dreamValue{
    color:#f8fafc;
  }

  .dreamHint{
    margin-top:10px;
    font-size:12px;
    line-height:1.5;
    color:#475569;
    font-weight:800;
  }

  .theme-dark .dreamHint{
    color:#cbd5e1;
  }

  .growthBox{
    position:relative;
    z-index:1;
    margin:0 0 16px;
    padding:12px;
    border-radius:16px;
    border:1px solid rgba(15,23,42,.08);
    background:rgba(15,23,42,.03);
  }

  .theme-dark .growthBox{
    background:rgba(255,255,255,.04);
    border-color:rgba(148,163,184,.14);
  }

  .growthTitle{
    cursor:pointer;
    font-size:12px;
    font-weight:1000;
    color:#0f172a;
    text-transform:uppercase;
    letter-spacing:.05em;
  }

  .theme-dark .growthTitle{
    color:#f8fafc;
  }

  .growthGrid{
    margin-top:10px;
    display:flex;
    flex-wrap:wrap;
    gap:8px;
  }

  .growthChip{
    display:inline-flex;
    align-items:center;
    gap:6px;
    border-radius:999px;
    padding:5px 10px;
    font-size:12px;
    font-weight:800;
    background:#fff;
    border:1px solid rgba(15,23,42,.08);
    color:#334155;
  }

  .theme-dark .growthChip{
    background:rgba(255,255,255,.05);
    border-color:rgba(148,163,184,.14);
    color:#cbd5e1;
  }

  .divider{
    height:1px;
    background:#E0E6EE;
    margin:16px 0;
  }

  .theme-dark .divider{
    background:#1d2636;
  }

  .tableWrap{
    overflow:auto;
    position:relative;
    z-index:1;
  }

  .table{
    width:100%;
    border-collapse:collapse;
    min-width:620px;
  }

  th, td{
    padding:12px 10px;
    border-bottom:1px solid #E6EAF0;
    vertical-align:middle;
  }

  .theme-dark th,
  .theme-dark td{
    border-bottom-color:#1d2636;
  }

  th{
    color:#64748b;
    font-size:12px;
    font-weight:1000;
    letter-spacing:.08em;
    text-transform:uppercase;
    text-align:left;
  }

  .theme-dark th{
    color:#94a3b8;
  }

  .num{
    text-align:right;
    white-space:nowrap;
  }

  .itemCell{
    display:flex;
    align-items:center;
    gap:12px;
    min-width:220px;
  }

  .lineThumb{
    width:48px;
    height:48px;
    border-radius:10px;
    object-fit:cover;
    background:#F3F4F6;
    border:1px solid rgba(148,163,184,.18);
    flex:0 0 auto;
  }

  .theme-dark .lineThumb{
    background:#1a2231;
  }

  .itemName{
    color:#0f172a;
    font-weight:800;
    line-height:1.4;
  }

  .theme-dark .itemName{
    color:#e6e7ea;
  }

  .variant{
    display:inline-block;
    margin-top:3px;
    color:#64748b;
    font-weight:700;
    font-size:13px;
  }

  .theme-dark .variant{
    color:#a3acb8;
  }

  .itemPreorder{
    margin-top:6px;
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    align-items:center;
  }

  .itemPreorderBadge{
    display:inline-flex;
    align-items:center;
    padding:4px 8px;
    border-radius:999px;
    background:rgba(249,115,22,.12);
    border:1px solid rgba(249,115,22,.24);
    color:#9a3412;
    font-size:11px;
    font-weight:1000;
    letter-spacing:.03em;
  }

  .itemPreorderText{
    font-size:12px;
    line-height:1.45;
    color:#475569;
    font-weight:800;
  }

  .theme-dark .itemPreorderBadge{
    background:rgba(249,115,22,.16);
    border-color:rgba(249,115,22,.24);
    color:#fdba74;
  }

  .theme-dark .itemPreorderText{
    color:#cbd5e1;
  }

  .strongNum{
    font-weight:900;
  }

  .summary{
    display:grid;
    gap:6px;
    position:relative;
    z-index:1;
  }

  .summary > div{
    display:flex;
    justify-content:space-between;
    gap:12px;
    padding:6px 0;
    color:#0f172a;
  }

  .theme-dark .summary > div{
    color:#e6e7ea;
  }

  .summary .discountRow{
    color:#047857;
    font-weight:900;
  }

  .theme-dark .summary .discountRow{
    color:#86efac;
  }

  .summary .total{
    font-weight:900;
    border-top:1px dashed rgba(148,163,184,.8);
    margin-top:8px;
    padding-top:10px;
  }

  .theme-dark .summary .total{
    border-top-color:rgba(255,255,255,.18);
  }

  .bottomActions{
    display:flex;
    gap:10px;
    justify-content:flex-end;
    margin-top:16px;
    flex-wrap:wrap;
    position:relative;
    z-index:1;
  }

  @media (max-width: 720px){
    .container{
      padding:12px;
    }

    .receipt-card{
      padding:18px;
      border-radius:20px;
    }

    .dreamGrid{
      grid-template-columns:1fr;
    }

    .topActions,
    .bottomActions{
      width:100%;
    }

    .topActions .btn,
    .bottomActions .btn{
      width:100%;
    }
  }

  @media print{
    .topActions,
    .bottomActions,
    .receipt-kicker-row,
    .celeste-note{
      display:none;
    }

    .container{
      padding:0;
      max-width:none;
    }

    .receipt-card{
      border:0;
      box-shadow:none;
      border-radius:0;
      background:#fff;
    }

    .receipt-star{
      display:none;
    }

    .tableWrap{
      overflow:visible;
    }
  }

  @media (prefers-reduced-motion: reduce){
    .receipt-live-dot,
    .btn{
      animation:none;
      transition:none;
    }
  }
`;