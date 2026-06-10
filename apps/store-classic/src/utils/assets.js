// Normaliserar bildvägar så allt under /public och /public/images funkar.
// Använd: normalizeAsset('/images/foo.jpg') eller normalizeAsset('images/foo.jpg')
export function normalizeAsset(p) {
  if (!p) return "/images/no-image.png";
  // Ta bort ev. public-prefix
  let s = String(p).trim().replace(/^\/?public\//i, "");
  // Lägg till ledande slash
  if (!s.startsWith("/")) s = `/${s}`;
  return s;
}
