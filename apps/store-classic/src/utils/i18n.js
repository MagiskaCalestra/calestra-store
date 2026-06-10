// src/utils/i18n.js
import { useEffect } from "react";
import { useLang } from "../context/LangContext.jsx";

// 1) Hook för dokument-titel/metataggar
export function useMetaTitle(keyOrString, vars = {}) {
  const { t } = useLang();
  useEffect(() => {
    const str = keyOrString.includes(".") ? t(keyOrString, vars) : keyOrString;
    document.title = str;
  }, [keyOrString, JSON.stringify(vars), t]);
}

// 2) Hjälpare att plocka fält per språk (om du inte vill importera från context)
export function pickTx(obj, lang, fallback) {
  return (obj?.[lang] ?? obj?.[fallback ?? "sv"] ?? "");
}
