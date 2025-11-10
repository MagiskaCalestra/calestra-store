// apps/web/src/components/LanguageFX.jsx
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function LanguageFX() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const lang = (i18n.language || "en").toLowerCase();
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", "ltr");
  }, [i18n.language]);
  return null;
}
