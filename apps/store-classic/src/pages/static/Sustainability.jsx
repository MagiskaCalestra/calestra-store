// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Sustainability.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Page, Section, QA } from "./_helpers.jsx";
import { TT } from "../../i18n/tt.js";

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export default function Sustainability() {
  const { t, i18n } = useTranslation();
  const base = "pages.sustainability";

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
    sv: "Hållbarhet",
    en: "Sustainability",
    tr: "Sürdürülebilirlik",
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
    sv: "Calestra strävar efter att bygga långsiktigt – med omtanke för människor, upplevelser och miljö.",
    en: "Calestra aims to build for the long term — with care for people, experiences, and the environment.",
    tr: "Calestra uzun vadeli bir gelecek inşa etmeyi hedefler — insanlar, deneyimler ve çevre için özenle.",
  });

  const sections = asArray(
    t(`${base}.sections`, { returnObjects: true, defaultValue: [] })
  );

  const faq = asArray(
    t(`${base}.faq`, { returnObjects: true, defaultValue: [] })
  ).filter((item) => item?.q && item?.a);

  return (
    <Page title={title} updatedAt={updatedAt} intro={intro}>
      {sections.map((section, index) => (
        <Section
          key={`${section?.title || "sustainability-section"}-${index}`}
          title={section?.title || ""}
          body={section?.body || ""}
        />
      ))}

      {faq.length ? <QA items={faq} /> : null}
    </Page>
  );
}