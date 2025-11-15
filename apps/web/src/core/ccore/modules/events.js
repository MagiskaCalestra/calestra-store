// apps/web/src/core/ccore/modules/events.js
// Konserter (C-Live) â€“ mockdatabas + policyintegration
import { getGovernance, AlcoholPolicy, ConcertMode } from "../../governance";

const LS_EVENTS = "ccore_events_seed_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(LS_EVENTS) || "null"); } catch { return null; }
}
function save(db) { localStorage.setItem(LS_EVENTS, JSON.stringify(db)); return db; }

const SEED = {
  venues: [
    { id:"rg_stage", parkId:"realms-gate", name:"Realms Gate Stage" },
    { id:"sd_arena", parkId:"star-dunes",  name:"Star Dunes Arena" },
  ],
  concerts: [
    {
      id:"c_live_aurora",
      title:"Aurora Echoes",
      venueId:"sd_arena",
      date:"2026-06-15",
      time:"20:00",
      durationMin:75,
      artist:"LYRA & Ensemble",
      tags:["family","lightshow"],
      hero:"#", // byt till bild när du har
      capacity: 3500,
      // prisnivåer (vi använder dessa som display â€“ availability är mock)
      pricing: [
        { kind:"included", amount:0, currency:"SEK" },  // om mode = INCLUDED/BOTH
        { kind:"night", amount:295, currency:"SEK" },   // om mode = NIGHT_TICKET/BOTH
        { kind:"dining", amount:695, currency:"SEK" },  // dining package
      ],
    },
    {
      id:"c_live_crystal",
      title:"Crystal Resonance",
      venueId:"rg_stage",
      date:"2026-07-01",
      time:"21:00",
      durationMin:60,
      artist:"Felix Vindsilver",
      tags:["evening","premium"],
      hero:"#",
      capacity: 2800,
      pricing: [
        { kind:"included", amount:0, currency:"SEK" },
        { kind:"night", amount:350, currency:"SEK" },
        { kind:"dining", amount:790, currency:"SEK" },
      ],
    }
  ]
};

export function seedIfEmpty() {
  const db = load();
  if (!db || !Array.isArray(db.concerts)) {
    save(SEED);
    return true;
  }
  return false;
}

function db() { return load() || SEED; }

export function listConcerts({ query } = {}) {
  seedIfEmpty();
  const cfg = getGovernance();
  let out = db().concerts.slice();
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    out = out.filter(c => c.title.toLowerCase().includes(q) || (c.artist||"").toLowerCase().includes(q));
  }
  // lägg på policy-info för UI
  return out.map(c => withPolicy(c, cfg));
}

export function getConcert(id) {
  seedIfEmpty();
  const cfg = getGovernance();
  const c = db().concerts.find(x=>x.id===id) || null;
  return c ? withPolicy(c, cfg) : null;
}

export function getVenue(venueId) {
  seedIfEmpty();
  return db().venues.find(v=>v.id===venueId) || null;
}

function withPolicy(c, cfg) {
  const { concerts } = cfg;
  // bestäm vilka prisnivåer som är relevanta
  const mode = concerts.mode;
  const prices = c.pricing.filter(p => {
    if (p.kind === "included") return mode === ConcertMode.INCLUDED || mode === ConcertMode.BOTH;
    if (p.kind === "night")    return mode === ConcertMode.NIGHT_TICKET || mode === ConcertMode.BOTH;
    if (p.kind === "dining")   return concerts.diningPackageEnabled;
    return false;
  });
  return {
    ...c,
    policy: {
      mode,
      alcoholPolicy: concerts.alcoholPolicy,
      diningPackageEnabled: concerts.diningPackageEnabled,
      dreamCirclePerks: concerts.dreamCirclePerks
    },
    prices
  };
}

export function availabilityMock(concertId) {
  // enkel mock: slump inom kapacitet
  const c = getConcert(concertId);
  if (!c) return { status:"unknown", left:0 };
  const left = Math.max(0, Math.floor(c.capacity - (c.capacity * ((concertId.charCodeAt(2)%40)/100))));
  let status = "green";
  if (left < c.capacity*0.15) status = "red";
  else if (left < c.capacity*0.4) status = "yellow";
  return { status, left };
}
