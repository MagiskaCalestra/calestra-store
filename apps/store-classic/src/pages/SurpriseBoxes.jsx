// D:\WebProjects\Calestra\apps\store-classic\src\pages\SurpriseBoxes.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import StoreProgress from "../components/StoreProgress.jsx";

export default function SurpriseBoxes() {
  const { t } = useTranslation();

  return (
    <div className="surprise-page">
      <header className="surprise-hero">
        <div className="surprise-hero-inner">
          <div className="surprise-kicker">
            {t("surprise.kicker", "FIRST DROP ✦ LIMITED")}
          </div>

          <h1>{t("surprise.title", "Starlight Surprise Boxes ✦")}</h1>

          <p>
            {t(
              "surprise.lead",
              "Inuti varje box väntar något utvalt… kanske till och med något som väljer just dig."
            )}
          </p>

          <p className="surprise-hero-sub">
            {t(
              "surprise.subLead",
              "Två nivåer: grundbox med 3–5 magiska objekt – och Premium med extra collectibles, enamel badge och supporter-kod."
            )}
          </p>

          <div className="surprise-hero-note">
            {t(
              "surprise.note",
              "Endast ett begränsat antal i första vågen. När boxarna är slut är den här droppen över."
            )}
          </div>

          <Link to="/shop?cat=surprise-boxes" className="surprise-hero-cta">
            {t("surprise.cta", "Öppna din box →")}
          </Link>

          <div className="surprise-hero-meta">
            {t("surprise.meta", "För tidiga upptäckare. Inte för alla.")}
          </div>
        </div>
      </header>

      <section style={{ marginTop: "2rem" }}>
        <StoreProgress />
      </section>

      <section className="surprise-highlights">
        <article className="card">
          <div className="box-label">{t("surprise.cards.entry.badge", "ENTRY")}</div>
          <h3>{t("surprise.cards.entry.title", "Starlight Surprise Box ✦")}</h3>
          <p>
            {t(
              "surprise.cards.entry.body",
              "Basbox med 3–5 överraskningar från Calestras värld. Perfekt första steg in i universumet – och ett av de enklaste sätten att vara med från början."
            )}
          </p>
        </article>

        <article className="card premium">
          <div className="box-label">{t("surprise.cards.premium.badge", "PREMIUM")}</div>
          <h3>{t("surprise.cards.premium.title", "Starlight Surprise Box ✦ Premium")}</h3>
          <p>
            {t(
              "surprise.cards.premium.body",
              "Fler collectibles, enamel badge och exklusiv supporter-kod. För dig som inte bara vill hitta Calestra tidigt – utan hjälpa det växa."
            )}
          </p>
        </article>

        <article className="card">
          <div className="box-label">{t("surprise.cards.how.badge", "HOW IT WORKS")}</div>
          <h3>{t("surprise.cards.how.title", "Hur funkar det?")}</h3>
          <p>
            {t(
              "surprise.cards.how.body",
              "Du väljer box, vi plockar innehållet. Ingen box är exakt likadan – men alla bär en bit av Calestras hjärta."
            )}
          </p>
        </article>
      </section>

      <style>{`
        .surprise-page{
          max-width:1160px;
          margin:0 auto;
          padding:18px 16px 48px;
        }

        .surprise-hero{
          border-radius:28px;
          overflow:hidden;
          background:
            radial-gradient(circle at top right, rgba(251,191,36,.18), transparent 28%),
            linear-gradient(135deg, #0b1020, #141b31 52%, #24314f);
          color:#fff;
          box-shadow:0 24px 48px rgba(15,23,42,.20);
        }

        .surprise-hero-inner{ padding:34px 26px; }

        .surprise-kicker{
          display:inline-flex;
          padding:6px 10px;
          border-radius:999px;
          background:rgba(255,255,255,.10);
          border:1px solid rgba(255,255,255,.14);
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          margin-bottom:14px;
        }

        .surprise-hero h1{
          margin:0;
          font-size:clamp(32px, 5vw, 56px);
          line-height:1.02;
          letter-spacing:-.045em;
        }

        .surprise-hero p{
          margin:14px 0 0;
          max-width:760px;
          font-size:15px;
          line-height:1.7;
          font-weight:700;
          color:rgba(255,255,255,.92);
        }

        .surprise-hero-sub{ color:rgba(255,255,255,.84); }

        .surprise-hero-note{
          margin-top:16px;
          display:inline-flex;
          align-items:center;
          padding:10px 12px;
          border-radius:14px;
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.12);
          font-size:13px;
          font-weight:1000;
          line-height:1.45;
        }

        .surprise-hero-cta{
          margin-top:18px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-height:46px;
          padding:0 18px;
          border-radius:999px;
          background:#fff;
          color:#0f172a;
          text-decoration:none;
          font-weight:1000;
          box-shadow:0 16px 28px rgba(0,0,0,.18);
        }

        .surprise-hero-meta{
          margin-top:14px;
          font-size:12px;
          font-weight:900;
          letter-spacing:.06em;
          text-transform:uppercase;
          color:rgba(255,255,255,.72);
        }

        .surprise-highlights{
          display:grid;
          grid-template-columns:repeat(3, minmax(0,1fr));
          gap:16px;
          margin-top:22px;
        }

        .surprise-highlights .card{
          border-radius:22px;
          border:1px solid rgba(15,23,42,.08);
          background:linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
          box-shadow:0 16px 34px rgba(15,23,42,.06);
          padding:18px;
        }

        .surprise-highlights .card.premium{
          border-color:rgba(249,115,22,.22);
          box-shadow:0 18px 38px rgba(249,115,22,.10);
        }

        .box-label{
          display:inline-flex;
          padding:5px 9px;
          border-radius:999px;
          background:rgba(15,23,42,.06);
          border:1px solid rgba(15,23,42,.08);
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          margin-bottom:10px;
        }

        .surprise-highlights h3{
          margin:0 0 8px;
          font-size:22px;
          line-height:1.1;
          letter-spacing:-.03em;
          color:#0f172a;
        }

        .surprise-highlights p{
          margin:0;
          color:#475569;
          line-height:1.65;
          font-size:14px;
          font-weight:700;
        }

        @media (max-width: 900px){
          .surprise-highlights{ grid-template-columns:1fr; }
        }

        @media (max-width: 640px){
          .surprise-page{ padding:14px 12px 40px; }
          .surprise-hero-inner{ padding:24px 18px; }
        }
      `}</style>
    </div>
  );
}