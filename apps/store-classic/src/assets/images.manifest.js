// apps/store-classic/src/assets/images.manifest.js
// Allt under /public nås som absolut URL (t.ex. /hero/xxx.png).
// Här listar vi kategorier -> bilder. Lägg till/ta bort rader fritt.

export const IMG = {
  hero: [
    "/hero/star-above-sea-001.png",
  ],
  support: [
    "/support/journey-light-path-001.png",
    "/support/journey-light-path-002.png",
    "/support/gift-light-001.png",
    "/support/gift-light-002.png",
  ],
  portals: [
    "/portals/portal-glow-entrance-001.png",
    "/portals/portal-glow-entrance-002.png",
    "/portals/portal-silhouette-001.png",
    "/portals/portal-silhouette-002.png",
    "/portals/portal-hope-001.png",
    "/portals/portal-hope-002.png",
    "/portals/portal-hope-003.png",
    "/portals/portal-hope-004.png",
    "/portals/portal-hope-005.png",
    "/portals/portal-night-001.png",
    "/portals/portal-night-002.png",
    "/portals/portal-night-003.png",
  ],
  castle: [
    "/castle/castle-light-001.png",
    "/castle/castle-light-002.png",
    "/castle/castle-night-001.png",
    "/castle/castle-night-002.png",
    "/castle/castle-night-003.png",
    "/castle/castle-night-004.png",
    "/castle/castle-dream-001.png",
    "/castle/castle-dream-002.png",
    "/castle/castle-horizon-001.png",
    "/castle/castle-horizon-002.png",
  ],
  product: [
    "/product/product-glow-display-001.png",
    "/product/product-glow-display-002.png",
    "/product/shop-magic-door-001.png",
    "/product/shop-magic-door-002.png",
  ],
  collection: [
    "/collection/star-collection-001.png",
    "/collection/star-collection-002.png",
    "/collection/star-rise-001.png",
    "/collection/star-rise-002.png",
  ],
};

// Hjälpare
export function pick(arr, i = 0) {
  if (!arr?.length) return "";
  if (i === "random") return arr[Math.floor(Math.random() * arr.length)];
  return arr[Math.max(0, Math.min(arr.length - 1, Number(i) || 0))];
}

export const CATEGORIES = Object.keys(IMG);