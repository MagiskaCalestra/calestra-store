// Enkel, gratis spårning: logga klick lokalt + (valfritt) POST till Infinity/Nexus.

const AFF_API =
  (import.meta.env && import.meta.env.VITE_AFF_API) ||
  (typeof process !== "undefined" && process.env?.VITE_AFF_API) ||
  ""; // lämna tom för att bara logga lokalt

export async function trackRedirect({ partner, id, to, url }) {
  try {
    // 1) spara enkel klicklogg lokalt (kan läsas i DevLog)
    const key = "cw_aff_clicks";
    const now = Date.now();
    const item = { partner, id, to, at: now };
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    prev.push(item);
    localStorage.setItem(key, JSON.stringify(prev.slice(-500))); // håll det litet

    // 2) (valfritt) sänd server-side logg om du anger VITE_AFF_API
    if (AFF_API) {
      await fetch(`${AFF_API}/aff/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner, id, to, url, at: now }),
      });
    }
  } catch (e) {
    // Får aldrig stoppa redirect
  }
}
