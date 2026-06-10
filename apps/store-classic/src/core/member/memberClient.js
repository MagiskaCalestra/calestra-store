// D:\WebProjects\Calestra\apps\store-classic\src\core\member\memberClient.js
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta?.env?.VITE_PUBLIC_API_BASE) ||
  "";

const IDENTITY_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta?.env?.VITE_IDENTITY_URL ||
      import.meta?.env?.VITE_IDENTITY_API_BASE ||
      import.meta?.env?.VITE_MEMBER_API_BASE)) ||
  "";

const SESSION_TOKEN_KEY = "cw.sessionToken";
const AUTH_USER_KEY = "cw.auth.user";
const AUTH_STATE_KEY = "cw.auth.state";

function hasWindow() {
  return typeof window !== "undefined";
}

function stripTrailingSlash(v) {
  return String(v || "").replace(/\/+$/, "");
}

function toUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const base = stripTrailingSlash(API_BASE);
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

function cleanString(v, max = 500) {
  return String(v ?? "").trim().slice(0, max);
}

function normalizeEmail(v) {
  return cleanString(v, 320).toLowerCase();
}

function readJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function safeGetLS(key, fallback = "") {
  if (!hasWindow()) return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function safeSetLS(key, value) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function safeRemoveLS(key) {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function readSessionToken() {
  return cleanString(safeGetLS(SESSION_TOKEN_KEY, ""), 1200);
}

function writeSessionToken(token) {
  const next = cleanString(token, 1200);
  if (next) safeSetLS(SESSION_TOKEN_KEY, next);
  else safeRemoveLS(SESSION_TOKEN_KEY);
}

function dispatchAuthChanged(detail = {}) {
  if (!hasWindow()) return;
  try {
    window.dispatchEvent(new CustomEvent("cw:member-auth-changed", { detail }));
    window.dispatchEvent(new CustomEvent("cw:identity-sync", { detail }));
  } catch {}
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return null;

  const id = cleanString(user.id || user.userId || user.memberId || "", 160);
  const email = normalizeEmail(user.email || user.customerEmail || "");
  const name = cleanString(user.name || user.fullName || user.customerName || "", 180);
  const phone = cleanString(user.phone || user.mobile || "", 80);

  return {
    ...user,
    id: id || user.id || user.userId || "",
    userId: cleanString(user.userId || id || "", 160),
    memberId: cleanString(user.memberId || user.id || id || "", 160),
    email,
    name,
    phone,
  };
}

function persistAuthUser(user) {
  const safeUser = normalizeUser(user);

  if (!safeUser) {
    safeRemoveLS(AUTH_USER_KEY);
    safeRemoveLS(AUTH_STATE_KEY);
    return;
  }

  safeSetLS(AUTH_USER_KEY, JSON.stringify(safeUser));
  safeSetLS(
    AUTH_STATE_KEY,
    JSON.stringify({
      loggedIn: true,
      updatedAt: new Date().toISOString(),
      email: cleanString(safeUser.email || "", 320),
      userId: cleanString(safeUser.id || safeUser.userId || "", 160),
      memberId: cleanString(safeUser.memberId || "", 160),
    })
  );
}

function clearLocalAuthState() {
  safeRemoveLS(SESSION_TOKEN_KEY);
  safeRemoveLS(AUTH_USER_KEY);
  safeRemoveLS(AUTH_STATE_KEY);
}

async function parseResponse(res) {
  const text = await res.text().catch(() => "");
  const json = readJson(text);

  return {
    ok: !!res.ok,
    status: Number(res.status || 0),
    text,
    json,
  };
}

function extractTokenFromResponse(parsed, res) {
  return (
    cleanString(
      parsed?.json?.sessionToken ||
        parsed?.json?.token ||
        parsed?.json?.accessToken ||
        parsed?.json?.session?.token ||
        parsed?.json?.data?.sessionToken ||
        parsed?.json?.data?.token ||
        res?.headers?.get?.("x-session-token") ||
        res?.headers?.get?.("x-calestra-session") ||
        "",
      1200
    ) || ""
  );
}

async function authFetch(path, opts = {}) {
  const url = toUrl(path);
  if (!url) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: "missing_url",
      text: "",
    };
  }

  const token = readSessionToken();

  const headers = {
    Accept: "application/json",
    ...(opts.body ? { "Content-Type": "application/json" } : {}),
    ...(opts.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["X-Session-Token"] = token;
  }

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    credentials: opts.credentials || "include",
    cache: "no-store",
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    keepalive: !!opts.keepalive,
  });

  const parsed = await parseResponse(res);
  const nextToken = extractTokenFromResponse(parsed, res);

  if (nextToken) writeSessionToken(nextToken);

  return {
    ...parsed,
    data: parsed.json || null,
  };
}

