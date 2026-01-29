// apps/admin/src/core/campaignBridge.js

export function setCampaignOverrideCookie(id, days = 365) {
  const v = String(id || "");
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `cw_campaign_override=${encodeURIComponent(v)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearCampaignOverrideCookie() {
  document.cookie = `cw_campaign_override=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readCampaignOverrideCookie() {
  try {
    const m = document.cookie.match(/(?:^|;\s*)cw_campaign_override=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  } catch {
    return "";
  }
}
