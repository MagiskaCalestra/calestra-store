// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Contact.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Page, Section, KeyValue, QA } from "./_helpers.jsx";
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

export default function Contact() {
  const { t, i18n } = useTranslation();
  const base = "pages.contact";

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

  const contactRaw = asObject(t(`${base}.contact`, { returnObjects: true, defaultValue: {} }));
  const sectionsRaw = asArray(t(`${base}.sections`, { returnObjects: true, defaultValue: [] }));
  const faqRaw = asArray(t(`${base}.faq`, { returnObjects: true, defaultValue: [] }));

  const title = TT(i18n, t, `${base}.title`, {
    sv: "Kontakt",
    en: "Contact",
    tr: "İletişim",
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
    sv: "Vi läser varje meddelande.",
    en: "We read every message.",
    tr: "Her mesajı okuyoruz.",
  });

  const contact = {
    email: fixCalestraDomains(contactRaw.email || "support@calestraworld.com"),
    response: fixCalestraDomains(
      contactRaw.response ||
        TT(i18n, t, `${base}.contact.response`, {
          sv: "Vanligen svar inom 2–3 arbetsdagar.",
          en: "Typical response within 2–3 business days.",
          tr: "Genellikle 2–3 iş günü içinde dönüş yaparız.",
        })
    ),
  };

  const sections = sectionsRaw.length
    ? sectionsRaw.map((section) => ({
        title: fixCalestraDomains(section?.title || ""),
        body: fixCalestraDomains(section?.body || ""),
      }))
    : [
        {
          title: TT(i18n, t, `${base}.fallback.beforeWrite.title`, {
            sv: "Innan du skriver",
            en: "Before you write",
            tr: "Yazmadan önce",
          }),
          body: TT(i18n, t, `${base}.fallback.beforeWrite.body`, {
            sv: "Orderfrågor? Ange ditt order-ID. Press? Använd press@calestraworld.com.",
            en: "Order questions? Include your order ID. Press? Use press@calestraworld.com.",
            tr: "Sipariş sorusu mu? Sipariş numaranı ekle. Basın? press@calestraworld.com kullan.",
          }),
        },
      ];

  const validFaq = faqRaw.filter((item) => item?.q && item?.a);

  const faq = validFaq.length
    ? validFaq.map((item) => ({
        q: fixCalestraDomains(item.q),
        a: fixCalestraDomains(item.a),
      }))
    : [
        {
          q: TT(i18n, t, `${base}.fallback.phone.q`, {
            sv: "Har ni telefon?",
            en: "Do you have a phone number?",
            tr: "Telefon numaranız var mı?",
          }),
          a: TT(i18n, t, `${base}.fallback.phone.a`, {
            sv: "Vi arbetar primärt via e-post för träffsäkra och spårbara svar. Telefonsamtal bokas vid behov.",
            en: "We primarily work by email to keep responses accurate and traceable. Phone calls can be scheduled when needed.",
            tr: "Daha doğru ve izlenebilir yanıtlar için öncelikle e-posta ile çalışıyoruz. Telefon görüşmeleri gerektiğinde planlanabilir.",
          }),
        },
      ];

  return (
    <Page title={title} updatedAt={updatedAt} intro={intro}>
      <div className="kv-grid">
        <KeyValue label="Email" value={contact.email} />

        <KeyValue
          label={TT(i18n, t, "contact.responseTime", {
            sv: "Svarstid",
            en: "Response time",
            tr: "Yanıt süresi",
          })}
          value={contact.response}
        />
      </div>

      {sections.map((section, index) => (
        <Section
          key={`${section.title || "contact-section"}-${index}`}
          title={section.title}
          body={section.body}
        />
      ))}

      <QA items={faq} />
    </Page>
  );
}