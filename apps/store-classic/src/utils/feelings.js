// src/utils/feelings.js
export const FEELINGS = ["cozy", "warm", "gift", "everyday", "practical", "dreamy", "wow"];

export const TAG_ALIAS = {
  dream: "dreamy",
  comfy: "cozy",
  // fler alias vid behov
};

export function normalizeFeelings(raw) {
  if (!raw) return [];
  let arr = Array.isArray(raw) ? raw : String(raw).split(/[,|]/);
  return arr
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean)
    .map((x) => TAG_ALIAS[x] || x);
}
