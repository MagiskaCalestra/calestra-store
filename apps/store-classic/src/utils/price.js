// Valuta- & prisverktyg (källvaluta: SEK)

const DEFAULT_RATES = { SEK: 1, EUR: 0.089, USD: 0.095, TRY: 3.1 }; // justeras vid behov

export function normalizeCurrency(cur) {
  return (cur || "SEK").toUpperCase();
}

export function formatMoney(amount, currency = "SEK", locale) {
  const cur = normalizeCurrency(currency);
  const loc =
    locale ||
    (cur === "SEK" ? "sv-SE" :
     cur === "EUR" ? "de-DE" :
     cur === "USD" ? "en-US" : "sv-SE");
  try {
    return new Intl.NumberFormat(loc, { style: "currency", currency: cur, maximumFractionDigits: 2 }).format(amount || 0);
  } catch {
    return `${(amount || 0).toFixed(2)} ${cur}`;
  }
}

// Konverterar ett SEK-baspris till vald valuta
export function convertBasePrice(sek, currency = "SEK", rates = DEFAULT_RATES) {
  const cur = normalizeCurrency(currency);
  const rate = Number(rates?.[cur] ?? DEFAULT_RATES[cur] ?? 1);
  const x = Number(sek || 0) * rate;
  // avrunda till 2 decimals innan psykologisk prissättning
  return Math.round(x * 100) / 100;
}

// En enkel psykologisk prissättning (â€¦99 / â€¦95 etc.)
export function applyPsychological(amount, currency = "SEK") {
  const cur = normalizeCurrency(currency);
  let v = Number(amount || 0);
  if (v <= 0) return 0;

  // Valuta-specifika regler
  if (cur === "SEK" || cur === "NOK" || cur === "DKK") {
    // 299.00 -> 299.00 (hela kronor), 300.00 -> 299.00
    v = Math.floor(v);
    if (v >= 50) v = v - 1; // t.ex. 300 -> 299
    return v;
  }
  if (cur === "USD") {
    // $19.99 style
    const floored = Math.floor(v);
    return floored > 0 ? floored - 0.01 : v;
  }
  if (cur === "EUR") {
    // â‚¬19,95 style
    const floored = Math.floor(v);
    return floored > 0 ? floored - 0.05 : v;
  }
  // fallback: oförändrat
  return v;
}

// Ibland vill vi kunna â€œre-rundaâ€ efter psykologisk logik + 2 decimals
export function finalizePrice(amount) {
  return Math.round(Number(amount || 0) * 100) / 100;
}
