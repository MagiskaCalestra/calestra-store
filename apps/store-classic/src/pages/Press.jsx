import React from "react";
import { useTranslation } from "react-i18next";
import { TT } from "../i18n/tt.js";

export default function Press() {
  const { t, i18n } = useTranslation();

  return (
    <main className="doc container" style={{ maxWidth: 900 }}>
      <header style={{ marginBottom: 24 }}>
        <h1>
          {TT(i18n, t, "pages.press.title", {
            sv: "Press & Media",
            en: "Press & Media",
            tr: "Basın & Medya",
          })}
        </h1>

        <p style={{ opacity: 0.8 }}>
          {TT(i18n, t, "pages.press.intro", {
            sv: "Logotyper, bilder och material för journalister och kreatörer.",
            en: "Logos, images and materials for journalists and creators.",
            tr: "Gazeteciler ve içerik üreticileri için logolar ve görseller.",
          })}
        </p>
      </header>

      {/* Kontakt */}
      <section style={{ marginBottom: 24 }}>
        <h3>
          {TT(i18n, t, "pages.press.sections.1.title", {
            sv: "Kontakt",
            en: "Contact",
            tr: "İletişim",
          })}
        </h3>

        <p>
          {TT(i18n, t, "pages.press.sections.1.body", {
            sv: "Pressfrågor: press@calestra.world",
            en: "Press inquiries: press@calestra.world",
            tr: "Basın soruları: press@calestra.world",
          })}
        </p>
      </section>

      {/* Assets */}
      <section style={{ marginBottom: 24 }}>
        <h3>
          {TT(i18n, t, "pages.press.assets.title", {
            sv: "Varumärkesmaterial",
            en: "Brand assets",
            tr: "Marka dosyaları",
          })}
        </h3>

        <ul>
          <li>
            {TT(i18n, t, "pages.press.assets.items.0", {
              sv: "Logotyper (ljus/mörk)",
              en: "Logos (light/dark)",
              tr: "Logolar (açık/koyu)",
            })}
          </li>
          <li>
            {TT(i18n, t, "pages.press.assets.items.1", {
              sv: "Produktbilder",
              en: "Product images",
              tr: "Ürün görselleri",
            })}
          </li>
          <li>
            {TT(i18n, t, "pages.press.assets.items.2", {
              sv: "Kort företagsbeskrivning",
              en: "Company overview",
              tr: "Şirket tanıtımı",
            })}
          </li>
        </ul>

        <p style={{ marginTop: 10, opacity: 0.7 }}>
          {TT(i18n, t, "pages.press.assets.request", {
            sv: "Material tillhandahålls på begäran.",
            en: "Assets available on request.",
            tr: "Dosyalar talep üzerine paylaşılır.",
          })}
        </p>
      </section>

      {/* Boilerplate */}
      <section>
        <h3>
          {TT(i18n, t, "pages.press.boilerplateTitle", {
            sv: "Kort beskrivning",
            en: "Boilerplate",
            tr: "Kısa tanım",
          })}
        </h3>

        <p style={{ lineHeight: 1.6 }}>
          {TT(i18n, t, "pages.press.boilerplate", {
            sv: "Calestra World förenar design, känsla och framtid. Butiken finansierar en större upplevelse som byggs steg för steg tillsammans med communityn.",
            en: "Calestra World blends design, emotion and future. The store funds a larger experience built step by step with the community.",
            tr: "Calestra World tasarım, duygu ve geleceği birleştirir. Mağaza, toplulukla birlikte adım adım inşa edilen daha büyük bir deneyimi finanse eder.",
          })}
        </p>
      </section>
    </main>
  );
}