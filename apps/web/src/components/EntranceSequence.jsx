// apps/web/src/components/EntranceSequence.jsx
import React, { useEffect, useState } from "react";

export default function EntranceSequence({ onDone }) {
  const [show, setShow] = useState(() => !sessionStorage.getItem("cw_entrance_done"));

  useEffect(() => {
    if (!show) return;
    const onKey = (e) => { if (e.key === "Enter" || e.key === " ") finish(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  if (!show) return null;

  const finish = () => {
    sessionStorage.setItem("cw_entrance_done", "1");
    // Be ljudspelaren om att starta (om användaren har klickat)
    window.dispatchEvent(new CustomEvent("cw.audio.requestStart"));
    setShow(false);
    onDone?.();
  };

  return (
    <div className="entrance" role="dialog" aria-modal="true" aria-label="Calestra World Intro" onClick={finish}>
      <div className="halo" aria-hidden />
      <div className="star" aria-hidden />
      <h1 className="title">Somewhereâ€¦ it waits for you</h1>
      <p className="sub">Tryck här för att gå in</p>
      <button className="cta" onClick={finish}>Kliv in</button>

      <style>{`
        .entrance {
          position: fixed; inset: 0; z-index: 100; display: grid; place-items: center;
          background: radial-gradient(1400px 520px at 50% 0%, #151a45 0%, #0b0f25 55%, #080a18 100%), #080a18;
          color: #e8ecff; text-align: center; user-select: none; cursor: pointer;
          animation: e_fade .6s ease both;
        }
        .halo { position:absolute; top:-160px; left:50%; transform:translateX(-50%); width:1400px; height:1100px;
          background: radial-gradient(closest-side, rgba(156,176,255,.22), rgba(148,167,255,.08) 40%, transparent 70%);
          filter: blur(2px); pointer-events:none; }
        .star {
          width: 140px; height: 140px; margin: -60px auto 4px;
          background: radial-gradient(closest-side, #d6e2ff, #a6b7ff 35%, transparent 70%);
          clip-path: polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);
          filter: drop-shadow(0 0 22px #95a8ff);
          animation: e_pulse 3.2s ease-in-out infinite;
        }
        .title { font-family: var(--font-display); font-size: clamp(28px, 6vw, 56px); margin: 10px 0 6px; }
        .sub { opacity:.9; margin: 0 0 10px; }
        .cta {
          padding: 12px 18px; border-radius: 12px; border: 1px solid #2c3aa0;
          background: linear-gradient(180deg, #1c2a80, #13205e); color: #fff; cursor: pointer;
          font-weight: 600; letter-spacing: .2px;
        }
        @keyframes e_pulse { 0%,100% { opacity:.85; transform: scale(1) } 50%{ opacity:1; transform: scale(1.06)} }
        @keyframes e_fade { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
