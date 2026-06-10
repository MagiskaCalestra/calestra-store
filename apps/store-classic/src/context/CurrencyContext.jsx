// apps/store-classic/src/context/CurrencyContext.jsx
import React from "react";

const CurrencyContext = React.createContext(null);

const STORAGE_KEY = "cw.currency"; // "SEK" | "EUR" | "TRY" | "USD"

// Default rates (SEK-bas). Kan senare ersättas av API.
const DEFAULT_RATES = {
  SEK: 1,
  EUR: 0.089,
  USD: 0.095,
  TRY: 3.1,
};

function safeParseRatesFromEnv() {
  try {
    if (typeof import.meta === "undefined") return null;
    const raw = import.meta?.env?.VITE_CURRENCY_RATES_JSON;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function sanitizeCurrency(v) {
  const x = String(v || "SEK").toUpperCase();
  if (x === "SEK" || x === "EUR" || x === "USD" || x === "TRY") return x;
  return "SEK";
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = React.useState(() => {
    if (typeof window === "undefined") return "SEK";
    return sanitizeCurrency(window.localStorage.getItem(STORAGE_KEY) || "SEK");
  });

  const [locale] = React.useState(() => {
    if (typeof window === "undefined") return "sv-SE";
    return window.navigator?.language || "sv-SE";
  });

  const setCurrency = React.useCallback((next) => {
    const v = sanitizeCurrency(next);
    setCurrencyState(v);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, v);
  }, []);

  const rates = React.useMemo(() => {
    const envRates = safeParseRatesFromEnv();
    return { ...DEFAULT_RATES, ...(envRates || {}) };
  }, []);

  const value = React.useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      locale,
    }),
    [currency, setCurrency, rates, locale]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
