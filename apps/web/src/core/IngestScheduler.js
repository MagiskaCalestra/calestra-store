// Enkel “schemaläggare” i front-end (localStorage + setInterval).
// Säkerställer att ingest körs max 1 gång / 24h i denna webbläsare.
// Kan senare bytas mot riktig cron/server.

const KEY = "cw.ingest.lastRun";
const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * ensureIngestSchedule(cb?)
 * - Om senaste körningen var >24h sedan: triggars en mjuk ingest via /api/ingest
 * - Kör dessutom cb() när ingest lyckas, om den skickas in
 */
export function ensureIngestSchedule(cb) {
  try {
    const last = Number(localStorage.getItem(KEY) || "0");
    const now = Date.now();
    if (now - last < ONE_DAY) return; // redan kört idag

    // trigga mjuk ingest
    fetch("/api/ingest/soft", { method: "POST", keepalive: true }).catch(() => {});
    localStorage.setItem(KEY, String(now));
    if (typeof cb === "function") cb();
  } catch {}
}
