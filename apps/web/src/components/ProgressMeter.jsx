// apps/web/src/components/ProgressMeter.jsx
import React, { useMemo } from "react";

export default function ProgressMeter({ label, current = 0, goal = 100 }) {
  const pct = useMemo(() => {
    const p = Math.max(0, Math.min(100, (current / Math.max(goal, 1)) * 100));
    return Math.round(p);
  }, [current, goal]);

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.08)",
          borderRadius: 10,
          overflow: "hidden",
          height: 14
        }}
        title={`${label} — ${pct}%`}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background:
              "linear-gradient(90deg, #b6c4ff, #8ea4ff 60%, #6b86ff)"
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
        <span>{label}</span>
        <span aria-hidden="true">{pct}%</span>
      </div>
    </div>
  );
}
