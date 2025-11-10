// apps/web/src/api/infinity.js
// Samma gränssnitt som i store, så båda apparna beter sig likadant.

const BASE =
  (import.meta.env && import.meta.env.VITE_PROGRESS_API) ||
  (typeof process !== "undefined" && process.env?.VITE_PROGRESS_API) ||
  "http://localhost:14500";

async function safe(path, init) {
  try {
    const res = await fetch(`${BASE}${path}`, init);
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function getProgressSummary() {
  const j = await safe("/progress/summary");
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

export async function trackRedirect(partner, id, to) {
  await safe("/out/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partner, id, to, ts: Date.now() }),
  });
  return true;
}
