// D:\WebProjects\Calestra\apps\store-classic\src\components\CartDrawer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { convertBasePrice, applyPsychological, formatMoney } from "../utils/money.js";
import FreeShippingMeter from "./FreeShippingMeter.jsx";

export default function CartDrawer({ open, onClose }) {
  const { items, remove, subtotalSEK } = useCart();
  const { currency, rates, locale } = useCurrency();

  const fmt = (sek) => {
    const v = applyPsychological(convertBasePrice(Number(sek || 0), currency, rates), currency);
    return formatMoney(v, currency, locale);
  };

  return (
    <div
      aria-hidden={!open}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: open ? "auto" : "none",
        zIndex: 60,
      }}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          transition: "opacity .15s ease",
        }}
      />

      {/* panel */}
      <aside
        role="dialog"
        aria-label="Kundvagn"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 360,
          maxWidth: "92vw",
          background: "#121419",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          transform: open ? "translateX(0)" : "translateX(110%)",
          transition: "transform .2s ease",
          display: "flex",
          flexDirection: "column",
          color: "#e8eaee",
        }}
      >
        <header
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <strong>Kundvagn</strong>
          <button
            onClick={onClose}
            aria-label="Stäng"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "transparent",
              color: "#e8eaee",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: "36px",
            }}
          >
            ×
          </button>
        </header>

        <div style={{ padding: "10px 12px" }}>
          <FreeShippingMeter />
        </div>

        <div style={{ flex: "1 1 auto", overflow: "auto", padding: "0 12px 10px" }}>
          {items.length === 0 ? (
            <p style={{ color: "#aab0bb", padding: "8px 2px" }}>Din kundvagn är tom.</p>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <img
                  alt={it.title}
                  src={it.image || "/images/no-image.png"}
                  style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10 }}
                />

                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#e8eaee", fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {it.title}
                  </div>
                  <div style={{ color: "#9aa2ad", fontSize: 12, marginTop: 4 }}>
                    x{it.qty}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900 }}>{fmt(Number(it.price || 0) * Number(it.qty || 0))}</div>
                  <button
                    onClick={() => remove(it.id)}
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#9bb4ff",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Ta bort
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <footer style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#9aa2ad" }}>Summa</span>
            <strong>{fmt(subtotalSEK)}</strong>
          </div>

          <Link
            to="/checkout"
            onClick={onClose}
            style={{
              display: "inline-flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#2b2f38",
              color: "#e8eaee",
              cursor: "pointer",
              textDecoration: "none",
              fontWeight: 900,
            }}
          >
            Gå till kassan
          </Link>
        </footer>
      </aside>
    </div>
  );
}
