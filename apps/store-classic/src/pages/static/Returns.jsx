// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Returns.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Page, Section, QA } from "./_helpers.jsx";
import { TT } from "../../i18n/tt.js";

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function fixCalestraDomains(value) {
  return String(value || "")
    .replaceAll("support@calestra.com", "support@calestraworld.com")
    .replaceAll("press@calestra.com", "press@calestraworld.com")
    .replaceAll("info@calestra.com", "info@calestraworld.com")
    .replaceAll("contact@calestra.com", "contact@calestraworld.com")
    .replaceAll("hello@calestra.com", "hello@calestraworld.com")
    .replaceAll("privacy@calestra.com", "privacy@calestraworld.com")
    .replaceAll("careers@calestra.com", "careers@calestraworld.com");
}

export default function Returns() {
  const { t, i18n } = useTranslation();
  const base = "pages.returns";

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
    sv: "Returer & Ångerrätt",
    en: "Returns & Right of Withdrawal",
    tr: "İade & Cayma Hakkı",
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
    sv: "Tillverkas på beställning • Trygg garanti vid fel.",
    en: "Made to order • Safe guarantee for defects.",
    tr: "Sipariş üzerine üretilir • Hatalarda güvenli garanti.",
  });

  const sections = asArray(t(`${base}.sections`, { returnObjects: true, defaultValue: [] })).map(
    (section) => ({
      title: fixCalestraDomains(section?.title),
      body: fixCalestraDomains(section?.body),
    })
  );

  const exceptions = asArray(
    t(`${base}.exceptions`, { returnObjects: true, defaultValue: [] })
  ).map(fixCalestraDomains);

  const faq = asArray(t(`${base}.faq`, { returnObjects: true, defaultValue: [] }))
    .filter((item) => item?.q && item?.a)
    .map((item) => ({
      q: fixCalestraDomains(item.q),
      a: fixCalestraDomains(item.a),
    }));

  const exceptionsTitle = TT(i18n, t, "returns.exceptions.title", {
    sv: "Undantag",
    en: "Exceptions",
    tr: "İstisnalar",
  });

  return (
    <Page title={title} updatedAt={updatedAt} intro={intro}>
      {sections.map((section, index) => (
        <Section
          key={`${section?.title || "returns-section"}-${index}`}
          title={section.title}
          body={section.body}
        />
      ))}

      {exceptions.length ? (
        <Section title={exceptionsTitle} body={exceptions.map((item) => `• ${item}`).join("\n")} />
      ) : null}

      {faq.length ? <QA items={faq} /> : null}
    </Page>
  );
}