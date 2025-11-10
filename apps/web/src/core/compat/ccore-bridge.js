// Calestra — Bridge till c-core/nexus/infinity (eller fallback)
// Normaliserar publish/subscribe så UI inte bryr sig om vilken buss som finns.

const hasFn = (obj, fn) => obj && typeof obj[fn] === "function";

// Prioriteringsordning: CCore -> Nexus -> Infinity -> Fallback
function resolveBus() {
  const w = typeof window !== "undefined" ? window : {};

  // 1) c-core (exempel-API: CCore.subscribe(topic, cb), CCore.publish(topic, data))
  if (w.CCore && hasFn(w.CCore, "subscribe") && hasFn(w.CCore, "publish")) {
    return {
      name: "c-core",
      subscribe: (topic, cb) => w.CCore.subscribe(topic, cb),
      publish: (topic, data)   => w.CCore.publish(topic, data),
    };
  }

  // 2) nexus (ex: Nexus.on(topic, cb), Nexus.emit(topic, data))
  if (w.Nexus && hasFn(w.Nexus, "on") && hasFn(w.Nexus, "emit")) {
    return {
      name: "nexus",
      subscribe: (topic, cb) => w.Nexus.on(topic, cb),
      publish: (topic, data) => w.Nexus.emit(topic, data),
    };
  }

  // 3) infinity (ex: Infinity.bus.on / .emit)
  if (w.Infinity && w.Infinity.bus && hasFn(w.Infinity.bus, "on") && hasFn(w.Infinity.bus, "emit")) {
    return {
      name: "infinity",
      subscribe: (topic, cb) => w.Infinity.bus.on(topic, cb),
      publish: (topic, data) => w.Infinity.bus.emit(topic, data),
    };
  }

  // 4) Fallback (egen EventTarget)
  const et = new EventTarget();
  return {
    name: "fallback",
    subscribe: (topic, cb) => {
      const h = (e) => cb(e.detail);
      et.addEventListener(topic, h);
      return () => et.removeEventListener(topic, h);
    },
    publish: (topic, data) => et.dispatchEvent(new CustomEvent(topic, { detail: data })),
  };
}

export const Bus = resolveBus();

// Hjälpfunktioner för konsekventa ämnesnamn (topics)
export const Topics = {
  // UI → Central
  PROGRESS_UPDATE: "cw/progress/update",   // { source, set?, delta? } (0..1)
  // Central → UI (snapshot eller inkrementell)
  PROGRESS_SNAPSHOT: "cw/progress/snapshot", // { sources: { [source]: 0..1 }, total?: 0..1 }
};

// OBS: vi exponerar också en “window bridge” för äldre klienter som redan sänder CustomEvent.
if (typeof window !== "undefined") {
  window.addEventListener("cw:progress", (e) => {
    const { source, set, delta } = e.detail || {};
    if (!source) return;
    Bus.publish(Topics.PROGRESS_UPDATE, { source, set, delta });
  });
}
