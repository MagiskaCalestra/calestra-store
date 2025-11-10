import React, { useEffect } from "react";
import i18n from "i18next";
import { useParams } from "react-router-dom";

export default function LangRoute({ children }){
  const { lang } = useParams(); // matchar :lang
  useEffect(() => {
    if (!lang) return;
    const code = String(lang).toLowerCase();
    if (["sv","en","tr"].includes(code)) {
      try { i18n.changeLanguage(code); localStorage.setItem("lang", code); } catch {}
      document.documentElement.setAttribute("lang", code);
      document.documentElement.setAttribute("dir", ["ar","he","fa","ur"].includes(code) ? "rtl" : "ltr");
    }
  }, [lang]);

  return children ?? null;
}
