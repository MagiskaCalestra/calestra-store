import { parseCSV, mapRows } from "@core/ingest/normalize";

export async function ingestAdtraction(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Adtraction fetch failed");
  const text = await res.text();
  const parsed = parseCSV(text);
  const rows = mapRows(parsed, {
    ts: ["date", "transactiondate"],
    ref: ["clickid", "ref"],
    amount: ["commission", "amount"],
    currency: ["currency"],
    status: ["status"]
  }, "outbound", "Adtraction");
  return rows;
}
