// Minimal publish/subscribe för hela portalen.
// Kan senare bytas mot t.ex. Redux, XState eller server-sent events.

const listeners = new Map(); // type -> Set<fn>

export function on(eventType, fn) {
  if (!listeners.has(eventType)) listeners.set(eventType, new Set());
  listeners.get(eventType).add(fn);
  return () => off(eventType, fn);
}
export function off(eventType, fn) {
  const set = listeners.get(eventType);
  if (set) set.delete(fn);
}
export function emit(eventType, payload) {
  const set = listeners.get(eventType);
  if (set) for (const fn of set) { try { fn(payload); } catch(e){ console.warn("event handler", e); } }
}

// Välkända events
export const EVENTS = {
  JOB_TICK: "job:tick",
  INGEST_IMPORTED: "ingest:imported",
  PAYOUTS_BUILT: "payouts:built",
  SETTINGS_CHANGED: "settings:changed",
};
