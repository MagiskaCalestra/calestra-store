// src/utils/tags.js

/** En enda källa för feelings/taggar i systemet */
export const FEELINGS = ["cozy", "warm", "gift", "everyday", "practical", "dreamy", "wow"];

/** Alias â†’ kanoniska taggar (här lägger du alla historiska/stavningsvarianter) */
export const TAG_ALIAS = {
  dream: "dreamy",
  dreamy: "dreamy",
  comfy: "cozy",
  cosy: "cozy",
  soft: "cozy",
  everyday: "everyday",
  daily: "everyday",
  practical: "practical",
  utility: "practical",
  wow: "wow",
  wonder: "wow",
  warm: "warm",
  gift: "gift",
};

/** Normalisera lista/sträng -> unifierade taggar */
export function normalizeTags(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(/[,|]/);
  return arr
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean)
    .map((x) => TAG_ALIAS[x] || x)
    .filter((x, i, a) => a.indexOf(x) === i);
}

/** Läs feelings/tag-parametrar från URLSearchParams */
export function readFeelingsFromSearch(searchParams) {
  const raw =
    searchParams.get("feelings") ||
    searchParams.get("feeling") ||
    searchParams.get("tags") ||
    searchParams.get("tag") ||
    "";
  return normalizeTags(raw);
}

/** Bygg feelings-parameter för en lista av taggar (tom => ta bort) */
export function writeFeelingsToSearch(searchParams, tags) {
  const next = new URLSearchParams(searchParams);
  if (tags && tags.length) next.set("feelings", tags.join(","));
  else next.delete("feelings");
  return next;
}
