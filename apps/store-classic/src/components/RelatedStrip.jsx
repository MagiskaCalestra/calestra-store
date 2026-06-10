// D:\WebProjects\Calestra\apps\store-classic\src\components\RelatedStrip.jsx

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCurrency } from "../context/CurrencyContext.jsx";
import { convertBasePrice, applyPsychological, formatMoney } from "../utils/money.js";
import { TT } from "../i18n/tt.js";
import SmartImg from "./SmartImg.jsx";

function getLang(i18n) {
  const raw = String(i18n?.resolvedLanguage || i18n?.language || "sv")
    .slice(0, 2)
    .toLowerCase();

  return ["sv", "en", "tr"].includes(raw) ? raw : "sv";
}

function getImage(p) {
  if (Array.isArray(p?.images)) {
    return (
      p.images.find((x) => x?.type === "hero")?.image ||
      p.images.find((x) => x?.type === "thumb")?.image ||
      p.images[0]?.image ||
      p?.image ||
      "/images/no-image.png"
    );
  }

  return (
    p?.images?.hero ||
    p?.images?.packshot ||
    p?.images?.flatlay ||
    p?.image ||
    "/images/no-image.png"
  );
}

function localizedProductField(product, i18n, t, field, fallback = "") {
  if (!product || typeof product !== "object") return fallback;

  const lang = getLang(i18n);
  const slug = String(product?.slug || product?.id || "").trim();

  const fromProductI18n =
    product?.i18n?.[lang]?.[field] ||
    product?.i18n?.sv?.[field] ||
    "";

  if (fromProductI18n != null && String(fromProductI18n).trim()) {
    return String(fromProductI18n);
  }

  if (slug) {
    const key = `products.${slug}.${field}`;

    try {
      const value = t(key, { defaultValue: "" });
      if (value && value !== key) return value;
    } catch {}
  }

  const candidates = [
    product?.[`${field}_${lang}`],
    product?.[`${field}${lang.toUpperCase()}`],
    product?.[`${field}${lang}`],
    product?.[lang]?.[field],
    product?.[field],
    fallback,
  ];

  for (const value of candidates) {
    if (value != null && String(value).trim()) return String(value);
  }

  return "";
}

export default function RelatedStrip({ items = [] }) {
  const { t, i18n } = useTranslation();
  const { currency, locale, rates } = useCurrency();

  if (!Array.isArray(items) || !items.length) return null;

  return (
    <section
      className="related-strip"
      aria-label={TT(i18n, t, "related.title", {
        sv: "Du kanske också gillar",
        en: "You may also like",
        tr: "Bunları da sevebilirsin",
      })}
    >
      <div className="related-head">
        <h3>
          {TT(i18n, t, "related.title", {
            sv: "Du kanske också gillar",
            en: "You may also like",
            tr: "Bunları da sevebilirsin",
          })}
        </h3>
      </div>

      <div className="related-row">
        {items.map((p, index) => {
          const slug = String(p?.slug || "").trim();
          const title =
            localizedProductField(p, i18n, t, "title", p?.title || p?.name || "") ||
            TT(
              i18n,
              t,
              "related.productFallback",
              {
                sv: "Produkt",
                en: "Product",
                tr: "Ürün",
              }
            );

          const priceSEK = Number(p?.price || 0);
          const img = getImage(p);

          const displayPrice =
            priceSEK > 0
              ? formatMoney(
                  applyPsychological(convertBasePrice(priceSEK, currency, rates), currency),
                  currency,
                  locale
                )
              : TT(i18n, t, "product.noPrice", {
                  sv: "Ej prissatt",
                  en: "Not priced",
                  tr: "Fiyatlandırılmamış",
                });

          return (
            <Link
              to={slug ? `/product/${slug}` : "/shop"}
              key={slug || `${title}-${index}`}
              className="related-card"
              aria-label={title}
              title={title}
            >
              <div className="related-img-wrap">
                <SmartImg src={img} alt={title} />
              </div>

              <div className="related-meta">
                <div className="related-name">{title}</div>
                <div className="related-price">{displayPrice}</div>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .related-strip{ margin-top:28px; }
        .related-head{ margin-bottom:10px; }
        .related-head h3{
          margin:0;
          font-size:20px;
          font-weight:1000;
          letter-spacing:-.02em;
          color:#0f172a;
        }
        .related-row{
          display:flex;
          gap:12px;
          overflow-x:auto;
          padding-bottom:6px;
          scrollbar-width:thin;
        }
        .related-card{
          flex:0 0 168px;
          text-decoration:none;
          color:inherit;
          border-radius:18px;
          overflow:hidden;
          border:1px solid rgba(15,23,42,.08);
          background:#fff;
          box-shadow:0 10px 22px rgba(15,23,42,.05);
          transition:transform .12s ease, box-shadow .12s ease;
        }
        .related-card:hover{
          transform:translateY(-2px);
          box-shadow:0 14px 28px rgba(15,23,42,.12);
        }
        .related-img-wrap{
          aspect-ratio:1/1;
          background:#f1f5f9;
        }
        .related-img-wrap img{
          width:100%;
          height:100%;
          object-fit:cover;
        }
        .related-meta{ padding:10px; }
        .related-name{
          font-size:13px;
          font-weight:900;
          line-height:1.3;
          color:#0f172a;
        }
        .related-price{
          margin-top:4px;
          font-size:12px;
          font-weight:800;
          color:#475569;
        }
        .theme-dark .related-card{
          background:#0b1220;
          border-color:rgba(255,255,255,.08);
        }
        .theme-dark .related-name{ color:#f8fafc; }
        .theme-dark .related-price{ color:#cbd5e1; }

        @media (prefers-reduced-motion: reduce){
          .related-card{ transition:none; }
        }
      `}</style>
    </section>
  );
}