// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\_StaticScaffold.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Page, Section, KeyValue, Bullets, QA } from "./_helpers.jsx";
import { TT } from "../../i18n/tt.js";

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeObject(v) {
  return isPlainObject(v) ? v : null;
}

function friendlyTitleFromBaseKey(baseKey) {
  const last = String(baseKey || "").split(".").pop() || "Page";
  return last.charAt(0).toUpperCase() + last.slice(1);
}

export default function StaticScaffold({ baseKey }) {
  const { t, i18n } = useTranslation();

  const dateStr = useMemo(
    () =>
      new Date().toLocaleDateString(i18n?.language || "sv", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [i18n?.language]
  );

  const title = t(`${baseKey}.title`, {
    defaultValue: friendlyTitleFromBaseKey(baseKey),
  });

  const intro = t(`${baseKey}.intro`, { defaultValue: "" });

  const updatedAtStr = t(`${baseKey}.updatedAt`, {
    date: dateStr,
    defaultValue: TT(i18n, t, "static.updatedAt", {
      sv: `Senast uppdaterad: ${dateStr}`,
      en: `Last updated: ${dateStr}`,
      tr: `Son güncelleme: ${dateStr}`,
    }),
  });

  const company = safeObject(
    t(`${baseKey}.company`, { returnObjects: true, defaultValue: null })
  );

  const leadership = safeObject(
    t(`${baseKey}.leadership`, { returnObjects: true, defaultValue: null })
  );

  const advisory = safeObject(
    t(`${baseKey}.advisory`, { returnObjects: true, defaultValue: null })
  );

  const governance = safeObject(
    t(`${baseKey}.governance`, { returnObjects: true, defaultValue: null })
  );

  const sections = asArray(
    t(`${baseKey}.sections`, { returnObjects: true, defaultValue: [] })
  );

  const faq = asArray(
    t(`${baseKey}.faq`, { returnObjects: true, defaultValue: [] })
  );

  const hasCompany = !!(
    company?.name ||
    company?.org ||
    company?.hq ||
    company?.email
  );

  const hasGovernance = !!(
    governance?.title ||
    asArray(governance?.items).length
  );

  const hasAnyContent =
    !!intro ||
    hasCompany ||
    !!(leadership?.title || leadership?.body) ||
    !!(advisory?.title || advisory?.body) ||
    hasGovernance ||
    sections.length > 0 ||
    faq.length > 0;

  return (
    <Page title={title} updatedAt={updatedAtStr} intro={intro}>
      {hasCompany ? (
        <div className="kv-grid">
          {company?.name ? (
            <KeyValue
              label={TT(i18n, t, "static.company.name", {
                sv: "Företag",
                en: "Company",
                tr: "Şirket",
              })}
              value={company.name}
            />
          ) : null}

          {company?.org ? (
            <KeyValue
              label={TT(i18n, t, "static.company.org", {
                sv: "Org.nr",
                en: "Company no.",
                tr: "Şirket no.",
              })}
              value={company.org}
            />
          ) : null}

          {company?.hq ? (
            <KeyValue
              label={TT(i18n, t, "static.company.hq", {
                sv: "Huvudkontor",
                en: "Headquarters",
                tr: "Merkez",
              })}
              value={company.hq}
            />
          ) : null}

          {company?.email ? (
            <KeyValue
              label={TT(i18n, t, "static.company.email", {
                sv: "E-post",
                en: "Email",
                tr: "E-posta",
              })}
              value={company.email}
            />
          ) : null}
        </div>
      ) : null}

      {leadership?.title || leadership?.body ? (
        <Section title={leadership.title} body={leadership.body} />
      ) : null}

      {advisory?.title || advisory?.body ? (
        <Section title={advisory.title} body={advisory.body} />
      ) : null}

      {hasGovernance ? (
        <section className="static-section">
          {governance?.title ? (
            <h2 className="static-h2">{governance.title}</h2>
          ) : null}
          <Bullets items={asArray(governance?.items)} />
        </section>
      ) : null}

      {sections.map((s, i) => (
        <Section key={`${baseKey}-section-${i}`} title={s?.title} body={s?.body} />
      ))}

      {faq.length ? <QA items={faq} /> : null}

      {!hasAnyContent ? (
        <Section
          title={TT(i18n, t, "scaffold.missing.title", {
            sv: "Innehåll kommer snart",
            en: "Content coming soon",
            tr: "İçerik yakında",
          })}
          body={TT(
            i18n,
            t,
            "scaffold.missing.body",
            {
              sv: `Den här sidan använder översättningsnycklar under "${baseKey}". Lägg till title, intro eller sections i dina JSON-filer när du vill fylla sidan.`,
              en: `This page uses translation keys under "${baseKey}". Add title, intro or sections to your JSON files when you want to fill the page.`,
              tr: `Bu sayfa "${baseKey}" altındaki çeviri anahtarlarını kullanır. Sayfayı doldurmak için JSON dosyalarına title, intro veya sections ekleyin.`,
            }
          )}
        />
      ) : null}
    </Page>
  );
}