import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/**
 * Autoladda alla JSON-filer i /src/locales/**/translation.json
 * Vite expanderar dessa vid build/HMR.
 */
const modules = import.meta.glob("./locales/**/translation.json", { eager: true });

const resources = {};
for (const path in modules) {
  // path ex: "./locales/sv/translation.json"
  const m = path.match(/\.\/locales\/([^/]+)\/translation\.json$/);
  if (!m) continue;
  const lng = m[1];
  const data = modules[path]?.default || modules[path]; // Vite returnerar under .default
  resources[lng] = { translation: data };
}

// Standard: svenska. Justera om du vill.
const fallbackLng = "sv";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: fallbackLng,
    fallbackLng,
    interpolation: { escapeValue: false },
    returnObjects: true,
  });

export default i18n;
