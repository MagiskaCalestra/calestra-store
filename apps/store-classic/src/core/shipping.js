// Enkel, tydlig fraktmatris med trösklar per valuta.
// Bas: fri frakt över tröskel, annars fast fraktavgift.
export const SHIPPING_RULES = {
  SEK: { threshold: 50000, fee: 4900 }, // belopp i ören (500,00 kr / 49,00 kr)
  EUR: { threshold: 5000,  fee: 690 },  // 50,00 â‚¬ / 6,90 â‚¬
  USD: { threshold: 6000,  fee: 690 },  // $60.00 / $6.90
  TRY: { threshold: 350000, fee: 39900 }, // 3.500,00 â‚º / 399,00 â‚º
};

// Vissa varor kan vara digitala/support (ingen frakt).
export function isShippableItem(item) {
  // Om din produkt har flagga, respektera den.
  if (item.isDigital === true) return false;
  if (item.shipping === "none") return false;
  return true;
}

export function getShippingFee(subtotalCents, currency, items) {
  const rule = SHIPPING_RULES[currency] || SHIPPING_RULES.SEK;
  // Om alla items är odispatchbara (t.ex. digital/support) => 0 kr frakt.
  const anyShippable = Array.isArray(items) && items.some(isShippableItem);
  if (!anyShippable) return 0;

  if (subtotalCents >= rule.threshold) return 0;
  return rule.fee;
}

export function getFreeShippingLeft(subtotalCents, currency, items) {
  const rule = SHIPPING_RULES[currency] || SHIPPING_RULES.SEK;
  const anyShippable = Array.isArray(items) && items.some(isShippableItem);
  if (!anyShippable) return 0;
  return Math.max(0, rule.threshold - subtotalCents);
}
