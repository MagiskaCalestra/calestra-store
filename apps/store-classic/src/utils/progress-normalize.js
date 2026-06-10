// apps/store-classic/src/utils/progress-normalize.js
// Samma robusta normalisering som på portalen.

export function normalizeProgress(summaryLike) {
  const s = summaryLike?.summary || summaryLike || {};
  const goal  = Number(s.goal ?? s.target ?? 0);
  const total = Number(s.totals ?? s.total ?? 0);

  let store = Number(s.bySource?.store ?? NaN);

  if (Number.isNaN(store) && Array.isArray(s.sources)) {
    const hit = s.sources.find(
      (x) => String(x.name || x.key || x.source || "").toLowerCase() === "store"
    );
    if (hit) store = Number(hit.value ?? hit.amount ?? 0);
  }

  if (Number.isNaN(store)) store = Number(s.store ?? 0);
  if (!store && total) store = total;

  return { goal, total, store };
}
