// Kan senare hämtas från CMS; nu statiskt + override via localStorage.
const KEY = "cw.partner.catalog";

const DEFAULTS = [
  {
    id: "google",
    title: "Google â€“ Annonsytor",
    desc: "Strategiska ytor i portalen.",
    url: "https://ads.google.com/",
    partnerKey: "google",
    badge: "Partner",
    cta: "Gå till Google"
  },
  {
    id: "temu",
    title: "Temu â€“ Kampanjer",
    desc: "Externa deals under uppbyggnaden.",
    url: "https://www.temu.com/",
    partnerKey: "temu",
    badge: "Partner",
    cta: "Gå till Temu"
  }
];

export function loadPartnerCatalog() {
  try { return JSON.parse(localStorage.getItem(KEY)) || DEFAULTS; } catch { return DEFAULTS; }
}
export function savePartnerCatalog(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list||[])); } catch {}
}
