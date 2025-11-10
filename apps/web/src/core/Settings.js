const KEY = "cw.settings.v1";
const DEFAULTS = {
  outboundShare: 0.20,     // andel för outbound-intäkter
  autosyncMinutes: 5,      // autosync-intervall
  adminEnabled: true,      // möjlighet att visa /admin
};

function read() { try { return JSON.parse(localStorage.getItem(KEY)) || DEFAULTS; } catch { return DEFAULTS; } }
function write(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }

export function getSettings(){ return read(); }
export function setSettings(patch){
  const next = { ...read(), ...(patch||{}) };
  write(next);
  // signalera ut att settings ändrats (om vi vill lyssna)
  try { const { emit, EVENTS } = require("./EventBus"); emit?.(EVENTS.SETTINGS_CHANGED, next); } catch {}
  return next;
}
