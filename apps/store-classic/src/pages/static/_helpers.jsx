// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\_helpers.jsx
import React from "react";

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function asList(items) {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

export function Section({ title, body }) {
  if (!hasText(title) && !hasText(body)) return null;

  return (
    <section className="static-section">
      {hasText(title) ? <h2 className="static-h2">{title}</h2> : null}
      {hasText(body) ? (
        <p className="static-p" style={{ whiteSpace: "pre-line" }}>
          {body}
        </p>
      ) : null}
    </section>
  );
}

export function KeyValue({ label, value }) {
  if (!hasText(value)) return null;

  return (
    <div className="kv">
      <strong className="kv-key">{label}</strong>
      <span className="kv-val">{value}</span>
    </div>
  );
}

export function Bullets({ items }) {
  const list = asList(items);
  if (!list.length) return null;

  return (
    <ul className="static-ul">
      {list.map((item, index) => (
        <li key={`${String(item).slice(0, 40)}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export function QA({ items }) {
  const list = asList(items).filter((qa) => hasText(qa?.q) || hasText(qa?.a));
  if (!list.length) return null;

  return (
    <div className="static-faq">
      {list.map((qa, index) => (
        <details key={`${String(qa?.q || "faq").slice(0, 40)}-${index}`} className="faq-item">
          {hasText(qa?.q) ? <summary className="faq-q">{qa.q}</summary> : null}
          {hasText(qa?.a) ? (
            <div className="faq-a" style={{ whiteSpace: "pre-line" }}>
              {qa.a}
            </div>
          ) : null}
        </details>
      ))}
    </div>
  );
}

export function UpdatedAt({ text }) {
  if (!hasText(text)) return null;
  return <p className="updated-at">{text}</p>;
}

export function Page({ title, updatedAt, intro, children }) {
  return (
    <article className="static-page container">
      {hasText(title) ? <h1 className="static-h1">{title}</h1> : null}
      <UpdatedAt text={updatedAt} />
      {hasText(intro) ? <p className="static-lead">{intro}</p> : null}
      {children}
    </article>
  );
}