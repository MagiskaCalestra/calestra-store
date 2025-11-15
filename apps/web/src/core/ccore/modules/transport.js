// apps/web/src/core/ccore/modules/transport.js
// C-Transportâ„¢ â€“ skelett för framtida intern bokning (operator-läge)
import { emit } from "../eventBus";
import { getPolicy, AffiliatePolicy } from "./affiliates";

export function mode() { return getPolicy() === AffiliatePolicy.OPERATOR ? "operator" : "affiliate"; }

// Mock-API (disabled i affiliate-läge)
export function listTransfers(query = {}) {
  ensureOperator();
  // TODO: hämta från backend/API. Mock retur:
  return [{ id: "tr_airport_01", name: "C-Shuttle Airport Express", price: 149, currency: "SEK", when: "Var 30:e min" }];
}
export function createTransferBooking({ productId, date, pax }) {
  ensureOperator();
  const booking = {
    id: "ctr_" + Math.random().toString(36).slice(2,10),
    productId, date, pax,
    status: "HELD",
    createdAt: new Date().toISOString()
  };
  emit("transport.booking.held", { booking });
  return booking;
}

function ensureOperator() {
  if (getPolicy() !== AffiliatePolicy.OPERATOR) {
    throw new Error("Transportbokning är endast tillgänglig i operatörsläge.");
  }
}
