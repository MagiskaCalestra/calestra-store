// apps/web/src/components/DevToneBanner.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * DevToneBanner
 * - Visas endast i dev (import.meta.env.DEV) eller när hostname är localhost.
 * - Kan stängas lokalt (localStorage flagga).
 * - Påminner teamet om ton + länk till docs/ToneBible.md.
 */
export default function DevToneBanner() {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(false);

  const isDev =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
    (typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.hostname));

  useEffect(() => {
    if (!isDev) return;
    const v = localStorage.getItem("toneBanner.hidden");
    setHidden(v === "1");
  }, [isDev]);

  if (!isDev || hidden) return null;

  const close = () => {
    localStorage.setItem("toneBanner.hidden", "1");
    setHidden(true);
  };

  const box = {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 9999,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background:
      "linear-gradient(180deg, rgba(12,16,36,0.85), rgba(12,16,36,0.92))",
    backdropFilter: "blur(6px)",
    color: "#ffffffd9",
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "12px 14px"
  };

  const btn = {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer"
  };

  const link = {
    display: "inline-block",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 10,
    fontWeight: 600,
    background:
      "linear-gradient(90deg, #a8b8ff 0%, #6f8bff 60%, #4c6fff 100%)",
    color: "#fff"
  };

  return (
    <div role="note" aria-live="polite" style={box}>
      <span style={{ fontWeight: 600 }}>
        {t("tone.hint", "Tone: warm, confident, universal. See the Tone Bible.")}
      </span>
      <a
        href="/docs/ToneBible.md"
        target="_blank"
        rel="noreferrer"
        style={link}
      >
        {t("tone.link", "Open Tone Bible")}
      </a>
      <button onClick={close} style={btn} aria-label={t("tone.dismiss", "Dismiss")}>
        {t("tone.dismiss", "Dismiss")}
      </button>
    </div>
  );
}
