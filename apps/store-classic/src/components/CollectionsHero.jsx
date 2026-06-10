import React from "react";
import { useTranslation } from "react-i18next";
import "./collections-hero.css";

export default function CollectionsHero({ onShop, onSpeed }) {
  const { t } = useTranslation();
  return (
    <section className="collections-hero">
      <div className="collections-hero__inner">
        <h1 className="collections-hero__title">{t("collections.title")}</h1>
        <p className="collections-hero__lead">{t("collections.lead")}</p>
        <div className="collections-hero__cta">
          <button className="btn btn-primary" onClick={onShop}>
            {t("collections.shop")}
          </button>
          <button className="btn btn-ghost" onClick={onSpeed}>
            {t("collections.speed")}
          </button>
        </div>
      </div>
    </section>
  );
}
