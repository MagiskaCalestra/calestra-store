// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\Terms.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Page, Section } from "./_helpers.jsx";
import { TT } from "../../i18n/tt.js";

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export default function Terms() {
  const { t, i18n } = useTranslation();
  const base = "pages.terms";

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
    sv: "Köpvillkor",
    en: "Terms & Conditions",
    tr: "Satın alma koşulları",
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
    sv: "Dessa villkor gäller för köp i Calestra Store och ska göra köpet tydligt, tryggt och lätt att förstå.",
    en: "These terms apply to purchases in Calestra Store and are designed to make each purchase clear, safe, and easy to understand.",
    tr: "Bu koşullar Calestra Store alışverişleri için geçerlidir ve alışverişi açık, güvenli ve kolay anlaşılır kılmak için hazırlanmıştır.",
  });

  const fallbackSections = [
    {
      title: TT(i18n, t, `${base}.fallback.order.title`, {
        sv: "Beställning",
        en: "Order",
        tr: "Sipariş",
      }),
      body: TT(i18n, t, `${base}.fallback.order.body`, {
        sv: "När du lägger en order får du en bekräftelse på att beställningen tagits emot. Avtal uppstår när ordern accepterats och registrerats i vårt system.",
        en: "When you place an order, you receive confirmation that the order has been received. An agreement is formed when the order has been accepted and registered in our system.",
        tr: "Sipariş verdiğinizde siparişin alındığına dair bir onay alırsınız. Sipariş sistemimizde kabul edilip kaydedildiğinde sözleşme oluşur.",
      }),
    },
    {
      title: TT(i18n, t, `${base}.fallback.prices.title`, {
        sv: "Priser",
        en: "Prices",
        tr: "Fiyatlar",
      }),
      body: TT(i18n, t, `${base}.fallback.prices.body`, {
        sv: "Priser visas i vald valuta. Moms ingår där det är tillämpligt. Frakt och eventuella avgifter specificeras i kassan innan köp slutförs.",
        en: "Prices are shown in the selected currency. VAT is included where applicable. Shipping and any fees are specified at checkout before the purchase is completed.",
        tr: "Fiyatlar seçilen para biriminde gösterilir. Uygun olduğu durumlarda KDV dahildir. Kargo ve olası ücretler satın alma tamamlanmadan önce ödeme adımında belirtilir.",
      }),
    },
    {
      title: TT(i18n, t, `${base}.fallback.payment.title`, {
        sv: "Betalning",
        en: "Payment",
        tr: "Ödeme",
      }),
      body: TT(i18n, t, `${base}.fallback.payment.body`, {
        sv: "Tillgängliga betalmetoder kan variera beroende på land, valuta och tekniskt launchläge.",
        en: "Available payment methods may vary depending on country, currency, and technical launch mode.",
        tr: "Kullanılabilir ödeme yöntemleri ülkeye, para birimine ve teknik lansman moduna göre değişebilir.",
      }),
    },
    {
      title: TT(i18n, t, `${base}.fallback.delivery.title`, {
        sv: "Leverans",
        en: "Delivery",
        tr: "Teslimat",
      }),
      body: TT(i18n, t, `${base}.fallback.delivery.body`, {
        sv: "Leveranstid varierar beroende på produkt, land och logistikflöde. Spårning skickas när ordern lämnar lagret om spårning finns tillgänglig för försändelsen.",
        en: "Delivery time varies depending on product, country, and logistics flow. Tracking is sent when the order leaves the warehouse if tracking is available for the shipment.",
        tr: "Teslimat süresi ürüne, ülkeye ve lojistik akışına göre değişir. Gönderi için takip mevcutsa sipariş depodan çıktığında takip bilgisi gönderilir.",
      }),
    },
    {
      title: TT(i18n, t, `${base}.fallback.returns.title`, {
        sv: "Returer",
        en: "Returns",
        tr: "İadeler",
      }),
      body: TT(i18n, t, `${base}.fallback.returns.body`, {
        sv: "Ångerrätt och returvillkor framgår på vår sida för returer. Returer ska göras enligt instruktioner från kundservice.",
        en: "Right of withdrawal and return terms are described on our returns page. Returns must be made according to customer service instructions.",
        tr: "Cayma hakkı ve iade koşulları iade sayfamızda açıklanır. İadeler müşteri hizmetlerinin talimatlarına göre yapılmalıdır.",
      }),
    },
    {
      title: TT(i18n, t, `${base}.fallback.liability.title`, {
        sv: "Ansvar",
        en: "Liability",
        tr: "Sorumluluk",
      }),
      body: TT(i18n, t, `${base}.fallback.liability.body`, {
        sv: "Vi ansvarar inte för förseningar eller hinder som ligger utanför vår rimliga kontroll, till exempel transportstörningar, myndighetsbeslut eller större tekniska avbrott.",
        en: "We are not responsible for delays or obstacles outside our reasonable control, such as transport disruptions, authority decisions, or major technical outages.",
        tr: "Makul kontrolümüz dışında kalan gecikme veya engellerden sorumlu değiliz; örneğin taşıma aksaklıkları, resmi kararlar veya büyük teknik kesintiler.",
      }),
    },
  ];

  const rawSections = asArray(
    t(`${base}.sections`, { returnObjects: true, defaultValue: [] })
  );

  const sections = rawSections.length ? rawSections : fallbackSections;

  return (
    <Page title={title} updatedAt={updatedAt} intro={intro}>
      {sections.map((section, index) => (
        <Section
          key={`${section?.title || "terms-section"}-${index}`}
          title={section?.title || ""}
          body={section?.body || ""}
        />
      ))}
    </Page>
  );
}