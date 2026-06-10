// D:\WebProjects\Calestra\apps\store-classic\src\components\HeroBanner.jsx
import React from "react";
import { Link } from "react-router-dom";
import { IMG, pick } from "../assets/images.manifest";
import { useTranslation } from "react-i18next";

export default function HeroBanner({ variant = "random" }) {
  const { t } = useTranslation();
  const src = pick(IMG.hero, variant);

  return (
    <section className="hero-banner" aria-label="Hero">
      <img src={src} alt={t("home.hero.title")} className="hero-bg" />

      <div className="hero-overlay hero-overlay--base" aria-hidden="true" />
      <div className="hero-overlay hero-overlay--warm" aria-hidden="true" />
      <div className="hero-overlay hero-overlay--vignette" aria-hidden="true" />
      <div className="hero-shine" aria-hidden="true" />
      <div className="hero-orb hero-orb--one" aria-hidden="true" />
      <div className="hero-orb hero-orb--two" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-topline">
          <span className="hero-live-dot" />
          <span className="hero-topline-text">
            {t("home.hero.live", "DROP MODE · EARLY ACCESS")}
          </span>
        </div>

        <div className="hero-eyebrow">
          {t("home.hero.eyebrow", "Du hittade den. Nu börjar allt.")}
        </div>

        <h1 className="hero-title">{t("home.hero.title")}</h1>

        <p className="hero-lead">{t("home.hero.lead")}</p>

        <div className="hero-signal-row" aria-hidden="true">
          <span className="hero-signal">{t("home.hero.signalOne", "Mer release")}</span>
          <span className="hero-signal">{t("home.hero.signalTwo", "Mer känsla")}</span>
          <span className="hero-signal">{t("home.hero.signalThree", "Mindre massmarknad")}</span>
        </div>

        <div className="hero-actions">
          <Link to="/shop" className="hero-btn hero-btn--primary">
            {t("home.hero.ctaPrimary", "Bär första ljuset")}
          </Link>

          <Link to="/progress" className="hero-btn hero-btn--secondary">
            {t("home.hero.ctaSecondary", "Följ början")}
          </Link>

          <Link to="/surprise-boxes" className="hero-btn hero-btn--ghost">
            {t("home.hero.ctaTertiary", "Upptäck Surprise Boxes")}
          </Link>
        </div>
      </div>

      <style>{`
        .hero-banner{
          position:relative;
          overflow:hidden;
          border-radius:28px;
          background:#0a0f1a;
          box-shadow:0 24px 70px rgba(0,0,0,0.22);
          isolation:isolate;
        }

        .hero-bg{
          width:100%;
          height:min(76vh, 780px);
          min-height:420px;
          object-fit:cover;
          object-position:center;
          display:block;
          transform:scale(1);
          animation:heroFloat 18s ease-in-out infinite alternate;
        }

        @keyframes heroFloat{
          from{ transform:scale(1.01); }
          to{ transform:scale(1.045); }
        }

        .hero-overlay{
          position:absolute;
          inset:0;
          pointer-events:none;
        }

        .hero-overlay--base{
          background:
            linear-gradient(
              180deg,
              rgba(5,10,22,0.08) 0%,
              rgba(5,10,22,0.18) 18%,
              rgba(5,10,22,0.42) 52%,
              rgba(5,10,22,0.86) 100%
            );
          z-index:1;
        }

        .hero-overlay--warm{
          background:
            radial-gradient(circle at 72% 26%, rgba(255,214,120,0.22) 0%, rgba(255,214,120,0.09) 18%, rgba(255,214,120,0) 42%),
            radial-gradient(circle at 18% 18%, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 18%, rgba(99,102,241,0) 42%);
          z-index:2;
        }

        .hero-overlay--vignette{
          background:
            radial-gradient(circle at center, transparent 38%, rgba(5,10,22,0.12) 64%, rgba(5,10,22,0.32) 100%);
          z-index:2;
        }

        .hero-shine{
          position:absolute;
          inset:-10% auto auto -20%;
          width:46%;
          height:140%;
          background:linear-gradient(115deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 38%, rgba(255,255,255,0));
          transform:rotate(8deg);
          mix-blend-mode:screen;
          opacity:.42;
          z-index:3;
          pointer-events:none;
        }

        .hero-orb{
          position:absolute;
          border-radius:999px;
          pointer-events:none;
          filter:blur(8px);
          z-index:2;
        }

        .hero-orb--one{
          right:-4%;
          bottom:-10%;
          width:240px;
          height:240px;
          background:radial-gradient(circle, rgba(251,191,36,0.20), rgba(251,191,36,0));
        }

        .hero-orb--two{
          left:-4%;
          top:-8%;
          width:220px;
          height:220px;
          background:radial-gradient(circle, rgba(99,102,241,0.18), rgba(99,102,241,0));
        }

        .hero-content{
          position:absolute;
          inset-inline:24px;
          bottom:28px;
          color:white;
          max-width:940px;
          display:flex;
          flex-direction:column;
          gap:12px;
          z-index:4;
        }

        .hero-topline{
          display:inline-flex;
          align-items:center;
          gap:8px;
          align-self:flex-start;
          padding:6px 10px;
          border-radius:999px;
          background:rgba(15,23,42,0.36);
          border:1px solid rgba(255,255,255,0.12);
          backdrop-filter:blur(8px);
          -webkit-backdrop-filter:blur(8px);
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
        }

        .hero-live-dot{
          width:8px;
          height:8px;
          border-radius:999px;
          background:#f97316;
          box-shadow:0 0 0 0 rgba(249,115,22,.45);
          animation:heroPulse 1.8s infinite;
        }

        @keyframes heroPulse{
          0%{ box-shadow:0 0 0 0 rgba(249,115,22,.45); }
          70%{ box-shadow:0 0 0 8px rgba(249,115,22,0); }
          100%{ box-shadow:0 0 0 0 rgba(249,115,22,0); }
        }

        .hero-topline-text{
          opacity:.98;
        }

        .hero-eyebrow{
          display:inline-flex;
          align-self:flex-start;
          padding:8px 12px;
          border-radius:999px;
          background:rgba(255,255,255,0.10);
          border:1px solid rgba(255,255,255,0.16);
          font-size:13px;
          font-weight:800;
          letter-spacing:.02em;
          backdrop-filter:blur(8px);
          -webkit-backdrop-filter:blur(8px);
        }

        .hero-title{
          margin:0;
          font-size:clamp(2.2rem, 4.8vw, 4.35rem);
          line-height:1.01;
          letter-spacing:-0.95px;
          text-wrap:balance;
          max-width:780px;
          text-shadow:0 10px 30px rgba(0,0,0,.24);
        }

        .hero-lead{
          margin:0;
          opacity:.95;
          font-size:clamp(1rem, 1.5vw, 1.15rem);
          line-height:1.6;
          max-width:760px;
          text-wrap:pretty;
          color:rgba(255,255,255,.95);
          font-weight:600;
          text-shadow:0 6px 20px rgba(0,0,0,.16);
        }

        .hero-signal-row{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          margin-top:2px;
        }

        .hero-signal{
          display:inline-flex;
          align-items:center;
          padding:6px 10px;
          border-radius:999px;
          background:rgba(255,255,255,0.10);
          border:1px solid rgba(255,255,255,0.14);
          font-size:11px;
          font-weight:900;
          letter-spacing:.08em;
          text-transform:uppercase;
          backdrop-filter:blur(6px);
          -webkit-backdrop-filter:blur(6px);
        }

        .hero-actions{
          display:flex;
          flex-wrap:wrap;
          gap:12px;
          margin-top:8px;
        }

        .hero-btn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-height:48px;
          padding:0 18px;
          border-radius:999px;
          text-decoration:none;
          font-weight:900;
          letter-spacing:.02em;
          transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
        }

        .hero-btn:hover{
          transform:translateY(-1px);
        }

        .hero-btn--primary{
          background:white;
          color:#0a0f1a;
          box-shadow:0 10px 28px rgba(0,0,0,0.20);
        }

        .hero-btn--secondary{
          background:rgba(255,255,255,0.12);
          color:white;
          border:1px solid rgba(255,255,255,0.18);
          backdrop-filter:blur(8px);
          -webkit-backdrop-filter:blur(8px);
        }

        .hero-btn--ghost{
          background:rgba(10,15,26,0.30);
          color:white;
          border:1px solid rgba(255,255,255,0.14);
          backdrop-filter:blur(8px);
          -webkit-backdrop-filter:blur(8px);
        }

        @media (max-width: 900px){
          .hero-bg{
            height:min(72vh, 720px);
          }
        }

        @media (max-width: 640px){
          .hero-banner{
            border-radius:22px;
          }

          .hero-bg{
            height:min(72vh, 620px);
            min-height:480px;
          }

          .hero-content{
            inset-inline:16px;
            bottom:18px;
            gap:10px;
          }

          .hero-eyebrow,
          .hero-topline{
            max-width:100%;
          }

          .hero-actions{
            gap:10px;
          }

          .hero-btn{
            width:100%;
          }

          .hero-signal-row{
            gap:6px;
          }
        }

        @media (prefers-reduced-motion: reduce){
          .hero-bg,
          .hero-live-dot,
          .hero-btn{
            animation:none;
            transition:none;
          }
        }
      `}</style>
    </section>
  );
}