// D:\WebProjects\Calestra\apps\store-classic\src\components\ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { convertBasePrice, applyPsychological, formatMoney } from "../utils/money.js";
import SmartImg from "./SmartImg.jsx";
import { normalizeAsset } from "../utils/assets.js";

function getLowestVariantQty(product) {
  const vars = Array.isArray(product?.variants) ? product.variants : [];
  const numeric = vars
    .map((v) => Number(v?.qty))
    .filter((n) => Number.isFinite(n));

  if (numeric.length) return Math.min(...numeric);
  return Number(product?.stock ?? 0);
}

function getStockTone(stock) {
  const n = Number(stock || 0);
  if (n <= 0) return "out";
  if (n <= 2) return "hot";
  if (n <= 5) return "warn";
  return "ok";
}

export default function ProductCard({ product, onQuickView, onBuy }) {
  const { t, i18n } = useTranslation();
  const { currency, locale, rates } = useCurrency?.() || { currency: "SEK" };
  const tt = (k, d) => (i18n?.exists?.(k) ? t(k) : d);

  const slug = String(product?.slug || "").trim();

  const stockNow = getLowestVariantQty(product);
  const stockTone = getStockTone(stockNow);

  const isOut = stockTone === "out";
  const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;
  const isLimited = !!product?.limited;
  const isSupport = !!product?.support;

  const base = convertBasePrice(Number(product.price || 0), currency, rates);
  const psych = applyPsychological(base, currency);
  const priceLabel = formatMoney(psych, currency, locale);

  const compareLabel =
    product.compareAtPrice != null
      ? formatMoney(
          applyPsychological(
            convertBasePrice(Number(product.compareAtPrice), currency, rates),
            currency
          ),
          currency,
          locale
        )
      : null;

  const hero = normalizeAsset(
    product.images?.find((x) => x.type === "thumb")?.image ||
      product.images?.find((x) => x.type === "hero")?.image ||
      product.image ||
      "/images/no-image.png"
  );

  const sizeSet = new Set();
  const colorSet = new Set();
  (product.variants || []).forEach((v) => {
    if (v.size) sizeSet.add(String(v.size));
    if (v.color) colorSet.add(String(v.color));
  });
  const sizes = Array.from(sizeSet);
  const colors = Array.from(colorSet);

  const hoverText =
    product.description ||
    tt("productCard.hover.default", "Utforska detaljer, bilder och lagerstatus.");

  const eyebrow =
    isOut
      ? tt("productCard.badges.outOfStock", "Slut")
      : isLimited
        ? tt("productCard.badges.limited", "Limited")
        : isSupport
          ? tt("productCard.badges.support", "Support")
          : tt("productCard.badges.spotlight", "Spotlight");

  const urgencyText = isOut
    ? tt("productCard.urgency.out", "Den här releasen är just nu slut.")
    : isLimited && stockNow > 0 && stockNow <= 2
      ? tt("productCard.urgency.last", "Endast {{n}} kvar", { n: stockNow })
      : isLimited && stockNow > 0 && stockNow <= 5
        ? tt("productCard.urgency.low", "{{n}} kvar i första droppen", { n: stockNow })
        : isLimited
          ? tt("productCard.urgency.drop", "Första droppen live")
          : stockNow > 0 && stockNow <= 5
            ? tt("productCard.urgency.stock", "Få kvar")
            : tt("productCard.urgency.default", "Utvald release");

  return (
    <article
      className="pro-card card"
      data-celeste-anchor={slug || product?.id || product?.title || "card"}
      data-celeste-title={product?.title || ""}
      data-celeste-limited={isLimited ? "1" : "0"}
      data-celeste-support={isSupport ? "1" : "0"}
      data-celeste-out={isOut ? "1" : "0"}
    >
      <Link
        to={`/product/${slug}`}
        className="pc__media"
        aria-label={t("productCard.openProductAria", { name: product.title || "" })}
        title={product.title || ""}
      >
        <SmartImg src={hero} alt={product.imageAlt || product.title || ""} loading="lazy" />

        <div className="pc__glow" aria-hidden="true" />

        <div className="pc__hover">
          <span className="pc__hover-badge">{eyebrow}</span>
          <p>{hoverText}</p>
        </div>

        <div className="pc__flags">
          {isLimited && (
            <span className="flag flag--limited">{tt("productCard.badges.limited", "Limited")}</span>
          )}
          {isSupport && (
            <span className="flag flag--support">{tt("productCard.badges.support", "Support")}</span>
          )}
          {isOut && (
            <span className="flag flag--out">{tt("productCard.badges.outOfStock", "Slut")}</span>
          )}
        </div>
      </Link>

      <div className="pc__body">
        <div className="pc__eyebrow">{eyebrow}</div>

        <h3 className="pc__title">
          <Link to={`/product/${slug}`}>{product.title}</Link>
        </h3>

        {product.subtitle && <div className="pc__sub muted">{product.subtitle}</div>}

        {(sizes.length > 0 || colors.length > 0) && (
          <div className="pc__meta">
            {sizes.length > 0 && (
              <div className="chips">
                {sizes.slice(0, 5).map((s) => (
                  <span key={s} className="chip">{s}</span>
                ))}
                {sizes.length > 5 && <span className="chip chip--more">+{sizes.length - 5}</span>}
              </div>
            )}
            {colors.length > 0 && (
              <div className="chips">
                {colors.slice(0, 5).map((c) => (
                  <span key={c} className="chip">{c}</span>
                ))}
                {colors.length > 5 && <span className="chip chip--more">+{colors.length - 5}</span>}
              </div>
            )}
          </div>
        )}

        <div className={`pc__urgency pc__urgency--${stockTone}`}>
          {urgencyText}
        </div>

        <div className="pc__price">
          <span className="now">{priceLabel}</span>
          {compareLabel && <span className="was">{compareLabel}</span>}
        </div>

        <div className="pc__actions">
          {hasVariants ? (
            <Link to={`/product/${slug}`} className={`btn ${isOut ? "btn--ghost" : "btn--solid"}`}>
              {isOut
                ? tt("productCard.buttons.view", "Visa")
                : tt("productCard.buttons.chooseSize", "Välj storlek")}
            </Link>
          ) : (
            <button
              type="button"
              disabled={isOut}
              className={`btn ${isOut ? "btn--ghost" : "btn--solid"}`}
              onClick={() => onBuy?.(product)}
            >
              {isOut
                ? tt("productCard.buttons.view", "Visa")
                : tt("productCard.buttons.buy", "Köp")}
            </button>
          )}

          <Link to={`/product/${slug}`} className="btn btn--ghost">
            {tt("productCard.buttons.view", "Visa")}
          </Link>

          {onQuickView && (
            <button type="button" className="btn btn--ghost" onClick={() => onQuickView(product)}>
              {tt("productCard.buttons.quickView", "Snabbvy")}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .pro-card{
          position:relative;
          overflow:hidden;
          display:flex;
          flex-direction:column;
          border-radius:22px;
          border:1px solid rgba(15,23,42,.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
          box-shadow:0 14px 30px rgba(15,23,42,.06);
          transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .pro-card:hover{
          transform:translateY(-3px);
          box-shadow:0 22px 40px rgba(15,23,42,.12);
          border-color:rgba(15,23,42,.12);
        }

        .pc__media{
          position:relative;
          display:block;
          aspect-ratio:1/1.05;
          overflow:hidden;
          border-radius:22px 22px 0 0;
          background:#f8fafc;
        }

        .pc__media img{
          width:100%;
          height:100%;
          object-fit:cover;
          transform:scale(1);
          transition:transform .35s ease;
          display:block;
        }

        .pro-card:hover .pc__media img{
          transform:scale(1.04);
        }

        .pc__glow{
          position:absolute;
          inset:auto -10% -40% auto;
          width:140px;
          height:140px;
          border-radius:999px;
          background:radial-gradient(circle, rgba(251,191,36,.28), rgba(251,191,36,0));
          pointer-events:none;
          filter:blur(10px);
        }

        .pc__hover{
          position:absolute;
          inset:auto 0 0 0;
          min-height:42%;
          background:linear-gradient(180deg, transparent, rgba(0,0,0,.72));
          color:#fff;
          display:flex;
          flex-direction:column;
          justify-content:flex-end;
          gap:8px;
          padding:14px 14px 12px;
          transform:translateY(100%);
          transition:transform .28s ease;
          font-size:13px;
          line-height:1.35;
        }

        .pro-card:hover .pc__hover{
          transform:translateY(0);
        }

        .pc__hover-badge{
          display:inline-flex;
          width:max-content;
          padding:5px 9px;
          border-radius:999px;
          background:rgba(255,255,255,.12);
          border:1px solid rgba(255,255,255,.18);
          font-size:11px;
          font-weight:1000;
          text-transform:uppercase;
          letter-spacing:.08em;
        }

        .pc__hover p{
          margin:0;
          font-weight:700;
        }

        .pc__flags{
          position:absolute;
          right:12px;
          top:12px;
          display:flex;
          gap:6px;
          flex-wrap:wrap;
          justify-content:flex-end;
          max-width:72%;
        }

        .flag{
          font-size:11px;
          padding:4px 8px;
          border-radius:999px;
          backdrop-filter:saturate(140%) blur(3px);
          font-weight:1000;
        }

        .flag--limited{ background:rgba(254,243,199,.95); color:#92400E; }
        .flag--support{ background:rgba(224,231,255,.95); color:#3730A3; }
        .flag--out{ background:rgba(229,231,235,.95); color:#374151; }

        .pc__body{
          padding:14px 14px 16px;
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        .pc__eyebrow{
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:#64748b;
        }

        .pc__title{
          margin:0;
          font-size:17px;
          line-height:1.08;
          font-weight:900;
          letter-spacing:-.02em;
          color:#0f172a;
        }

        .pc__title a{
          text-decoration:none;
          color:inherit;
        }

        .pc__sub{
          font-size:12px;
          margin:0;
          color:#64748b;
        }

        .pc__meta{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin:2px 0 2px;
        }

        .chips{
          display:flex;
          gap:6px;
          flex-wrap:wrap;
        }

        .chip{
          font-size:11px;
          font-weight:800;
          padding:4px 8px;
          border-radius:999px;
          border:1px solid rgba(148,163,184,.22);
          background:rgba(255,255,255,.76);
          color:#334155;
        }

        .chip--more{ opacity:.85; }

        .pc__urgency{
          display:inline-flex;
          align-items:center;
          width:max-content;
          max-width:100%;
          padding:6px 10px;
          border-radius:999px;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.04em;
        }

        .pc__urgency--hot{
          background:rgba(254,226,226,.95);
          color:#991B1B;
        }

        .pc__urgency--warn{
          background:rgba(255,237,213,.95);
          color:#9A3412;
        }

        .pc__urgency--out{
          background:rgba(229,231,235,.95);
          color:#374151;
        }

        .pc__urgency--ok{
          background:rgba(241,245,249,.96);
          color:#334155;
        }

        .pc__price{
          display:flex;
          gap:10px;
          align-items:center;
          margin:2px 0 4px;
        }

        .pc__price .now{
          font-weight:1000;
          font-size:18px;
          color:#0f172a;
        }

        .pc__price .was{
          font-size:12px;
          color:#9ca3af;
          text-decoration:line-through;
          font-weight:800;
        }

        .pc__actions{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin-top:4px;
        }

        .btn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-height:40px;
          padding:0 13px;
          border-radius:999px;
          text-decoration:none;
          border:1px solid rgba(15,23,42,.10);
          font-weight:1000;
          font-size:12px;
          cursor:pointer;
          transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
        }

        .btn:hover{
          transform:translateY(-1px);
        }

        .btn--solid{
          background:linear-gradient(135deg,#0f172a,#334155);
          color:#fff;
          border-color:#0f172a;
          box-shadow:0 12px 24px rgba(15,23,42,.14);
        }

        .btn--ghost{
          background:rgba(255,255,255,.78);
          color:#0f172a;
        }

        .btn:disabled{
          opacity:.55;
          cursor:not-allowed;
          transform:none;
          box-shadow:none;
        }

        @media (prefers-reduced-motion: reduce){
          .pro-card,
          .pc__media img,
          .pc__hover,
          .btn{
            transition:none;
          }
        }
      `}</style>
    </article>
  );
}