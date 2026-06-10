// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Cookies.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Page, Section, QA } from "./_helpers.jsx";
import { TT } from "../../i18n/tt.js";

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export default function Cookies() {
  const { t, i18n } = useTranslation();
  const base = "pages.cookies";

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

  const sections = asArray(t(`${base}.sections`, { returnObjects: true, defaultValue: [] }));
  const manage = asObject(t(`${base}.manage`, { returnObjects: true, defaultValue: {} }));
  const faq = asArray(t(`${base}.faq`, { returnObjects: true, defaultValue: [] })).filter(
    (item) => item?.q && item?.a
  );

  const title = TT(i18n, t, `${base}.title`, {
    sv: "Cookies & spårning",
    en: "Cookies & Tracking",
    tr: "Çerezler & İzleme",
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
    sv: "Cookies håller kundvagnen igång och hjälper oss förstå användning.",
    en: "Cookies keep the cart working and help us understand usage.",
    tr: "Çerezler sepeti çalıştırır ve kullanımı anlamamıza yardım eder.",
  });

  return (
    <Page title={title} updatedAt={updatedAt} intro={intro}>
      {sections.map((section, index) => (
        <Section
          key={`${section?.title || "cookies-section"}-${index}`}
          title={section?.title || ""}
          body={section?.body || ""}
        />
      ))}

      {manage.title || manage.body ? (
        <Section title={manage.title || ""} body={manage.body || ""} />
      ) : null}

      <QA items={faq} />
    </Page>
  );
}