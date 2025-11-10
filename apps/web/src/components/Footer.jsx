// apps/web/src/components/Footer.jsx
import React from "react";
import { getRegion, isBetaRegion, getRegionConfig } from "../config";

export default function Footer() {
  const beta = isBetaRegion();
  const regionKey = getRegion();
  const cfg = getRegionConfig();

  return (
    <footer
      style={{
        padding: "24px 16px",
        color: "#ffffffcc",
        background:
          "linear-gradient(180deg, rgba(20,25,40,0.4) 0%, rgba(10,12,20,0.8) 100%)",
        backdropFilter: "blur(6px)",
        borderTop: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      {beta && (
        <div
          role="status"
          aria-live="polite"
          style={{
            margin: "0 auto 16px",
            maxWidth: 1200,
            padding: "10px 14px",
            border: "1px solid rgba(255,255,255,0.20)",
            borderRadius: 10
          }}
        >
          <strong>Calestra {cfg.label}</strong> — Global Beta Coming Soon.
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", fontSize: 14 }}>
        © {new Date().getFullYear()} Calestra. All rights reserved.
      </div>
      <div style={{ maxWidth: 1200, margin: "8px auto 0", fontSize: 12 }}>
        Region: {regionKey} · Locale default: {cfg.defaultLocale} · Currency:{" "}
        {cfg.currency}
      </div>
    </footer>
  );
}
