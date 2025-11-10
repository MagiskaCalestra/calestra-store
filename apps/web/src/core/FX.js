// Enkel valutamotor med cache + formateringshjälp.

const FX_KEY = "cw.fx.v1";
const MAX_AGE_HOURS = 12;

function readJSON(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function writeJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function ageHours(iso) { if (!iso) return Infinity; return (Date.now() - Date.parse(iso)) / 36e5; }

const FALLBACK = {
  ts: new Date().toISOString(),
  base: "SEK",
  rates: { EUR: 0.088, USD: 0.094, TRY: 3.00 },
};

export function getFX() { return readJSON(FX_KEY) || FALLBACK; }

export async function ensureFreshFX() {
  const cur = getFX();
  if (ageHours(cur.ts) < MAX_AGE_HOURS) return cur;
  try {
    const url = "https://api.exchangerate.host/latest?base=SEK&symbols=EUR,USD,TRY";
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      if (j && j.rates) {
        const next = { ts: new Date().toISOString(), base: "SEK", rates: j.rates };
        writeJSON(FX_KEY, next);
        return next;
      }
    }
  } catch {}
  if (!readJSON(FX_KEY)) writeJSON(FX_KEY, FALLBACK);
  return getFX();
}

export function fxTo(amount, from = "SEK", to = "SEK") {
  const n = Number(amount);
  if (!isFinite(n)) throw new Error("fxTo: amount måste vara numeriskt");
  if (from === to) return n;

  const r = getFX().rates || {};
  const sekTo = (ccy) => { if (ccy === "SEK") return 1; const rate = r[ccy]; if (!rate) throw new Error(`saknar kurs SEK->${ccy}`); return rate; };
  const toSek = (ccy)  => { if (ccy === "SEK") return 1; const rate = r[ccy]; if (!rate) throw new Error(`saknar kurs SEK->${ccy}`); return 1 / rate; };

  if (from === "SEK") return n * sekTo(to);
  if (to   === "SEK") return n * toSek(from);
  return (n * toSek(from)) * sekTo(to);
}

/* ---------- formattering helpers ---------- */
export function fmtMoneySEK(n) {
  return Number(n || 0).toLocaleString("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 });
}
export function fmtMoneyCCY(n, ccy = "SEK") {
  return Number(n || 0).toLocaleString("sv-SE", { style: "currency", currency: ccy, maximumFractionDigits: 0 });
}
