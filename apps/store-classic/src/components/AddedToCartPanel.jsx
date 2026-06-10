// D:\WebProjects\Calestra\apps\store-classic\src\components\AddedToCartPanel.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { TT } from "../i18n/tt.js";

export default function AddedToCartPanel({
  open,
  onClose,
  product,
  t,
  i18n,
}) {
  const navigate = useNavigate();

  if (!open || !product) return null;

  const title = product.title || product.name || "Produkt";
  const image =
    product.image ||
    product.images?.[0]?.image ||
    product.images?.[0]?.src ||
    "/images/no-image.png";

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          zIndex: 999,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 20,
          padding: 20,
          zIndex: 1000,
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>
            {TT(i18n, t, "cart.added.title", {
              sv: "Tillagd i korgen",
              en: "Added to cart",
              tr: "Sepete eklendi",
            })}
          </div>

          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {TT(i18n, t, "cart.added.subtitle", {
              sv: "Din produkt är redo",
              en: "Your product is ready",
              tr: "Ürün hazır",
            })}
          </div>
        </div>

        {/* Product */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <img
            src={image}
            alt=""
            style={{
              width: 64,
              height: 64,
              objectFit: "cover",
              borderRadius: 12,
            }}
          />

          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        </div>

        {/* Celeste vibe */}
        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            opacity: 0.8,
            fontStyle: "italic",
          }}
        >
          {TT(i18n, t, "cart.added.celeste", {
            sv: "Ett steg närmare något större.",
            en: "One step closer to something greater.",
            tr: "Daha büyük bir şeye bir adım daha.",
          })}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 999,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {TT(i18n, t, "cart.added.continue", {
              sv: "Fortsätt handla",
              en: "Continue shopping",
              tr: "Alışverişe devam et",
            })}
          </button>

          <button
            onClick={() => navigate("/cart")}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 999,
              border: "none",
              background: "#0f172a",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {TT(i18n, t, "cart.added.gotoCart", {
              sv: "Gå till korg",
              en: "Go to cart",
              tr: "Sepete git",
            })}
          </button>
        </div>
      </div>
    </>
  );
}