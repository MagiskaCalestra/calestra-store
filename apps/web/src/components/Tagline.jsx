// apps/web/src/components/Tagline.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import "./Tagline.css";

/**
 * Tagline component (v2.0)
 * Displays localized emotional tagline below logo/hero.
 */
export default function Tagline() {
  const { i18n } = useTranslation();
  const lang = i18n.language || "en";

  const taglines = {
    sv: "Hitta ditt ljus inom dig.",
    en: "Feel the World Inside You.",
    tr: "DÃ¼nyayÄ± Ä°Ã§inde Hisset.",
  };

  return (
    <div className="tagline">
      <p>{taglines[lang] || taglines.en}</p>
    </div>
  );
}
