// D:\WebProjects\Calestra\apps\store-classic\src\core\auth\calestraIdentityBootstrap.js

const DEFAULT_API_BASE = "/api";
const BOOTSTRAP_INTERVAL_MS = 60_000;
const LAST_SYNC_KEY = "cw.identity.lastSyncAt";
const SESSION_TOKEN_KEY = "cw.sessionToken";
const FALLBACK_IDENTITY_KEYS = ["cw.identity", "cw.user", "cw.member", "cw.session.identity"];

function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function safeJsonParse(raw, fallback = null) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readLs(key, fallback = "") {
  try {
    if (typeof window === "undefined") return fallback;
    const value = window.localStorage.getItem(key);
    return value == null ? fallback : String(value);
  } catch {
    return fallback;
  }
}

function writeLs(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, String(value));
  } catch {}
}

function readLsJson(keys) {
  try {
    if (typeof window === "undefined") return null;
    const list = Array.isArray(keys) ? keys : [keys];

    for (const key of list) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = safeJsonParse(raw, null);
      if (parsed && typeof parsed === "object") return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

function writeLsJson(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function removeLs(key) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch {}
}

function noSlash(v) {
  return String(v || "").replace(/\/+$/, "");
}

function getApiBase() {
  const envBase =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_API_URL || import.meta.env.VITE_PUBLIC_API_BASE);

  return noSlash(cleanString(envBase || DEFAULT_API_BASE, 500) || DEFAULT_API_BASE);
}

function getAuthMeUrl() {
  return `${getApiBase()}/auth/me`;
}

function getSessionToken() {
  const fromLs = cleanString(readLs(SESSION_TOKEN_KEY, ""), 500);
  if (fromLs) return fromLs;

  try {
    if (typeof document === "undefined") return "";
    const cookies = String(document.cookie || "")
      .split(";")
      .map((x) => x.trim());

    for (const item of cookies) {
      const idx = item.indexOf("=");
      if (idx === -1) continue;
      const key = item.slice(0, idx).trim();
      const value = item.slice(idx + 1).trim();
      if (key === "cw_session") return decodeURIComponent(value);
    }
  } catch {}

  return "";
}

function buildIdentityPayloadFromAuthMe(data) {
  const user = data?.user && typeof data.user === "object" ? data.user : {};
  const profile = data?.profile && typeof data.profile === "object" ? data.profile : {};
  const member = data?.member && typeof data.member === "object" ? data.member : {};

  const displayName =
    cleanString(profile.displayName || "", 160) ||
    cleanString(`${profile.firstName || ""} ${profile.lastName || ""}`, 160) ||
    cleanString(user.email || "", 160);

  return {
    identity: {
      userId: cleanString(user.id || "", 160),
      id: cleanString(user.id || "", 160),
      email: cleanString(user.email || "", 160),
      name: displayName,
      fullName: displayName,
      memberId: cleanString(member.memberId || "", 160),
      memberTier: cleanString(member.tier || "starlight", 80).toLowerCase(),
      emailVerified: !!user.emailVerified,
      status: cleanString(user.status || "active", 80),
      locale: cleanString(profile.locale || "sv-SE", 32),
      country: cleanString(profile.country || "SE", 8).toUpperCase() || "SE",
      phone: cleanString(profile.phone || "", 80),
      updatedAt: new Date().toISOString(),
      source: "identity-service",
    },

    member: {
      id: cleanString(member.memberId || "", 160),
      memberId: cleanString(member.memberId || "", 160),
      userId: cleanString(user.id || "", 160),
      memberTier: cleanString(member.tier || "starlight", 80).toLowerCase(),
      tier: cleanString(member.tier || "starlight", 80).toLowerCase(),
      name: displayName,
      fullName: displayName,
      email: cleanString(user.email || "", 160),
      locale: cleanString(profile.locale || "sv-SE", 32),
      country: cleanString(profile.country || "SE", 8).toUpperCase() || "SE",
      phone: cleanString(profile.phone || "", 80),
      pointsBalanceLight: Math.max(0, Number(member.pointsBalanceLight || 0)),
      memberStatus: cleanString(member.memberStatus || "active", 80),
      updatedAt: new Date().toISOString(),
      source: "identity-service",
    },

    customerPrefill: {
      name: displayName,
      email: cleanString(user.email || "", 160),
      phone: cleanString(profile.phone || "", 80),
      updatedAt: new Date().toISOString(),
      source: "identity-service",
    },
  };
}

function persistIdentityBridge(payload) {
  if (!payload || typeof payload !== "object") return;

  const identity = payload.identity || {};
  const member = payload.member || {};
  const customerPrefill = payload.customerPrefill || {};

  writeLsJson("cw.identity", identity);
  writeLsJson("cw.user", identity);
  writeLsJson("cw.session.identity", identity);

  writeLsJson("cw.member", member);
  writeLsJson("cw.membership", member);
  writeLsJson("cw.member.snapshot", member);
  writeLsJson("cw.portal.member", member);

  writeLsJson("cw.checkout.prefill", customerPrefill);
  writeLsJson("cw.member.profile.customer", customerPrefill);

  if (identity.userId) writeLs("cw.userId", identity.userId);
  if (member.memberId) writeLs("cw.memberId", member.memberId);
  if (member.memberTier) writeLs("cw.memberTier", member.memberTier);

  writeLs(LAST_SYNC_KEY, new Date().toISOString());

  try {
    window.dispatchEvent(
      new CustomEvent("cw:identity-sync", {
        detail: {
          ok: true,
          userId: identity.userId || "",
          memberId: member.memberId || "",
          memberTier: member.memberTier || "",
        },
      })
    );
  } catch {}
}

function clearIdentityBridge() {
  const keys = [
    "cw.identity",
    "cw.user",
    "cw.session.identity",
    "cw.member",
    "cw.membership",
    "cw.member.snapshot",
    "cw.portal.member",
    "cw.checkout.prefill",
    "cw.member.profile.customer",
    "cw.userId",
    "cw.memberId",
    "cw.memberTier",
    LAST_SYNC_KEY,
  ];

  for (const key of keys) removeLs(key);

  try {
    window.dispatchEvent(
      new CustomEvent("cw:identity-sync", {
        detail: { ok: false, cleared: true },
      })
    );
  } catch {}
}

export async function fetchCalestraIdentityMe() {
  const sessionToken = getSessionToken();

  const headers = {
    accept: "application/json",
  };

  if (sessionToken) {
    headers["X-Session-Token"] = sessionToken;
  }

  const res = await fetch(getAuthMeUrl(), {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  const data = safeJsonParse(text, null);

  if (!res.ok) {
    const error =
      data?.error ||
      (typeof text === "string" && text.includes("<html") ? "api_route_returned_html" : "") ||
      text ||
      `auth_me_http_${res.status}`;

    throw new Error(String(error));
  }

  if (!data?.ok) {
    throw new Error("auth_me_not_ok");
  }

  return data;
}

export async function syncCalestraIdentityToStore() {
  try {
    const data = await fetchCalestraIdentityMe();
    const payload = buildIdentityPayloadFromAuthMe(data);
    persistIdentityBridge(payload);
    return {
      ok: true,
      payload,
    };
  } catch (err) {
    const message = String(err?.message || err || "identity_sync_failed");

    if (message === "missing_session" || message === "invalid_session") {
      clearIdentityBridge();
      return {
        ok: false,
        cleared: true,
        error: message,
      };
    }

    return {
      ok: false,
      error: message,
    };
  }
}

export function getCurrentIdentitySnapshot() {
  const identity = readLsJson(FALLBACK_IDENTITY_KEYS);
  const member = readLsJson(["cw.member", "cw.membership", "cw.member.snapshot", "cw.portal.member"]);
  const prefill = readLsJson(["cw.checkout.prefill", "cw.member.profile.customer"]);

  return {
    identity,
    member,
    prefill,
    lastSyncAt: readLs(LAST_SYNC_KEY, ""),
  };
}

export function startCalestraIdentityBootstrap(options = {}) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const intervalMs =
    Number(options.intervalMs) > 0 ? Number(options.intervalMs) : BOOTSTRAP_INTERVAL_MS;

  let stopped = false;
  let running = false;
  let timer = null;

  async function run(reason = "manual") {
    if (stopped || running) return;
    running = true;

    try {
      await syncCalestraIdentityToStore();
    } catch (err) {
      console.warn("[calestraIdentityBootstrap] sync failed", reason, err);
    } finally {
      running = false;
    }
  }

  function schedule() {
    if (stopped) return;
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(() => {
      run("interval");
    }, intervalMs);
  }

  function onFocus() {
    run("focus");
  }

  function onVisibility() {
    if (document.visibilityState === "visible") {
      run("visibility");
    }
  }

  run("startup");
  schedule();

  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);

  return function stop() {
    stopped = true;
    if (timer) window.clearInterval(timer);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}