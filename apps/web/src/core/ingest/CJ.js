import { parseCSV, mapRows } from "@core/ingest/normalize";

export async function ingestCJ(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("CJ fetch failed");
  const text = await res.text();
  const parsed = parseCSV(text);
  const rows = mapRows(parsed, {
    ts: ["post date", "action date"],
    ref: ["sid", "sub id", "website id", "link id"],
    amount: ["commission amount", "sale amount"],
    currency: ["currency"],
    status: ["action status", "status"]
  }, "outbound", "CJ");
  return rows;
}
