// D:\WebProjects\Calestra\apps\admin\src\core\finance\financeClient.js
// Finance client (admin) — PROXY FIRST
// - Pratar via Vite proxy: /svc/finance → VITE_FINANCE_URL (default 14010)
// - Ska aldrig krascha UI pga parse/404; kastar tydliga fel som UI kan visa.
// - services/finance-service är den riktiga backend-tjänsten (port 14010).

function qs(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      // fallthrough to text
    }
  }
  const txt = await res.text().catch(() => "");
  try {
    return JSON.parse(txt);
  } catch {
    return { message: txt || "non-json response" };
  }
}

async function fetchWithTimeout(url, { timeoutMs = 2500, ...opts } = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

/* ---------------- Formatting helpers ---------------- */

export const formatSEK = (value) => {
  const n = Number(value || 0);
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(n);
};

// aliases (bakåtkomp)
export const formatSek = formatSEK;
export const fmtSEK = formatSEK;

export const formatMoney = (value, currency = "SEK") => {
  const n = Number(value || 0);
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
};

export const pct = (value) => {
  const n = Number(value || 0);
  const v = n > 1 ? n / 100 : n;
  return new Intl.NumberFormat("sv-SE", { style: "percent", maximumFractionDigits: 1 }).format(v);
};

/* ---------------- PROXY base ---------------- */

// Alltid via proxy i admin (local + framtida prod om ni mappar routes likadant).
const BASE = "/svc/finance";

/* ---------------- API calls ---------------- */

export async function getFinanceHealth() {
  const url = `${BASE}/health`;

  const res = await fetchWithTimeout(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    timeoutMs: 2200,
  });

  const data = await safeJson(res);

  if (!res.ok) {
    // Node/Express default 404: "Cannot GET /health" => tydlig feltext
    const msg = data?.message || data?.error || `Finance /health failed (${res.status})`;
    throw new Error(`${msg}\nURL: ${url}`);
  }

  return data;
}

/**
 * Försöker hämta config från finance-service om endpoint finns,
 * annars returnerar en minimal config så UI kan fungera ändå.
 */
export async function getFinanceConfig() {
  const url = `${BASE}/api/finance/config`;

  try {
    const res = await fetchWithTimeout(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      timeoutMs: 2200,
    });

    const data = await safeJson(res);

    if (res.ok) return data;

    // saknas => fallback (inte error i UI)
    if (res.status === 404 || res.status === 405) {
      return { ok: true, note: "finance config endpoint missing; using fallback", url };
    }

    // annat fel => fallback (tolerant)
    return { ok: false, note: "finance config error (tolerant fallback)", url, status: res.status, data };
  } catch (e) {
    // nät/timeout => fallback
    return { ok: false, note: "finance config fetch failed (tolerant fallback)", url, error: String(e?.message || e) };
  }
}

/**
 * Summary:
 * Förväntad endpoint: /api/finance/summary?mode=test|live&range=day|7d|30d...
 * Om den inte finns: kasta error -> UI visar N/A (men admin funkar).
 */
export async function getFinanceSummary({ mode = "test", range = "day" } = {}) {
  const url = `${BASE}/api/finance/summary${qs({ mode, range })}`;

  const res = await fetchWithTimeout(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    timeoutMs: 2600,
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const msg = data?.message || data?.error || `Finance summary failed (${res.status})`;
    throw new Error(`${msg}\nURL: ${url}`);
  }

  return data;
}

// bakåtkomp om något importerar detta namnet
export async function getFinanceSummaryRange({ mode = "test", range = "day" } = {}) {
  return getFinanceSummary({ mode, range });
}
