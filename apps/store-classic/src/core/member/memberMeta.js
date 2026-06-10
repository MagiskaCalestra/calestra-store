// D:\WebProjects\Calestra\apps\store-classic\src\core\member\memberMeta.js

export const MEMBER_LS_KEYS = {
  identity: "cw.identity",
  member: "cw.member",
  userId: "cw.userId",
  memberId: "cw.memberId",
  memberTier: "cw.memberTier",

  savedCustomer: "cw.member.profile.customer",
  savedShipping: "cw.member.profile.shipping",
  savedBilling: "cw.member.profile.billing",
  checkoutPrefill: "cw.checkout.prefill",

  campaignId: "cw.campaignId",
  creatorId: "cw.creatorId",
  affiliateId: "cw.affiliateId",
  associateId: "cw.associateId",
  associateCode: "cw.associateCode",
  sourceChannel: "cw.sourceChannel",
  entryPoint: "cw.entryPoint",

  memberControl: "cw.member.control.v1",
};

const VALID_TIERS = new Set(["guest", "starlight", "moonlight", "aurora", "celestial"]);

export function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

export function normalizeEmail(email) {
  return cleanString(email, 320).toLowerCase();
}

export function safeJsonParse(raw, fallback = null) {
  try {
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function safeGetLS(key, fallback = "") {
  try {
    if (typeof window === "undefined") return fallback;
    const value = window.localStorage.getItem(key);
    return value == null ? fallback : String(value);
  } catch {
    return fallback;
  }
}

export function safeSetLS(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, String(value ?? ""));
  } catch {}
}

export function safeRemoveLS(key) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch {}
}

export function readJsonLS(key, fallback = null) {
  return safeJsonParse(safeGetLS(key, ""), fallback);
}

export function writeJsonLS(key, value) {
  safeSetLS(key, JSON.stringify(value));
}

