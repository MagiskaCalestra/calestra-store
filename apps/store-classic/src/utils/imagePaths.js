// Normaliserar och bygger absoluta bild-URL:er på ett robust sätt.

const PLACEHOLDER = "/images/sets/black-star-collection-001-promo.jpg";

const ALIASES = [
  { pattern: /\/t[-_ ]?shirts?\b/gi, replace: "/tee" },
  { pattern: /\/tees?\b/gi,        replace: "/tee" },
  { pattern: /\/bags?\b/gi,        replace: "/tote" },
  { pattern: /\/cups?\b/gi,        replace: "/mug"  },
  { pattern: /\/set\b/gi,          replace: "/sets" },
];

export function fixImagePath(input) {
  let p = String(input || "");

  // Tomt â†’ placeholder
  if (!p.trim()) return PLACEHOLDER;

  // Backslashes â†’ slashes
  p = p.replaceAll("\\", "/");

  // Prefixa /images om det saknas (public/ tjänar filer från rot)
  if (!p.startsWith("/")) {
    p = p.startsWith("images/") ? `/${p}` : `/images/${p}`;
  }

  // Map:a felkataloger till våra riktiga
  for (const { pattern, replace } of ALIASES) p = p.replace(pattern, replace);

  // Ta bort dublett-slashar
  p = p.replace(/\/{2,}/g, "/");

  // Lägg .jpg om inget bildformat finns
  if (!/\.(png|jpe?g|webp|svg)$/i.test(p)) p = `${p}.jpg`;

  return p;
}

export function absUrl(pathLike) {
  const fixed = fixImagePath(pathLike);
  return `${window.location.origin}${fixed}`;
}

export function fixProductImages(product) {
  if (!product) return product;
  const images = Array.isArray(product.images)
    ? product.images.map(img => ({ ...img, image: fixImagePath(img?.image) }))
    : product.images;

  return { ...product, images };
}

export const PLACEHOLDER_IMAGE = PLACEHOLDER;