async function fetchFromCandidates(candidates, opts = {}) {
  const unique = [...new Set((Array.isArray(candidates) ? candidates : []).filter(Boolean))];
  let last = null;

  for (const path of unique) {
    try {
      const res = await authFetch(path, opts);
      if (res.ok) return res;

      last = res;

      if (![404, 405].includes(Number(res.status || 0))) {
        return res;
      }
    } catch (err) {
      last = {
        ok: false,
        status: 0,
        data: null,
        text: "",
        error: cleanString(err?.message || "network_error", 260),
      };
    }
  }

  return last || { ok: false, status: 0, data: null, text: "", error: "not_found" };
}

function identityCandidates(...paths) {
  const all = [];
  const normalizedBase = stripTrailingSlash(IDENTITY_BASE);

  for (const p of paths) {
    if (!p) continue;

    all.push(p);

    if (normalizedBase && !/^https?:\/\//i.test(p)) {
      const normalizedPath = p.startsWith("/") ? p : `/${p}`;
      all.push(`${normalizedBase}${normalizedPath}`);
    }
  }

  return [...new Set(all)];
}

function extractMember(data) {
  return (
    data?.member ||
    data?.user ||
    data?.customer ||
    data?.result ||
    data?.data?.member ||
    data?.data?.user ||
    data?.data ||
    null
  );
}

export async function fetchCurrentMember() {
  const res = await fetchFromCandidates(
    ["/api/auth/me", "/api/auth/session", "/api/auth/current"],
    { method: "GET" }
  );

  const data = res?.data || null;
  const user = extractMember(data);

  if (res?.ok && user) {
    const safeUser = normalizeUser(user);
    persistAuthUser(safeUser);

    return {
      ok: true,
      status: res.status,
      user: safeUser,
      member: safeUser,
      raw: data,
    };
  }

  if (res?.status === 401 || res?.status === 403) {
    clearLocalAuthState();

    return {
      ok: false,
      status: res.status,
      error: "missing_session",
      raw: data,
    };
  }

  return {
    ok: false,
    status: res?.status || 0,
    error:
      cleanString(
        data?.error || data?.message || res?.text || res?.error || "auth_me_failed",
        260
      ) || "auth_me_failed",
    raw: data,
  };
}

export async function requestMemberLogin(payload = {}) {
  const body = {
    email: normalizeEmail(payload.email),
    name: cleanString(payload.name || "", 160),
    phone: cleanString(payload.phone || "", 80),
    locale: cleanString(payload.locale || "sv-SE", 32),
    currency: cleanString(payload.currency || "SEK", 16),
    redirectPath: cleanString(payload.redirectPath || "/member", 220),
  };

  if (!body.email) {
    throw new Error("missing_email");
  }

  const res = await fetchFromCandidates(
    ["/api/auth/request-login", "/api/auth/request-magic-link"],
    {
      method: "POST",
      body,
    }
  );

  const data = res?.data || null;

  if (!res?.ok) {
    throw new Error(
      cleanString(
        data?.error || data?.message || res?.text || "request_login_failed",
        260
      ) || "request_login_failed"
    );
  }

  return {
    ok: true,
    email: body.email,
    redirectPath: cleanString(data?.redirectPath || body.redirectPath, 220),
    devMagicToken: cleanString(
      data?.devMagicToken || data?.magicToken || data?.token || data?.loginToken || "",
      1200
    ),
    raw: data,
  };
}

export async function verifyMemberLoginToken(tokenOrPayload) {
  const token =
    typeof tokenOrPayload === "string"
      ? cleanString(tokenOrPayload, 1200)
      : cleanString(tokenOrPayload?.token || "", 1200);

  const redirectPath =
    typeof tokenOrPayload === "object"
      ? cleanString(tokenOrPayload?.redirectPath || "/member", 220)
      : "/member";

  if (!token) {
    throw new Error("missing_token");
  }

  const res = await fetchFromCandidates(
    ["/api/auth/verify-login", "/api/auth/verify-magic-link"],
    {
      method: "POST",
      body: {
        token,
        redirectPath,
      },
    }
  );

  const data = res?.data || null;

  if (!res?.ok) {
    throw new Error(
      cleanString(
        data?.error || data?.message || res?.text || "verify_login_failed",
        260
      ) || "verify_login_failed"
    );
  }

  const nextToken = cleanString(
    data?.sessionToken ||
      data?.token ||
      data?.accessToken ||
      data?.session?.token ||
      data?.data?.sessionToken ||
      data?.data?.token ||
      "",
    1200
  );

  if (nextToken) writeSessionToken(nextToken);

  const user = normalizeUser(extractMember(data));
  persistAuthUser(user || null);

  dispatchAuthChanged({
    type: "verify",
    loggedIn: true,
    user: user || null,
  });

  return {
    ok: true,
    user: user || null,
    redirectPath: cleanString(data?.redirectPath || redirectPath, 220),
    raw: data,
  };
}

