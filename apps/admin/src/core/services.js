// apps/admin/src/core/services.js
// Single source of truth för alla service-base-paths i ADMIN.
// Admin pratar via Vite proxy när vi kör lokalt.
// I prod kan vi peka om till Pages Functions / Workers senare.

export function envName() {
  try {
    return String(import.meta?.env?.VITE_APP_ENV || "green");
  } catch {
    return "green";
  }
}

export const Services = {
  orders: {
    base: "/svc/orders",
    endpoints: {
      health: "/health",
      list: "/api/orders",
      ingest: "/api/ingest",
    },
    required: true, // MUST be up for test launch
  },

  finance: {
    base: "/svc/finance",
    endpoints: {
      health: "/health",
      // framtid: när finance-service får dessa:
      summary: "/api/finance/summary",
      config: "/api/finance/config",
    },
    required: false,
  },

  analytics: {
    base: "/svc/analytics",
    endpoints: {
      health: "/health",
      summary: "/api/analytics/stats/summary",
      funnel: "/api/analytics/stats/funnel",
      timeseries: "/api/analytics/stats/timeseries",
      errors: "/api/analytics/stats/errors",
    },
    required: false,
  },

  status: {
    base: "/svc/status",
    endpoints: {
      health: "/health",
      status: "/api/status",
    },
    required: false,
  },

  identity: {
    base: "/svc/identity",
    endpoints: {
      health: "/health",
      // framtid: /api/login, /api/me etc.
    },
    required: false,
  },
};

export function urlFor(serviceKey, endpointKey, query) {
  const s = Services[serviceKey];
  if (!s) throw new Error(`Unknown service: ${serviceKey}`);
  const p = s.endpoints?.[endpointKey];
  if (!p) throw new Error(`Unknown endpoint: ${serviceKey}.${endpointKey}`);

  const base = String(s.base || "").replace(/\/$/, "");
  const path = String(p || "");
  const u = `${base}${path}`;

  if (!query) return u;

  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const sQ = qs.toString();
  return sQ ? `${u}?${sQ}` : u;
}