export function createLocalId(prefix = "cw") {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {}

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeMemberTier(value, fallback = "guest") {
  const tier = cleanString(value || fallback, 80).toLowerCase();
  if (!tier) return fallback;
  return VALID_TIERS.has(tier) ? tier : fallback;
}

export function getOrCreateUserId() {
  const identity = readJsonLS(MEMBER_LS_KEYS.identity, {}) || {};
  const existing = cleanString(
    safeGetLS(MEMBER_LS_KEYS.userId, "") || identity.userId || identity.id || "",
    160
  );

  if (existing) {
    safeSetLS(MEMBER_LS_KEYS.userId, existing);
    return existing;
  }

  const next = createLocalId("user");
  safeSetLS(MEMBER_LS_KEYS.userId, next);
  return next;
}

export function readCustomerPrefill() {
  const prefill = readJsonLS(MEMBER_LS_KEYS.checkoutPrefill, {}) || {};
  const savedCustomer = readJsonLS(MEMBER_LS_KEYS.savedCustomer, {}) || {};
  const identity = readJsonLS(MEMBER_LS_KEYS.identity, {}) || {};
  const member = readJsonLS(MEMBER_LS_KEYS.member, {}) || {};

  return {
    name: cleanString(
      prefill.name ||
        savedCustomer.name ||
        identity.name ||
        identity.fullName ||
        member.name ||
        "",
      160
    ),
    email: normalizeEmail(
      prefill.email || savedCustomer.email || identity.email || member.email || ""
    ),
    phone: cleanString(
      prefill.phone || savedCustomer.phone || identity.phone || member.phone || "",
      80
    ),
  };
}

export function writeCustomerPrefill(input = {}) {
  const payload = {
    name: cleanString(input.name, 160),
    email: normalizeEmail(input.email),
    phone: cleanString(input.phone, 80),
    updatedAt: new Date().toISOString(),
  };

  writeJsonLS(MEMBER_LS_KEYS.checkoutPrefill, payload);
  writeJsonLS(MEMBER_LS_KEYS.savedCustomer, payload);
  return payload;
}

export function readIdentityShell() {
  const identity = readJsonLS(MEMBER_LS_KEYS.identity, {}) || {};
  const member = readJsonLS(MEMBER_LS_KEYS.member, {}) || {};

  const userId =
    cleanString(identity.userId || identity.id || safeGetLS(MEMBER_LS_KEYS.userId, ""), 160) ||
    getOrCreateUserId();

  const memberId = cleanString(
    member.memberId || member.id || safeGetLS(MEMBER_LS_KEYS.memberId, ""),
    160
  );

  const rawTier =
    member.memberTier ||
    member.tier ||
    safeGetLS(MEMBER_LS_KEYS.memberTier, memberId ? "starlight" : "guest");

  const memberTier = memberId
    ? normalizeMemberTier(rawTier, "starlight")
    : "guest";

  return {
    userId,
    memberId,
    memberTier,
    identity,
    member,
  };
}

export function persistIdentityShell(next = {}) {
  const currentIdentity = readJsonLS(MEMBER_LS_KEYS.identity, {}) || {};
  const currentMember = readJsonLS(MEMBER_LS_KEYS.member, {}) || {};
  const wantsClearMember = next.memberId === "";

  const userId =
    cleanString(next.userId || currentIdentity.userId || currentIdentity.id || "", 160) ||
    getOrCreateUserId();

  const memberId = wantsClearMember
    ? ""
    : cleanString(next.memberId || next.id || currentMember.memberId || currentMember.id || "", 160);

  const memberTier = memberId
    ? normalizeMemberTier(
        next.memberTier || next.tier || currentMember.memberTier || currentMember.tier || "starlight",
        "starlight"
      )
    : "guest";

  const nextName = cleanString(
    next.name ?? next.fullName ?? currentIdentity.name ?? currentIdentity.fullName ?? "",
    160
  );

  const identityPayload = {
    ...currentIdentity,
    userId,
    id: currentIdentity.id || userId,
    name: nextName,
    fullName: nextName,
    email: normalizeEmail(next.email ?? currentIdentity.email ?? ""),
    phone: cleanString(next.phone ?? currentIdentity.phone ?? "", 80),
    updatedAt: new Date().toISOString(),
  };

  writeJsonLS(MEMBER_LS_KEYS.identity, identityPayload);
  safeSetLS(MEMBER_LS_KEYS.userId, userId);

  if (!memberId) {
    safeRemoveLS(MEMBER_LS_KEYS.memberId);
    safeSetLS(MEMBER_LS_KEYS.memberTier, "guest");

    return {
      userId,
      memberId: "",
      memberTier: "guest",
      identity: identityPayload,
      member: readJsonLS(MEMBER_LS_KEYS.member, {}) || {},
    };
  }

  const memberPayload = {
    ...currentMember,
    memberId,
    id: memberId,
    name: cleanString(next.name ?? currentMember.name ?? identityPayload.name ?? "", 160),
    email: normalizeEmail(next.email ?? currentMember.email ?? identityPayload.email ?? ""),
    phone: cleanString(next.phone ?? currentMember.phone ?? identityPayload.phone ?? "", 80),
    memberTier,
    tier: memberTier,
    updatedAt: new Date().toISOString(),
  };

  writeJsonLS(MEMBER_LS_KEYS.member, memberPayload);
  safeSetLS(MEMBER_LS_KEYS.memberId, memberId);
  safeSetLS(MEMBER_LS_KEYS.memberTier, memberTier);

  return {
    userId,
    memberId,
    memberTier,
    identity: identityPayload,
    member: memberPayload,
  };
}

export function readCoreMetaFromLS() {
  const shell = readIdentityShell();

  return {
    userId: cleanString(shell.userId, 160),
    memberId: cleanString(shell.memberId, 160),
    memberTier: normalizeMemberTier(shell.memberTier || "guest", "guest"),
    campaignId: cleanString(safeGetLS(MEMBER_LS_KEYS.campaignId, ""), 160),
    creatorId: cleanString(safeGetLS(MEMBER_LS_KEYS.creatorId, ""), 160),
    affiliateId: cleanString(safeGetLS(MEMBER_LS_KEYS.affiliateId, ""), 160),
    associateId: cleanString(safeGetLS(MEMBER_LS_KEYS.associateId, ""), 160),
    associateCode: cleanString(safeGetLS(MEMBER_LS_KEYS.associateCode, ""), 160),
    sourceChannel: cleanString(safeGetLS(MEMBER_LS_KEYS.sourceChannel, "store"), 120) || "store",
    entryPoint: cleanString(safeGetLS(MEMBER_LS_KEYS.entryPoint, "store"), 160) || "store",
  };
}

export function syncCoreMetaFromSearchParams(searchParams) {
  if (!searchParams || typeof searchParams.get !== "function") {
    return readCoreMetaFromLS();
  }

  const mappings = [
    [["campaign", "campaign_id"], MEMBER_LS_KEYS.campaignId],
    [["creator", "creator_id"], MEMBER_LS_KEYS.creatorId],
    [["affiliate", "affiliate_id", "aff", "ref"], MEMBER_LS_KEYS.affiliateId],
    [["associate", "associate_id"], MEMBER_LS_KEYS.associateId],
    [["associate_code", "code"], MEMBER_LS_KEYS.associateCode],
    [["member_id"], MEMBER_LS_KEYS.memberId],
    [["member_tier", "tier"], MEMBER_LS_KEYS.memberTier],
    [["source", "source_channel", "channel"], MEMBER_LS_KEYS.sourceChannel],
    [["entry", "entry_point"], MEMBER_LS_KEYS.entryPoint],
  ];

  for (const [params, lsKey] of mappings) {
    for (const param of params) {
      const value = cleanString(searchParams.get(param) || "", 160);
      if (value) {
        safeSetLS(lsKey, value);
        break;
      }
    }
  }

  return readCoreMetaFromLS();
}