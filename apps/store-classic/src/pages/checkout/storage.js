// D:\WebProjects\Calestra\apps\store-classic\src\pages\checkout\storage.js
// apps/store-classic/src/pages/checkout/storage.js

export function safeJsonParse(raw, fallback = null) {
  if (raw == null || raw === "") return fallback;

  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function readLsValue(keys) {
  if (typeof window === "undefined") return "";

  const list = Array.isArray(keys) ? keys : [keys];

  for (const key of list) {
    if (!key) continue;

    try {
      const value = window.localStorage.getItem(key);
      if (value != null && String(value).trim()) return String(value).trim();
    } catch {
      // ignore
    }
  }

  return "";
}

export function readLsJson(keys) {
  if (typeof window === "undefined") return null;

  const list = Array.isArray(keys) ? keys : [keys];

  for (const key of list) {
    if (!key) continue;

    try {
      const raw = window.localStorage.getItem(key);
      const parsed = safeJsonParse(raw, null);

      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // ignore
    }
  }

  return null;
}

export function writeLsJson(key, value) {
  if (typeof window === "undefined" || !key) return;

  try {
    if (value === undefined) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function writeSessionJson(key, value) {
  if (typeof window === "undefined" || !key) return;

  try {
    if (value === undefined) {
      window.sessionStorage.removeItem(key);
      return;
    }

    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function readSessionJson(key) {
  if (typeof window === "undefined" || !key) return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    return safeJsonParse(raw, null);
  } catch {
    return null;
  }
}

export function removeLsKey(key) {
  if (typeof window === "undefined" || !key) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function removeSessionKey(key) {
  if (typeof window === "undefined" || !key) return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}