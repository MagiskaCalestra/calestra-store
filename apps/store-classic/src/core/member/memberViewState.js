// D:\WebProjects\Calestra\apps\store-classic\src\core\member\memberViewState.js
import {
  MEMBER_LS_KEYS,
  cleanString,
  readJsonLS,
  safeGetLS,
  readCustomerPrefill,
  readIdentityShell,
  persistIdentityShell,
} from "./memberMeta.js";

export const MEMBER_VIEW_LS_KEYS = {
  identity: MEMBER_LS_KEYS.identity,
  member: MEMBER_LS_KEYS.member,
  memberId: MEMBER_LS_KEYS.memberId,
  memberTier: MEMBER_LS_KEYS.memberTier,
  userId: MEMBER_LS_KEYS.userId,

  draftId: "cw.checkoutDraftId",
  checkoutDraft: "cw.checkoutDraft",
  checkoutDraftMirror: "cw.checkoutDraftSnapshot",
  checkoutDraftAlt: "cw.checkout.draft",

  savedCustomer: MEMBER_LS_KEYS.savedCustomer,
  savedShipping: MEMBER_LS_KEYS.savedShipping,
  savedBilling: MEMBER_LS_KEYS.savedBilling,
  checkoutPrefill: MEMBER_LS_KEYS.checkoutPrefill,

  memberControl: "cw.admin.member.control.v1",

  orders: "cw.orders",
  orderLast: "cw.order.last",
  orderCurrent: "cw.order.current",
};

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeOrderId(order) {
  return cleanString(order?.id || order?.orderId || order?.order_id || "", 180);
}

function uniqueOrders(list) {
  const out = [];
  const seen = new Set();

  for (const order of asArray(list)) {
    if (!order || typeof order !== "object") continue;

    const id = normalizeOrderId(order);
    const key = id || JSON.stringify(order).slice(0, 120);

    if (seen.has(key)) continue;
    seen.add(key);
    out.push(order);
  }

  return out;
}

function sortOrdersNewestFirst(list) {
  return asArray(list).slice().sort((a, b) => {
    const ta = new Date(a?.createdAt || a?.created_at || 0).getTime();
    const tb = new Date(b?.createdAt || b?.created_at || 0).getTime();
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });
}

function pickBestDraft() {
  const candidates = [
    readJsonLS(MEMBER_VIEW_LS_KEYS.checkoutDraft, null),
    readJsonLS(MEMBER_VIEW_LS_KEYS.checkoutDraftMirror, null),
    readJsonLS(MEMBER_VIEW_LS_KEYS.checkoutDraftAlt, null),
  ]
    .map(asObject)
    .filter((d) => Object.keys(d).length > 0);

  if (!candidates.length) return {};

  return candidates.sort((a, b) => {
    const ta = new Date(a?.updatedAt || a?.savedAt || a?.createdAt || 0).getTime();
    const tb = new Date(b?.updatedAt || b?.savedAt || b?.createdAt || 0).getTime();
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  })[0];
}

function normalizeAddress(raw, fallbackCountry = "SE") {
  const src = asObject(raw);

  return {
    company: cleanString(src.company || "", 160),
    careOf: cleanString(src.careOf || src.care_of || "", 160),
    address1: cleanString(src.address1 || src.address || src.line1 || "", 220),
    address2: cleanString(src.address2 || src.line2 || "", 220),
    doorCode: cleanString(src.doorCode || src.door_code || "", 80),
    zip: cleanString(src.zip || src.postcode || src.postalCode || src.postal_code || "", 40),
    city: cleanString(src.city || src.town || "", 120),
    country: cleanString(src.country || fallbackCountry || "SE", 20) || "SE",
    region: cleanString(src.region || src.state || src.county || "", 120),
    deliveryNotes: cleanString(src.deliveryNotes || src.delivery_notes || src.notes || "", 260),
    orgNumber: cleanString(src.orgNumber || src.org_number || "", 80),
    vatId: cleanString(src.vatId || src.vat_id || "", 80),
  };
}

