// D:\WebProjects\Calestra\apps\store-classic\src\components\FeedbackButton.jsx

import React from "react";
import { useTranslation } from "react-i18next";
import { TT } from "../i18n/tt.js";

export default function FeedbackButton() {
  const { t, i18n } = useTranslation();

  const [open, setOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");

  const [feel, setFeel] = React.useState("");
  const [unclear, setUnclear] = React.useState("");
  const [returnYes, setReturnYes] = React.useState(null);

  const L = {
    fab: TT(i18n, t, "feedback.fab", {
      sv: "Feedback",
      en: "Feedback",
      tr: "Geri bildirim",
    }),
    title: TT(i18n, t, "feedback.title", {
      sv: "Snabb feedback",
      en: "Quick feedback",
      tr: "Hızlı geri bildirim",
    }),
    close: TT(i18n, t, "feedback.close", {
      sv: "Stäng",
      en: "Close",
      tr: "Kapat",
    }),
    q1: TT(i18n, t, "feedback.q1", {
      sv: "1) Vad kändes?",
      en: "1) What did you feel?",
      tr: "1) Ne hissettin?",
    }),
    q2: TT(i18n, t, "feedback.q2", {
      sv: "2) Vad var oklart?",
      en: "2) What was unclear?",
      tr: "2) Ne anlaşılmadı?",
    }),
    q3: TT(i18n, t, "feedback.q3", {
      sv: "3) Skulle du återvända?",
      en: "3) Would you return?",
      tr: "3) Tekrar gelir misin?",
    }),
    placeholder: TT(i18n, t, "feedback.placeholder", {
      sv: "Skriv kort…",
      en: "Write briefly…",
      tr: "Kısaca yaz…",
    }),
    yes: TT(i18n, t, "feedback.yes", {
      sv: "Ja",
      en: "Yes",
      tr: "Evet",
    }),
    no: TT(i18n, t, "feedback.no", {
      sv: "Nej",
      en: "No",
      tr: "Hayır",
    }),
    send: TT(i18n, t, "feedback.send", {
      sv: "Skicka",
      en: "Send",
      tr: "Gönder",
    }),
    sending: TT(i18n, t, "feedback.sending", {
      sv: "Skickar…",
      en: "Sending…",
      tr: "Gönderiliyor…",
    }),
    thanks: TT(i18n, t, "feedback.thanks", {
      sv: "Tack! ✨",
      en: "Thanks! ✨",
      tr: "Teşekkürler! ✨",
    }),
    error: TT(i18n, t, "feedback.error", {
      sv: "Kunde inte skicka feedback just nu.",
      en: "Could not send feedback right now.",
      tr: "Geri bildirim gönderilemedi.",
    }),
  };

  async function submit() {
    if (sending) return;

    setSending(true);
    setDone(false);
    setError("");

    const payload = {
      feel: String(feel || "").trim(),
      unclear: String(unclear || "").trim(),
      returnYes: returnYes === true ? 1 : returnYes === false ? 0 : null,
      path:
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "",
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
      viewport:
        typeof window !== "undefined"
          ? { w: window.innerWidth, h: window.innerHeight }
          : null,
      ts: Date.now(),
    };

    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) throw new Error();

      setDone(true);
      setFeel("");
      setUnclear("");
      setReturnYes(null);

      setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 900);
    } catch {
      setError(L.error);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        className="fb-fab"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={L.fab}
        title={L.fab}
      >
        {L.fab}
      </button>

      {open && (
        <div className="fb-modal" role="dialog" aria-modal="true" aria-label={L.title}>
          <div className="fb-backdrop" onClick={() => !sending && setOpen(false)} />

          <div className="fb-panel">
            <div className="fb-top">
              <div className="fb-title">{L.title}</div>

              <button
                className="fb-close"
                type="button"
                onClick={() => !sending && setOpen(false)}
                aria-label={L.close}
              >
                ×
              </button>
            </div>

            <div className="fb-field">
              <label>{L.q1}</label>
              <textarea
                value={feel}
                onChange={(e) => setFeel(e.target.value)}
                placeholder={L.placeholder}
                rows={3}
              />
            </div>

            <div className="fb-field">
              <label>{L.q2}</label>
              <textarea
                value={unclear}
                onChange={(e) => setUnclear(e.target.value)}
                placeholder={L.placeholder}
                rows={3}
              />
            </div>

            <div className="fb-field">
              <label>{L.q3}</label>

              <div className="fb-choices">
                <button
                  type="button"
                  className={`fb-choice ${returnYes === true ? "on" : ""}`}
                  onClick={() => setReturnYes(true)}
                >
                  {L.yes}
                </button>

                <button
                  type="button"
                  className={`fb-choice ${returnYes === false ? "on" : ""}`}
                  onClick={() => setReturnYes(false)}
                >
                  {L.no}
                </button>
              </div>
            </div>

            {error && <div className="fb-error">{error}</div>}

            <button
              className="fb-send"
              type="button"
              disabled={sending}
              onClick={submit}
            >
              {done ? L.thanks : sending ? L.sending : L.send}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .fb-error{
          margin-top:8px;
          color:#ff6b6b;
          font-size:13px;
          font-weight:800;
        }
      `}</style>
    </>
  );
}