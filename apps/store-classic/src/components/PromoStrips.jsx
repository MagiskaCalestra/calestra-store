// D:\WebProjects\Calestra\apps\store-classic\src\components\PromoStrips.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { IMG, pick } from "../assets/images.manifest";
import "./promo.css";

function safePick(group, fallback = "/images/brand/mark.svg") {
  try {
    const picked = pick(group, "random");
    return picked || fallback;
  } catch {
    return fallback;
  }
}

function Card({ to, img, title, body, eyebrow, cta, tone = "dark", featured = false }) {
  return (
    <Link
      to={to}
      className={[
        "promo-card",
        featured ? "promo-card--featured" : "",
        tone ? `promo-card--${tone}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={title}
      title={title}
    >
      <img src={img} alt="" className="promo-card__img" loading="lazy" />
      <div className="promo-card__overlay" />
      <div className="promo-card__glow" />

      <div className="promo-txt">
        {eyebrow && <span className="promo-eyebrow">{eyebrow}</span>}
        <h3>{title}</h3>
        {body && <p>{body}</p>}
        <span className="promo-cta">{cta}</span>
      </div>
    </Link>
  );
}

export default function PromoStrips() {
  const { t } = useTranslation();

  const cards = [
    {
      to: "/gallery",
      img: safePick(IMG?.portals),
      title: t("promoStrips.cards.gate.title"),
      body: t("promoStrips.cards.gate.body"),
      eyebrow: t("promoStrips.cards.gate.eyebrow"),
      cta: t("promoStrips.cards.gate.cta"),
      tone: "dark",
      featured: true,
    },
    {
      to: "/progress",
      img: safePick(IMG?.castle),
      title: t("promoStrips.cards.keep.title"),
      body: t("promoStrips.cards.keep.body"),
      eyebrow: t("promoStrips.cards.keep.eyebrow"),
      cta: t("promoStrips.cards.keep.cta"),
      tone: "accent",
    },
    {
      to: "/shop",
      img: safePick(IMG?.product),
      title: t("promoStrips.cards.drop.title"),
      body: t("promoStrips.cards.drop.body"),
      eyebrow: t("promoStrips.cards.drop.eyebrow"),
      cta: t("promoStrips.cards.drop.cta"),
      tone: "light",
    },
  ];

  return (
    <section className="promo-strips-wrap" aria-label={t("promoStrips.eyebrow")}>
      <div className="promo-head">
        <div className="promo-head__left">
          <span className="promo-kicker">{t("promoStrips.eyebrow")}</span>
          <h2>{t("promoStrips.title")}</h2>
          <p>{t("promoStrips.lead")}</p>
        </div>

        <div className="promo-head__right">
          <Link to="/shop" className="promo-head__cta">
            {t("promoStrips.shopCta")}
          </Link>
        </div>
      </div>

      <section className="promo-grid" aria-label={t("promoStrips.title")}>
        {cards.map((card) => (
          <Card key={card.to} {...card} />
        ))}
      </section>
    </section>
  );
}