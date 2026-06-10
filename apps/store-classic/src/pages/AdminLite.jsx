import React from "react";

function parseJSON(text) {
  try { return JSON.parse(text); } catch { return { ok: false, error: text }; }
}

async function getJSON(url) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  const t = await r.text();
  const j = parseJSON(t);
  if (!r.ok && j && typeof j === "object") return { ...j, httpStatus: r.status };
  return j;
}

async function postJSON(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const t = await r.text();
  const j = parseJSON(t);
  if (!r.ok && j && typeof j === "object") return { ...j, httpStatus: r.status };
  return j;
}

function metric(n) {
  const x = Number(n || 0);
  return Number.isFinite(x) ? x.toLocaleString("sv-SE") : "0";
}

function Badge({ tone = "neutral", children }) {
  const bg =
    tone === "good" ? "rgba(16,185,129,.12)" :
    tone === "warn" ? "rgba(244,63,94,.12)" :
    "rgba(59,130,246,.10)";
  const bd =
    tone === "good" ? "rgba(16,185,129,.30)" :
    tone === "warn" ? "rgba(244,63,94,.30)" :
    "rgba(59,130,246,.25)";
  const col =
    tone === "good" ? "#065f46" :
    tone === "warn" ? "#9f1239" :
    "#1d4ed8";

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: 999,
      fontWeight: 1000,
      border: `1px solid ${bd}`,
      background: bg,
      color: col,
      whiteSpace: "nowrap"
    }}>
      {children}
    </span>
  );
}

