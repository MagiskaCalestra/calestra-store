// apps/web/src/core/ccore/modules/affiliates.js
// C-Affiliates™ – partnerlänkar + compliance-läge (affiliate-only | operator)
import { emit, on } from "../eventBus";
import * as DreamCircle from "./dreamcircle";

const LS_AFF_CFG = "ccore_affiliates_cfg_v2";  // v2 pga policy
const LS_AFF_LOG = "ccore_affiliates_log_v1";

export const AffiliatePolicy = Object.freeze({
  AFFILIATE_ONLY: "affiliate-only",
  OPERATOR: "operator",
});

const DEFAULT_CFG = {
  policy: AffiliatePolicy.AFFILIATE_ONLY, // ⬅️ standard: förmedlande länkar, ingen paketering
  utm: { source: "calestra", medium: "affiliate", campaign: "default" },
  providers: [
    {
      id: "flights",
      name: "Flyg",
      enabled: true,
      partnerId: "FLY-XXXX",
      baseUrl: "https://partner.example.com/flights/search",
      params: ["from","to","depart","return","adults","children"],
      tags: ["resor","transport"],
      payoutHint: "CPS/CPA (1–3%)"
    },
    {
      id: "hotels",
      name: "Hotell",
      enabled: true,
      partnerId: "HOT-XXXX",
      baseUrl: "https://partner.example.com/hotels/search",
      params: ["city","checkin","checkout","rooms","guests"],
      tags: ["boende"],
      payoutHint: "CPS (3–6%)"
    },
    {
      id: "transport",
      name: "Transport",
      enabled: true,
      partnerId: "TRN-XXXX",
      baseUrl: "https://partner.example.com/transport",
      params: ["city","date","time","type"], // type=airport,public,car
      tags: ["transfer","resa"],
      payoutHint: "CPA fast"
    },
    {
      id: "insurance",
      name: "Reseförsäkring",
      enabled: false,
      partnerId: "INS-XXXX",
      baseUrl: "https://partner.example.com/insurance",
      params: ["country","start","end","travellers"],
      tags: ["trygghet"],
      payoutHint: "CPL/CPA"
    },
    {
      id: "experiences",
      name: "Upplevelser (stad)",
      enabled: true,
      partnerId: "EXP-XXXX",
      baseUrl: "https://partner.example.com/experiences/search",
      params: ["city","date","adults","children"],
      tags: ["turer","biljetter"],
      payoutHint: "CPS (8–12%)"
    }
  ]
};

/* ---- storage ---- */
function loadCfg() {
  try { return JSON.parse(localStorage.getItem(LS_AFF_CFG) || "null"); } catch { return null; }
}
function saveCfg(cfg) {
  localStorage.setItem(LS_AFF_CFG, JSON.stringify(cfg));
  emit("affiliates.config.updated", { cfg });
  return cfg;
}
function loadLog() {
  try { return JSON.parse(localStorage.getItem(LS_AFF_LOG) || "[]"); } catch { return []; }
}
function saveLog(list) {
  localStorage.setItem(LS_AFF_LOG, JSON.stringify(list));
  emit("affiliates.log.updated", { count: list.length });
  return list;
}

/* ---- public API ---- */
export function getConfig() { return loadCfg() || saveCfg(DEFAULT_CFG); }
export function setConfig(patch) {
  const cur = getConfig();
  return saveCfg({ ...cur, ...patch });
}
export function setPolicy(policy) {
  if (!Object.values(AffiliatePolicy).includes(policy)) return getConfig();
  const cur = getConfig();
  return saveCfg({ ...cur, policy });
}
export function getPolicy() { return getConfig().policy; }
export function isOperator() { return getPolicy() === AffiliatePolicy.OPERATOR; }

export function listProviders({ enabledOnly = true } = {}) {
  const cfg = getConfig();
  return (cfg.providers || []).filter(p => enabledOnly ? p.enabled : true);
}
export function upsertProvider(provider) {
  const cfg = getConfig();
  const arr = cfg.providers || [];
  const i = arr.findIndex(p => p.id === provider.id);
  if (i === -1) arr.push(provider); else arr[i] = { ...arr[i], ...provider };
  return saveCfg({ ...cfg, providers: arr });
}
export function setProviderEnabled(id, enabled) {
  const cfg = getConfig();
  const arr = cfg.providers.map(p => p.id === id ? { ...p, enabled } : p);
  return saveCfg({ ...cfg, providers: arr });
}

/* ---- link builder (affiliate mode) ---- */
export function buildLink(providerId, search = {}, opts = {}) {
  const cfg = getConfig();
  if (cfg.policy === AffiliatePolicy.OPERATOR) {
    throw new Error("Operatörsläge aktivt – använd interna bokningsflöden.");
  }

  const p = cfg.providers.find(x => x.id === providerId);
  if (!p || !p.enabled) throw new Error("Provider saknas eller är avstängd");

  const url = new URL(p.baseUrl);
  url.searchParams.set("pid", p.partnerId);
  (p.params || []).forEach(k => { if (search[k] != null && String(search[k]).length) url.searchParams.set(k, String(search[k])); });

  const utm = { ...cfg.utm, ...(opts.utm || {}) };
  url.searchParams.set("utm_source", utm.source || "calestra");
  url.searchParams.set("utm_medium", utm.medium || "affiliate");
  url.searchParams.set("utm_campaign", utm.campaign || "default");

  const clickId = "clk_" + Math.random().toString(36).slice(2,10);
  url.searchParams.set("cid", clickId);

  logClick({
    id: clickId, ts: Date.now(),
    providerId: p.id, providerName: p.name,
    url: url.toString(), meta: { search }
  });

  try { DreamCircle.addPoints(5, `Affiliate click · ${p.name}`); } catch {}

  return url.toString();
}

/* ---- logging ---- */
export function logClick(entry) { const list = loadLog(); list.push(entry); return saveLog(list); }
export function listClicks() { return loadLog().slice().reverse(); }
export function clearClicks() { saveLog([]); }

/* ---- auto earn (optional) ---- */
let _auto = false;
export function initAutoEarn() {
  if (_auto) return; _auto = true;
  on("booking.order.created", ({ order }) => {
    if (!order) return;
    try { DreamCircle.addPoints(25, "Affiliate synergy bonus (booking)"); } catch {}
  });
}

/* ---- UI helpers ---- */
export function policyBannerText() {
  const pol = getPolicy();
  if (pol === AffiliatePolicy.AFFILIATE_ONLY) {
    return "Calestra Travel Partner™ – vi visar externa reselänkar. Du bokar och betalar direkt hos partnern. Calestra är inte arrangör.";
  }
  return "Calestra Travel Division™ – intern bokning. Paket och transport kan säljas av Calestra (resegaranti krävs).";
}
