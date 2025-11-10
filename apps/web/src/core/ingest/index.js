import { ingestAwin } from "@core/ingest/Awin";
import { ingestCJ } from "@core/ingest/CJ";
import { ingestImpact } from "@core/ingest/Impact";
import { ingestAdtraction } from "@core/ingest/Adtraction";

export const SOURCES = {
  Awin: ingestAwin,
  CJ: ingestCJ,
  Impact: ingestImpact,
  Adtraction: ingestAdtraction,
};

export async function runIngest(config) {
  // config: { Awin?:url, CJ?:url, ... }
  const allRows = [];
  for (const [name, fn] of Object.entries(SOURCES)) {
    const url = config?.[name];
    if (!url) continue;
    try {
      const rows = await fn(url);
      allRows.push(...rows);
    } catch (e) {
      console.warn("Ingest failed", name, e?.message || e);
    }
  }
  return allRows;
}
