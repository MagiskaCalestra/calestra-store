// apps/web/src/i18n/index.jsx
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Portal-only dictionaries (do NOT mix with Store)
import sv from "./locales/portal.sv.json";
import en from "./locales/portal.en.json";
import tr from "./locales/portal.tr.json";

i18n.use(initReactI18next).init({
  resources: { sv: { translation: sv }, en: { translation: en }, tr: { translation: tr } },
  lng: "sv",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
