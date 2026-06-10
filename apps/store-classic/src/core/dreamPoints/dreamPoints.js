// D:\WebProjects\Calestra\apps\store-classic\src\core\dreamPoints\dreamPoints.js

export const DREAMPOINTS_VERSION = "dreampoints_light_v1_2026-04-05";

export const DREAMPOINTS_STORAGE_KEY = "cw.dreampoints.light";
export const DREAMPOINTS_LEDGER_KEY = "cw.dreampoints.ledger.light";

export const DREAMPOINTS_RULES = {
  earnPer100Sek: 5,          // 5 poäng per 100 kr
  reviewBonus: 10,           // framtida användning
  newsletterBonus: 5,        // framtida användning
  founderBonus: 25,          // framtida användning
  birthdayBonus: 20,         // framtida användning
  redeemStepPoints: 100,     // 100 p = 10 kr
  redeemValueSek: 10,
  maxRedeemShare: 0.3,       // max 30% av order
};

function nowIso() {
  return new Date().toISOString();
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function createEmptyDreamPointsState() {
  return {
    version: DREAMPOINTS_VERSION,
    points: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    level: "starlight",
    updatedAt: nowIso(),
  };
}

export function createEmptyLedger() {
  return [];
}

export function readDreamPointsState() {
  if (typeof window === "undefined") return createEmptyDreamPointsState();

  const raw = window.localStorage.getItem(DREAMPOINTS_STORAGE_KEY);
  if (!raw) return createEmptyDreamPointsState();

  const parsed = safeJsonParse(raw, null);
  if (!parsed || typeof parsed !== "object") return createEmptyDreamPointsState();

  return {
    ...createEmptyDreamPointsState(),
    ...parsed,
    points: num(parsed.points, 0),
    lifetimeEarned: num(parsed.lifetimeEarned, 0),
    lifetimeRedeemed: num(parsed.lifetimeRedeemed, 0),
    updatedAt: parsed.updatedAt || nowIso(),
    level: parsed.level || computeLevel(num(parsed.points, 0)),
  };
}

export function writeDreamPointsState(state) {
  if (typeof window === "undefined") return state;

  const next = {
    ...createEmptyDreamPointsState(),
    ...state,
    points: Math.max(0, Math.round(num(state?.points, 0))),
    lifetimeEarned: Math.max(0, Math.round(num(state?.lifetimeEarned, 0))),
    lifetimeRedeemed: Math.max(0, Math.round(num(state?.lifetimeRedeemed, 0))),
    updatedAt: nowIso(),
  };

  next.level = computeLevel(next.points);

  window.localStorage.setItem(DREAMPOINTS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function readDreamPointsLedger() {
  if (typeof window === "undefined") return createEmptyLedger();

  const raw = window.localStorage.getItem(DREAMPOINTS_LEDGER_KEY);
  if (!raw) return createEmptyLedger();

  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : createEmptyLedger();
}

export function writeDreamPointsLedger(entries) {
  if (typeof window === "undefined") return entries;
  const safe = Array.isArray(entries) ? entries : [];
  window.localStorage.setItem(DREAMPOINTS_LEDGER_KEY, JSON.stringify(safe));
  return safe;
}

export function computeLevel(points) {
  const p = num(points, 0);

  if (p >= 1500) return "aurora";
  if (p >= 700) return "celestial";
  if (p >= 250) return "moonlight";
  return "starlight";
}

export function computePointsFromSek(amountSek) {
  const amount = Math.max(0, num(amountSek, 0));
  return Math.floor(amount / 100) * DREAMPOINTS_RULES.earnPer100Sek;
}

export function computeRedeemSekFromPoints(points) {
  const p = Math.max(0, num(points, 0));
  const steps = Math.floor(p / DREAMPOINTS_RULES.redeemStepPoints);
  return steps * DREAMPOINTS_RULES.redeemValueSek;
}

export function computeMaxRedeemSek(orderSubtotalSek) {
  const subtotal = Math.max(0, num(orderSubtotalSek, 0));
  return Math.floor(subtotal * DREAMPOINTS_RULES.maxRedeemShare);
}

export function computeAllowedRedeemSek(points, orderSubtotalSek) {
  const byPoints = computeRedeemSekFromPoints(points);
  const byOrder = computeMaxRedeemSek(orderSubtotalSek);
  return Math.max(0, Math.min(byPoints, byOrder));
}

export function computePointsCostForRedeemSek(redeemSek) {
  const sek = Math.max(0, num(redeemSek, 0));
  const steps = Math.floor(sek / DREAMPOINTS_RULES.redeemValueSek);
  return steps * DREAMPOINTS_RULES.redeemStepPoints;
}

export function addLedgerEntry(entry) {
  const ledger = readDreamPointsLedger();
  const next = [
    {
      id: cryptoLikeId(),
      type: entry?.type || "adjustment",
      pointsDelta: Math.round(num(entry?.pointsDelta, 0)),
      sekValue: Math.round(num(entry?.sekValue, 0)),
      orderId: entry?.orderId || "",
      note: entry?.note || "",
      createdAt: nowIso(),
    },
    ...ledger,
  ].slice(0, 100);

  writeDreamPointsLedger(next);
  return next;
}

export function awardDreamPoints({ amountSek = 0, orderId = "", note = "" } = {}) {
  const earned = computePointsFromSek(amountSek);
  const state = readDreamPointsState();

  const next = writeDreamPointsState({
    ...state,
    points: state.points + earned,
    lifetimeEarned: state.lifetimeEarned + earned,
  });

  addLedgerEntry({
    type: "earn",
    pointsDelta: earned,
    sekValue: Math.round(num(amountSek, 0)),
    orderId,
    note: note || `Earned from order`,
  });

  return {
    state: next,
    earned,
  };
}

export function redeemDreamPoints({ redeemSek = 0, orderSubtotalSek = 0, note = "" } = {}) {
  const state = readDreamPointsState();

  const allowedSek = computeAllowedRedeemSek(state.points, orderSubtotalSek);
  const normalizedRedeemSek = clamp(
    Math.floor(num(redeemSek, 0) / DREAMPOINTS_RULES.redeemValueSek) * DREAMPOINTS_RULES.redeemValueSek,
    0,
    allowedSek
  );

  const pointsCost = computePointsCostForRedeemSek(normalizedRedeemSek);

  const next = writeDreamPointsState({
    ...state,
    points: Math.max(0, state.points - pointsCost),
    lifetimeRedeemed: state.lifetimeRedeemed + pointsCost,
  });

  addLedgerEntry({
    type: "redeem",
    pointsDelta: -pointsCost,
    sekValue: normalizedRedeemSek,
    note: note || "Redeemed in cart",
  });

  return {
    state: next,
    redeemSek: normalizedRedeemSek,
    pointsCost,
  };
}

export function previewDreamPointsForCart(subtotalSek) {
  const state = readDreamPointsState();

  return {
    currentPoints: state.points,
    currentLevel: state.level,
    earnOnThisOrder: computePointsFromSek(subtotalSek),
    maxRedeemSek: computeAllowedRedeemSek(state.points, subtotalSek),
  };
}

export function resetDreamPointsLight() {
  const state = writeDreamPointsState(createEmptyDreamPointsState());
  const ledger = writeDreamPointsLedger(createEmptyLedger());
  return { state, ledger };
}

function cryptoLikeId() {
  const a = Math.random().toString(36).slice(2, 10);
  const b = Date.now().toString(36);
  return `dp_${b}_${a}`;
}