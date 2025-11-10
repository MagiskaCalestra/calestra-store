import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * The Harmonic Star – interaktiv, klickbar och animerad.
 * Klick => fade ut + navigera till /world-3d
 */
export default function Star() {
  const [hover, setHover] = useState(false);
  const [clicked, setClicked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (clicked) {
      const t = setTimeout(() => navigate("/world-3d"), 1200);
      return () => clearTimeout(t);
    }
  }, [clicked]);

  return (
    <div
      className={`star-wrap ${hover ? "hover" : ""} ${clicked ? "clicked" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setClicked(true)}
      role="button"
      aria-label="Öppna Calestra World 3D"
      tabIndex={0}
    >
      <svg viewBox="0 0 200 200" width="160" height="160">
        <defs>
          <radialGradient id="grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="70%" stopColor="#a9b7ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1b1f4a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#grad)" />
        <polygon
          points="100,20 115,90 185,100 115,110 100,180 85,110 15,100 85,90"
          fill="#fff"
          fillOpacity="0.9"
        />
      </svg>

      <style>{`
        .star-wrap { position:relative; cursor:pointer; transition:transform .3s ease; }
        .star-wrap.hover { transform:scale(1.05); }
        .star-wrap svg { filter:drop-shadow(0 0 14px rgba(255,255,255,.5)); }
        .star-wrap.hover svg { filter:drop-shadow(0 0 22px rgba(255,255,255,.9)); }
        .star-wrap.clicked { animation:fadeout 1.2s forwards ease; }
        @keyframes fadeout {
          0%{opacity:1;transform:scale(1);}
          100%{opacity:0;transform:scale(1.4);}
        }
      `}</style>
    </div>
  );
}
