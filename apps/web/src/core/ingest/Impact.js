import { parseCSV, mapRows } from "@core/ingest/normalize";

export async function ingestImpact(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Impact fetch failed");
  const text = await res.text();
  const parsed = parseCSV(text);
  const rows = mapRows(parsed, {
    ts: ["event date", "created at"],
    ref: ["sub id", "partner sub id", "sid"],
    amount: ["amount", "payout"],
    currency: ["currency"],
    status: ["state", "status"]
  }, "outbound", "Impact");
  return rows;
}
