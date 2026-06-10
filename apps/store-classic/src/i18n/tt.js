// D:\WebProjects\Calestra\apps\store-classic\src\i18n\tt.js

/**
 * TT = Translate with safe fallback handling
 *
 * Priority:
 * 1. i18n key (om finns och inte är tom)
 * 2. fallbackByLang[exact lang]
 * 3. fallbackByLang[short lang]
 * 4. fallbackByLang.sv → en → tr
 * 5. fallback string
 * 6. tom sträng
 */

function normalizeLang(lang) {
  const value = String(lang || "sv")
    .toLowerCase()
    .replace("_", "-");

  return {
    full: value,
    short: value.slice(0, 2),
  };
}

function getFallback(fallbackByLang, langFull, langShort) {
  if (!fallbackByLang) return "";

  if (typeof fallbackByLang === "string") return fallbackByLang;

  if (typeof fallbackByLang === "object") {
    return (
      fallbackByLang[langFull] ||
      fallbackByLang[langShort] ||
      fallbackByLang.sv ||
      fallbackByLang.en ||
      fallbackByLang.tr ||
      ""
    );
  }

  return "";
}

export function TT(i18n, t, key, fallbackByLang, opts) {
  try {
    if (i18n && typeof i18n.exists === "function") {
      if (i18n.exists(key)) {
        const translated = t(key, opts);

        // Skydd mot tomma strängar från i18n
        if (translated !== undefined && translated !== null && translated !== "") {
          return translated;
        }
      }
    }
  } catch {
    // ignore errors
  }

  const { full, short } = normalizeLang(i18n?.language);

  return getFallback(fallbackByLang, full, short);
}