export default function AdminLite() {
  const url = new URL(window.location.href);
  const key = url.searchParams.get("key") || ""; // optional

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  const [a, setA] = React.useState(null); // analytics
  const [f, setF] = React.useState(null); // feedback
  const [s, setS] = React.useState(null); // status

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const [aa, ff, ss] = await Promise.all([
        getJSON("/api/analytics/stats"),
        getJSON(key ? `/api/feedback/stats?key=${encodeURIComponent(key)}` : "/api/feedback/stats"),
        getJSON("/api/status"),
      ]);
      setA(aa); setF(ff); setS(ss);

      if (aa?.ok === false) setErr(`Analytics: ${aa?.error || "ok=false"}`);
      else if (ff?.ok === false) setErr(`Feedback: ${ff?.error || "ok=false"}`);
      else if (ss?.ok === false) setErr(`Status: ${ss?.error || "ok=false"}`);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { refresh(); }, []);

  const paused = !!s?.paused;
  const totalEvents = Number(a?.total || 0);
  const feedbackTotal = Number(f?.totals?.total || 0);
  const feedbackYes = Number(f?.totals?.returnYes || 0);
  const yesRate = feedbackTotal > 0 ? (feedbackYes / feedbackTotal) : 0;

  const goNoGo =
    paused ? { tone: "warn", label: "NO-GO: Pausad" } :
    (totalEvents >= 200 && feedbackTotal >= 3 && yesRate >= 0.6)
      ? { tone: "good", label: "GO: Kör vidare" }
      : { tone: "neutral", label: "HOLD: Samla mer data" };

  async function togglePause(nextPaused) {
    const reason = nextPaused ? (prompt("Anledning (valfri):", "Tillfällig paus") || "") : "";
    const qs = key ? `?key=${encodeURIComponent(key)}` : "";
    const res = await postJSON(`/api/admin/pause${qs}`, { paused: nextPaused, reason });
    if (res?.ok) { await refresh(); return; }
    alert(`Pause failed: ${res?.error || "Unknown"} (HTTP ${res?.httpStatus || "?"})`);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto 48px", padding: "0 18px", color: "#0f172a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: ".08em", color: "#334155" }}>
            CALESTRA · STATS (LITE)
          </div>
          <h1 style={{ margin: 0, fontSize: 34, letterSpacing: "-0.02em" }}>Admin-Lite</h1>
          <div style={{ marginTop: 6, color: "#334155", fontWeight: 800, fontSize: 13 }}>
            Analytics: <code>/api/analytics/stats</code> · Feedback: <code>/api/feedback/stats</code> · Status: <code>/api/status</code>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <a href="/" style={{
            border: "1px solid rgba(15,23,42,.14)",
            background: "#fff",
            color: "#0b1220",
            fontWeight: 900,
            padding: "10px 14px",
            borderRadius: 12,
            textDecoration: "none"
          }}>Till butiken</a>

          <button
            onClick={refresh}
            disabled={loading}
            style={{
              border: "1px solid rgba(15,23,42,.14)",
              background: "#0b1220",
              color: "#fff",
              fontWeight: 900,
              padding: "10px 14px",
              borderRadius: 12,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? .7 : 1
            }}
          >
            {loading ? "Uppdaterar…" : "Uppdatera"}
          </button>
        </div>
      </div>

      {err ? (
        <div style={{
          marginTop: 14,
          border: "1px solid rgba(244,63,94,.35)",
          background: "rgba(244,63,94,.08)",
          padding: "12px 14px",
          borderRadius: 14,
          color: "#9f1239",
          fontWeight: 900
        }}>
          {err}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, marginTop: 14 }}>
        <section style={{
          background: "#fff",
          border: "1px solid rgba(15,23,42,.10)",
          borderRadius: 18,
          boxShadow: "0 18px 45px rgba(2,6,23,.08)",
          padding: 14
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontWeight: 1000, fontSize: 18 }}>Go / No-Go</div>
            <Badge tone={goNoGo.tone}>{goNoGo.label}</Badge>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <Row label="Events total" value={metric(totalEvents)} />
            <Row label="Feedback total" value={metric(feedbackTotal)} />
            <Row label="Ja-andel" value={feedbackTotal ? `${Math.round(yesRate * 100)}%` : "—"} />
          </div>

          <div style={{ height: 1, background: "rgba(15,23,42,.10)", margin: "12px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ color: "#334155", fontWeight: 900 }}>Butikstatus</div>
              <div style={{ marginTop: 6 }}>
                {paused ? <Badge tone="warn">PAUSAD</Badge> : <Badge tone="good">AKTIV</Badge>}
                <span style={{ marginLeft: 10, color: "#475569", fontWeight: 800, fontSize: 12 }}>
                  {s?.updatedAt ? `uppdaterad ${new Date(s.updatedAt).toLocaleString("sv-SE")}` : ""}
                </span>
              </div>
              {paused && s?.reason ? <div style={{ marginTop: 6, color: "#475569", fontWeight: 800 }}>Orsak: {s.reason}</div> : null}
            </div>

            <div>
              {paused ? (
                <button onClick={() => togglePause(false)} style={btnGood}>Återuppta</button>
              ) : (
                <button onClick={() => togglePause(true)} style={btnWarn}>Pausa nu</button>
              )}
            </div>
          </div>
        </section>

        <section style={{
          background: "#fff",
          border: "1px solid rgba(15,23,42,.10)",
          borderRadius: 18,
          boxShadow: "0 18px 45px rgba(2,6,23,.08)",
          padding: 14
        }}>
          <div style={{ fontWeight: 1000, fontSize: 18 }}>Analytics</div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <Row label="Total events" value={metric(a?.total)} />
            <Row label="Senaste 24h" value={metric(a?.last24h)} />
            <Row label="Senaste 7 dagar" value={metric(a?.last7d)} />
          </div>
          <div style={{ marginTop: 10, color: "#475569", fontWeight: 800, fontSize: 12 }}>
            Tips: nästa steg är att lägga till unika besök (unique24h/unique7d) i analytics endpoint.
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <div style={{ color: "#334155", fontWeight: 900 }}>{label}</div>
      <div style={{ color: "#0b1220", fontWeight: 1000 }}>{value}</div>
    </div>
  );
}

const btnWarn = {
  border: "1px solid rgba(190,18,60,.35)",
  background: "#be123c",
  color: "#fff",
  fontWeight: 1000,
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer"
};

const btnGood = {
  border: "1px solid rgba(15,118,110,.35)",
  background: "#0f766e",
  color: "#fff",
  fontWeight: 1000,
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer"
};
