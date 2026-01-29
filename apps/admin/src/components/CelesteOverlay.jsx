// D:\WebProjects\Calestra\apps\admin\src\components\CelesteOverlay.jsx
import React from "react";
import { askCeleste, getCelesteUrl } from "../core/celeste/celesteClient.js";

/**
 * ADMIN CelesteOverlay (stabil v1 + female voice)
 * - Behåller: voice, driftpoll, Alt+K toggle, banner
 * - Fixar: driftpoll endpoint -> POST /api/tools/run (status.check)
 * - Fixar: action runner stödjer {type:"nav",href,auto} + gamla format
 * - Lägger till: female-first voice selection för sv/en/tr + safe voice loading
 * - Kräver INTE LangContext
 */

/* ---------------------------
   Language detect
--------------------------- */

function detectLang(text) {
  const t = String(text || "").toLowerCase();
  if (/[çğıöşü]/i.test(text) || t.includes("merhaba") || t.includes("lütfen")) return "tr";
  if (t.includes("hello") || t.includes("please") || t.includes("help")) return "en";
  return "sv";
}

/* ---------------------------
   Celeste Voice (female-first)
--------------------------- */

function normalizeLang2(lang) {
  const b = String(lang || "sv").slice(0, 2).toLowerCase();
  return b === "tr" || b === "en" || b === "sv" ? b : "sv";
}

function getLangTag(lang) {
  const L = normalizeLang2(lang);
  return L === "tr" ? "tr-TR" : L === "en" ? "en-US" : "sv-SE";
}

function pickFemaleVoice(lang) {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const L = normalizeLang2(lang);
  const tag = L === "tr" ? "tr" : L === "en" ? "en" : "sv";

  const femaleHints =
    L === "tr"
      ? ["filiz", "leyla", "elif", "asya", "female", "woman"]
      : L === "en"
        ? ["zira", "samantha", "hazel", "aria", "jenny", "emma", "female", "woman"]
        : ["astrid", "emma", "sofia", "sara", "elin", "female", "woman"];

  // 1) språk + kvinnlig hint
  const v1 = voices.find((v) => {
    const name = String(v.name || "").toLowerCase();
    const vlang = String(v.lang || "").toLowerCase();
    return vlang.includes(tag) && femaleHints.some((h) => name.includes(h));
  });
  if (v1) return v1;

  // 2) språkmatch
  const v2 = voices.find((v) => String(v.lang || "").toLowerCase().includes(tag));
  if (v2) return v2;

  // 3) fallback
  return voices[0] || null;
}

async function ensureVoicesReady(timeoutMs = 900) {
  if (!("speechSynthesis" in window)) return;
  const existing = window.speechSynthesis.getVoices?.() || [];
  if (existing.length > 0) return;

  await new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      resolve();
    }, timeoutMs);

    window.speechSynthesis.onvoiceschanged = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      resolve();
    };
  });
}

