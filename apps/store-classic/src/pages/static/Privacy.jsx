// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Privacy.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Page, Section, Bullets } from "./_helpers.jsx";
import { TT } from "../../i18n/tt.js";

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export default function Privacy() {
  const { t, i18n } = useTranslation();
  const base = "pages.privacy";

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

  const legalBasis = asArray(t(`${base}.legalBasis`, { returnObjects: true, defaultValue: [] }));
  const sections = asArray(t(`${base}.sections`, { returnObjects: true, defaultValue: [] }));
  const processors = asArray(t(`${base}.processors`, { returnObjects: true, defaultValue: [] }));

  const title = TT(i18n, t, `${base}.title`, {
    sv: "Integritetspolicy",
    en: "Privacy Policy",
    tr: "Gizlilik politikası",
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
    sv: "Vi samlar minsta möjliga data för att driva butiken och hålla ditt konto säkert.",
    en: "We collect the minimum data required to run the store and keep your account secure.",
    tr: "Mağazayı çalıştırmak ve hesabını güvenli tutmak için gereken en az veriyi toplarız.",
  });

  const legalBasisTitle = TT(i18n, t, "privacy.legalBasis.title", {
    sv: "Rättslig grund",
    en: "Legal basis",
    tr: "Hukuki dayanak",
  });

  const processorsTitle = TT(i18n, t, "privacy.processors.title", {
    sv: "Personuppgiftsbiträden",
    en: "Data processors",
    tr: "Veri işleyenler",
  });

  return (
    <Page title={title} updatedAt={updatedAt} intro={intro}>
      {legalBasis.length ? (
        <>
          <Section title={legalBasisTitle} body="" />
          <Bullets items={legalBasis} />
        </>
      ) : null}

      {sections.map((section, index) => (
        <Section
          key={`${section?.title || "privacy-section"}-${index}`}
          title={section?.title || ""}
          body={section?.body || ""}
        />
      ))}

      {processors.length ? (
        <>
          <Section title={processorsTitle} body="" />
          <Bullets items={processors} />
        </>
      ) : null}
    </Page>
  );
}