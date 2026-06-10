import React, { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";

/**
 * MercuryKPI
 * â€“ 3D metallisk â€kvicksilverâ€ progress med neon-glow.
 * â€“ Klickbara milestones + portal-baserad tooltip (oklippbar).
 * â€“ Ljus/mörk tema, respekterar prefers-reduced-motion.
 *
 * Props:
 *  - progress: number (0â€“100)
 *  - milestones: Array<{ id:string; pct:number; title:string; body:string; reward:string; eta:string }>
 *  - i18n?: {
 *      reached:string, open:string, details:string,
 *      fields:{ target:string, eta:string, reward:string },
 *      cta:string, learnMore:string
 *    }
 *  - supportHref?: string (default "/shop?tag=support")
 *  - learnBaseHref?: string (default "/roadmap#")
 *  - className?: string
 */
export default function MercuryKPI({
  progress = 0,
  milestones = [],
  i18n = {
    reached: "Reached",
    open: "In progress",
    details: "Details",
    fields: { target: "Target", eta: "ETA", reward: "Reward" },
    cta: "Support this milestone",
    learnMore: "Learn more",
  },
  supportHref = "/shop?tag=support",
  learnBaseHref = "/roadmap#",
  className = "",
}) {
  const [open, setOpen] = useState(null); // index
  const [anchorRect, setAnchorRect] = useState(null);
  const uid = useId();
  const location = useLocation();

  // Stäng på routebyte
  useEffect(() => {
    setOpen(null);
    setAnchorRect(null);
  }, [location]);

  // Stäng på klick utanför/ESC
  useEffect(() => {
    const onBody = (e) => {
      const isInside = e.target?.closest?.(".mkpi-dot, .mkpi-tooltip");
      if (!isInside) {
        setOpen(null);
        setAnchorRect(null);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(null);
        setAnchorRect(null);
      }
    };
    document.addEventListener("click", onBody);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onBody);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Håll portalposition i synk
  useEffect(() => {
    if (open == null) return;
    const sync = () => {
      const dot = document.querySelectorAll(`.mkpi .mkpi-dot`)[open];
      if (dot) setAnchorRect(dot.getBoundingClientRect());
    };
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open]);

  const pct = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <div className={`mkpi ${className}`} role="group" aria-label="Community progress">
      {/* 3D bas / â€rännaâ€ */}
      <div className="mkpi-rail" aria-hidden />

      {/* Fyllningen (kvicksilver) */}
      <div className="mkpi-fill" style={{ "--mkpi": `${pct}%` }} />

      {/* Neon-kant (över) */}
      <div className="mkpi-topedge" aria-hidden />

      {/* Milestone-dots */}
      {milestones.map((m, i) => {
        const left = `calc(${m.pct}% - 10px)`;
        const reached = pct >= m.pct;
        const isOpen = open === i;
        return (
          <button
            key={`${uid}-${m.pct}`}
            className={`mkpi-dot ${reached ? "is-reached" : ""} ${isOpen ? "is-open" : ""}`}
            style={{ left }}
            title={`${m.pct}%`}
            aria-label={`${m.pct}%`}
            aria-expanded={isOpen}
            onClick={(e) => {
              const next = isOpen ? null : i;
              setOpen(next);
              setAnchorRect(next == null ? null : e.currentTarget.getBoundingClientRect());
            }}
            type="button"
          />
        );
      })}

      {/* Skala under */}
      <div className="mkpi-scale">25 / 50 / 75 / 100</div>

      {/* Tooltip (portal) */}
      <TooltipPortal open={open != null} anchorRect={anchorRect}>
        {open != null && (
          <>
            <span className="mkpi-tail" aria-hidden />
            <header className="mkpi-th">
              <span className={`mkpi-chip ${pct >= milestones[open].pct ? "ok" : "open"}`}>
                {pct >= milestones[open].pct ? i18n.reached : i18n.open}
              </span>
              <strong>{milestones[open].title}</strong>
            </header>
            <p className="mkpi-tp">{milestones[open].body}</p>
            <ul className="mkpi-tmeta" aria-label={i18n.details}>
              <li>
                <span>{i18n.fields.target}:</span> {milestones[open].pct}%
              </li>
              <li>
                <span>{i18n.fields.eta}:</span> {milestones[open].eta}
              </li>
              <li>
                <span>{i18n.fields.reward}:</span> {milestones[open].reward}
              </li>
            </ul>
            <div className="mkpi-actions">
              <Link className="btn btn--primary" to={supportHref}>
                {i18n.cta}
              </Link>
              <Link className="btn btn--ghost" to={`${learnBaseHref}${milestones[open].id}`}>
                {i18n.learnMore}
              </Link>
            </div>
          </>
        )}
      </TooltipPortal>

      <style>{css}</style>
    </div>
  );
}

/** Portal som placerar tooltippen över allt (oklippbar) */
function TooltipPortal({ open, anchorRect, children }) {
  if (!open || !anchorRect) return null;

  const vw =
    Math.max(document.documentElement.clientWidth, window.innerWidth || 0) || 1024;
  const maxW = Math.min(560, Math.max(300, vw * 0.92));
  const centerX = anchorRect.left + anchorRect.width / 2;
  const top = anchorRect.bottom + 14;
  const left = Math.round(Math.min(Math.max(centerX - maxW / 2, 8), vw - maxW - 8));
  const style = { position: "fixed", top: `${top}px`, left: `${left}px`, width: `${maxW}px`, zIndex: 10000 };

  return createPortal(
    <div className="mkpi-tooltip" style={style} role="dialog" aria-modal="false">
      {children}
    </div>,
    document.body
  );
}

/* â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”
   CSS â€” 3D Metallic/Neon â€Mercuryâ€ Progress
   â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€” */
const css = `
:root{
  --mkpi-h: 18px;           /* rännans höjd */
  --mkpi-r: 999px;          /* rundning */
  --mkpi-depth: 18px;       /* visuell djupkant */
  --mkpi-w: 100%;
  --mkpi: 0%;

  /* Ljusläge tokens */
  --mkpi-rail-bg: #E9EDF5;
  --mkpi-rail-stroke: #C9D1E0;
  --mkpi-metal-1: #fdfdfd;
  --mkpi-metal-2: #cfd6e6;
  --mkpi-metal-3: #9aa7c6;
  --mkpi-neon: #7C8BFF;

  /* Mörkt läge tokens */
  --mkpi-rail-bg-d: #0D1420;
  --mkpi-rail-stroke-d: #243041;
  --mkpi-metal-1-d: #e9eefb;
  --mkpi-metal-2-d: #6f7ea3;
  --mkpi-metal-3-d: #2b3650;
  --mkpi-neon-d: #8FA2FF;
}

/* Bas */
.mkpi{
  position: relative;
  width: var(--mkpi-w);
  margin: 14px 0 8px;
  padding-top: 8px; /* plats för glow */
}

/* Ränna / 3D-säte */
.mkpi-rail{
  position: relative;
  height: var(--mkpi-h);
  border-radius: var(--mkpi-r);
  background:
    linear-gradient(180deg,
      color-mix(in oklab, var(--mkpi-rail-bg) 86%, #fff 0%) 0%,
      var(--mkpi-rail-bg) 50%,
      color-mix(in oklab, var(--mkpi-rail-bg) 70%, #000 20%) 100%);
  border: 1px solid var(--mkpi-rail-stroke);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.6),
    inset 0 -1px 0 rgba(0,0,0,.06),
    0 6px var(--mkpi-depth) rgba(0,0,0,.10);
  overflow: hidden;
}
:root.theme-dark .mkpi-rail{
  background:
    linear-gradient(180deg,
      color-mix(in oklab, var(--mkpi-rail-bg-d) 85%, #fff 6%) 0%,
      var(--mkpi-rail-bg-d) 55%,
      color-mix(in oklab, var(--mkpi-rail-bg-d) 75%, #000 22%) 100%);
  border-color: var(--mkpi-rail-stroke-d);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    inset 0 -1px 0 rgba(0,0,0,.35),
    0 12px var(--mkpi-depth) rgba(0,0,0,.45);
}

/* Metallisk kvicksilverfyllning (med vågig topp + â€bubblorâ€) */
.mkpi-fill{
  position:absolute; inset: 0 auto 0 0;
  width: var(--mkpi);
  border-radius: var(--mkpi-r);
  /* basmetall med highlights */
  background:
    /* rörlig spegling */
    linear-gradient(100deg,
      transparent 0% 15%,
      color-mix(in oklab, var(--mkpi-metal-1), transparent 55%) 25%,
      color-mix(in oklab, var(--mkpi-metal-2), transparent 35%) 38%,
      color-mix(in oklab, var(--mkpi-metal-3), transparent 25%) 52%,
      transparent 65% 100%) ,
    /* grundfärg */
    linear-gradient(180deg,
      color-mix(in oklab, var(--mkpi-metal-1), transparent 25%) 0%,
      color-mix(in oklab, var(--mkpi-metal-2), transparent 0%) 60%,
      color-mix(in oklab, var(--mkpi-metal-3), transparent 0%) 100%);
  /* vågig topp via mask */
  -webkit-mask:
    radial-gradient(25px 8px at 0% 0%, rgba(0,0,0,.85) 60%, transparent 61%) repeat-x,
    linear-gradient(#000,#000);
  -webkit-mask-size: 40px 14px, auto;
  -webkit-mask-position: 0 -6px, 0 0;
  mask:
    radial-gradient(25px 8px at 0% 0%, rgba(0,0,0,.85) 60%, transparent 61%) repeat-x,
    linear-gradient(#000,#000);
  mask-size: 40px 14px, auto;
  mask-position: 0 -6px, 0 0;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.55),
    inset 0 -1px 0 rgba(0,0,0,.22),
    0 0 22px color-mix(in oklab, var(--mkpi-neon), transparent 45%),
    0 0 8px color-mix(in oklab, var(--mkpi-neon), transparent 35%);
  overflow: hidden;
}
:root.theme-dark .mkpi-fill{
  background:
    linear-gradient(100deg,
      transparent 0% 15%,
      color-mix(in oklab, var(--mkpi-metal-1-d), transparent 55%) 25%,
      color-mix(in oklab, var(--mkpi-metal-2-d), transparent 35%) 38%,
      color-mix(in oklab, var(--mkpi-metal-3-d), transparent 25%) 52%,
      transparent 65% 100%) ,
    linear-gradient(180deg,
      color-mix(in oklab, var(--mkpi-metal-1-d), transparent 30%) 0%,
      var(--mkpi-metal-2-d) 58%,
      var(--mkpi-metal-3-d) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.15),
    inset 0 -1px 0 rgba(0,0,0,.55),
    0 0 24px color-mix(in oklab, var(--mkpi-neon-d), transparent 35%),
    0 0 10px color-mix(in oklab, var(--mkpi-neon-d), transparent 30%);
}

/* Rörliga highlights + bubblor */
.mkpi-fill::before,
.mkpi-fill::after{
  content:""; position:absolute; inset:0; pointer-events:none; border-radius: inherit;
}
.mkpi-fill::before{
  /* flytande spegling */
  background:
    repeating-linear-gradient(100deg,
      rgba(255,255,255,.25) 0 2px,
      transparent 2px 6px);
  mix-blend-mode: screen;
  opacity:.28;
  transform: translateX(-20%);
  animation: mkpiSweep 4.5s linear infinite;
}
.mkpi-fill::after{
  /* bubblor som stiger */
  background:
    radial-gradient(6px 10px at 14% 80%, rgba(255,255,255,.35), transparent 60%),
    radial-gradient(4px 7px  at 36% 85%, rgba(255,255,255,.35), transparent 60%),
    radial-gradient(5px 8px  at 62% 88%, rgba(255,255,255,.32), transparent 60%),
    radial-gradient(7px 11px at 78% 82%, rgba(255,255,255,.35), transparent 60%);
  opacity:.35;
  animation: mkpiBubbles 3.8s ease-in-out infinite;
}

/* Neon-kant ovanpå vätskan (ger â€emissiveâ€ känsla) */
.mkpi-topedge{
  position:absolute; left:0; top:0; height: 8px; width: var(--mkpi);
  transform: translateY(-4px);
  border-radius: var(--mkpi-r);
  box-shadow:
    0 0 18px color-mix(in oklab, var(--mkpi-neon), transparent 40%),
    0 0 6px color-mix(in oklab, var(--mkpi-neon), transparent 35%);
}
:root.theme-dark .mkpi-topedge{
  box-shadow:
    0 0 22px color-mix(in oklab, var(--mkpi-neon-d), transparent 35%),
    0 0 8px color-mix(in oklab, var(--mkpi-neon-d), transparent 30%);
}

/* Milestone-dots */
.mkpi-dot{
  position:absolute; top: 50%; transform: translateY(-50%);
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid #fff; background: #4665F4;
  box-shadow:
    0 0 0 2px rgba(70,101,244,.25),
    0 4px 10px rgba(0,0,0,.35);
  cursor: pointer;
}
:root.theme-dark .mkpi-dot{
  border-color: #e6ebff;
  background: #4b6bfa;
  box-shadow:
    0 0 0 2px rgba(143,162,255,.25),
    0 6px 12px rgba(0,0,0,.5);
}
.mkpi-dot.is-reached{ filter: saturate(120%); }
.mkpi-dot:hover{ transform: translateY(-50%) scale(1.06); }
.mkpi-dot.is-open{ outline: 2px solid #4B6BFA; outline-offset: 2px; }
.mkpi-dot:focus-visible{ outline:3px solid rgba(75,107,250,.78); outline-offset:3px; }

/* Skala */
.mkpi-scale{ margin-top:8px; font-size:12px; opacity:.85 }

/* Tooltip (portal) */
.mkpi-tooltip{
  background: rgba(12,18,32,.92);
  color:#e8edf6;
  border:1px solid rgba(157,180,255,.25);
  border-radius:14px;
  padding:12px 12px 14px;
  box-shadow: 0 18px 44px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.04);
  line-height:1.45; white-space: normal; overflow-wrap:anywhere; word-break: keep-all; box-sizing:border-box;
  backdrop-filter:saturate(120%) blur(6px);
  animation: mkpiFade .16s ease-out both;
}
.mkpi-tail{
  position:absolute; left:50%; bottom:100%; transform: translateX(-50%);
  width:14px; height:14px; background: rgba(12,18,32,.92);
  border-left:1px solid rgba(157,180,255,.25);
  border-top:1px solid rgba(157,180,255,.25);
  rotate:45deg; border-top-left-radius:3px;
}
.mkpi-th{ display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.mkpi-chip{ font-size:11px; font-weight:800; padding:3px 8px; border-radius:999px; border:1px solid rgba(75,107,250,.28); }
.mkpi-chip.ok{ background:rgba(75,107,250,.14); color:#bfcaff; }
.mkpi-chip.open{ background:rgba(255,255,255,.06); color:#e8edf6; border-color: rgba(255,255,255,.14); }
.mkpi-tp{ margin:6px 0 8px; color:#d6deea; }
.mkpi-tmeta{ list-style:none; padding:0; margin:0 0 10px; display:grid; gap:4px; }
.mkpi-tmeta li{ font-size:13px; opacity:.95; }
.mkpi-tmeta li span{ opacity:.7; }
.mkpi-actions{ display:flex; gap:8px; flex-wrap:wrap; }
.mkpi-actions .btn{ text-decoration:none; }

/* Animationer */
@keyframes mkpiSweep{
  0%{ transform: translateX(-40%); opacity:.22; }
  50%{ opacity:.32; }
  100%{ transform: translateX(40%); opacity:.22; }
}
@keyframes mkpiBubbles{
  0%{ background-position: 0 0, 0 0, 0 0, 0 0; opacity:.30; }
  50%{ background-position: 0 -22px, 0 -28px, 0 -18px, 0 -24px; opacity:.38; }
  100%{ background-position: 0 -44px, 0 -56px, 0 -36px, 0 -48px; opacity:.30; }
}
@keyframes mkpiFade{ from{ opacity:0; transform: translateY(-6px); } to{ opacity:1; transform:none; } }

/* Respekt för användare som minskar motion */
@media (prefers-reduced-motion: reduce){
  .mkpi-fill::before, .mkpi-fill::after{ animation: none; }
}
`;
