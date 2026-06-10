// D:\WebProjects\Calestra\apps\store-classic\src\components\StoreProgress.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import useProgress from "../hooks/useProgress.js";
import { TT } from "../i18n/tt.js";
import "../styles/store-progress.css";

function getLang(i18n) {
  const raw = String(i18n?.resolvedLanguage || i18n?.language || "sv").toLowerCase();
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("tr")) return "tr";
  return "sv";
}

function getLocale(i18n) {
  const lang = getLang(i18n);
  if (lang === "en") return "en-US";
  if (lang === "tr") return "tr-TR";
  return "sv-SE";
}

function moneySEK(n, locale = "sv-SE") {
  const x = Number(n || 0);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(x);
}

export default function StoreProgress() {
  const { t, i18n } = useTranslation();
  const progress = useProgress();

  const tx = React.useCallback(
    (key, fallbackByLang, opts) => TT(i18n, t, key, fallbackByLang, opts),
    [i18n, t]
  );

  const locale = getLocale(i18n);
  const pct = Math.max(0, Math.min(100, Number(progress?.percent || 0)));
  const totalSEK = Number(progress?.totalSEK || 0);
  const goalSEK = Number(progress?.goalSEK || 0);
  const remainingSEK = Math.max(0, goalSEK - totalSEK);

  const roundedPct = Math.round(pct);

  const regionLabel = tx("progress.region", {
    sv: "Calestra Store-progress",
    en: "Calestra Store progress",
    tr: "Calestra Store ilerlemesi",
  });

  const fallbackTitle = progress?.error
    ? tx(
        "progress.fallbackTitle",
        {
          sv: "Progress visas i säkert fallback-läge: {{error}}",
          en: "Progress is shown in safe fallback mode: {{error}}",
          tr: "Progress güvenli fallback modunda gösteriliyor: {{error}}",
        },
        { error: String(progress.error) }
      )
    : undefined;

  return (
    <div
      className="store-progress"
      role="region"
      aria-label={regionLabel}
      title={fallbackTitle}
    >
      <div className="store-progress__top">
        <span className="store-progress__label">
          {tx(
            "progress.storeLabelWithPercent",
            {
              sv: "Calestra Store • Founders Journey {{pct}}%",
              en: "Calestra Store • Founders Journey {{pct}}%",
              tr: "Calestra Store • Kurucu Yolculuğu {{pct}}%",
            },
            { pct: roundedPct }
          )}
        </span>
      </div>

      <div
        className="store-progress__glow-line"
        role="progressbar"
        aria-label={regionLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={roundedPct}
      >
        <div className="store-progress__glow-fill" style={{ width: `${pct}%` }}>
          <div className="store-progress__star" />
        </div>
      </div>

      <div
        style={{
          marginTop: 8,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 12,
          opacity: 0.9,
        }}
      >
        <span>
          {tx("progress.raised", {
            sv: "Insamlat",
            en: "Raised",
            tr: "Toplanan",
          })}
          : <b>{moneySEK(totalSEK, locale)}</b>
        </span>

        <span>
          {tx("progress.goal", {
            sv: "Mål",
            en: "Goal",
            tr: "Hedef",
          })}
          : <b>{moneySEK(goalSEK, locale)}</b>
        </span>

        <span>
          {tx("progress.remaining", {
            sv: "Kvar",
            en: "Remaining",
            tr: "Kalan",
          })}
          : <b>{moneySEK(remainingSEK, locale)}</b>
        </span>
      </div>
    </div>
  );
}