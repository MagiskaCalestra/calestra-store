// apps/web/src/core/ccore/modules/dreamcircle.js
// Calestra DreamCircle™ — Medlemskap (C-Pass), nivåer och poäng. Lokal mock + event-hooks.
import { emit, on } from "../eventBus";

const LS_DC = "ccore_dreamcircle_v1";

const TIERS = [
  { id: "free",     name: "DreamCircle Free",     min: 0,     perks: ["C-Pass ID", "Grundläggande erbjudanden"] },
  { id: "silver",   name: "DreamCircle Silver",   min: 1000,  perks: ["Prioritetstips", "Små bonusar i appen"] },
  { id: "gold",     name: "DreamCircle Gold",     min: 5000,  perks: ["VIP-köer (utvalda)", "Lounge (utvalda)"] },
  { id: "luminary", name: "DreamCircle Luminary", min: 20000, perks: ["Concierge of Light", "Inbjudna evenemang"] },
];

// 1 poäng / 10 SEK (mock—kan styras via Rule Engine senare)
const POINTS_PER_SEK = 0.1;

function uid() { return Math.random().toString(36).slice(2, 10); }

function load() {
  try { return JSON.parse(localStorage.getItem(LS_DC) || "null"); } catch { return null; }
}
function save(state) {
  localStorage.setItem(LS_DC, JSON.stringify(state));
  emit("dreamcircle.updated", { state });
  return state;
}

function defaultState() {
  return {
    cpassId: "CP-" + uid().toUpperCase(),
    points: 0,
    tierId: "free",
    createdAt: new Date().toISOString(),
    // historik för transparens
    history: [], // {id, kind, delta, note, at}
  };
}

export function getState() {
  return load() || save(defaultState());
}

export function reset() {
  return save(defaultState());
}

function tierFor(points) {
  let cur = TIERS[0];
  for (const t of TIERS) if (points >= t.min) cur = t;
  return cur.id;
}

export function getTiers() { return TIERS.slice(); }

export function addPoints(delta, note = "") {
  if (!delta || isNaN(delta)) return getState();
  const s = getState();
  const before = s.points;
  s.points = Math.max(0, Math.round(before + delta));
  s.tierId = tierFor(s.points);
  s.history.push({ id: "h_"+uid(), kind: "manual", delta: Math.round(delta), note, at: new Date().toISOString() });
  return save(s);
}

export function earnForOrder({ amount, currency = "SEK", orderId }) {
  const pts = Math.round((Number(amount) || 0) * POINTS_PER_SEK);
  const s = getState();
  const before = s.points;
  s.points = Math.max(0, before + pts);
  s.tierId = tierFor(s.points);
  s.history.push({
    id: "h_"+uid(),
    kind: "order",
    delta: pts,
    note: `Order ${orderId || "-"} · ${amount} ${currency} → +${pts}p`,
    at: new Date().toISOString()
  });
  return save(s);
}

export function earnForWishActivation() {
  const pts = 50; // litet “band-aktivt” bonus
  const s = getState();
  s.points += pts;
  s.tierId = tierFor(s.points);
  s.history.push({ id: "h_"+uid(), kind: "wish", delta: pts, note: "C-Wish band aktiverat", at: new Date().toISOString() });
  return save(s);
}

// Lyssna på systemhändelser och ge poäng (mock)
let _autoBound = false;
export function initAutoEarn() {
  if (_autoBound) return;
  _autoBound = true;

  // När en order skapas -> ge poäng
  on("booking.order.created", ({ order }) => {
    try { earnForOrder({ amount: order.amount, currency: order.currency, orderId: order.id }); } catch {}
  });

  // När C-Wish aktiveras -> litet bonus
  on("wish.band.activated", () => {
    try { earnForWishActivation(); } catch {}
  });
}

export function getProgress() {
  const s = getState();
  const tier = TIERS.find(t => t.id === s.tierId) || TIERS[0];
  const next = TIERS.find(t => t.min > tier.min) || null;
  const toNext = next ? Math.max(0, next.min - s.points) : 0;
  const pct = next ? Math.min(100, Math.round(((s.points - tier.min) / (next.min - tier.min)) * 100)) : 100;
  return { tier, next, toNext, pct, points: s.points, cpassId: s.cpassId };
}
