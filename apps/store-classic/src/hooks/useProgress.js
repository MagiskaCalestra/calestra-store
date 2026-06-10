// D:\WebProjects\Calestra\apps\store-classic\src\hooks\useProgress.js
import { useEffect, useMemo, useState } from "react";
import {
  PROGRESS_REFRESH_EVENT,
  getFallbackProgressSnapshot,
  readProgressSnapshotSafe,
} from "../core/progressEngine.js";

export default function useProgress({ refreshMs = 60000 } = {}) {
  const [snap, setSnap] = useState(() => ({
    ...getFallbackProgressSnapshot(),
    loading: true,
  }));

  useEffect(() => {
    let alive = true;

    async function load() {
      const next = await readProgressSnapshotSafe();
      if (!alive) return;
      setSnap((prev) => ({
        ...prev,
        ...next,
        loading: false,
      }));
    }

    function onFocus() {
      load();
    }

    function onRefreshEvent() {
      load();
    }

    load();

    const intervalId =
      refreshMs > 0
        ? window.setInterval(() => {
            if (document.visibilityState === "visible") {
              load();
            }
          }, refreshMs)
        : 0;

    window.addEventListener("focus", onFocus);
    window.addEventListener(PROGRESS_REFRESH_EVENT, onRefreshEvent);

    return () => {
      alive = false;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(PROGRESS_REFRESH_EVENT, onRefreshEvent);
    };
  }, [refreshMs]);

  return useMemo(
    () => ({
      loading: !!snap.loading,
      ok: snap.ok !== false,
      error: snap.error || "",
      percent: Number(snap.percent || 0),
      totalSEK: Number(snap.totalSEK || 0),
      goalSEK: Number(snap.goalSEK || 0),
      supporters: Number(snap.supporters || 0),
      updatedAt: snap.updatedAt || "",
      channel: snap.channel || "store",
      source: snap.source || "progress_api",
      milestones: Array.isArray(snap.milestones) ? snap.milestones : [],
      raw: snap.raw || null,
    }),
    [snap]
  );
}