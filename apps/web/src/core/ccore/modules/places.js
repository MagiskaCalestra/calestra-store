// Katalog över platser/upplevelser (mock/seed i localStorage + fallback till inbyggd seed).
// Typer: "attraction", "ride", "restaurant", "cafe", "shop", "show".
// API: listParks, listPlaces, getPlace, upsertPlace (admin), removePlace (admin), seedIfEmpty.

const LS_PLACES = "ccore_places_seed_v1";

function uid() { return Math.random().toString(36).slice(2,10); }

const SEED = {
  parks: [
    { id: "gateway", name: "Gateway", order: 1 },
    { id: "star-dunes", name: "Star Dunes", order: 2 },
    { id: "crystal-hall", name: "Crystal Hall", order: 3 },
    { id: "realms-gate", name: "Realms Gate", order: 4 },
  ],
  places: [
    { id: "rg_portal", parkId: "realms-gate", type: "attraction", name: "Realms Portal", tags:["iconic","family"], brief:"Porten mellan världar.", rating: 4.7 },
    { id: "rg_brasserie", parkId: "realms-gate", type: "restaurant", name: "RG Brasserie", tags:["dinner","premium"], brief:"Signaturkök vid porten.", rating: 4.5 },
    { id: "sd_comet", parkId: "star-dunes", type: "ride", name: "Comet Run", tags:["thrill"], brief:"Hög hastighet över dyner.", rating: 4.6 },
    { id: "sd_cafe_aurora", parkId: "star-dunes", type: "cafe", name: "Aurora CafÃ©", tags:["coffee","sweets"], brief:"Bakverk under stjärnhimmel.", rating: 4.2 },
    { id: "ch_crystals", parkId: "crystal-hall", type: "show", name: "Crystals of Light", tags:["evening","music"], brief:"Ljus & musik i hallens hjärta.", rating: 4.4 },
    { id: "gw_starter", parkId: "gateway", type: "shop", name: "Gateway Gifts", tags:["merch"], brief:"Starta resan med minnen.", rating: 4.1 },
  ]
};

function load() {
  try {
    const s = localStorage.getItem(LS_PLACES);
    if (!s) return null;
    return JSON.parse(s);
  } catch { return null; }
}
function save(db) {
  localStorage.setItem(LS_PLACES, JSON.stringify(db));
  return db;
}

export function seedIfEmpty() {
  const db = load();
  if (!db || !Array.isArray(db.places) || !Array.isArray(db.parks)) {
    save(SEED);
    return true;
  }
  return false;
}

export function listParks() {
  const db = load() || SEED;
  return db.parks.slice().sort((a,b)=> (a.order||0)-(b.order||0));
}

export function listPlaces({ type, parkId, query, tags } = {}) {
  const db = load() || SEED;
  let out = db.places.slice();

  if (type) out = out.filter(p => p.type === type);
  if (parkId) out = out.filter(p => p.parkId === parkId);
  if (Array.isArray(tags) && tags.length) out = out.filter(p => (p.tags||[]).some(t => tags.includes(t)));
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    out = out.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brief||"").toLowerCase().includes(q) ||
      (p.tags||[]).some(t => t.toLowerCase().includes(q))
    );
  }
  return out.sort((a,b)=> (b.rating||0) - (a.rating||0));
}

export function getPlace(id) {
  const db = load() || SEED;
  return db.places.find(p => p.id === id) || null;
}

// Admin helpers
export function upsertPlace(place) {
  const db = load() || SEED;
  const p = { ...place };
  if (!p.id) p.id = `pl_${uid()}`;
  const i = db.places.findIndex(x => x.id === p.id);
  if (i === -1) db.places.push(p); else db.places[i] = p;
  save(db);
  return p;
}

export function removePlace(id) {
  const db = load() || SEED;
  const next = db.places.filter(p => p.id !== id);
  save({ ...db, places: next });
  return next.length !== db.places.length;
}
