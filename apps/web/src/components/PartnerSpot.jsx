// apps/web/src/components/PartnerSpot.jsx
import React, { useEffect, useState } from "react";
import { loadPartnerConfig } from "../api/partner";
import { clickTrack } from "../core/AffiliateManager"; // ska finnas enligt seed
import { useTranslation } from "react-i18next";

export default function PartnerSpot() {
  const { t } = useTranslation();
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const c = await loadPartnerConfig();
      if (on) setCfg(c);
    })();
    return () => { on = false; };
  }, []);

  if (!cfg) return null;

  function onClick() {
    try {
      clickTrack("partner", { href: cfg.href });
    } catch {}
  }

  return (
    <section
      style={{
        maxWidth: 1200,
        margin: "24px auto 40px",
        padding: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        color: "#ffffffcc"
      }}
      aria-label="Partner"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.06)"
          }}
        >
          {cfg.badge || "Partner"}
        </span>
        <h4 style={{ margin: 0, color: "#fff" }}>{cfg.title}</h4>
      </div>
      {cfg.text && <p style={{ margin: "8px 0 12px" }}>{cfg.text}</p>}
      <a
        href={cfg.href}
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
        style={{
          display: "inline-block",
          textDecoration: "none",
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.25)",
          color: "#fff"
        }}
      >
        {cfg.label || t("cta.plan", "Plan")}
      </a>
    </section>
  );
}
