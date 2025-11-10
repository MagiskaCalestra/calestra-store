// C-Wish – mock för armband/app-nyckel. Aktivering + status lokalt.
import { emit } from "../eventBus";
const LS_WISH = "ccore_wish_band";

export function activateBand({ bandId, holderName }) {
  const state = { id: bandId, holderName, status: "ACTIVE", activatedAt: Date.now() };
  localStorage.setItem(LS_WISH, JSON.stringify(state));
  emit("wish.band.activated", { band: state });
  return state;
}

export function getBand() {
  const raw = localStorage.getItem(LS_WISH);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function deactivateBand() {
  const band = getBand();
  localStorage.removeItem(LS_WISH);
  emit("wish.band.deactivated", { band });
}
