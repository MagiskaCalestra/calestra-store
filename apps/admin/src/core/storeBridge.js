// D:\WebProjects\Calestra\apps\admin-core\src\core\storeBridge.js
// Bridge v1.0: Admin <-> Store via localStorage (ingen backend)
// Keys:
// - cw.orders (array)      -> skapad av Store Checkout (du har redan)
// - cw.campaignOverride   -> påverkar Store/Web kampanjläge
// - cw.admin.audit (array)-> admin audit log

export const LS = {
  ORDERS: "cw.orders",
  CAMPAIGN: "cw.campaignOverride",
  AUDIT: "cw.admin.audit",
};

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function readOrders() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LS.ORDERS);
  const arr = raw ? safeParse(raw, []) : [];
  return Array.isArray(arr) ? arr : [];
}

export function readCampaignOverride() {
  if (typeof window === "undefined") return "";
  const v = window.localStorage.getItem(LS.CAMPAIGN);
  return v && typeof v === "string" ? v : "";
}

export function setCampaignOverride(next) {
  if (typeof window === "undefined") return;
  const v = String(next || "").trim();
  if (!v || v === "none") {
    window.localStorage.removeItem(LS.CAMPAIGN);
    writeAudit("campaign.clear", { value: "" });
  } else {
    window.localStorage.setItem(LS.CAMPAIGN, v);
    writeAudit("campaign.set", { value: v });
  }

  // Tvinga alla tabs att uppfatta ändring även om samma tab
  try {
    window.dispatchEvent(new StorageEvent("storage", { key: LS.CAMPAIGN }));
  } catch {}
}

export function readAudit(limit = 50) {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LS.AUDIT);
  const arr = raw ? safeParse(raw, []) : [];
  const list = Array.isArray(arr) ? arr : [];
  return list.slice(-Math.max(1, limit));
}

export function writeAudit(type, meta = {}) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(LS.AUDIT);
  let arr = raw ? safeParse(raw, []) : [];
  if (!Array.isArray(arr)) arr = [];

  arr.push({
    id: "AUD-" + Date.now().toString(36).toUpperCase(),
    at: new Date().toISOString(),
    type,
    meta,
  });

  // håll liten
  if (arr.length > 200) arr = arr.slice(-200);

  window.localStorage.setItem(LS.AUDIT, JSON.stringify(arr));
}

export function computeKpisFromOrders(orders) {
  const list = Array.isArray(orders) ? orders : [];

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let ordersToday = 0;
  let revenueTodaySEK = 0;
  let totalOrders = list.length;
  let revenueTotalSEK = 0;

  for (const o of list) {
    const t = Date.parse(o?.createdAt || "") || 0;
    const g = Number(o?.totalsSEK?.grand || 0);

    revenueTotalSEK += g;
    if (now - t <= dayMs) {
      ordersToday += 1;
      revenueTodaySEK += g;
    }
  }

  // “Aktiva medlemmar” är mock tills identity kopplas.
  // Vi gör den “smart mock”: 200 + 20 per order (tak 5000)
  const activeMembers = Math.min(5000, 200 + totalOrders * 20);

  return {
    activeMembers,
    ordersToday,
    totalOrders,
    revenueTodaySEK: Math.round(revenueTodaySEK),
    revenueTotalSEK: Math.round(revenueTotalSEK),
  };
}
