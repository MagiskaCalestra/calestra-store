// D:\WebProjects\Calestra\apps\store-classic\src\components\QuickViewModal.jsx
import React from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { useCurrency } from "../context/CurrencyContext.jsx";
import { convertBasePrice, applyPsychological, formatMoney } from "../utils/money.js";
import SmartImg from "./SmartImg.jsx";
import { TT } from "../i18n/tt.js";

function getHero(product) {
  const images = Array.isArray(product?.images) ? product.images : [];
  return (
    images.find((x) => x?.type === "hero")?.image ||
    images[0]?.image ||
    product?.hero ||
    product?.image ||
    "/images/no-image.png"
  );
}

function getProductTitle(product, i18n, t) {
  const lang = String(i18n?.resolvedLanguage || i18n?.language || "sv")
    .slice(0, 2)
    .toLowerCase();

  const value =
    product?.i18n?.[lang]?.title ||
    product?.i18n?.sv?.title ||
    product?.title ||
    product?.name ||
    "";

  return (
    value ||
    TT(i18n, t, "quickView.fallbackTitle", {
      sv: "Calestra-produkt",
      en: "Calestra product",
      tr: "Calestra ürünü",
    })
  );
}

function getProductDescription(product, i18n) {
  const lang = String(i18n?.resolvedLanguage || i18n?.language || "sv")
    .slice(0, 2)
    .toLowerCase();

  return (
    product?.i18n?.[lang]?.description ||
    product?.i18n?.sv?.description ||
    product?.description ||
    product?.shortDescription ||
    ""
  );
}

function getProductSlug(product) {
  return product?.slug || product?.id || "";
}

