// D:\WebProjects\Calestra\apps\store-classic\src\core\celeste\celesteClient.js

const DEFAULT_ENDPOINT = "/api/celeste";
const DEFAULT_TIMEOUT_MS = 30000;

const inflight = new Map(); // key => { controller, startedAt }

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normLang(l) {
  const b = String(l || "sv").slice(0, 2).toLowerCase();
  return b === "sv" || b === "en" || b === "tr" ? b : "sv";
}

function getOriginSafe() {
  try {
    if (typeof window !== "undefined") return String(window.location?.origin || "");
  } catch {}
  return "";
}

function getPagePathSafe(explicitPath) {
  const p = String(explicitPath || "").trim();
  if (p) return p;
  try {
    if (typeof window !== "undefined") return String(window.location?.pathname || "/");
  } catch {}
  return "/";
}

function randId(len = 24) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function getOrCreateSessionId(appName = "store") {
  const key = `celeste_session_${String(appName || "store").toLowerCase()}`;
  try {
    const existing = localStorage.getItem(key);
    if (existing && existing.length >= 8) return existing;
    const created = `cs_${Date.now().toString(36)}_${randId(16)}`;
    localStorage.setItem(key, created);
    return created;
  } catch {
    return `cs_${Date.now().toString(36)}_${randId(16)}`;
  }
}

/* ---------------- Endpoint resolution ----------------
   RULE: Use ONLY VITE_API_URL (preferred).
   - If VITE_API_URL ends with /api  => `${VITE_API_URL}/celeste`
   - else                            => `${VITE_API_URL}/api/celeste`
   Fallback: DEFAULT_ENDPOINT (/api/celeste)
------------------------------------------------------ */

function noSlash(v) {
  return String(v || "").replace(/\/$/, "");
}

function joinUrl(base, path) {
  const b = noSlash(base);
  const p = String(path || "").replace(/^\//, "");
  if (!b) return `/${p}`;
  return `${b}/${p}`;
}

function endpointFromEnv() {
  try {
    const apiBase = String(import.meta?.env?.VITE_API_URL || "").trim();
    const base = noSlash(apiBase);

    if (!base) return DEFAULT_ENDPOINT;

    // If base already includes "/api" at the end -> append "celeste"
    if (base.endsWith("/api")) return joinUrl(base, "celeste");

    // If base already looks like it contains "/api/" somewhere, still be safe:
    // (e.g. https://x.y/api) is handled above; https://x.y/api/v2 is uncommon here.
    // We keep simple rule: add "/api/celeste" when base does not end with "/api".
    return joinUrl(base, "api/celeste");
  } catch {
    return DEFAULT_ENDPOINT;
  }
}

export function abortCeleste(appName = "store") {
  const key = String(appName || "store");
  const cur = inflight.get(key);
  if (cur?.controller) {
    try {
      cur.controller.abort();
    } catch {}
  }
  inflight.delete(key);
}

export async function askCeleste({
  appName = "store",
  text,
  lang = "sv",
  debug = false,
  pagePath,
  turnIndex = 0,
  lastRecSlugs = [],
  currentProductSlug = "",
} = {}) {
  const key = String(appName || "store");
  const L = normLang(lang);
  const msg = String(text || "").trim();

  if (!msg) {
    return { ok: true, answer: "", actions: [], meta: { source: "client" } };
  }

  abortCeleste(key);

  const controller = new AbortController();
  inflight.set(key, { controller, startedAt: Date.now() });

  const t = setTimeout(() => {
    try {
      controller.abort();
    } catch {}
  }, DEFAULT_TIMEOUT_MS);

  const path = getPagePathSafe(pagePath);
  const sessionId = getOrCreateSessionId(key);

  const body = {
    appName: key,
    lang: L,
    text: msg,
    message: msg,

    sessionId,
    origin: getOriginSafe(),
    path,
    pagePath: path,

    turnIndex: Number.isFinite(Number(turnIndex)) ? Number(turnIndex) : 0,
    lastRecSlugs: Array.isArray(lastRecSlugs) ? lastRecSlugs.map(String).slice(0, 12) : [],
    currentProductSlug: String(currentProductSlug || "").trim(),
    debug: !!debug,
  };

  const url = endpointFromEnv();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      credentials: "include",
    });

    const rawText = await res.text();
    const data = safeJsonParse(rawText);

    if (!res.ok) {
      const answer =
        (data && typeof data.answer === "string" && data.answer) ||
        (L === "tr"
          ? "Celeste: şu an cevap veremiyorum."
          : L === "en"
            ? "Celeste: I can’t answer right now."
            : "Celeste: kunde inte svara just nu.");

      return { ok: false, answer, status: res.status, meta: { source: "http", debug: !!debug, url } };
    }

    if (data && typeof data === "object") {
      if (typeof data.ok === "boolean") return data;
      return { ok: true, ...data };
    }

    return {
      ok: false,
      answer:
        L === "tr"
          ? "Celeste: beklenmeyen yanıt aldım."
          : L === "en"
            ? "Celeste: I received an unexpected response."
            : "Celeste: fick ett oväntat svar.",
      meta: { source: "client", debug: !!debug, url },
    };
  } catch (e) {
    const aborted = e?.name === "AbortError";
    if (aborted) return { ok: false, aborted: true, answer: "", meta: { source: "client" } };

    return {
      ok: false,
      answer:
        L === "tr"
          ? "Celeste: nätverksfel just nu."
          : L === "en"
            ? "Celeste: network error right now."
            : "Celeste: nätverksfel just nu.",
      meta: { source: "client", debug: !!debug, url },
    };
  } finally {
    clearTimeout(t);
    const cur = inflight.get(key);
    if (cur?.controller === controller) inflight.delete(key);
  }
}