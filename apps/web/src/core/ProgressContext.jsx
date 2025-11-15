// Calestra â€” ProgressContext (global aggregerad progress för alla motorer)
// API:
//   const { total, sources, report, reset } = useProgress();
//   report("store", { delta: 0.02 });      // +2%
//   report("world3d", { set: 0.34 });      // sätt absolut 34%
// Persistens: localStorage("cw_progress_sources").
// Sammanräkning: medelvärde över alla källor (kan bytas till viktat senare).

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "cw_progress_sources";

const ProgressCtx = createContext(null);

export function ProgressProvider({ children }) {
  const [sources, setSources] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  }, [sources]);

  const report = (source, change) => {
    setSources(prev => {
      const cur = prev[source] ?? 0;
      let next = cur;
      if (typeof change?.set === "number") next = change.set;
      if (typeof change?.delta === "number") next = cur + change.delta;
      next = Math.max(0, Math.min(1, next));
      return { ...prev, [source]: next };
    });
  };

  const reset = (source) => {
    setSources(prev => {
      if (!source) return {};
      const copy = { ...prev };
      delete copy[source];
      return copy;
    });
  };

  // Lyssna på externa events (andra appar kan skicka CustomEvent)
  // window.dispatchEvent(new CustomEvent("cw:progress", { detail:{ source:"store", delta:0.01 }}))
  useEffect(() => {
    const onEvt = (e) => {
      const { source, set, delta } = e.detail || {};
      if (!source) return;
      report(source, { set, delta });
    };
    window.addEventListener("cw:progress", onEvt);
    return () => window.removeEventListener("cw:progress", onEvt);
  }, []);

  const total = useMemo(() => {
    const vals = Object.values(sources);
    if (!vals.length) return 0;
    const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
    return Math.max(0, Math.min(1, avg));
  }, [sources]);

  const value = useMemo(() => ({ total, sources, report, reset }), [total, sources]);

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

export function useProgress(){ return useContext(ProgressCtx); }
