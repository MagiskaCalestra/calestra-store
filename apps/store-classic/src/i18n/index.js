// D:\WebProjects\Calestra\apps\store-classic\src\i18n\index.js

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import svTrans from "../locales/sv/translation.sv.json";
import svHeader from "../locales/sv/pages/header.sv.json";
import svDict from "./legacy/dict.sv.json";
import svJson from "./legacy/sv.json";

import enTrans from "../locales/en/translation.en.json";
import enHeader from "../locales/en/pages/header.en.json";
import enDict from "./legacy/dict.en.json";
import enJson from "./legacy/en.json";

import trTrans from "../locales/tr/translation.tr.json";
import trHeader from "../locales/tr/pages/header.tr.json";

import { STORE_I18N_PATCH } from "./storePatch.js";

const SUPPORTED_LANGS = ["sv", "en", "tr"];
const DEFAULT_LANG = "sv";

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(...sources) {
  const out = {};

  for (const src of sources) {
    if (!isPlainObject(src)) continue;

    for (const [key, value] of Object.entries(src)) {
      if (isPlainObject(value) && isPlainObject(out[key])) {
        out[key] = deepMerge(out[key], value);
      } else if (isPlainObject(value)) {
        out[key] = deepMerge(value);
      } else {
        out[key] = value;
      }
    }
  }

  return out;
}

function normalizeLang(lang) {
  const value = String(lang || "").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(value) ? value : DEFAULT_LANG;
}

function getPatch(lang) {
  return isPlainObject(STORE_I18N_PATCH?.[lang]) ? STORE_I18N_PATCH[lang] : {};
}

const resources = {
  sv: {
    translation: deepMerge(
      svJson,
      svDict,
      svTrans,
      svHeader,
      getPatch("sv")
    ),
  },
  en: {
    translation: deepMerge(
      enJson,
      enDict,
      enTrans,
      enHeader,
      getPatch("en")
    ),
  },
  tr: {
    translation: deepMerge(
      trTrans,
      trHeader,
      getPatch("tr")
    ),
  },
};

function syncDocumentLang(lang) {
  try {
    if (typeof document === "undefined") return;

    const safeLang = normalizeLang(lang);
    document.documentElement.lang = safeLang;
    document.documentElement.dir = "ltr";
  } catch {}
}

function detectInitialLang() {
  try {
    if (typeof window === "undefined") return DEFAULT_LANG;

    const stored =
      window.localStorage?.getItem("cw.lang") ||
      window.localStorage?.getItem("lang");

    if (SUPPORTED_LANGS.includes(stored)) return stored;

    return normalizeLang(window.navigator?.language);
  } catch {
    return DEFAULT_LANG;
  }
}

const initialLang = detectInitialLang();

syncDocumentLang(initialLang);

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: DEFAULT_LANG,
  supportedLngs: SUPPORTED_LANGS,
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
  returnObjects: false,
  cleanCode: true,
  nonExplicitSupportedLngs: true,
});

i18n.on("languageChanged", (lng) => {
  const safeLang = normalizeLang(lng);

  try {
    if (typeof window !== "undefined") {
      window.localStorage?.setItem("cw.lang", safeLang);
      window.localStorage?.setItem("lang", safeLang);
    }
  } catch {}

  syncDocumentLang(safeLang);
});

export default i18n;