export function normalizeMemberLabel(rawLabel) {
  const raw = cleanString(rawLabel || "", 80);
  if (!raw) return "Mitt Calestra";

  const lower = raw.toLowerCase();
  if (
    lower.includes("gäst") ||
    lower.includes("guest") ||
    lower.includes("snabbkassa") ||
    lower.includes("quick checkout")
  ) {
    return "Mitt Calestra";
  }

  return raw;
}

export function readControlConfig() {
  const raw = asObject(readJsonLS(MEMBER_VIEW_LS_KEYS.memberControl, null));

  return {
    enabled: raw.memberEntryEnabled !== false,
    label: normalizeMemberLabel(raw.memberEntryLabel || "Mitt Calestra"),
  };
}

export function ensureIdentityShellState() {
  const shell = readIdentityShell();
  const identity = asObject(shell.identity);
  const member = asObject(shell.member);

  persistIdentityShell({
    userId: shell.userId,
    memberId: shell.memberId,
    memberTier: shell.memberTier || member.memberTier || member.tier || "guest",
    name: identity.name || identity.fullName || member.name || "",
    email: identity.email || member.email || "",
    phone: identity.phone || member.phone || "",
  });

  const next = readIdentityShell();

  return {
    identity: asObject(readJsonLS(MEMBER_VIEW_LS_KEYS.identity, {})),
    member: asObject(readJsonLS(MEMBER_VIEW_LS_KEYS.member, {})),
    userId: cleanString(next.userId || "", 160),
    memberId: cleanString(next.memberId || "", 160),
    memberTier: cleanString(next.memberTier || "guest", 80) || "guest",
  };
}

export function readOrders() {
  const listOrders = asArray(readJsonLS(MEMBER_VIEW_LS_KEYS.orders, []));
  const lastOrder = asObject(readJsonLS(MEMBER_VIEW_LS_KEYS.orderLast, null));
  const currentOrder = asObject(readJsonLS(MEMBER_VIEW_LS_KEYS.orderCurrent, null));

  const merged = [
    ...listOrders,
    ...(normalizeOrderId(lastOrder) ? [lastOrder] : []),
    ...(normalizeOrderId(currentOrder) ? [currentOrder] : []),
  ];

  return sortOrdersNewestFirst(uniqueOrders(merged));
}

export function readSavedCustomer() {
  const fromPrefill = asObject(readCustomerPrefill());
  const saved = asObject(readJsonLS(MEMBER_VIEW_LS_KEYS.savedCustomer, null));
  const checkoutPrefill = asObject(readJsonLS(MEMBER_VIEW_LS_KEYS.checkoutPrefill, null));
  const draft = pickBestDraft();
  const draftCustomer = asObject(draft.customer);

  return {
    name: cleanString(
      fromPrefill.name || saved.name || checkoutPrefill.name || draftCustomer.name || "",
      160
    ),
    email: cleanString(
      fromPrefill.email || saved.email || checkoutPrefill.email || draftCustomer.email || draft.email || "",
      160
    ),
    phone: cleanString(
      fromPrefill.phone || saved.phone || checkoutPrefill.phone || draftCustomer.phone || "",
      80
    ),
  };
}

export function readSavedShipping() {
  const saved = readJsonLS(MEMBER_VIEW_LS_KEYS.savedShipping, null);
  const draft = pickBestDraft();

  return normalizeAddress(saved || draft.shipping || {}, "SE");
}

export function readSavedBilling() {
  const saved = readJsonLS(MEMBER_VIEW_LS_KEYS.savedBilling, null);
  const draft = pickBestDraft();

  return normalizeAddress(saved || draft.billing || {}, "SE");
}

export function readCheckoutDraftInfo() {
  const directDraft = pickBestDraft();
  const checkoutDraftId = safeGetLS(MEMBER_VIEW_LS_KEYS.draftId, "");

  return {
    draftId: cleanString(checkoutDraftId || directDraft.draftId || "", 160),
    updatedAt: cleanString(
      directDraft.updatedAt || directDraft.savedAt || directDraft.createdAt || "",
      64
    ),
    email: cleanString(directDraft.email || directDraft.customer?.email || "", 160),
    lastStep: cleanString(directDraft.lastStep || "", 120),
  };
}