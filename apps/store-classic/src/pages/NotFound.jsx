// apps/store-classic/src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <section className="notfound">
      <div className="card">
        <div className="code">404</div>
        <h1>{t("notFound.title", "Sidan hittades inte")}</h1>
        <p className="muted">
          {t(
            "notFound.body",
            "Länken kan vara fel eller sidan har flyttats. Välj ett av alternativen nedan."
          )}
        </p>

        <div className="actions">
          <Link className="btn primary" to="/">
            {t("notFound.backHome", "Till startsidan")}
          </Link>
          <Link className="btn" to="/shop">
            {t("notFound.toShop", "Till butiken")}
          </Link>
        </div>
      </div>

      <style>{`
        .notfound{
          max-width: 980px;
          margin: 0 auto;
          padding: 32px 16px 60px;
        }
        .card{
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #ffffff;
          padding: 24px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
        }
        .theme-dark .card{
          background: #020617;
          border-color: #1e293b;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.75);
        }
        .code{
          font-weight: 800;
          font-size: 44px;
          letter-spacing: 0.06em;
          color: #111827;
          margin-bottom: 6px;
        }
        .theme-dark .code{ color: #f9fafb; }
        h1{
          margin: 0 0 10px;
          font-size: 18px;
          color: #111827;
        }
        .theme-dark h1{ color: #f9fafb; }
        .muted{
          margin: 0 0 16px;
          color: #6b7280;
          line-height: 1.5;
        }
        .theme-dark .muted{ color: #9ca3af; }
        .actions{
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .btn{
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          text-decoration: none;
          font-weight: 700;
          color: #111827;
          background: #ffffff;
        }
        .btn:hover{ background:#f3f4f6; }
        .theme-dark .btn{
          background:#020617;
          border-color:#374151;
          color:#e5e7eb;
        }
        .theme-dark .btn:hover{ background:#111827; }
        .btn.primary{
          background:#111827;
          border-color:#111827;
          color:#ffffff;
        }
        .btn.primary:hover{ background:#1f2937; }
        .theme-dark .btn.primary{
          background:#f9fafb;
          border-color:#f9fafb;
          color:#020617;
        }
        .theme-dark .btn.primary:hover{ background:#e5e7eb; }
      `}</style>
    </section>
  );
}
