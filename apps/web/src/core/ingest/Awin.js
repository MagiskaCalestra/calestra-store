import { parseCSV, mapRows } from "@core/ingest/normalize";

/**
 * Hämtar Awin-CSV (via tokeniserad URL) och normaliserar.
 * @param {string} url - Direktlänk till export (t.ex. scheduled report).
 */
export async function ingestAwin(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("AWIN fetch failed");
  const text = await res.text();
  const parsed = parseCSV(text);
  const rows = mapRows(parsed, {
    ts: ["date", "transaction date", "time"],
    ref: ["clickref", "ref", "subid"],
    amount: ["commission amount", "amount", "sale amount"],
    currency: ["currency"],
    status: ["status"]
  }, "outbound", "Awin");
  return rows;
}
