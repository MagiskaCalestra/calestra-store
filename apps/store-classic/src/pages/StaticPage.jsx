import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Generisk statisk sida som hämtar innehåll från i18n under:
 *  pages.<slug>.*   (title, updatedAt, intro, company, contact, sections[], faq[])
 *
 * Används så här:
 *  <StaticPage slug="about" />
 *  <StaticPage slug="terms" />
 */
export default function StaticPage({ slug }) {
  const { t, i18n } = useTranslation();

  const page = useMemo(() => {
    const base = `pages.${slug}`;
    // Hämta allt vi kan, utan att krascha om nycklar saknas
    const title = t(`${base}.title`);
    const updatedAtTpl = t(`${base}.updatedAt`, { date: formatDate(new Date()) });
    const intro = t(`${base}.intro`);
    const company = pick(t, `${base}.company`);
    const contact = pick(t, `${base}.contact`);
    const sections = arr(t, `${base}.sections`);
    const list = arr(t, `${base}.list`);
    const faq = arr(t, `${base}.faq`);
    return { title, updatedAtTpl, intro, company, contact, sections, list, faq };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, i18n.language]);

  return (
    <div className="page container" style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: 800 }}>{page.title}</h1>
      {page.updatedAtTpl && (
        <p style={{ opacity: 0.75, marginTop: 0, marginBottom: 24 }}>{page.updatedAtTpl}</p>
      )}

      {page.intro && <p style={{ lineHeight: 1.6, marginBottom: 20 }}>{page.intro}</p>}

      {/* Company block */}
      {page.company && (page.company.name || page.company.org || page.company.hq || page.company.email) && (
        <div style={{ margin: "20px 0 10px" }}>
          {page.company.name && (
            <p style={{ margin: 0 }}>
              <b>{label(t, "Company", "Företag")}: </b>
              {page.company.name}
            </p>
          )}
          {page.company.org && (
            <p style={{ margin: 0 }}>
              <b>{label(t, "Org No", "Org.nr")}: </b>
              {page.company.org}
            </p>
          )}
          {page.company.hq && (
            <p style={{ margin: 0 }}>
              <b>{label(t, "Headquarters", "Säte")}: </b>
              {page.company.hq}
            </p>
          )}
          {page.company.email && (
            <p style={{ margin: 0 }}>
              <b>{label(t, "Email", "E-post")}: </b>
              <a href={`mailto:${page.company.email}`}>{page.company.email}</a>
            </p>
          )}
        </div>
      )}

      {/* Optional bullet list (e.g. Careers list) */}
      {page.list?.length > 0 && (
        <ul style={{ marginTop: 12 }}>
          {page.list.map((it, i) => (
            <li key={i} style={{ lineHeight: 1.6 }}>{it}</li>
          ))}
        </ul>
      )}

      {/* Sections */}
      {page.sections?.map((sec, i) => (
        <section key={i} style={{ marginTop: 28 }}>
          {sec.title && <h2 style={{ fontSize: 18, margin: "0 0 8px", fontWeight: 800 }}>{sec.title}</h2>}
          {sec.body && <RichText text={sec.body} />}
        </section>
      ))}

      {/* Contact block */}
      {page.contact && (page.contact.email || page.contact.response) && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 8px", fontWeight: 800 }}>{label(t, "Contact", "Kontakt")}</h2>
          {page.contact.email && (
            <p style={{ margin: "0 0 4px" }}>
              <b>{label(t, "Email", "E-post")}: </b>
              <a href={`mailto:${page.contact.email}`}>{page.contact.email}</a>
            </p>
          )}
          {page.contact.response && <p style={{ margin: 0 }}>{page.contact.response}</p>}
        </section>
      )}

      {/* FAQ */}
      {page.faq?.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 8px", fontWeight: 800 }}>FAQ</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {page.faq.map((item, idx) => (
              <div key={idx}>
                {item.q && <strong style={{ display: "block", marginBottom: 4 }}>{item.q}</strong>}
                {item.a && <p style={{ margin: 0, lineHeight: 1.6 }}>{item.a}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Renderar text med stöd för radbrytningar och enkla "â€¢ " kulor i JSON */
function RichText({ text }) {
  // Stöd för listor: om texten innehåller radbrytningar och börjar med "â€¢ "
  const lines = text.split("\n");
  const looksLikeBullets = lines.every((l) => l.trim() === "" || l.trim().startsWith("â€¢"));
  if (looksLikeBullets && lines.some((l) => l.trim().startsWith("â€¢"))) {
    return (
      <ul style={{ margin: 0 }}>
        {lines
          .filter((l) => l.trim().startsWith("â€¢"))
          .map((l, i) => (
            <li key={i} style={{ lineHeight: 1.6 }}>
              {l.replace(/^â€¢\s*/, "")}
            </li>
          ))}
      </ul>
    );
  }
  // Annars vanlig paragraf med radbrytningar
  return (
    <p style={{ whiteSpace: "pre-line", lineHeight: 1.6, margin: 0 }}>
      {text}
    </p>
  );
}

function label(t, en, sv) {
  // Liten hjälpare för statiska etiketter som inte finns i JSON
  const lng = t("brand") && t.i18n?.language ? t.i18n.language : "en";
  if (lng.startsWith("sv")) return sv;
  if (lng.startsWith("tr")) {
    // grovt fallback till engelska för TR här
    return en;
  }
  return en;
}

function pick(t, base) {
  const tryGet = (key) => {
    const val = t(key, { defaultValue: "__MISSING__" });
    return val === "__MISSING__" ? undefined : val;
  };
  const obj = {
    name: tryGet(`${base}.name`),
    org: tryGet(`${base}.org`),
    hq: tryGet(`${base}.hq`),
    email: tryGet(`${base}.email`),
  };
  // om allt saknas, returnera undefined
  return Object.values(obj).some(Boolean) ? obj : undefined;
}

function arr(t, key) {
  const val = t(key, { returnObjects: true, defaultValue: [] });
  return Array.isArray(val) ? val : [];
}

function formatDate(d) {
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
