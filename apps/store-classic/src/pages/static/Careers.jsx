// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Careers.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Page, Section, Bullets } from "./_helpers.jsx";
import { TT } from "../../i18n/tt.js";

export default function Careers() {
  const { t, i18n } = useTranslation();
  const base = "pages.careers";

  const dateStr = useMemo(() => {
    try {
      return new Date().toLocaleDateString(i18n.language || "sv", {
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

  const list = t(`${base}.list`, { returnObjects: true, defaultValue: [] });
  const benefits = t(`${base}.benefits`, { returnObjects: true, defaultValue: [] });
  const sections = t(`${base}.sections`, { returnObjects: true, defaultValue: [] });

  const title = TT(i18n, t, `${base}.title`, {
    sv: "Karriär",
    en: "Careers",
    tr: "Kariyer",
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
    sv: "Vill du vara med och bygga något större än en butik? Här börjar resan.",
    en: "Want to help build something bigger than a store? This is where it begins.",
    tr: "Bir mağazadan daha büyük bir şey inşa etmek ister misin? Yolculuk burada başlar.",
  });

  const benefitsTitle = TT(i18n, t, `${base}.benefitsTitle`, {
    sv: "Förmåner",
    en: "Benefits",
    tr: "Avantajlar",
  });

  return (
    <Page title={title} updatedAt={updatedAt} intro={intro}>
      <Bullets items={Array.isArray(list) ? list : []} />

      {Array.isArray(benefits) && benefits.length > 0 ? (
        <section className="static-section">
          <h2 className="static-h2">{benefitsTitle}</h2>
          <Bullets items={benefits} />
        </section>
      ) : null}

      {Array.isArray(sections) &&
        sections.map((s, i) => (
          <Section
            key={i}
            title={s?.title || ""}
            body={s?.body || ""}
          />
        ))}
    </Page>
  );
}