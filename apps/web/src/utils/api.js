/**
 * Säker fetch-wrapper som:
 * - timeout: avbryter långsamma anrop
 * - fångar nätverksfel/404/500
 * - använder smarta mock-svar när backend saknas
 */

const DEFAULT_TIMEOUT_MS = 5000;

const MOCKS = {
  "/api/health": { ok: true, service: "mock", ts: Date.now() },
  "/api/progress": {
    goalPct: 100,
    totalPct: 100,
    storeSharePct: 100,
    supporters: 1342
  },
  "/api/store/featured": [
    { id: "blue-sky", title: "Harmoni", img: "/images/world/blue-sky.jpg" },
    { id: "green-gate", title: "Porten", img: "/images/world/green-gate.jpg" },
    { id: "plaza", title: "Plaza", img: "/images/world/plaza.jpg" }
  ]
};

function timeoutSignal(ms = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

export async function apiGet(path, { useMockOnFail = true, timeoutMs } = {}) {
  // Om vi har en dev-mock lokalt, svara direkt (snabb UI)
  if (import.meta.env.DEV && MOCKS[path]) {
    return { ok: true, status: 200, data: structuredClone(MOCKS[path]), mock: true };
  }

  const url = path.startsWith("/api") ? path : `/api${path}`;
  const { signal, cancel } = timeoutSignal(timeoutMs);

  try {
    const res = await fetch(url, { signal, headers: { "Accept": "application/json" } });
    cancel();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json().catch(() => ({}));
    return { ok: true, status: res.status, data, mock: false };
  } catch (err) {
    cancel();
    if (useMockOnFail && MOCKS[path]) {
      return { ok: true, status: 200, data: structuredClone(MOCKS[path]), mock: true, error: String(err) };
    }
    return { ok: false, status: 0, data: null, error: String(err) };
  }
}
