// D:\WebProjects\Calestra\apps\store-classic\src\pages\AnalyticsDebug.jsx
import React from "react";
import { useTranslation } from "react-i18next";

import {
  getAnalytics,
  summarize,
  clearAnalytics,
} from "../analytics/analytics";

import { TT } from "../i18n/tt.js";

export default function AnalyticsDebug() {
  const { t, i18n } = useTranslation();

  const events = getAnalytics();
  const summary = summarize(events);

  const L = {
    title: TT(i18n, t, "analytics.title", {
      sv: "Analytics (DEV)",
      en: "Analytics (DEV)",
      tr: "Analytics (DEV)",
    }),
    clear: TT(i18n, t, "analytics.clear", {
      sv: "Rensa statistik",
      en: "Clear analytics",
      tr: "Analitiği temizle",
    }),
    raw: TT(i18n, t, "analytics.raw", {
      sv: "Rådata",
      en: "Raw events",
      tr: "Ham veriler",
    }),
    empty: TT(i18n, t, "analytics.empty", {
      sv: "Ingen data ännu.",
      en: "No data yet.",
      tr: "Henüz veri yok.",
    }),
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>{L.title}</h2>

      <pre>
        {events?.length
          ? JSON.stringify(summary, null, 2)
          : L.empty}
      </pre>

      <button onClick={clearAnalytics}>
        {L.clear}
      </button>

      <h3>{L.raw}</h3>

      <pre style={{ maxHeight: 300, overflow: "auto" }}>
        {events?.length
          ? JSON.stringify(events, null, 2)
          : L.empty}
      </pre>
    </div>
  );
}