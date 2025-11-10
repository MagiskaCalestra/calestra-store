// apps/web/src/core/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LS_USER = "cw_user";
const LS_PUBLIC = "cw_public_mode";

export const Roles = /** @type {const} */ ({
  viewer: "viewer",
  editor: "editor",
  manager: "manager",
  admin: "admin",
});

const defaultUser = null;

const AuthContext = createContext({
  user: defaultUser,
  role: Roles.viewer,
  publicMode: false,
  login: /** @type {(u:any)=>void} */(() => {}),
  logout: /** @type {()=>void} */(() => {}),
  setRole: /** @type {(r:keyof typeof Roles)=>void} */(() => {}),
  togglePublicMode: /** @type {()=>void} */(() => {}),
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_USER) || "null"); } catch { return null; }
  });
  const [publicMode, setPublicMode] = useState(() => localStorage.getItem(LS_PUBLIC) === "1");

  const role = user?.role || Roles.viewer;

  useEffect(() => {
    if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
    else localStorage.removeItem(LS_USER);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(LS_PUBLIC, publicMode ? "1" : "0");
  }, [publicMode]);

  const value = useMemo(() => ({
    user,
    role,
    publicMode,
    login(u) { setUser(u); },
    logout() { setUser(null); },
    setRole(r) { setUser(u => (u ? { ...u, role: r } : { name: "Dev", role: r })); },
    togglePublicMode() { setPublicMode(v => !v); },
  }), [user, role, publicMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Enkel gate: returnerar true om användarens roll uppfyller kravet.
 * @param {keyof typeof Roles} minRole
 */
export function hasMinRole(role, minRole = Roles.viewer) {
  const order = [Roles.viewer, Roles.editor, Roles.manager, Roles.admin];
  return order.indexOf(role) >= order.indexOf(minRole);
}
