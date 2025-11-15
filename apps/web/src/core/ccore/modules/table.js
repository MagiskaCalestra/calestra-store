// C-Table (TableMagic) â€“ mock API som vi byter till real senare.
import { emit } from "../eventBus";
const LS_TABLE = "ccore_table_res";

export function holdReservation({ venueId, date, time, partySize }) {
  const res = {
    id: `c_table_hold_${Math.random().toString(36).slice(2,8)}`,
    venueId, date, time, partySize,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min hold
  };
  localStorage.setItem(LS_TABLE, JSON.stringify(res));
  emit("table.reservation.held", { reservation: res });
  return res;
}

export function getHold() {
  const raw = localStorage.getItem(LS_TABLE);
  if (!raw) return null;
  try {
    const r = JSON.parse(raw);
    if (Date.now() > r.expiresAt) { localStorage.removeItem(LS_TABLE); return null; }
    return r;
  } catch { return null; }
}

export function clearHold() {
  localStorage.removeItem(LS_TABLE);
  emit("table.reservation.cleared", {});
}
