// D:\WebProjects\Calestra\apps\store-classic\src\context\LangContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import i18next from "i18next";

/**
 * ✅ LangContext v2 (BRO mellan UI och i18next)
 * - LangContext speglar i18next (samma källa)
 * - setLang() anropar i18next.changeLanguage()
 * - när i18next ändrar språk -> LangContext uppdaterar state
 */

const STORAGE_KEY = "cw:lang";

const LangContext = createContext({
  lang: "sv",
  setLang: () => {},
  t: (k, p) => (typeof k === "string" ? k : ""),
  dir: "ltr",
});

function normalizeLang(next) {
  const b = String(next || "sv").slice(0, 2).toLowerCase();
  return b === "sv" || b === "en" || b === "tr" ? b : "sv";
}

export function LangProvider({ initial = undefined, children }) {
  const [lang, setLangState] = useState(() => {
    if (initial) return normalizeLang(initial);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeLang(saved);
    } catch {}

    try {
      const l = i18next.language;
      if (l) return normalizeLang(l);
    } catch {}

    const nav = (navigator.language || "sv").slice(0, 2).toLowerCase();
    return normalizeLang(nav);
  });

  useEffect(() => {
    const L = normalizeLang(lang);

    try {
      localStorage.setItem(STORAGE_KEY, L);
    } catch {}

    const el = document.documentElement;
    el.setAttribute("lang", L);
    el.setAttribute("dir", "ltr");

    try {
      if (normalizeLang(i18next.language) !== L) {
        i18next.changeLanguage(L).catch(() => {});
      }
    } catch {}
  }, [lang]);

  useEffect(() => {
    function onChanged(newLang) {
      const L = normalizeLang(newLang);
      setLangState(L);
      try {
        localStorage.setItem(STORAGE_KEY, L);
      } catch {}
      const el = document.documentElement;
      el.setAttribute("lang", L);
      el.setAttribute("dir", "ltr");
    }

    try {
      i18next.on("languageChanged", onChanged);
    } catch {}

    try {
      const L = normalizeLang(i18next.language);
      if (L && L !== lang) setLangState(L);
    } catch {}

    return () => {
      try {
        i18next.off("languageChanged", onChanged);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = (next) => {
    const L = normalizeLang(next);
    setLangState(L);
    try {
      i18next.changeLanguage(L).catch(() => {});
    } catch {}
  };

  const dir = "ltr";

  const t = useMemo(() => {
    return function translate(key, params) {
      const k = String(key || "");
      try {
        const out = i18next.t(k, params || {});
        return typeof out === "string" ? out : k;
      } catch {
        return k;
      }
    };
  }, []);

  const value = useMemo(() => ({ lang, setLang, t, dir }), [lang, t, dir]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
