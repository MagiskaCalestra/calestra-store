// D:\WebProjects\Calestra\apps\store-classic\src\components\DreamPointsWidget.jsx

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getMemberSummary } from "../api/infinity";
import { TT } from "../i18n/tt.js";

function getLocale(i18n) {
  const lang = String(i18n?.resolvedLanguage || i18n?.language || "sv")
    .slice(0, 2)
    .toLowerCase();

  if (lang === "en") return "en-US";
  if (lang === "tr") return "tr-TR";
  return "sv-SE";
}

export default function DreamPointsWidget({ email = "", estimateSEK = 0 }) {
  const { t, i18n } = useTranslation();

  const [summary, setSummary] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(!!email);

  const locale = getLocale(i18n);

  React.useEffect(() => {
    let alive = true;

    if (!email) {
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    async function load() {
      try {
        setErr("");
        setLoading(true);

        const data = await getMemberSummary(email);

        if (!alive) return;

        setSummary(data || { points: 0, tier: "Member" });
      } catch {
        if (!alive) return;

        setErr(
          TT(i18n, t, "dreamPoints.error.load", {
            sv: "Kunde inte hämta dina poäng just nu.",
            en: "Could not load your points right now.",
            tr: "Puanlarınız şu anda yüklenemedi.",
          })
        );
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [email, i18n, t]);

  const estimatedPoints = Math.max(0, Math.round(Number(estimateSEK) || 0));

  return (
    <div className="dpw">
      <div className="dpw-head">
        <span>DreamPoints™</span>
      </div>

      {email ? (
        <>
          {loading && <div className="skeleton" aria-hidden="true" />}

          {!loading && err && <div className="err">{err}</div>}

          {!loading && !err && (
            <div className="dpw-body">
              <div className="row">
                <span>
                  {TT(i18n, t, "dreamPoints.balance", {
                    sv: "Saldo",
                    en: "Balance",
                    tr: "Bakiye",
                  })}
                </span>
                <strong>{(summary?.points ?? 0).toLocaleString(locale)}</strong>
              </div>

              <div className="row">
                <span>
                  {TT(i18n, t, "dreamPoints.tier", {
                    sv: "Nivå",
                    en: "Tier",
                    tr: "Seviye",
                  })}
                </span>
                <strong>{summary?.tier || "Member"}</strong>
              </div>

              <div className="hint">
                {TT(i18n, t, "dreamPoints.launchHint", {
                  sv: "Poäng ger förmåner vid lansering.",
                  en: "Points unlock benefits at launch.",
                  tr: "Puanlar lansmanda avantajlar sağlar.",
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="dpw-body">
          {estimatedPoints > 0 ? (
            <div className="row">
              <span>
                {TT(i18n, t, "dreamPoints.youEarnApprox", {
                  sv: "Du tjänar ca",
                  en: "You earn approx.",
                  tr: "Yaklaşık kazanırsınız",
                })}
              </span>
              <strong>{estimatedPoints.toLocaleString(locale)} p</strong>
            </div>
          ) : (
            <div className="hint">
              {TT(i18n, t, "dreamPoints.earnHint", {
                sv: "Handla och samla poäng – 1 kr = 1 p.",
                en: "Shop and collect points — 1 SEK = 1 p.",
                tr: "Alışveriş yapın ve puan kazanın — 1 SEK = 1 p.",
              })}
            </div>
          )}

          <Link className="btn" to="/creators">
            {TT(i18n, t, "dreamPoints.becomeAmbassador", {
              sv: "Bli ambassadör",
              en: "Become an ambassador",
              tr: "Elçi ol",
            })}
          </Link>
        </div>
      )}

      <style>{`
        .dpw{
          border:1px solid #E6EAF0;
          border-radius:12px;
          padding:12px;
          background:#fff;
        }

        .theme-dark .dpw{
          background:#0f1622;
          border-color:#243041;
        }

        .dpw-head{
          font-weight:800;
          color:#0f172a;
          margin-bottom:8px;
        }

        .theme-dark .dpw-head{
          color:#e6e7ea;
        }

        .dpw-body{
          display:grid;
          gap:8px;
        }

        .row{
          display:flex;
          justify-content:space-between;
          gap:12px;
          color:#0f172a;
        }

        .theme-dark .row{
          color:#e6e7ea;
        }

        .hint{
          font-size:12px;
          color:#6B7280;
          line-height:1.45;
        }

        .theme-dark .hint{
          color:#a3acb8;
        }

        .btn{
          display:inline-block;
          margin-top:6px;
          padding:6px 10px;
          border-radius:10px;
          background:#4B6BFA;
          color:#fff;
          font-weight:700;
          text-decoration:none;
          width:max-content;
        }

        .btn:hover{
          background:#3F5BE0;
        }

        .skeleton{
          height:38px;
          border-radius:8px;
          background:linear-gradient(90deg,#f3f4f6,#e5e7eb,#f3f4f6);
          background-size:200% 100%;
          animation:sh 1.2s infinite;
        }

        .theme-dark .skeleton{
          background:linear-gradient(90deg,#121a27,#1b2537,#121a27);
          background-size:200% 100%;
        }

        @keyframes sh{
          0%{background-position:0 0;}
          100%{background-position:200% 0;}
        }

        .err{
          color:#D0342C;
          font-size:13px;
          line-height:1.45;
        }

        @media (prefers-reduced-motion: reduce){
          .skeleton{
            animation:none;
          }
        }
      `}</style>
    </div>
  );
}