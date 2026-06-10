// D:\WebProjects\Calestra\apps\store-classic\src\pages\static\_Page.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { TT } from "../../i18n/tt.js";

function hasText(v) {
  return String(v || "").trim().length > 0;
}

export default function Page({
  title,
  updated = "2025-01-01",
  children,
}) {
  const { t, i18n } = useTranslation();

  const updatedLabel = TT(
    i18n,
    t,
    "static.updated",
    {
      sv: "Senast uppdaterad",
      en: "Last updated",
      tr: "Son güncelleme",
    }
  );

  return (
    <main className="page" role="main">
      <div className="container">
        {hasText(title) ? <h1>{title}</h1> : null}

        {hasText(updated) ? (
          <p className="muted">
            {updatedLabel}: {updated}
          </p>
        ) : null}

        <div className="content">{children}</div>
      </div>

      <style>{`
        .page .container{
          max-width:960px;
          margin:0 auto;
          padding:24px 16px;
        }

        .page h1{
          font-size:28px;
          font-weight:900;
          margin:6px 0 4px;
          letter-spacing:-.02em;
        }

        .page .muted{
          opacity:.7;
          margin:0 0 14px;
          font-size:14px;
        }

        .page .content{
          display:grid;
          gap:14px;
          line-height:1.7;
        }

        .page h2{
          font-size:20px;
          margin:12px 0 6px;
          font-weight:900;
        }

        .page h3{
          font-size:16px;
          margin:10px 0 4px;
          font-weight:800;
        }

        .page ul{
          padding-left:18px;
        }

        .page li{
          margin:3px 0;
        }

        .callout{
          padding:10px 12px;
          border:1px solid rgba(255,255,255,.14);
          border-radius:12px;
          background:rgba(255,255,255,.04);
        }

        a{
          font-weight:700;
          text-decoration:none;
        }

        a:hover{
          text-decoration:underline;
        }
      `}</style>
    </main>
  );
}