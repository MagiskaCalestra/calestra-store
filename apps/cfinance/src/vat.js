import dotenv from "dotenv";
dotenv.config();

let VAT = {};
try { VAT = JSON.parse(process.env.VAT_JSON || "{}"); } catch { VAT = { SE: 0.25 }; }

export function vatRateForCountry(countryCode) {
  const c = String(countryCode || "SE").toUpperCase();
  return Number(VAT[c] ?? VAT["SE"] ?? 0.25);
}
