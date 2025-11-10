import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import sv_portal from "./locales/portal.sv.json";
import en_portal from "./locales/portal.en.json";
import tr_portal from "./locales/portal.tr.json";

/**
 * Minimal i18n:
 *  - Språk: sv / en / tr
 *  - Namespace-stöd via useTranslation("portal")
 *  - t("key", { var: "X" }) med enkel interpolation
 */

const dictionaries = {
  sv: { portal: sv_portal },
  en: { portal: en_portal },
  tr: { portal: tr_portal },
};

const I18nCtx = createContext({
  language: "sv",
  setLanguage: () => {},
  t: (k, opt) => k,
});

function deepGet(obj, path) {
  return path.split(".").reduce((o, k) => (o && k in o ? o[k] : undefined), obj);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return String(str).replace(/\{\s*([^}]+)\s*\}/g, (_, m) =>
    vars[m] !== undefined ? String(vars[m]) : `{${m}}`
  );
}

export function I18nProvider({ children, defaultLang = "sv" }) {
  const [language, setLanguage] = useState(defaultLang);

  const value = useMemo(() => {
    function tWithNs(ns, key, opt) {
      const dict = dictionaries[language]?.[ns] || {};
      const raw = deepGet(dict, key) ?? key;
      return typeof raw === "string" ? interpolate(raw, opt) : raw;
    }
    function t(key, opt) {
      // fallback-ns: portal
      return tWithNs("portal", key, opt);
    }
    function changeLanguage(code) {
      setLanguage(code);
    }
    return { language, setLanguage: changeLanguage, t, tWithNs };
  }, [language]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}

export function useTranslation(ns = "portal") {
  const ctx = useI18n();
  const t = useCallback((k, opt) => ctx.tWithNs(ns, k, opt), [ctx, ns]);
  return { t, i18n: { language: ctx.language, changeLanguage: ctx.setLanguage } };
}
