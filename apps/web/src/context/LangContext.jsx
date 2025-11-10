import React, { createContext, useContext, useMemo, useState } from "react";

const LangCtx = createContext({ lang: "sv", setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem("lang") || "sv";
    } catch { return "sv"; }
  });

  function setLang(next) {
    try { localStorage.setItem("lang", next); } catch {}
    setLangState(next);
  }

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
