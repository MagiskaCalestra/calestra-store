// D:\WebProjects\Calestra\apps\store-classic\src\context\AuthContext.jsx
import React from "react";

const AuthContext = React.createContext(null);

const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_API_URL || import.meta.env.VITE_PUBLIC_API_BASE)) ||
  "/api";

const SESSION_KEYS = [
  "cw.sessionToken",
  "cw.session.token",
  "cw.auth.sessionToken",
  "cw.identity.sessionToken",
];

const AUTH_REFRESH_MIN_MS = 1500;

function cleanString(value, max = 400) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function noSlash(v) {
  return String(v || "").replace(/\/+$/, "");
}

function buildUrl(path) {
  const base = noSlash(API_BASE || "/api");
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function readSessionToken() {
  try {
    if (typeof window === "undefined") return "";
    for (const key of SESSION_KEYS) {
      const v = cleanString(window.localStorage.getItem(key) || "", 800);
      if (v) return v;
    }
  } catch {}
  return "";
}

function writeSessionToken(token) {
  const value = cleanString(token, 800);
  try {
    if (typeof window === "undefined") return "";
    if (!value) {
      clearSessionToken();
      return "";
    }
    for (const key of SESSION_KEYS) {
      window.localStorage.setItem(key, value);
    }
  } catch {}
  return value;
}

function clearSessionToken() {
  try {
    if (typeof window === "undefined") return;
    for (const key of SESSION_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {}
}

async function readJsonSafe(res) {
  const text = await res.text().catch(() => "");
  if (!text) {
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      text: "",
      isHtml: false,
    };
  }

  try {
    return {
      ok: res.ok,
      status: res.status,
      data: JSON.parse(text),
      text,
      isHtml: false,
    };
  } catch {
    const lowered = String(text).toLowerCase();
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      text,
      isHtml:
        lowered.includes("<!doctype html") ||
        lowered.includes("<html") ||
        lowered.includes("<head") ||
        lowered.includes("<body"),
    };
  }
}

async function authFetch(path, options = {}) {
  const token = readSessionToken();

  const headers = {
    accept: "application/json",
    ...(options.body ? { "content-type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers["X-Session-Token"] = token;
  }

  const res = await fetch(buildUrl(path), {
    method: options.method || "GET",
    credentials: "include",
    cache: "no-store",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return readJsonSafe(res);
}

export function AuthProvider({ children }) {
  const [booting, setBooting] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [member, setMember] = React.useState(null);

  const refreshInFlightRef = React.useRef(false);
  const refreshPromiseRef = React.useRef(null);
  const lastRefreshAtRef = React.useRef(0);

  const applyAuthPayload = React.useCallback((payload) => {
    const nextUser = payload?.user || null;
    const nextProfile = payload?.profile || null;
    const nextMember = payload?.member || null;

    if (payload?.sessionToken) {
      writeSessionToken(payload.sessionToken);
    }

    setUser(nextUser);
    setProfile(nextProfile);
    setMember(nextMember);
    setIsAuthenticated(!!nextUser);
  }, []);

  const clearAuth = React.useCallback(() => {
    clearSessionToken();
    setUser(null);
    setProfile(null);
    setMember(null);
    setIsAuthenticated(false);
  }, []);

  const refresh = React.useCallback(
    async ({ force = false } = {}) => {
      const now = Date.now();

      if (!force && now - lastRefreshAtRef.current < AUTH_REFRESH_MIN_MS) {
        return {
          ok: isAuthenticated,
          skipped: true,
        };
      }

      if (refreshInFlightRef.current && refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      lastRefreshAtRef.current = now;
      refreshInFlightRef.current = true;

      const p = (async () => {
        try {
          const parsed = await authFetch("/auth/me", {
            method: "GET",
          });

          if (parsed.isHtml) {
            clearAuth();
            return {
              ok: false,
              error: "api_route_returned_html",
              detail: "Expected JSON from /api/auth/me but got HTML instead.",
            };
          }

          if (parsed.status === 401 || parsed.data?.error === "not_authenticated") {
            clearAuth();
            return {
              ok: false,
              error: parsed.data?.error || "not_authenticated",
            };
          }

          if (!parsed.ok || !parsed.data?.ok) {
            return {
              ok: false,
              error: parsed.data?.error || parsed.text || "auth_refresh_failed",
            };
          }

          applyAuthPayload(parsed.data);
          return { ok: true, ...parsed.data };
        } catch (err) {
          return {
            ok: false,
            error: String(err?.message || err || "auth_me_failed"),
          };
        } finally {
          setBooting(false);
          refreshInFlightRef.current = false;
          refreshPromiseRef.current = null;
        }
      })();

      refreshPromiseRef.current = p;
      return p;
    },
    [applyAuthPayload, clearAuth, isAuthenticated]
  );

  React.useEffect(() => {
    refresh({ force: true });
  }, [refresh]);

  React.useEffect(() => {
    function onMemberAuthChanged() {
      refresh({ force: true });
    }

    function onFocus() {
      refresh();
    }

    function onStorage(e) {
      const key = String(e?.key || "");
      if (!key) return;
      if (
        key === "cw.sessionToken" ||
        key === "cw.session.token" ||
        key === "cw.auth.sessionToken" ||
        key === "cw.identity.sessionToken" ||
        key === "cw.auth.user" ||
        key === "cw.auth.state"
      ) {
        refresh();
      }
    }

    window.addEventListener("cw:member-auth-changed", onMemberAuthChanged);
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("cw:member-auth-changed", onMemberAuthChanged);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const register = React.useCallback(
    async ({ name, email, password, locale, currency }) => {
      const parsed = await authFetch("/auth/register-password", {
        method: "POST",
        body: {
          name,
          email,
          password,
          locale: locale || "sv-SE",
          currency: currency || "SEK",
          redirectPath: "/mitt-calestra",
        },
      });

      if (parsed.isHtml) {
        return {
          ok: false,
          error: "api_route_returned_html",
        };
      }

      if (!parsed.ok || !parsed.data?.ok) {
        return {
          ok: false,
          error:
            parsed.data?.error ||
            parsed.data?.detail ||
            parsed.text ||
            "register_failed",
        };
      }

      applyAuthPayload(parsed.data);

      try {
        window.dispatchEvent(
          new CustomEvent("cw:member-auth-changed", {
            detail: { ok: true, source: "register-password" },
          })
        );
      } catch {}

      return { ok: true, ...parsed.data };
    },
    [applyAuthPayload]
  );

  const login = React.useCallback(
    async ({ email, password }) => {
      const parsed = await authFetch("/auth/login-password", {
        method: "POST",
        body: {
          email,
          password,
          redirectPath: "/mitt-calestra",
        },
      });

      if (parsed.isHtml) {
        return {
          ok: false,
          error: "api_route_returned_html",
        };
      }

      if (!parsed.ok || !parsed.data?.ok) {
        return {
          ok: false,
          error:
            parsed.data?.error ||
            parsed.data?.detail ||
            parsed.text ||
            "login_failed",
        };
      }

      applyAuthPayload(parsed.data);

      try {
        window.dispatchEvent(
          new CustomEvent("cw:member-auth-changed", {
            detail: { ok: true, source: "login-password" },
          })
        );
      } catch {}

      return { ok: true, ...parsed.data };
    },
    [applyAuthPayload]
  );

  const logout = React.useCallback(async () => {
    try {
      await authFetch("/auth/logout", {
        method: "POST",
      });
    } catch {}

    clearAuth();

    try {
      window.dispatchEvent(
        new CustomEvent("cw:member-auth-changed", {
          detail: { ok: false, loggedOut: true },
        })
      );
    } catch {}

    return { ok: true };
  }, [clearAuth]);

  const value = React.useMemo(
    () => ({
      booting,
      isAuthenticated,
      user,
      profile,
      member,
      refresh,
      register,
      login,
      logout,
    }),
    [
      booting,
      isAuthenticated,
      user,
      profile,
      member,
      refresh,
      register,
      login,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

export default AuthContext;