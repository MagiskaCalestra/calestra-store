import { fetchAwinSales } from "./providers/awin";
import { fetchImpactSales } from "./providers/impact";
import { KV } from "@core/Storage";

/**
 * Hämtar externa försäljningar från nätverk, normaliserar och sparar
 * KEY: 'c-core.sales'   â†’ [{id, network, ref, amount, currency, status, ts}]
 */
const SALES_KEY = "c-core.sales";

export async function syncExternalSales() {
  const [awin, impact] = await Promise.all([
    fetchAwinSales({ programIds: (import.meta.env.VITE_AWIN_PROGRAM_IDS || "").split(",").filter(Boolean) }),
    fetchImpactSales({ campaignIds: (import.meta.env.VITE_IMPACT_CAMPAIGN_IDS || "").split(",").filter(Boolean) })
  ]);

  const existing = KV.get(SALES_KEY, []);
  // dedupe by id
  const byId = new Map(existing.map(s => [s.id, s]));
  [...awin, ...impact].forEach(s => byId.set(s.id, s));
  const merged = [...byId.values()].sort((a,b) => b.ts - a.ts);

  KV.set(SALES_KEY, merged);
  return merged;
}

export function getSales() {
  return KV.get(SALES_KEY, []);
}
