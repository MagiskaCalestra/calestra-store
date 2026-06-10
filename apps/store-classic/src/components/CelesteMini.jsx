// D:\WebProjects\Calestra\apps\store-classic\src\components\CelesteMini.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { askCeleste } from "../core/celeste/celesteClient.js";

function getLang() {
  try {
    const v =
      window.localStorage.getItem("cw.lang") ||
      window.localStorage.getItem("i18nextLng") ||
      "sv";
    return String(v).slice(0, 2).toLowerCase();
  } catch {
    return "sv";
  }
}

function execActions(actions, navigate) {
  if (!Array.isArray(actions)) return;

  for (const a of actions) {
    if (!a) continue;

    // NAV action
    if (a.type === "nav" && a.href) {
      const href = String(a.href);

      // Intern SPA-route i store-classic
      if (href.startsWith("/")) {
        navigate(href);
        continue;
      }

      // Extern full URL (web/admin/store)
      window.location.assign(href);
      continue;
    }
  }
}

export default function CelesteMini() {
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(true);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msgs, setMsgs] = React.useState([
    {
      role: "assistant",
      text: "Skriv t.ex. “butik”, “gallery”, “status”, “wish”.",
    },
  ]);

  async function send(text) {
    const message = String(text || "").trim();
    if (!message) return;

    setMsgs((m) => [...m, { role: "user", text: message }]);
    setBusy(true);

    const reply = await askCeleste({
      appName: "store",
      text: message,
      lang: getLang(),
    });

    setBusy(false);

    const answer = reply?.answer || "Celeste: ...";
    setMsgs((m) => [...m, { role: "assistant", text: answer }]);

    // ✅ Kör actions (detta är nyckeln)
    execActions(reply?.actions, navigate);
  }

  function onSubmit(e) {
    e.preventDefault();
    const v = input;
    setInput("");
    send(v);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 99999,
          padding: "10px 12px",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,.12)",
          background: "rgba(10,12,20,.82)",
          color: "#fff",
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
        width: 320,
        maxHeight: 430,
        zIndex: 99999,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(10,12,20,.82)",
        color: "#fff",
        overflow: "hidden",
        boxShadow: "0 18px 60px rgba(0,0,0,.45)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "1px solid rgba(255,255,255,.10)",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: 1, opacity: 0.9 }}>
          CELESTE · STORE
        </div>

        <button
          onClick={() => setOpen(false)}
          title="Stäng"
          style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.12)",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          padding: 12,
          overflow: "auto",
          maxHeight: 300,
          fontSize: 13,
          lineHeight: 1.4,
        }}
      >
        <div style={{ opacity: 0.75, marginBottom: 8 }}>
          Snabbtest:{" "}
          <button
            onClick={() => send("butik")}
            style={{
              marginLeft: 6,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,.12)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            butik
          </button>
          <button
            onClick={() => send("gallery")}
            style={{
              marginLeft: 6,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,.12)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            gallery
          </button>
          <button
            onClick={() => send("status")}
            style={{
              marginLeft: 6,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,.12)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            status
          </button>
        </div>

        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "90%",
                padding: "8px 10px",
                borderRadius: 12,
                background:
                  m.role === "user"
                    ? "rgba(120,120,255,.25)"
                    : "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.08)",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {busy && <div style={{ opacity: 0.7 }}>…</div>}
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          padding: 12,
          borderTop: "1px solid rgba(255,255,255,.10)",
          display: "flex",
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Fråga Celeste..."
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(0,0,0,.25)",
            color: "#fff",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.12)",
            background: busy ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.12)",
            color: "#fff",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Skicka
        </button>
      </form>
    </div>
  );
}
