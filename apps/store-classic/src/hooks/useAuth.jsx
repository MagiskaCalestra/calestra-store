// D:\WebProjects\Calestra\apps\store-classic\src\hooks\useAuth.jsx
import React from "react";
import {
  fetchCurrentMember,
  logoutCurrentMember,
  readCachedAuthUser,
  readCachedAuthState,
  readCurrentSessionToken,
} from "../core/member/memberClient.js";

export default function useAuth() {
  const cachedUser = React.useMemo(() => readCachedAuthUser(), []);
  const cachedState = React.useMemo(() => readCachedAuthState(), []);

  const [loading, setLoading] = React.useState(true);
  const [loggedIn, setLoggedIn] = React.useState(!!cachedState?.loggedIn);
  const [user, setUser] = React.useState(cachedUser || null);
  const [hasSessionToken, setHasSessionToken] = React.useState(
    !!readCurrentSessionToken()
  );
  const [status, setStatus] = React.useState(
    cachedState?.loggedIn ? "ok" : "idle"
  );
  const [error, setError] = React.useState("");

  const refresh = React.useCallback(async () => {
    setHasSessionToken(!!readCurrentSessionToken());

    try {
      const res = await fetchCurrentMember();

      if (res?.ok) {
        setLoggedIn(true);
        setUser(res.user || res.member || null);
        setStatus("ok");
        setError("");
      } else if (res?.error === "missing_session") {
        setLoggedIn(false);
        setUser(null);
        setStatus("missing_session");
        setError("");
      } else {
        setLoggedIn(false);
        setUser(null);
        setStatus("error");
        setError(res?.error || "auth_refresh_failed");
      }
    } catch (err) {
      setLoggedIn(false);
      setUser(null);
      setStatus("error");
      setError(err?.message || "auth_refresh_failed");
    } finally {
      setHasSessionToken(!!readCurrentSessionToken());
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await refresh();
    })();

    function onFocus() {
      refresh();
    }

    function onAuthChanged() {
      refresh();
    }

    function onStorage(e) {
      if (!e?.key) return;
      if (
        e.key === "cw.sessionToken" ||
        e.key === "cw.auth.user" ||
        e.key === "cw.auth.state"
      ) {
        refresh();
      }
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener("cw:member-auth-changed", onAuthChanged);
    window.addEventListener("cw:identity-sync", onAuthChanged);
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("cw:member-auth-changed", onAuthChanged);
      window.removeEventListener("cw:identity-sync", onAuthChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const logout = React.useCallback(async () => {
    setLoading(true);
    try {
      await logoutCurrentMember();
    } finally {
      await refresh();
    }
  }, [refresh]);

  return {
    loading,
    loggedIn,
    user,
    hasSessionToken,
    status,
    error,
    refresh,
    logout,
  };
}