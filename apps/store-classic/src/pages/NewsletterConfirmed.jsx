import React from "react";
import { Link } from "react-router-dom";

export default function NewsletterConfirmed() {
  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: "28px 18px" }}>
      <div
        style={{
          width: "min(880px, 92vw)",
          background: "rgba(255,255,255,.92)",
          border: "1px solid rgba(15,23,42,.10)",
          borderRadius: "22px",
          boxShadow: "0 30px 90px rgba(0,0,0,.12)",
          padding: "26px 26px 20px",
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 44, letterSpacing: -1 }}>
            Tack — du är bekräftad
          </h1>
          <span
            aria-hidden
            style={{
              width: 34,
              height: 34,
              display: "inline-grid",
              placeItems: "center",
              borderRadius: 10,
              background: "rgba(34,197,94,.18)",
              border: "1px solid rgba(34,197,94,.35)",
              fontWeight: 900,
            }}
          >
            ✅
          </span>
        </div>

        <p style={{ marginTop: 10, marginBottom: 18, maxWidth: 720, opacity: 0.9, fontWeight: 800 }}>
          Din prenumeration är nu aktiv. Du kommer få Magiska Nyheter när nya drops släpps,
          Surprise Boxes öppnas, och när Calestra tar nästa steg.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            to="/shop"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#0b1220",
              color: "#fff",
              fontWeight: 900,
              textDecoration: "none",
              border: "1px solid rgba(2,6,23,.25)",
            }}
          >
            Till butiken
          </Link>

          <Link
            to="/"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#fff",
              color: "#0b1220",
              fontWeight: 900,
              textDecoration: "none",
              border: "1px solid rgba(2,6,23,.18)",
            }}
          >
            Till startsidan
          </Link>
        </div>

        <p style={{ marginTop: 14, fontSize: 12, opacity: 0.7, fontWeight: 800 }}>
          Om du inte begärde detta kan du ignorera mailet — eller avregistrera när som helst via en länk i utskicken.
        </p>
      </div>
    </div>
  );
}