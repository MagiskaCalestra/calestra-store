// apps/web/src/components/PartnerSlot.jsx
import React from "react";

export default function PartnerSlot({ data }) {
  if (!data || !data.enabled) return null;

  return (
    <section
      aria-labelledby="partnerTitle"
      className="container"
      style={{ margin: "24px auto 40px" }}
    >
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {data.logo ? (
            <img
              src={data.logo}
              alt=""
              width="28"
              height="28"
              style={{ display: "block" }}
            />
          ) : null}
          <span
            style={{ fontSize: 12, letterSpacing: ".02em", opacity: 0.9 }}
          >
            {data.eyebrow}
          </span>
        </div>

        <div>
          <h4 id="partnerTitle" style={{ margin: "0 0 6px", color: "#fff" }}>
            {data.title}
          </h4>
          <p style={{ margin: 0, color: "rgba(255,255,255,.9)" }}>{data.text}</p>
        </div>

        <div>
          <a
            className="btn"
            href={data.url || "#"}
            rel="noopener noreferrer"
            target="_blank"
            aria-label={`${data.ctaLabel} — ${data.title}`}
            data-track={data.tracked}
          >
            {data.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
