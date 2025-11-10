import { fromSEK, getRates } from "./rates.js";

export function computePnl({ subSEK, shipSEK, vatSEK, totalSEK, cogsPct = 0.35 }, currency = "SEK") {
  const rates = getRates();

  const revenueSEK = totalSEK;          // inkl. frakt
  const cogsSEK = subSEK * Number(cogsPct); // enkel tumregel v1
  const shippingCostSEK = shipSEK * 0.6;    // antag leverantörskostnad (kan bytas mot realdata)
  const grossProfitSEK = revenueSEK - cogsSEK - shippingCostSEK;
  const vatPayableSEK = vatSEK;

  return {
    currency,
    revenue: fromSEK(revenueSEK, currency, rates),
    cogs: fromSEK(cogsSEK, currency, rates),
    shippingCost: fromSEK(shippingCostSEK, currency, rates),
    grossProfit: fromSEK(grossProfitSEK, currency, rates),
    vatPayable: fromSEK(vatPayableSEK, currency, rates),
    assumptions: { cogsPct: Number(cogsPct), shippingCostFactor: 0.6 }
  };
}
