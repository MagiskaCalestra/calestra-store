// Lättvikts-task runner. Registrera jobb med namn + fn + interval.
// Tål exceptions, kan pausas/resumas i framtiden.

const tasks = new Map();

export function registerTask(name, fn, intervalMs) {
  unregisterTask(name);
  const state = { name, fn, intervalMs, timer: null, lastRun: null, error: null };
  const safeRun = async () => {
    try {
      await fn();
      state.lastRun = new Date().toISOString();
      state.error = null;
    } catch (e) {
      state.error = String(e?.message || e);
      console.warn("task error", name, e);
    }
  };
  safeRun();
  state.timer = setInterval(safeRun, intervalMs);
  tasks.set(name, state);
  return () => unregisterTask(name);
}

export function unregisterTask(name) {
  const t = tasks.get(name);
  if (t?.timer) clearInterval(t.timer);
  tasks.delete(name);
}
export function listTasks() {
  return Array.from(tasks.values()).map(t => ({
    name: t.name, intervalMs: t.intervalMs, lastRun: t.lastRun, error: t.error
  }));
}
