// D:\WebProjects\Calestra\apps\admin\src\core\celeste\celesteClient.js
const DEFAULT_URL = "http://localhost:14100";
const SESSION_KEY = "cw.celeste.session.v1";

export function getCelesteUrl() {
  return String(import.meta?.env?.VITE_CELESTE_URL || DEFAULT_URL).replace(/\/$/, "");
}

export function getCelesteSessionId() {
  if (typeof window === "undefined") return "server";
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export async function askCeleste({ appName = "admin", text = "", lang = "sv" }) {
  const base = getCelesteUrl();

  const payload = {
    sessionId: getCelesteSessionId(),
    app: appName,
    lang,
    message: text,
    origin: typeof window !== "undefined" ? window.location.origin : "",
    path: typeof window !== "undefined" ? window.location.pathname : "",
  };

  try {
    const res = await fetch(`${base}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return { ok: false, answer: "Celeste: kunde inte svara just nu.", actions: [] };
    return data;
  } catch {
    return { ok: false, answer: "Celeste: ingen kontakt med celeste-service.", actions: [] };
  }
}
