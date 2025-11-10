// Mock + förberett för Impact API
export async function fetchImpactSales({ campaignIds = [] } = {}) {
  const hasKeys = !!import.meta.env.VITE_IMPACT_KEY;
  if (!hasKeys) {
    return [
      { id: "im-1", network: "impact", ref: "ref123", amount: 39, currency: "USD", status: "approved", ts: Date.now()-7200000 },
    ];
  }
  // TODO: implementera riktig fetch mot Impact
  return [];
}
