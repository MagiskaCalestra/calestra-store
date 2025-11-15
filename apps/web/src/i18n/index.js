import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  sv: { translation: { hello: "Hej Calestra" } },
  en: { translation: { hello: "Hello Calestra" } },
  tr: { translation: { hello: "Merhaba Calestra" } }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "sv",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
