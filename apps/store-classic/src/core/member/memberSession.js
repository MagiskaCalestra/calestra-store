// D:\WebProjects\Calestra\apps\store-classic\src\core\member\memberSession.js

import { cleanString, safeGetLS, safeSetLS, safeRemoveLS } from "./memberMeta.js";

export const MEMBER_SESSION_KEYS = [
  "cw.sessionToken",
  "cw.session.token",
  "cw.auth.sessionToken",
  "cw.identity.sessionToken",
];

export function readSessionToken() {
  for (const key of MEMBER_SESSION_KEYS) {
    const value = cleanString(safeGetLS(key, ""), 320);
    if (value) return value;
  }
  return "";
}

export function writeSessionToken(token) {
  const value = cleanString(token, 320);
  if (!value) {
    clearSessionToken();
    return "";
  }

  for (const key of MEMBER_SESSION_KEYS) {
    safeSetLS(key, value);
  }

  return value;
}

export function clearSessionToken() {
  for (const key of MEMBER_SESSION_KEYS) {
    safeRemoveLS(key);
  }
}

export function buildSessionHeaders(extraHeaders = {}) {
  const token = readSessionToken();

  if (!token) {
    return {
      ...extraHeaders,
    };
  }

  return {
    ...extraHeaders,
    "X-Session-Token": token,
  };
}