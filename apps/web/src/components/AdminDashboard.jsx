// apps/web/src/components/AdminDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import CoreAPI from "../../../../packages/core/api/index.js";

function Pill({ label, ok, sub }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        background: ok ? "rgba(60,181,98,0.18)" : "rgba(255,84,84,0.18)",
        border: `1px solid ${ok ? "rgba(60,181,98,0.45)" : "rgba(255,84,84,0.45)"}`,
        color: ok ? "#c8ffda" : "#ffd7d7",
        fontSize: 13,
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
      title={sub || ""}
    >
      <span style={{ width: 8, height: 8, background: ok ? "#35d48a" : "#ff5a5f", borderRadius: 99 }} />
      <strong>{label}</strong>
    </div>
  );
}

function Bar({ value }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 10, height: 14 }}>
      <div
        style={{
          width: `${pct}%`,
          height: 14,
          borderRadius: 10,
          background: "linear-gradient(90deg,#ffd166,#ffb703)",
          boxShadow: "0 0 8px rgba(255,190,0,0.6)",
        }}
      />
    </div>
  );
}

export default function AdminDashboard({ onClose }) {
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pct = useMemo(() => {
    if (!summary?.summary?.totals) return 0;
    // anta 100 som mål – justera om Infinity skickar mål
    return Math.min(100, summary.summary.totals ?? 0);
  }, [summary]);

  async function refresh() {
    setBusy(true);
    setError("");
    try {
      const [h, s] = await Promise.all([CoreAPI.healthAll(), CoreAPI.getProgressSummary()]);
      setHealth(h);
      setSummary(s);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(3px)",
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "min(980px, 92vw)",
          background: "rgba(16,21,29,0.96)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
          color: "#eef6ff",
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Central Admin</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={refresh}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {busy ? "Uppdaterar…" : "Uppdatera"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Stäng
            </button>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Pill label="mock-api" ok={!!health?.mock?.ok} sub={JSON.stringify(health?.mock?.data || health?.mock?.error || "")} />
          <Pill label="nexus"    ok={!!health?.nexus?.ok} sub={JSON.stringify(health?.nexus?.data || health?.nexus?.error || "")} />
          <Pill label="c-core"   ok={!!health?.ccore?.ok} sub={JSON.stringify(health?.ccore?.data || health?.ccore?.error || "")} />
          <Pill label="infinity" ok={!!health?.inf?.ok}   sub={JSON.stringify(health?.inf?.data || health?.inf?.error || "")} />
        </div>

        <div style={{ marginTop: 20 }}>
          <h4 style={{ margin: "0 0 6px 0", color: "rgba(255,255,255,0.8)" }}>Global Progress</h4>
          <Bar value={pct} />
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
            {typeof pct === "number" ? `${pct}% finansierat av nästa steg` : "—"}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, color: "#ff9b9b", background: "rgba(255,0,0,0.08)", padding: 10, borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
          <details style={{ background: "rgba(255,255,255,0.03)", padding: 10, borderRadius: 10 }}>
            <summary>Rådata: health</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(health, null, 2)}</pre>
          </details>
          <details style={{ background: "rgba(255,255,255,0.03)", padding: 10, borderRadius: 10 }}>
            <summary>Rådata: progress summary</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(summary, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}
