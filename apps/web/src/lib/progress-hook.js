// apps/web/src/lib/progress-hook.js
import core from "@core/api/index.js";

export function useKpiProgress(pollMs = 15000) {
  const { api, endpoints } = core;
  let ctrl;

  const state = {
    percent: 0,
    total: 0,
    goal: 0,
    bySource: {},
    loading: true,
    error: null,
    stop: () => ctrl?.abort?.(),
  };

  async function load() {
    try {
      state.loading = true;
      ctrl = new AbortController();
      const data = await api(endpoints.progressSummary(), { signal: ctrl.signal });
      // förväntad form från Infinity:
      // { ok:true, summary:{ totals:number, goal?:number, bySource:{...} } }
      const total = Number(data?.summary?.totals ?? 0);
      const goal  = Number(data?.summary?.goal ?? 100000); // fallback
      const pct   = Math.max(0, Math.min(100, Math.round((total / (goal || 1)) * 100)));

      state.total = total;
      state.goal = goal;
      state.bySource = data?.summary?.bySource ?? {};
      state.percent = pct;
      state.error = null;
    } catch (e) {
      state.error = String(e?.message || e);
    } finally {
      state.loading = false;
    }
  }

  // enkel poller (utan React – kan anropas från useEffect)
  function start(onTick) {
    let t;
    const tick = async () => {
      await load();
      onTick?.(state);
      t = setTimeout(tick, pollMs);
    };
    tick();
    return () => { clearTimeout(t); state.stop(); };
  }

  return { state, load, start };
}
