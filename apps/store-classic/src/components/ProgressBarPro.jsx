// apps/store-classic/src/components/ProductCardPro.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { formatMoney, convertFromSEK } from "../utils/money";
import "../styles/product-card.css";

export default function ProductCardPro({ product, onBuy }) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  if (!product) return null;

  // ---- URL mot produktsidan (koppling till Product.js) ----
  const slug = product.slug || product.id;
  const href = `/product/${slug}`;

  // ---- Bild (thumb -> hero -> fallback) ----
  const img =
    product.images?.find((x) => x.type === "thumb")?.image ||
    product.images?.find((x) => x.type === "hero")?.image ||
    product.image ||
    "/images/no-image.png";

  // ---- PRIS: hämta från samma fält som api/products.js ----
  // täcker flera varianter: basePriceSEK, priceSEK, price, fromPriceSEK
  const basePriceSEK =
    Number(
      product.basePriceSEK ??
        product.priceSEK ??
        product.price ??
        product.fromPriceSEK ??
        0
    ) || 0;

  const price = convertFromSEK(basePriceSEK, currency);
  const priceLabel = formatMoney(price, currency);

  const soldOut = product.soldOut || product.status === "soldout";

  function handleBuyClick() {
    if (soldOut) return;
    if (onBuy) onBuy(product);
  }

  return (
    <article className="product-card">
      {/* Hela bilden klickbar till produktsidan */}
      <Link to={href} className="product-card__media">
        <img
          src={img}
          alt={product.title}
          className="product-card__img"
          loading="lazy"
        />

        {/* Prisbadge – nu med riktig data från product.js */}
        <div className="product-card__badge product-card__badge--price">
          {priceLabel}
        </div>

        {soldOut && (
          <div className="product-card__badge product-card__badge--soldout">
            {t("product.soldOut", "Slut")}
          </div>
        )}
      </Link>

      <div className="product-card__body">
        <div className="product-card__title-row">
          <h3 className="product-card__title">
            <Link to={href}>{product.title}</Link>
          </h3>
        </div>

        <div className="product-card__footer">
          <div className="product-card__actions">
            <Link to={href} className="btn btn-ghost btn-xs">
              {t("product.view", "Visa")}
            </Link>

            <button
              type="button"
              className="btn btn-primary btn-xs"
              disabled={soldOut}
              onClick={handleBuyClick}
            >
              {soldOut
                ? t("product.soldOut", "Slut")
                : t("product.buy", "Lägg i korg")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
