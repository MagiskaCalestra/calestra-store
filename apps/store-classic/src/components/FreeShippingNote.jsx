import React from "react";
import { useTranslation } from "react-i18next";
import {
  currentMarketCode,
  currencyForMarket,
  freeShippingThresholdForMarket,
  formatMoney,
  convert
} from "../utils/money";

export default function FreeShippingNote({ cartSubtotal = 0, currency = "SEK", locale }) {
  const { t } = useTranslation();
  const market = currentMarketCode();
  const marketCurrency = currencyForMarket(market);

  const thresholdMarket = freeShippingThresholdForMarket(market);
  const thresholdInView = convert(thresholdMarket, marketCurrency, currency);
  const remaining = Math.max(0, thresholdInView - (Number.isFinite(cartSubtotal) ? cartSubtotal : 0));

  if (remaining <= 0) {
    return <div className="note ok">{t("checkout.progress.free", "Du har fri frakt!")}</div>;
  }

  return (
    <div className="note">
      {t("checkout.progress.toFree", {
        amount: formatMoney(remaining, currency, locale)
      })}
      <style>{`
        .note { font-size: .95rem; opacity: .9; margin-top: 6px; }
        .ok { color: var(--green-700, #0a7f4f); }
      `}</style>
    </div>
  );
}
