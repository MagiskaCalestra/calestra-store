// Calestra â€” CompatProgressProvider
// Använder din central (via ccore-bridge) om den finns.
// Fallback: localStorage + intern summering, så dev/offline funkar likadant.

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Bus, Topics } from "./ccore-bridge";

const STORAGE_KEY = "cw_progress_sources";
const Ctx = createContext(null);

export function CompatProgressProvider({ children }) {
  const [sources, setSources] = useState(() => {
    // fallback-läsning
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  });

  // Prenumerera på centrala snapshots â†’ skriv in i state (oavsett buss)
  useEffect(() => {
    const unsub = Bus.subscribe(Topics.PROGRESS_SNAPSHOT, (payload) => {
      if (payload && payload.sources && typeof payload.sources === "object") {
        setSources(payload.sources);
      }
    });
    return () => unsub && unsub();
  }, []);

  // Spara fallback-läge
  useEffect(() => {
    if (Bus.name === "fallback") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
    }
  }, [sources]);

  // Publicera varje UI-rapport till central buss OCKSÅ uppdatera fallback direkt
  function report(source, change) {
    // 1) skicka till central
    Bus.publish(Topics.PROGRESS_UPDATE, { source, ...change });
    // 2) fallback uppdatering lokalt (om ingen central finns)
    if (Bus.name === "fallback") {
      setSources(prev => {
        const cur = prev[source] ?? 0;
        let next = cur;
        if (typeof change?.set === "number") next = change.set;
        if (typeof change?.delta === "number") next = cur + change.delta;
        next = Math.max(0, Math.min(1, next));
        return { ...prev, [source]: next };
      });
    }
  }

  const total = useMemo(() => {
    const vals = Object.values(sources);
    if (!vals.length) return 0;
    return Math.max(0, Math.min(1, vals.reduce((a,b)=>a+b,0) / vals.length));
  }, [sources]);

  const value = useMemo(() => ({ total, sources, report }), [total, sources]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompatProgress(){ return useContext(Ctx); }
