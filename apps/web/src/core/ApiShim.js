// Minimal fetch-shim för /api/* så vi kan utveckla fronten fristående.
import { addSalesRows } from "@core/C-Core";

function ok(data) {
  return new Response(JSON.stringify(data || {}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
function bad(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Hooka global fetch EN gång
if (typeof window !== "undefined" && !window.__CAL_API_SHIM__) {
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    try {
      const url = typeof input === "string" ? input : input?.url || "";

      // Ingest normaliserade rader (POST /api/ingest)
      if (url.startsWith("/api/ingest")) {
        if ((init.method || "GET").toUpperCase() !== "POST") {
          return bad("Use POST for /api/ingest", 405);
        }
        const j = JSON.parse(init.body || "{}");
        const rows = Array.isArray(j?.rows) ? j.rows : [];
        const added = addSalesRows(rows);
        return ok({ added });
      }

      // Klickspårning – no-op i dev
      if (url.startsWith("/api/affiliate/track")) {
        return ok({ tracked: true });
      }

      // Webhooks – låt oss lägga in enstaka rader manuellt
      if (url.startsWith("/api/webhooks/")) {
        if ((init.method || "GET").toUpperCase() !== "POST") {
          return bad("Use POST for /api/webhooks/*", 405);
        }
        const j = JSON.parse(init.body || "{}");
        const rec = j?.record ? [j.record] : (Array.isArray(j?.records) ? j.records : []);
        const rows = rec.map(r => ({
          ts: r.ts || new Date().toISOString(),
          flow: (r.flow || "inbound").toLowerCase(),
          network: r.network || "Custom",
          ref: r.ref || "",
          amount: r.amount || 0,
          currency: (r.currency || "SEK").toUpperCase(),
          status: (r.status || "pending").toLowerCase(),
        }));
        const added = addSalesRows(rows);
        return ok({ added });
      }

      // Annars: vidare till riktig fetch
      return await realFetch(input, init);
    } catch (e) {
      console.error("ApiShim error", e);
      return bad("ApiShim error", 500);
    }
  };

  window.__CAL_API_SHIM__ = true;
}
