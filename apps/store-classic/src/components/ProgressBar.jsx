// src/components/ProgressBar.jsx
import React from "react";
import "../styles/progress.css";

/**
 * ProgressBar â€“ enkel, tillgänglig och med bättre kontrast.
 */
export default function ProgressBar({
  value = 0,
  milestones = [25, 50, 75, 100],
  ariaLabel = "Progress",
}) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div>
      <div
        className="pb"
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ ["--pb-value"]: `${clamped}%` }}
      >
        <div className="pb__fill" />
        <div className="pb__shade" aria-hidden />
        {milestones.map((m) => (
          <span key={m} className="pb__tick" style={{ ["--left"]: `${m}%` }} aria-hidden />
        ))}
      </div>

      <div className="pb__meta">
        <span><b>{clamped}%</b></span>
        <span>Milestones: {milestones.join(" / ")}</span>
      </div>

      <style>{`
        .pb{
          --track-bg: color-mix(in oklab, #ffffff 12%, transparent);
          --track-border: color-mix(in oklab, #ffffff 16%, transparent);
          --fill-a: #4B6BFA; --fill-b:#8FA2FF;
          position:relative; height:14px; border-radius:999px; overflow:hidden;
          background: var(--track-bg);
          box-shadow: inset 0 0 0 1px var(--track-border), 0 0 0 1px rgba(0,0,0,.25);
        }
        :root:not(.theme-dark) .pb{
          --track-bg: color-mix(in oklab, #0b1220 6%, transparent);
          --track-border: color-mix(in oklab, #0b1220 14%, transparent);
          box-shadow: inset 0 0 0 1px var(--track-border);
        }
        .pb__fill{
          width: var(--pb-value); height:100%;
          background: linear-gradient(90deg, var(--fill-a), var(--fill-b));
          box-shadow: 0 0 12px rgba(75,107,250,.35), inset 0 0 8px rgba(255,255,255,.25);
        }
        .pb__tick{
          position:absolute; top:50%; transform:translate(-50%,-50%);
          left: var(--left); width:12px; height:12px; border-radius:50%;
          background:#4B6BFA; border:2px solid #fff; box-shadow:0 0 0 2px rgba(75,107,250,.35);
        }
        :root:not(.theme-dark) .pb__tick{ background:#3147d6; }
        .pb__meta{ display:flex; justify-content:space-between; margin-top:6px; font-size:12px; opacity:.9 }
      `}</style>
    </div>
  );
}
