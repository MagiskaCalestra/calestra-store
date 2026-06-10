// apps/store-classic/src/api/infinity.js
// Gemensamma anrop mot Infinity (14500). Har trygga fallbacks så UI aldrig kraschar.

const BASE =
  (import.meta.env && import.meta.env.VITE_PROGRESS_API) ||
  (typeof process !== "undefined" && process.env?.VITE_PROGRESS_API) ||
  "http://localhost:14500";

async function safe(path, init) {
  try {
    const res = await fetch(`${BASE}${path}`, init);
    if (!res.ok) throw new Error(String(res.status));
    // Kan vara tomt svar på POST â€” hantera det smidigt
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function getProgressSummary() {
  const j = await safe("/progress/summary");
  // Fallback så komponenter alltid får vettiga nycklar
  return (
    j || {
      percent: 0,
      storePercent: 0,
      supporters: 0,
      summary: { goal: 0, totals: 0, bySource: { store: 0 } },
    }
  );
}

export async function addContribution(payload) {
  // payload: { source:"store", amount, currency, amountSEK, orderId }
  await safe("/progress/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, ts: Date.now() }),
  });
  return true;
}

export async function getAllGoals() {
  const j = await safe("/progress/goals");
  return Array.isArray(j) ? j : [];
}

// För utgående länkar / affiliates (används av web också)
export async function trackRedirect(partner, id, to) {
  await safe("/out/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partner, id, to, ts: Date.now() }),
  });
  return true;
}
