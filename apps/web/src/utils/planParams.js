// apps/web/src/utils/planParams.js
// Stabil util för att parsa/serialisera planeringsparametrar i URL.
// Parametrar (INTE översatta nycklar):
// - date (YYYY-MM-DD)
// - nights (int, default 1)
// - adults (int, default 2)
// - kids (int, default 0)
// - packageType ("standard" | "premium" | "lux")

const DEFAULTS = {
  date: "",          // tom = inget datum valt
  nights: 1,
  adults: 2,
  kids: 0,
  packageType: "standard",
};

export function getDefaults() {
  return { ...DEFAULTS };
}

export function parsePlanParams(search) {
  const p = new URLSearchParams(typeof search === "string" ? search : "");
  const out = { ...DEFAULTS };

  const date = p.get("date");
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) out.date = date;

  const nights = parseInt(p.get("nights"), 10);
  if (!Number.isNaN(nights) && nights > 0 && nights < 365) out.nights = nights;

  const adults = parseInt(p.get("adults"), 10);
  if (!Number.isNaN(adults) && adults >= 1 && adults <= 12) out.adults = adults;

  const kids = parseInt(p.get("kids"), 10);
  if (!Number.isNaN(kids) && kids >= 0 && kids <= 12) out.kids = kids;

  const pkg = p.get("packageType");
  if (pkg && ["standard", "premium", "lux"].includes(pkg)) out.packageType = pkg;

  return out;
}

export function stringifyPlanParams(params) {
  const p = new URLSearchParams();
  const q = { ...DEFAULTS, ...(params || {}) };

  if (q.date) p.set("date", q.date);
  p.set("nights", String(q.nights));
  p.set("adults", String(q.adults));
  p.set("kids", String(q.kids));
  p.set("packageType", q.packageType);

  // Stabil ordning för snygga URLs
  const ordered = ["date", "nights", "adults", "kids", "packageType"]
    .map((k) => (p.has(k) ? `${k}=${encodeURIComponent(p.get(k))}` : null))
    .filter(Boolean)
    .join("&");

  return ordered ? `?${ordered}` : "";
}
