// apps/web/src/core/governance.js
// Styrelseläge för konserter m.m. – allt sparas lokalt så vi kan byta senare.
const LS_KEY = "calestra_governance_v1";

export const ConcertMode = Object.freeze({
  UNDECIDED: "undecided",       // inget beslut fattat
  INCLUDED: "included",          // ingår i parkentré (EPCOT-modell)
  NIGHT_TICKET: "night_ticket",  // fristående kvällsbiljett
  BOTH: "both",                  // båda varianterna parallellt
});

export const AlcoholPolicy = Object.freeze({
  NONE: "none",      // helt alkoholfritt
  ZONED: "zoned",    // endast i avskilda lounger/zoner
  LIMITED: "limited" // begränsad servering (tider/platser)
});

const DEFAULTS = {
  concerts: {
    mode: ConcertMode.UNDECIDED,
    alcoholPolicy: AlcoholPolicy.ZONED,
    diningPackageEnabled: true,      // “mat + reserverad zon”
    dreamCirclePerks: true,          // förköp/poängboost för medlemmar
  }
};

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; }
}
function save(cfg) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  return cfg;
}

export function getGovernance() {
  return load() || save(DEFAULTS);
}

export function setGovernance(patch) {
  const cur = getGovernance();
  return save({ ...cur, ...patch });
}

export function setConcerts(patch) {
  const cur = getGovernance();
  const next = { ...cur, concerts: { ...cur.concerts, ...patch } };
  return save(next);
}
