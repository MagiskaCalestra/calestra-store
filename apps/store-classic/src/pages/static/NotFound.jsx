// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TT } from "../../i18n/tt.js";

export default function NotFound() {
  const { t, i18n } = useTranslation();

  const title = TT(i18n, t, "notfound.title", {
    sv: "Sidan kunde inte hittas",
    en: "Page not found",
    tr: "Sayfa bulunamadı",
  });

  const text = TT(i18n, t, "notfound.text", {
    sv: "Kontrollera länken eller gå tillbaka till butiken.",
    en: "Check the link or go back to the shop.",
    tr: "Bağlantıyı kontrol edin veya mağazaya geri dönün.",
  });

  const back = TT(i18n, t, "notfound.back", {
    sv: "Till butiken",
    en: "Back to shop",
    tr: "Mağazaya dön",
  });

  return (
    <main className="container" style={{ padding: "40px 16px", textAlign: "center" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 1000 }}>{title}</h1>
      <p style={{ marginTop: "10px", color: "#64748b", fontWeight: 700 }}>{text}</p>

      <Link
        to="/shop"
        style={{
          display: "inline-flex",
          marginTop: "18px",
          padding: "10px 16px",
          borderRadius: "999px",
          background: "#4b6bfa",
          color: "#fff",
          fontWeight: 900,
          textDecoration: "none",
        }}
      >
        {back}
      </Link>
    </main>
  );
}