export default function QuickViewModal({ product, onClose }) {
  const { t, i18n } = useTranslation();
  const { currency, locale, rates } = useCurrency();
  const closeBtnRef = React.useRef(null);

  const tx = React.useCallback(
    (key, fallbackByLang, opts) => TT(i18n, t, key, fallbackByLang, opts),
    [i18n, t]
  );

  React.useEffect(() => {
    if (!product || typeof document === "undefined") return undefined;

    function onKey(e) {
      if (e.key === "Escape" && typeof onClose === "function") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    window.setTimeout(() => closeBtnRef.current?.focus?.(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [product, onClose]);

  if (!product || typeof document === "undefined") return null;

  const title = getProductTitle(product, i18n, t);
  const slug = getProductSlug(product);
  const hero = getHero(product);
  const description = getProductDescription(product, i18n);

  const rawPrice = Number(product?.price);
  const hasPrice = Number.isFinite(rawPrice) && rawPrice > 0;

  const price = hasPrice
    ? applyPsychological(convertBasePrice(rawPrice, currency, rates), currency)
    : null;

  const priceText = hasPrice
    ? formatMoney(price, currency, locale)
    : tx("product.noPrice", {
        sv: "Ej prissatt",
        en: "Not priced",
        tr: "Fiyatlandırılmamış",
      });

  const productTo = slug ? `/product/${slug}` : "/shop";

  return createPortal(
    <div
      className="qv-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && typeof onClose === "function") {
          onClose();
        }
      }}
    >
      <section
        className="qv-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qv-title"
      >
        <button
          ref={closeBtnRef}
          className="qv-close"
          type="button"
          onClick={onClose}
          aria-label={tx("common.close", {
            sv: "Stäng",
            en: "Close",
            tr: "Kapat",
          })}
        >
          ×
        </button>

        <div className="qv-grid">
          <div className="qv-media">
            <SmartImg src={hero} alt={title} className="qv-img" loading="eager" />
          </div>

          <div className="qv-info">
            <div className="qv-kicker">
              {tx("quickView.kicker", {
                sv: "Snabbvisning",
                en: "Quick view",
                tr: "Hızlı görünüm",
              })}
            </div>

            <h2 id="qv-title">{title}</h2>

            <div className="qv-price">{priceText}</div>

            {description ? <p className="qv-desc">{description}</p> : null}

            <div className="qv-actions">
              <Link className="qv-btn qv-btn--primary" to={productTo} onClick={onClose}>
                {tx("product.open", {
                  sv: "Öppna produkt",
                  en: "Open product",
                  tr: "Ürünü aç",
                })}
              </Link>

              <button className="qv-btn qv-btn--ghost" type="button" onClick={onClose}>
                {tx("common.close", {
                  sv: "Stäng",
                  en: "Close",
                  tr: "Kapat",
                })}
              </button>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .qv-overlay{
          position:fixed;
          inset:0;
          z-index:2147483000;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:18px;
          background:rgba(2,6,23,.58);
          backdrop-filter:blur(8px);
          -webkit-backdrop-filter:blur(8px);
        }

        .qv-sheet{
          position:relative;
          width:min(920px, 100%);
          max-height:min(720px, calc(100vh - 36px));
          overflow:auto;
          border-radius:26px;
          background:rgba(255,255,255,.98);
          color:#0f172a;
          border:1px solid rgba(255,255,255,.70);
          box-shadow:0 28px 80px rgba(2,6,23,.35);
        }

        .qv-close{
          position:absolute;
          top:12px;
          right:12px;
          z-index:3;
          width:40px;
          height:40px;
          border-radius:14px;
          border:1px solid rgba(15,23,42,.10);
          background:rgba(255,255,255,.82);
          color:#0f172a;
          font-size:28px;
          line-height:1;
          cursor:pointer;
          display:grid;
          place-items:center;
          transition:transform .12s ease, background .12s ease;
        }

        .qv-close:hover{
          transform:translateY(-1px);
          background:#fff;
        }

        .qv-grid{
          display:grid;
          grid-template-columns:1.15fr .85fr;
          gap:0;
        }

        .qv-media{
          min-height:420px;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,.18), transparent 30%),
            linear-gradient(135deg, rgba(248,250,252,.96), rgba(226,232,240,.92));
          display:flex;
          align-items:center;
          justify-content:center;
          padding:18px;
        }

        .qv-img{
          width:100%;
          max-height:560px;
          object-fit:contain;
          display:block;
          border-radius:20px;
          filter:drop-shadow(0 20px 38px rgba(15,23,42,.16));
        }

        .qv-info{
          padding:34px 28px 28px;
          display:flex;
          flex-direction:column;
          justify-content:center;
        }

        .qv-kicker{
          width:max-content;
          margin-bottom:10px;
          padding:6px 10px;
          border-radius:999px;
          background:rgba(15,23,42,.05);
          border:1px solid rgba(15,23,42,.08);
          color:#475569;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.10em;
          text-transform:uppercase;
        }

        .qv-info h2{
          margin:0;
          font-size:clamp(26px, 4vw, 42px);
          line-height:1.02;
          letter-spacing:-.05em;
          color:#0f172a;
        }

        .qv-price{
          margin-top:12px;
          font-size:22px;
          line-height:1;
          font-weight:1000;
          letter-spacing:-.03em;
          color:#0f172a;
        }

        .qv-desc{
          margin:14px 0 0;
          color:#475569;
          font-size:15px;
          line-height:1.65;
          font-weight:700;
        }

        .qv-actions{
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:22px;
        }

        .qv-btn{
          min-height:44px;
          padding:0 16px;
          border-radius:999px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          text-decoration:none;
          font-weight:1000;
          cursor:pointer;
          border:1px solid transparent;
          transition:transform .12s ease, background .12s ease, box-shadow .12s ease;
        }

        .qv-btn:hover{
          transform:translateY(-1px);
        }

        .qv-btn--primary{
          background:linear-gradient(135deg,#0f172a,#334155);
          color:#fff;
          box-shadow:0 14px 26px rgba(15,23,42,.18);
        }

        .qv-btn--ghost{
          background:rgba(255,255,255,.74);
          border-color:rgba(15,23,42,.10);
          color:#0f172a;
        }

        .theme-dark .qv-sheet{
          background:#0b1220;
          color:#f8fafc;
          border-color:rgba(255,255,255,.10);
        }

        .theme-dark .qv-close{
          background:rgba(11,18,32,.82);
          border-color:rgba(255,255,255,.12);
          color:#f8fafc;
        }

        .theme-dark .qv-media{
          background:
            radial-gradient(circle at top left, rgba(251,191,36,.12), transparent 30%),
            linear-gradient(135deg, #020617, #111827);
        }

        .theme-dark .qv-kicker{
          background:rgba(255,255,255,.06);
          border-color:rgba(255,255,255,.10);
          color:#cbd5e1;
        }

        .theme-dark .qv-info h2,
        .theme-dark .qv-price{
          color:#f8fafc;
        }

        .theme-dark .qv-desc{
          color:#cbd5e1;
        }

        .theme-dark .qv-btn--primary{
          background:#f8fafc;
          color:#0b1220;
          box-shadow:none;
        }

        .theme-dark .qv-btn--ghost{
          background:rgba(255,255,255,.06);
          border-color:rgba(255,255,255,.12);
          color:#f8fafc;
        }

        @media (max-width:760px){
          .qv-overlay{
            align-items:flex-end;
            padding:10px;
          }

          .qv-sheet{
            max-height:calc(100vh - 20px);
            border-radius:24px;
          }

          .qv-grid{
            grid-template-columns:1fr;
          }

          .qv-media{
            min-height:260px;
            padding:14px;
          }

          .qv-info{
            padding:22px 18px 20px;
          }
        }

        @media (prefers-reduced-motion: reduce){
          .qv-close,
          .qv-btn{
            transition:none;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}