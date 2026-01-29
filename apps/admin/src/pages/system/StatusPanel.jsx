// D:\WebProjects\Calestra\apps\admin\src\pages\system\StatusPanel.jsx
import React from "react";

const DEFAULT_CELESTE = "http://127.0.0.1:14100";

function getCelesteBase() {
  try {
    return String(import.meta?.env?.VITE_CELESTE_URL || DEFAULT_CELESTE).replace(/\/$/, "");
  } catch {
    return DEFAULT_CELESTE;
  }
}

function normalizeLang(l) {
  const b = String(l || "sv").slice(0, 2).toLowerCase();
  return b === "sv" || b === "en" || b === "tr" ? b : "sv";
}

function guessLang() {
  try {
    const ls = typeof window !== "undefined" ? window.localStorage : null;
    const candidates = [
      ls?.getItem("cw.lang"),
      ls?.getItem("i18nextLng"),
      (typeof navigator !== "undefined" ? navigator.language : null),
      (typeof navigator !== "undefined" ? navigator.languages?.[0] : null),
    ].filter(Boolean);

    return normalizeLang(candidates[0] || "sv");
  } catch {
    return "sv";
  }
}

function Dot({ ok }) {
  return (
    <span
      aria-label={ok ? "up" : "down"}
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        display: "inline-block",
        background: ok ? "rgba(34,197,94,1)" : "rgba(239,68,68,1)",
        boxShadow: ok
          ? "0 0 0 3px rgba(34,197,94,0.15)"
          : "0 0 0 3px rgba(239,68,68,0.15)",
      }}
    />
  );
}

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { message: txt };
  }
}

function formatStatusReply(toolOut) {
  const data = toolOut?.data;
  const s = data?.summary;
  const lines =
    data?.services?.map((x) => `- ${x.name}: ${x.ok ? "OK" : "DOWN"} (${x.status})`).join("\n") || "";

  return `Systemstatus: ${s?.up ?? "?"} uppe, ${s?.down ?? "?"} nere.\n\n${lines}`;
}

export default function StatusPanel() {
  const CELESTE = getCelesteBase();
  const [lang, setLang] = React.useState(guessLang());

  const [loading, setLoading] = React.useState(false);
  const [toolOut, setToolOut] = React.useState(null);
  const [celesteHealth, setCelesteHealth] = React.useState(null);
  const [out, setOut] = React.useState("");

  async function refreshHealth() {
    try {
      setLoading(true);
      setOut("");

      // 1) Celeste /health
      const hRes = await fetch(`${CELESTE}/health`, { headers: { Accept: "application/json" } });
      const hJson = await safeJson(hRes);
      setCelesteHealth(hJson);

      // 2) status.check via /api/tools/run (source of truth)
      const res = await fetch(`${CELESTE}/api/tools/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          tool: "status.check",
          args: { timeoutMs: 1200 },
          app: "admin",
          lang,
          mode: "safe",
        }),
      });

      const json = await safeJson(res);
      setToolOut(json);

      if (!res.ok || !json?.ok) {
        setOut(json?.error || json?.message || `tools/run failed (${res.status})`);
      }
    } catch (e) {
      setOut(e?.message || "System error");
    } finally {
      setLoading(false);
    }
  }

  async function askCelesteServices() {
    try {
      setLoading(true);
      setOut("");

      const res = await fetch(`${CELESTE}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          app: "admin",
          lang,
          message:
            "Ge mig en kort drift-rapport: vad är uppe/nere, och föreslå nästa åtgärd. Om något är DOWN, säg exakt vad jag ska starta.",
        }),
      });

      const json = await safeJson(res);
      setOut(json?.answer || JSON.stringify(json, null, 2));
    } catch (e) {
      setOut(e?.message || "Ask error");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refreshHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const services = toolOut?.data?.services || [];
  const summary = toolOut?.data?.summary || null;

  return (
    <div style={wrap()}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 14, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.85 }}>
            Live status
          </div>
          <div style={{ opacity: 0.82, fontSize: 13, marginTop: 6 }}>
            Kör allt via <b>celeste-service</b>. Celeste: <b>{CELESTE}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ opacity: 0.75, fontSize: 12 }}>Lang</span>
          <select
            value={lang}
            onChange={(e) => setLang(normalizeLang(e.target.value))}
            style={selectStyle}
            aria-label="Language"
          >
            <option value="sv">sv</option>
            <option value="en">en</option>
            <option value="tr">tr</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <button onClick={refreshHealth} disabled={loading} style={btnStyle}>
          {loading ? "…" : "Refresh"}
        </button>

        <button onClick={askCelesteServices} disabled={loading} style={btnStyle}>
          Ask Celeste: drift
        </button>

        <button onClick={() => setOut("")} style={btnStyle}>
          Clear output
        </button>
      </div>

      <div style={{ marginTop: 12, ...card() }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 900 }}>Celeste</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>{CELESTE}/health</div>
          <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.9 }}>
            {celesteHealth?.ok ? <b>OK</b> : <b>?</b>}{" "}
            <span style={{ opacity: 0.7 }}>{celesteHealth?.provider ? `(${celesteHealth.provider})` : ""}</span>
          </div>
        </div>
      </div>

      {summary ? (
        <div style={{ marginTop: 10, opacity: 0.9, fontSize: 13 }}>
          Up: <b>{summary.up}</b> · Down: <b>{summary.down}</b> · Total: <b>{summary.total}</b>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {services.map((s) => (
          <div key={s.name} style={card()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Dot ok={!!s.ok} />
              <div style={{ fontWeight: 800 }}>{s.name}</div>
              <div style={{ opacity: 0.72, fontSize: 12, wordBreak: "break-all" }}>{s.url}</div>

              <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.95 }}>
                {s.ok ? (
                  <span>
                    <b>OK</b> ({s.status})
                  </span>
                ) : (
                  <span>
                    <b>DOWN</b> ({s.status || "ERR"})
                  </span>
                )}
              </div>
            </div>

            {s.error ? (
              <div style={{ marginTop: 8, color: "rgba(255,170,170,0.95)", fontSize: 12 }}>{s.error}</div>
            ) : null}

            <div style={{ marginTop: 8 }}>
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "rgba(159,231,255,0.95)", fontSize: 12 }}>
                Open health
              </a>
            </div>
          </div>
        ))}
      </div>

      {out ? <div style={outputBox()}>{out}</div> : null}

      {toolOut?.ok ? (
        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75, whiteSpace: "pre-wrap" }}>
          {formatStatusReply(toolOut)}
        </div>
      ) : null}
    </div>
  );
}

const btnStyle = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
  cursor: "pointer",
  fontWeight: 900,
};

const selectStyle = {
  height: 34,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
  padding: "0 10px",
  outline: "none",
  cursor: "pointer",
  fontWeight: 900,
};

function wrap() {
  return {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(2,6,23,0.40)",
    padding: 14,
  };
}

function card() {
  return {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    padding: 12,
  };
}

function outputBox() {
  return {
    marginTop: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    padding: 12,
    whiteSpace: "pre-wrap",
    fontSize: 12,
  };
}
