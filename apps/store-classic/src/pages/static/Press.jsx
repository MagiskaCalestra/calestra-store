// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Press.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Page, Section, Bullets, QA } from "./_helpers.jsx";
import { TT } from "../../i18n/tt.js";

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function fixCalestraDomains(value) {
  return String(value || "")
    .replaceAll("press@calestra.com", "press@calestraworld.com")
    .replaceAll("support@calestra.com", "support@calestraworld.com")
    .replaceAll("info@calestra.com", "info@calestraworld.com")
    .replaceAll("contact@calestra.com", "contact@calestraworld.com")
    .replaceAll("hello@calestra.com", "hello@calestraworld.com")
    .replaceAll("privacy@calestra.com", "privacy@calestraworld.com")
    .replaceAll("careers@calestra.com", "careers@calestraworld.com");
}

export default function Press() {
  const { t, i18n } = useTranslation();
  const base = "pages.press";

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

  const assetsRaw = asObject(t(`${base}.assets`, { returnObjects: true, defaultValue: {} }));
  const sectionsRaw = asArray(t(`${base}.sections`, { returnObjects: true, defaultValue: [] }));
  const faqRaw = asArray(t(`${base}.faq`, { returnObjects: true, defaultValue: [] }));

  const assets = {
    title: fixCalestraDomains(assetsRaw?.title),
    items: asArray(assetsRaw?.items).map(fixCalestraDomains),
  };

  const sections = sectionsRaw.map((section) => ({
    title: fixCalestraDomains(section?.title),
    body: fixCalestraDomains(section?.body),
  }));

  const faq = faqRaw
    .filter((item) => item?.q && item?.a)
    .map((item) => ({
      q: fixCalestraDomains(item.q),
      a: fixCalestraDomains(item.a),
    }));

  const title = TT(i18n, t, `${base}.title`, {
    sv: "Press & Media",
    en: "Press & Media",
    tr: "Basın & Medya",
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
    sv: "Logotyper, bilder och vinklar för journalister och kreatörer.",
    en: "Logos, images and story angles for journalists and creators.",
    tr: "Gazeteciler ve içerik üreticileri için logolar, görseller ve hikâye başlıkları.",
  });

  return (
    <Page title={title} updatedAt={updatedAt} intro={intro}>
      {assets.title || assets.items.length ? (
        <section className="static-section">
          {assets.title ? <h2 className="static-h2">{assets.title}</h2> : null}
          {assets.items.length ? <Bullets items={assets.items} /> : null}
        </section>
      ) : null}

      {sections.map((section, index) => (
        <Section
          key={`${section.title || "press-section"}-${index}`}
          title={section.title}
          body={section.body}
        />
      ))}

      {faq.length ? <QA items={faq} /> : null}
    </Page>
  );
}