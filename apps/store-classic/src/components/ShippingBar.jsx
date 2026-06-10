// D:\WebProjects\Calestra\apps\store-classic\src\components\ShippingBar.jsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../context/CurrencyContext.jsx";

const FREE_SHIPPING_SEK = 1000;

export default function ShippingBar({ subtotalSEK = 0 }) {
  const { t } = useTranslation();
  const { currency, rates, locale } = useCurrency();

  // Konvertera mål till aktuell valuta
  const freeTarget = useMemo(() => {
    const rate = rates?.[currency] || 1;
    return FREE_SHIPPING_SEK * rate;
  }, [currency, rates]);

  // Kvar i SEK (logiskt korrekt)
  const leftSEK = Math.max(0, FREE_SHIPPING_SEK - subtotalSEK);

  // Progress %
  const pct = Math.min(
    100,
    Math.round((subtotalSEK / FREE_SHIPPING_SEK) * 100)
  );

  // Formattering
  const format = (amount) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);

  return (
    <div className="shipping-bar">
      <div className="shipping-track">
        <div
          className="shipping-progress"
          style={{ width: `${pct}%` }}
        />

        <div className="shipping-label">
          {t("shipping.freeAt", {
            defaultValue: "Fri frakt vid {{amount}}",
            amount: format(freeTarget),
          })}
        </div>
      </div>

      <div className="shipping-text">
        {leftSEK > 0
          ? t("shipping.left", {
              defaultValue: "Lägg till för {{amount}} för fri frakt.",
              amount: format(leftSEK * (rates?.[currency] || 1)),
            })
          : t("shipping.done", {
              defaultValue: "Grattis! Du har fri frakt.",
            })}
      </div>

      <style>{`
        .shipping-bar{
          margin:10px 0;
          padding:10px;
          border-radius:14px;
          background:#0f172a;
        }

        .shipping-track{
          position:relative;
          height:12px;
          border-radius:8px;
          background:#111;
          overflow:hidden;
        }

        .shipping-progress{
          height:100%;
          background:linear-gradient(90deg,#22c55e,#84cc16);
          transition:width .3s ease;
        }

        .shipping-label{
          position:absolute;
          left:50%;
          top:-18px;
          transform:translateX(-50%);
          font-size:11px;
          color:#fff;
          font-weight:700;
          white-space:nowrap;
        }

        .shipping-text{
          margin-top:6px;
          font-size:12px;
          color:#fff;
          font-weight:600;
        }

        .theme-dark .shipping-bar{
          background:#020617;
        }
      `}</style>
    </div>
  );
}