import React from "react";
import { useTranslation } from "react-i18next";

/**
 * CookieBanner (Store) v2
 * - Sparar i localStorage: "cw.cookieConsent" = "accepted" | "declined"
 * - Visas automatiskt bara om inget val finns
 * - MEN: kan alltid öppnas igen via footer-knapp (event: "cw:cookie:open")
 * - DEV reset finns kvar
 */

const LS_KEY = "cw.cookieConsent";
const EVT_OPEN = "cw:cookie:open";

function safeGet() {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}
function safeSet(v) {
  try {
    localStorage.setItem(LS_KEY, v);
  } catch {}
}
function safeRemove() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

export default function CookieBanner() {
  const { t, i18n } = useTranslation();

  const [open, setOpen] = React.useState(false);
  const [choice, setChoice] = React.useState(null); // accepted | declined | null
  const [forced, setForced] = React.useState(false); // öppnad via “Hantera cookies”

  React.useEffect(() => {
    const v = safeGet();
    setChoice(v);
    setOpen(!(v === "accepted" || v === "declined"));
  }, []);

  // ✅ Tillåt att bannern öppnas igen från footer (eller var som helst)
  React.useEffect(() => {
    function onOpen() {
      const v = safeGet();
      setChoice(v);
      setForced(true);
      setOpen(true);
    }
    window.addEventListener(EVT_OPEN, onOpen);
    return () => window.removeEventListener(EVT_OPEN, onOpen);
  }, []);

  const lang = String(i18n?.language || "sv").slice(0, 2).toLowerCase();

  const fallback = {
    sv: {
      title: forced ? "Cookieinställningar" : "Cookies",
      body:
        "Vi använder cookies för att komma ihåg dina val och förbättra upplevelsen. Du kan alltid ändra här senare.",
      accept: "Acceptera",
      decline: "Avböj",
      hint: "Du kan ändra när som helst via cookie-ikonen i footern.",
      currentAccepted: "Nuvarande val: Accepterat",
      currentDeclined: "Nuvarande val: Avböjt",
      clear: "Återställ val",
      close: "Stäng",
      reset: "Reset (DEV)",
    },
    en: {
      title: forced ? "Cookie settings" : "Cookies",
      body:
        "We use cookies to remember your preferences and improve the experience. You can change this later anytime.",
      accept: "Accept",
      decline: "Decline",
      hint: "You can change anytime via the cookie icon in the footer.",
      currentAccepted: "Current choice: Accepted",
      currentDeclined: "Current choice: Declined",
      clear: "Reset choice",
      close: "Close",
      reset: "Reset (DEV)",
    },
    tr: {
      title: forced ? "Çerez ayarları" : "Çerezler",
      body:
        "Tercihlerinizi hatırlamak ve deneyimi iyileştirmek için çerezler kullanıyoruz. Daha sonra her zaman değiştirebilirsiniz.",
      accept: "Kabul et",
      decline: "Reddet",
      hint: "Alt kısımdaki (footer) çerez ikonundan istediğiniz zaman değiştirebilirsiniz.",
      currentAccepted: "Mevcut seçim: Kabul edildi",
      currentDeclined: "Mevcut seçim: Reddedildi",
      clear: "Seçimi sıfırla",
      close: "Kapat",
      reset: "Sıfırla (DEV)",
    },
  }[lang] || {
    title: forced ? "Cookie settings" : "Cookies",
    body: "We use cookies to improve the experience.",
    accept: "Accept",
    decline: "Decline",
    hint: "",
    currentAccepted: "Current choice: Accepted",
    currentDeclined: "Current choice: Declined",
    clear: "Reset choice",
    close: "Close",
    reset: "Reset (DEV)",
  };

  const tt = (key, fb) => {
    // Om nyckeln saknas: visa INTE "cookie.title"
    try {
      if (i18n?.exists?.(key)) return t(key);
    } catch {}
    return fb;
  };

  const isDev = Boolean(import.meta?.env?.DEV);

  function accept() {
    safeSet("accepted");
    setChoice("accepted");
    setOpen(false);
    setForced(false);
  }

  function decline() {
    safeSet("declined");
    setChoice("declined");
    setOpen(false);
    setForced(false);
  }

  function clearChoice() {
    safeRemove();
    setChoice(null);
    setForced(true);
    setOpen(true);
  }

  if (!open) return null;

  const currentLine =
    choice === "accepted"
      ? tt("cookie.currentAccepted", fallback.currentAccepted)
      : choice === "declined"
      ? tt("cookie.currentDeclined", fallback.currentDeclined)
      : null;

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Cookie consent">
      <div style={styles.card}>
        <div style={styles.head}>
          <div>
            <div style={styles.title}>{tt("cookie.title", fallback.title)}</div>
            {currentLine && <div style={styles.sub}>{currentLine}</div>}
          </div>

          {/* “Stäng” vid manage-läge (när det öppnas via footern) */}
          {forced && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setForced(false);
              }}
              style={{ ...styles.btn, ...styles.btnGhost }}
              aria-label={fallback.close}
              title={fallback.close}
            >
              {fallback.close}
            </button>
          )}
        </div>

        <div style={styles.body}>{tt("cookie.body", fallback.body)}</div>

        <div style={styles.actions}>
          <button type="button" onClick={decline} style={{ ...styles.btn, ...styles.btnGhost }}>
            {tt("cookie.decline", fallback.decline)}
          </button>
          <button type="button" onClick={accept} style={{ ...styles.btn, ...styles.btnPrimary }}>
            {tt("cookie.accept", fallback.accept)}
          </button>
        </div>

        <div style={styles.hintRow}>
          <div style={styles.hint}>{tt("cookie.hint", fallback.hint)}</div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(choice === "accepted" || choice === "declined") && (
              <button type="button" onClick={clearChoice} style={styles.reset} title={fallback.clear}>
                {fallback.clear}
              </button>
            )}

            {isDev && (
              <button
                type="button"
                onClick={() => {
                  safeRemove();
                  setChoice(null);
                  setForced(true);
                  setOpen(true);
                }}
                style={styles.reset}
                title="DEV reset cookie consent"
              >
                {fallback.reset}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 999999,
    display: "grid",
    placeItems: "center",
    padding: 16,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(10px)",
  },
  card: {
    width: "min(680px, calc(100vw - 32px))",
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "linear-gradient(135deg, rgba(10,12,24,0.92), rgba(2,6,23,0.92))",
    color: "#e5e7eb",
    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
    padding: 16,
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: 950, letterSpacing: ".02em" },
  sub: { marginTop: 4, fontSize: 12, opacity: 0.78 },
  body: { fontSize: 13, opacity: 0.9, lineHeight: 1.5, marginTop: 8 },
  actions: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14, flexWrap: "wrap" },
  btn: {
    height: 36,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.28)",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 13,
    color: "#e5e7eb",
  },
  btnGhost: { background: "rgba(148,163,184,0.10)" },
  btnPrimary: {
    borderColor: "rgba(99,102,241,0.55)",
    background: "linear-gradient(135deg, rgba(99,102,241,0.95), rgba(124,58,237,0.85))",
    color: "#fff",
  },
  hintRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
    flexWrap: "wrap",
  },
  hint: { fontSize: 11, opacity: 0.65 },
  reset: {
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(148,163,184,0.10)",
    color: "#e5e7eb",
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 900,
  },
};
