// Bygger en enkel utbetalningskö från snapshot (approved → earningsSek)
import { getSnapshot } from "./C-Core";

export function buildPayoutQueue({ bankDirectory = {} } = {}) {
  const snap = getSnapshot();
  const rows = snap.earnings.rows.filter(r => r.earningsSek > 0);
  return rows.map(r => {
    const bank = bankDirectory[r.ref] || {};
    return {
      ref: r.ref,
      name: bank.name || "",
      email: bank.email || "",
      iban: bank.iban || "",
      swift: bank.swift || "",
      swish: bank.swish || "",
      amountSek: r.earningsSek,
    };
  });
}

export function payoutQueueToCSV(queue) {
  const header = ["ref","name","email","iban","swift","swish","amount_sek"];
  const lines = [header.join(",")];
  for (const q of queue) {
    lines.push([
      q.ref, q.name, q.email, q.iban, q.swift, q.swish, q.amountSek
    ].map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(","));
  }
  return lines.join("\n");
}
