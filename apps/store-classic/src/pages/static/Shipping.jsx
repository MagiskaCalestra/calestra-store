// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Shipping.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Page, Section, Bullets, QA } from "./_helpers.jsx";
import { TT } from "../../i18n/tt.js";

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export default function Shipping() {
  const { t, i18n } = useTranslation();
  const base = "pages.shipping";

  const dateStr = useMemo(() => {
    try {
      return new Date().toLocaleDateString(i18n.language || "sv-SE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return new Date().toLocaleDateString("sv-SE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }, [i18n.language]);

  const title = TT(i18n, t, `${base}.title`, {
    sv: "Leverans & frakt",
    en: "Shipping",
    tr: "Teslimat & kargo",
  });

  const updatedAt = TT(
    i18n,
    t,
    `${base}.updatedAt`,
    {
      sv: "Senast uppdaterad: {{date}}",
      en: "Last updated: {{date}}",
      tr: "Son güncelleme: {{date}}",
    },
    { date: dateStr }
  );

  const intro = TT(i18n, t, `${base}.intro`, {
    sv: "Vi skickar inom EU och utvalda regioner. Global frakt är på väg.",
    en: "We ship within the EU and selected regions. Global shipping is on the way.",
    tr: "AB içinde ve seçili bölgelere gönderim yapıyoruz. Global gönderim yolda.",
  });

  const regions = asArray(t(`${base}.regions`, { returnObjects: true, defaultValue: [] }));
  const sections = asArray(t(`${base}.sections`, { returnObjects: true, defaultValue: [] }));
  const faq = asArray(t(`${base}.faq`, { returnObjects: true, defaultValue: [] })).filter(
    (item) => item?.q && item?.a
  );

  const regionsTitle = TT(i18n, t, "shipping.regions.title", {
    sv: "Regioner",
    en: "Regions",
    tr: "Bölgeler",
  });

  return (
    <Page title={title} updatedAt={updatedAt} intro={intro}>
      {regions.length ? (
        <section className="static-section">
          <h2 className="static-h2">{regionsTitle}</h2>
          <Bullets items={regions} />
        </section>
      ) : null}

      {sections.map((section, index) => (
        <Section
          key={`${section?.title || "shipping-section"}-${index}`}
          title={section?.title || ""}
          body={section?.body || ""}
        />
      ))}

      {faq.length ? <QA items={faq} /> : null}
    </Page>
  );
}