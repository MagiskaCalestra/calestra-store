// Minimal event-bus (DOM-baserad CustomEvent) för modulkommunikation i webblagret.
const BUS_NAME = "ccore:event";

export function emit(eventName, detail = {}) {
  document.dispatchEvent(new CustomEvent(BUS_NAME, { detail: { eventName, ...detail } }));
}

export function on(eventName, handler) {
  const listener = (e) => {
    if (e?.detail?.eventName === eventName) handler(e.detail);
  };
  document.addEventListener(BUS_NAME, listener);
  return () => document.removeEventListener(BUS_NAME, listener);
}
