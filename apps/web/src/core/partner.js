// apps/web/src/core/partner.js
// Läser partner-slot-data. JSON vinner över ENV. Fallerbart & säkert.

import jsonCfg from "../../partner.config.json"; // två nivåer upp

function envBool(name, def) {
  const raw = import.meta.env[name];
  if (typeof raw === "undefined" || raw === "") return def;
  return String(raw).toLowerCase() === "true";
}
function envStr(name, def) {
  const raw = import.meta.env[name];
  return typeof raw === "string" && raw.length ? raw : def;
}
function pickLang(obj, lang, def) {
  if (!obj) return def || "";
  const key = (lang || "sv").slice(0, 2);
  return obj[key] || obj["sv"] || obj["en"] || obj["tr"] || def || "";
}

/**
 * Returnerar partnerdata för aktuell lang.
 * Faller tillbaka till "disabled" om allt saknas.
 */
export function loadPartner(lang = "sv") {
  // JSON som bas
  const base = jsonCfg || {};
  // ENV overrides
  const enabled = envBool("VITE_PARTNER_ENABLED", base.enabled ?? false);
  const logo = envStr("VITE_PARTNER_LOGO", base.logo || "");
  const url = envStr("VITE_PARTNER_URL", base.url || "");
  const tracked = envStr("VITE_PARTNER_TRACK", base.tracked || "partner_generic");

  const eyebrow = pickLang(
    {
      en: envStr("VITE_PARTNER_EYEBROW_en", base.eyebrow?.en),
      sv: envStr("VITE_PARTNER_EYEBROW_sv", base.eyebrow?.sv),
      tr: envStr("VITE_PARTNER_EYEBROW_tr", base.eyebrow?.tr)
    },
    lang,
    "Featured Partner"
  );

  const title = pickLang(
    {
      en: envStr("VITE_PARTNER_TITLE_en", base.title?.en),
      sv: envStr("VITE_PARTNER_TITLE_sv", base.title?.sv),
      tr: envStr("VITE_PARTNER_TITLE_tr", base.title?.tr)
    },
    lang,
    "A partner that shares our vision"
  );

  const text = pickLang(
    {
      en: envStr("VITE_PARTNER_TEXT_en", base.text?.en),
      sv: envStr("VITE_PARTNER_TEXT_sv", base.text?.sv),
      tr: envStr("VITE_PARTNER_TEXT_tr", base.text?.tr)
    },
    lang,
    "Together we build a kinder, more magical world."
  );

  const ctaLabel = pickLang(
    {
      en: envStr("VITE_PARTNER_CTA_en", base.ctaLabel?.en),
      sv: envStr("VITE_PARTNER_CTA_sv", base.ctaLabel?.sv),
      tr: envStr("VITE_PARTNER_CTA_tr", base.ctaLabel?.tr)
    },
    lang,
    "Learn more"
  );

  return {
    enabled,
    logo,
    url,
    tracked,
    eyebrow,
    title,
    text,
    ctaLabel
  };
}