export async function logoutCurrentMember() {
  let remoteError = "";

  try {
    const res = await fetchFromCandidates(
      ["/api/auth/logout", "/api/auth/signout"],
      { method: "POST", body: {}, keepalive: true }
    );

    if (!res?.ok && res?.status && ![401, 403, 404, 204].includes(Number(res.status))) {
      remoteError =
        cleanString(
          res?.data?.error ||
            res?.data?.message ||
            res?.text ||
            "logout_remote_failed",
          260
        ) || "logout_remote_failed";
    }
  } catch (err) {
    remoteError = cleanString(err?.message || "logout_remote_failed", 260);
  }

  clearLocalAuthState();

  dispatchAuthChanged({
    type: "logout",
    loggedIn: false,
    reason: remoteError || "logged_out",
  });

  return {
    ok: !remoteError,
    error: remoteError || "",
  };
}

export async function fetchMemberById(memberId) {
  const id = cleanString(memberId, 160);
  if (!id) return null;

  const res = await fetchFromCandidates(
    identityCandidates(
      `/api/member/${encodeURIComponent(id)}`,
      `/api/member/by-id?id=${encodeURIComponent(id)}`,
      `/members/${encodeURIComponent(id)}`
    ),
    { method: "GET" }
  );

  if (!res?.ok) return null;
  return normalizeUser(extractMember(res.data));
}

export async function fetchMemberByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const res = await fetchFromCandidates(
    identityCandidates(
      `/api/member/by-email?email=${encodeURIComponent(normalized)}`,
      `/api/member?email=${encodeURIComponent(normalized)}`,
      `/members/by-email?email=${encodeURIComponent(normalized)}`
    ),
    { method: "GET" }
  );

  if (!res?.ok) return null;
  return normalizeUser(extractMember(res.data));
}

export async function registerOrLoginMember(payload = {}) {
  const body = {
    email: normalizeEmail(payload.email),
    name: cleanString(payload.name || "", 160),
    phone: cleanString(payload.phone || "", 80),
    locale: cleanString(payload.locale || "sv-SE", 32),
    currency: cleanString(payload.currency || "SEK", 16),
  };

  if (!body.email) {
    throw new Error("missing_email");
  }

  const res = await fetchFromCandidates(
    identityCandidates(
      "/api/member/register-or-login",
      "/api/member/upsert",
      "/members/register-or-login"
    ),
    {
      method: "POST",
      body,
    }
  );

  if (!res?.ok) {
    throw new Error(
      cleanString(
        res?.data?.error || res?.data?.message || res?.text || "member_upsert_failed",
        260
      ) || "member_upsert_failed"
    );
  }

  return normalizeUser(extractMember(res.data));
}

export async function patchMember(memberId, payload = {}) {
  const id = cleanString(memberId, 160);
  if (!id) throw new Error("missing_member_id");

  const body = {
    ...payload,
    name: cleanString(payload?.name || "", 160),
    phone: cleanString(payload?.phone || "", 80),
    email: payload?.email ? normalizeEmail(payload.email) : undefined,
  };

  const res = await fetchFromCandidates(
    identityCandidates(
      `/api/member/${encodeURIComponent(id)}`,
      `/members/${encodeURIComponent(id)}`
    ),
    {
      method: "PATCH",
      body,
    }
  );

  if (!res?.ok) {
    throw new Error(
      cleanString(
        res?.data?.error || res?.data?.message || res?.text || "member_patch_failed",
        260
      ) || "member_patch_failed"
    );
  }

  return normalizeUser(extractMember(res.data));
}

export async function fetchMemberPackage(memberId) {
  const id = cleanString(memberId, 160);
  if (!id) return null;

  const res = await fetchFromCandidates(
    identityCandidates(
      `/api/member/${encodeURIComponent(id)}/package`,
      `/members/${encodeURIComponent(id)}/package`
    ),
    { method: "GET" }
  );

  if (!res?.ok) return null;
  return res.data?.package || res.data?.data || res.data || null;
}

export async function fetchMemberPresence(memberId) {
  const id = cleanString(memberId, 160);
  if (!id) return null;

  const res = await fetchFromCandidates(
    identityCandidates(
      `/api/member/${encodeURIComponent(id)}/presence`,
      `/members/${encodeURIComponent(id)}/presence`
    ),
    { method: "GET" }
  );

  if (!res?.ok) return null;
  return res.data?.presence || res.data?.data || res.data || null;
}

export function readCachedAuthUser() {
  const raw = safeGetLS(AUTH_USER_KEY, "");
  return readJson(raw);
}

export function readCachedAuthState() {
  const raw = safeGetLS(AUTH_STATE_KEY, "");
  return readJson(raw);
}

export function readCurrentSessionToken() {
  return readSessionToken();
}