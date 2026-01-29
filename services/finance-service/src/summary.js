// services/finance-service/src/summary.js

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function money(n) {
  return Math.round(Number(n || 0));
}

/**
 * Bygg en “går butiken runt?”-summary.
 * mode:
 *  - "test" => deterministiska testsiffror
 *  - "live" => senare kopplar vi Stripe/orders/bokföring (nu returnerar vi fortfarande test)
 */
export async function buildFinanceSummary({ mode = "test", range = "day", currency = "sek" } = {}) {
  const now = Date.now();

  // Bas: testdata som känns “verklig” men är stabil i dev
  // (vi kan senare byta till riktiga orders + payouts utan att ändra UI)
  const seed = (range + currency).length * 1337;
  const grossSales = 74230 + (seed % 9000);                 // bruttoomsättning
  const refunds = 1200 + (seed % 400);                      // returer/chargebacks
  const shippingCharged = 3900 + (seed % 600);              // frakt intäkt
  const productCosts = 0.38 * grossSales;                   // COGS (POD)
  const platformFees = 0.029 * grossSales + 180;            // Stripe-ish
  const marketing = 0.10 * grossSales;                      // ads/affiliates
  const fixedMonthly = 19000;                               // SaaS + domäner + drift etc (placeholder)

  const netRevenue = grossSales - refunds;
  const variableCosts = productCosts + platformFees + marketing;
  const grossProfit = netRevenue - variableCosts;

  // “Break-even meter” — visar om du täcker fixed cost (normaliserat per range)
  const fixedForRange =
    range === "day" ? fixedMonthly / 30 :
    range === "week" ? fixedMonthly / 4.3 :
    range === "month" ? fixedMonthly :
    fixedMonthly / 30;

  const operatingProfit = grossProfit - fixedForRange;
  const breakEvenProgress = clamp((grossProfit / fixedForRange) * 100, 0, 160);

  return {
    mode,
    range,
    currency,
    ts: now,

    kpis: {
      grossSales: money(grossSales),
      refunds: money(refunds),
      netRevenue: money(netRevenue),
      productCosts: money(productCosts),
      platformFees: money(platformFees),
      marketing: money(marketing),
      grossProfit: money(grossProfit),
      fixedCosts: money(fixedForRange),
      operatingProfit: money(operatingProfit),
    },

    health: {
      breakEvenProgressPct: Math.round(breakEvenProgress),
      isProfitable: operatingProfit > 0,
    },

    notes: [
      "DEV: Detta är testdata (stabil).",
      "Nästa steg: koppla orders → finance-service och byt mode=live.",
    ],
  };
}
