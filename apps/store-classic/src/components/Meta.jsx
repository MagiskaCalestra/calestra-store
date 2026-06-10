// D:\WebProjects\Calestra\apps\store-classic\src\components\Meta.jsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

const LOCALE_BY_LANG = {
  sv: "sv_SE",
  en: "en_US",
  tr: "tr_TR",
};

function getShortLang(i18n) {
  return String(i18n?.resolvedLanguage || i18n?.language || "sv")
    .slice(0, 2)
    .toLowerCase();
}

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) return raw;

  try {
    if (typeof window !== "undefined") {
      return new URL(raw, window.location.origin).toString();
    }
  } catch {}

  return raw;
}

export default function Meta({
  title,
  description,
  image,
  url,
  locale,
  siteName = "Calestra World",
}) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = getShortLang(i18n);
    const resolvedLocale = locale || LOCALE_BY_LANG[lang] || "sv_SE";
    const resolvedUrl =
      normalizeUrl(url) ||
      (typeof window !== "undefined" ? window.location.href : "");
    const resolvedImage = normalizeUrl(image);

    if (title) document.title = String(title);

    try {
      document.documentElement.lang = lang;
    } catch {}

    const ensure = (name, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);

      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }

      return el;
    };

    const set = (name, content, attr = "name") => {
      if (content == null || String(content).trim() === "") return;
      ensure(name, attr).setAttribute("content", String(content));
    };

    set("description", description);

    set("og:title", title, "property");
    set("og:description", description, "property");
    set("og:type", "website", "property");
    set("og:site_name", siteName, "property");
    set("og:locale", resolvedLocale, "property");

    if (resolvedUrl) set("og:url", resolvedUrl, "property");
    if (resolvedImage) set("og:image", resolvedImage, "property");

    set("twitter:card", resolvedImage ? "summary_large_image" : "summary");
    set("twitter:title", title);
    set("twitter:description", description);

    if (resolvedImage) set("twitter:image", resolvedImage);

    if (resolvedUrl) {
      let link = document.querySelector('link[rel="canonical"]');

      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }

      link.setAttribute("href", resolvedUrl);
    }
  }, [title, description, image, url, locale, siteName, i18n]);

  return null;
}