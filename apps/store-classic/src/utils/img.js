// apps/store-classic/src/utils/img.js

const assets = import.meta.glob("../assets/**/*.{png,jpg,jpeg,gif,webp,avif,svg}", {
  eager: true,
  query: "?url",
});

function normKey(p) {
  return String(p || "")
    .trim()
    .replace(/^\.?\//, "")
    .replace(/^public\//, "")
    .toLowerCase();
}

export function getImgUrl(input) {
  if (!input) return "";

  const raw = String(input).trim();

  // Låt externa och absoluta vägar vara ifred
  if (/^https?:\/\//i.test(raw) || raw.startsWith("//")) return raw;
  if (raw.startsWith("/")) return raw; // t.ex. /images/x.jpg

  // Först: försök matcha exakt relativ sökväg i src/assets
  const relKey = normKey(raw);
  for (const k in assets) {
    const file = k.toLowerCase(); // ../assets/...
    if (file.endsWith("/" + relKey)) {
      const mod = assets[k];
      return (mod && mod.default) || mod;
    }
  }

  // Därefter: matcha enbart på filnamn (hero.jpg)
  const base = relKey.split("/").pop();
  if (base) {
    for (const k in assets) {
      const file = k.toLowerCase();
      if (file.endsWith("/" + base)) {
        const mod = assets[k];
        return (mod && mod.default) || mod;
      }
    }
  }

  // Sista fallback: public/images/<filnamn>
  return `/images/${base || relKey}`;
}