async function speak(text, lang, { mode = "exec" } = {}) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  const msg = String(text || "").trim();
  if (!msg) return;

  try {
    await ensureVoicesReady(900);

    const u = new window.SpeechSynthesisUtterance(msg);
    u.lang = getLangTag(lang);

    const voice = pickFemaleVoice(lang);
    if (voice) u.voice = voice;

    // Executive vs Whisper (subtilt)
    if (mode === "whisper") {
      u.rate = 0.95;
      u.pitch = 1.18;
      u.volume = 0.75;
    } else {
      u.rate = 1.02;
      u.pitch = 1.12;
      u.volume = 1;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

/* ---------------------------
   Actions runner
--------------------------- */

function runActions(actions) {
  if (!Array.isArray(actions)) return false;

  for (const a of actions) {
    if (!a || typeof a !== "object") continue;

    // NEW: { type:"nav", href:"http://...", auto:true }
    if (a.type === "nav" && a.href) {
      if (a.auto) {
        try {
          window.location.assign(String(a.href));
        } catch {
          window.location.href = String(a.href);
        }
      } else {
        window.open(String(a.href), "_blank", "noopener,noreferrer");
      }
      return true;
    }

    // OLD: { type:"navigate", path:"/something" }
    if (a.type === "navigate" && a.path) {
      window.location.href = String(a.path);
      return true;
    }

    // OLD: { type:"open", url:"https://..." }
    if (a.type === "open" && a.url) {
      window.open(String(a.url), "_blank", "noopener,noreferrer");
      return true;
    }
  }

  return false;
}

/* ---------------------------
   Drift poll (status.check)
--------------------------- */

async function fetchOpsStatus() {

  try {
    const res = await fetch(`/api/tools/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        tool: "status.check",
        args: { timeoutMs: 900 },
        app: "admin",
        lang: "sv",
        mode: "safe",
      }),
    });

    const out = await res.json().catch(() => null);
    if (!res.ok || !out) return { ok: false, anyOff: true, lines: [], items: [], at: null };

    // server returnerar { ok, tool, data, meta }
    const data = out.data || out;

    const services = Array.isArray(data?.services) ? data.services : [];
    const summary = data?.summary || {};
    const up = Number(summary.up ?? services.filter((s) => s.ok).length);
    const down = Number(summary.down ?? services.filter((s) => !s.ok).length);
    const total = Number(summary.total ?? services.length);

    const items = services.map((s) => ({
      name: s.name,
      ok: !!s.ok,
      status: s.status || 0,
      url: s.url,
      error: s.error || null,
    }));

    const lines = [
      `Systemstatus: ${up} uppe, ${down} nere.`,
      ...items.map((x) => `- ${x.name}: ${x.ok ? "OK" : "DOWN"} (${x.status})`),
    ];

    return {
      ok: true,
      anyOff: down > 0,
      lines,
      items,
      at: data?.at || out?.meta?.at || new Date().toISOString(),
      total,
      up,
      down,
    };
  } catch {
    return { ok: false, anyOff: true, lines: [], items: [], at: null };
  }
}

function useInterval(fn, ms) {
  React.useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      await fn();
    };
    const id = setInterval(tick, ms);
    tick();
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [fn, ms]);
}

/* ---------------------------
   Component
--------------------------- */

export default function CelesteOverlay({ appName = "admin" }) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [log, setLog] = React.useState([]);
  const [busy, setBusy] = React.useState(false);

  const [voiceEnabled, setVoiceEnabled] = React.useState(true);

  // Drift banner
  const [opsAnyOff, setOpsAnyOff] = React.useState(false);
  const [opsLines, setOpsLines] = React.useState([]);
  const [opsAt, setOpsAt] = React.useState(null);

  const prevAnyOffRef = React.useRef(null);

  React.useEffect(() => {
    function onKey(e) {
      if (e.altKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Poll drift var 30s
  useInterval(async () => {
    const st = await fetchOpsStatus();
    const anyOff = Boolean(st?.anyOff);

    setOpsAnyOff(anyOff);
    setOpsLines(Array.isArray(st?.lines) ? st.lines : []);
    setOpsAt(st?.at || null);

    const prev = prevAnyOffRef.current;
    prevAnyOffRef.current = anyOff;

    // första gången: ingen spam
    if (prev === null) return;

    if (prev === false && anyOff === true) {
      const warning = "⚠️ Driftvarning: Minst en service är OFF. Skriv “status” eller “dagens läge”.";
      setLog((p) => [{ role: "celeste", text: warning, ts: Date.now() }, ...p]);
      if (voiceEnabled) speak(warning, "sv", { mode: "exec" });
      setOpen(true);
    }

    if (prev === true && anyOff === false) {
      const okMsg = "✅ Drift: Alla services ser OK ut igen.";
      setLog((p) => [{ role: "celeste", text: okMsg, ts: Date.now() }, ...p]);
      if (voiceEnabled) speak(okMsg, "sv", { mode: "exec" });
    }
  }, 30000);

  async function send() {
    const q = text.trim();
    if (!q || busy) return;

    setBusy(true);
    setLog((p) => [{ role: "you", text: q, ts: Date.now() }, ...p]);
    setText("");

    const lang = detectLang(q);

    const r = await askCeleste({ appName: "admin", text: q, lang });
    const answer = r?.answer || "Celeste: …";

    setLog((p) => [{ role: "celeste", text: answer, ts: Date.now() }, ...p]);

    runActions(r?.actions);

    if (voiceEnabled) speak(answer, lang, { mode: "exec" });

    setBusy(false);
  }

  const boxStyle = { position: "fixed", right: 16, bottom: 16, zIndex: 99999, fontFamily: "system-ui" };
  const panelStyle = {
    width: 400,
    maxWidth: "calc(100vw - 32px)",
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(2,6,23,0.96)",
    color: "#e5e7eb",
    boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
    overflow: "hidden",
  };
  const headerStyle = {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(148,163,184,0.25)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  };
  const btnStyle = {
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  };
  const bubbleBtn = {
    width: 54,
    height: 54,
    borderRadius: 999,
    border: `1px solid ${opsAnyOff ? "rgba(248,113,113,0.85)" : "rgba(250,204,21,0.6)"}`,
    background: opsAnyOff
      ? "radial-gradient(circle at top, rgba(248,113,113,0.9), rgba(239,68,68,0.25))"
      : "radial-gradient(circle at top, rgba(250,204,21,0.8), rgba(245,158,11,0.25))",
    color: "#0b1020",
    cursor: "pointer",
    boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
    fontWeight: 900,
  };

  const bannerStyle = {
    margin: "10px 12px 0",
    padding: "10px 12px",
    borderRadius: 14,
    border: `1px solid ${opsAnyOff ? "rgba(248,113,113,0.45)" : "rgba(34,197,94,0.35)"}`,
    background: opsAnyOff ? "rgba(127,29,29,0.35)" : "rgba(20,83,45,0.25)",
    fontSize: 12,
    lineHeight: 1.35,
  };

  return (
    <div style={boxStyle} aria-label="Celeste Assistant">
      {!open && (
        <button style={bubbleBtn} onClick={() => setOpen(true)} title="Celeste (Alt+K)">
          ✦
        </button>
      )}

      {open && (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 12, letterSpacing: "0.18em", opacity: 0.85 }}>
                CELESTE · {String(appName).toUpperCase()} · OPS
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Testa: <span style={{ opacity: 0.95 }}>"dagens läge"</span>,{" "}
                <span style={{ opacity: 0.95 }}>"status"</span>,{" "}
                <span style={{ opacity: 0.95 }}>"gå till finance"</span>,{" "}
                <span style={{ opacity: 0.95 }}>"butik"</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button style={btnStyle} onClick={() => setVoiceEnabled((v) => !v)} title="Röst på/av">
                {voiceEnabled ? "🔊" : "🔇"}
              </button>
              <button style={btnStyle} onClick={() => setOpen(false)} title="Stäng (Esc)">
                ✕
              </button>
            </div>
          </div>

          <div style={bannerStyle}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{opsAnyOff ? "⚠️ Driftvarning" : "✅ Drift OK"}</div>
            {opsLines.length > 0 ? (
              <div style={{ whiteSpace: "pre-wrap" }}>{opsLines.join("\n")}</div>
            ) : (
              <div style={{ opacity: 0.85 }}>Ingen statusdata ännu.</div>
            )}
            {opsAt && <div style={{ marginTop: 6, opacity: 0.6 }}>Senast: {opsAt}</div>}
          </div>

          <div style={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Fråga Celeste…"
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                  padding: "10px 12px",
                  outline: "none",
                  fontSize: 13,
                }}
              />
              <button style={{ ...btnStyle, borderColor: "rgba(250,204,21,0.55)" }} onClick={send} disabled={busy || !text.trim()}>
                {busy ? "…" : "Skicka"}
              </button>
            </div>

            <div style={{ maxHeight: 340, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {log.length === 0 && (
                <div style={{ fontSize: 13, opacity: 0.78, lineHeight: 1.35 }}>
                  Jag övervakar drift automatiskt var 30:e sekund.
                  <br />
                  Skriv <b>status</b> eller <b>dagens läge</b>.
                </div>
              )}

              {log.map((m) => (
                <div
                  key={m.ts}
                  style={{
                    alignSelf: m.role === "you" ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                    padding: "10px 12px",
                    borderRadius: 14,
                    whiteSpace: "pre-wrap",
                    fontSize: 13,
                    lineHeight: 1.35,
                    background: m.role === "you" ? "rgba(250,204,21,0.12)" : "rgba(148,163,184,0.10)",
                    border: m.role === "you" ? "1px solid rgba(250,204,21,0.25)" : "1px solid rgba(148,163,184,0.22)",
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: 11, opacity: 0.55 }}>Alt+K öppna/stäng • Esc stäng</div>
          </div>
        </div>
      )}
    </div>
  );
}
