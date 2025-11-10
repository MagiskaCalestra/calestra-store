// apps/web/src/components/LanguageSwitcher.jsx
import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Simple language switcher for sv / en / tr
 * - No store-i18n mixing
 * - Accessibility-friendly <select>
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const lang = i18n.language || "sv";

  function onChange(e) {
    const next = e.target.value;
    i18n.changeLanguage(next);
  }

  return (
    <label aria-label="Language selector" style={{ display: "inline-block" }}>
      <select
        value={lang}
        onChange={onChange}
        aria-haspopup="listbox"
        aria-label="Change language"
        style={{
          background: "transparent",
          color: "#fff",
          border: "1px solid #ffffff40",
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
        }}
      >
        <option value="sv">SV</option>
        <option value="en">EN</option>
        <option value="tr">TR</option>
      </select>
    </label>
  );
}
