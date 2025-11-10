// apps/web/src/components/HeroBooking.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CCoreSDK } from "../core/ccore";
import Starfield from "./Starfield";
import GlowDust from "./GlowDust";
import bgUrl from "@assets/portal-neutral.jpg";

function toISO(d){ return new Date(d).toISOString().slice(0,10); }
function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export default function HeroBooking() {
  const nav = useNavigate();
  const today = toISO(new Date());
  const [mode, setMode] = useState("park"); // park | hotel | package | custom
  const [date, setDate] = useState(today);
  const [nights, setNights] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const checkout = useMemo(() => toISO(addDays(date, Math.max(1, Number(nights)||1))), [date, nights]);
  const isOperator = CCoreSDK.Affiliates?.isOperator?.() || false;

  // Parallax: uppdatera CSS-variabler vid musrörelse/scroll
  useEffect(() => {
    const root = document.documentElement;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;   // -5..5
      const y = (e.clientY / window.innerHeight - 0.5) * 6;   // -3..3
      root.style.setProperty("--hb-tilt-x", `${x.toFixed(2)}px`);
      root.style.setProperty("--hb-tilt-y", `${y.toFixed(2)}px`);
    };
    const onScroll = () => {
      const p = Math.min(1, window.scrollY / 400);
      root.style.setProperty("--hb-tilt-s", String(1 + p * 0.03));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("scroll", onScroll); };
  }, []);

  const go = () => {
    if (mode === "park" || mode === "package" || mode === "custom") {
      const q = new URLSearchParams({ date, adults: String(adults), children: String(children) }).toString();
      nav(`/booking?${q}`);
      return;
    }
    if (mode === "hotel") {
      if (isOperator) {
        nav(`/hotels?checkin=${date}&checkout=${checkout}`);
      } else {
        try {
          const url = CCoreSDK.Affiliates.buildLink("hotels", { city: "Grand Calestra", checkin: date, checkout });
          window.open(url, "_blank", "noopener,noreferrer");
        } catch { /* ignorera */ }
      }
    }
  };

  return (
    <section className={"hb-hero "+mode} aria-label="Bokningsmotor">
      {/* Bakgrundslager */}
      <div className="bg" aria-hidden />
      <div className="veil" aria-hidden />
      <div className="halo" aria-hidden />
      {/* Partiklar */}
      <Starfield density={90} speed={0.05} />
      <GlowDust count={26} />

      <div className="hb-wrap">
        <div className="hb-star" aria-hidden />
        <h1 className="hb-title display">Somewhere… it waits for you</h1>
        <p className="hb-sub">Välj hur du vill uppleva Calestra.</p>

        {/* Ikonrad */}
        <ul className="hero-links" aria-label="Snabbval">
          <li><Link to="/booking" className="link">🎟 Boka ditt magiska paket</Link></li>
          <li><a className="link" href="http://localhost:5175/" target="_blank" rel="noopener noreferrer">🛍 Calestra Store ↗</a></li>
          <li><Link className="link" to="/concerts">🎵 Musik & konserter</Link></li>
          <li><Link className="link" to="/experiences">📜 Våra berättelser</Link></li>
          <li><Link className="link" to="/wish">✨ C-Wish® Access</Link></li>
        </ul>

        {/* Kort motor */}
        <div className="hb-card">
          <div className="hb-modes" role="radiogroup" aria-label="Välj bokningsläge">
            <ModeBtn id="park"    cur={mode} onSelect={setMode} label="🎟 Park" />
            <ModeBtn id="hotel"   cur={mode} onSelect={setMode} label="🏨 Hotell" />
            <ModeBtn id="package" cur={mode} onSelect={setMode} label="✨ Paket" />
            <ModeBtn id="custom"  cur={mode} onSelect={setMode} label="🧩 Skapa själv" />
          </div>

          <div className="hb-grid">
            <label className="hb-lbl">Ankomst
              <input className="hb-inp" type="date" min={today} value={date} onChange={e=>setDate(e.target.value)} />
            </label>
            <label className="hb-lbl">Nätter
              <input className="hb-inp" type="number" min="1" value={nights} onChange={e=>setNights(e.target.value)} />
            </label>
            <label className="hb-lbl">Vuxna
              <input className="hb-inp" type="number" min="1" value={adults} onChange={e=>setAdults(Number(e.target.value)||1)} />
            </label>
            <label className="hb-lbl">Barn
              <input className="hb-inp" type="number" min="0" value={children} onChange={e=>setChildren(Number(e.target.value)||0)} />
            </label>
          </div>

          <button className="hb-cta" onClick={go}>Utforska ditt ljus</button>

          <p className="hb-note">
            {isOperator
              ? "Operatörsläge: paket & intern hotellbokning stöds."
              : "Affiliate-läge: hotell öppnas hos extern partner i ny flik."}
          </p>
        </div>
      </div>

      <style>{`
        .hb-hero { position: relative; padding: 78px 16px 36px; color:#e8ecff; overflow:hidden; }
        .hb-hero .bg { position:absolute; inset:0; background:url(${bgUrl}) center/cover no-repeat; transform: scale(calc(var(--hb-tilt-s,1))); filter: saturate(.92) brightness(.9); }
        .hb-hero .veil { position:absolute; inset:0;
          background: radial-gradient(1600px 540px at 50% 0%, rgba(10,12,32,.74) 0%, rgba(8,10,24,.94) 62%, #080a18 100%); }
        .hb-hero .halo { position:absolute; top:-180px; left:50%; width:1400px; height:1200px; transform:translateX(-50%);
          background: radial-gradient(closest-side, rgba(156,176,255,.22), rgba(148,167,255,.08) 40%, transparent 70%); filter: blur(2px); pointer-events:none; }

        .hb-wrap { position:relative; max-width: 1100px; margin: 0 auto; text-align: center; }
        .hb-star { width:122px; height:122px; margin:0 auto 10px;
          transform: translate(var(--hb-tilt-x,0px), var(--hb-tilt-y,0px));
          background: radial-gradient(closest-side, #d6e2ff, #a6b7ff 35%, transparent 70%);
          clip-path: polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);
          filter: drop-shadow(0 0 24px #95a8ff);
          animation: glow 3.6s ease-in-out infinite;
        }
        .hb-title { font-size: clamp(28px, 6vw, 56px); margin: 6px 0 6px; text-shadow: 0 2px 24px rgba(20,30,80,.35); }
        .hb-sub { opacity:.94; margin-bottom: 10px; text-shadow: 0 2px 18px rgba(16,24,64,.3); }

        .hero-links { display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:center; margin: 8px auto 12px; padding:0; list-style:none; }
        .hero-links .link { display:inline-flex; gap:6px; align-items:center; padding:6px 10px; border:1px solid #2b315e; border-radius:999px; background:#0f1430; color:#e8ecff; text-decoration:none; }
        .hero-links .link:hover { background:#141a3f; }

        .hb-card { display:inline-block; text-align:left; width: min(100%, 880px);
          border:1px solid #2b315e; border-radius:18px; padding:14px;
          background:rgba(9,12,28,.72); backdrop-filter: blur(6px); box-shadow: 0 10px 40px rgba(0,0,0,.45); }

        .hb-modes { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
        .hb-mode { padding:8px 12px; border-radius:999px; border:1px solid #2b315e; background:#0f1430; color:#e8ecff; cursor:pointer; }
        .hb-mode.sel { box-shadow: inset 0 0 0 1px #2c3aa0; background:#121a45; }

        .hb-grid { display:grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap:10px; }
        .hb-lbl { display:flex; flex-direction:column; gap:6px; }
        .hb-inp { padding:10px; border-radius:10px; border:1px solid #2b315e; background:#0b0f25; color:#e8ecff; }

        .hb-cta { margin-top: 12px; width:100%; padding:12px 14px; border-radius:12px; border:1px solid #2c3aa0;
          background: linear-gradient(180deg,#1c2a80,#13205e); color:#fff; cursor:pointer; font-weight:600; letter-spacing:.2px; }
        .hb-note { margin-top:6px; font-size:.9rem; opacity:.85; text-align:center; }

        /* lägesfeedback */
        .hb-hero.hotel .hb-star { filter: drop-shadow(0 0 22px #f3d68c); }
        .hb-hero.hotel .hb-cta { background: linear-gradient(180deg,#8a6a1e,#5f460e); border-color:#9b7b28; }
        .hb-hero.package .hb-star { filter: drop-shadow(0 0 22px #a6f1ff); }
        .hb-hero.custom .hb-star { filter: drop-shadow(0 0 22px #a9b7ff); }

        @media (max-width: 900px) { .hb-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .hb-grid { grid-template-columns: 1fr; } }

        @keyframes glow { 0%,100% { opacity:.92; transform: translate(var(--hb-tilt-x,0px), var(--hb-tilt-y,0px)) } 50%{ opacity:1; transform: translate(calc(var(--hb-tilt-x,0px) * 1.02), calc(var(--hb-tilt-y,0px) - 2px))} }
      `}</style>
    </section>
  );
}

function ModeBtn({ id, cur, onSelect, label }) {
  const sel = cur === id;
  return (
    <button
      role="radio"
      aria-checked={sel ? "true" : "false"}
      className={"hb-mode" + (sel ? " sel" : "")}
      onClick={() => onSelect(id)}
    >
      {label}
    </button>
  );
}
