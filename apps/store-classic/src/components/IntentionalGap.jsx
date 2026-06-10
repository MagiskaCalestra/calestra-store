// D:\WebProjects\Calestra\apps\store-classic\src\components\IntentionalGap.jsx

import React from "react";
import { useTranslation } from "react-i18next";
import { TT } from "../i18n/tt.js";

/**
 * IntentionalGap v1 (Store)
 * - Gör brister medvetna: preview/beta/coming soon
 * - Kan användas på sidor, knappar, tom-states, sociala länkar, mm.
 */

export function BetaNote({ children }) {
  return (
    <div style={styles.note} role="note" aria-live="polite">
      <span style={styles.dot} aria-hidden="true" />
      <div style={{ lineHeight: 1.35 }}>{children}</div>
    </div>
  );
}

export function ComingSoonBadge({ label }) {
  const { t, i18n } = useTranslation();

  const fallback = TT(i18n, t, "intentionalGap.comingSoon", {
    sv: "Kommer snart",
    en: "Coming soon",
    tr: "Yakında",
  });

  return <span style={styles.badge}>{label || fallback}</span>;
}

/** Använd istället för <a> när du vill att det ska se planerat avstängt ut */
export function DisabledLink({ children, title, soonLabel, onClick }) {
  const { t, i18n } = useTranslation();

  const resolvedTitle =
    title ||
    TT(i18n, t, "intentionalGap.launchesSoon", {
      sv: "Lanseras snart",
      en: "Launching soon",
      tr: "Yakında açılıyor",
    });

  const resolvedSoon =
    soonLabel ||
    TT(i18n, t, "intentionalGap.soon", {
      sv: "snart",
      en: "soon",
      tr: "yakında",
    });

  return (
    <button
      type="button"
      onClick={onClick}
      title={resolvedTitle}
      aria-label={resolvedTitle}
      style={styles.disabledLink}
    >
      {children}
      <span style={styles.soonPill}>{resolvedSoon}</span>
    </button>
  );
}

/** Liten diskret toast utan extern lib */
export function useMiniToast() {
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    if (!msg) return undefined;

    const timer = window.setTimeout(() => setMsg(""), 2200);
    return () => window.clearTimeout(timer);
  }, [msg]);

  const Toast = msg ? (
    <div style={styles.toast} role="status" aria-live="polite">
      {msg}
    </div>
  ) : null;

  return { toast: Toast, ping: setMsg };
}

const styles = {
  note: {
    margin: "8px 0 14px",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "rgba(15,23,42,0.04)",
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 13,
    fontWeight: 750,
    color: "rgba(15,23,42,0.78)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 4,
    background: "rgba(124,58,237,0.9)",
    boxShadow: "0 0 0 4px rgba(124,58,237,0.10)",
    flex: "0 0 auto",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    height: 22,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid rgba(245,158,11,0.35)",
    background: "rgba(245,158,11,0.10)",
    color: "rgba(17,24,39,0.85)",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  disabledLink: {
    appearance: "none",
    border: "1px dashed rgba(15,23,42,0.25)",
    background: "rgba(15,23,42,0.04)",
    color: "rgba(15,23,42,0.70)",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 850,
    fontSize: 12,
  },
  soonPill: {
    fontSize: 10,
    fontWeight: 950,
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,0.14)",
    background: "rgba(255,255,255,0.6)",
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: "0.10em",
  },
  toast: {
    position: "fixed",
    left: "50%",
    bottom: 18,
    transform: "translateX(-50%)",
    zIndex: 99999,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.92)",
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: 750,
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
  },
};