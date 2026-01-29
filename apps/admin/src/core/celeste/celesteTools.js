// apps/admin/src/core/celeste/celesteTools.js
export function makeCelesteToolsAdmin() {
  // Viktigt: riktig backend för ekonomi är finance-service (14010)
  const FINANCE = (import.meta?.env?.VITE_FINANCE_URL || "http://localhost:14010").replace(/\/$/, "");
  const STATUS = (import.meta?.env?.VITE_STATUS_URL || "http://localhost:14060").replace(/\/$/, "");
  const PROGRESS = (import.meta?.env?.VITE_PROGRESS_URL || "http://localhost:14080").replace(/\/$/, "");
  const NEXUS = (import.meta?.env?.VITE_NEXUS_URL || "http://localhost:14050").replace(/\/$/, "");
  const IDENTITY = (import.meta?.env?.VITE_IDENTITY_URL || "http://localhost:14070").replace(/\/$/, "");

  async function safeJson(url) {
    try {
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: String(e?.message || e) } };
    }
  }

  return {
    appName: "admin",
    navigate: (path) => {
      if (typeof window === "undefined") return;
      window.location.href = path;
    },
    open: (url) => {
      if (typeof window === "undefined") return;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    getServiceSummary: async () => {
      const [finance, status, progress, nexus, identity] = await Promise.all([
        safeJson(`${FINANCE}/api/summary?range=day&mode=test`),
        safeJson(`${STATUS}/health`),
        safeJson(`${PROGRESS}/health`),
        safeJson(`${NEXUS}/health`),
        safeJson(`${IDENTITY}/health`),
      ]);

      return {
        finance,
        status,
        progress,
        nexus,
        identity,
      };
    },
  };
}
