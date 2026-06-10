import { useEffect, useMemo, useState } from "react";
import { CURRENCIES } from "../lib/currency";

export function useCurrency() {
  const [currency, setCurrency] = useState(
    localStorage.getItem("currency") || autoDetect()
  );

  function autoDetect() {
    // mycket förenklad IP/land-fallback: läs navigator.language
    const lang = (navigator.language || "sv-SE").toUpperCase();
    if (lang.includes("TR")) return "TRY";
    if (lang.includes("US")) return "USD";
    if (lang.includes("DE") || lang.includes("FR") || lang.includes("ES")) return "EUR";
    return "SEK";
  }

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  return {
    currency,
    setCurrency,
    currencies: Object.keys(CURRENCIES),
  };
}

export default function CurrencySelect({ value, onChange }) {
  const { currencies } = useCurrency();
  const list = useMemo(() => currencies, [currencies]);
  return (
    <select
      aria-label="Valuta"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ padding: 6, borderRadius: 8 }}
    >
      {list.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
