// Enkel valutamodul med psykologisk prissättning & inflationsjustering per land.
// Justera rates/inflation/psychRules efter behov.

export const CURRENCIES = {
  SEK: { symbol: "kr", locale: "sv-SE" },
  EUR: { symbol: "â‚¬", locale: "de-DE" },
  USD: { symbol: "$", locale: "en-US" },
  TRY: { symbol: "â‚º", locale: "tr-TR" },
};

const baseRates = {
  SEK: 1,      // Basvaluta
  EUR: 0.087,  // exempel
  USD: 0.093,
  TRY: 3.0,
};

// Inflation/konjunkturjustering (multipliceras med rate)
const inflation = {
  SEK: 1.00,
  EUR: 1.02,
  USD: 1.03,
  TRY: 1.08,
};

// Psykologiska regler per land/valuta
// "99" => 0,99 / "95" => 0,95
const psychRules = {
  SEK: "99",
  EUR: "99",
  USD: "99",
  TRY: "95",
};

export function convertBasePrice(baseSek, currency) {
  const rate = (baseRates[currency] ?? 1) * (inflation[currency] ?? 1);
  return baseSek * rate;
}

export function applyPsychological(price, currency) {
  const mode = psychRules[currency] ?? "99";
  const int = Math.floor(price);
  return parseFloat(`${int}.${mode}`); // t.ex. 299.99
}

export function formatPrice(amount, currency = "SEK") {
  const meta = CURRENCIES[currency] ?? CURRENCIES.SEK;
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Fri frakt-gräns per valuta (kan tweakas)
export const FREE_SHIPPING = {
  SEK: 600,
  EUR: 60,
  USD: 65,
  TRY: 1500,
};
