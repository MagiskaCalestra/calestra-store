// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Vision.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Page, Section, Bullets } from "./_helpers.jsx";
import { TT } from "../../i18n/tt.js";

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export default function Vision() {
  const { t, i18n } = useTranslation();
  const base = "pages.vision";

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
    sv: "Vision & Värderingar",
    en: "Vision & Values",
    tr: "Vizyon & Değerler",
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
    sv: "Vi bygger en värld där förundran känns praktisk och framtiden känns varm.",
    en: "We build a world where wonder feels practical and the future feels warm.",
    tr: "Hayretin pratik, geleceğin sıcak hissettirdiği bir dünya kuruyoruz.",
  });

  const fallbackPrinciples = [
    TT(i18n, t, `${base}.fallback.principles.care`, {
      sv: "Omtanke — empati i hur vi designar och kommunicerar.",
      en: "Care — empathy in how we design and communicate.",
      tr: "Özen — tasarım ve iletişimde empati.",
    }),
    TT(i18n, t, `${base}.fallback.principles.craft`, {
      sv: "Hantverk — noggrannhet i material, detaljer och upplevelse.",
      en: "Craft — careful attention to materials, details, and experience.",
      tr: "İşçilik — malzeme, detay ve deneyimde titizlik.",
    }),
    TT(i18n, t, `${base}.fallback.principles.clarity`, {
      sv: "Tydlighet — enkla ord, ärliga tidslinjer och stabil leverans.",
      en: "Clarity — simple words, honest timelines, and stable delivery.",
      tr: "Açıklık — sade sözler, dürüst zaman çizelgeleri ve istikrarlı teslimat.",
    }),
  ];

  const fallbackSections = [
    {
      title: TT(i18n, t, `${base}.fallback.core.title`, {
        sv: "Kärnvärden",
        en: "Core values",
        tr: "Temel değerler",
      }),
      body: TT(i18n, t, `${base}.fallback.core.body`, {
        sv: "Calestra ska kännas varmt, tydligt och långsiktigt. Vi bygger med omtanke, hantverk och respekt för människors olika bakgrunder.",
        en: "Calestra should feel warm, clear, and long-term. We build with care, craft, and respect for people’s different backgrounds.",
        tr: "Calestra sıcak, açık ve uzun vadeli hissettirmeli. Özen, işçilik ve insanların farklı geçmişlerine saygıyla inşa ederiz.",
      }),
    },
    {
      title: TT(i18n, t, `${base}.fallback.promise.title`, {
        sv: "Löfte till communityt",
        en: "Promise to the community",
        tr: "Topluluğa sözümüz",
      }),
      body: TT(i18n, t, `${base}.fallback.promise.body`, {
        sv: "Vi delar framsteg, lärdomar och nästa steg på ett sätt som är ärligt, lugnt och användbart.",
        en: "We share progress, learnings, and next steps in a way that is honest, calm, and useful.",
        tr: "İlerlemeyi, öğrenimleri ve sonraki adımları dürüst, sakin ve faydalı bir şekilde paylaşırız.",
      }),
    },
    {
      title: TT(i18n, t, `${base}.fallback.avoid.title`, {
        sv: "Vad vi undviker",
        en: "What we avoid",
        tr: "Nelerden kaçınırız",
      }),
      body: TT(i18n, t, `${base}.fallback.avoid.body`, {
        sv: "Vi undviker överlöften, stressad massproduktion och uttryck som gör varumärket kortlivat. Calestra ska växa med värdighet.",
        en: "We avoid overpromising, rushed mass production, and expressions that make the brand short-lived. Calestra should grow with dignity.",
        tr: "Aşırı vaatlerden, acele seri üretimden ve markayı kısa ömürlü yapan ifadelerden kaçınırız. Calestra değerli ve dengeli büyümeli.",
      }),
    },
  ];

  const rawPrinciples = asArray(
    t(`${base}.principles`, { returnObjects: true, defaultValue: [] })
  );

  const rawSections = asArray(
    t(`${base}.sections`, { returnObjects: true, defaultValue: [] })
  );

  const principles = rawPrinciples.length ? rawPrinciples : fallbackPrinciples;
  const sections = rawSections.length ? rawSections : fallbackSections;

  return (
    <Page title={title} updatedAt={updatedAt} intro={intro}>
      <Bullets items={principles} />

      {sections.map((section, index) => (
        <Section
          key={`${section?.title || "vision-section"}-${index}`}
          title={section?.title || ""}
          body={section?.body || ""}
        />
      ))}
    </Page>
  );
}