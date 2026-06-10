// D:\WebProjects\Calestra\apps\store-classic\src\core\ai\CelesteOverlay.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { askCeleste } from "../celeste/celesteClient.js";

/**
 * CelesteOverlay (Store Classic)
 * - Visar chat
 * - Kör "actions" som backend skickar (nav/tool.run/hint)
 * - Har inbyggda snabbknappar (status/butik)
 * - Robust mot fel (krashar inte UI)
 */

function pickLang() {
  // försök hämta samma språklogik som resten av appen
  try {
    const htmlLang = typeof document !== "undefined" ? document.documentElement.lang : "";
    const stored =
      (typeof localStorage !== "undefined" && (localStorage.getItem("cw.lang") || localStorage.getItem("lang"))) || "";
    const nav = typeof navigator !== "undefined" ? navigator.language : "";
    const raw = (stored || htmlLang || nav || "sv").toLowerCase();
    const b = raw.slice(0, 2);
    return b === "sv" || b === "en" || b === "tr" ? b : "sv";
  } catch {
    return "sv";
  }
}

function safeJson(x) {
  try {
    return JSON.stringify(x);
  } catch {
    return "";
  }
}

function shouldAutoNavigate(action) {
  // vi navigerar automatiskt om auto===true
  return action?.type === "nav" && action?.href && action?.auto === true;
}

function doNav(action) {
  if (!action?.href) return false;
  try {
    // full URL -> ny sida
    if (/^https?:\/\//i.test(action.href)) {
      window.location.assign(action.href);
      return true;
    }
    // relativ (inom samma app)
    window.location.assign(action.href);
    return true;
  } catch {
    return false;
  }
}

export default function CelesteOverlay({ appName = "store" }) {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([
    { role: "celeste", text: "Skriv t.ex. “status”, “butik”, “hjälp”." },
  ]);

  const lang = useMemo(() => pickLang(), []);
  const listRef = useRef(null);

  useEffect(() => {
    try {
      listRef.current?.scrollTo?.({ top: 999999, behavior: "smooth" });
    } catch {}
  }, [msgs, open]);

  async function runAsk(q) {
    const question = String(q || "").trim();
    if (!question) return;

    setMsgs((m) => [...m, { role: "you", text: question }]);
    setBusy(true);

    let reply = null;
    try {
      reply = await askCeleste({ appName, text: question, lang });
    } catch (e) {
      reply = { ok: false, answer: "Celeste: fel i klienten.", actions: [], meta: { err: String(e?.message || e) } };
    }

    const answerText =
      (reply && typeof reply.answer === "string" && reply.answer) ||
      (reply && typeof reply.text === "string" && reply.text) ||
      (reply && reply.message) ||
      "Celeste: (tomt svar)";

    setMsgs((m) => [
      ...m,
      {
        role: "celeste",
        text: answerText,
        meta: reply?.meta ? safeJson(reply.meta) : "",
        actions: Array.isArray(reply?.actions) ? reply.actions : [],
      },
    ]);

    // ✅ Kör actions (nav/tool) direkt efter svar
    const actions = Array.isArray(reply?.actions) ? reply.actions : [];

    // 1) auto-nav
    for (const a of actions) {
      if (shouldAutoNavigate(a)) {
        doNav(a);
        setBusy(false);
        return;
      }
    }

    // 2) explicit nav (utan auto) -> vi kan ändå navigera, men här kräver vi knapp/explicit
    // (lämnar det åt UI-knappar nedan om du vill)
    setBusy(false);
  }

  function onSend() {
    const q = text;
    setText("");
    runAsk(q);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 9999,
          padding: "10px 12px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(20,24,40,0.85)",
          color: "white",
          cursor: "pointer",
        }}
      >
        Celeste
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        width: 360,
        maxWidth: "calc(100vw - 24px)",
        zIndex: 9999,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(14,18,32,0.92)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
        color: "white",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10 }}>
        <div style={{ fontWeight: 700, letterSpacing: 0.5 }}>CELESTE · {String(appName || "store").toUpperCase()}</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            onClick={() => setOpen(false)}
            title="Stäng"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        style={{
          padding: 10,
          height: 230,
          overflow: "auto",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {msgs.map((m, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <div style={{ opacity: 0.65, fontSize: 12, marginBottom: 4 }}>
              {m.role === "you" ? "DU" : "CELESTE"}
            </div>
            <div
              style={{
                padding: "10px 10px",
                borderRadius: 12,
                background: m.role === "you" ? "rgba(255,255,255,0.08)" : "rgba(120,160,255,0.10)",
                border: "1px solid rgba(255,255,255,0.10)",
                lineHeight: 1.35,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>

            {/* ✅ Om backend skickar actions som inte auto-körs: visa knappar */}
            {Array.isArray(m.actions) && m.actions.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {m.actions
                  .filter((a) => a?.type === "nav" && a?.href) // här visar vi nav som knapp
                  .map((a, i) => (
                    <button
                      key={`${idx}-nav-${i}`}
                      onClick={() => doNav(a)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.16)",
                        background: "rgba(0,0,0,0.25)",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Öppna
                    </button>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: 10, display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Fråga Celeste…"
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend();
          }}
          style={{
            flex: 1,
            padding: "10px 10px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            outline: "none",
          }}
        />
        <button
          disabled={busy}
          onClick={onSend}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,215,0,0.35)",
            background: busy ? "rgba(255,255,255,0.08)" : "rgba(255,215,0,0.10)",
            color: "white",
            cursor: busy ? "not-allowed" : "pointer",
            minWidth: 86,
          }}
        >
          {busy ? "..." : "Skicka"}
        </button>
      </div>

      {/* ✅ Snabbknappar (lokalt, utan AI) */}
      <div style={{ padding: "0 10px 10px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={() => runAsk(lang === "tr" ? "bugünün durumu" : lang === "en" ? "today's status" : "status")}
          style={{
            padding: "8px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            cursor: "pointer",
          }}
        >
          status
        </button>

        <button
          onClick={() => runAsk(lang === "tr" ? "butik" : lang === "en" ? "store" : "butik")}
          style={{
            padding: "8px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            cursor: "pointer",
          }}
        >
          butik
        </button>
      </div>
    </div>
  );
}
