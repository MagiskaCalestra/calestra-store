// Orkestrerar nattlig sync och gör resultat lättåtkomliga
import { syncExternalSales, getSales } from "@core/affiliates/AffiliateNetworkAdapter";
import { computeEarnings } from "@core/RewardsEngine";
import { KV } from "@core/Storage";

const FX_KEY = "c-core.fx";
const SNAPSHOT_KEY = "c-core.snapshot"; // senaste körningen (sammanställning)

export async function runNightlySync() {
  // 1) Sync externa nätverk
  const sales = await syncExternalSales();

  // 2) FX (mock – kan bytas till riktig kurs via API)
  const fx = KV.get(FX_KEY, { USD_SEK: 10.5 });

  // 3) Räkna
  const earnings = computeEarnings({ sales, fx });

  // 4) Spara snapshot
  const snapshot = { ts: Date.now(), fx, salesCount: sales.length, earnings };
  KV.set(SNAPSHOT_KEY, snapshot);
  return snapshot;
}

export function getSnapshot() {
  return KV.get(SNAPSHOT_KEY, { ts: null, fx: { USD_SEK: 10.5 }, salesCount: 0, earnings: { rows: [], totals: { approvedSek: 0, pendingSek: 0, earningsSek: 0, countApproved: 0, countPending: 0 } } });
}

export function getLiveSales() { return getSales(); }
