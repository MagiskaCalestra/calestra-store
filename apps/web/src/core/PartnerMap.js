// Vilken querynyckel respektive nätverk/partner vill ha för vår ref?
// + ev. ytterligare queryfält vi vill skicka vidare (utm_*).
export const PartnerMap = {
  // Affiliate-nätverk
  awin:      { refKey: "clickref", passUtm: true },
  cj:        { refKey: "sid",      passUtm: true },
  impact:    { refKey: "sid",      passUtm: true },
  adtraction:{ refKey: "clickid",  passUtm: true },

  // Egna/övriga partners (Google, Temu etc.)
  google:    { refKey: "subid",    passUtm: true },
  temu:      { refKey: "subid",    passUtm: true },

  // fallback
  default:   { refKey: "subid",    passUtm: true },
};

export function resolvePartnerKey(name) {
  if (!name) return PartnerMap.default;
  const k = String(name).toLowerCase();
  return PartnerMap[k] || PartnerMap.default;
}
