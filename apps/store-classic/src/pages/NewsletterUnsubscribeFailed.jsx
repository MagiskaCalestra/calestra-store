// D:\WebProjects\Calestra\apps\store-classic\src\pages\NewsletterUnsubscribeFailed.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function NewsletterUnsubscribeFailed() {
  return (
    <div style={{ padding: "32px 16px", maxWidth: 720, margin: "0 auto" }}>
      <div
        style={{
          borderRadius: 18,
          padding: 18,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900, letterSpacing: 0.6 }}>
          NEWSLETTER
        </div>

        <h1 style={{ margin: "10px 0 8px", fontSize: 28, lineHeight: 1.1 }}>
          Kunde inte avsluta ❌
        </h1>

        <p style={{ margin: 0, opacity: 0.9, fontWeight: 800 }}>
          Länken verkar vara ogiltig eller saknar token.
        </p>

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            to="/shop"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#fff",
              color: "#0b1220",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            Till butiken
          </Link>

          <Link
            to="/contact"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "transparent",
              color: "#fff",
              fontWeight: 900,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            Kontakta oss
          </Link>
        </div>

        <p style={{ marginTop: 14, fontSize: 12, opacity: 0.7, fontWeight: 800 }}>
          Tips: testa med en ny unsubscribe-länk från nästa mail (eller använd token från D1).
        </p>
      </div>
    </div>
  );
}