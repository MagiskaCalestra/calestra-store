import React from "react";
import QAPanel from "./QAPanel.jsx";

function Card({ title, subtitle, right, children }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 18,
        background: "rgba(0,0,0,0.22)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{title}</div>
          {subtitle ? <div style={{ marginTop: 6, opacity: 0.8 }}>{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

function Pill({ label, active }) {
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${active ? "rgba(255,215,140,0.45)" : "rgba(255,255,255,0.14)"}`,
        background: active ? "rgba(255,215,140,0.12)" : "rgba(255,255,255,0.06)",
        fontWeight: 800,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function getEnvFromPort() {
  const p = String(window.location.port || "");
  if (p === "5179") return "GREEN";
  if (p === "5180") return "BLUE";
  return "CUSTOM";
}

export default function System() {
  const env = getEnvFromPort();
  const GREEN = { web: "http://localhost:5288", store: "http://localhost:5175", admin: "http://localhost:5179" };
  const BLUE = { web: "http://localhost:5289", store: "http://localhost:5176", admin: "http://localhost:5180" };

  const open = (href) => window.open(href, "_blank", "noopener,noreferrer");

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card
        title="System"
        subtitle="Drift, routing, QA och säkerhetskontroller inför testlansering."
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Pill label={`Auto: ${env}`} active />
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 14,
              background: "rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Environment Switch</div>
            <div style={{ opacity: 0.85, marginBottom: 10 }}>
              GREEN: web 5288 / store 5175 / admin 5179 • BLUE: web 5289 / store 5176 / admin 5180
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button onClick={() => open(GREEN.web)} style={btn()}>Open GREEN Web</button>
              <button onClick={() => open(GREEN.store)} style={btn()}>Open GREEN Store</button>
              <button onClick={() => open(GREEN.admin)} style={btn()}>Open GREEN Admin</button>

              <button onClick={() => open(BLUE.web)} style={btn()}>Open BLUE Web</button>
              <button onClick={() => open(BLUE.store)} style={btn()}>Open BLUE Store</button>
              <button onClick={() => open(BLUE.admin)} style={btn()}>Open BLUE Admin</button>
            </div>
          </div>

          <QAPanel />

          <div style={{ opacity: 0.8, fontSize: 13 }}>
            PRO-notis: Admin kör alltid mot services via proxy (t.ex. <code>/api/finance/*</code>, <code>/api/analytics/*</code>) för att undvika CORS och spegla prod.
          </div>
        </div>
      </Card>
    </div>
  );
}

function btn() {
  return {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  };
}
