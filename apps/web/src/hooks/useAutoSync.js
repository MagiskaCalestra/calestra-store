// Liten, robust autosync-hook. Körs även i bakgrunden när tabben är aktiv.
import { useEffect, useRef } from "react";

/**
 * useAutoSync(fn, intervalMs)
 * - Kör fn() on-mount och sedan var intervalMs millisekund (default 5 min).
 * - Pausar när dokument inte är synligt (spar CPU).
 */
export default function useAutoSync(fn = () => {}, intervalMs = 5 * 60 * 1000) {
  const timer = useRef(null);

  useEffect(() => {
    let canceled = false;

    async function run() {
      try {
        await fn();
      } catch (e) {
        // svälj fel â€“ autosync ska inte krascha appen
        console.warn("[useAutoSync] sync error:", e?.message || e);
      }
    }

    function start() {
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => {
        if (document.visibilityState === "visible") run();
      }, intervalMs);
    }

    // första körningen
    run();
    start();

    // pausa/återstarta på visibility change
    const onVis = () => {
      if (!canceled && document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      canceled = true;
      document.removeEventListener("visibilitychange", onVis);
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
