// D:\WebProjects\Calestra\apps\store-classic\src\components\FreeShippingMeter.jsx
import React, { useMemo } from "react";
import { useCart } from "../context/CartContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { convertBasePrice, applyPsychological, formatMoney } from "../utils/money.js";

export default function FreeShippingMeter() {
  const { shippingEligibleSEK } = useCart();
  const { currency, rates, locale } = useCurrency();

  const thresholdSEK = useMemo(() => {
    const env = Number(import.meta?.env?.VITE_FREE_SHIP_SEK);
    return Number.isFinite(env) && env > 0 ? env : 500;
  }, []);

  const pct = useMemo(() => {
    const n = Number(shippingEligibleSEK || 0);
    return Math.min(100, Math.round((n / thresholdSEK) * 100));
  }, [shippingEligibleSEK, thresholdSEK]);

  const leftSEK = Math.max(0, thresholdSEK - Number(shippingEligibleSEK || 0));

  const fmt = (sek) => {
    const v = applyPsychological(convertBasePrice(Number(sek || 0), currency, rates), currency);
    return formatMoney(v, currency, locale);
  };

  return (
    <div style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <strong style={{ fontSize: 12 }}>Fri frakt</strong>
        <span style={{ fontSize: 12, color: "rgba(232,234,238,.75)" }}>{pct}%</span>
      </div>

      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "rgba(155,180,255,0.9)" }} />
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(232,234,238,.78)" }}>
        {leftSEK > 0 ? (
          <>Lägg till <strong style={{ color: "#e8eaee" }}>{fmt(leftSEK)}</strong> för fri frakt.</>
        ) : (
          <><strong style={{ color: "#e8eaee" }}>Grattis!</strong> Du har fri frakt.</>
        )}
      </div>
    </div>
  );
}
