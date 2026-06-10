// D:\WebProjects\Calestra\apps\store-classic\src\components\CelesteWisp.jsx
import React from "react";

/**
 * CelesteWisp — “stjärnkropp” (5-armad figur + små strålar + ögon)
 * - Ingen text/chatt här, bara avatar + glow.
 * - size kan vara 44–64 beroende på smak.
 */
export default function CelesteWisp({
  size = 52,
  mood = "calm", // calm | warm | gift | mystic (påverkar glow lite)
  title = "Celeste",
  onClick,
  onKeyDown,
  tabIndex = 0,
  style,
}) {
  const px = Number(size) || 52;

  const glow =
    mood === "warm"
      ? "rgba(255, 200, 120, .45)"
      : mood === "gift"
        ? "rgba(160, 220, 255, .45)"
        : mood === "mystic"
          ? "rgba(170, 140, 255, .45)"
          : "rgba(140, 200, 255, .36)";

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      style={{
        all: "unset",
        cursor: "pointer",
        width: px,
        height: px,
        display: "grid",
        placeItems: "center",
        borderRadius: 999,
        ...style,
      }}
    >
      <div
        style={{
          width: px,
          height: px,
          borderRadius: 999,
          position: "relative",
          filter: "drop-shadow(0 14px 28px rgba(0,0,0,.22))",
        }}
      >
        {/* Outer glow */}
        <div
          style={{
            position: "absolute",
            inset: -10,
            borderRadius: 999,
            background: `radial-gradient(circle at 50% 45%, ${glow}, transparent 60%)`,
            opacity: 0.9,
          }}
        />

        {/* Star body */}
        <svg
          width={px}
          height={px}
          viewBox="0 0 100 100"
          style={{
            position: "relative",
            zIndex: 2,
            display: "block",
          }}
        >
          <defs>
            <radialGradient id="cwCelesteCore" cx="50%" cy="38%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,.95)" />
              <stop offset="45%" stopColor="rgba(212,230,255,.90)" />
              <stop offset="100%" stopColor="rgba(120,160,255,.92)" />
            </radialGradient>

            <radialGradient id="cwCelesteEdge" cx="50%" cy="55%" r="75%">
              <stop offset="0%" stopColor="rgba(255,255,255,.00)" />
              <stop offset="75%" stopColor="rgba(15,23,42,.18)" />
              <stop offset="100%" stopColor="rgba(15,23,42,.35)" />
            </radialGradient>

            <filter id="cwSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 0.85 0"
              />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Small rays (subtle 25-ish feel) */}
          <g opacity="0.55" filter="url(#cwSoftGlow)">
            {Array.from({ length: 20 }).map((_, i) => {
              const a = (i * 360) / 20;
              return (
                <rect
                  key={i}
                  x="49.2"
                  y="6"
                  width="1.6"
                  height="10"
                  rx="1"
                  fill="rgba(255,255,255,.55)"
                  transform={`rotate(${a} 50 50)`}
                />
              );
            })}
          </g>

          {/* 5-armad star body */}
          <path
            d="M50 10
               L60 34
               L86 36
               L66 52
               L73 78
               L50 64
               L27 78
               L34 52
               L14 36
               L40 34
               Z"
            fill="url(#cwCelesteCore)"
            stroke="rgba(255,255,255,.55)"
            strokeWidth="1.2"
            filter="url(#cwSoftGlow)"
          />

          {/* inner shading */}
          <circle cx="50" cy="52" r="28" fill="url(#cwCelesteEdge)" opacity="0.55" />

          {/* Eyes */}
          <g>
            <circle cx="41" cy="50" r="3.0" fill="rgba(15,23,42,.88)" />
            <circle cx="59" cy="50" r="3.0" fill="rgba(15,23,42,.88)" />
            <circle cx="40.3" cy="49.2" r="1.1" fill="rgba(255,255,255,.9)" />
            <circle cx="58.3" cy="49.2" r="1.1" fill="rgba(255,255,255,.9)" />
          </g>

          {/* Tiny mouth / sparkle dot */}
          <circle cx="50" cy="60" r="1.2" fill="rgba(15,23,42,.55)" />
        </svg>
      </div>
    </button>
  );
}