import dotenv from "dotenv";
dotenv.config();

let RATES = {};
try {
  RATES = JSON.parse(process.env.RATES_JSON || "{}");
} catch { RATES = { SEK: 1 }; }

export function getRates() { return RATES; }

export function toSEK(value, currency, rates = RATES) {
  const r = Number(rates[currency] || 1);
  if (r === 0) return Number(value || 0);
  // value is in "currency", convert to SEK
  return Number(value || 0) / r;
}

export function fromSEK(valueSEK, currency, rates = RATES) {
  const r = Number(rates[currency] || 1);
  return Number(valueSEK || 0) * r;
}
