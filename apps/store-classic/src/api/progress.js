// apps/store-classic/src/api/progress.js

const ENV =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

// Viktigt:
// - I browser/public store ska vi INTE defaulta till localhost:14080
// - Vi ska gå via samma origin/proxy som standard
// - Endast env får peka mot annan bas om du uttryckligen vill det
const DEFAULT_BASE = "/api/progress";
const RAW_BASE = ENV.VITE_PROGRESS_BASE_URL || DEFAULT_BASE;

// normalisera bas-url (ta bort trailing slash)
const BASE = String(RAW_BASE || DEFAULT_BASE).replace(/\/+$/, "");

// enkel timeout så UI aldrig “hänger”
const DEFAULT_TIMEOUT_MS = Number(ENV.VITE_PROGRESS_TIMEOUT_MS || 4500);

function withTimeout(signal, ms = DEFAULT_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);

  if (signal) {
    signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }

  return {
    signal: ctrl.signal,
    cancel: () => clearTimeout(t),
  };
}

async function requestJson(path, opts = {}) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${BASE}${cleanPath}`;
  const { signal, cancel } = withTimeout(opts.signal, opts.timeoutMs);

  try {
    const res = await fetch(url, {
      method: opts.method || "GET",
      headers: {
        Accept: "application/json",
        ...(opts.headers || {}),
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal,
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!res.ok && res.status !== 204) {
      throw new Error(`HTTP ${res.status}`);
    }

    if (res.status === 204) return {};

    return await res.json();
  } finally {
    cancel();
  }
}

// Används för att visa progress-boxen (procent + supporters)
export async function fetchProgress() {
  return requestJson("/summary");
}

// Extra – om du vill visa mål även i butiken
export async function fetchGoals() {
  return requestJson("/goals");
}

/**
 * reportOrderToProgress
 * - Accepterar antingen:
 *   A) order-objekt (med id/totalsSEK)
 *   B) ett nummer: grandTotalSEK
 *
 * Viktigt: vi vill aldrig krascha UI om API:t är nere.
 */
export async function reportOrderToProgress(input) {
  try {
    if (typeof input === "number") {
      const grand = Number.isFinite(input) ? input : null;
      if (!grand || grand <= 0) return;

      await requestJson("/order", {
        method: "POST",
        body: { orderId: null, grandTotalSEK: grand },
      });
      return;
    }

    const order = input || {};
    const orderId = order?.id ?? order?.orderId ?? order?.order_id ?? null;

    const grandTotalSEK =
      order?.totalsSEK?.grand ??
      order?.totalsSEK?.total ??
      order?.totalsSEK?.sum ??
      null;

    const grand = Number(grandTotalSEK);
    if (!Number.isFinite(grand) || grand <= 0) return;

    await requestJson("/order", {
      method: "POST",
      body: { orderId, grandTotalSEK: grand },
    });
  } catch (err) {
    // absolut aldrig krascha checkout/thanks pga progress
    console.warn("[progress] reportOrderToProgress failed:", err);
  }
}