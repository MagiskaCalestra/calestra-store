// apps/web/src/core/DiningContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";

const DiningContext = createContext(null);
export const useDining = () => useContext(DiningContext);

const defaultFilters = {
  acceptsReservations: true,
  types: new Set(),          // "Table Service" | "Quick Service" | "Character" | "Signature"
  areas: new Set(),          // "Magic Kingdom" | "EPCOT" | ...
  price: new Set(),          // "$"|"$$"|"$$$"|"$$$$"
  plan: new Set(),           // "Dining Plan"|"Quick-Service Plan"
};

export function DiningProvider({ children }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [range, setRange]   = useState({ start: null, end: null }); // Date objects
  const [party, setParty]   = useState({ adults: 2, children: 0, accessible: false });
  const value = useMemo(() => ({
    filters, setFilters, range, setRange, party, setParty
  }), [filters, range, party]);

  return <DiningContext.Provider value={value}>{children}</DiningContext.Provider>;
}
