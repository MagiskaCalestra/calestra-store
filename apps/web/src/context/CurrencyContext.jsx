import React, { createContext, useContext, useMemo, useState } from "react";

const CurrencyCtx = createContext({ ccy: "SEK", setCcy: () => {} });

export function CurrencyProvider({ children }) {
  const [ccy, setCcyState] = useState(() => {
    try { return localStorage.getItem("ccy") || "SEK"; } catch { return "SEK"; }
  });

  const setCcy = (next) => {
    try { localStorage.setItem("ccy", next); } catch {}
    setCcyState(next);
  };

  const value = useMemo(() => ({ ccy, setCcy }), [ccy]);
  return <CurrencyCtx.Provider value={value}>{children}</CurrencyCtx.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyCtx);
}
