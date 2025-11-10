// Mock + förberett för riktig Awin API
export async function fetchAwinSales({ programIds = [] } = {}) {
  const hasKeys = !!import.meta.env.VITE_AWIN_TOKEN;
  if (!hasKeys) {
    // mock: returnera några rader som om de kom från nätverket
    return [
      { id: "aw-1", network: "awin", ref: "ref123", amount: 1299, currency: "SEK", status: "approved", ts: Date.now()-86400000 },
      { id: "aw-2", network: "awin", ref: "refABC", amount: 499, currency: "SEK", status: "pending",  ts: Date.now()-3600000 }
    ];
  }
  // TODO: implementera riktig fetch med Awin-token + endpoint
  // return await realFetch();
  return [];
}
