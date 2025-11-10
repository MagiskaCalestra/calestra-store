// apps/web/src/config/index.js
import regions from "./regions.json";

export function getRegion() {
  const env = (import.meta.env.VITE_REGION || "EU").toUpperCase();
  return regions[env] ? env : "EU";
}

export function getRegionConfig() {
  const key = getRegion();
  return regions[key];
}

export function isBetaRegion() {
  const key = getRegion();
  return key !== "EU";
}
