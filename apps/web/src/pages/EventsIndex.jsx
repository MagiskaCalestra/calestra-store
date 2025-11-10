// apps/web/src/pages/EventsIndex.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function EventsIndex() {
  const { t } = useTranslation();
  const items = [
    { id: "maker-001", date: "2025-11-01", title: t("makers.note1.title", "First light"), body: t("makers.note1.body", "We set the star and the portal opens.") },
    { id: "maker-002", date: "2025-11-08", title: t("makers.note2.title", "Progress API"), body: t("makers.note2.body", "The journey bar now reflects real data.") }
  ];

  return (
    <main style={{ maxWidth: 1000, margin: "24px auto", padding: "0 16px", color: "#fff" }}>
      <h2 style={{ marginBottom: 12 }}>{t("events.title", "Updates & Events")}</h2>
      <p style={{ color: "#ffffffc0" }}>{t("events.lead", "Short maker notes and public milestones.")}</p>
      <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
        {items.map((it) => (
          <li key={it.id} style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            padding: 16,
            marginBottom: 12
          }}>
            <div style={{ fontSize: 12, color: "#ffffff99" }}>{it.date}</div>
            <h3 style={{ margin: "4px 0", color: "#fff" }}>{it.title}</h3>
            <p style={{ margin: 0, color: "#ffffffcc" }}>{it.body}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
