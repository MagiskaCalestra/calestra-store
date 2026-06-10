// src/data/shipping.js

export const FREE_SHIPPING_BY_CURRENCY = {
  SEK: 500,
  EUR: 50,
  USD: 50,
  GBP: 45,
};

export const SHIPPING_FLAT_BY_CURRENCY = {
  SEK: 49,
  EUR: 4.9,
  USD: 5.9,
  GBP: 3.9,
};

// (valfritt) fraktalternativ om du vill låta kund välja
export const SHIPPING_METHODS = [
  { id: "std",  label: "Standard",   days: "2–5 dagar", add: 0 },
  { id: "exp",  label: "Express",    days: "1–2 dagar", add: 49 }, // SEK — konverteras i komponenten
  { id: "pick", label: "Upphämtning", days: "Samma dag", add: -49 },
];
