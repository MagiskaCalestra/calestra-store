// D:\WebProjects\Calestra\apps\store-classic\src\campaign\getCampaign.js
// LEGACY COMPAT WRAPPER
// All kampanjlogik ska nu gå via src/core/campaignEngine.js.
// Denna fil finns kvar endast för bakåtkompatibilitet så äldre imports inte bryter.

import * as CampaignMaster from "../core/campaignEngine.js";

function pick(fnNames, fallback) {
  for (const name of fnNames) {
    if (typeof CampaignMaster?.[name] === "function") {
      return CampaignMaster[name];
    }
  }
  return fallback;
}

function defaultPresetByKey(key = "standard") {
  return {
    key: String(key || "standard"),
    title: String(key || "standard"),
    theme: "neutral",
    bullets: [],
    source: "legacy-fallback",
    legacyCompat: true,
  };
}

function defaultGetCampaign(now = new Date()) {
  const preset = defaultPresetByKey("standard");
  return {
    ...preset,
    now: now instanceof Date ? now.toISOString() : String(now || ""),
  };
}

const masterPresetByKey = pick(
  ["presetByKey", "getCampaignPresetByKey", "resolvePresetByKey"],
  defaultPresetByKey
);

const masterGetCampaign = pick(
  ["getCampaign", "resolveCampaign", "getResolvedCampaign", "detectCampaign"],
  defaultGetCampaign
);

export const MOVABLE_CAMPAIGNS = Array.isArray(CampaignMaster?.MOVABLE_CAMPAIGNS)
  ? CampaignMaster.MOVABLE_CAMPAIGNS
  : [];

export function presetByKey(key) {
  const result = masterPresetByKey(key);
  if (result && typeof result === "object") {
    return { ...result, legacyCompat: true };
  }
  return defaultPresetByKey(key);
}

export function getCampaign(now = new Date()) {
  const result = masterGetCampaign(now);
  if (result && typeof result === "object") {
    return { ...result, legacyCompat: true };
  }
  return defaultGetCampaign(now);
}

export default getCampaign;