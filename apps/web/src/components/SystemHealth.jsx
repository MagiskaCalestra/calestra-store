import React, { useEffect, useState } from "react";
import core from "../../../packages/core/api/index.js";

export default function SystemHealth() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    core.healthAll().then(setData).catch(e => setErr(String(e)));
  }, []);

  if (err) return <div className="card" style={{ color: "#ff9f9f" }}>❌ Fel: {err}</div>;
  if (!data) return <div className="card" style={{ color: "#a8b0c3" }}>Kontrollerar tjänster…</div>;

  return (
    <div className="card" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {Object.entries(data).map(([k, v]) => (
        <div key={k} style={{
          background: v.ok ? "#1a2b1a" : "#2b1a1a",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 10, padding: "6px 10px",
          color: v.ok ? "#9ff59f" : "#ff9f9f"
        }}>
          {k.toUpperCase()} {v.ok ? "✅" : "❌"}
        </div>
      ))}
    </div>
  );
}
