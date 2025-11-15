// init i18n först (använd lokala sökvägen eller aliasen, men bara EN av dem)
import "./i18n/index.js"; // ✅ behåll denna
import i18n from "i18next";

import React, { useEffect, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import App from "./App.jsx";

import "./styles.css";
import "./styles/progress.css";

import { LangProvider, useLang } from "./context/LangContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { CurrencyProvider } from "./context/CurrencyContext.jsx";

function langFromPathname(pathname) {
  const m = pathname.match(/^\/(sv|en|tr)(?:\/|$)/i);
  return m ? m[1].toLowerCase() : null;
}
function detectInitialLang() {
  try {
    const u = langFromPathname(window.location.pathname);
    if (u) return u;
    const s = localStorage.getItem("lang");
    if (s) return s;
    const nav = (navigator.language || "sv").slice(0, 2).toLowerCase();
    if (["sv", "en", "tr"].includes(nav)) return nav;
  } catch {}
  return "sv";
}
function detectBasename() {
  const l = langFromPathname(window.location.pathname);
  return l ? `/${l}` : "";
}
function useHtmlLangSync(currentLang) {
  useEffect(() => {
    const lang = currentLang || detectInitialLang();
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", ["ar", "he", "fa", "ur"].includes(lang) ? "rtl" : "ltr");
    try { localStorage.setItem("lang", lang); } catch {}
  }, [currentLang]);

  useEffect(() => {
    const onChanged = (lng) => {
      const html = document.documentElement;
      html.setAttribute("lang", lng);
      html.setAttribute("dir", ["ar", "he", "fa", "ur"].includes(lng) ? "rtl" : "ltr");
      try { localStorage.setItem("lang", lng); } catch {}
    };
    i18n.on("languageChanged", onChanged);
    return () => i18n.off("languageChanged", onChanged);
  }, []);
}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
function HtmlLangSync() {
  const { lang } = useLang();
  useHtmlLangSync(lang);
  return null;
}
function Root() {
  useEffect(() => {
    const initLang = detectInitialLang();
    if (i18n.language !== initLang) i18n.changeLanguage(initLang);
  }, []);
  const basename = detectBasename();
  return (
    <LangProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <BrowserRouter basename={basename}>
            <HtmlLangSync />
            <ScrollToTop />
            <Suspense fallback={null}>
              <App />
            </Suspense>
          </BrowserRouter>
        </CurrencyProvider>
      </ThemeProvider>
    </LangProvider>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
